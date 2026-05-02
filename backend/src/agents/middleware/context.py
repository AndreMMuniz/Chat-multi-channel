"""Load conversation context from DB for the agent."""

from typing import List
from uuid import UUID
from sqlalchemy.orm import Session

from src.shared.config import get_settings


def load_context(conversation_id: str, db: Session) -> List[dict]:
    """
    Return the last N messages for a conversation as a list of dicts:
    [{"role": "user"|"assistant", "content": "..."}]
    """
    from app.models.models import Message

    cfg = get_settings()
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == UUID(conversation_id))
        .order_by(Message.conversation_sequence.asc())
        .limit(cfg.AGENT_CONTEXT_MESSAGES)
        .all()
    )

    return [
        {
            "role": "user" if m.inbound else "assistant",
            "content": m.content or "",
            "id": str(m.id),
            "sequence": m.conversation_sequence,
        }
        for m in messages
    ]


def build_history_string(messages: List[dict]) -> str:
    """Format messages as a readable string for the LLM prompt."""
    lines = []
    for m in messages:
        role = "Customer" if m["role"] == "user" else "Agent"
        lines.append(f"{role}: {m['content']}")
    return "\n".join(lines) if lines else "(no messages yet)"
