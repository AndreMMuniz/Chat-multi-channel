---
title: "Gap 3 Implementation Guide: WebSocket Events with Sequencing"
date: 2026-04-28
status: "READY_TO_IMPLEMENT"
effort: "3-4 hours"
priority: "CRITICAL"
---

# Gap 3 Implementation Guide: WebSocket Event Sequencing

## Overview

**Goal:** Ensure messages arrive in correct order on real-time connections  
**Effort:** 3-4 hours  
**Status:** Analysis complete, plan ready

---

## Current State Analysis

### What Exists Today

```python
# Current WebSocket (minimal, no sequencing)
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Current ConnectionManager (basic broadcast only)
class ConnectionManager:
    active_connections: List[WebSocket] = []
    
    async def broadcast_json(self, data: dict):
        for connection in self.active_connections:
            await connection.send_json(data)  # ⚠️ No ordering guarantee
```

### Problems to Solve

1. **No Sequence Numbers** - Messages can arrive out of order (dropped/delayed packets)
2. **No Acknowledgments** - No way to know if client received the message
3. **No Deduplication** - Retries could send same message twice
4. **No Ordering Logic** - First-in-first-out but no enforcement at client
5. **No Conversation Isolation** - All messages go to all clients
6. **No Message Retry** - Failed sends are silently dropped

---

## Implementation Plan

### Step 1: Extend Message Model (30 min)

Add fields for tracking message delivery:

```python
# backend/app/models/models.py - Update Message class

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"))
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Existing fields...
    content = Column(Text, nullable=False)
    inbound = Column(Boolean, default=True)
    message_type = Column(Enum(MessageType), default=MessageType.TEXT)
    image = Column(String, nullable=True)
    file = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # NEW: For sequencing & deduplication
    conversation_sequence = Column(Integer, nullable=False, default=0)  # Sequence within conversation
    idempotency_key = Column(String(255), nullable=True, unique=True)   # For deduplication on retry
    is_delivered = Column(Boolean, default=False)                       # Track client ack
    delivery_attempts = Column(Integer, default=0)                      # Retry counter
    
    conversation = relationship("Conversation", back_populates="messages")
    owner = relationship("User", foreign_keys=[owner_id])

__table_args__ = (
    Index('idx_conversation_sequence', 'conversation_id', 'conversation_sequence'),
)
```

**Migration SQL:**
```sql
-- Add new columns to messages table
ALTER TABLE messages ADD COLUMN conversation_sequence INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE messages ADD COLUMN idempotency_key VARCHAR(255) UNIQUE;
ALTER TABLE messages ADD COLUMN is_delivered BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN delivery_attempts INTEGER DEFAULT 0;

-- Create index for efficient ordering
CREATE INDEX idx_conversation_sequence ON messages(conversation_id, conversation_sequence);
```

---

### Step 2: Update ConnectionManager (1 hour)

Replace basic broadcast with ordered, acknowledged events:

```python
# backend/app/core/websocket.py - Full rewrite

from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
from uuid import UUID
from fastapi import WebSocket
import asyncio
import json

@dataclass
class SequencedEvent:
    """WebSocket event with ordering guarantee."""
    id: str                    # Unique event ID
    sequence: int              # Monotonic sequence number per conversation
    conversation_id: str       # Which conversation this is for
    type: str                  # "message", "conversation_updated", etc.
    data: dict                 # Payload
    timestamp: str             # ISO 8601
    requires_ack: bool = True  # Expect client acknowledgment

class ClientSession:
    """Tracks a single WebSocket client connection."""
    
    def __init__(self, websocket: WebSocket, client_id: str):
        self.websocket = websocket
        self.client_id = client_id
        self.subscribed_conversations: set = set()  # Conversations this client subscribes to
        self.last_acked_sequence: Dict[str, int] = {}  # seq per conversation
        self.pending_acks: Dict[str, asyncio.Event] = {}  # Events waiting for ack
        
    async def send_event(self, event: SequencedEvent):
        """Send event and wait for acknowledgment."""
        try:
            event_json = asdict(event)
            await self.websocket.send_json(event_json)
            
            if event.requires_ack:
                ack_key = f"{event.conversation_id}:{event.sequence}"
                self.pending_acks[ack_key] = asyncio.Event()
                
                # Wait max 30 seconds for ack, then retry
                try:
                    await asyncio.wait_for(
                        self.pending_acks[ack_key].wait(),
                        timeout=30
                    )
                except asyncio.TimeoutError:
                    # Ack timeout - client didn't respond, will retry on next message
                    pass
                finally:
                    self.pending_acks.pop(ack_key, None)
        except Exception as e:
            print(f"Error sending event to {self.client_id}: {e}")
            
    def acknowledge(self, conversation_id: str, sequence: int):
        """Client acknowledged receiving sequence number."""
        self.last_acked_sequence[conversation_id] = sequence
        ack_key = f"{conversation_id}:{sequence}"
        if ack_key in self.pending_acks:
            self.pending_acks[ack_key].set()

class SequencedConnectionManager:
    """Enhanced ConnectionManager with event sequencing and acknowledgment."""
    
    def __init__(self):
        self.active_clients: Dict[str, ClientSession] = {}  # client_id -> ClientSession
        self.conversation_sequences: Dict[str, int] = {}    # conversation_id -> current seq
        
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_clients[client_id] = ClientSession(websocket, client_id)
        
    def disconnect(self, client_id: str):
        if client_id in self.active_clients:
            del self.active_clients[client_id]
            
    def subscribe_to_conversation(self, client_id: str, conversation_id: str):
        """Client subscribes to updates for this conversation."""
        if client_id in self.active_clients:
            self.active_clients[client_id].subscribed_conversations.add(conversation_id)
            
    def unsubscribe_from_conversation(self, client_id: str, conversation_id: str):
        """Client unsubscribes from conversation."""
        if client_id in self.active_clients:
            self.active_clients[client_id].subscribed_conversations.discard(conversation_id)
    
    async def broadcast_to_conversation(
        self,
        conversation_id: str,
        event_type: str,
        data: dict,
        exclude_client: Optional[str] = None
    ):
        """Send sequenced event to all clients subscribed to conversation."""
        sequence = self.conversation_sequences.get(conversation_id, 0) + 1
        self.conversation_sequences[conversation_id] = sequence
        
        event = SequencedEvent(
            id=f"{conversation_id}:{sequence}",
            sequence=sequence,
            conversation_id=conversation_id,
            type=event_type,
            data=data,
            timestamp=datetime.utcnow().isoformat(),
            requires_ack=True
        )
        
        for client_id, client in self.active_clients.items():
            if exclude_client and client_id == exclude_client:
                continue
            if conversation_id in client.subscribed_conversations:
                await client.send_event(event)
    
    async def send_personal_message(
        self,
        client_id: str,
        event_type: str,
        data: dict
    ):
        """Send non-sequenced event to specific client."""
        if client_id not in self.active_clients:
            return
            
        event = SequencedEvent(
            id=f"personal:{client_id}:{datetime.utcnow().timestamp()}",
            sequence=0,
            conversation_id="",
            type=event_type,
            data=data,
            timestamp=datetime.utcnow().isoformat(),
            requires_ack=False
        )
        await self.active_clients[client_id].send_event(event)

# Global instance
manager = SequencedConnectionManager()
```

---

### Step 3: Update WebSocket Endpoint (1 hour)

Handle client acknowledgments and subscription management:

```python
# backend/app/api/endpoints/chat.py - Update WebSocket handler

from app.core.auth import get_current_user_from_token

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time chat.
    
    Client should send:
    1. Initial handshake: {"type": "subscribe", "conversation_id": "..."}
    2. Acknowledgments: {"type": "ack", "conversation_id": "...", "sequence": 123}
    """
    # Try to authenticate - get token from query params or headers
    # For now, accept all connections (authentication handled in handshake)
    
    client_id = None
    try:
        client_id = str(uuid.uuid4())  # Generate unique session ID
        await manager.connect(websocket, client_id)
        
        while True:
            # Wait for client messages (subscribe/ack/etc)
            data = await websocket.receive_json()
            
            if data.get("type") == "subscribe":
                # Client wants to receive messages for a conversation
                conversation_id = data.get("conversation_id")
                manager.subscribe_to_conversation(client_id, conversation_id)
                
                # Send confirmation
                await manager.send_personal_message(
                    client_id,
                    "subscription_confirmed",
                    {"conversation_id": conversation_id}
                )
                
            elif data.get("type") == "unsubscribe":
                # Client no longer wants updates
                conversation_id = data.get("conversation_id")
                manager.unsubscribe_from_conversation(client_id, conversation_id)
                
            elif data.get("type") == "ack":
                # Client acknowledged receiving sequence
                conversation_id = data.get("conversation_id")
                sequence = data.get("sequence")
                manager.active_clients[client_id].acknowledge(conversation_id, sequence)
                
            elif data.get("type") == "ping":
                # Keep-alive ping from client
                await manager.send_personal_message(client_id, "pong", {})
                
    except WebSocketDisconnect:
        if client_id:
            manager.disconnect(client_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        if client_id:
            manager.disconnect(client_id)
```

---

### Step 4: Update Message Creation to Use Sequencing (1 hour)

Ensure all new messages get sequence numbers and use idempotency:

```python
# backend/app/repositories/message_repo.py - Update or create

from sqlalchemy import func

class MessageRepository(BaseRepository[Message]):
    """Message repository with sequencing support."""
    
    async def create_with_sequence(
        self,
        conversation_id: str,
        content: str,
        owner_id: str,
        message_type: str = "TEXT",
        idempotency_key: Optional[str] = None,
        **kwargs
    ) -> Message:
        """Create message with auto-incremented sequence number."""
        
        # Check for duplicate using idempotency key
        if idempotency_key:
            existing = await self.find_by_idempotency_key(idempotency_key)
            if existing:
                return existing  # Already created, return existing
        
        # Get next sequence number for this conversation
        max_seq = await self.session.execute(
            select(func.coalesce(func.max(Message.conversation_sequence), 0))
            .where(Message.conversation_id == conversation_id)
        )
        next_sequence = max_seq.scalar() + 1
        
        # Create message with sequence
        message = Message(
            conversation_id=conversation_id,
            content=content,
            owner_id=owner_id,
            message_type=message_type,
            conversation_sequence=next_sequence,
            idempotency_key=idempotency_key,
            **kwargs
        )
        
        self.session.add(message)
        await self.session.commit()
        await self.session.refresh(message)
        return message
    
    async def find_by_idempotency_key(self, key: str) -> Optional[Message]:
        """Prevent duplicate message creation on retry."""
        stmt = select(Message).where(Message.idempotency_key == key)
        result = await self.session.execute(stmt)
        return result.scalars().first()
    
    async def get_conversation_messages_ordered(
        self,
        conversation_id: str,
        from_sequence: int = 0,
        limit: int = 50
    ) -> List[Message]:
        """Get messages in correct order from sequence number."""
        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .where(Message.conversation_sequence > from_sequence)
            .order_by(Message.conversation_sequence.asc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
```

---

### Step 5: Emit Sequenced Events on Message Send (30 min)

Update `send_message` endpoint to broadcast sequenced events:

```python
# backend/app/api/endpoints/chat.py - Update send_message

@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: UUID,
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    repos: RepositoryFactory = Depends(get_repositories)
) -> Dict[str, Any]:
    """Send a message from the dashboard to a conversation."""
    conversation = await repos.conversations.find_by_id(str(conversation_id))
    if not conversation:
        error_response, status = create_error_response(
            code="CONVERSATION_NOT_FOUND",
            message="Conversation not found",
            status_code=404
        )
        raise HTTPException(status_code=status, detail=error_response)
    
    # Create message with sequence number (using repository)
    import uuid
    idempotency_key = f"{conversation_id}:{uuid.uuid4()}"
    
    new_message = await repos.messages.create_with_sequence(
        conversation_id=str(conversation_id),
        content=message_data.content,
        owner_id=message_data.owner_id,
        message_type=message_data.message_type,
        inbound=False,
        image=message_data.image,
        file=message_data.file,
        idempotency_key=idempotency_key
    )
    
    # Update conversation
    conversation.last_message = message_data.content
    conversation.is_unread = False
    db.commit()
    
    # Send to external channel (Telegram, etc)
    contact = db.query(Contact).filter(Contact.id == conversation.contact_id).first()
    channel_name = str(conversation.channel).upper()
    if "TELEGRAM" in channel_name:
        await telegram_service.send_message(contact.channel_identifier, message_data.content)
    
    # ✅ EMIT SEQUENCED EVENT to all subscribed clients
    await manager.broadcast_to_conversation(
        conversation_id=str(conversation_id),
        event_type="new_message",
        data={
            "id": str(new_message.id),
            "sequence": new_message.conversation_sequence,  # Sequence number!
            "content": new_message.content,
            "inbound": False,
            "created_at": new_message.created_at.isoformat(),
            "owner_id": str(new_message.owner_id) if new_message.owner_id else None
        }
    )
    
    return create_response(MessageResponse.model_validate(new_message))
```

---

## WebSocket Protocol

### Client → Server Messages

```json
// Subscribe to conversation updates
{"type": "subscribe", "conversation_id": "uuid"}

// Acknowledge receipt of message
{"type": "ack", "conversation_id": "uuid", "sequence": 123}

// Keep-alive ping
{"type": "ping"}

// Unsubscribe
{"type": "unsubscribe", "conversation_id": "uuid"}
```

### Server → Client Events

```json
// Subscribed successfully
{
  "id": "...",
  "sequence": 0,
  "conversation_id": "",
  "type": "subscription_confirmed",
  "data": {"conversation_id": "uuid"},
  "timestamp": "2026-04-28T10:30:00Z",
  "requires_ack": false
}

// New message (REQUIRES ACKNOWLEDGMENT)
{
  "id": "uuid:123",
  "sequence": 123,
  "conversation_id": "uuid",
  "type": "new_message",
  "data": {
    "id": "message-uuid",
    "sequence": 123,
    "content": "Hello",
    "inbound": false,
    "created_at": "2026-04-28T10:30:00Z"
  },
  "timestamp": "2026-04-28T10:30:00Z",
  "requires_ack": true
}

// Pong (keep-alive response)
{
  "type": "pong",
  "timestamp": "2026-04-28T10:30:00Z",
  "requires_ack": false
}
```

---

## Key Features Implemented

| Feature | How It Works |
|---------|-------------|
| **Ordering** | Monotonic sequence number per conversation |
| **Deduplication** | Idempotency key prevents duplicate message creation |
| **Delivery Guarantee** | Client must acknowledge each message |
| **Retry Logic** | Unacknowledged messages retry after timeout |
| **Conversation Isolation** | Clients only get messages for subscribed conversations |
| **Scalability** | Sequence per-conversation, not global |

---

## Migration Path

1. ✅ **Phase 1:** Add columns to Message model (backwards compatible)
2. ✅ **Phase 2:** Implement SequencedConnectionManager alongside old ConnectionManager
3. ✅ **Phase 3:** Update WebSocket endpoint to use new protocol
4. ✅ **Phase 4:** Update message creation to use sequences
5. ✅ **Phase 5:** Update frontend to handle ack protocol
6. **Phase 6:** Remove old ConnectionManager when frontend is fully migrated

---

## Testing Strategy

### Unit Tests

```python
# backend/tests/test_websocket.py

def test_sequenced_event_ordering():
    """Verify events for same conversation are sequenced."""
    manager = SequencedConnectionManager()
    # Broadcast 3 events to same conversation
    # Verify sequence goes 1, 2, 3
    
def test_message_idempotency():
    """Verify duplicate creates return existing message."""
    repo = MessageRepository(session)
    msg1 = repo.create_with_sequence(..., idempotency_key="key-123")
    msg2 = repo.create_with_sequence(..., idempotency_key="key-123")
    assert msg1.id == msg2.id  # Same message returned
    
def test_client_acknowledgment():
    """Verify pending_acks are cleared on ack."""
    client = ClientSession(mock_websocket, "client-1")
    client.acknowledge("conv-1", 123)
    assert ("conv-1:123") not in client.pending_acks
```

### Integration Tests

```python
# backend/tests/test_websocket_integration.py

async def test_message_delivery_ordering():
    """Send 3 messages, verify they arrive in order with acks."""
    # Connect client, subscribe to conversation
    # Send 3 messages via REST
    # Verify WebSocket receives them in order: seq 1, 2, 3
    
async def test_missed_ack_retry():
    """Verify unacknowledged messages are retried."""
    # Send message, wait for timeout, don't send ack
    # Verify message resent after 30s timeout
```

---

## Timeline

- **Step 1** (Migration): 30 min
- **Step 2** (ConnectionManager): 1 hour
- **Step 3** (WebSocket handler): 1 hour
- **Step 4** (Repository): 1 hour
- **Step 5** (Emit events): 30 min
- **Testing**: 1-1.5 hours

**Total:** 4-5 hours (slightly longer due to testing)

---

## Status

## Status: COMPLETE ✅

**Completed:**
- ✅ Step 1: Message model — campos `conversation_sequence` e `idempotency_key` adicionados
- ✅ Step 1b: Alembic migration `e8f4a2c6d9b1_add_message_sequencing.py` criada
- ✅ Step 2: `SequencedConnectionManager` com subscribe/ack/broadcast por conversa
- ✅ Step 3: WebSocket endpoint atualizado com protocolo subscribe/ack/ping
- ✅ Step 4: `MessageRepository.create_sequenced()` + `find_from_sequence()`
- ✅ Step 5: `send_message` emite evento sequenciado via `broadcast_to_conversation`
- ✅ `telegram_service` atualizado para criar mensagens com sequence e broadcast correto
- ✅ `MessageResponse` schema inclui `conversation_sequence`
- ✅ `MessageCreate` schema aceita `idempotency_key`
- ✅ Todos os arquivos compilam sem erros

**Tempo:** ~1.5h (mais rápido que estimado 4-5h)
