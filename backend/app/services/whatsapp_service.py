"""
WhatsApp Service — Meta Cloud API integration.

Outbound: POST to Graph API with access_token from GeneralSettings.
Inbound:  Webhook POST from Meta, GET for challenge verification.
"""

import hmac
import hashlib
from typing import Optional
from sqlalchemy.orm import Session

import httpx

from app.models.models import Contact, Conversation, ChannelType, GeneralSettings


class WhatsAppService:
    """Handles WhatsApp Cloud API communication."""

    GRAPH_URL = "https://graph.facebook.com/v17.0"

    def __init__(self, phone_id: str, access_token: str, webhook_token: Optional[str] = None):
        self.phone_id = phone_id
        self.access_token = access_token
        self.webhook_token = webhook_token

    @classmethod
    def from_settings(cls, db: Session) -> Optional["WhatsAppService"]:
        """Instantiate from GeneralSettings in the database. Returns None if not configured."""
        cfg = db.query(GeneralSettings).first()
        if not cfg or not cfg.whatsapp_phone_id or not cfg.whatsapp_access_token:
            return None
        return cls(
            phone_id=cfg.whatsapp_phone_id,
            access_token=cfg.whatsapp_access_token,
            webhook_token=cfg.whatsapp_webhook_token,
        )

    # ── Outbound ──────────────────────────────────────────────────────────────

    async def send_message(self, to: str, text: str) -> bool:
        """Send a text message via WhatsApp Cloud API."""
        url = f"{self.GRAPH_URL}/{self.phone_id}/messages"
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {"body": text},
        }
        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(
                    url,
                    json=payload,
                    headers={"Authorization": f"Bearer {self.access_token}"},
                )
                if res.status_code != 200:
                    print(f"WhatsApp send error {res.status_code}: {res.text}")
                return res.status_code == 200
        except Exception as e:
            print(f"WhatsApp send exception: {e}")
            return False

    # ── Webhook verification ──────────────────────────────────────────────────

    def verify_webhook(self, mode: str, token: str, challenge: str) -> Optional[str]:
        """Verify Meta webhook subscription. Returns challenge on success."""
        if mode == "subscribe" and token == self.webhook_token:
            return challenge
        return None

    # ── Inbound processing ────────────────────────────────────────────────────

    async def process_update(self, payload: dict, db: Session) -> None:
        """Process inbound Meta webhook payload."""
        for entry in payload.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})
                messages = value.get("messages", [])
                contacts_meta = value.get("contacts", [])

                for msg in messages:
                    if msg.get("type") != "text":
                        continue

                    wa_id = msg["from"]
                    text = msg["text"]["body"]
                    profile_name = (
                        contacts_meta[0]["profile"]["name"]
                        if contacts_meta else wa_id
                    )

                    await self._handle_inbound(db, wa_id, profile_name, text)

    async def _handle_inbound(
        self, db: Session, wa_id: str, name: str, text: str
    ) -> None:
        """Find or create contact/conversation then delegate to MessageService."""
        contact = db.query(Contact).filter(Contact.channel_identifier == wa_id).first()
        if not contact:
            contact = Contact(name=name, channel_identifier=wa_id, phone=wa_id)
            db.add(contact)
            db.commit()
            db.refresh(contact)

        conversation = db.query(Conversation).filter(
            Conversation.contact_id == contact.id,
            Conversation.channel == ChannelType.WHATSAPP,
        ).first()
        if not conversation:
            conversation = Conversation(
                contact_id=contact.id,
                channel=ChannelType.WHATSAPP,
                thread_id=wa_id,
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)

        from app.services.message_service import MessageService
        await MessageService(db).receive_from_channel(conversation, text)
