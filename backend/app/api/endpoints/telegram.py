import httpx
from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.core.database import get_db
from app.services.telegram_service import telegram_service
from app.schemas.common import create_response, create_error_response

router = APIRouter()

@router.post("/webhook")
async def telegram_webhook(request: Request, db: Session = Depends(get_db)) -> Dict[str, Any]:
    update = await request.json()
    await telegram_service.process_update(update, db)
    return create_response({"status": "ok"})

@router.post("/test-connection")
async def test_connection(body: dict) -> Dict[str, Any]:
    """Verify a Telegram bot token by calling getMe. Does NOT persist the token."""
    token = body.get("token", "").strip()
    if not token:
        error_response, status = create_error_response(
            code="VALIDATION_ERROR", message="Token is required", status_code=400
        )
        raise HTTPException(status_code=status, detail=error_response)

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                f"https://api.telegram.org/bot{token}/getMe",
                timeout=10.0,
            )
            data = resp.json()
        except Exception as exc:
            return create_response({"ok": False, "error": str(exc)})

    if data.get("ok"):
        bot = data.get("result", {})
        return create_response({
            "ok": True,
            "username": bot.get("username"),
            "first_name": bot.get("first_name"),
        })
    return create_response({"ok": False, "error": data.get("description", "Invalid token")})

@router.post("/set-webhook")
async def set_webhook(webhook_url: str) -> Dict[str, Any]:
    result = await telegram_service.set_webhook(webhook_url)
    if not result:
        error_response, status = create_error_response(
            code="INTERNAL_ERROR",
            message="Failed to set webhook",
            status_code=500
        )
        raise HTTPException(status_code=status, detail=error_response)
    return create_response({"status": "ok", "webhook_url": webhook_url})

@router.get("/webhook-info")
async def webhook_info() -> Dict[str, Any]:
    info = await telegram_service.get_webhook_info()
    return create_response(info)
