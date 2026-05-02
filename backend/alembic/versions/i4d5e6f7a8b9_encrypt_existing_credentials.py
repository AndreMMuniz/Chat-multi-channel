"""Encrypt existing plaintext credentials in general_settings.

This is a data migration only — no schema changes. The column types remain
String (TEXT). Existing plaintext values are encrypted in-place using AES-256-GCM.

If DATABASE_ENCRYPTION_KEY is not set, migration is skipped with a warning.
Re-run after setting the key to encrypt any remaining plaintext values.

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
    """AES-256-GCM encrypt a single string value."""
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    nonce = os.urandom(12)
    ct = AESGCM(key).encrypt(nonce, plaintext.encode("utf-8"), None)
    return _PREFIX + base64.urlsafe_b64encode(nonce + ct).decode("ascii")


def upgrade() -> None:
    key_hex = os.getenv("DATABASE_ENCRYPTION_KEY", "")
    if not key_hex:
        print(
            "\n[Migration i4d5e6f7a8b9] WARNING: DATABASE_ENCRYPTION_KEY is not set. "
            "Skipping encryption of existing credentials. "
            "Set DATABASE_ENCRYPTION_KEY and re-run 'alembic upgrade head' "
            "to encrypt any plaintext values.\n"
        )
        return

    try:
        key = bytes.fromhex(key_hex)
        if len(key) != 32:
            raise ValueError(f"Expected 32 bytes, got {len(key)}")
    except Exception as exc:
        print(f"\n[Migration i4d5e6f7a8b9] ERROR: Invalid key — {exc}. Skipping.\n")
        return

    conn = op.get_bind()
    cols_sql = ", ".join(["id"] + _SECRET_COLS)
    rows = conn.execute(
        sa.text(f"SELECT {cols_sql} FROM general_settings")
    ).fetchall()

    encrypted_count = 0
    for row in rows:
        row_id = str(row[0])
        updates: dict[str, str] = {}
        for i, col in enumerate(_SECRET_COLS, start=1):
            val = row[i]
            if val and not val.startswith(_PREFIX):
                updates[col] = _encrypt(key, val)

        if updates:
            set_clause = ", ".join(f"{col} = :{col}" for col in updates)
            updates["row_id"] = row_id
            conn.execute(
                sa.text(f"UPDATE general_settings SET {set_clause} WHERE id = :row_id"),
                updates,
            )
            encrypted_count += len(updates) - 1  # subtract row_id param

    print(
        f"\n[Migration i4d5e6f7a8b9] Encrypted {encrypted_count} field(s) "
        f"across {len(rows)} row(s) in general_settings.\n"
    )


def downgrade() -> None:
    # Intentionally a no-op: reverting to plaintext would re-introduce the
    # security vulnerability this migration was created to fix.
    print(
        "\n[Migration i4d5e6f7a8b9] Downgrade is a no-op — "
        "credentials remain encrypted for security.\n"
    )
