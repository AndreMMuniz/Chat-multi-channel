import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import uvicorn
from app.api.api import api_router
from app.core.config import settings
from app.services.telegram_service import telegram_service

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Auto-register Telegram webhook on startup if WEBHOOK_BASE_URL is set."""
    base_url = settings.WEBHOOK_BASE_URL.rstrip("/")
    if base_url and settings.TELEGRAM_BOT_TOKEN:
        webhook_url = f"{base_url}/api/v1/telegram/webhook"
        await telegram_service.set_webhook(webhook_url)
    yield


app = FastAPI(title="Multi-Channel Chat API", version="1.0.0", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — restrict to ALLOWED_ORIGINS in production, permissive in development
_raw_origins = os.getenv("ALLOWED_ORIGINS", "")
origins: list[str] = (
    [o.strip() for o in _raw_origins.split(",") if o.strip()]
    if _raw_origins
    else ["http://localhost:3000", "http://localhost:3001"]
)

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


@app.get("/health")
async def health_check():
    """
    Lightweight liveness probe for Railway healthcheck.
    Always returns 200 if the app is running — external dependency
    failures (Supabase, DB) are handled at the request level, not here.
    """
    return {
        "status": "ok",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/diagnostics")
async def diagnostics():
    """Detailed diagnostics for debugging."""
    from app.core.database import get_supabase, get_db
    from app.core.config import settings
    from sqlalchemy import text

    diagnostics = {
        "environment": settings.ENVIRONMENT,
        "supabase_url": bool(settings.SUPABASE_URL),
        "supabase_keys": bool(settings.supabase_key),
        "database_url": bool(settings.DATABASE_URL),
        "checks": {}
    }

    # Test Supabase connection
    try:
        supabase = get_supabase()
        # Try a simple auth operation instead of get_settings
        supabase.auth.get_session()
        diagnostics["checks"]["supabase"] = "ok"
    except Exception as e:
        diagnostics["checks"]["supabase"] = f"error: {str(e)}"

    # Test database connection
    try:
        db = next(get_db())
        result = db.execute(text("SELECT 1 as test")).fetchone()
        diagnostics["checks"]["database"] = "ok" if result else "error: no result"
    except Exception as e:
        diagnostics["checks"]["database"] = f"error: {str(e)}"

    return diagnostics


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
