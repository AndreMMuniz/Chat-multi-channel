"""Outbound channel dispatch and delivery status tracking."""
import asyncio
from sqlalchemy.orm import Session

from app.models.models import Conversation, Message


class DeliveryService:
    def __init__(self, db: Session):
        self.db = db

    async def dispatch_to_channel(
        self,
        conversation: Conversation,
        content: str,
        message: "Message | None" = None,
    ) -> None:
        """
        Send outbound message to the external channel via ChannelService.
        Persists delivery_status on the message object on success/failure.
        """
        from app.services.channel_service import ChannelService, ChannelDeliveryError
        from app.models.models import DeliveryStatus

        try:
            await ChannelService(self.db).send(conversation, content)
            if message:
                message.delivery_status = DeliveryStatus.SENT
                message.delivery_error = None
                self.db.commit()
            from app.services.delivery_alert_service import delivery_alerts
            asyncio.create_task(
                delivery_alerts.record_success(conversation.channel.value)
            )
        except (ChannelDeliveryError, Exception) as exc:
            from app.core.websocket import manager
            reason = str(exc) or "channel_unavailable"
            if message:
                message.delivery_status = DeliveryStatus.FAILED
                message.delivery_error = reason
                self.db.commit()
            from app.services.delivery_alert_service import delivery_alerts
            asyncio.create_task(
                delivery_alerts.record_failure(conversation.channel.value, reason)
            )
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
