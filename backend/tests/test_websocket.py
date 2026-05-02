"""
Unit tests for SequencedConnectionManager — sequencing, ack, subscribe.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock

from app.core.websocket import SequencedConnectionManager, ClientSession


# ── Helpers ───────────────────────────────────────────────────────────────────

def make_client(client_id="client-1") -> tuple[ClientSession, MagicMock]:
    ws = MagicMock()
    ws.send_json = AsyncMock(return_value=None)
    session = ClientSession(ws, client_id)
    return session, ws


# ── Sequence management ───────────────────────────────────────────────────────

class TestSequenceManagement:
    def test_first_broadcast_gets_sequence_1(self):
        mgr = SequencedConnectionManager()
        seq = mgr._next_sequence("conv-1")
        assert seq == 1

    def test_second_broadcast_gets_sequence_2(self):
        mgr = SequencedConnectionManager()
        mgr._next_sequence("conv-1")
        seq = mgr._next_sequence("conv-1")
        assert seq == 2

    def test_different_conversations_have_independent_sequences(self):
        mgr = SequencedConnectionManager()
        mgr._next_sequence("conv-1")
        mgr._next_sequence("conv-1")
        seq_b = mgr._next_sequence("conv-2")
        assert seq_b == 1


# ── Subscribe / unsubscribe ───────────────────────────────────────────────────

class TestSubscriptions:
    def test_subscribe_adds_conversation_to_client(self):
        mgr = SequencedConnectionManager()
        session, ws = make_client()
        mgr._clients["c1"] = session
        mgr.subscribe("c1", "conv-1")
        assert "conv-1" in session.subscribed_conversations

    def test_unsubscribe_removes_conversation(self):
        mgr = SequencedConnectionManager()
        session, ws = make_client()
        session.subscribed_conversations.add("conv-1")
        mgr._clients["c1"] = session
        mgr.unsubscribe("c1", "conv-1")
        assert "conv-1" not in session.subscribed_conversations

    def test_subscribe_unknown_client_does_not_raise(self):
        mgr = SequencedConnectionManager()
        mgr.subscribe("nonexistent", "conv-1")  # should not raise


# ── Broadcast ─────────────────────────────────────────────────────────────────

class TestBroadcast:
    @pytest.mark.asyncio
    async def test_broadcast_only_reaches_subscribed_clients(self):
        mgr = SequencedConnectionManager()

        subscribed, ws_sub = make_client("sub")
        subscribed.subscribed_conversations.add("conv-1")
        mgr._clients["sub"] = subscribed

        not_subscribed, ws_no = make_client("nosub")
        mgr._clients["nosub"] = not_subscribed

        await mgr.broadcast_to_conversation("conv-1", "new_message", {"content": "hi"})

        ws_sub.send_json.assert_called_once()
        ws_no.send_json.assert_not_called()

    @pytest.mark.asyncio
    async def test_broadcast_event_has_sequence(self):
        mgr = SequencedConnectionManager()
        session, ws = make_client()
        session.subscribed_conversations.add("conv-1")
        mgr._clients["c1"] = session

        await mgr.broadcast_to_conversation("conv-1", "ping", {})

        call_args = ws.send_json.call_args[0][0]
        assert call_args["sequence"] == 1
        assert call_args["type"] == "ping"

    @pytest.mark.asyncio
    async def test_exclude_client_skips_sender(self):
        mgr = SequencedConnectionManager()
        sender, ws_sender = make_client("sender")
        sender.subscribed_conversations.add("conv-1")
        mgr._clients["sender"] = sender

        receiver, ws_receiver = make_client("receiver")
        receiver.subscribed_conversations.add("conv-1")
        mgr._clients["receiver"] = receiver

        await mgr.broadcast_to_conversation("conv-1", "msg", {}, exclude_client="sender")

        ws_sender.send_json.assert_not_called()
        ws_receiver.send_json.assert_called_once()

    @pytest.mark.asyncio
    async def test_global_broadcast_reaches_all_clients(self):
        mgr = SequencedConnectionManager()
        c1, ws1 = make_client("c1")
        c2, ws2 = make_client("c2")
        mgr._clients["c1"] = c1
        mgr._clients["c2"] = c2

        await mgr.broadcast_global("update", {"status": "ok"})

        ws1.send_json.assert_called_once()
        ws2.send_json.assert_called_once()


# ── Acknowledgment ────────────────────────────────────────────────────────────

class TestAcknowledgment:
    def test_ack_updates_last_acked_sequence(self):
        session, _ = make_client()
        session.acknowledge("conv-1", 5)
        assert session.last_acked_sequence["conv-1"] == 5

    def test_ack_resolves_pending_event(self):
        import asyncio
        session, _ = make_client()
        ack_key = "conv-1:3"
        evt = asyncio.Event()
        session._pending_acks[ack_key] = evt
        session.acknowledge("conv-1", 3)
        # acknowledge() sets the event — the key is removed by send_event()'s finally block
        assert evt.is_set()


# ── Disconnect cleanup ────────────────────────────────────────────────────────

class TestDisconnect:
    def test_disconnect_removes_client(self):
        mgr = SequencedConnectionManager()
        session, _ = make_client()
        mgr._clients["c1"] = session
        mgr.disconnect("c1")
        assert "c1" not in mgr._clients

    def test_disconnect_unknown_client_does_not_raise(self):
        mgr = SequencedConnectionManager()
        mgr.disconnect("nobody")
