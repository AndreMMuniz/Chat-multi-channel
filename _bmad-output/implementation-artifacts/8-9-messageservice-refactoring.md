# Story 8.9: MessageService Refactoring

**Status:** review
**Epic:** 8 — Production Hardening
**Story Points:** 5
**Priority:** Nice-to-have
**Created:** 2026-05-01

---

## User Story

**As a developer,** I want `MessageService` split into focused sub-services so that each file respects SRP, is under 150 lines, and is easier to test and maintain independently.

---

## Background & Context

`backend/app/services/message_service.py` is currently **274 lines** with 5 distinct responsibilities:

1. **Message creation** — sequencing, idempotency, DB persistence (lines 27-83)
2. **Channel dispatch** — sends via ChannelService, tracks delivery status, alert tasks (lines 87-133)
3. **WebSocket broadcast** — fan-out via `manager` (lines 137-155)
4. **Retry logic** — orchestrates dispatch + broadcast for failed messages (lines 159-181)
5. **Flow orchestration** — `send_from_dashboard`, `receive_from_channel`, agent queue enqueue (lines 185-274)

**Key constraint — ALL 8 callers use `MessageService` directly. Public API must not change:**
- `backend/app/api/endpoints/chat.py:130,271`
- `backend/app/services/email_service.py:145`
- `backend/app/services/sms_service.py:90`
- `backend/app/services/telegram_service.py:60`
- `backend/app/services/whatsapp_service.py:121`
- `backend/src/worker/processor.py:141`
- `backend/tests/test_message_service.py:9`

---

## Design

`MessageService` stays as a **thin orchestrating facade**. All its public methods remain with identical signatures but delegate to focused sub-services. No caller needs to change.

### Decomposition

| File | Class | Responsibility | Est. Lines |
|------|-------|----------------|------------|
| `message_creation_service.py` | `MessageCreationService` | DB persistence, sequencing, idempotency | ~55 |
| `message_delivery_service.py` | `DeliveryService` | Channel dispatch, delivery status, alert tasks | ~55 |
| `message_broadcast_service.py` | `BroadcastService` | WebSocket fan-out | ~25 |
| `message_service.py` | `MessageService` (orchestrator) | Delegation + `send_from_dashboard`, `receive_from_channel`, retry, enqueue | ~95 |

---

## Files to Create / Modify

| File | Action |
|------|--------|
| `backend/app/services/message_creation_service.py` | **CREATE** |
| `backend/app/services/message_delivery_service.py` | **CREATE** |
| `backend/app/services/message_broadcast_service.py` | **CREATE** |
| `backend/app/services/message_service.py` | **REWRITE** |

**Do NOT modify any caller file.** No import changes anywhere else.

---

## Implementation

### `message_creation_service.py`

Exact copy of the creation logic from current `message_service.py` (lines 27-83), encapsulated in a class:

- `__init__(self, db: Session)`
- `_next_sequence(self, conversation_id: UUID) -> int`
- `_find_by_idempotency_key(self, key: str) -> Optional[Message]`
- `create_message(self, conversation, content, inbound, owner_id, message_type, image, file, idempotency_key) -> Message`

No behavioral changes — copy the logic verbatim.

### `message_delivery_service.py`

Exact copy of `dispatch_to_channel` (lines 87-133):

- `__init__(self, db: Session)`
- `async dispatch_to_channel(self, conversation, content, message=None) -> None`

Note: `manager` import moves inside the except block (it's already a lazy import in the exception path).

### `message_broadcast_service.py`

Exact copy of `broadcast_new_message` (lines 137-155):

- `async broadcast_new_message(self, message: Message) -> None`

No `db` needed — only uses `manager`.

### `message_service.py` (rewritten)

```python
"""
MessageService — thin orchestrator that composes creation, delivery, and broadcast.

All public method signatures are preserved unchanged so callers need no modification.
"""
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.models import Conversation, Message
from app.services.message_creation_service import MessageCreationService
from app.services.message_delivery_service import DeliveryService
from app.services.message_broadcast_service import BroadcastService


class MessageService:
    MAX_RETRIES = 3

    def __init__(self, db: Session):
        self.db = db
        self._creation = MessageCreationService(db)
        self._delivery = DeliveryService(db)
        self._broadcast = BroadcastService()

    # ── Delegated methods (preserve public interface) ─────────────────────────

    def create_message(
        self,
        conversation: Conversation,
        content: str,
        inbound: bool = False,
        owner_id: Optional[UUID] = None,
        message_type: str = "TEXT",
        image: Optional[str] = None,
        file: Optional[str] = None,
        idempotency_key: Optional[str] = None,
    ) -> Message:
        return self._creation.create_message(
            conversation=conversation, content=content, inbound=inbound,
            owner_id=owner_id, message_type=message_type, image=image,
            file=file, idempotency_key=idempotency_key,
        )

    async def dispatch_to_channel(
        self, conversation: Conversation, content: str, message: Optional[Message] = None
    ) -> None:
        return await self._delivery.dispatch_to_channel(conversation, content, message)

    async def broadcast_new_message(self, message: Message) -> None:
        return await self._broadcast.broadcast_new_message(message)

    # ── Retry ─────────────────────────────────────────────────────────────────

    async def retry_message(self, message: Message, conversation: Conversation) -> Message:
        from app.models.models import DeliveryStatus

        if message.delivery_status != DeliveryStatus.FAILED:
            raise ValueError("Only FAILED messages can be retried")
        if message.retry_count >= self.MAX_RETRIES:
            raise ValueError(f"Max retries ({self.MAX_RETRIES}) reached")

        message.retry_count += 1
        message.last_retry_at = datetime.now(timezone.utc)
        message.delivery_status = DeliveryStatus.PENDING
        self.db.commit()

        await self._delivery.dispatch_to_channel(conversation, message.content, message)
        await self._broadcast.broadcast_new_message(message)
        return message

    # ── Orchestration flows ───────────────────────────────────────────────────

    async def send_from_dashboard(
        self,
        conversation: Conversation,
        content: str,
        owner_id: Optional[UUID] = None,
        message_type: str = "TEXT",
        image: Optional[str] = None,
        file: Optional[str] = None,
        idempotency_key: Optional[str] = None,
    ) -> Message:
        from app.models.models import DeliveryStatus

        message = self._creation.create_message(
            conversation=conversation, content=content, inbound=False,
            owner_id=owner_id, message_type=message_type, image=image,
            file=file, idempotency_key=idempotency_key,
        )
        message.delivery_status = DeliveryStatus.PENDING
        if conversation.first_response_at is None:
            conversation.first_response_at = datetime.now(timezone.utc)
        self.db.commit()

        try:
            await self._delivery.dispatch_to_channel(conversation, content, message)
        except Exception:
            pass  # failure already persisted and broadcast inside dispatch_to_channel

        await self._broadcast.broadcast_new_message(message)
        return message

    async def receive_from_channel(
        self,
        conversation: Conversation,
        content: str,
        message_type: str = "TEXT",
        idempotency_key: Optional[str] = None,
    ) -> Message:
        message = self._creation.create_message(
            conversation=conversation, content=content, inbound=True,
            message_type=message_type, idempotency_key=idempotency_key,
        )
        await self._broadcast.broadcast_new_message(message)
        await self._enqueue_for_agent(message, conversation)
        return message

    async def _enqueue_for_agent(self, message: Message, conversation: Conversation) -> None:
        try:
            from src.shared.queue import agent_queue
            from src.shared.models import AgentTask, ChannelType as AgentChannel

            task = AgentTask(
                message_id=str(message.id),
                conversation_id=str(conversation.id),
                channel=AgentChannel(conversation.channel.value.upper()),
                content=message.content or "",
            )
            agent_queue().put_nowait(task)
        except Exception:
            pass


def get_message_service(db: Session) -> MessageService:
    return MessageService(db)
```

---

## Acceptance Criteria

- [ ] `message_creation_service.py` created — contains `MessageCreationService` with `create_message`, `_next_sequence`, `_find_by_idempotency_key`.
- [ ] `message_delivery_service.py` created — contains `DeliveryService` with `dispatch_to_channel`.
- [ ] `message_broadcast_service.py` created — contains `BroadcastService` with `broadcast_new_message`.
- [ ] `message_service.py` rewritten as thin orchestrator — all public methods preserved with identical signatures and behavior.
- [ ] Each new file is < 150 lines (`wc -l` to verify).
- [ ] No caller file modified.
- [ ] `pytest tests/` exits 0 — all 175 existing tests pass unchanged.

---

## Definition of Done

- [ ] 3 new service files created, `message_service.py` rewritten.
- [ ] All files < 150 lines.
- [ ] All 175 tests pass with no test file modifications.
- [ ] No import changes in any caller.
- [ ] Sprint status updated: `8-9-messageservice-refactoring: done`.
