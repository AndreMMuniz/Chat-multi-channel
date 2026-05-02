"""Twilio SMS/WhatsApp sender used by the worker for auto-replies on those channels."""

import os
import logging
from typing import Optional

log = logging.getLogger(__name__)


async def send_sms(to: str, body: str, from_number: Optional[str] = None) -> bool:
    """Send an SMS via Twilio REST API."""
    import httpx

    account_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")
    from_num = from_number or os.getenv("TWILIO_PHONE_NUMBER", "")

    if not all([account_sid, auth_token, from_num]):
        log.warning("Twilio credentials not configured — SMS not sent")
        return False

    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
    try:
        async with httpx.AsyncClient(auth=(account_sid, auth_token)) as client:
            res = await client.post(url, data={"To": to, "From": from_num, "Body": body})
            return res.status_code in (200, 201)
    except Exception as exc:
        log.error("Twilio send error: %s", exc)
        return False
