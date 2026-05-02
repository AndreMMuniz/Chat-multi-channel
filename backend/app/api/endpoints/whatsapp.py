"""
WhatsApp Cloud API webhook endpoints.

GET  /whatsapp/webhook  — Meta subscription challenge verification
POST /whatsapp/webhook  — Inbound message processing (with HMAC validation)
GET  /whatsapp/status   — Check if WhatsApp is configured
"""

import hashlib
import hmac
import os
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.common import create_response, create_error_response
from app.services.whatsapp_service import WhatsAppService

router = APIRouter()


def _get_service(db: Session) -> WhatsAppService:
    """Return configured WhatsAppService or raise 503."""
    svc = WhatsAppService.from_settings(db)
    if not svc:
        error_response, status = create_error_response(
            code="WHATSAPP_NOT_CONFIGURED",
            message="WhatsApp credentials not configured in settings",
            status_code=503,
        )
        raise HTTPException(status_code=status, detail=error_response)
    return svc


def _verify_hmac(body: bytes, signature_header: str | None, app_secret: str) -> bool:
    """Validate X-Hub-Signature-256 from Meta. Skip if app_secret not set."""
    if not app_secret:
        return True  # skip in dev when secret not configured
    if not signature_header or not signature_header.startswith("sha256="):
        return False
    expected = hmac.new(
        app_secret.encode("utf-8"), body, hashlib.sha256
    ).hexdigest()
    received = signature_header[len("sha256="):]
    return hmac.compare_digest(expected, received)


# ── GET /webhook — Meta challenge handshake ──────────────────────────────────

@router.get("/webhook")
async def verify_webhook(
    hub_mode: str = Query(alias="hub.mode", default=""),
    hub_verify_token: str = Query(alias="hub.verify_token", default=""),
    hub_challenge: str = Query(alias="hub.challenge", default=""),
    db: Session = Depends(get_db),
) -> Any:
    """
    Meta calls this URL to confirm webhook ownership.
    Responds with hub.challenge when verify token matches.
    """
    svc = _get_service(db)
    challenge = svc.verify_webhook(hub_mode, hub_verify_token, hub_challenge)
    if challenge is None:
        error_response, status = create_error_response(
            code="WEBHOOK_VERIFICATION_FAILED",
            message="Invalid verify token or mode",
            status_code=403,
        )
        raise HTTPException(status_code=status, detail=error_response)
    # Meta expects a plain text/integer response — return as plain string
    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(content=challenge)


# ── POST /webhook — Inbound messages ─────────────────────────────────────────

@router.post("/webhook")
async def whatsapp_webhook(
    request: Request,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Receives inbound messages from Meta Cloud API.
    Validates HMAC-SHA256 signature before processing.
    """
    body = await request.body()

    # Signature verification
    app_secret = os.getenv("WHATSAPP_APP_SECRET", "")
    signature = request.headers.get("X-Hub-Signature-256")
    if not _verify_hmac(body, signature, app_secret):
        error_response, status = create_error_response(
            code="INVALID_SIGNATURE",
            message="HMAC signature verification failed",
            status_code=401,
        )
        raise HTTPException(status_code=status, detail=error_response)

    try:
        payload = await request.json()
    except Exception:
        error_response, status = create_error_response(
            code="INVALID_PAYLOAD",
            message="Request body is not valid JSON",
            status_code=400,
        )
        raise HTTPException(status_code=status, detail=error_response)

    svc = _get_service(db)
    await svc.process_update(payload, db)

    # Meta expects 200 OK quickly — always return success after processing
    return create_response({"status": "ok"})


# ── GET /status — health check ────────────────────────────────────────────────

@router.get("/status")
async def whatsapp_status(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Return WhatsApp configuration status."""
    from app.models.models import GeneralSettings
    cfg = db.query(GeneralSettings).first()
    configured = bool(
        cfg and cfg.whatsapp_phone_id and cfg.whatsapp_access_token
    )
    return create_response({
        "configured": configured,
        "phone_id_set": bool(cfg and cfg.whatsapp_phone_id),
        "access_token_set": bool(cfg and cfg.whatsapp_access_token),
        "webhook_token_set": bool(cfg and cfg.whatsapp_webhook_token),
        "hmac_validation": bool(os.getenv("WHATSAPP_APP_SECRET")),
    })
