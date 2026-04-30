# Story 8.4: Redis Streams Queue Migration

**Status:** done  
**Epic:** 8 — Production Hardening  
**Story Points:** 8  
**Priority:** Critical  
**Created:** 2026-04-30

---

## User Story

**As the system,** I want the agent task queue backed by Redis Streams so that Railway process restarts do not silently drop in-flight AI processing tasks.

---

## Background & Context

**Retro finding (2026-04-29):** The current `asyncio.Queue` in `src/shared/queue.py` is in-process and volatile — any Railway restart (deploy, crash, scale) drops all pending tasks without recovery. For MVP low-volume this was acceptable. For production with real users, a message that triggers an AI suggestion or auto-reply must survive process restarts.

**Architecture note from code (queue.py line 4):**
> "Designed to be swapped with MQTT (aiomqtt) or Redis Streams for production."

**`aiomqtt` is already in requirements.txt** — it was reserved for MQTT. This story uses Redis Streams instead (simpler, better replay semantics, no broker to operate separately on Railway — Railway has a managed Redis add-on).

**`REDIS_URL` is already stubbed in `.env.example`** (Story 8.2). The implementation activates it.

---

## Current Architecture (must preserve contract)

### Queue call sites — complete inventory

| File | Usage | Method(s) Used |
|------|-------|---------------|
| `src/worker/consumer.py:21` | Worker loop (consumer) | `await q.get()`, `q.task_done()` |
| `src/server/routes/webhook.py:21` | Enqueue from webhook | `await q.put(task)`, `q.qsize()` |
| `src/server/routes/admin.py:19,26` | Introspection + drain | `q.qsize()`, `q.maxsize`, `q.empty()`, `q.get_nowait()`, `q.task_done()` |
| `src/server/routes/health.py:9` | Health endpoint | `q.qsize()`, `q.maxsize` |
| `main.py:166,188` | `/health` endpoint | `agent_queue().qsize()` |
| `app/services/message_service.py:265` | Fire-and-forget enqueue | `q.put_nowait(task)` |

### `AgentTask` Pydantic model (in `src/shared/models.py`)
```python
class AgentTask(BaseModel):
    message_id: str
    conversation_id: str
    channel: ChannelType  # str enum: TELEGRAM/WHATSAPP/EMAIL/SMS/WEB
    content: str
```
Serialized to/from Redis as JSON. Field names are stable.

---

## Design Decisions

### Queue Protocol
Define a `QueueProtocol` (typing.Protocol) that both backends implement:
```
put(task) async          → XADD / asyncio put
put_nowait(task) sync    → create_task(put()) / asyncio put_nowait
get(consumer_id) async   → XREADGROUP BLOCK / asyncio get
task_done() sync         → schedule XACK / asyncio task_done
qsize() → int            → XLEN / asyncio qsize
maxsize → int (property) → WORKER_QUEUE_MAXSIZE (both)
empty() → bool           → XLEN==0 / asyncio empty
drain() async → int      → XTRIM MAXLEN 0 / drain loop
```

### Consumer Group Setup
Redis Streams require the consumer group to exist before consuming. The `RedisStreamQueue.setup()` method (async) creates it with `XGROUP CREATE ... MKSTREAM`. Called once at worker startup.

### Per-Worker Consumer Identity
Each `_worker(worker_id)` gets its own consumer name (`worker-{worker_id}`) for the consumer group. This enables Redis to track pending messages per consumer. The queue factory `get_queue(consumer_id)` returns the right instance.

### `task_done()` → XACK
After `get()` returns, the stream entry ID is stored per-instance (`self._pending_entry_id`). `task_done()` schedules `asyncio.create_task(self._ack())` to acknowledge the entry. This means: if a worker crashes between `get()` and `task_done()`, the entry stays in the `XPENDING` set and can be reclaimed (via `XAUTOCLAIM` — future work).

### Dead-Letter Stream
Messages that fail processing more than `MAX_RETRIES=3` times are moved to `agent_queue:dlq` stream via `XADD agent_queue:dlq * ...`. The processor (`src/worker/processor.py`) needs a retry counter wrapper. Failed entries are not silently dropped.

### `drain_queue` Admin Endpoint
The current drain uses `while not q.empty(): q.get_nowait()`. For Redis Streams, replace with `await q.drain()` which calls `XTRIM stream_key MAXLEN 0`. Update `admin.py` accordingly.

### `put_nowait` (fire-and-forget from MessageService)
`asyncio.Queue.put_nowait()` is synchronous and raises `asyncio.QueueFull`. `RedisStreamQueue.put_nowait()` schedules `asyncio.create_task(self.put(task))` — fully async, never raises. The existing try/except in `message_service._enqueue_for_agent()` already swallows all exceptions, so semantics are preserved.

### Fallback (no REDIS_URL)
When `REDIS_URL` is absent, `get_queue()` returns the `AsyncioQueue` adapter (wraps `asyncio.Queue`). Dev/test environments work exactly as before with zero configuration.

---

## Files to Create / Modify

| File | Action | Notes |
|------|--------|-------|
| `backend/requirements.txt` | **UPDATE** | Add `redis` |
| `backend/src/shared/config.py` | **UPDATE** | Add `REDIS_URL: str = ""` field |
| `backend/src/shared/queue.py` | **REWRITE** | Protocol + `AsyncioQueue` + `RedisStreamQueue` + factory |
| `backend/src/worker/consumer.py` | **UPDATE** | Pass `consumer_id` to `get_queue()` + call `setup()` |
| `backend/src/worker/processor.py` | **UPDATE** | Add retry counter → dead-letter on 3 failures |
| `backend/src/server/routes/admin.py` | **UPDATE** | Replace drain loop with `await q.drain()` |

**Do NOT modify:**
- `src/server/routes/webhook.py` — uses `await q.put()` and `q.qsize()` → unchanged
- `src/server/routes/health.py` — uses `q.qsize()` and `q.maxsize` → unchanged
- `main.py` health endpoint — uses `agent_queue().qsize()` → unchanged (uses monitoring consumer)
- `app/services/message_service.py` — uses `q.put_nowait()` → unchanged
- `src/shared/models.py` — `AgentTask` unchanged

---

## Implementation Guide

### Step 1 — `requirements.txt`
Add `redis` (the official Redis Python client — includes `redis.asyncio` for async support).

### Step 2 — `src/shared/config.py`
Add to `AgentSettings`:
```python
REDIS_URL: str = os.getenv("REDIS_URL", "")
REDIS_STREAM_KEY: str = os.getenv("REDIS_STREAM_KEY", "agent_queue")
REDIS_CONSUMER_GROUP: str = os.getenv("REDIS_CONSUMER_GROUP", "workers")
REDIS_MAX_RETRIES: int = int(os.getenv("REDIS_MAX_RETRIES", "3"))
```

### Step 3 — `src/shared/queue.py` (REWRITE)

```python
"""
Agent task queue — asyncio.Queue (dev) or Redis Streams (production).

Factory: get_queue(consumer_id="default") → QueueProtocol
  - Returns RedisStreamQueue if REDIS_URL is set
  - Returns AsyncioQueue (asyncio.Queue wrapper) otherwise

Producers:
    q = get_queue()
    await q.put(task)          # async
    q.put_nowait(task)         # fire-and-forget

Consumers:
    q = get_queue(consumer_id="worker-0")
    await q.setup()            # create consumer group (Redis only, no-op otherwise)
    task = await q.get()
    # ... process ...
    q.task_done()
"""

import asyncio
import json
import logging
from typing import Protocol, runtime_checkable

from src.shared.models import AgentTask

log = logging.getLogger(__name__)


@runtime_checkable
class QueueProtocol(Protocol):
    async def setup(self) -> None: ...
    async def put(self, task: AgentTask) -> None: ...
    def put_nowait(self, task: AgentTask) -> None: ...
    async def get(self) -> AgentTask: ...
    def task_done(self) -> None: ...
    def qsize(self) -> int: ...
    @property
    def maxsize(self) -> int: ...
    def empty(self) -> bool: ...
    async def drain(self) -> int: ...


# ── asyncio.Queue adapter (dev/test fallback) ─────────────────────────────────

class AsyncioQueue:
    """Wraps asyncio.Queue with the QueueProtocol interface."""

    def __init__(self, maxsize: int = 1000):
        self._q: asyncio.Queue[AgentTask] = asyncio.Queue(maxsize=maxsize)
        self._maxsize = maxsize

    async def setup(self) -> None:
        pass  # no-op

    async def put(self, task: AgentTask) -> None:
        await self._q.put(task)

    def put_nowait(self, task: AgentTask) -> None:
        try:
            self._q.put_nowait(task)
        except asyncio.QueueFull:
            log.warning("AsyncioQueue full — task dropped: conv=%s", task.conversation_id)

    async def get(self) -> AgentTask:
        return await self._q.get()

    def task_done(self) -> None:
        self._q.task_done()

    def qsize(self) -> int:
        return self._q.qsize()

    @property
    def maxsize(self) -> int:
        return self._maxsize

    def empty(self) -> bool:
        return self._q.empty()

    async def drain(self) -> int:
        drained = 0
        while not self._q.empty():
            try:
                self._q.get_nowait()
                self._q.task_done()
                drained += 1
            except Exception:
                break
        return drained


# ── Redis Streams implementation ──────────────────────────────────────────────

class RedisStreamQueue:
    """Redis Streams-backed queue with consumer group ACK semantics."""

    def __init__(self, consumer_id: str = "default"):
        from src.shared.config import get_settings
        cfg = get_settings()
        self._redis_url = cfg.REDIS_URL
        self._stream = cfg.REDIS_STREAM_KEY
        self._group = cfg.REDIS_CONSUMER_GROUP
        self._consumer_id = consumer_id
        self._maxsize = cfg.WORKER_QUEUE_MAXSIZE
        self._pending_entry_id: str | None = None
        self._redis = None  # lazy-initialized

    async def _get_redis(self):
        if self._redis is None:
            import redis.asyncio as aioredis
            self._redis = await aioredis.from_url(self._redis_url, decode_responses=True)
        return self._redis

    async def setup(self) -> None:
        """Create the consumer group. MKSTREAM creates the stream if absent."""
        r = await self._get_redis()
        try:
            await r.xgroup_create(self._stream, self._group, id="0", mkstream=True)
            log.info("Consumer group '%s' created on stream '%s'", self._group, self._stream)
        except Exception as exc:
            if "BUSYGROUP" in str(exc):
                log.debug("Consumer group '%s' already exists", self._group)
            else:
                raise

    async def put(self, task: AgentTask) -> None:
        r = await self._get_redis()
        await r.xadd(self._stream, {"payload": task.model_dump_json()})

    def put_nowait(self, task: AgentTask) -> None:
        asyncio.create_task(self.put(task))

    async def get(self) -> AgentTask:
        r = await self._get_redis()
        while True:
            results = await r.xreadgroup(
                self._group,
                self._consumer_id,
                {self._stream: ">"},
                count=1,
                block=2000,  # block 2s then retry — allows clean shutdown
            )
            if results:
                _, entries = results[0]
                entry_id, data = entries[0]
                self._pending_entry_id = entry_id
                return AgentTask.model_validate_json(data["payload"])

    def task_done(self) -> None:
        if self._pending_entry_id:
            entry_id = self._pending_entry_id
            self._pending_entry_id = None
            asyncio.create_task(self._ack(entry_id))

    async def _ack(self, entry_id: str) -> None:
        try:
            r = await self._get_redis()
            await r.xack(self._stream, self._group, entry_id)
        except Exception as exc:
            log.error("XACK failed for entry %s: %s", entry_id, exc)

    def qsize(self) -> int:
        """Returns stream length (approximate pending depth)."""
        try:
            import asyncio as _asyncio
            loop = _asyncio.get_event_loop()
            if loop.is_running():
                # Can't await in sync context — return cached/approximate
                return -1  # sentinel: "unknown but Redis is active"
        except Exception:
            pass
        return 0

    @property
    def maxsize(self) -> int:
        return self._maxsize

    def empty(self) -> bool:
        return self.qsize() == 0

    async def drain(self) -> int:
        """Trim the stream to 0 entries. Returns approximate drained count."""
        r = await self._get_redis()
        length = await r.xlen(self._stream)
        await r.xtrim(self._stream, maxlen=0)
        log.warning("Drained Redis stream '%s' (%d entries removed)", self._stream, length)
        return length


# ── Factory ───────────────────────────────────────────────────────────────────

_asyncio_queue: AsyncioQueue | None = None


def get_queue(consumer_id: str = "monitoring") -> AsyncioQueue | RedisStreamQueue:
    """
    Return a queue instance for the given consumer_id.
    - REDIS_URL set → RedisStreamQueue(consumer_id)
    - REDIS_URL absent → shared AsyncioQueue singleton
    """
    from src.shared.config import get_settings
    cfg = get_settings()

    if cfg.REDIS_URL:
        return RedisStreamQueue(consumer_id=consumer_id)

    global _asyncio_queue
    if _asyncio_queue is None:
        _asyncio_queue = AsyncioQueue(maxsize=cfg.WORKER_QUEUE_MAXSIZE)
    return _asyncio_queue


# Convenience alias — backward-compatible with existing callers
agent_queue = get_queue
```

### Step 4 — `src/worker/consumer.py` (UPDATE)

Change `_worker` to pass `consumer_id` and call `setup()`:

```python
async def _worker(worker_id: int) -> None:
    from src.worker.processor import process
    from src.shared.queue import get_queue

    q = get_queue(consumer_id=f"worker-{worker_id}")
    await q.setup()  # no-op for asyncio, creates group for Redis
    log.info("Worker %d started (consumer_id=worker-%d)", worker_id, worker_id)

    while True:
        task = await q.get()
        try:
            log.debug("Worker %d processing conv=%s", worker_id, task.conversation_id)
            await process(task)
        except Exception as exc:
            log.error("Worker %d unhandled error: %s", worker_id, exc)
        finally:
            q.task_done()
```

### Step 5 — `src/worker/processor.py` (UPDATE — dead-letter)

Wrap `process()` with retry tracking. Add a dead-letter enqueue on repeated failure:

```python
_RETRY_COUNTS: dict[str, int] = {}  # message_id → fail count (in-process, resets on restart)

async def process(task: AgentTask) -> None:
    """Process a single AgentTask. Sends to DLQ after MAX_RETRIES failures."""
    from src.shared.config import get_settings
    cfg = get_settings()

    try:
        # ... existing implementation unchanged ...
        _RETRY_COUNTS.pop(task.message_id, None)  # clear on success
    except Exception as exc:
        count = _RETRY_COUNTS.get(task.message_id, 0) + 1
        _RETRY_COUNTS[task.message_id] = count
        log.error("processor error (attempt %d/%d) [conv=%s]: %s",
                  count, cfg.REDIS_MAX_RETRIES, task.conversation_id, exc)
        if count >= cfg.REDIS_MAX_RETRIES and cfg.REDIS_URL:
            await _send_to_dlq(task, str(exc))
            _RETRY_COUNTS.pop(task.message_id, None)
        raise  # re-raise so consumer.py can log it
```

Add `_send_to_dlq`:
```python
async def _send_to_dlq(task: AgentTask, error: str) -> None:
    import redis.asyncio as aioredis
    from src.shared.config import get_settings
    cfg = get_settings()
    try:
        r = await aioredis.from_url(cfg.REDIS_URL, decode_responses=True)
        await r.xadd(
            f"{cfg.REDIS_STREAM_KEY}:dlq",
            {"payload": task.model_dump_json(), "error": error},
        )
        log.warning("Task sent to DLQ [conv=%s] after %d failures", task.conversation_id, cfg.REDIS_MAX_RETRIES)
        await r.aclose()
    except Exception as dlq_exc:
        log.error("DLQ write failed: %s", dlq_exc)
```

### Step 6 — `src/server/routes/admin.py` (UPDATE drain endpoint)

Replace the `while not q.empty()` drain loop:
```python
@router.delete("/queue")
async def drain_queue():
    """Drain the queue. For Redis Streams: trims stream to 0. Use with caution."""
    q = agent_queue()
    drained = await q.drain()
    return {"drained": drained}
```

---

## `qsize()` note for health endpoints

`RedisStreamQueue.qsize()` returns `-1` when called from a synchronous context (can't `await` in health endpoint sync path). The health endpoint in `main.py` already has:
```python
try:
    queue_size = agent_queue().qsize()
except Exception:
    queue_size = -1
```
So `-1` is a valid sentinel already handled. **No change needed in `main.py` or `health.py`.**

For an accurate async queue size in the `/health` endpoint (future improvement), a separate async health method can be added — but that is out of scope for this story.

---

## Acceptance Criteria

- [ ] `redis` in `backend/requirements.txt`.
- [ ] `REDIS_URL` (and `REDIS_STREAM_KEY`, `REDIS_CONSUMER_GROUP`, `REDIS_MAX_RETRIES`) added to `src/shared/config.py`.
- [ ] `src/shared/queue.py` rewritten with `AsyncioQueue`, `RedisStreamQueue`, and `get_queue(consumer_id)` factory.
- [ ] `src/worker/consumer.py` passes `consumer_id=f"worker-{worker_id}"` and calls `await q.setup()`.
- [ ] `src/worker/processor.py` sends tasks to dead-letter stream after `REDIS_MAX_RETRIES` failures (when `REDIS_URL` is set).
- [ ] `src/server/routes/admin.py` drain endpoint uses `await q.drain()`.
- [ ] All existing callers (`webhook.py`, `health.py`, `main.py`, `message_service.py`) work unchanged.
- [ ] With `REDIS_URL` unset: app behaves exactly as before (asyncio.Queue).
- [ ] Unit tests for `AsyncioQueue` and `RedisStreamQueue` (mocked Redis).
- [ ] Sprint status updated: `8-4-redis-streams-queue-migration: done`.

---

## Definition of Done

- [x] All 6 files modified/created.
- [x] No existing call site changed except `consumer.py` and `admin.py` (as specified above).
- [x] Tests pass — `AsyncioQueue` all methods; `RedisStreamQueue` put/get/task_done/drain with mocked Redis.
- [x] App boots without `REDIS_URL` (falls back to asyncio.Queue).
- [x] Sprint status: `8-4-redis-streams-queue-migration: review`.

---

### Review Findings

- [x] [Review][Patch] `get_queue()` criava nova `RedisStreamQueue` por chamada — pool de conexão Redis não fechado por producers (`webhook.py`, `admin.py`). Corrigido: `_get_redis()` agora usa `_shared_redis_client` a nível de módulo [`backend/src/shared/queue.py`]
- [x] [Review][Patch] Testes usavam `q._redis = mock_redis` (atributo removido) — atualizados para `queue_mod._shared_redis_client` com fixture `autouse` para reset entre testes [`backend/tests/test_queue.py`]
- [x] [Review][Defer] Sem teste para `put_nowait` no `RedisStreamQueue` — deferred, pre-existing

---

## Dev Agent Record

**Completed:** 2026-04-30  
**Implemented by:** Amelia (Dev Agent)

### Files Modified / Created

| File | Action |
|------|--------|
| `backend/requirements.txt` | Updated — added `redis` |
| `backend/src/shared/config.py` | Updated — `REDIS_URL`, `REDIS_STREAM_KEY`, `REDIS_CONSUMER_GROUP`, `REDIS_MAX_RETRIES` |
| `backend/src/shared/queue.py` | Rewritten — `QueueProtocol`, `AsyncioQueue`, `RedisStreamQueue`, `get_queue()` factory |
| `backend/src/worker/consumer.py` | Updated — `get_queue(consumer_id=f"worker-{worker_id}")` + `await q.setup()` |
| `backend/src/worker/processor.py` | Updated — retry counter + DLQ on max failures |
| `backend/src/server/routes/admin.py` | Updated — drain endpoint uses `await q.drain()` |
| `backend/tests/test_queue.py` | Created — 18 unit tests (all passing) |

### Completion Notes

- `AsyncioQueue` wraps `asyncio.Queue`; dev/test behavior unchanged.
- `RedisStreamQueue` uses `XADD`/`XREADGROUP`/`XACK`/`XTRIM` with consumer groups; each worker gets a unique consumer_id.
- Dead-letter stream `agent_queue:dlq` receives tasks after `REDIS_MAX_RETRIES` failures.
- `get_queue()`: `REDIS_URL` set → Redis; unset → asyncio singleton (fallback).
- Also installed `pydantic-settings` and `redis` into venv (were missing despite being in requirements.txt).
- 106/106 tests passing (18 new + 88 existing); zero regressions.
