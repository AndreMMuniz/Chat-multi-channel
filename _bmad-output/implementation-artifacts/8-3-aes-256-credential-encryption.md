# Story 8.3: AES-256 Credential Encryption

**Status:** done  
**Epic:** 8 — Production Hardening  
**Story Points:** 8  
**Priority:** Critical  
**Created:** 2026-04-30

---

## User Story

**As the system,** I want channel credentials encrypted at rest using AES-256-GCM so that `whatsapp_access_token`, `whatsapp_webhook_token`, `email_password`, and `twilio_auth_token` are never stored in plaintext in the database.

---

## Background & Context

**Retro finding (2026-04-29):** Story 5.4 (Secure Credential Storage) was marked done with a post-MVP note. The `whatsapp_access_token`, `email_password`, and `twilio_auth_token` fields in the `general_settings` table are stored as plaintext strings. Any DB read (backup, Supabase dashboard, log leak) exposes production secrets.

**Architecture already planned this:** `DATABASE_ENCRYPTION_KEY` env var is reserved in `.env.example` (Story 8.2). The implementation must activate that plan.

**Encryption strategy chosen: AES-256-GCM via Python `cryptography` library**
- AES-256-GCM provides authenticated encryption (confidentiality + integrity) with no padding oracle attack surface.
- `cryptography` library (`>=42.0`) is the Python standard for this — already trusted by the ecosystem.
- Fernet (AES-128-CBC) was ruled out: it uses AES-128, not AES-256 as required.
- Output format: `enc:v1:<base64url(nonce_12bytes + ciphertext + auth_tag_16bytes)>` — the `enc:v1:` prefix enables safe backward-compat detection.

**Transparent approach: SQLAlchemy TypeDecorator**
- An `EncryptedString` TypeDecorator wraps `String` columns.
- Reading: DB string → decrypt → Python string (services see plaintext automatically).
- Writing: Python string → encrypt → DB string (no change to service code).
- No changes needed in `email_service.py`, `whatsapp_service.py`, `sms_service.py`, `config_routes.py`.

---

## Acceptance Criteria

- [ ] `cryptography` library added to `backend/requirements.txt`.
- [ ] `backend/app/core/encryption.py` created with `encrypt(plaintext: str | None) -> str | None` and `decrypt(ciphertext: str | None) -> str | None` using AES-256-GCM.
- [ ] `EncryptedString` SQLAlchemy TypeDecorator created (may live in `encryption.py` or a separate `encrypted_type.py`).
- [ ] `GeneralSettings` model updated: `whatsapp_access_token`, `whatsapp_webhook_token`, `email_password`, `twilio_auth_token` columns use `EncryptedString`.
- [ ] Alembic data migration `i4d5e6f7a8b9` created that encrypts any existing plaintext values; skips gracefully if `DATABASE_ENCRYPTION_KEY` is unset (prints warning, does not fail).
- [ ] `main.py` startup check: if `ENVIRONMENT=production` and `DATABASE_ENCRYPTION_KEY` is unset or invalid, app logs a critical error and exits.
- [ ] No plaintext secrets appear in the DB after migration and a write cycle.
- [ ] All existing service files (`email_service.py`, `whatsapp_service.py`, `sms_service.py`, `core/email.py`, `api/endpoints/whatsapp.py`) continue to work without modification — they see decrypted values via the TypeDecorator.
- [ ] API `GET /settings` continues to return decrypted values (admin needs to read/edit them).
- [ ] App functions normally when `DATABASE_ENCRYPTION_KEY` is unset in development (encryption is skipped, not fatal — see graceful degradation below).

---

## Files to Create / Modify

| File | Action | Notes |
|------|--------|-------|
| `backend/requirements.txt` | **UPDATE** | Add `cryptography` |
| `backend/app/core/encryption.py` | **CREATE** | AES-256-GCM encrypt/decrypt + `EncryptedString` TypeDecorator |
| `backend/app/models/models.py` | **UPDATE** | 4 columns → `EncryptedString` |
| `backend/main.py` | **UPDATE** | Startup validation for `DATABASE_ENCRYPTION_KEY` |
| `backend/alembic/versions/i4d5e6f7a8b9_encrypt_existing_credentials.py` | **CREATE** | Data migration — encrypt existing plaintext values |

**Do NOT modify:**
- `backend/app/services/email_service.py` — reads `cfg.email_password`; gets plaintext via TypeDecorator automatically
- `backend/app/services/whatsapp_service.py` — reads `cfg.whatsapp_access_token`; same
- `backend/app/services/sms_service.py` — reads `cfg.twilio_auth_token`; same
- `backend/app/core/email.py` — reads `cfg.email_password`; same
- `backend/app/api/endpoints/whatsapp.py` — reads `cfg.whatsapp_access_token`; same
- `backend/app/api/endpoints/settings.py` — works transparently via ORM
- `backend/app/api/endpoints/config_routes.py` — works transparently via ORM
- `backend/app/schemas/settings.py` — no change; returns decrypted values
- Any migration file already created

---

## Implementation Guide

### Step 1 — Add `cryptography` to requirements.txt

Append `cryptography` to `backend/requirements.txt`. No version pin needed; latest stable (`>=42.0`) is fine.

### Step 2 — Create `backend/app/core/encryption.py`

```python
"""AES-256-GCM encryption for sensitive DB fields.

Key is loaded from DATABASE_ENCRYPTION_KEY env var (32-byte hex string).
If the key is absent, encrypt() is a no-op (returns plaintext) and
decrypt() returns the value as-is — allowing local dev without the key.

Output format: "enc:v1:<base64url(12-byte nonce | ciphertext | 16-byte tag)>"
"""

import os
import base64
import logging

log = logging.getLogger(__name__)

_KEY_HEX = os.getenv("DATABASE_ENCRYPTION_KEY", "")
_KEY: bytes | None = None

if _KEY_HEX:
    try:
        _KEY = bytes.fromhex(_KEY_HEX)
        if len(_KEY) != 32:
            raise ValueError(f"Key must be 32 bytes, got {len(_KEY)}")
    except Exception as exc:
        log.error("Invalid DATABASE_ENCRYPTION_KEY: %s — encryption disabled", exc)
        _KEY = None

_PREFIX = "enc:v1:"


def encrypt(plaintext: str | None) -> str | None:
    """Encrypt plaintext → enc:v1:<base64url> string. No-op if key absent."""
    if plaintext is None or plaintext == "":
        return plaintext
    if _KEY is None:
        return plaintext  # dev mode: no key, no encryption
    if plaintext.startswith(_PREFIX):
        return plaintext  # already encrypted
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    nonce = os.urandom(12)
    ct = AESGCM(_KEY).encrypt(nonce, plaintext.encode(), None)
    return _PREFIX + base64.urlsafe_b64encode(nonce + ct).decode()


def decrypt(ciphertext: str | None) -> str | None:
    """Decrypt enc:v1:<base64url> → plaintext. Returns value as-is if not encrypted."""
    if ciphertext is None or ciphertext == "":
        return ciphertext
    if not ciphertext.startswith(_PREFIX):
        return ciphertext  # plaintext value (legacy / key absent)
    if _KEY is None:
        log.warning("Encrypted value found but DATABASE_ENCRYPTION_KEY is unset — returning raw")
        return ciphertext
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    raw = base64.urlsafe_b64decode(ciphertext[len(_PREFIX):])
    nonce, ct = raw[:12], raw[12:]
    return AESGCM(_KEY).decrypt(nonce, ct, None).decode()


# ── SQLAlchemy TypeDecorator ──────────────────────────────────────────────────

from sqlalchemy import String
from sqlalchemy.types import TypeDecorator


class EncryptedString(TypeDecorator):
    """String column that transparently encrypts on write and decrypts on read."""

    impl = String
    cache_ok = True

    def process_bind_param(self, value, dialect):
        return encrypt(value)

    def process_result_value(self, value, dialect):
        return decrypt(value)
```

### Step 3 — Update `backend/app/models/models.py`

Import `EncryptedString` and change the 4 secret columns:

```python
# At top of file, after existing imports:
from app.core.encryption import EncryptedString

# In GeneralSettings class, replace Column(String, nullable=True) for:
whatsapp_access_token  = Column(EncryptedString, nullable=True)
whatsapp_webhook_token = Column(EncryptedString, nullable=True)
email_password         = Column(EncryptedString, nullable=True)
twilio_auth_token      = Column(EncryptedString, nullable=True)
```

**Exact lines to change in `models.py`:**
- Line 238: `whatsapp_access_token = Column(String, nullable=True)` → `Column(EncryptedString, nullable=True)`
- Line 239: `whatsapp_webhook_token = Column(String, nullable=True)` → `Column(EncryptedString, nullable=True)`
- Line 247: `email_password = Column(String, nullable=True)` → `Column(EncryptedString, nullable=True)`
- Line 251: `twilio_auth_token = Column(String, nullable=True)` → `Column(EncryptedString, nullable=True)`

### Step 4 — Add startup validation in `main.py`

Add this block **before** the `lifespan` function, right after the `os.getenv` lines at the top:

```python
def _validate_encryption_key() -> None:
    key_hex = os.getenv("DATABASE_ENCRYPTION_KEY", "")
    env = os.getenv("ENVIRONMENT", "development")
    if env == "production" and not key_hex:
        import sys
        print(
            "CRITICAL: DATABASE_ENCRYPTION_KEY is not set in production. "
            "Channel credentials would be stored unencrypted. "
            "Set a 32-byte hex key or set ENVIRONMENT=development. Exiting.",
            flush=True,
        )
        sys.exit(1)
    if key_hex:
        try:
            key = bytes.fromhex(key_hex)
            if len(key) != 32:
                raise ValueError(f"Expected 32 bytes, got {len(key)}")
        except Exception as exc:
            import sys
            print(f"CRITICAL: Invalid DATABASE_ENCRYPTION_KEY: {exc}. Exiting.", flush=True)
            sys.exit(1)

_validate_encryption_key()
```

This call is at module level so it runs before any request handler is registered.

### Step 5 — Create Alembic data migration

File: `backend/alembic/versions/i4d5e6f7a8b9_encrypt_existing_credentials.py`

```python
"""Encrypt existing plaintext credentials in general_settings.

Revision ID: i4d5e6f7a8b9
Revises: h3c4d5e6f7a8
Create Date: 2026-04-30
"""
import os
import base64
import sqlalchemy as sa
from alembic import op

revision = 'i4d5e6f7a8b9'
down_revision = 'h3c4d5e6f7a8'
branch_labels = None
depends_on = None

_SECRET_COLS = [
    "whatsapp_access_token",
    "whatsapp_webhook_token",
    "email_password",
    "twilio_auth_token",
]
_PREFIX = "enc:v1:"


def _encrypt(key: bytes, plaintext: str) -> str:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    nonce = os.urandom(12)
    ct = AESGCM(key).encrypt(nonce, plaintext.encode(), None)
    return _PREFIX + base64.urlsafe_b64encode(nonce + ct).decode()


def upgrade() -> None:
    key_hex = os.getenv("DATABASE_ENCRYPTION_KEY", "")
    if not key_hex:
        print(
            "\n[Migration i4d5e6f7a8b9] WARNING: DATABASE_ENCRYPTION_KEY is not set. "
            "Skipping encryption of existing credentials. "
            "Run this migration again after setting the key.\n"
        )
        return

    key = bytes.fromhex(key_hex)
    conn = op.get_bind()

    cols = ", ".join(["id"] + _SECRET_COLS)
    rows = conn.execute(sa.text(f"SELECT {cols} FROM general_settings")).fetchall()

    for row in rows:
        row_id = str(row[0])
        updates = {}
        for i, col in enumerate(_SECRET_COLS, start=1):
            val = row[i]
            if val and not val.startswith(_PREFIX):
                updates[col] = _encrypt(key, val)

        if updates:
            set_clause = ", ".join(f"{k} = :{k}" for k in updates)
            updates["row_id"] = row_id
            conn.execute(
                sa.text(f"UPDATE general_settings SET {set_clause} WHERE id = :row_id"),
                updates,
            )

    print(f"[Migration i4d5e6f7a8b9] Encrypted credentials in {len(rows)} row(s).")


def downgrade() -> None:
    # Decryption-on-downgrade is intentionally unsupported:
    # reverting to plaintext would re-introduce the security vulnerability.
    print("[Migration i4d5e6f7a8b9] Downgrade is a no-op — credentials remain encrypted.")
```

---

## Critical Implementation Notes

### Graceful Degradation in Dev
- If `DATABASE_ENCRYPTION_KEY` is **absent**, `encrypt()` returns plaintext and `decrypt()` returns value as-is.
- This means local dev works without the key — credentials are just not encrypted.
- Only in `ENVIRONMENT=production` does the missing key cause a fatal startup error.

### Column Type Does NOT Change
- The DB column type stays `String (TEXT)` — no schema migration needed.
- The Alembic migration is a **data** migration, not a DDL migration.
- No `op.alter_column()` required.

### Import Order
- `encryption.py` must NOT import from `app.core.config` or any app module at the top level to avoid circular imports.
- The `from cryptography...` import is intentionally inside the function body so the module can load even if `cryptography` isn't installed yet (fail at call time, not import time — though this is an edge case; `cryptography` will be in requirements).

### Existing Values After Migration
- After `upgrade()` runs with the key set, all non-empty secret fields will start with `enc:v1:`.
- On subsequent reads, `decrypt()` detects the prefix and decrypts.
- If a value was already `enc:v1:...` (e.g., migration ran twice), `encrypt()` skips it (idempotent).

### API Response Behaviour (No Change)
- `GET /settings` returns decrypted values — the TypeDecorator handles this transparently.
- `PATCH /settings` receives plaintext from the frontend; the TypeDecorator encrypts before writing.
- Audit log masking in `settings.py` continues to work — it operates on the Pydantic input dict before the ORM write.

### Key Generation (for deployment)
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```
Output is a 64-character hex string (32 bytes → AES-256).

---

## Definition of Done

- [x] `cryptography` in `backend/requirements.txt`.
- [x] `backend/app/core/encryption.py` exists with `encrypt()`, `decrypt()`, `EncryptedString`.
- [x] `GeneralSettings` model uses `EncryptedString` for 4 columns.
- [x] `main.py` has `_validate_encryption_key()` called at module level.
- [x] Migration `i4d5e6f7a8b9` exists and chains from `h3c4d5e6f7a8`.
- [x] Existing service files untouched (zero diffs in `email_service.py`, `whatsapp_service.py`, `sms_service.py`, `core/email.py`, `whatsapp.py`).
- [x] App starts without `DATABASE_ENCRYPTION_KEY` set (dev mode).
- [x] App exits with clear message if `ENVIRONMENT=production` and key is absent.
- [x] Sprint status updated: `8-3-aes-256-credential-encryption: review`.

---

### Review Findings

- [x] [Review][Patch] `decrypt()` não captura `InvalidTag` — rotação de chave ou ciphertext corrompido crasharia leituras de `GeneralSettings` [`backend/app/core/encryption.py:65-68`]
- [x] [Review][Patch] Testes faltando para `decrypt()` com chave errada, base64 inválido e payload truncado [`backend/tests/test_encryption.py`]

---

## Dev Agent Record

**Completed:** 2026-04-30  
**Implemented by:** Amelia (Dev Agent)

### Files Modified / Created

| File | Action |
|------|--------|
| `backend/requirements.txt` | Updated — added `cryptography` |
| `backend/app/core/encryption.py` | Created — AES-256-GCM + EncryptedString TypeDecorator |
| `backend/app/models/models.py` | Updated — 4 columns → EncryptedString; import added |
| `backend/main.py` | Updated — `_validate_encryption_key()` at module level |
| `backend/alembic/versions/i4d5e6f7a8b9_encrypt_existing_credentials.py` | Created — data migration |
| `backend/tests/test_encryption.py` | Created — 21 unit tests (all passing) |

### Completion Notes

- AES-256-GCM implemented via `cryptography` library — proper 256-bit key, authenticated encryption.
- `EncryptedString` TypeDecorator wraps 4 `GeneralSettings` columns transparently; all service files read plaintext with zero changes.
- Startup validation: fatal only in `ENVIRONMENT=production`; dev mode degrades gracefully (no-op encrypt/decrypt).
- Data migration `i4d5e6f7a8b9` skips gracefully if key not set; idempotent (re-running with key set only encrypts un-prefixed values).
- 88/88 tests passing (21 new + 67 existing); zero regressions.
