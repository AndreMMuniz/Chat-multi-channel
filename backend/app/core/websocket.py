"""WebSocket connection manager with event sequencing and client acknowledgment."""

import asyncio
import uuid
from dataclasses import dataclass, asdict, field
from datetime import datetime, timezone
from typing import Dict, List, Optional, Set

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
                    pass  # Client didn't ack in time — will catch up on reconnect
                finally:
                    self._pending_acks.pop(ack_key, None)

            return True
        except Exception:
            return False

    def acknowledge(self, conversation_id: str, sequence: int) -> None:
        """Client acknowledged receiving an event at this sequence number."""
        self.last_acked_sequence[conversation_id] = sequence
        ack_key = f"{conversation_id}:{sequence}"
        pending = self._pending_acks.get(ack_key)
        if pending:
            pending.set()


class SequencedConnectionManager:
    """
    Enhanced ConnectionManager with per-conversation event sequencing.

    Clients subscribe to specific conversations and receive ordered events.
    Events require client acknowledgment to confirm delivery.
    """

    def __init__(self):
        self._clients: Dict[str, ClientSession] = {}
        self._conversation_sequences: Dict[str, int] = {}

    async def connect(self, websocket: WebSocket, client_id: str) -> None:
        await websocket.accept()
        self._clients[client_id] = ClientSession(websocket, client_id)

    def disconnect(self, client_id: str) -> None:
        self._clients.pop(client_id, None)

    def subscribe(self, client_id: str, conversation_id: str) -> None:
        """Subscribe client to receive events for a conversation."""
        client = self._clients.get(client_id)
        if client:
            client.subscribed_conversations.add(conversation_id)

    def unsubscribe(self, client_id: str, conversation_id: str) -> None:
        client = self._clients.get(client_id)
        if client:
            client.subscribed_conversations.discard(conversation_id)

    def acknowledge(self, client_id: str, conversation_id: str, sequence: int) -> None:
        client = self._clients.get(client_id)
        if client:
            client.acknowledge(conversation_id, sequence)

    def _next_sequence(self, conversation_id: str) -> int:
        seq = self._conversation_sequences.get(conversation_id, 0) + 1
        self._conversation_sequences[conversation_id] = seq
        return seq

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

    async def broadcast_global(self, event_type: str, data: dict) -> None:
        """Broadcast non-sequenced event to all connected clients (e.g., conversation list refresh)."""
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

    # ── Backward-compatibility shim (used by telegram_service) ──────────────

    async def broadcast_json(self, data: dict) -> None:
        """Legacy broadcast used by existing code. Emits as global non-sequenced event."""
        event_type = data.get("type", "event")
        payload = data.get("data", data)
        conversation_id = payload.get("conversation_id") if isinstance(payload, dict) else None

        if conversation_id:
            await self.broadcast_to_conversation(conversation_id, event_type, payload)
        else:
            await self.broadcast_global(event_type, payload)


manager = SequencedConnectionManager()
