"""Unit tests for the agent task queue (src/shared/queue.py).

AsyncioQueue: tested directly (no mocks needed).
RedisStreamQueue: tested with a mock Redis client to avoid needing a real Redis server.
"""

import asyncio
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from src.shared.models import AgentTask, ChannelType


# ── Fixtures ──────────────────────────────────────────────────────────────────

def _task(conv_id: str = "conv-1", msg_id: str = "msg-1") -> AgentTask:
    return AgentTask(
        message_id=msg_id,
        conversation_id=conv_id,
        channel=ChannelType.TELEGRAM,
        content="hello",
    )


# ── AsyncioQueue ──────────────────────────────────────────────────────────────

class TestAsyncioQueue:
    @pytest.mark.asyncio
    async def test_put_and_get_round_trip(self):
        from src.shared.queue import AsyncioQueue
        q = AsyncioQueue(maxsize=10)
        task = _task()
        await q.put(task)
        result = await q.get()
        assert result.conversation_id == task.conversation_id

    @pytest.mark.asyncio
    async def test_qsize_reflects_depth(self):
        from src.shared.queue import AsyncioQueue
        q = AsyncioQueue(maxsize=10)
        assert q.qsize() == 0
        await q.put(_task("a"))
        await q.put(_task("b"))
        assert q.qsize() == 2

    @pytest.mark.asyncio
    async def test_task_done_decrements_join_counter(self):
        from src.shared.queue import AsyncioQueue
        q = AsyncioQueue(maxsize=10)
        await q.put(_task())
        await q.get()
        q.task_done()  # should not raise
        await asyncio.wait_for(q._q.join(), timeout=1.0)

    @pytest.mark.asyncio
    async def test_empty_returns_true_when_empty(self):
        from src.shared.queue import AsyncioQueue
        q = AsyncioQueue(maxsize=10)
        assert q.empty() is True
        await q.put(_task())
        assert q.empty() is False

    @pytest.mark.asyncio
    async def test_drain_clears_all_items(self):
        from src.shared.queue import AsyncioQueue
        q = AsyncioQueue(maxsize=10)
        for i in range(5):
            await q.put(_task(f"conv-{i}"))
        drained = await q.drain()
        assert drained == 5
        assert q.empty() is True

    @pytest.mark.asyncio
    async def test_setup_is_noop(self):
        from src.shared.queue import AsyncioQueue
        q = AsyncioQueue()
        await q.setup()  # must not raise

    def test_put_nowait_drops_on_full_without_raising(self):
        from src.shared.queue import AsyncioQueue
        q = AsyncioQueue(maxsize=1)
        q._q.put_nowait(_task("first"))  # fill the queue
        q.put_nowait(_task("second"))    # must not raise even when full

    def test_maxsize_property(self):
        from src.shared.queue import AsyncioQueue
        q = AsyncioQueue(maxsize=42)
        assert q.maxsize == 42


# ── get_queue factory ─────────────────────────────────────────────────────────

class TestGetQueueFactory:
    def test_returns_asyncio_queue_when_no_redis_url(self):
        from src.shared import queue as queue_mod
        queue_mod._asyncio_queue = None  # reset singleton
        mock_cfg = MagicMock()
        mock_cfg.REDIS_URL = ""
        mock_cfg.WORKER_QUEUE_MAXSIZE = 100
        with patch("src.shared.config.get_settings", return_value=mock_cfg):
            from src.shared.queue import AsyncioQueue, get_queue
            result = get_queue("worker-0")
            assert isinstance(result, AsyncioQueue)

    def test_returns_redis_queue_when_redis_url_set(self):
        from src.shared.queue import RedisStreamQueue
        mock_cfg = MagicMock()
        mock_cfg.REDIS_URL = "redis://localhost:6379/0"
        mock_cfg.REDIS_STREAM_KEY = "agent_queue"
        mock_cfg.REDIS_CONSUMER_GROUP = "workers"
        mock_cfg.WORKER_QUEUE_MAXSIZE = 1000
        with patch("src.shared.config.get_settings", return_value=mock_cfg):
            from src.shared import queue as queue_mod
            result = queue_mod.get_queue("worker-0")
            assert isinstance(result, RedisStreamQueue)


# ── RedisStreamQueue (mocked Redis) ──────────────────────────────────────────

def _make_redis_queue(consumer_id: str = "worker-0") -> "RedisStreamQueue":
    """Build a RedisStreamQueue with mocked config (no real Redis needed)."""
    from src.shared.queue import RedisStreamQueue
    mock_cfg = MagicMock()
    mock_cfg.REDIS_URL = "redis://localhost:6379/0"
    mock_cfg.REDIS_STREAM_KEY = "agent_queue"
    mock_cfg.REDIS_CONSUMER_GROUP = "workers"
    mock_cfg.WORKER_QUEUE_MAXSIZE = 100
    with patch("src.shared.config.get_settings", return_value=mock_cfg):
        q = RedisStreamQueue(consumer_id=consumer_id)
    # Set attributes directly so tests don't need get_settings patched
    q._redis_url = "redis://localhost:6379/0"
    q._stream = "agent_queue"
    q._group = "workers"
    q._maxsize = 100
    return q


class TestRedisStreamQueue:
    @pytest.fixture(autouse=True)
    def reset_shared_redis_client(self):
        """Reset the module-level shared Redis client between tests."""
        import src.shared.queue as queue_mod
        queue_mod._shared_redis_client = None
        yield
        queue_mod._shared_redis_client = None

    @pytest.mark.asyncio
    async def test_setup_creates_consumer_group(self):
        import src.shared.queue as queue_mod
        q = _make_redis_queue()
        mock_redis = AsyncMock()
        mock_redis.xgroup_create = AsyncMock(return_value="OK")
        queue_mod._shared_redis_client = mock_redis

        await q.setup()
        mock_redis.xgroup_create.assert_called_once_with(
            "agent_queue", "workers", id="0", mkstream=True
        )

    @pytest.mark.asyncio
    async def test_setup_ignores_busygroup_error(self):
        import src.shared.queue as queue_mod
        q = _make_redis_queue()
        mock_redis = AsyncMock()
        mock_redis.xgroup_create = AsyncMock(
            side_effect=Exception("BUSYGROUP Consumer Group name already exists")
        )
        queue_mod._shared_redis_client = mock_redis
        await q.setup()  # must not raise

    @pytest.mark.asyncio
    async def test_put_calls_xadd(self):
        import src.shared.queue as queue_mod
        q = _make_redis_queue()
        mock_redis = AsyncMock()
        mock_redis.xadd = AsyncMock(return_value="1234567890-0")
        queue_mod._shared_redis_client = mock_redis

        task = _task()
        await q.put(task)
        mock_redis.xadd.assert_called_once()
        call_args = mock_redis.xadd.call_args
        assert call_args[0][0] == "agent_queue"
        assert "payload" in call_args[0][1]

    @pytest.mark.asyncio
    async def test_get_reads_from_consumer_group(self):
        import src.shared.queue as queue_mod
        q = _make_redis_queue()
        mock_redis = AsyncMock()

        task = _task()
        payload = task.model_dump_json()
        mock_redis.xreadgroup = AsyncMock(
            return_value=[("agent_queue", [("1234567890-0", {"payload": payload})])]
        )
        queue_mod._shared_redis_client = mock_redis

        result = await q.get()
        assert result.conversation_id == task.conversation_id
        assert q._pending_entry_id == "1234567890-0"

    @pytest.mark.asyncio
    async def test_task_done_schedules_xack(self):
        import src.shared.queue as queue_mod
        q = _make_redis_queue()
        mock_redis = AsyncMock()
        mock_redis.xack = AsyncMock(return_value=1)
        queue_mod._shared_redis_client = mock_redis
        q._pending_entry_id = "1234567890-0"

        q.task_done()
        assert q._pending_entry_id is None
        # Give asyncio a chance to run the created task
        await asyncio.sleep(0)
        mock_redis.xack.assert_called_once_with("agent_queue", "workers", "1234567890-0")

    @pytest.mark.asyncio
    async def test_drain_trims_stream(self):
        import src.shared.queue as queue_mod
        q = _make_redis_queue()
        mock_redis = AsyncMock()
        mock_redis.xlen = AsyncMock(return_value=7)
        mock_redis.xtrim = AsyncMock(return_value=7)
        queue_mod._shared_redis_client = mock_redis

        drained = await q.drain()
        assert drained == 7
        mock_redis.xtrim.assert_called_once_with("agent_queue", maxlen=0)

    def test_maxsize_property(self):
        q = _make_redis_queue()
        assert q.maxsize == 100

    def test_qsize_returns_sentinel(self):
        q = _make_redis_queue()
        assert q.qsize() == -1  # can't await in sync context
