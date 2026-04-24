from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class SettingsBase(BaseModel):
    app_name: str = "Omnichat"
    app_email: Optional[str] = None
    app_logo: Optional[str] = None

    # Branding
    primary_color: str = "#0F172A"
    secondary_color: str = "#3B82F6"
    accent_color: str = "#10B981"

    # AI Config
    ai_model: str = "gpt-4o-mini"
    ai_provider: str = "openrouter"

    # WhatsApp (Meta Cloud API)
    whatsapp_phone_id: Optional[str] = None
    whatsapp_account_id: Optional[str] = None
    whatsapp_access_token: Optional[str] = None
    whatsapp_webhook_token: Optional[str] = None

    # Email (IMAP/SMTP)
    email_imap_host: Optional[str] = None
    email_imap_port: Optional[int] = None
    email_smtp_host: Optional[str] = None
    email_smtp_port: Optional[int] = None
    email_address: Optional[str] = None
    email_password: Optional[str] = None

    # SMS (Twilio)
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_phone_number: Optional[str] = None


class SettingsCreate(SettingsBase):
    pass


class SettingsUpdate(BaseModel):
    app_name: Optional[str] = None
    app_email: Optional[str] = None
    app_logo: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    ai_model: Optional[str] = None
    ai_provider: Optional[str] = None

    # WhatsApp
    whatsapp_phone_id: Optional[str] = None
    whatsapp_account_id: Optional[str] = None
    whatsapp_access_token: Optional[str] = None
    whatsapp_webhook_token: Optional[str] = None

    # Email
    email_imap_host: Optional[str] = None
    email_imap_port: Optional[int] = None
    email_smtp_host: Optional[str] = None
    email_smtp_port: Optional[int] = None
    email_address: Optional[str] = None
    email_password: Optional[str] = None

    # SMS
    twilio_account_sid: Optional[str] = None
    twilio_auth_token: Optional[str] = None
    twilio_phone_number: Optional[str] = None


class SettingsRead(SettingsBase):
    id: UUID
    updated_at: datetime

    class Config:
        from_attributes = True
