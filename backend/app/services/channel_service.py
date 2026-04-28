"""
ChannelService — unified router for all outbound channel dispatches.

Reads credentials from GeneralSettings (admin-configurable) and routes
to the appropriate channel service. MessageService delegates here.
"""

from typing import Optional
from sqlalchemy.orm import Session

from app.models.models import Conversation, Contact, ChannelType


class ChannelService:
    """Routes outbound messages to the correct channel integration."""

    def __init__(self, db: Session):
        self.db = db

    async def send(self, conversation: Conversation, content: str) -> bool:
        """
        Dispatch outbound message to the external channel.
        Returns True if successful.
        """
        contact = self.db.query(Contact).filter(
            Contact.id == conversation.contact_id
        ).first()
        if not contact:
            print(f"ChannelService: no contact for conversation {conversation.id}")
            return False

        channel = conversation.channel

        if channel == ChannelType.TELEGRAM:
            return await self._send_telegram(contact, content)
        elif channel == ChannelType.WHATSAPP:
            return await self._send_whatsapp(contact, content)
        elif channel == ChannelType.EMAIL:
            return await self._send_email(contact, content)
        elif channel == ChannelType.SMS:
            return await self._send_sms(contact, content)
        else:
            # WEB channel — no external dispatch needed
            return True

    # ── Channel-specific dispatchers ──────────────────────────────────────────

    async def _send_telegram(self, contact: Contact, content: str) -> bool:
        if not contact.channel_identifier:
            return False
        from app.services.telegram_service import telegram_service
        return await telegram_service.send_message(contact.channel_identifier, content)

    async def _send_whatsapp(self, contact: Contact, content: str) -> bool:
        if not contact.channel_identifier:
            return False
        from app.services.whatsapp_service import WhatsAppService
        svc = WhatsAppService.from_settings(self.db)
        if not svc:
            print("ChannelService: WhatsApp not configured in settings")
            return False
        return await svc.send_message(contact.channel_identifier, content)

    async def _send_email(self, contact: Contact, content: str) -> bool:
        if not contact.email:
            return False
        from app.services.email_service import EmailService
        svc = EmailService.from_settings(self.db)
        if not svc:
            print("ChannelService: Email not configured in settings")
            return False
        subject = "Reply from support"
        return await svc.send_email(contact.email, subject, content)

    async def _send_sms(self, contact: Contact, content: str) -> bool:
        if not contact.phone:
            return False
        from app.services.sms_service import SMSService
        svc = SMSService.from_settings(self.db)
        if not svc:
            print("ChannelService: SMS/Twilio not configured in settings")
            return False
        return await svc.send_message(contact.phone, content)
