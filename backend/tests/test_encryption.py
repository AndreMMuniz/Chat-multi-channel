"""Unit tests for AES-256-GCM encryption module (app/core/encryption.py).

Tests run without a real DB — encryption.py is a pure Python module.
Key manipulation is done by directly patching module-level variables.
"""

import importlib
import os
import pytest
import secrets


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_key() -> bytes:
    return secrets.token_bytes(32)


def _reload_with_key(monkeypatch, key_hex: str):
    """Reload encryption module with DATABASE_ENCRYPTION_KEY set."""
    monkeypatch.setenv("DATABASE_ENCRYPTION_KEY", key_hex)
    import app.core.encryption as enc_mod
    importlib.reload(enc_mod)
    return enc_mod


def _reload_without_key(monkeypatch):
    """Reload encryption module with no key set."""
    monkeypatch.delenv("DATABASE_ENCRYPTION_KEY", raising=False)
    import app.core.encryption as enc_mod
    importlib.reload(enc_mod)
    return enc_mod


# ── encrypt() ─────────────────────────────────────────────────────────────────

class TestEncrypt:
    def test_returns_enc_prefix_when_key_set(self, monkeypatch):
        enc = _reload_with_key(monkeypatch, _make_key().hex())
        result = enc.encrypt("my-secret-token")
        assert result.startswith("enc:v1:")

    def test_ciphertext_differs_from_plaintext(self, monkeypatch):
        enc = _reload_with_key(monkeypatch, _make_key().hex())
        result = enc.encrypt("my-secret-token")
        assert result != "my-secret-token"

    def test_two_encryptions_of_same_value_differ(self, monkeypatch):
        """Each call uses a random nonce — ciphertexts must be unique."""
        enc = _reload_with_key(monkeypatch, _make_key().hex())
        a = enc.encrypt("same-value")
        b = enc.encrypt("same-value")
        assert a != b

    def test_returns_none_for_none(self, monkeypatch):
        enc = _reload_with_key(monkeypatch, _make_key().hex())
        assert enc.encrypt(None) is None

    def test_returns_empty_for_empty_string(self, monkeypatch):
        enc = _reload_with_key(monkeypatch, _make_key().hex())
        assert enc.encrypt("") == ""

    def test_idempotent_already_encrypted(self, monkeypatch):
        """Calling encrypt on an already-encrypted value must not double-encrypt."""
        enc = _reload_with_key(monkeypatch, _make_key().hex())
        first = enc.encrypt("token")
        second = enc.encrypt(first)
        assert first == second

    def test_no_op_when_key_absent(self, monkeypatch):
        """Without a key, encrypt() must return plaintext unchanged."""
        enc = _reload_without_key(monkeypatch)
        result = enc.encrypt("plain-value")
        assert result == "plain-value"


# ── decrypt() ─────────────────────────────────────────────────────────────────

class TestDecrypt:
    def test_round_trip(self, monkeypatch):
        """decrypt(encrypt(x)) == x"""
        key_hex = _make_key().hex()
        enc = _reload_with_key(monkeypatch, key_hex)
        original = "super-secret-password-123"
        assert enc.decrypt(enc.encrypt(original)) == original

    def test_returns_none_for_none(self, monkeypatch):
        enc = _reload_with_key(monkeypatch, _make_key().hex())
        assert enc.decrypt(None) is None

    def test_returns_empty_for_empty_string(self, monkeypatch):
        enc = _reload_with_key(monkeypatch, _make_key().hex())
        assert enc.decrypt("") == ""

    def test_returns_plaintext_unchanged_if_not_prefixed(self, monkeypatch):
        """Legacy plaintext values (no enc:v1: prefix) pass through unchanged."""
        enc = _reload_with_key(monkeypatch, _make_key().hex())
        assert enc.decrypt("legacy-plain") == "legacy-plain"

    def test_returns_ciphertext_unchanged_when_key_absent(self, monkeypatch):
        """If key is absent and value looks encrypted, return raw (don't crash)."""
        enc = _reload_without_key(monkeypatch)
        fake_ct = "enc:v1:aGVsbG8="
        assert enc.decrypt(fake_ct) == fake_ct

    def test_round_trip_unicode(self, monkeypatch):
        enc = _reload_with_key(monkeypatch, _make_key().hex())
        original = "pässwörد"
        assert enc.decrypt(enc.encrypt(original)) == original

    def test_round_trip_long_value(self, monkeypatch):
        enc = _reload_with_key(monkeypatch, _make_key().hex())
        original = "x" * 4096
        assert enc.decrypt(enc.encrypt(original)) == original


# ── EncryptedString TypeDecorator ─────────────────────────────────────────────

class TestEncryptedStringTypeDecorator:
    def test_process_bind_param_encrypts(self, monkeypatch):
        enc = _reload_with_key(monkeypatch, _make_key().hex())
        td = enc.EncryptedString()
        result = td.process_bind_param("plaintext", dialect=None)
        assert result is not None
        assert result.startswith("enc:v1:")

    def test_process_result_value_decrypts(self, monkeypatch):
        key_hex = _make_key().hex()
        enc = _reload_with_key(monkeypatch, key_hex)
        td = enc.EncryptedString()
        ciphertext = td.process_bind_param("plaintext", dialect=None)
        decrypted = td.process_result_value(ciphertext, dialect=None)
        assert decrypted == "plaintext"

    def test_process_bind_param_none(self, monkeypatch):
        enc = _reload_with_key(monkeypatch, _make_key().hex())
        td = enc.EncryptedString()
        assert td.process_bind_param(None, dialect=None) is None

    def test_process_result_value_none(self, monkeypatch):
        enc = _reload_with_key(monkeypatch, _make_key().hex())
        td = enc.EncryptedString()
        assert td.process_result_value(None, dialect=None) is None

    def test_process_bind_param_no_key(self, monkeypatch):
        """Without key: bind param returns plaintext (dev mode)."""
        enc = _reload_without_key(monkeypatch)
        td = enc.EncryptedString()
        result = td.process_bind_param("plain", dialect=None)
        assert result == "plain"


# ── Key validation ────────────────────────────────────────────────────────────

class TestKeyValidation:
    def test_invalid_hex_key_disables_encryption(self, monkeypatch):
        """A non-hex key should disable encryption gracefully (not crash)."""
        monkeypatch.setenv("DATABASE_ENCRYPTION_KEY", "not-valid-hex!!!")
        import app.core.encryption as enc_mod
        importlib.reload(enc_mod)
        assert enc_mod._KEY is None
        # encrypt must still work (no-op)
        assert enc_mod.encrypt("test") == "test"

    def test_wrong_length_key_disables_encryption(self, monkeypatch):
        """A key that's valid hex but not 32 bytes must disable encryption."""
        monkeypatch.setenv("DATABASE_ENCRYPTION_KEY", "deadbeef")  # 4 bytes only
        import app.core.encryption as enc_mod
        importlib.reload(enc_mod)
        assert enc_mod._KEY is None


# ── Resilience ────────────────────────────────────────────────────────────────

class TestDecryptResilience:
    def test_wrong_key_returns_raw_ciphertext(self, monkeypatch):
        """decrypt() with the wrong key must not raise — returns raw ciphertext."""
        key_a = _make_key().hex()
        key_b = _make_key().hex()
        enc_a = _reload_with_key(monkeypatch, key_a)
        ciphertext = enc_a.encrypt("secret-value")

        enc_b = _reload_with_key(monkeypatch, key_b)
        result = enc_b.decrypt(ciphertext)
        # Must not raise; returns the raw ciphertext (not plaintext, not crash)
        assert result == ciphertext

    def test_corrupted_ciphertext_returns_raw(self, monkeypatch):
        """decrypt() with a malformed base64 payload must not raise."""
        enc = _reload_with_key(monkeypatch, _make_key().hex())
        corrupted = "enc:v1:!!not-valid-base64!!"
        result = enc.decrypt(corrupted)
        assert result == corrupted

    def test_truncated_ciphertext_returns_raw(self, monkeypatch):
        """decrypt() with a payload too short for nonce+tag must not raise."""
        enc = _reload_with_key(monkeypatch, _make_key().hex())
        import base64
        too_short = "enc:v1:" + base64.urlsafe_b64encode(b"tooshort").decode()
        result = enc.decrypt(too_short)
        assert result == too_short
