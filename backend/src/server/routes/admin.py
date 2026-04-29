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
    """Drain the queue (discard pending tasks). Use with caution."""
    q = agent_queue()
    drained = 0
    while not q.empty():
        try:
            q.get_nowait()
            q.task_done()
            drained += 1
        except Exception:
            break
    return {"drained": drained}
