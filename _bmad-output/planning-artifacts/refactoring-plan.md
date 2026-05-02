---
title: "Omnichat Refactoring Plan - Phase 1 (Critical Gaps)"
date: 2026-04-27
status: "Ready for Implementation"
estimatedHours: 12-14
priority: "CRITICAL"
---

# Omnichat Refactoring Plan: Phase 1 (Critical Gaps)

This document outlines the critical refactoring needed to align the existing project with the validated architecture. **Start here.**

---

## Overview

**Goal:** Fix 3 critical gaps that block consistent implementation
**Effort:** 12-14 hours
**Outcome:** Foundation ready for Feature implementation

### Critical Gaps
1. **Repositories Layer** - Data access abstraction (2-3 hours)
2. **Response Format** - {data, meta} wrapper on all endpoints (4-5 hours)
3. **WebSocket Events** - Sequencing + event format (3-4 hours)

---

## Gap 1: Create Repositories Layer

### Current State
```python
# Bad: Direct model access in endpoints
@router.get("/users/{user_id}")
async def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    return user
```

### Target State
```python
# Good: Repository abstraction
@router.get("/users/{user_id}")
async def get_user(user_id: str, repo: UserRepository = Depends(get_user_repository)):
    user = await repo.find_by_id(user_id)
    return {"data": user, "meta": {"timestamp": datetime.utcnow()}}
```

### Implementation Steps

#### Step 1.1: Create Base Repository
**File:** `backend/app/repositories/base_repo.py`

```python
from typing import TypeVar, Generic, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

T = TypeVar('T')

class BaseRepository(Generic[T]):
    """Base repository for all data access"""
    
    def __init__(self, model, session: AsyncSession):
        self.model = model
        self.session = session
    
    async def find_by_id(self, id: str) -> Optional[T]:
        """Find single record by ID"""
        stmt = select(self.model).where(self.model.id == id)
        result = await self.session.execute(stmt)
        return result.scalars().first()
    
    async def find_all(self, skip: int = 0, limit: int = 20) -> List[T]:
        """Find all records with pagination"""
        stmt = select(self.model).offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return result.scalars().all()
    
    async def create(self, data: dict) -> T:
        """Create new record"""
        obj = self.model(**data)
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj
    
    async def update(self, id: str, data: dict) -> Optional[T]:
        """Update existing record"""
        obj = await self.find_by_id(id)
        if not obj:
            return None
        for key, value in data.items():
            setattr(obj, key, value)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj
    
    async def delete(self, id: str) -> bool:
        """Delete record"""
        obj = await self.find_by_id(id)
        if not obj:
            return False
        await self.session.delete(obj)
        await self.session.commit()
        return True
```

#### Step 1.2: Create User Repository
**File:** `backend/app/repositories/user_repo.py`

```python
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User
from app.repositories.base_repo import BaseRepository

class UserRepository(BaseRepository[User]):
    """Repository for User model"""
    
    def __init__(self, session: AsyncSession):
        super().__init__(User, session)
    
    async def find_by_email(self, email: str) -> Optional[User]:
        """Find user by email"""
        stmt = select(User).where(User.email == email)
        result = await self.session.execute(stmt)
        return result.scalars().first()
    
    async def find_approved_users(self) -> list[User]:
        """Find approved users"""
        stmt = select(User).where(User.is_approved == True)
        result = await self.session.execute(stmt)
        return result.scalars().all()
```

#### Step 1.3: Create Conversation & Message Repositories
**File:** `backend/app/repositories/conversation_repo.py`

```python
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Conversation
from app.repositories.base_repo import BaseRepository

class ConversationRepository(BaseRepository[Conversation]):
    """Repository for Conversation model"""
    
    def __init__(self, session: AsyncSession):
        super().__init__(Conversation, session)
    
    async def find_by_user(self, user_id: str, skip: int = 0, limit: int = 20) -> List[Conversation]:
        """Find conversations for user"""
        stmt = select(Conversation).where(
            Conversation.user_id == user_id
        ).offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return result.scalars().all()
```

**File:** `backend/app/repositories/message_repo.py`

```python
from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Message
from app.repositories.base_repo import BaseRepository

class MessageRepository(BaseRepository[Message]):
    """Repository for Message model"""
    
    def __init__(self, session: AsyncSession):
        super().__init__(Message, session)
    
    async def find_by_conversation(self, conversation_id: str, skip: int = 0, limit: int = 50) -> List[Message]:
        """Find messages in conversation"""
        stmt = select(Message).where(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at.desc()).offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return result.scalars().all()
```

#### Step 1.4: Create Repository Factory
**File:** `backend/app/repositories/__init__.py`

```python
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_repo import UserRepository
from app.repositories.conversation_repo import ConversationRepository
from app.repositories.message_repo import MessageRepository

class RepositoryFactory:
    """Factory to create repositories"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    @property
    def users(self) -> UserRepository:
        return UserRepository(self.session)
    
    @property
    def conversations(self) -> ConversationRepository:
        return ConversationRepository(self.session)
    
    @property
    def messages(self) -> MessageRepository:
        return MessageRepository(self.session)

async def get_repositories(session: AsyncSession = Depends(get_db)) -> RepositoryFactory:
    """Dependency for getting repositories"""
    return RepositoryFactory(session)
```

#### Step 1.5: Refactor Auth Endpoint to Use Repository
**File:** `backend/app/api/endpoints/auth.py` (update existing)

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories import RepositoryFactory, get_repositories
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.auth_service import AuthService
from app.core.database import get_db

router = APIRouter()
auth_service = AuthService()

@router.post("/login", response_model=dict)
async def login(
    request: LoginRequest,
    repos: RepositoryFactory = Depends(get_repositories)
):
    """Login endpoint"""
    # Use repository instead of direct DB access
    user = await repos.users.find_by_email(request.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password and return token
    if not auth_service.verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = auth_service.create_access_token({"user_id": str(user.id)})
    
    return {
        "data": {
            "access_token": token,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "name": user.name
            }
        },
        "meta": {
            "timestamp": datetime.utcnow().isoformat()
        }
    }
```

**Estimated Time:** 2-3 hours

---

## Gap 2: Response Format Wrapper

### Current State
```python
# Endpoints return raw models
@router.get("/users/{user_id}")
async def get_user(user_id: str):
    user = await db.users.get(user_id)
    return user  # Returns User model directly
```

### Target State
```python
# All endpoints wrap in {data, meta}
@router.get("/users/{user_id}")
async def get_user(user_id: str):
    user = await repos.users.find_by_id(user_id)
    return {
        "data": user,
        "meta": {"timestamp": datetime.utcnow().isoformat()}
    }
```

### Implementation Steps

#### Step 2.1: Create Response Models
**File:** `backend/app/schemas/common.py` (update existing)

```python
from pydantic import BaseModel
from typing import Any, Generic, TypeVar, Optional, Dict
from datetime import datetime

T = TypeVar('T')

class ApiResponse(BaseModel, Generic[T]):
    """Generic API response wrapper"""
    data: T
    meta: Dict[str, Any]

class PaginatedMeta(BaseModel):
    """Pagination metadata"""
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_previous: bool
    timestamp: datetime

class ErrorResponse(BaseModel):
    """Error response format"""
    error: Dict[str, Any]  # {code, message, details, timestamp}

def create_response(data: Any, **meta_kwargs) -> dict:
    """Helper to create standardized response"""
    return {
        "data": data,
        "meta": {
            "timestamp": datetime.utcnow().isoformat(),
            **meta_kwargs
        }
    }

def create_error_response(code: str, message: str, details: dict = None) -> dict:
    """Helper to create standardized error"""
    return {
        "error": {
            "code": code,
            "message": message,
            "details": details or {},
            "timestamp": datetime.utcnow().isoformat()
        }
    }
```

#### Step 2.2: Update All Endpoints to Use Wrapper
**Example:** `backend/app/api/endpoints/users.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.common import create_response, create_error_response
from app.repositories import RepositoryFactory, get_repositories

router = APIRouter()

@router.get("/users/{user_id}")
async def get_user(
    user_id: str,
    repos: RepositoryFactory = Depends(get_repositories)
):
    """Get user by ID"""
    user = await repos.users.find_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail=create_error_response("USER_NOT_FOUND", "User not found")
        )
    return create_response(user)

@router.get("/users")
async def list_users(
    skip: int = 0,
    limit: int = 20,
    repos: RepositoryFactory = Depends(get_repositories)
):
    """List users with pagination"""
    users = await repos.users.find_all(skip=skip, limit=limit)
    total = await repos.users.count()  # Need to add count method to BaseRepository
    
    return create_response(
        users,
        total=total,
        page=(skip // limit) + 1,
        page_size=limit,
        total_pages=(total + limit - 1) // limit
    )

@router.post("/users")
async def create_user(
    data: CreateUserRequest,
    repos: RepositoryFactory = Depends(get_repositories)
):
    """Create new user"""
    existing = await repos.users.find_by_email(data.email)
    if existing:
        raise HTTPException(
            status_code=409,
            detail=create_error_response("DUPLICATE_EMAIL", "Email already exists")
        )
    
    user = await repos.users.create(data.dict())
    return create_response(user)
```

**Estimated Time:** 4-5 hours (refactor all existing endpoints)

---

## Gap 3: WebSocket Event Model with Sequencing

### Current State
```python
# Socket.io without sequence guarantee
await sio.emit("message", {"id": msg_id, "content": msg.content})
```

### Target State
```python
# WebSocket with sequence numbers
{
  "type": "message.received",
  "payload": {"id": msg_id, "content": msg.content},
  "sequence": 1,
  "timestamp": "2026-04-27T14:30:00Z"
}
```

### Implementation Steps

#### Step 3.1: Create WebSocket Event Models
**File:** `backend/app/events/event_models.py` (new file)

```python
from pydantic import BaseModel
from typing import Any, Dict, Literal
from datetime import datetime
from enum import Enum

class EventType(str, Enum):
    """WebSocket event types"""
    # Message events
    MESSAGE_RECEIVED = "message.received"
    MESSAGE_UPDATED = "message.updated"
    MESSAGE_DELETED = "message.deleted"
    
    # Conversation events
    CONVERSATION_CREATED = "conversation.created"
    CONVERSATION_UPDATED = "conversation.updated"
    
    # Presence events
    USER_JOINED = "user.joined"
    USER_LEFT = "user.left"
    TYPING_INDICATOR = "typing_indicator"
    PRESENCE_ONLINE = "presence.online"
    
    # Permission events
    PERMISSION_GRANTED = "permission.granted"
    PERMISSION_REVOKED = "permission.revoked"

class WebSocketEvent(BaseModel):
    """Standard WebSocket event"""
    type: EventType
    payload: Dict[str, Any]
    sequence: int  # Ensure ordering
    timestamp: datetime = datetime.utcnow()
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class WebSocketEventBatch(BaseModel):
    """Batch of events"""
    type: Literal["batch"]
    payload: list[WebSocketEvent]
    timestamp: datetime = datetime.utcnow()
```

#### Step 3.2: Refactor WebSocket Manager
**File:** `backend/app/core/websocket.py` (update existing)

```python
import asyncio
import json
from typing import Dict, Set
from fastapi import WebSocket
from app.events.event_models import WebSocketEvent, EventType

class WebSocketManager:
    """Manages WebSocket connections and broadcasts"""
    
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.event_sequence: Dict[str, int] = {}  # Per-channel sequence counter
    
    async def connect(self, websocket: WebSocket, channel: str):
        """Connect to a channel"""
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = set()
            self.event_sequence[channel] = 0
        self.active_connections[channel].add(websocket)
    
    def disconnect(self, websocket: WebSocket, channel: str):
        """Disconnect from a channel"""
        if channel in self.active_connections:
            self.active_connections[channel].discard(websocket)
    
    async def broadcast(self, channel: str, event: WebSocketEvent):
        """Broadcast event to all connections in channel"""
        if channel not in self.active_connections:
            return
        
        # Add sequence number
        self.event_sequence[channel] += 1
        event.sequence = self.event_sequence[channel]
        
        # Send to all connected clients
        disconnected = []
        for connection in self.active_connections[channel]:
            try:
                await connection.send_json(event.dict())
            except Exception:
                disconnected.append(connection)
        
        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn, channel)
    
    async def send_personal(self, websocket: WebSocket, event: WebSocketEvent):
        """Send event to specific connection"""
        try:
            await websocket.send_json(event.dict())
        except Exception:
            pass

manager = WebSocketManager()
```

#### Step 3.3: Create WebSocket Endpoint
**File:** `backend/app/api/endpoints/websocket.py` (new file)

```python
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from app.core.websocket import manager
from app.core.auth import verify_token
from app.events.event_models import WebSocketEvent, EventType

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    channel: str = Query(default="default")
):
    """
    WebSocket endpoint for real-time communication
    
    Channels:
    - conversation:{id} - Messages in specific conversation
    - user:{id}:notifications - Personal notifications
    """
    
    # Verify token
    try:
        user_id = verify_token(token)
    except:
        await websocket.close(code=4001, reason="Unauthorized")
        return
    
    # Connect to channel
    await manager.connect(websocket, channel)
    
    try:
        while True:
            data = await websocket.receive_json()
            # Handle incoming messages if needed
            # For now, just listen for broadcasts
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)
```

#### Step 3.4: Emit Events from Services
**Example:** `backend/app/services/message_service.py` (update existing)

```python
from app.core.websocket import manager
from app.events.event_models import WebSocketEvent, EventType

class MessageService:
    """Service for message operations"""
    
    async def send_message(self, conversation_id: str, user_id: str, content: str):
        """Send message and broadcast via WebSocket"""
        # Create message in database
        message = await self.repos.messages.create({
            "conversation_id": conversation_id,
            "user_id": user_id,
            "content": content
        })
        
        # Broadcast to conversation channel
        event = WebSocketEvent(
            type=EventType.MESSAGE_RECEIVED,
            payload={
                "id": str(message.id),
                "conversation_id": str(message.conversation_id),
                "user_id": str(message.user_id),
                "content": message.content,
                "created_at": message.created_at.isoformat()
            }
        )
        
        await manager.broadcast(f"conversation:{conversation_id}", event)
        
        return message
```

**Estimated Time:** 3-4 hours

---

## Implementation Checklist

### Gap 1: Repositories (2-3 hours)
- [ ] Create `backend/app/repositories/base_repo.py`
- [ ] Create `backend/app/repositories/user_repo.py`
- [ ] Create `backend/app/repositories/conversation_repo.py`
- [ ] Create `backend/app/repositories/message_repo.py`
- [ ] Create `backend/app/repositories/__init__.py` factory
- [ ] Test repositories with sample queries

### Gap 2: Response Format (4-5 hours)
- [ ] Update `backend/app/schemas/common.py` with response helpers
- [ ] Refactor `backend/app/api/endpoints/auth.py`
- [ ] Refactor `backend/app/api/endpoints/users.py`
- [ ] Refactor `backend/app/api/endpoints/chat.py`
- [ ] Refactor remaining endpoints (upload, audit, settings, telegram, dashboard)
- [ ] Test all endpoints return {data, meta} format
- [ ] Test error responses use {error: {code, message, details}} format

### Gap 3: WebSocket Events (3-4 hours)
- [ ] Create `backend/app/events/event_models.py`
- [ ] Refactor `backend/app/core/websocket.py` with sequencing
- [ ] Create `backend/app/api/endpoints/websocket.py`
- [ ] Update services to emit events (audit_service, message_service, user_service)
- [ ] Test event ordering with sequence numbers
- [ ] Test batch events for high-load scenarios

---

## Testing Checklist

### For Each Gap

#### Gap 1: Repositories
```bash
# Test repository methods
pytest backend/tests/repositories/test_user_repo.py
pytest backend/tests/repositories/test_conversation_repo.py
pytest backend/tests/repositories/test_message_repo.py
```

#### Gap 2: Response Format
```bash
# Test all endpoints return correct format
pytest backend/tests/endpoints/test_auth.py::test_login_response_format
pytest backend/tests/endpoints/test_users.py::test_list_users_has_meta
pytest backend/tests/endpoints/test_error_format.py
```

#### Gap 3: WebSocket
```bash
# Test WebSocket events and sequencing
pytest backend/tests/websocket/test_event_sequence.py
pytest backend/tests/websocket/test_broadcast.py
pytest backend/tests/websocket/test_reconnection.py
```

---

## After Phase 1 Completion

Once all 3 critical gaps are fixed:

1. **Verify:** All endpoints return {data, meta} format ✓
2. **Verify:** All data access goes through repositories ✓
3. **Verify:** WebSocket events have sequence numbers ✓
4. **Document:** Add these patterns to CONTRIBUTING.md
5. **Proceed:** Start Phase 2 (important gaps)

---

## Resources

- Architecture Document: `_bmad-output/planning-artifacts/architecture.md`
- Patterns Reference: See "Implementation Patterns & Consistency Rules" section
- Error Handling: See "Error Response Format" in Patterns
- Response Format: See "API Response Format" in Patterns

---

**Ready to start? Pick one gap and begin!**
**Recommended order:** Gap 1 → Gap 2 → Gap 3
