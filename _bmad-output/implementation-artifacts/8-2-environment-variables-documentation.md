# Story 8.2: Environment Variables Documentation

**Status:** review  
**Epic:** 8 — Production Hardening  
**Story Points:** 3  
**Priority:** Critical  
**Created:** 2026-04-30

---

## User Story

**As a developer,** I want a complete and accurate `backend/.env.example` file so that any new deployment can be configured correctly without tribal knowledge or hunting through source code.

---

## Background & Context

The retrospective (2026-04-29) identified that 12+ new env vars were added across Epics 4–7 without updating `.env.example`. The current `backend/.env.example` is missing roughly half the env vars the application actually consumes. This creates operational risk at deploy time: missing vars either silently use wrong defaults or cause cryptic runtime failures.

**Current state of `backend/.env.example`:** Documents only 7 vars. Missing: operational tuning, agent layer, database pool, CORS, webhooks, Twilio, and reserved future vars.

**Story 8.3 (AES-256) and 8.4 (Redis)** will add `DATABASE_ENCRYPTION_KEY` and `REDIS_URL`. Those vars should appear as commented stubs in `.env.example` now, so Story 8.3/8.4 implementers just uncomment them.

---

## Acceptance Criteria

- [ ] `backend/.env.example` documents every env var consumed anywhere in `backend/` with: description comment, type, and safe placeholder or default value.
- [ ] Vars are organized into labeled sections matching the structure below.
- [ ] The "future / reserved" section includes commented stubs for `DATABASE_ENCRYPTION_KEY` and `REDIS_URL`.
- [ ] `frontend/.env.local.example` is reviewed — it is already complete; no changes needed unless a gap is found.
- [ ] `backend/.env` is confirmed present in `backend/.gitignore` (the actual secrets file must never be committed).
- [ ] No real credentials appear anywhere in `.env.example` — all values are clearly fake placeholders.

---

## Complete Env Var Inventory

This is the ground-truth list extracted from source code on 2026-04-30. The implementation must cover all of them.

### Section 1 — Database & Auth (Supabase)
| Var | Default | Source | Notes |
|-----|---------|--------|-------|
| `DATABASE_URL` | — | `app/core/config.py`, `app/core/database.py`, `src/shared/config.py` | **Required.** PostgreSQL connection string. Use Supabase pooler URL for production. |
| `SUPABASE_URL` | — | `app/core/config.py` | **Required.** `https://your-project-id.supabase.co` |
| `SUPABASE_ANON_KEY` | — | `app/core/config.py` | **Required.** Public anon key. |
| `SUPABASE_SERVICE_ROLE_KEY` | — | `app/core/config.py` | **Required.** Service role key for admin DB operations. Keep secret. |
| `DB_POOL_SIZE` | `20` | `app/core/database.py` | SQLAlchemy base connection pool size. |
| `DB_MAX_OVERFLOW` | `30` | `app/core/database.py` | Burst connections above pool_size. Total max = pool_size + max_overflow. |

### Section 2 — AI / LLM
| Var | Default | Source | Notes |
|-----|---------|--------|-------|
| `OPENAI_API_KEY` | — | `app/core/config.py`, `src/shared/config.py`, `src/shared/llm.py`, `app/services/ai_service.py` | **Required** (one of OPENAI or OPENROUTER). Used for AI suggestions. |
| `OPENROUTER_API_KEY` | — | `app/core/config.py` | Alternative to `OPENAI_API_KEY`. If set, `config.py` prefers OPENAI; set only one. |
| `DEFAULT_AI_MODEL` | `gpt-4o-mini` | `src/shared/config.py`, `src/shared/llm.py` | Model identifier passed to LLM. |
| `DEFAULT_AI_PROVIDER` | `openrouter` | `src/shared/config.py`, `src/shared/llm.py` | LLM routing provider. |

### Section 3 — Agent Behaviour
| Var | Default | Source | Notes |
|-----|---------|--------|-------|
| `AGENT_CONTEXT_MESSAGES` | `20` | `src/shared/config.py` | Number of recent messages fed to agent as context. |
| `AGENT_SUMMARIZE_THRESHOLD` | `30` | `src/shared/config.py` | Message count at which agent summarizes conversation history. |
| `AGENT_AUTO_REPLY` | `false` | `src/shared/config.py` | `true` = agent sends replies automatically. Default `false` = suggestions only. |
| `AGENT_AUTO_REPLY_CONFIDENCE` | `0.9` | `src/shared/config.py` | Minimum confidence score (0–1) for auto-reply. Ignored if `AGENT_AUTO_REPLY=false`. |
| `WORKER_CONCURRENCY` | `4` | `src/shared/config.py` | Parallel agent worker tasks. |
| `WORKER_QUEUE_MAXSIZE` | `1000` | `src/shared/config.py` | Max in-memory queue depth before backpressure. |

### Section 4 — Channel: Telegram
| Var | Default | Source | Notes |
|-----|---------|--------|-------|
| `TELEGRAM_BOT_TOKEN` | — | `app/core/config.py` | Get from @BotFather on Telegram. |

### Section 5 — Channel: WhatsApp
| Var | Default | Source | Notes |
|-----|---------|--------|-------|
| `WHATSAPP_APP_SECRET` | — | `app/api/endpoints/whatsapp.py` | Optional. WhatsApp app secret for HMAC webhook signature validation. Recommended in production. |

> Note: `WHATSAPP_API_TOKEN`, `WHATSAPP_BUSINESS_ID` are stored in the `general_settings` DB table via Admin → Settings UI, NOT as env vars.

### Section 6 — Channel: SMS (Twilio)
| Var | Default | Source | Notes |
|-----|---------|--------|-------|
| `TWILIO_ACCOUNT_SID` | — | `src/worker/twilio_client.py` | Twilio account SID. If empty, SMS silently disabled. |
| `TWILIO_AUTH_TOKEN` | — | `src/worker/twilio_client.py` | Twilio auth token. |
| `TWILIO_PHONE_NUMBER` | — | `src/worker/twilio_client.py` | Originating phone number in E.164 format, e.g. `+15551234567`. |

> Note: Email IMAP/SMTP credentials are stored in DB via Admin → Settings UI, NOT as env vars.

### Section 7 — Deployment & Runtime
| Var | Default | Source | Notes |
|-----|---------|--------|-------|
| `ENVIRONMENT` | `development` | `app/core/config.py` | `production` enables secure (HTTPS-only) cookies. Any other value = dev mode. |
| `FRONTEND_URL` | `http://localhost:3000` | `app/core/config.py`, `app/core/email.py` | Used in password-reset email links. |
| `WEBHOOK_BASE_URL` | — | `app/core/config.py` | Public base URL for Telegram webhook registration. E.g. `https://your-app.railway.app`. |
| `ALLOWED_ORIGINS` | — | `app/core/config.py`, `main.py` | Comma-separated CORS origins. Defaults to `localhost:3000` if empty. Set to frontend Vercel URL in production. |
| `PORT` | `8000` | `main.py` | HTTP server port. Railway sets this automatically. |

### Section 8 — Operational Tuning
| Var | Default | Source | Notes |
|-----|---------|--------|-------|
| `EMAIL_POLL_INTERVAL_SECONDS` | `60` | `main.py` | How often the IMAP poller checks for new email. |
| `SLA_CHECK_INTERVAL_SECONDS` | `120` | `main.py` | How often the SLA background loop runs. |
| `SLA_THRESHOLD_MINUTES` | `60` | `main.py`, `app/api/endpoints/dashboard.py` | Minutes before a conversation is flagged as SLA risk. |
| `DELIVERY_ALERT_THRESHOLD` | `5` | `app/services/delivery_alert_service.py` | Failed delivery count within window to trigger manager alert. |
| `DELIVERY_ALERT_WINDOW_MINUTES` | `10` | `app/services/delivery_alert_service.py` | Sliding window (minutes) for delivery failure counting. |

### Section 9 — Future / Reserved (commented stubs)
| Var | Story | Notes |
|-----|-------|-------|
| `DATABASE_ENCRYPTION_KEY` | 8.3 | AES-256 key for encrypting channel credentials at rest. 32-byte hex string. |
| `REDIS_URL` | 8.4 | Redis connection string for durable agent task queue. E.g. `redis://localhost:6379/0`. |

---

## Files to Modify

| File | Action | Notes |
|------|--------|-------|
| `backend/.env.example` | **REWRITE** | Replace current sparse file with the complete version per this story. |
| `backend/.gitignore` | **VERIFY** | Confirm `.env` is listed. If missing, add it. Do NOT modify `.env` itself. |
| `frontend/.env.local.example` | **VERIFY** | Read current state; update only if a gap is found. Current state looks correct. |

**Do NOT modify:**
- `backend/.env` — real secrets file, never touched by this story
- Any Python source file — this story is documentation only
- Any migration file

---

## Implementation Guide

### Step 1 — Check `.gitignore`

Read `backend/.gitignore`. Confirm `.env` is listed. If not, add it on its own line.

### Step 2 — Rewrite `backend/.env.example`

Replace the file content entirely. Structure it with comment headers per the sections above. Follow this format for each var:

```bash
# <one-line description> | type: <str|int|bool|float> | required: <yes|no|if X>
VAR_NAME=placeholder_or_default
```

For future/reserved vars, use a commented-out block:

```bash
# ── Future: Story 8.3 — AES-256 Credential Encryption ──────────────────────
# 32-byte hex string. Generate with: python3 -c "import secrets; print(secrets.token_hex(32))"
# DATABASE_ENCRYPTION_KEY=
```

### Step 3 — Verify `frontend/.env.local.example`

Read the current file. It currently has `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` with dev/prod examples — this is correct and complete. No changes needed unless you find a gap.

### Step 4 — Validate

- Open `backend/.env.example` and cross-check every var in the inventory table above is present.
- Confirm no real credentials appear (no JWT tokens, no API keys starting with `sk-`, no real URLs).
- Confirm commented stubs for `DATABASE_ENCRYPTION_KEY` and `REDIS_URL` are present.

---

## Definition of Done

- [x] `backend/.env.example` contains all vars from the inventory (sections 1–9).
- [x] All values in `.env.example` are clearly fake/placeholder — no real secrets.
- [x] `DATABASE_ENCRYPTION_KEY` and `REDIS_URL` appear as commented stubs in the "Future" section.
- [x] `backend/.gitignore` confirmed to list `.env` (root `.gitignore` line 19: `backend/.env`).
- [x] `frontend/.env.local.example` verified — complete and correct, no changes needed.
- [x] Sprint status updated: `8-2-environment-variables-documentation: review`.

---

## Dev Agent Record

**Completed:** 2026-04-30  
**Implemented by:** Amelia (Dev Agent)

### Completion Notes

- Rewrote `backend/.env.example` from 7 vars to 28 vars across 9 labeled sections.
- No new vars were invented — every entry was traced to a specific source file via `os.getenv` or `BaseSettings` scan.
- Confirmed root `.gitignore` already has `backend/.env` at line 19 — no change needed.
- `frontend/.env.local.example` already correct — no changes made.
- Story is documentation-only: no application code was modified, no tests required.
- `DATABASE_ENCRYPTION_KEY` and `REDIS_URL` added as commented stubs in Section 9 to unblock Stories 8.3 and 8.4.

### Files Modified

| File | Action |
|------|--------|
| `backend/.env.example` | Rewritten — 7 → 28 vars, 9 sections |
| `frontend/.env.local.example` | Verified — no changes |
| `.gitignore` | Verified — no changes |
