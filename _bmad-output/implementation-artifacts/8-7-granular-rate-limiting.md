# Story 8.7: Granular Rate Limiting

**Status:** ready-for-dev
**Epic:** 8 — Production Hardening
**Story Points:** 5
**Priority:** Important
**Created:** 2026-04-30

---

## User Story

**As the system,** I want per-endpoint rate limits configured so that abuse is mitigated and legitimate users are protected from noisy neighbours.

---

## Background & Context

**Retro finding (2026-04-29):** Only 3 endpoints are rate-limited (login, signup, forgot-password). All `/chat/`, `/admin/`, and `/upload/` endpoints are unlimited — vulnerable to scraping and DoS from a single compromised token.

**Current state (DO NOT change):**
- `POST /api/v1/auth/login` — 10/minute per IP (`@limiter.limit("10/minute")`)
- `POST /api/v1/auth/signup` — 5/minute per IP
- `POST /api/v1/auth/forgot-password` — 3/minute per IP

**Limiter already wired in `main.py`:**
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

---

## Design Decisions

### Key function strategy
Auth endpoints (login/signup) stay keyed by IP — they're per-visitor. Authenticated API endpoints should be keyed by user token to prevent a single user from hammering the API, regardless of IP (proxy, mobile carrier NAT, etc.).

Add a `_get_user_or_ip` function in `main.py`:

```python
def _get_user_or_ip(request: Request) -> str:
    """Rate limit key: user token (authenticated) or IP (anonymous)."""
    # Check Authorization header (Bearer token)
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
        return f"user:{token[:64]}"  # first 64 chars sufficient as unique key
    # Check HttpOnly access_token cookie
    token = request.cookies.get("access_token", "")
    if token:
        return f"user:{token[:64]}"
    return get_remote_address(request)
```

### Scope of the 60/min general limit
Apply to high-traffic / abuse-risk endpoints only:
- All `/chat/conversations` endpoints (list, messages, send, assign, retry, suggestions)
- All `/admin/` endpoints that read/write data
- `/upload/` endpoint

Do NOT apply to: WebSocket (`/chat/ws`) — incompatible with slowapi; health check — should be unlimited.

### Response headers
slowapi automatically adds `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` and `Retry-After` to 429 responses when using `_rate_limit_exceeded_handler`. No extra code needed for headers.

---

## Files to Modify

| File | Action | Notes |
|------|--------|-------|
| `backend/main.py` | **UPDATE** | Add `_get_user_or_ip` function; update `Limiter(key_func=...)` |
| `backend/app/api/endpoints/chat.py` | **UPDATE** | Add `@limiter.limit("60/minute")` to applicable routes |
| `backend/app/api/endpoints/users.py` | **UPDATE** | Add `@limiter.limit("60/minute")` to applicable routes |
| `backend/app/api/endpoints/dashboard.py` | **UPDATE** | Add `@limiter.limit("60/minute")` |
| `backend/app/api/endpoints/upload.py` | **UPDATE** | Add `@limiter.limit("30/minute")` (stricter — large payloads) |
| `backend/app/api/endpoints/config_routes.py` | **UPDATE** | Add `@limiter.limit("30/minute")` (settings writes) |

**Do NOT modify:** `auth.py` (existing limits stay as-is), `telegram.py`/`whatsapp.py` (webhook endpoints must not be rate-limited — they receive external traffic).

---

## Implementation Guide

### Step 1 — Update `main.py`

**Change 1:** Import `Request` from FastAPI (needed for the key function).

**Change 2:** Add `_get_user_or_ip` function right after the existing imports, before `_validate_encryption_key()`.

**Change 3:** Update `limiter` to use the new key function for the default — but leave auth endpoints with IP-based limits by using explicit `key_func` override in those routes.

Actually, the cleaner approach: keep the global `limiter` with `get_remote_address` (for auth endpoints). Create a second limiter for authenticated endpoints:

```python
from slowapi.util import get_remote_address
from fastapi import Request

limiter = Limiter(key_func=get_remote_address)  # IP-based for auth (keep as-is)

def _get_user_or_ip(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return f"user:{auth[7:71]}"
    token = request.cookies.get("access_token", "")
    if token:
        return f"user:{token[:64]}"
    return get_remote_address(request)

api_limiter = Limiter(key_func=_get_user_or_ip)  # user-keyed for API endpoints
app.state.limiter = limiter  # keep this for backwards compat with auth routes
```

Wait — slowapi uses `app.state.limiter` to resolve which limiter to use. You can only have one `app.state.limiter`. The simpler approach: use a single limiter with `_get_user_or_ip` as the default key, and override at the route level for auth endpoints using `key_func` parameter in `@limiter.limit()`.

**Correct implementation:**

```python
# main.py — replace the existing limiter line with:

def _get_user_or_ip(request: Request) -> str:
    """Key function: user token for authenticated, IP for anonymous."""
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return f"user:{auth[7:71]}"
    token = request.cookies.get("access_token", "")
    if token:
        return f"user:{token[:64]}"
    return get_remote_address(request)

limiter = Limiter(key_func=_get_user_or_ip)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

Then in auth endpoints, override the key function:
```python
# auth.py — update existing limits to force IP-based
@router.post("/login")
@limiter.limit("10/minute", key_func=get_remote_address)  # keep IP-based
async def login(...):
```

### Step 2 — Apply limits to chat endpoints

In `app/api/endpoints/chat.py`, add to the most-used routes:

```python
from app.core.limiter import limiter  # or import from main — verify import path

# Apply to:
@router.get("/conversations")
@limiter.limit("60/minute")
async def get_conversations(request: Request, ...):

@router.post("/conversations/{conversation_id}/messages")
@limiter.limit("60/minute")
async def send_message(request: Request, ...):

@router.post("/conversations/{conversation_id}/suggestions/generate")
@limiter.limit("30/minute")  # stricter — triggers LLM
async def generate_suggestions(request: Request, ...):
```

**IMPORTANT:** slowapi requires `request: Request` as an explicit parameter in the route handler. Verify all decorated handlers include it. Add `request: Request` as a parameter where missing.

### Step 3 — Apply limits to admin and upload endpoints

Same pattern in `users.py`, `dashboard.py`, `config_routes.py`, `upload.py`:

```python
@router.get("/")
@limiter.limit("60/minute")
async def list_users(request: Request, ...):
```

```python
# upload.py — stricter limit (file payload)
@router.post("/")
@limiter.limit("30/minute")
async def upload_file(request: Request, ...):
```

### Step 4 — Verify limiter import path

The `limiter` object is instantiated in `main.py`. Routes are in `app/api/endpoints/`. To avoid circular imports, move the limiter to its own module:

Create `backend/app/core/limiter.py`:
```python
"""Shared rate limiter instance."""
from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address


def _get_user_or_ip(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return f"user:{auth[7:71]}"
    token = request.cookies.get("access_token", "")
    if token:
        return f"user:{token[:64]}"
    return get_remote_address(request)


limiter = Limiter(key_func=_get_user_or_ip)
```

Then in `main.py`:
```python
from app.core.limiter import limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

And in endpoint files:
```python
from app.core.limiter import limiter
from slowapi.util import get_remote_address
```

In `auth.py` (keep IP-based for login/signup):
```python
from app.core.limiter import limiter
from slowapi.util import get_remote_address

@router.post("/login")
@limiter.limit("10/minute", key_func=get_remote_address)
async def login(request: Request, ...):
```

---

## Acceptance Criteria

- [ ] Login: 10 req/min per IP — unchanged.
- [ ] Signup: 5 req/min per IP — unchanged.
- [ ] General API endpoints: 60 req/min per authenticated user (or IP if anonymous).
- [ ] Upload: 30 req/min per user.
- [ ] AI suggestion generate: 30 req/min per user (LLM cost protection).
- [ ] `POST /api/v1/auth/login` with 11 rapid requests returns 429 on the 11th.
- [ ] `GET /api/v1/chat/conversations` with 61 rapid requests returns 429 on the 61st.
- [ ] 429 response includes `Retry-After` header.
- [ ] Webhook endpoints (`/telegram/webhook`, `/whatsapp/webhook`) are NOT rate-limited.
- [ ] WebSocket endpoint (`/chat/ws`) is NOT rate-limited.
- [ ] No circular import errors on startup.

---

## Definition of Done

- [ ] `backend/app/core/limiter.py` created with shared `limiter` instance and `_get_user_or_ip`.
- [ ] `main.py` updated to import from `app.core.limiter`.
- [ ] Auth routes keep IP-based limiting (`key_func=get_remote_address` override).
- [ ] Chat, admin, upload endpoints decorated with appropriate limits.
- [ ] App starts without errors.
- [ ] Manual test: 11 rapid login attempts → 429 on 11th.
- [ ] Sprint status updated: `8-7-granular-rate-limiting: review`.

---

### Review Findings (2026-04-30)

- [x] [Review][Patch] Raw auth token stored verbatim as rate-limit store key — **FIXED**: token now hashed with sha256 before use as key [`backend/app/core/limiter.py`]
- [x] [Review][Patch] Malformed/empty Bearer or whitespace cookie collapses to key `"user:"` — **FIXED**: token stripped and validated non-empty before hashing [`backend/app/core/limiter.py`]
- [x] [Review][Patch] PATCH /conversations, PATCH /assign, POST /retry (20/min), GET /suggestions — **FIXED**: `@limiter.limit` decorators added to all 4 endpoints [`backend/app/api/endpoints/chat.py`]
- [x] [Review][Defer] IP-based limiting on auth endpoints bypassable via proxy/IP cycling — pre-existing behavior, not introduced by this story — deferred, pre-existing
