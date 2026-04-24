from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.telegram_service import telegram_service

router = APIRouter()

@router.post("/webhook")
async def telegram_webhook(request: Request, db: Session = Depends(get_db)):
    update = await request.json()
    await telegram_service.process_update(update, db)
    return {"status": "ok"}

@router.post("/set-webhook")
async def set_webhook(webhook_url: str):
    result = await telegram_service.set_webhook(webhook_url)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to set webhook")
    return {"status": "ok", "webhook_url": webhook_url}

@router.get("/webhook-info")
async def webhook_info():
    return await telegram_service.get_webhook_info()
