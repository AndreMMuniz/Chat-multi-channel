"""
Async webhook — receives a message payload and enqueues it for agent processing.
Returns 200 immediately; processing happens in the background worker.

Use this when the caller can tolerate eventual processing (e.g., internal triggers).
"""

from fastapi import APIRouter
from src.shared.models import AgentTask
from src.shared.queue import agent_queue

router = APIRouter(prefix="/webhook")


@router.post("/enqueue")
async def enqueue_message(task: AgentTask):
    """
    Enqueue a message for async agent processing.
    Returns immediately with queue position.
    """
    q = agent_queue()
    await q.put(task)
    return {"status": "queued", "queue_size": q.qsize()}
