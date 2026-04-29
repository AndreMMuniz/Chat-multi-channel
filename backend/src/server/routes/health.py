from fastapi import APIRouter
from src.shared.queue import agent_queue

router = APIRouter()


@router.get("/health")
async def health():
    q = agent_queue()
    return {
        "status": "ok",
        "queue_size": q.qsize(),
        "queue_maxsize": q.maxsize,
    }
