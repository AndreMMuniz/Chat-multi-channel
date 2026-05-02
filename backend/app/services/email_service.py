"""
Email Service — SMTP outbound + IMAP inbound polling.

Note on inbound: Email has no webhook. Inbound messages require a background
polling task that periodically checks IMAP UNSEEN messages. That task is not
started here — it should be wired into the app startup (e.g. via APScheduler
or a background task in main.py). This file exposes the core logic.
"""

import smtplib
import imaplib
import email as email_lib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import decode_header
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session

from app.models.models import Contact, Conversation, ChannelType, GeneralSettings


class EmailService:
    """Handles SMTP outbound and IMAP inbound email."""

    def __init__(
        self,
        smtp_host: str,
        smtp_port: int,
        imap_host: str,
        imap_port: int,
        address: str,
        password: str,
    ):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.imap_host = imap_host
        self.imap_port = imap_port
        self.address = address
        self.password = password

    @classmethod
    def from_settings(cls, db: Session) -> Optional["EmailService"]:
        """Instantiate from GeneralSettings. Returns None if not configured."""
        cfg = db.query(GeneralSettings).first()
        if not cfg or not cfg.email_address or not cfg.email_password:
            return None
        return cls(
            smtp_host=cfg.email_smtp_host or "",
            smtp_port=cfg.email_smtp_port or 587,
            imap_host=cfg.email_imap_host or "",
            imap_port=cfg.email_imap_port or 993,
            address=cfg.email_address,
            password=cfg.email_password,
        )

    # ── Outbound ──────────────────────────────────────────────────────────────

    async def send_email(self, to: str, subject: str, body: str) -> bool:
        """Send email via SMTP. Returns True on success."""
        if not self.smtp_host:
            print("EmailService: smtp_host not configured")
            return False
        try:
            msg = MIMEMultipart()
            msg["From"] = self.address
            msg["To"] = to
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "plain"))

            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.ehlo()
                server.starttls()
                server.login(self.address, self.password)
                server.sendmail(self.address, to, msg.as_string())
            return True
        except Exception as e:
            print(f"EmailService send error: {e}")
            return False

    # ── Inbound polling ───────────────────────────────────────────────────────

    def fetch_unseen(self) -> List[Tuple[str, str, str]]:
        """
        Fetch unread messages from IMAP.
        Returns list of (from_addr, subject, body) tuples.
        Marks messages as SEEN after fetching.
        """
        if not self.imap_host:
            return []
        results = []
        try:
            mail = imaplib.IMAP4_SSL(self.imap_host, self.imap_port)
            mail.login(self.address, self.password)
            mail.select("INBOX")

            _, ids = mail.search(None, "UNSEEN")
            for uid in ids[0].split():
                _, data = mail.fetch(uid, "(RFC822)")
                msg = email_lib.message_from_bytes(data[0][1])

                from_addr = msg.get("From", "")
                raw_subject = msg.get("Subject", "")
                subject = self._decode_header(raw_subject)
                body = self._extract_body(msg)

                results.append((from_addr, subject, body))
                mail.store(uid, "+FLAGS", "\\Seen")

            mail.close()
            mail.logout()
        except Exception as e:
            print(f"EmailService IMAP error: {e}")
        return results

    async def poll_and_process(self, db: Session) -> None:
        """Called by background scheduler. Processes unseen emails as inbound messages."""
        import asyncio
        # fetch_unseen uses blocking imaplib — run in thread pool to avoid blocking event loop
        messages = await asyncio.to_thread(self.fetch_unseen)
        for from_addr, subject, body in messages:
            await self._handle_inbound(db, from_addr, body)

    async def _handle_inbound(self, db: Session, from_addr: str, text: str) -> None:
        contact = db.query(Contact).filter(Contact.email == from_addr).first()
        if not contact:
            contact = Contact(name=from_addr, email=from_addr, channel_identifier=from_addr)
            db.add(contact)
            db.commit()
            db.refresh(contact)

        conversation = db.query(Conversation).filter(
            Conversation.contact_id == contact.id,
            Conversation.channel == ChannelType.EMAIL,
        ).first()
        if not conversation:
            conversation = Conversation(
                contact_id=contact.id,
                channel=ChannelType.EMAIL,
                thread_id=from_addr,
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)

        from app.services.message_service import MessageService
        await MessageService(db).receive_from_channel(conversation, text)

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _decode_header(value: str) -> str:
        parts = decode_header(value)
        decoded = []
        for part, enc in parts:
            if isinstance(part, bytes):
                decoded.append(part.decode(enc or "utf-8", errors="replace"))
            else:
                decoded.append(part)
        return " ".join(decoded)

    @staticmethod
    def _extract_body(msg) -> str:
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    payload = part.get_payload(decode=True)
                    if payload:
                        return payload.decode(part.get_content_charset() or "utf-8", errors="replace")
        else:
            payload = msg.get_payload(decode=True)
            if payload:
                return payload.decode(msg.get_content_charset() or "utf-8", errors="replace")
        return ""
