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
