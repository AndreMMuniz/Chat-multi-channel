# Story 8.8: API Key Startup Validation

**Status:** ready-for-dev
**Epic:** 8 — Production Hardening
**Story Points:** 2
**Priority:** Important
**Created:** 2026-04-30

---

## User Story

**As the system,** I want the application to fail fast on startup if required API keys are missing so that silent misconfiguration is prevented.

---

## Background & Context

**Retro finding (2026-04-29):** `DATABASE_ENCRYPTION_KEY` is now validated at startup (Story 8.3). `OPENAI_API_KEY` is not — if it's missing the app boots silently, and AI suggestions fail at runtime per-request, giving operators no early warning.

**What already exists (DO NOT duplicate):**

In `main.py` (from Story 8.3):
```python
def _validate_encryption_key() -> None:
    """Fail fast if DATABASE_ENCRYPTION_KEY is missing or malformed in production."""
    key_hex = os.getenv("DATABASE_ENCRYPTION_KEY", "")
    env = os.getenv("ENVIRONMENT", "development")
    if env == "production" and not key_hex:
        import sys
        print("CRITICAL: DATABASE_ENCRYPTION_KEY is not set in production. ...", flush=True)
        sys.exit(1)
    if key_hex:
        try:
            key = bytes.fromhex(key_hex)
            if len(key) != 32:
                raise ValueError(...)
        except Exception as exc:
            import sys
            print(f"CRITICAL: Invalid DATABASE_ENCRYPTION_KEY: {exc}. Exiting.", flush=True)
            sys.exit(1)

_validate_encryption_key()
```

**OPENAI_API_KEY resolution in `app/core/config.py`:**
```python
OPENAI_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "") or os.getenv("OPENAI_API_KEY", "")
```
So `settings.OPENAI_API_KEY` is non-empty if **either** `OPENROUTER_API_KEY` or `OPENAI_API_KEY` is set.

---

## Design

Follow the exact same pattern as `_validate_encryption_key()`:
- **In production (`ENVIRONMENT=production`):** exit if key is missing.
- **In development:** log a warning (don't exit — dev may intentionally skip AI).
- Run at module level, before any route registration, after `_validate_encryption_key()`.

Error message must name the missing variable(s) and reference `.env.example`.

---

## Files to Modify

| File | Action | Notes |
|------|--------|-------|
| `backend/main.py` | **UPDATE** | Add `_validate_ai_key()` function + call at module level |

**Do NOT modify:** `app/core/config.py`, `app/services/ai_service.py`, or any other file.

---

## Implementation Guide

Add to `main.py` immediately after `_validate_encryption_key()`:

```python
def _validate_ai_key() -> None:
    """Warn (dev) or exit (production) if no LLM API key is configured."""
    from app.core.config import settings
    env = os.getenv("ENVIRONMENT", "development")

    if not settings.OPENAI_API_KEY:
        msg = (
            "AI API key is not set. AI suggestions will not work. "
            "Set OPENROUTER_API_KEY or OPENAI_API_KEY — see backend/.env.example."
        )
        if env == "production":
            import sys
            print(f"CRITICAL: {msg} Exiting.", flush=True)
            sys.exit(1)
        else:
            import logging
            logging.getLogger(__name__).warning(msg)


_validate_encryption_key()
_validate_ai_key()
```

**That is the entire implementation.** No other files change.

---

## Acceptance Criteria

- [ ] `_validate_ai_key()` called at module level in `main.py`, after `_validate_encryption_key()`.
- [ ] In `ENVIRONMENT=production` with no `OPENAI_API_KEY` or `OPENROUTER_API_KEY`: app prints "CRITICAL: AI API key is not set..." and exits with code 1.
- [ ] In `ENVIRONMENT=development` (or any non-production) with no key: app boots normally but logs a warning.
- [ ] If either `OPENROUTER_API_KEY` or `OPENAI_API_KEY` is set: no warning, no exit.
- [ ] Error message references `backend/.env.example`.
- [ ] Existing `_validate_encryption_key()` is unchanged.
- [ ] All 106+ existing tests pass.

---

## Definition of Done

- [ ] `_validate_ai_key()` function added and called in `main.py`.
- [ ] Manually verified: `ENVIRONMENT=production python -c "import main"` with no key → exits 1 with clear message.
- [ ] Manually verified: `ENVIRONMENT=development python -c "import main"` with no key → boots with WARNING log.
- [ ] Sprint status updated: `8-8-api-key-startup-validation: review`.
