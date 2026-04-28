"""
Channel webhook endpoints for inbound messages.

Routes:
  GET  /channels/whatsapp/webhook  — Meta webhook verification
  POST /channels/whatsapp/webhook  — Inbound WhatsApp messages
  POST /channels/sms/webhook       — Inbound Twilio SMS messages

Telegram webhook is handled in telegram.py (existing).
Email inbound is handled via IMAP polling (no webhook).
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.common import create_response, create_error_response

router = APIRouter()


# ── WhatsApp ──────────────────────────────────────────────────────────────────

@router.get("/whatsapp/webhook")
async def whatsapp_verify(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
    db: Session = Depends(get_db),
) -> PlainTextResponse:
    """Meta webhook subscription verification."""
    from app.services.whatsapp_service import WhatsAppService
    svc = WhatsAppService.from_settings(db)
    if not svc:
        raise HTTPException(status_code=503, detail="WhatsApp not configured")

    challenge = svc.verify_webhook(
        mode=hub_mode or "",
        token=hub_verify_token or "",
        challenge=hub_challenge or "",
    )
    if challenge is None:
        raise HTTPException(status_code=403, detail="Verification failed")

    return PlainTextResponse(content=challenge)


@router.post("/whatsapp/webhook")
async def whatsapp_inbound(request: Request, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Process inbound WhatsApp messages from Meta webhook."""
    from app.services.whatsapp_service import WhatsAppService
    svc = WhatsAppService.from_settings(db)
    if not svc:
        # Return 200 to Meta even if unconfigured (prevent retry storm)
        return create_response({"status": "not_configured"})

    payload = await request.json()
    await svc.process_update(payload, db)
    return create_response({"status": "ok"})


# ── SMS (Twilio) ──────────────────────────────────────────────────────────────

@router.post("/sms/webhook")
async def sms_inbound(request: Request, db: Session = Depends(get_db)) -> PlainTextResponse:
    """
    Process inbound Twilio SMS messages.
    Twilio sends form-encoded POST with From and Body fields.
    Response must be empty TwiML (200 OK) to suppress Twilio error retries.
    """
    from app.services.sms_service import SMSService
    form = await request.form()
    from_number = form.get("From", "")
    body = form.get("Body", "")

    if from_number and body:
        svc = SMSService.from_settings(db)
        if svc:
            await svc.process_update(from_number, body, db)

    # Return empty TwiML — Twilio requires a valid XML response
    return PlainTextResponse(
        content='<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        media_type="application/xml",
    )
