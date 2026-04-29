"""
Agent task queue — asyncio.Queue singleton.

Designed to be swapped with MQTT (aiomqtt) or Redis Streams for production.
Usage:
    from src.shared.queue import agent_queue
    await agent_queue.put(task)       # producer
    task = await agent_queue.get()    # consumer
"""

import asyncio
from src.shared.config import get_settings
from src.shared.models import AgentTask

_queue: asyncio.Queue[AgentTask] | None = None


def get_queue() -> asyncio.Queue[AgentTask]:
    """Return (or create) the global agent task queue."""
    global _queue
    if _queue is None:
        _queue = asyncio.Queue(maxsize=get_settings().WORKER_QUEUE_MAXSIZE)
    return _queue


# Convenience alias
agent_queue = get_queue
