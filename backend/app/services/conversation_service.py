"""
ConversationService — business logic for conversation state management.
"""

from typing import Optional
from sqlalchemy.orm import Session

from app.models.models import Conversation
from app.core.websocket import manager


class ConversationService:
    """Manages conversation state changes and real-time notifications."""

    def __init__(self, db: Session):
        self.db = db

    def update_conversation(self, conversation: Conversation, data: dict) -> Conversation:
        """Apply field updates and persist."""
        for key, value in data.items():
            setattr(conversation, key, value)
        self.db.commit()
        self.db.refresh(conversation)
        return conversation

    async def broadcast_update(self, conversation: Conversation) -> None:
        """Notify all clients about a conversation state change."""
        await manager.broadcast_global("conversation_updated", {
            "id": str(conversation.id),
            "status": conversation.status.value if conversation.status else None,
            "tag": conversation.tag.value if conversation.tag else None,
            "is_unread": conversation.is_unread,
        })

    async def update_and_broadcast(
        self, conversation: Conversation, data: dict
    ) -> Conversation:
        """Update state + broadcast in one call."""
        updated = self.update_conversation(conversation, data)
        await self.broadcast_update(updated)
        return updated


def get_conversation_service(db: Session) -> ConversationService:
    """FastAPI dependency factory."""
    return ConversationService(db)
