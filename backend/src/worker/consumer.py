"""
Consumer — runs the worker loop, draining the agent_queue concurrently.

Spawns up to WORKER_CONCURRENCY concurrent tasks so multiple messages can
be processed in parallel without blocking the FastAPI event loop.
"""

import asyncio
import logging

from src.shared.config import get_settings
from src.shared.queue import get_queue

log = logging.getLogger(__name__)


async def _worker(worker_id: int) -> None:
    """Single worker coroutine — loops forever processing tasks from the queue."""
    from src.worker.processor import process

    q = get_queue(consumer_id=f"worker-{worker_id}")
    await q.setup()  # no-op for AsyncioQueue; creates consumer group for Redis
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


async def start_workers() -> list[asyncio.Task]:
    """
    Spawn WORKER_CONCURRENCY worker coroutines.
    Returns the list of tasks so the caller can cancel them on shutdown.
    """
    cfg = get_settings()
    tasks = [
        asyncio.create_task(_worker(i), name=f"agent-worker-{i}")
        for i in range(cfg.WORKER_CONCURRENCY)
    ]
    log.info("Started %d agent workers", cfg.WORKER_CONCURRENCY)
    return tasks


async def stop_workers(tasks: list[asyncio.Task]) -> None:
    """Cancel all worker tasks and wait for them to finish."""
    for t in tasks:
        t.cancel()
    await asyncio.gather(*tasks, return_exceptions=True)
    log.info("Agent workers stopped")
