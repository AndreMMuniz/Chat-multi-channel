"""
Sync webhook — processes a message inline and returns the agent result.
Blocks until the agent finishes. Use for testing or low-latency integrations.
"""

from fastapi import APIRouter
from src.shared.models import AgentTask
from src.worker.processor import process

router = APIRouter(prefix="/webhook")


@router.post("/process")
async def process_message(task: AgentTask):
    """
    Process a message synchronously through the agent.
    Waits for completion and returns the result.
    Only use when you need the agent output in the HTTP response.
    """
    await process(task)
    return {"status": "processed", "conversation_id": task.conversation_id}
