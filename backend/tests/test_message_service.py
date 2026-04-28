"""
Unit tests for MessageService — sequencing, idempotency, dispatch routing.
"""

import pytest
from unittest.mock import AsyncMock, patch
from uuid import uuid4

from app.services.message_service import MessageService
from app.models.models import (
    User, UserType, DefaultRole, Contact, Conversation, Message, ChannelType
)


# ── Fixtures ──────────────────────────────────────────────────────────────────

def make_conversation(db, channel=ChannelType.TELEGRAM) -> Conversation:
    contact = Contact(name="Customer", channel_identifier="12345")
    db.add(contact)
    db.commit()
    db.refresh(contact)

    conv = Conversation(contact_id=contact.id, channel=channel)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


# ── Sequencing ────────────────────────────────────────────────────────────────

class TestMessageSequencing:
    def test_first_message_gets_sequence_1(self, db):
        conv = make_conversation(db)
        svc = MessageService(db)
        msg = svc.create_message(conv, "Hello")
        assert msg.conversation_sequence == 1

    def test_second_message_gets_sequence_2(self, db):
        conv = make_conversation(db)
        svc = MessageService(db)
        svc.create_message(conv, "First")
        msg2 = svc.create_message(conv, "Second")
        assert msg2.conversation_sequence == 2

    def test_messages_across_conversations_are_independent(self, db):
        conv1 = make_conversation(db)
        conv2 = make_conversation(db)
        svc = MessageService(db)
        svc.create_message(conv1, "Conv1 msg1")
        svc.create_message(conv1, "Conv1 msg2")
        msg = svc.create_message(conv2, "Conv2 msg1")
        assert msg.conversation_sequence == 1

    def test_sequence_increments_correctly_after_5_messages(self, db):
        conv = make_conversation(db)
        svc = MessageService(db)
        for i in range(5):
            svc.create_message(conv, f"Message {i}")
        last = db.query(Message).filter(
            Message.conversation_id == conv.id
        ).order_by(Message.conversation_sequence.desc()).first()
        assert last.conversation_sequence == 5


# ── Idempotency ───────────────────────────────────────────────────────────────

class TestIdempotency:
    def test_duplicate_key_returns_existing_message(self, db):
        conv = make_conversation(db)
        svc = MessageService(db)
        key = "unique-key-123"
        msg1 = svc.create_message(conv, "Hello", idempotency_key=key)
        msg2 = svc.create_message(conv, "Duplicate", idempotency_key=key)
        assert msg1.id == msg2.id

    def test_duplicate_does_not_create_second_message(self, db):
        conv = make_conversation(db)
        svc = MessageService(db)
        key = "no-dupe-key"
        svc.create_message(conv, "Hello", idempotency_key=key)
        svc.create_message(conv, "Hello again", idempotency_key=key)
        count = db.query(Message).filter(Message.conversation_id == conv.id).count()
        assert count == 1

    def test_different_keys_create_separate_messages(self, db):
        conv = make_conversation(db)
        svc = MessageService(db)
        svc.create_message(conv, "Msg1", idempotency_key="key-a")
        svc.create_message(conv, "Msg2", idempotency_key="key-b")
        count = db.query(Message).filter(Message.conversation_id == conv.id).count()
        assert count == 2


# ── Conversation update on send ───────────────────────────────────────────────

class TestConversationUpdate:
    def test_outbound_sets_is_unread_false(self, db):
        conv = make_conversation(db)
        conv.is_unread = True
        db.commit()
        MessageService(db).create_message(conv, "Reply", inbound=False)
        db.refresh(conv)
        assert conv.is_unread is False

    def test_inbound_sets_is_unread_true(self, db):
        conv = make_conversation(db)
        MessageService(db).create_message(conv, "Customer message", inbound=True)
        db.refresh(conv)
        assert conv.is_unread is True

    def test_last_message_updated(self, db):
        conv = make_conversation(db)
        MessageService(db).create_message(conv, "Latest message")
        db.refresh(conv)
        assert conv.last_message == "Latest message"


# ── send_from_dashboard ───────────────────────────────────────────────────────

class TestSendFromDashboard:
    @pytest.mark.asyncio
    async def test_send_creates_message_and_dispatches(self, db):
        conv = make_conversation(db, channel=ChannelType.TELEGRAM)

        with patch(
            "app.services.channel_service.ChannelService.send",
            new_callable=AsyncMock,
        ) as mock_dispatch, patch(
            "app.services.message_service.manager.broadcast_to_conversation",
            new_callable=AsyncMock,
        ) as mock_broadcast:
            msg = await MessageService(db).send_from_dashboard(conv, "Hi there")

        assert msg.id is not None
        assert msg.content == "Hi there"
        assert msg.inbound is False
        mock_dispatch.assert_called_once()
        mock_broadcast.assert_called_once()

    @pytest.mark.asyncio
    async def test_receive_from_channel_sets_inbound_true(self, db):
        conv = make_conversation(db)

        with patch(
            "app.services.message_service.manager.broadcast_to_conversation",
            new_callable=AsyncMock,
        ):
            msg = await MessageService(db).receive_from_channel(conv, "Customer says hi")

        assert msg.inbound is True
