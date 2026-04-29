"""
Processor — runs one AgentTask through the LangGraph agent and persists results.

Steps:
  1. Run the agent graph (load_context → classify → suggest → auto_reply)
  2. Persist classification to Conversation.tag
  3. Persist suggestions to AISuggestion table (replace old ones)
  4. Broadcast "ai_suggestions_ready" via WebSocket
  5. If auto_reply is set, send it via the channel
"""

import logging
from uuid import UUID

from src.shared.models import AgentTask

log = logging.getLogger(__name__)


async def process(task: AgentTask) -> None:
    """Process a single AgentTask end-to-end."""
    from app.core.database import SessionLocal
    from src.agents.loader import get_agent

    db = SessionLocal()
    try:
        agent = get_agent("assistant_omini")

        initial_state = {
            "conversation_id": task.conversation_id,
            "db": db,
            "raw_messages": [],
            "context_str": "",
            "was_summarized": False,
            "classification": "other",
            "suggestions": [],
            "auto_reply": None,
            "confidence": 0.0,
        }

        result = await agent.ainvoke(initial_state)

        await _persist_results(db, task, result)

    except Exception as exc:
        log.error("processor.process error [conv=%s]: %s", task.conversation_id, exc)
    finally:
        db.close()


async def _persist_results(db, task: AgentTask, result: dict) -> None:
    """Save classification + suggestions, then broadcast WebSocket event."""
    from app.models.models import (
        Conversation, AISuggestion, ConversationTag
    )
    from app.core.websocket import manager

    # ── Update conversation tag (classification) ─────────────────────────────
    classification = result.get("classification", "other")
    tag_map = {
        "support":  ConversationTag.SUPPORT,
        "billing":  ConversationTag.BILLING,
        "feedback": ConversationTag.FEEDBACK,
    }
    if classification in tag_map:
        conv = db.query(Conversation).filter(
            Conversation.id == UUID(task.conversation_id)
        ).first()
        if conv:
            conv.tag = tag_map[classification]
            db.commit()

    # ── Replace AI suggestions ────────────────────────────────────────────────
    suggestions = result.get("suggestions", [])
    if suggestions:
        db.query(AISuggestion).filter(
            AISuggestion.conversation_id == UUID(task.conversation_id)
        ).delete()
        for content in suggestions:
            db.add(AISuggestion(
                conversation_id=UUID(task.conversation_id),
                content=str(content),
            ))
        db.commit()

    # ── Broadcast WebSocket event ─────────────────────────────────────────────
    await manager.broadcast_to_conversation(
        conversation_id=task.conversation_id,
        event_type="ai_suggestions_ready",
        data={
            "conversation_id": task.conversation_id,
            "suggestions": suggestions,
            "classification": classification,
        },
    )

    # ── Auto-reply via channel ────────────────────────────────────────────────
    auto_reply = result.get("auto_reply")
    if auto_reply:
        await _send_auto_reply(db, task, auto_reply)

    log.info(
        "Processed [conv=%s] class=%s suggestions=%d auto_reply=%s",
        task.conversation_id, classification, len(suggestions), bool(auto_reply)
    )


async def _send_auto_reply(db, task: AgentTask, reply: str) -> None:
    """Send an automatic reply to the channel via MessageService."""
    from app.models.models import Conversation
    from app.services.message_service import MessageService

    conv = db.query(Conversation).filter(
        Conversation.id == UUID(task.conversation_id)
    ).first()
    if not conv:
        return

    try:
        svc = MessageService(db)
        await svc.send_from_dashboard(
            conversation=conv,
            content=reply,
            idempotency_key=f"auto-reply:{task.message_id}",
        )
        log.info("Auto-reply sent [conv=%s]", task.conversation_id)
    except Exception as exc:
        log.error("Auto-reply failed [conv=%s]: %s", task.conversation_id, exc)
