# Story 2.4: Inbound Message Ingestion

**Epic:** 2 — Multi-Channel Conversation Management  
**Story ID:** 2.4  
**Status:** ready-for-dev  
**Estimation:** 5 story points  
**Date Created:** 2026-04-29

---

## User Story

**As the system,** I want to ingest inbound messages from all supported channels (Telegram, WhatsApp, Email) so that conversations are updated in real-time and agents can respond.

---

## Pre-Implementation Analysis

### What Already Exists (DO NOT rebuild)

| Channel | Webhook/Polling | Service | Status |
|---------|----------------|---------|--------|
| Telegram | `POST /api/v1/telegram/webhook` | `telegram_service.py` | ✅ DONE |
| WhatsApp | `POST /api/v1/whatsapp/webhook` + `POST /api/v1/channels/whatsapp/webhook` | `whatsapp_service.py` | ✅ DONE |
| Email | No webhook (IMAP) | `email_service.py` `poll_and_process()` | ⚠️ SERVICE EXISTS, NOT WIRED |

**Frontend (Stories 2.1, 2.2, 2.3): ALREADY IMPLEMENTED**
- `frontend/src/app/page.tsx` — full 3-column inbox with conversation list, thread view, send message
- `frontend/src/hooks/useConversations.ts` — conversation list + WS events
- `frontend/src/hooks/useMessages.ts` — message history + optimistic send
- `frontend/src/hooks/useWebSocket.ts` — real-time subscribe/ack/ping protocol

---

## Acceptance Criteria

### AC1: Telegram inbound works end-to-end
- Given a Telegram user sends a message to the bot
- When the bot receives the update and calls `POST /api/v1/telegram/webhook`
- Then a new message appears in the unified inbox in real-time via WebSocket

### AC2: WhatsApp inbound works end-to-end
- Given a WhatsApp user sends a message
- When Meta calls `POST /api/v1/whatsapp/webhook`
- Then the message is processed, contact/conversation created if needed, and broadcast via WebSocket

### AC3: Email inbound is polled at startup
- Given email credentials are configured in GeneralSettings
- When the application starts
- Then a background task polls IMAP every 60 seconds for unseen emails
- And each unseen email creates/updates a contact, conversation, and message
- And the message is broadcast via WebSocket to subscribed clients

### AC4: Email polling is resilient to failures
- Given IMAP credentials are wrong or IMAP server is unreachable
- When the polling task runs
- Then the error is logged and the scheduler continues without crashing the app

### AC5: Email polling stops cleanly on shutdown
- Given the app is shutting down via SIGTERM
- When the lifespan context manager exits
- Then the email polling background task is cancelled cleanly

---

## Technical Gap: Email IMAP Polling

### The Problem

`EmailService.poll_and_process()` exists in `backend/app/services/email_service.py` but is **never called**. The `main.py` lifespan only wires Telegram webhook registration.

### The Fix

Wire an `asyncio` background task in `main.py` `lifespan()` that:
1. Checks if `EmailService.from_settings(db)` returns a service (i.e., email is configured)
2. Runs `poll_and_process()` on a 60-second interval in a background task
3. Cancels the task cleanly on shutdown

### Implementation Plan

#### File: `backend/main.py`

Add email polling to the lifespan context manager:

```python
import asyncio
from app.core.database import SessionLocal
from app.services.email_service import EmailService

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Telegram webhook registration (existing)
    base_url = settings.WEBHOOK_BASE_URL.rstrip("/")
    if base_url and settings.TELEGRAM_BOT_TOKEN:
        webhook_url = f"{base_url}/api/v1/telegram/webhook"
        await telegram_service.set_webhook(webhook_url)
    
    # Email IMAP polling background task (NEW)
    email_task = asyncio.create_task(_email_poll_loop())
    
    yield
    
    # Cleanup
    email_task.cancel()
    try:
        await email_task
    except asyncio.CancelledError:
        pass


async def _email_poll_loop():
    """Background task: poll IMAP every 60 seconds for new emails."""
    while True:
        try:
            db = SessionLocal()
            try:
                svc = EmailService.from_settings(db)
                if svc:
                    await svc.poll_and_process(db)
            finally:
                db.close()
        except Exception as e:
            print(f"[EmailPoller] Error: {e}")
        await asyncio.sleep(60)
```

#### Key Decisions

- **60-second interval**: Reasonable for email — not a real-time channel. Configurable via env var `EMAIL_POLL_INTERVAL_SECONDS` in future.
- **SessionLocal per poll**: Each poll cycle gets a fresh DB session to avoid stale connections.
- **Graceful degradation**: If email not configured, `from_settings()` returns None and polling is skipped silently.
- **No APScheduler**: `asyncio.create_task` + `asyncio.sleep` is sufficient for single-tenant MVP. APScheduler adds complexity without benefit at this scale.
- **CancelledError catch**: Prevents noisy shutdown logs.

---

## Files to Modify

| File | Change |
|------|--------|
| `backend/main.py` | Add `_email_poll_loop()` function and wire it in `lifespan()` |

## Files NOT to Modify

| File | Why |
|------|-----|
| `backend/app/services/email_service.py` | Already correct — `poll_and_process()` is ready |
| `backend/app/services/whatsapp_service.py` | Already correct |
| `backend/app/services/telegram_service.py` | Already correct |
| `frontend/src/app/page.tsx` | Already implements full inbox UI |
| Any hook files | Already implemented |

---

## Dev Notes

- `SessionLocal` is imported from `app.core.database` (same pattern as `get_db` dependency)
- `EmailService.from_settings()` already handles the "not configured" case by returning `None`
- `poll_and_process()` already uses `asyncio.to_thread()` for the blocking IMAP calls — safe to `await` from async context
- The WhatsApp endpoint has HMAC validation via `WHATSAPP_APP_SECRET` env var (optional in dev)
- Both `channels.py` and `whatsapp.py` expose WhatsApp webhooks — this is intentional (channels.py is the newer canonical route)

---

## Testing Checklist

- [ ] Start app with email credentials set in DB → verify polling loop starts (check logs)
- [ ] Start app with NO email credentials → verify polling loop runs but does nothing (no crash)
- [ ] CTRL+C app → verify clean shutdown (no unhandled CancelledError in logs)
- [ ] Manually call `POST /api/v1/telegram/webhook` with test payload → verify message appears in frontend inbox
- [ ] Manually call `POST /api/v1/whatsapp/webhook` with test payload → verify message appears in frontend inbox
