"""Admin routes for the agent layer — introspection and management."""

from fastapi import APIRouter
from src.agents.loader import list_agents
from src.shared.queue import agent_queue

router = APIRouter(prefix="/agents")


@router.get("/")
async def get_agents():
    """List all registered agents."""
    return {"agents": list_agents()}


@router.get("/queue")
async def queue_status():
    """Current queue depth."""
    q = agent_queue()
    return {"queue_size": q.qsize(), "queue_maxsize": q.maxsize}


@router.delete("/queue")
async def drain_queue():
    """Drain the queue. AsyncioQueue: discards all items; Redis: trims stream to 0."""
    q = agent_queue()
    drained = await q.drain()
    return {"drained": drained}
