"""
LangGraph tool: search recent conversations for a contact.

Used by the agent to find similar past interactions and provide better context.
"""

from typing import List
from langchain_core.tools import tool


@tool
def get_contact_history(contact_identifier: str, limit: int = 5) -> str:
    """
    Look up past conversation summaries for a contact identifier (phone, email, telegram ID).
    Returns a plain-text summary of recent interactions.
    """
    # Lazy import to avoid circular deps at module load time
    from app.core.database import SessionLocal
    from app.models.models import Contact, Conversation, Message

    db = SessionLocal()
    try:
        contact = db.query(Contact).filter(
            Contact.channel_identifier == contact_identifier
        ).first()

        if not contact:
            return "No previous conversations found for this contact."

        conversations = (
            db.query(Conversation)
            .filter(Conversation.contact_id == contact.id)
            .order_by(Conversation.created_at.desc())
            .limit(limit)
            .all()
        )

        if not conversations:
            return "No previous conversations found for this contact."

        lines = [f"Contact: {contact.name or contact_identifier}"]
        for conv in conversations:
            last_msg = conv.last_message or "no messages"
            lines.append(
                f"- [{conv.channel.name}] {conv.status.name} | Last: \"{last_msg[:80]}\""
            )
        return "\n".join(lines)

    finally:
        db.close()
