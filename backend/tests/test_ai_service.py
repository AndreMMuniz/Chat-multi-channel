"""
Tests for AIService — LLM mocked via _get_llm(), DB uses conftest SQLite.

AIService.generate() uses LangGraph StateGraph with a local call_llm node
that calls llm.ainvoke(). Patching _get_llm() to return an AsyncMock LLM
lets us control the response without hitting the real OpenAI/OpenRouter API.
"""

import json
import pytest
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.ai_service import AIService
from app.models.models import (
    AISuggestion, Conversation, Contact, Message, ChannelType,
)


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def conversation(db):
    """Minimal Conversation with 3 messages for context building."""
    contact = Contact(
        channel_identifier="@customer",
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)

    conv = Conversation(
        contact_id=contact.id,
        channel=ChannelType.TELEGRAM,
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)

    for i in range(3):
        msg = Message(
            conversation_id=conv.id,
            content=f"Message {i}",
            inbound=(i % 2 == 0),
            conversation_sequence=i + 1,
        )
        db.add(msg)
    db.commit()
    return conv


def _mock_llm(content: str) -> AsyncMock:
    """Return a mock LLM whose ainvoke returns a response with the given content."""
    mock_response = MagicMock()
    mock_response.content = content
    mock = AsyncMock()
    mock.ainvoke = AsyncMock(return_value=mock_response)
    return mock


# ── get_cached ────────────────────────────────────────────────────────────────

class TestGetCached:
    def test_returns_empty_when_no_suggestions(self, db, conversation):
        svc = AIService(db)
        result = svc.get_cached(conversation.id)
        assert result == []

    def test_returns_stored_suggestion_content(self, db, conversation):
        sugg = AISuggestion(
            conversation_id=conversation.id,
            content="How can I help you?",
        )
        db.add(sugg)
        db.commit()

        result = AIService(db).get_cached(conversation.id)
        assert len(result) == 1
        assert result[0] == "How can I help you?"

    def test_returns_all_stored_suggestions(self, db, conversation):
        for content in ["A", "B", "C"]:
            db.add(AISuggestion(conversation_id=conversation.id, content=content))
        db.commit()

        result = AIService(db).get_cached(conversation.id)
        assert len(result) == 3


# ── generate ──────────────────────────────────────────────────────────────────

class TestGenerate:
    @pytest.mark.asyncio
    async def test_generate_returns_suggestions_list(self, db, conversation):
        payload = json.dumps(["How can I help?", "Let me check.", "I will resolve this."])
        with patch.object(AIService, "_get_llm", return_value=_mock_llm(payload)):
            result = await AIService(db).generate(conversation.id)

        assert isinstance(result, list)
        assert len(result) == 3
        assert "How can I help?" in result

    @pytest.mark.asyncio
    async def test_generate_persists_suggestions_to_db(self, db, conversation):
        payload = json.dumps(["X", "Y", "Z"])
        with patch.object(AIService, "_get_llm", return_value=_mock_llm(payload)):
            await AIService(db).generate(conversation.id)

        stored = db.query(AISuggestion).filter_by(conversation_id=conversation.id).all()
        assert len(stored) == 3

    @pytest.mark.asyncio
    async def test_generate_replaces_old_suggestions(self, db, conversation):
        """Second generate() call replaces, not accumulates, suggestions."""
        db.add(AISuggestion(conversation_id=conversation.id, content="Old"))
        db.commit()

        payload = json.dumps(["New 1", "New 2", "New 3"])
        with patch.object(AIService, "_get_llm", return_value=_mock_llm(payload)):
            await AIService(db).generate(conversation.id)

        stored = db.query(AISuggestion).filter_by(conversation_id=conversation.id).all()
        assert len(stored) == 3
        assert all(s.content.startswith("New") for s in stored)

    @pytest.mark.asyncio
    async def test_generate_handles_invalid_json_gracefully(self, db, conversation):
        """If LLM returns non-JSON, generate() returns [] without crashing."""
        with patch.object(AIService, "_get_llm", return_value=_mock_llm("not json at all")):
            result = await AIService(db).generate(conversation.id)

        assert result == []

    @pytest.mark.asyncio
    async def test_generate_handles_markdown_wrapped_json(self, db, conversation):
        """LLM sometimes wraps JSON in ```json ... ``` — must be stripped."""
        raw = '```json\n["A", "B", "C"]\n```'
        with patch.object(AIService, "_get_llm", return_value=_mock_llm(raw)):
            result = await AIService(db).generate(conversation.id)

        assert len(result) == 3

    @pytest.mark.asyncio
    async def test_generate_no_suggestions_returns_empty(self, db, conversation):
        """If LLM errors internally, generate() returns []."""
        mock_llm = AsyncMock()
        mock_llm.ainvoke = AsyncMock(side_effect=Exception("LLM unavailable"))
        with patch.object(AIService, "_get_llm", return_value=mock_llm):
            result = await AIService(db).generate(conversation.id)

        assert result == []


# ── _build_context ────────────────────────────────────────────────────────────

class TestBuildContext:
    def test_builds_context_from_messages(self, db, conversation):
        svc = AIService(db)
        ctx = svc._build_context(conversation.id)
        assert "Message 0" in ctx or "Customer:" in ctx or "Agent:" in ctx

    def test_empty_conversation_returns_placeholder(self, db):
        contact = Contact(channel_identifier="x")
        db.add(contact)
        db.commit()
        db.refresh(contact)
        conv = Conversation(contact_id=contact.id, channel=ChannelType.TELEGRAM)
        db.add(conv)
        db.commit()
        db.refresh(conv)

        svc = AIService(db)
        ctx = svc._build_context(conv.id)
        assert ctx == "(no messages yet)"
