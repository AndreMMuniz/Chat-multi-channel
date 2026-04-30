"""
Tests for ChannelService — routing logic and error propagation.

ChannelService.send() queries Contact from DB by conversation.contact_id,
then dispatches to the correct channel-specific private method.
Strategy: create real DB fixtures, mock private _send_* methods.
"""

import pytest
from unittest.mock import AsyncMock, patch
from app.services.channel_service import ChannelService, ChannelDeliveryError
from app.models.models import Contact, Conversation, ChannelType


# ── Fixtures ──────────────────────────────────────────────────────────────────

def _make_conv(db, channel: ChannelType, identifier="@testuser", email=None, phone=None):
    """Create a Contact + Conversation pair in the SQLite test DB."""
    contact = Contact(
        channel_identifier=identifier,
        email=email,
        phone=phone,
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)

    conv = Conversation(contact_id=contact.id, channel=channel)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv, contact


# ── Routing ───────────────────────────────────────────────────────────────────

class TestChannelServiceRouting:
    @pytest.mark.asyncio
    async def test_routes_telegram_to_send_telegram(self, db):
        conv, contact = _make_conv(db, ChannelType.TELEGRAM)
        svc = ChannelService(db)
        with patch.object(svc, "_send_telegram", new_callable=AsyncMock) as mock:
            await svc.send(conv, "hello")
            mock.assert_called_once_with(contact, "hello")

    @pytest.mark.asyncio
    async def test_routes_whatsapp_to_send_whatsapp(self, db):
        conv, contact = _make_conv(db, ChannelType.WHATSAPP)
        svc = ChannelService(db)
        with patch.object(svc, "_send_whatsapp", new_callable=AsyncMock) as mock:
            await svc.send(conv, "hello")
            mock.assert_called_once_with(contact, "hello")

    @pytest.mark.asyncio
    async def test_routes_email_to_send_email(self, db):
        conv, contact = _make_conv(db, ChannelType.EMAIL)
        svc = ChannelService(db)
        with patch.object(svc, "_send_email", new_callable=AsyncMock) as mock:
            await svc.send(conv, "hello")
            mock.assert_called_once_with(contact, "hello")

    @pytest.mark.asyncio
    async def test_routes_sms_to_send_sms(self, db):
        conv, contact = _make_conv(db, ChannelType.SMS)
        svc = ChannelService(db)
        with patch.object(svc, "_send_sms", new_callable=AsyncMock) as mock:
            await svc.send(conv, "hello")
            mock.assert_called_once_with(contact, "hello")

    @pytest.mark.asyncio
    async def test_web_channel_is_noop(self, db):
        """WEB channel has no external dispatch — must succeed silently."""
        conv, _ = _make_conv(db, ChannelType.WEB)
        svc = ChannelService(db)
        await svc.send(conv, "hello")  # must not raise

    @pytest.mark.asyncio
    async def test_missing_contact_raises_delivery_error(self, db):
        """Conversation with no matching contact in DB raises ChannelDeliveryError."""
        import uuid
        from unittest.mock import MagicMock
        conv = MagicMock()
        conv.contact_id = uuid.uuid4()  # no matching contact
        conv.channel = ChannelType.TELEGRAM
        svc = ChannelService(db)
        with pytest.raises(ChannelDeliveryError, match="contact_not_found"):
            await svc.send(conv, "hello")


# ── Error propagation ─────────────────────────────────────────────────────────

class TestChannelDeliveryErrorPropagation:
    @pytest.mark.asyncio
    async def test_telegram_error_propagates(self, db):
        conv, _ = _make_conv(db, ChannelType.TELEGRAM)
        svc = ChannelService(db)
        with patch.object(
            svc, "_send_telegram",
            new_callable=AsyncMock,
            side_effect=ChannelDeliveryError("telegram:send_failed"),
        ):
            with pytest.raises(ChannelDeliveryError, match="telegram:send_failed"):
                await svc.send(conv, "hello")

    @pytest.mark.asyncio
    async def test_whatsapp_error_propagates(self, db):
        conv, _ = _make_conv(db, ChannelType.WHATSAPP)
        svc = ChannelService(db)
        with patch.object(
            svc, "_send_whatsapp",
            new_callable=AsyncMock,
            side_effect=ChannelDeliveryError("whatsapp:not_configured"),
        ):
            with pytest.raises(ChannelDeliveryError, match="whatsapp:not_configured"):
                await svc.send(conv, "hello")


# ── Internal dispatchers (missing identifier) ─────────────────────────────────

class TestInternalDispatchers:
    @pytest.mark.asyncio
    async def test_telegram_raises_when_identifier_missing(self, db):
        """_send_telegram raises if contact has no channel_identifier."""
        conv, contact = _make_conv(db, ChannelType.TELEGRAM, identifier="")
        contact.channel_identifier = None
        db.commit()
        svc = ChannelService(db)
        with pytest.raises(ChannelDeliveryError, match="missing_identifier"):
            await svc._send_telegram(contact, "hi")

    @pytest.mark.asyncio
    async def test_email_raises_when_email_missing(self, db):
        conv, contact = _make_conv(db, ChannelType.EMAIL)
        contact.email = None
        db.commit()
        svc = ChannelService(db)
        with pytest.raises(ChannelDeliveryError, match="missing_address"):
            await svc._send_email(contact, "hi")

    @pytest.mark.asyncio
    async def test_sms_raises_when_phone_missing(self, db):
        conv, contact = _make_conv(db, ChannelType.SMS)
        contact.phone = None
        db.commit()
        svc = ChannelService(db)
        with pytest.raises(ChannelDeliveryError, match="missing_phone"):
            await svc._send_sms(contact, "hi")
