import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from app.api.api import api_router
from app.services.telegram_service import telegram_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    base_url = os.getenv("WEBHOOK_BASE_URL", "").rstrip("/")
    if base_url and os.getenv("TELEGRAM_BOT_TOKEN"):
        webhook_url = f"{base_url}/api/v1/telegram/webhook"
        await telegram_service.set_webhook(webhook_url)
    yield

app = FastAPI(title="Multi-Channel Chat API", version="1.0.0", lifespan=lifespan)

allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()] or ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=len(origins) > 1 or origins[0] != "*",
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Multi-Channel Chat API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
