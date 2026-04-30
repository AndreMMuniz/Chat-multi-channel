"""AES-256-GCM encryption for sensitive DB fields.

Key is loaded from DATABASE_ENCRYPTION_KEY env var (64-char hex string = 32 bytes).
If the key is absent, encrypt() is a no-op (returns plaintext) and decrypt() returns
the value as-is — allowing local dev without the key set.

Output format: "enc:v1:<base64url(12-byte nonce | ciphertext | 16-byte GCM tag)>"
The prefix allows safe detection of already-encrypted values (idempotent writes).
"""

import os
import base64
import logging

log = logging.getLogger(__name__)

_KEY_HEX: str = os.getenv("DATABASE_ENCRYPTION_KEY", "")
_KEY: bytes | None = None
_PREFIX = "enc:v1:"

if _KEY_HEX:
    try:
        _KEY = bytes.fromhex(_KEY_HEX)
        if len(_KEY) != 32:
            raise ValueError(f"Key must be 32 bytes (64 hex chars), got {len(_KEY)} bytes")
    except Exception as exc:
        log.error("Invalid DATABASE_ENCRYPTION_KEY: %s — field encryption disabled", exc)
        _KEY = None


def encrypt(plaintext: str | None) -> str | None:
    """Encrypt a plaintext string → enc:v1:<base64url> format.

    Returns plaintext unchanged if key is absent (dev mode) or value is already encrypted.
    Returns None/empty unchanged.
    """
    if plaintext is None or plaintext == "":
        return plaintext
    if plaintext.startswith(_PREFIX):
        return plaintext  # idempotent: already encrypted
    if _KEY is None:
        return plaintext  # dev mode: no key, skip encryption
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    nonce = os.urandom(12)
    ciphertext = AESGCM(_KEY).encrypt(nonce, plaintext.encode("utf-8"), None)
    return _PREFIX + base64.urlsafe_b64encode(nonce + ciphertext).decode("ascii")


def decrypt(ciphertext: str | None) -> str | None:
    """Decrypt an enc:v1:<base64url> string → plaintext.

    Returns value unchanged if not encrypted (legacy plaintext or dev mode).
    Returns None/empty unchanged.
    """
    if ciphertext is None or ciphertext == "":
        return ciphertext
    if not ciphertext.startswith(_PREFIX):
        return ciphertext  # plaintext value (legacy row or key absent during write)
    if _KEY is None:
        log.warning(
            "Encrypted DB value found but DATABASE_ENCRYPTION_KEY is unset — "
            "returning raw ciphertext. Set the key to decrypt."
        )
        return ciphertext
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    raw = base64.urlsafe_b64decode(ciphertext[len(_PREFIX):])
    nonce, ct = raw[:12], raw[12:]
    return AESGCM(_KEY).decrypt(nonce, ct, None).decode("utf-8")


# ── SQLAlchemy TypeDecorator ──────────────────────────────────────────────────

from sqlalchemy import String
from sqlalchemy.types import TypeDecorator


class EncryptedString(TypeDecorator):
    """String column that transparently encrypts on write and decrypts on read.

    Usage in models:
        from app.core.encryption import EncryptedString
        secret = Column(EncryptedString, nullable=True)
    """

    impl = String
    cache_ok = True

    def process_bind_param(self, value, dialect):
        """Called when writing to DB — encrypt plaintext."""
        return encrypt(value)

    def process_result_value(self, value, dialect):
        """Called when reading from DB — decrypt ciphertext."""
        return decrypt(value)
