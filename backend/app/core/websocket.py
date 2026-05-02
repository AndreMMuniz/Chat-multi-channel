"""WebSocket connection manager with event sequencing, presence tracking, and notifications."""

import asyncio
import uuid
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Dict, Optional, Set

from fastapi import WebSocket


@dataclass
class SequencedEvent:
    """WebSocket event with ordering guarantee."""
    id: str
    sequence: int
    conversation_id: str
    type: str
    data: dict
    timestamp: str
    requires_ack: bool = True


class ClientSession:
    """Tracks a single WebSocket client connection."""

    def __init__(self, websocket: WebSocket, client_id: str):
        self.websocket = websocket
        self.client_id = client_id
        self.subscribed_conversations: Set[str] = set()
        self.last_acked_sequence: Dict[str, int] = {}
        self._pending_acks: Dict[str, asyncio.Event] = {}
        # Presence identity — set via "identify" message
        self.user_id: str = ""
        self.display_name: str = ""

    async def send_event(self, event: SequencedEvent) -> bool:
        """Send event to client, waiting for ack if required. Returns False on failure."""
        try:
            await self.websocket.send_json(asdict(event))

            if event.requires_ack:
                ack_key = f"{event.conversation_id}:{event.sequence}"
                ack_event = asyncio.Event()
                self._pending_acks[ack_key] = ack_event
                try:
                    await asyncio.wait_for(ack_event.wait(), timeout=30)
                except asyncio.TimeoutError:
                    pass
                finally:
                    self._pending_acks.pop(ack_key, None)

            return True
        except Exception:
            return False

    def acknowledge(self, conversation_id: str, sequence: int) -> None:
        self.last_acked_sequence[conversation_id] = sequence
        ack_key = f"{conversation_id}:{sequence}"
        pending = self._pending_acks.get(ack_key)
        if pending:
            pending.set()


class SequencedConnectionManager:
    """
    Enhanced ConnectionManager with per-conversation event sequencing,
    presence tracking, and cross-conversation notifications.
    """

    def __init__(self):
        self._clients: Dict[str, ClientSession] = {}
        self._conversation_sequences: Dict[str, int] = {}
        # presence_map[conversation_id] = {client_id: display_name}
        self._presence: Dict[str, Dict[str, str]] = {}

    # ── Connection lifecycle ──────────────────────────────────────────────────

    async def connect(self, websocket: WebSocket, client_id: str) -> None:
        await websocket.accept()
        self._clients[client_id] = ClientSession(websocket, client_id)

    def disconnect(self, client_id: str) -> None:
        client = self._clients.pop(client_id, None)
        if client:
            # Remove from all presence maps and broadcast departures
            for conv_id in list(self._presence.keys()):
                if client_id in self._presence[conv_id]:
                    del self._presence[conv_id][client_id]
                    # Fire-and-forget presence broadcast (sync context)
                    asyncio.ensure_future(
                        self._broadcast_presence(conv_id)
                    )

    def identify(self, client_id: str, user_id: str, display_name: str) -> None:
        """Store operator identity on the session (sent once after connect)."""
        client = self._clients.get(client_id)
        if client:
            client.user_id = user_id
            client.display_name = display_name

    # ── Subscription ──────────────────────────────────────────────────────────

    def subscribe(self, client_id: str, conversation_id: str) -> None:
        client = self._clients.get(client_id)
        if not client:
            return
        client.subscribed_conversations.add(conversation_id)
        # Register presence
        if conversation_id not in self._presence:
            self._presence[conversation_id] = {}
        if client.display_name:
            self._presence[conversation_id][client_id] = client.display_name
        asyncio.ensure_future(self._broadcast_presence(conversation_id))

    def unsubscribe(self, client_id: str, conversation_id: str) -> None:
        client = self._clients.get(client_id)
        if client:
            client.subscribed_conversations.discard(conversation_id)
        # Remove presence
        if conversation_id in self._presence:
            self._presence[conversation_id].pop(client_id, None)
            asyncio.ensure_future(self._broadcast_presence(conversation_id))

    def acknowledge(self, client_id: str, conversation_id: str, sequence: int) -> None:
        client = self._clients.get(client_id)
        if client:
            client.acknowledge(conversation_id, sequence)

    # ── Presence ──────────────────────────────────────────────────────────────

    async def _broadcast_presence(self, conversation_id: str) -> None:
        """Send current viewer list to all subscribers of a conversation."""
        viewers = list(self._presence.get(conversation_id, {}).values())
        event = SequencedEvent(
            id=str(uuid.uuid4()),
            sequence=0,
            conversation_id=conversation_id,
            type="presence_update",
            data={"conversation_id": conversation_id, "viewers": viewers},
            timestamp=datetime.now(timezone.utc).isoformat(),
            requires_ack=False,
        )
        dead_clients = []
        for client_id, client in self._clients.items():
            if conversation_id in client.subscribed_conversations:
                success = await client.send_event(event)
                if not success:
                    dead_clients.append(client_id)
        for dead in dead_clients:
            self.disconnect(dead)

    # ── Sequencing helper ─────────────────────────────────────────────────────

    def _next_sequence(self, conversation_id: str) -> int:
        seq = self._conversation_sequences.get(conversation_id, 0) + 1
        self._conversation_sequences[conversation_id] = seq
        return seq

    # ── Broadcast ─────────────────────────────────────────────────────────────

    async def broadcast_to_conversation(
        self,
        conversation_id: str,
        event_type: str,
        data: dict,
        exclude_client: Optional[str] = None,
    ) -> None:
        """Broadcast sequenced event to all clients subscribed to a conversation."""
        sequence = self._next_sequence(conversation_id)
        event = SequencedEvent(
            id=f"{conversation_id}:{sequence}",
            sequence=sequence,
            conversation_id=conversation_id,
            type=event_type,
            data=data,
            timestamp=datetime.now(timezone.utc).isoformat(),
            requires_ack=True,
        )
        dead_clients = []
        for client_id, client in self._clients.items():
            if exclude_client and client_id == exclude_client:
                continue
            if conversation_id not in client.subscribed_conversations:
                continue
            success = await client.send_event(event)
            if not success:
                dead_clients.append(client_id)
        for dead in dead_clients:
            self.disconnect(dead)

    async def notify_new_message(
        self,
        conversation_id: str,
        message_data: dict,
        preview: str = "",
    ) -> None:
        """
        Full message delivery:
        1. Sequenced new_message event → subscribers of the conversation
        2. Lightweight conversation_notification → all other connected clients
        """
        await self.broadcast_to_conversation(conversation_id, "new_message", message_data)

        # Notification for non-subscribers
        notif_event = SequencedEvent(
            id=str(uuid.uuid4()),
            sequence=0,
            conversation_id=conversation_id,
            type="conversation_notification",
            data={
                "conversation_id": conversation_id,
                "preview": preview[:100],
                "inbound": message_data.get("inbound", True),
            },
            timestamp=datetime.now(timezone.utc).isoformat(),
            requires_ack=False,
        )
        dead_clients = []
        for client_id, client in self._clients.items():
            if conversation_id not in client.subscribed_conversations:
                success = await client.send_event(notif_event)
                if not success:
                    dead_clients.append(client_id)
        for dead in dead_clients:
            self.disconnect(dead)

    async def broadcast_global(self, event_type: str, data: dict) -> None:
        """Broadcast non-sequenced event to all connected clients."""
        event = SequencedEvent(
            id=str(uuid.uuid4()),
            sequence=0,
            conversation_id="",
            type=event_type,
            data=data,
            timestamp=datetime.now(timezone.utc).isoformat(),
            requires_ack=False,
        )
        dead_clients = []
        for client_id, client in self._clients.items():
            success = await client.send_event(event)
            if not success:
                dead_clients.append(client_id)
        for dead in dead_clients:
            self.disconnect(dead)

    async def send_personal(self, client_id: str, event_type: str, data: dict) -> None:
        """Send non-sequenced event to a specific client."""
        client = self._clients.get(client_id)
        if not client:
            return
        event = SequencedEvent(
            id=str(uuid.uuid4()),
            sequence=0,
            conversation_id="",
            type=event_type,
            data=data,
            timestamp=datetime.now(timezone.utc).isoformat(),
            requires_ack=False,
        )
        await client.send_event(event)

    # ── Backward-compatibility shim ───────────────────────────────────────────

    async def broadcast_json(self, data: dict) -> None:
        event_type = data.get("type", "event")
        payload = data.get("data", data)
        conversation_id = payload.get("conversation_id") if isinstance(payload, dict) else None
        if conversation_id:
            await self.broadcast_to_conversation(conversation_id, event_type, payload)
        else:
            await self.broadcast_global(event_type, payload)


manager = SequencedConnectionManager()
