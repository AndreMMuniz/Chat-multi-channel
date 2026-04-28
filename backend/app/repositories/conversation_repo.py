"""Conversation repository with conversation-specific database operations."""

from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.models import Conversation
from app.repositories.base_repo import BaseRepository


class ConversationRepository(BaseRepository[Conversation]):
    """Repository for Conversation model with specialized queries."""

    def __init__(self, session: Session):
        super().__init__(Conversation, session)

    async def find_by_user(self, user_id: str, skip: int = 0, limit: int = 20) -> List[Conversation]:
        """Find conversations for a specific user."""
        stmt = (
            select(Conversation)
            .where(Conversation.assigned_to == user_id)
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def find_by_channel(self, channel: str, skip: int = 0, limit: int = 20) -> List[Conversation]:
        """Find conversations from a specific channel."""
        stmt = (
            select(Conversation)
            .where(Conversation.channel == channel)
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def find_by_status(self, status: str, skip: int = 0, limit: int = 20) -> List[Conversation]:
        """Find conversations with specific status."""
        stmt = (
            select(Conversation)
            .where(Conversation.status == status)
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def find_open_conversations(self, skip: int = 0, limit: int = 20) -> List[Conversation]:
        """Find all open conversations."""
        stmt = (
            select(Conversation)
            .where(Conversation.status == "open")
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def find_by_tag(self, tag: str, skip: int = 0, limit: int = 20) -> List[Conversation]:
        """Find conversations with specific tag."""
        stmt = (
            select(Conversation)
            .where(Conversation.tag == tag)
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def close_conversation(self, conversation_id: str) -> Optional[Conversation]:
        """Close a conversation."""
        return await self.update(conversation_id, {"status": "closed"})

    async def reopen_conversation(self, conversation_id: str) -> Optional[Conversation]:
        """Reopen a closed conversation."""
        return await self.update(conversation_id, {"status": "open"})

    async def assign_conversation(self, conversation_id: str, user_id: str) -> Optional[Conversation]:
        """Assign conversation to a user."""
        return await self.update(conversation_id, {"assigned_to": user_id})
