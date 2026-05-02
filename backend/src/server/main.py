"""
Agent server — optional standalone FastAPI app for the AI layer.

Can be run independently (e.g., Railway worker dyno) or imported by
the main app to mount the agent routes under /agents prefix.

Run standalone:
    uvicorn src.server.main:app --port 8001
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI

from src.shared.observability import setup_logging
from src.server.routes.health import router as health_router
from src.server.routes.admin import router as admin_router
from src.server.routes.webhook import router as webhook_router
from src.server.routes.webhook_sync import router as webhook_sync_router
from src.worker.consumer import start_workers, stop_workers

setup_logging()

_worker_tasks: list = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _worker_tasks
    _worker_tasks = await start_workers()
    yield
    await stop_workers(_worker_tasks)


app = FastAPI(
    title="Omnichat Agent API",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(health_router)
app.include_router(admin_router, prefix="/api/v1")
app.include_router(webhook_router, prefix="/api/v1")
app.include_router(webhook_sync_router, prefix="/api/v1")
