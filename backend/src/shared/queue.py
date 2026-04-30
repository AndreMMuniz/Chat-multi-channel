"""
Agent task queue — asyncio.Queue (dev/test) or Redis Streams (production).

Factory: get_queue(consumer_id="monitoring") -> QueueProtocol
  - Returns RedisStreamQueue if REDIS_URL is set in config
  - Returns shared AsyncioQueue singleton otherwise

Usage (producers):
    from src.shared.queue import agent_queue
    q = agent_queue()
    await q.put(task)       # async producer
    q.put_nowait(task)      # fire-and-forget producer

Usage (consumers):
    from src.shared.queue import get_queue
    q = get_queue(consumer_id="worker-0")
    await q.setup()         # creates consumer group (Redis) or no-op (asyncio)
    task = await q.get()    # blocks until a task is available
    q.task_done()           # ACK (Redis) or task_done (asyncio)
"""

import asyncio
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


# ── asyncio.Queue adapter (dev / test fallback) ───────────────────────────────

class AsyncioQueue:
    """Wraps asyncio.Queue with the QueueProtocol interface."""

    def __init__(self, maxsize: int = 1000) -> None:
        self._q: asyncio.Queue[AgentTask] = asyncio.Queue(maxsize=maxsize)
        self._maxsize = maxsize

    async def setup(self) -> None:
        pass

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
    """Redis Streams-backed queue with consumer group ACK semantics.

    Each worker gets its own consumer_id so Redis can track pending messages
    per consumer. Failed ACKs leave messages in XPENDING for manual recovery.
    """

    def __init__(self, consumer_id: str = "monitoring") -> None:
        from src.shared.config import get_settings
        cfg = get_settings()
        self._redis_url = cfg.REDIS_URL
        self._stream = cfg.REDIS_STREAM_KEY
        self._group = cfg.REDIS_CONSUMER_GROUP
        self._consumer_id = consumer_id
        self._maxsize = cfg.WORKER_QUEUE_MAXSIZE
        self._pending_entry_id: str | None = None
        self._redis = None  # lazy-initialised

    async def _get_redis(self):
        if self._redis is None:
            import redis.asyncio as aioredis
            self._redis = await aioredis.from_url(
                self._redis_url, decode_responses=True
            )
        return self._redis

    async def setup(self) -> None:
        """Create consumer group. MKSTREAM creates the stream if absent."""
        r = await self._get_redis()
        try:
            await r.xgroup_create(self._stream, self._group, id="0", mkstream=True)
            log.info(
                "Consumer group '%s' ready on stream '%s'", self._group, self._stream
            )
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
                block=2000,  # block 2 s then retry — allows clean shutdown polling
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
        # Cannot await in sync context — return sentinel when Redis is active
        return -1

    @property
    def maxsize(self) -> int:
        return self._maxsize

    def empty(self) -> bool:
        return False  # conservative: assume non-empty when Redis is active

    async def drain(self) -> int:
        """Trim the stream to 0 entries. Returns approximate number removed."""
        r = await self._get_redis()
        length = await r.xlen(self._stream)
        await r.xtrim(self._stream, maxlen=0)
        log.warning(
            "Drained Redis stream '%s' (%d entries removed)", self._stream, length
        )
        return length


# ── Factory ───────────────────────────────────────────────────────────────────

_asyncio_queue: AsyncioQueue | None = None


def get_queue(consumer_id: str = "monitoring") -> AsyncioQueue | RedisStreamQueue:
    """Return a queue instance.

    - REDIS_URL set → RedisStreamQueue(consumer_id)  [each worker gets its own]
    - REDIS_URL absent → shared AsyncioQueue singleton  [consumer_id ignored]
    """
    from src.shared.config import get_settings
    cfg = get_settings()

    if cfg.REDIS_URL:
        return RedisStreamQueue(consumer_id=consumer_id)

    global _asyncio_queue
    if _asyncio_queue is None:
        _asyncio_queue = AsyncioQueue(maxsize=cfg.WORKER_QUEUE_MAXSIZE)
    return _asyncio_queue


# Backward-compatible alias — existing callers use agent_queue()
agent_queue = get_queue
