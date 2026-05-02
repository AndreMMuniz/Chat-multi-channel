"""Message repository with sequencing and deduplication support."""

from typing import List, Optional
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.models.models import Message
from app.repositories.base_repo import BaseRepository


class MessageRepository(BaseRepository[Message]):
    """Repository for Message model with ordering and deduplication."""

    def __init__(self, session: Session):
        super().__init__(Message, session)

    async def find_by_conversation(
        self, conversation_id: str, skip: int = 0, limit: int = 50
    ) -> List[Message]:
        """Messages in a conversation ordered by sequence (creation order)."""
        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.conversation_sequence.asc())
            .offset(skip)
            .limit(limit)
        )
        result = self.session.execute(stmt)
        return result.scalars().all()

    async def find_from_sequence(
        self, conversation_id: str, from_sequence: int = 0, limit: int = 50
    ) -> List[Message]:
        """Messages after a given sequence number — useful for catch-up on reconnect."""
        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .where(Message.conversation_sequence > from_sequence)
            .order_by(Message.conversation_sequence.asc())
            .limit(limit)
        )
        result = self.session.execute(stmt)
        return result.scalars().all()

    async def find_by_idempotency_key(self, idempotency_key: str) -> Optional[Message]:
        """Return existing message if this idempotency key was already used."""
        stmt = select(Message).where(Message.idempotency_key == idempotency_key)
        result = self.session.execute(stmt)
        return result.scalars().first()

    async def next_sequence(self, conversation_id: str) -> int:
        """Compute next sequence number for a conversation (max + 1)."""
        stmt = select(func.coalesce(func.max(Message.conversation_sequence), 0)).where(
            Message.conversation_id == conversation_id
        )
        result = self.session.execute(stmt)
        return (result.scalar() or 0) + 1

    async def create_sequenced(
        self,
        conversation_id: str,
        content: str,
        inbound: bool = False,
        owner_id: Optional[str] = None,
        message_type: str = "TEXT",
        image: Optional[str] = None,
        file: Optional[str] = None,
        idempotency_key: Optional[str] = None,
    ) -> Message:
        """
        Create a message with an auto-incremented conversation_sequence.
        Returns existing message if idempotency_key was already used.
        """
        if idempotency_key:
            existing = await self.find_by_idempotency_key(idempotency_key)
            if existing:
                return existing

        sequence = await self.next_sequence(conversation_id)

        from app.models.models import MessageType as MsgType
        msg_type_enum = MsgType[message_type] if isinstance(message_type, str) else message_type

        message = Message(
            conversation_id=conversation_id,
            content=content,
            inbound=inbound,
            owner_id=owner_id,
            message_type=msg_type_enum,
            image=image,
            file=file,
            conversation_sequence=sequence,
            idempotency_key=idempotency_key,
        )
        self.session.add(message)
        self.session.commit()
        self.session.refresh(message)
        return message

    async def find_by_user(
        self, user_id: str, skip: int = 0, limit: int = 50
    ) -> List[Message]:
        """Messages sent by a specific agent."""
        stmt = (
            select(Message)
            .where(Message.owner_id == user_id)
            .order_by(Message.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = self.session.execute(stmt)
        return result.scalars().all()

    async def find_by_type(
        self, message_type: str, skip: int = 0, limit: int = 50
    ) -> List[Message]:
        """Messages of a specific type."""
        stmt = (
            select(Message)
            .where(Message.message_type == message_type)
            .order_by(Message.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = self.session.execute(stmt)
        return result.scalars().all()

    async def count_by_conversation(self, conversation_id: str) -> int:
        """Total message count in a conversation."""
        stmt = select(func.count(Message.id)).where(
            Message.conversation_id == conversation_id
        )
        result = self.session.execute(stmt)
        return result.scalar() or 0

    async def delete_by_conversation(self, conversation_id: str) -> int:
        """Delete all messages in a conversation (used when deleting conversation)."""
        stmt = select(Message).where(Message.conversation_id == conversation_id)
        result = self.session.execute(stmt)
        messages = result.scalars().all()

        for msg in messages:
            self.session.delete(msg)
        self.session.commit()
        return len(messages)
