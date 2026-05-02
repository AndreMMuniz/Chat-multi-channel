from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Any, Dict

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import GeneralSettings, User
from app.schemas.settings import SettingsRead, SettingsUpdate
from app.schemas.common import create_response, create_error_response
from app.services.audit_service import log_action

router = APIRouter()

def get_settings_object(db: Session) -> GeneralSettings:
    settings = db.query(GeneralSettings).first()
    if not settings:
        settings = GeneralSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.get("/")
async def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    return create_response(SettingsRead.model_validate(get_settings_object(db)))

@router.patch("/")
async def update_settings(
    request: Request,
    settings_in: SettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Update global platform settings. Requires can_change_settings permission."""
    if not current_user.user_type.can_change_settings:
        error_response, status = create_error_response(
            code="PERMISSION_DENIED",
            message="Not enough permissions",
            status_code=403
        )
        raise HTTPException(status_code=status, detail=error_response)

    settings = get_settings_object(db)
    update_data = settings_in.model_dump(exclude_unset=True)

    # Mask secret values in audit log — never log tokens/passwords
    _SECRET_KEYS = {
        "whatsapp_access_token", "whatsapp_webhook_token",
        "email_password", "twilio_auth_token",
    }
    audit_details = {
        k: ("***" if k in _SECRET_KEYS else v)
        for k, v in update_data.items()
    }

    for field, value in update_data.items():
        setattr(settings, field, value)

    db.add(settings)
    db.commit()
    db.refresh(settings)

    log_action(
        db,
        current_user.id,
        "update_settings",
        "settings",
        str(settings.id),
        details=audit_details,
        ip_address=request.client.host if request.client else None,
    )

    return create_response(SettingsRead.model_validate(settings))
