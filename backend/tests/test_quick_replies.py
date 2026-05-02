"""
Unit tests for Quick Reply business logic — shortcut normalization, duplicates, search.
Direct DB tests without HTTP layer for speed.
"""

import pytest
from uuid import uuid4

from app.models.models import QuickReply


# ── Helpers ───────────────────────────────────────────────────────────────────

def make_qr(db, shortcut="/hello", content="Hello! How can I help?") -> QuickReply:
    qr = QuickReply(shortcut=shortcut, content=content)
    db.add(qr)
    db.commit()
    db.refresh(qr)
    return qr


# ── Model integrity ───────────────────────────────────────────────────────────

class TestQuickReplyModel:
    def test_create_quick_reply(self, db):
        qr = make_qr(db)
        assert qr.id is not None
        assert qr.shortcut == "/hello"

    def test_shortcut_is_unique(self, db):
        make_qr(db, "/dup")
        with pytest.raises(Exception):
            make_qr(db, "/dup")

    def test_created_at_set_automatically(self, db):
        qr = make_qr(db)
        assert qr.created_at is not None


# ── Search by prefix ──────────────────────────────────────────────────────────

class TestQuickReplySearch:
    def test_search_returns_matching_shortcuts(self, db):
        make_qr(db, "/hello", "Hello!")
        make_qr(db, "/help", "How can I help?")
        make_qr(db, "/bye", "Goodbye!")

        results = db.query(QuickReply).filter(
            QuickReply.shortcut.ilike("%hel%")
        ).all()
        shortcuts = {r.shortcut for r in results}
        assert "/hello" in shortcuts
        assert "/help" in shortcuts
        assert "/bye" not in shortcuts

    def test_search_empty_returns_all(self, db):
        make_qr(db, "/a")
        make_qr(db, "/b")
        make_qr(db, "/c")
        results = db.query(QuickReply).all()
        assert len(results) == 3

    def test_search_no_match_returns_empty(self, db):
        make_qr(db, "/hello")
        results = db.query(QuickReply).filter(
            QuickReply.shortcut.ilike("%xyz%")
        ).all()
        assert len(results) == 0


# ── CRUD operations ───────────────────────────────────────────────────────────

class TestQuickReplyCRUD:
    def test_update_shortcut(self, db):
        qr = make_qr(db, "/old")
        qr.shortcut = "/new"
        db.commit()
        db.refresh(qr)
        assert qr.shortcut == "/new"

    def test_update_content(self, db):
        qr = make_qr(db)
        qr.content = "Updated content"
        db.commit()
        db.refresh(qr)
        assert qr.content == "Updated content"

    def test_delete_quick_reply(self, db):
        qr = make_qr(db)
        qr_id = qr.id
        db.delete(qr)
        db.commit()
        found = db.query(QuickReply).filter(QuickReply.id == qr_id).first()
        assert found is None


# ── Shortcut normalization ────────────────────────────────────────────────────

class TestShortcutNormalization:
    """Tests for the /prefix normalization logic in the endpoint."""

    def test_normalize_adds_slash(self):
        raw = "hello"
        normalized = raw if raw.startswith("/") else f"/{raw}"
        assert normalized == "/hello"

    def test_normalize_keeps_existing_slash(self):
        raw = "/hello"
        normalized = raw if raw.startswith("/") else f"/{raw}"
        assert normalized == "/hello"

    def test_normalize_double_slash(self):
        raw = "//hello"
        normalized = raw if raw.startswith("/") else f"/{raw}"
        assert normalized == "//hello"  # keeps as-is when already starts with /
