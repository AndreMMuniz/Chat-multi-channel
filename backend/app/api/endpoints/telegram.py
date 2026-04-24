from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.telegram_service import telegram_service

router = APIRouter()

@router.post("/webhook")
async def telegram_webhook(request: Request, db: Session = Depends(get_db)):
    """Receive updates from Telegram."""
    update = await request.json()
    await telegram_service.process_update(update, db)
    return {"status": "ok"}
