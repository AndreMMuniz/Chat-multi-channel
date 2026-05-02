"""
ChannelService — unified router for all outbound channel dispatches.

Raises ChannelDeliveryError on failure so the caller can persist the reason.
"""

from sqlalchemy.orm import Session
from app.models.models import Conversation, Contact, ChannelType


class ChannelDeliveryError(Exception):
    """Raised when an outbound message cannot be delivered to the channel."""


class ChannelService:
    """Routes outbound messages to the correct channel integration."""

    def __init__(self, db: Session):
        self.db = db

    async def send(self, conversation: Conversation, content: str) -> None:
        """
        Dispatch outbound message to the external channel.
        Raises ChannelDeliveryError on failure.
        """
        contact = self.db.query(Contact).filter(
            Contact.id == conversation.contact_id
        ).first()
        if not contact:
            raise ChannelDeliveryError(f"contact_not_found:{conversation.contact_id}")

        channel = conversation.channel

        if channel == ChannelType.TELEGRAM:
            await self._send_telegram(contact, content)
        elif channel == ChannelType.WHATSAPP:
            await self._send_whatsapp(contact, content)
        elif channel == ChannelType.EMAIL:
            await self._send_email(contact, content)
        elif channel == ChannelType.SMS:
            await self._send_sms(contact, content)
        # WEB — no external dispatch

    # ── Channel-specific dispatchers ──────────────────────────────────────────

    async def _send_telegram(self, contact: Contact, content: str) -> None:
        if not contact.channel_identifier:
            raise ChannelDeliveryError("telegram:missing_identifier")
        from app.services.telegram_service import telegram_service
        ok = await telegram_service.send_message(contact.channel_identifier, content)
        if not ok:
            raise ChannelDeliveryError("telegram:send_failed")

    async def _send_whatsapp(self, contact: Contact, content: str) -> None:
        if not contact.channel_identifier:
            raise ChannelDeliveryError("whatsapp:missing_identifier")
        from app.services.whatsapp_service import WhatsAppService
        svc = WhatsAppService.from_settings(self.db)
        if not svc:
            raise ChannelDeliveryError("whatsapp:not_configured")
        ok = await svc.send_message(contact.channel_identifier, content)
        if not ok:
            raise ChannelDeliveryError("whatsapp:send_failed")

    async def _send_email(self, contact: Contact, content: str) -> None:
        if not contact.email:
            raise ChannelDeliveryError("email:missing_address")
        from app.services.email_service import EmailService
        svc = EmailService.from_settings(self.db)
        if not svc:
            raise ChannelDeliveryError("email:not_configured")
        ok = await svc.send_email(contact.email, "Reply from support", content)
        if not ok:
            raise ChannelDeliveryError("email:send_failed")

    async def _send_sms(self, contact: Contact, content: str) -> None:
        if not contact.phone:
            raise ChannelDeliveryError("sms:missing_phone")
        from app.services.sms_service import SMSService
        svc = SMSService.from_settings(self.db)
        if not svc:
            raise ChannelDeliveryError("sms:not_configured")
        ok = await svc.send_message(contact.phone, content)
        if not ok:
            raise ChannelDeliveryError("sms:send_failed")
