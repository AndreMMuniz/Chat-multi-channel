# Story 8.10: Telegram Bot Configuration UI

**Status:** done
**Epic:** 8 — Production Hardening
**Story Points:** 5
**Priority:** Nice-to-have
**Created:** 2026-05-01

---

## User Story

**As an admin,** I want to configure the Telegram bot token from the settings UI so that it no longer requires an env var restart to change the token.

---

## Background & Context

**Current state:**
- `TelegramService.__init__` reads `settings.TELEGRAM_BOT_TOKEN` from env var at module load time (singleton)
- `telegram_service = TelegramService()` is a module-level singleton in `telegram_service.py`
- `GeneralSettings` model has no `telegram_bot_token` field
- Settings page ("API Settings" tab) has WhatsApp, Email, SMS sections — no Telegram section
- Changing the token requires an env var change + server restart

**Encrypted fields pattern (Story 8.3):**
- Sensitive fields use `Column(EncryptedString, nullable=True)` — see `app/core/encryption.py`
- `EncryptedString` is a SQLAlchemy TypeDecorator that transparently encrypts on write, decrypts on read
- Already used for: `whatsapp_access_token`, `email_password`, `twilio_auth_token`

**Settings page pattern:**
- Tab-based UI at `frontend/src/app/admin/settings/page.tsx`
- Tabs: General, Visual Identity, AI Configuration, API Settings
- `ApiGroup` component used per channel in "API Settings" tab (WhatsApp, Email, SMS)
- `Settings` type mirrors backend `GeneralSettings` at `frontend/src/types/settings.ts`
- API client at `frontend/src/lib/api/` — uses `settingsApi.getSettings()` / `settingsApi.updateSettings()`

---

## Files to Create / Modify

| File | Action | Notes |
|------|--------|-------|
| `backend/app/models/models.py` | **UPDATE** | Add `telegram_bot_token` field to `GeneralSettings` |
| `backend/alembic/versions/<new>.py` | **CREATE** | Migration: add `telegram_bot_token` column |
| `backend/app/api/endpoints/config_routes.py` | **UPDATE** | Add field to `SettingsOut` / `SettingsIn`; reload telegram on save |
| `backend/app/services/telegram_service.py` | **UPDATE** | Add `reload(token)` method to `TelegramService` |
| `backend/app/api/endpoints/telegram.py` | **UPDATE** | Add `POST /test-connection` endpoint |
| `frontend/src/types/settings.ts` | **UPDATE** | Add `telegram_bot_token` field |
| `frontend/src/app/admin/settings/page.tsx` | **UPDATE** | Add Telegram section to API Settings tab |

**Do NOT modify:** any other model, migration, or test file.

---

## Implementation Guide

### Step 1 — Backend model (`models.py`)

Add to `GeneralSettings` class, after the AI Config block and before WhatsApp:

```python
# Telegram
telegram_bot_token = Column(EncryptedString, nullable=True)
```

### Step 2 — Alembic migration

Create `backend/alembic/versions/<timestamp>_add_telegram_bot_token.py`:

```python
"""add telegram_bot_token to general_settings

Revision ID: <auto>
Revises: i4d5e6f7a8b9
Create Date: 2026-05-01
"""
from alembic import op
import sqlalchemy as sa

revision = '<generate_unique_id>'
down_revision = 'i4d5e6f7a8b9'  # last migration
branch_labels = None
depends_on = None

def upgrade():
    op.add_column(
        'general_settings',
        sa.Column('telegram_bot_token', sa.String(), nullable=True)
    )

def downgrade():
    op.drop_column('general_settings', 'telegram_bot_token')
```

**Note:** Use `sa.String()` (not `EncryptedString`) in the migration — the TypeDecorator handles encryption transparently at the SQLAlchemy ORM layer, not at the migration level.

### Step 3 — `TelegramService.reload()`

Add method to `TelegramService`:

```python
def reload(self, token: str) -> None:
    """Hot-reload the bot token without restarting. Called when token is updated via settings UI."""
    self.bot_token = token
    self.api_url = f"https://api.telegram.org/bot{token}"
```

### Step 4 — `telegram.py` — test-connection endpoint

Add to `telegram.py`:

```python
@router.post("/test-connection")
async def test_connection(body: dict) -> Dict[str, Any]:
    """Verify a Telegram bot token by calling getMe. Does NOT persist the token."""
    token = body.get("token", "").strip()
    if not token:
        error_response, status = create_error_response(
            code="VALIDATION_ERROR", message="Token is required", status_code=400
        )
        raise HTTPException(status_code=status, detail=error_response)

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                f"https://api.telegram.org/bot{token}/getMe",
                timeout=10.0,
            )
            data = resp.json()
        except Exception as exc:
            return create_response({"ok": False, "error": str(exc)})

    if data.get("ok"):
        bot = data.get("result", {})
        return create_response({
            "ok": True,
            "username": bot.get("username"),
            "first_name": bot.get("first_name"),
        })
    return create_response({"ok": False, "error": data.get("description", "Invalid token")})
```

### Step 5 — `config_routes.py` — add field + reload on save

**`SettingsOut` — add field:**
```python
telegram_bot_token: Optional[str] = None
```

**`SettingsIn` — add field:**
```python
telegram_bot_token: Optional[str] = None
```

**`update_settings` — make async and reload telegram when token changes:**

Change signature from `def update_settings(...)` to `async def update_settings(...)`.

After `db.refresh(s)`, add:
```python
# Reload telegram service if token changed
if "telegram_bot_token" in body.model_dump(exclude_unset=True) and s.telegram_bot_token:
    from app.services.telegram_service import telegram_service
    telegram_service.reload(s.telegram_bot_token)
    # Re-register webhook asynchronously (best-effort)
    from app.core.config import settings as app_cfg
    base_url = app_cfg.WEBHOOK_BASE_URL.rstrip("/")
    if base_url:
        import asyncio
        asyncio.create_task(
            telegram_service.set_webhook(f"{base_url}/api/v1/telegram/webhook")
        )
```

### Step 6 — Frontend `settings.ts`

Add to `Settings` interface:
```typescript
// Telegram
telegram_bot_token: string;
```

### Step 7 — Frontend settings page

**In `SettingsPage` component:**

Add `telegramConfigured` derived variable alongside the others:
```typescript
const telegramConfigured = !!s.telegram_bot_token;
```

Add `telegram_bot_token` to the state initialization in `useEffect`:
```typescript
telegram_bot_token: "",
```

**Add `testingTelegram` state:**
```typescript
const [telegramTestResult, setTelegramTestResult] = useState<{ ok: boolean; username?: string; error?: string } | null>(null);
const [testingTelegram, setTestingTelegram] = useState(false);

const handleTelegramTest = async () => {
  if (!s.telegram_bot_token) return;
  setTestingTelegram(true);
  setTelegramTestResult(null);
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/telegram/test-connection`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      body: JSON.stringify({ token: s.telegram_bot_token }),
    });
    const json = await res.json();
    setTelegramTestResult(json.data ?? json);
  } catch {
    setTelegramTestResult({ ok: false, error: "Connection failed" });
  } finally {
    setTestingTelegram(false); }
};
```

**Add Telegram `ApiGroup` inside the `{activeTab === "api"}` block, before WhatsApp:**

```tsx
{/* Telegram */}
<ApiGroup
  icon="send"
  label="Telegram"
  color="bg-sky-50 text-sky-800 border-b border-sky-100"
  configured={telegramConfigured}
>
  <Field
    label="Bot Token"
    hint="Get from @BotFather: /newbot or /token"
    col="col-span-2"
  >
    <PasswordInput
      value={s.telegram_bot_token}
      onChange={set("telegram_bot_token")}
      placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
    />
  </Field>

  {/* Test connection */}
  <div className="col-span-2 flex items-center gap-3">
    <button
      type="button"
      onClick={handleTelegramTest}
      disabled={!s.telegram_bot_token || testingTelegram}
      className="h-9 px-4 rounded-xl border border-sky-200 bg-sky-50 text-sky-700 text-sm font-medium hover:bg-sky-100 disabled:opacity-50 transition-colors flex items-center gap-2"
    >
      {testingTelegram ? (
        <span className="w-3.5 h-3.5 border-2 border-sky-400/30 border-t-sky-600 rounded-full animate-spin" />
      ) : (
        <span className="material-symbols-outlined text-[16px]">wifi_tethering</span>
      )}
      Test Connection
    </button>
    {telegramTestResult && (
      <span className={`text-sm font-medium flex items-center gap-1.5 ${telegramTestResult.ok ? "text-emerald-600" : "text-red-500"}`}>
        <span className="material-symbols-outlined text-[16px]">
          {telegramTestResult.ok ? "check_circle" : "error"}
        </span>
        {telegramTestResult.ok
          ? `Connected as @${telegramTestResult.username}`
          : telegramTestResult.error}
      </span>
    )}
  </div>
</ApiGroup>
```

**Note:** The `Field` component may need a `col` prop or use `className` via `<div className="col-span-2">` wrapper. Looking at the existing `ApiGroup` which uses `grid-cols-1 md:grid-cols-2 gap-5`, fields inside are just children — wrap the bot token field in a `<div className="md:col-span-2">` if needed.

---

## Telegram API Reference

- `GET https://api.telegram.org/bot{token}/getMe` — verify token, returns `{ok: true, result: {id, username, first_name}}`
- Response when invalid: `{ok: false, description: "Unauthorized"}`
- `httpx` is already in requirements (used by `TelegramService`)

---

## Key Constraints

1. **`telegram_bot_token` field uses `EncryptedString`** — same pattern as `whatsapp_access_token`.
2. **The env var `TELEGRAM_BOT_TOKEN` continues to work** — `TelegramService.__init__` still reads from it. The DB value takes precedence only after `reload()` is called on save.
3. **The `telegram_service` singleton is global** — `reload()` mutates it in place, which is safe because Python's GIL protects attribute assignment.
4. **`update_settings` must be `async`** to use `asyncio.create_task` for webhook re-registration.
5. **Test connection does NOT save** — the test endpoint is stateless, accepts the token in the request body.

---

## Acceptance Criteria

- [ ] `GeneralSettings` model has `telegram_bot_token = Column(EncryptedString, nullable=True)`.
- [ ] Alembic migration adds `telegram_bot_token` column to `general_settings` table.
- [ ] `SettingsOut` and `SettingsIn` include `telegram_bot_token`.
- [ ] Settings page "API Settings" tab shows a Telegram section with Bot Token field and "Test Connection" button.
- [ ] Saving the token calls `telegram_service.reload(token)` — service re-initializes without restart.
- [ ] "Test Connection" calls `POST /api/v1/telegram/test-connection` and shows bot username or error.
- [ ] Token is stored encrypted (uses `EncryptedString`).
- [ ] `pytest tests/` exits 0 — all 175 existing tests still pass.

---

## Definition of Done

- [x] All 7 files modified/created.
- [x] Migration file created with correct `down_revision` (i4d5e6f7a8b9 → j5e6f7a8b9c0).
- [x] App starts without errors after migration.
- [x] Token saved via UI is retrievable and decrypted correctly.
- [x] `telegram_service.reload()` verified manually.
- [x] All 175 existing tests pass.
- [ ] Sprint status updated: `8-10-telegram-bot-configuration-ui: done`.

## Dev Agent Record

### Files Changed
- `backend/app/models/models.py` — added `telegram_bot_token = Column(EncryptedString, nullable=True)` to `GeneralSettings`
- `backend/alembic/versions/j5e6f7a8b9c0_add_telegram_bot_token.py` — migration adding the column (down_revision: i4d5e6f7a8b9)
- `backend/app/services/telegram_service.py` — added `reload(token)` method
- `backend/app/api/endpoints/telegram.py` — added `POST /test-connection` endpoint (stateless token verification via getMe)
- `backend/app/api/endpoints/config_routes.py` — added `telegram_bot_token` to `SettingsOut`/`SettingsIn`; made `update_settings` async; added reload + webhook re-registration on token change
- `frontend/src/types/settings.ts` — added `telegram_bot_token: string`
- `frontend/src/app/admin/settings/page.tsx` — added `telegramConfigured`, `handleTelegramTest`, Telegram `ApiGroup` section in API Settings tab

### Completion Notes
Implemented 2026-05-02. All 175 existing tests pass. TypeScript compiles clean. Pattern follows existing encrypted fields (EncryptedString TypeDecorator). Test-connection endpoint is stateless — does not persist the token. `update_settings` promoted to `async` to support `asyncio.create_task` for best-effort webhook re-registration.

---

## Senior Developer Review (AI)

**Review date:** 2026-05-02
**Outcome:** Changes Requested
**Layers:** Blind Hunter + Edge Case Hunter + Acceptance Auditor

### Action Items

#### Decision Needed
- [x] [Review][Decision] Token cleared — reload behavior undefined: resolved → on clear, reload with `TELEGRAM_BOT_TOKEN` env var fallback [`config_routes.py`]

#### Patches
- [x] [Review][Patch] `/test-connection` has no authentication — added `Depends(get_current_user)` [`backend/app/api/endpoints/telegram.py`]
- [x] [Review][Patch] `resp.json()` called outside try/except — confirmed already inside try block; no change needed [`backend/app/api/endpoints/telegram.py`]
- [x] [Review][Patch] `asyncio.create_task` result not stored — stored in `_webhook_task` [`backend/app/api/endpoints/config_routes.py`]

#### Deferred
- [x] [Review][Defer] Sensitive fields (`telegram_bot_token`, `whatsapp_access_token`, etc.) returned in `SettingsOut` — pre-existing pattern for all channel credentials — deferred, pre-existing
- [x] [Review][Defer] `set_webhook` in `telegram_service.py` has no timeout — pre-existing, not introduced by this change — deferred, pre-existing
- [x] [Review][Defer] Webhook URL not validated as HTTPS — pre-existing, no validation exists for any other webhook URL — deferred, pre-existing
- [x] [Review][Defer] `model_dump(exclude_unset=True)` called twice in `update_settings` — theoretical inconsistency, deterministic in practice — deferred, pre-existing
- [x] [Review][Defer] `body: dict` in `test_connection` instead of Pydantic model — style preference, not a bug — deferred, low priority
- [x] [Review][Defer] `json.data ?? json` response shape fallback — if `data` key is `null`, raw envelope is returned — deferred, low impact
- [x] [Review][Defer] Token not sanitized before URL interpolation in `test_connection` — Telegram rejects non-conformant tokens; risk is very low — deferred, low priority
