"""
MessageService — business logic for message creation, channel dispatch, and delivery tracking.

Encapsulates: sequence assignment, idempotency, external channel dispatch
(Telegram, future: WhatsApp/Email/SMS), WebSocket broadcast.
"""

import asyncio
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from uuid import UUID
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.models import Conversation, Message
from app.core.websocket import manager


class MessageService:
    """Handles the full lifecycle of sending a message."""

    def __init__(self, db: Session):
        self.db = db

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _next_sequence(self, conversation_id: UUID) -> int:
        """Compute next conversation_sequence (thread-safe within single process)."""
        max_seq = self.db.query(
            func.coalesce(func.max(Message.conversation_sequence), 0)
        ).filter(Message.conversation_id == conversation_id).scalar()
        return (max_seq or 0) + 1

    def _find_by_idempotency_key(self, key: str) -> Optional[Message]:
        return self.db.query(Message).filter(Message.idempotency_key == key).first()

    # ── Core create ───────────────────────────────────────────────────────────

    def create_message(
        self,
        conversation: Conversation,
        content: str,
        inbound: bool = False,
        owner_id: Optional[UUID] = None,
        message_type: str = "TEXT",
        image: Optional[str] = None,
        file: Optional[str] = None,
        idempotency_key: Optional[str] = None,
    ) -> Message:
        """
        Create and persist a message with an auto-incremented sequence number.
        Returns existing message if idempotency_key was already used.
        """
        if idempotency_key:
            existing = self._find_by_idempotency_key(idempotency_key)
            if existing:
                return existing

        from app.models.models import MessageType as MsgType
        msg_type_enum = MsgType[message_type.upper()] if isinstance(message_type, str) else message_type

        sequence = self._next_sequence(conversation.id)

        message = Message(
            conversation_id=conversation.id,
            content=content,
            inbound=inbound,
            owner_id=owner_id,
            message_type=msg_type_enum,
            image=image,
            file=file,
            conversation_sequence=sequence,
            idempotency_key=idempotency_key,
        )
        self.db.add(message)

        # Update conversation last_message
        conversation.last_message = content
        conversation.is_unread = inbound  # unread when message is from contact

        self.db.commit()
        self.db.refresh(message)
        return message

    # ── Channel dispatch ──────────────────────────────────────────────────────

    async def dispatch_to_channel(
        self, conversation: Conversation, content: str, message: Optional["Message"] = None
    ) -> None:
        """
        Send outbound message to the external channel via ChannelService.
        If a Message instance is provided, persists delivery_status on success/failure.
        """
        from app.services.channel_service import ChannelService, ChannelDeliveryError
        from app.models.models import DeliveryStatus

        try:
            await ChannelService(self.db).send(conversation, content)
            # Mark as sent
            if message:
                message.delivery_status = DeliveryStatus.SENT
                message.delivery_error = None
                self.db.commit()
            # Reset failure counter for this channel
            from app.services.delivery_alert_service import delivery_alerts
            asyncio.create_task(
                delivery_alerts.record_success(conversation.channel.value)
            )
        except (ChannelDeliveryError, Exception) as exc:
            reason = str(exc) or "channel_unavailable"
            # Persist failure
            if message:
                from datetime import timezone
                message.delivery_status = DeliveryStatus.FAILED
                message.delivery_error = reason
                self.db.commit()
            # Track failure for threshold alerts
            from app.services.delivery_alert_service import delivery_alerts
            asyncio.create_task(
                delivery_alerts.record_failure(conversation.channel.value, reason)
            )
            # Broadcast send_error so UI can show retry
            await manager.broadcast_to_conversation(
                conversation_id=str(conversation.id),
                event_type="send_error",
                data={
                    "conversation_id": str(conversation.id),
                    "message_id": str(message.id) if message else None,
                    "reason": reason,
                    "retry_count": message.retry_count if message else 0,
                },
            )
            raise

    # ── WebSocket broadcast ───────────────────────────────────────────────────

    async def broadcast_new_message(self, message: Message) -> None:
        """Broadcast message to subscribers + lightweight notification to all other clients."""
        data = {
            "id": str(message.id),
            "sequence": message.conversation_sequence,
            "conversation_id": str(message.conversation_id),
            "content": message.content,
            "inbound": message.inbound,
            "message_type": message.message_type.value if message.message_type else "text",
            "image": message.image,
            "file": message.file,
            "owner_id": str(message.owner_id) if message.owner_id else None,
            "created_at": message.created_at.isoformat() if message.created_at else None,
        }
        await manager.notify_new_message(
            conversation_id=str(message.conversation_id),
            message_data=data,
            preview=message.content or "",
        )

    # ── Retry (Story 4.3) ─────────────────────────────────────────────────────

    MAX_RETRIES = 3

    async def retry_message(self, message: Message, conversation: Conversation) -> Message:
        """
        Retry a failed outbound message (manual or auto).
        Increments retry_count; returns updated message.
        """
        from app.models.models import DeliveryStatus
        from datetime import timezone

        if message.delivery_status != DeliveryStatus.FAILED:
            raise ValueError("Only FAILED messages can be retried")
        if message.retry_count >= self.MAX_RETRIES:
            raise ValueError(f"Max retries ({self.MAX_RETRIES}) reached")

        message.retry_count += 1
        message.last_retry_at = datetime.now(timezone.utc)
        message.delivery_status = DeliveryStatus.PENDING
        self.db.commit()

        await self.dispatch_to_channel(conversation, message.content, message)
        await self.broadcast_new_message(message)
        return message

    # ── Combined: create + dispatch + broadcast ───────────────────────────────

    async def send_from_dashboard(
        self,
        conversation: Conversation,
        content: str,
        owner_id: Optional[UUID] = None,
        message_type: str = "TEXT",
        image: Optional[str] = None,
        file: Optional[str] = None,
        idempotency_key: Optional[str] = None,
    ) -> Message:
        """
        Full outbound message flow:
        1. Persist with delivery_status=PENDING
        2. Dispatch to external channel (updates status on result)
        3. Broadcast via WebSocket
        """
        from app.models.models import DeliveryStatus

        message = self.create_message(
            conversation=conversation,
            content=content,
            inbound=False,
            owner_id=owner_id,
            message_type=message_type,
            image=image,
            file=file,
            idempotency_key=idempotency_key,
        )
        message.delivery_status = DeliveryStatus.PENDING

        # Set first_response_at when this is the first outbound message (Story 3.6)
        if conversation.first_response_at is None:
            conversation.first_response_at = datetime.now(timezone.utc)

        self.db.commit()

        try:
            await self.dispatch_to_channel(conversation, content, message)
        except Exception:
            pass  # failure already persisted and broadcast inside dispatch_to_channel

        await self.broadcast_new_message(message)
        return message

    async def receive_from_channel(
        self,
        conversation: Conversation,
        content: str,
        message_type: str = "TEXT",
        idempotency_key: Optional[str] = None,
    ) -> Message:
        """
        Full inbound message flow (channel → dashboard):
        1. Persist with sequence number
        2. Broadcast via WebSocket
        3. Enqueue to agent worker for AI processing
        """
        message = self.create_message(
            conversation=conversation,
            content=content,
            inbound=True,
            message_type=message_type,
            idempotency_key=idempotency_key,
        )
        await self.broadcast_new_message(message)
        await self._enqueue_for_agent(message, conversation)
        return message

    async def _enqueue_for_agent(self, message: Message, conversation: Conversation) -> None:
        """Fire-and-forget: enqueue message to the AI agent worker."""
        try:
            from src.shared.queue import agent_queue
            from src.shared.models import AgentTask, ChannelType as AgentChannel

            task = AgentTask(
                message_id=str(message.id),
                conversation_id=str(conversation.id),
                channel=AgentChannel(conversation.channel.value.upper()),
                content=message.content or "",
            )
            q = agent_queue()
            q.put_nowait(task)
        except Exception:
            # Never fail inbound processing because the agent queue is full or unavailable
            pass


def get_message_service(db: Session) -> MessageService:
    """FastAPI dependency factory."""
    return MessageService(db)
