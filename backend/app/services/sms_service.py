"""
SMS Service — Twilio REST API integration.

Outbound: Twilio Messages API.
Inbound:  Webhook POST from Twilio with form-encoded body (From, Body fields).
"""

import base64
from typing import Optional
from sqlalchemy.orm import Session

import httpx

from app.models.models import Contact, Conversation, ChannelType, GeneralSettings


class SMSService:
    """Handles Twilio SMS communication."""

    TWILIO_API = "https://api.twilio.com/2010-04-01"

    def __init__(self, account_sid: str, auth_token: str, from_number: str):
        self.account_sid = account_sid
        self.auth_token = auth_token
        self.from_number = from_number

    @classmethod
    def from_settings(cls, db: Session) -> Optional["SMSService"]:
        """Instantiate from GeneralSettings. Returns None if not configured."""
        cfg = db.query(GeneralSettings).first()
        if not cfg or not cfg.twilio_account_sid or not cfg.twilio_auth_token:
            return None
        return cls(
            account_sid=cfg.twilio_account_sid,
            auth_token=cfg.twilio_auth_token,
            from_number=cfg.twilio_phone_number or "",
        )

    # ── Auth helper ───────────────────────────────────────────────────────────

    @property
    def _basic_auth(self) -> str:
        credentials = f"{self.account_sid}:{self.auth_token}"
        return "Basic " + base64.b64encode(credentials.encode()).decode()

    # ── Outbound ──────────────────────────────────────────────────────────────

    async def send_message(self, to: str, text: str) -> bool:
        """Send SMS via Twilio Messages API."""
        url = f"{self.TWILIO_API}/Accounts/{self.account_sid}/Messages.json"
        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(
                    url,
                    data={"From": self.from_number, "To": to, "Body": text},
                    headers={"Authorization": self._basic_auth},
                )
                if res.status_code not in (200, 201):
                    print(f"Twilio send error {res.status_code}: {res.text}")
                return res.status_code in (200, 201)
        except Exception as e:
            print(f"Twilio send exception: {e}")
            return False

    # ── Inbound ───────────────────────────────────────────────────────────────

    async def process_update(self, from_number: str, body: str, db: Session) -> None:
        """Process inbound Twilio webhook (form fields: From, Body)."""
        contact = db.query(Contact).filter(Contact.channel_identifier == from_number).first()
        if not contact:
            contact = Contact(name=from_number, phone=from_number, channel_identifier=from_number)
            db.add(contact)
            db.commit()
            db.refresh(contact)

        conversation = db.query(Conversation).filter(
            Conversation.contact_id == contact.id,
            Conversation.channel == ChannelType.SMS,
        ).first()
        if not conversation:
            conversation = Conversation(
                contact_id=contact.id,
                channel=ChannelType.SMS,
                thread_id=from_number,
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)

        from app.services.message_service import MessageService
        await MessageService(db).receive_from_channel(conversation, body)
