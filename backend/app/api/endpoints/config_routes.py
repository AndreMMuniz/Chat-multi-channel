from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime
from uuid import UUID

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import GeneralSettings, User

router = APIRouter()


class SettingsOut(BaseModel):
    id: UUID
    app_name: str
    app_email: Optional[str] = None
    app_logo: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    ai_model: Optional[str] = None
    ai_provider: Optional[str] = None
    whatsapp_phone_id: Optional[str] = None
    whatsapp_account_id: Optional[str] = None
    whatsapp_access_token: Optional[str] = None
    whatsapp_webhook_token: Optional[str] = None
    email_imap_host: Optional[str] = None
    email_imap_port: Optional[int] = None
    email_smtp_host: Optional[str] = None
    email_smtp_port: Optional[int] = None
    email_address: Optional[str] = None
    email_password: Optional[str] = None
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_phone_number: Optional[str] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class SettingsIn(BaseModel):
    app_name: Optional[str] = None
    app_email: Optional[str] = None
    app_logo: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    ai_model: Optional[str] = None
    ai_provider: Optional[str] = None
    whatsapp_phone_id: Optional[str] = None
    whatsapp_account_id: Optional[str] = None
    whatsapp_access_token: Optional[str] = None
    whatsapp_webhook_token: Optional[str] = None
    email_imap_host: Optional[str] = None
    email_imap_port: Optional[int] = None
    email_smtp_host: Optional[str] = None
    email_smtp_port: Optional[int] = None
    email_address: Optional[str] = None
    email_password: Optional[str] = None
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_phone_number: Optional[str] = None


def _get_or_create(db: Session) -> GeneralSettings:
    s = db.query(GeneralSettings).first()
    if not s:
        s = GeneralSettings()
        db.add(s)
        db.commit()
        db.refresh(s)
    return s


@router.get("/settings", response_model=SettingsOut)
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    return _get_or_create(db)


@router.patch("/settings", response_model=SettingsOut)
def update_settings(
    body: SettingsIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    if not current_user.user_type.can_change_settings:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    s = _get_or_create(db)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(s, field, value)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s
