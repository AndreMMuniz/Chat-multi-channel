import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import uvicorn
from app.api.api import api_router
from app.services.telegram_service import telegram_service

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    base_url = os.getenv("WEBHOOK_BASE_URL", "").rstrip("/")
    if base_url and os.getenv("TELEGRAM_BOT_TOKEN"):
        webhook_url = f"{base_url}/api/v1/telegram/webhook"
        await telegram_service.set_webhook(webhook_url)
    yield

app = FastAPI(title="Multi-Channel Chat API", version="1.0.0", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS: defaults to localhost for development; override via ALLOWED_ORIGINS env var in production
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()] or [
    "http://localhost:3000",
    "http://localhost:3001",
]

print(f"DEBUG: ALLOWED_ORIGINS env var: '{allowed_origins_env}'")
print(f"DEBUG: CORS allowed origins: {origins}")

# Temporary: Allow all origins for debugging
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Multi-Channel Chat API is running"}

@app.get("/cors-debug")
async def cors_debug():
    """Debug endpoint to check CORS configuration."""
    allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
    origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()] or [
        "http://localhost:3000",
        "http://localhost:3001",
    ]
    # Current actual configuration (may be overridden for debugging)
    current_origins = ["*"]  # Temporarily allowing all for debugging
    return {
        "allowed_origins_env": allowed_origins_env,
        "intended_origins": origins,
        "current_origins": current_origins,
        "is_production": os.getenv("ENVIRONMENT", "development") == "production",
        "debug_mode": True
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
