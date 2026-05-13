"""
Email Service — SMTP outbound + IMAP inbound polling.

Note on inbound: Email has no webhook. Inbound messages require a background
polling task that periodically checks IMAP UNSEEN messages. That task is not
started here — it should be wired into the app startup (e.g. via APScheduler
or a background task in main.py). This file exposes the core logic.
"""

import smtplib
import imaplib
import asyncio
import ssl
import email as email_lib
import re
from email.utils import parseaddr
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import decode_header
from typing import Optional, List, Tuple
import httpx
from sqlalchemy import or_, func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.models import Contact, Conversation, ChannelType


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
        smtp_timeout_seconds: int = 8,
        brevo_api_key: str = "",
    ):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.imap_host = imap_host
        self.imap_port = imap_port
        self.address = address
        self.password = password
        self.smtp_timeout_seconds = smtp_timeout_seconds
        self.brevo_api_key = brevo_api_key
        self.last_error: Optional[str] = None

    @classmethod
    def from_settings(cls, db: Session) -> Optional["EmailService"]:
        """Instantiate from environment-backed settings. Returns None if not configured."""
        del db
        has_brevo = bool(settings.BREVO_API_KEY and settings.EMAIL_ADDRESS)
        has_smtp = bool(settings.EMAIL_ADDRESS and settings.EMAIL_PASSWORD)
        if not has_brevo and not has_smtp:
            return None
        return cls(
            smtp_host=settings.EMAIL_SMTP_HOST,
            smtp_port=settings.EMAIL_SMTP_PORT,
            imap_host=settings.EMAIL_IMAP_HOST,
            imap_port=settings.EMAIL_IMAP_PORT,
            address=settings.EMAIL_ADDRESS,
            password=settings.EMAIL_PASSWORD,
            smtp_timeout_seconds=settings.EMAIL_SMTP_TIMEOUT_SECONDS,
            brevo_api_key=settings.BREVO_API_KEY,
        )

    # ── Outbound ──────────────────────────────────────────────────────────────

    async def send_email(self, to: str, subject: str, body: str) -> bool:
        """Send email via SMTP. Returns True on success."""
        normalized_to = self._normalize_email_address(to)
        if not normalized_to:
            self.last_error = "invalid_recipient_email"
            return False

        if self.brevo_api_key:
            return await self._send_via_brevo(normalized_to, subject, body)

        if not self.smtp_host:
            self.last_error = "smtp_host_not_configured"
            print("EmailService: smtp_host not configured")
            return False
        try:
            self.last_error = None
            await asyncio.wait_for(
                asyncio.to_thread(self._send_email_blocking, normalized_to, subject, body),
                timeout=self.smtp_timeout_seconds + 2,
            )
            return True
        except Exception as e:
            self.last_error = str(e)
            print(f"EmailService send error: {e}")
            return False

    async def _send_via_brevo(self, to: str, subject: str, body: str) -> bool:
        self.last_error = None
        if not self.address:
            self.last_error = "missing_sender_address"
            return False

        payload = {
            "sender": {
                "name": self.address.split("@")[0],
                "email": self.address,
            },
            "to": [{"email": to}],
            "subject": subject,
            "textContent": body,
        }

        headers = {
            "accept": "application/json",
            "api-key": self.brevo_api_key,
            "content-type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=max(float(self.smtp_timeout_seconds), 8.0)) as client:
                response = await client.post(
                    "https://api.brevo.com/v3/smtp/email",
                    json=payload,
                    headers=headers,
                )
            if response.is_success:
                return True

            detail = response.text.strip() or f"http_{response.status_code}"
            self.last_error = f"brevo_api:{response.status_code}:{detail[:200]}"
            print(f"EmailService Brevo send error: {self.last_error}")
            return False
        except Exception as e:
            self.last_error = f"brevo_api:{e}"
            print(f"EmailService Brevo send error: {e}")
            return False

    def _send_email_blocking(self, to: str, subject: str, body: str) -> None:
        msg = MIMEMultipart()
        msg["From"] = self.address
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        tls_context = ssl.create_default_context()

        if self.smtp_port == 465:
            with smtplib.SMTP_SSL(
                self.smtp_host,
                self.smtp_port,
                timeout=self.smtp_timeout_seconds,
                context=tls_context,
            ) as server:
                server.login(self.address, self.password)
                server.sendmail(self.address, to, msg.as_string())
            return

        with smtplib.SMTP(
            self.smtp_host,
            self.smtp_port,
            timeout=self.smtp_timeout_seconds,
        ) as server:
            server.ehlo()
            if self.smtp_port in {25, 587, 2525}:
                server.starttls(context=tls_context)
                server.ehlo()
            server.login(self.address, self.password)
            server.sendmail(self.address, to, msg.as_string())

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
        visible_text, full_context_text = self._split_visible_and_context(text)
        sender_name, sender_email = self._parse_sender(from_addr)
        lookup_email = sender_email or from_addr.strip()
        normalized_thread = (sender_email or lookup_email).strip().lower()

        conversation = self._find_email_conversation_by_sender(db, normalized_thread)
        if not conversation:
            contact = self._find_contact_by_sender(db, lookup_email, sender_email)
            if not contact:
                contact = Contact(
                    name=sender_name or lookup_email,
                    email=lookup_email if sender_email else None,
                    channel_identifier=lookup_email,
                )
                db.add(contact)
                db.commit()
                db.refresh(contact)

            conversation = Conversation(
                contact_id=contact.id,
                channel=ChannelType.EMAIL,
                thread_id=normalized_thread,
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)
        else:
            contact = conversation.contact

        if contact and sender_email and (
            contact.email != sender_email
            or contact.channel_identifier != sender_email
            or (sender_name and contact.name != sender_name)
        ):
            contact.email = sender_email
            contact.channel_identifier = sender_email
            if sender_name:
                contact.name = sender_name
            db.commit()
            db.refresh(contact)

        if conversation.thread_id != normalized_thread:
            conversation.thread_id = normalized_thread
            db.commit()
            db.refresh(conversation)

        from app.services.message_service import MessageService
        await MessageService(db).receive_from_channel(
            conversation,
            visible_text,
            agent_content=full_context_text,
        )

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

    @classmethod
    def _split_visible_and_context(cls, text: str | None) -> tuple[str, str]:
        normalized = cls._normalize_body_text(text)
        if not normalized:
            return "", ""

        separators = (
            r"(^|\n)\s*On\s.+?\bwrote:\s*",
            r"(^|\n)\s*Em\s.+?\bescreveu:\s*",
            r"\s+On\s.+?<[^>\n]+>\s+wrote:\s*",
            r"\s+Em\s.+?<[^>\n]+>\s+escreveu:\s*",
            r"(^|\n)\s*>+",
        )

        for pattern in separators:
            match = re.search(pattern, normalized, flags=re.IGNORECASE | re.DOTALL)
            if not match:
                continue
            visible = normalized[:match.start()].strip()
            if visible:
                return visible, normalized

        return normalized, normalized

    @staticmethod
    def _normalize_body_text(text: str | None) -> str:
        if not text:
            return ""
        normalized = text.replace("\r\n", "\n").replace("\r", "\n").strip()
        normalized = re.sub(r"[ \t]+\n", "\n", normalized)
        normalized = re.sub(r"\n{3,}", "\n\n", normalized)
        return normalized

    @staticmethod
    def _normalize_email_address(value: str | None) -> str | None:
        if not value:
            return None
        _, email_address = parseaddr(value.strip())
        normalized = email_address.strip().lower()
        if not normalized or "@" not in normalized:
            return None
        return normalized

    @classmethod
    def _parse_sender(cls, value: str | None) -> tuple[str | None, str | None]:
        if not value:
            return None, None
        name, email_address = parseaddr(value.strip())
        normalized_email = cls._normalize_email_address(email_address or value)
        normalized_name = name.strip() if name and name.strip() else None
        return normalized_name, normalized_email

    @staticmethod
    def _find_contact_by_sender(db: Session, lookup_email: str, sender_email: str | None) -> Contact | None:
        normalized_lookup = (sender_email or lookup_email or "").strip().lower()
        if not normalized_lookup:
            return None

        contact = db.query(Contact).filter(
            or_(
                func.lower(Contact.email) == normalized_lookup,
                func.lower(Contact.channel_identifier) == normalized_lookup,
            )
        ).first()
        if contact:
            return contact

        pattern = f"%{normalized_lookup}%"
        return db.query(Contact).filter(
            or_(
                func.lower(Contact.email).like(pattern),
                func.lower(Contact.channel_identifier).like(pattern),
            )
        ).first()

    @staticmethod
    def _find_email_conversation_by_sender(db: Session, normalized_sender: str) -> Conversation | None:
        if not normalized_sender:
            return None

        conversation = (
            db.query(Conversation)
            .join(Contact, Contact.id == Conversation.contact_id)
            .filter(
                Conversation.channel == ChannelType.EMAIL,
                or_(
                    func.lower(Conversation.thread_id) == normalized_sender,
                    func.lower(Contact.email) == normalized_sender,
                    func.lower(Contact.channel_identifier) == normalized_sender,
                ),
            )
            .order_by(Conversation.updated_at.desc(), Conversation.created_at.desc())
            .first()
        )
        if conversation:
            return conversation

        pattern = f"%{normalized_sender}%"
        return (
            db.query(Conversation)
            .join(Contact, Contact.id == Conversation.contact_id)
            .filter(
                Conversation.channel == ChannelType.EMAIL,
                or_(
                    func.lower(Conversation.thread_id).like(pattern),
                    func.lower(Contact.email).like(pattern),
                    func.lower(Contact.channel_identifier).like(pattern),
                ),
            )
            .order_by(Conversation.updated_at.desc(), Conversation.created_at.desc())
            .first()
        )
