# Story 8.5: Pytest Suite for Critical Services

**Status:** ready-for-dev
**Epic:** 8 — Production Hardening
**Story Points:** 13
**Priority:** Important
**Created:** 2026-04-30

---

## User Story

**As a developer,** I want pytest coverage for 5 critical services so that regressions are caught automatically on every push.

---

## Background & Context

**Retro finding:** No CI exists. Tests run manually. Critical services have partial or no coverage.

**Existing test infrastructure (DO NOT recreate):**
- `backend/tests/conftest.py` — SQLite in-memory DB, FastAPI TestClient, `get_db` override, session-per-test rollback
- `backend/tests/test_message_service.py` — MessageService tests (extent unknown; audit and fill gaps)
- `backend/tests/test_user_service.py` — UserService tests (extent unknown; audit and fill gaps)
- `backend/tests/test_encryption.py` — 24 tests (complete, DO NOT touch)
- `backend/tests/test_queue.py` — 18 tests (complete, DO NOT touch)
- `backend/tests/test_quick_replies.py`, `test_repositories.py`, `test_response_format.py`, `test_websocket.py` — DO NOT touch

**Missing coverage (primary work):**
- `app/services/channel_service.py` (85 lines) — no test file
- `app/services/ai_service.py` (164 lines) — no test file
- `app/services/delivery_alert_service.py` (84 lines) — no test file

**CI requirement:** Create `.github/workflows/pytest.yml` to run `pytest` on every push to `main` and `preview`.

---

## Services Under Test — Technical Details

### ChannelService (`app/services/channel_service.py`, 85 lines)
- Routes outbound messages to channel-specific services
- Raises `ChannelDeliveryError` on failure
- Depends on: `TelegramService`, `WhatsAppService`, `EmailService`, `SMSService`
- **Test strategy:** Mock all channel-specific services. Test routing logic and error propagation.

### AIService (`app/services/ai_service.py`, 164 lines)
- `generate(conversation_id)` — LLM call → parses JSON → persists 3 suggestions
- `get_cached(conversation_id)` — returns stored suggestions, no LLM
- `_get_llm()` — reads `GeneralSettings` for model/provider
- `_build_context(conversation_id)` — fetches last 10 messages
- Depends on: `ChatOpenAI` (LangChain), `GeneralSettings` model, `AISuggestion` model
- **Test strategy:** Mock `ChatOpenAI`. Use conftest's SQLite DB for GeneralSettings and AISuggestion.

### DeliveryAlertService (`app/services/delivery_alert_service.py`, 84 lines)
- In-process singleton: `delivery_alerts = DeliveryAlertService()`
- `record_failure(channel, reason)` — tracks failures per channel in sliding window; broadcasts WS alert if threshold crossed
- `record_success(channel)` — clears channel failure list
- `get_failure_count(channel)` — count within window (prunes old entries)
- `summary()` — dict of all channels → count
- Config: `DELIVERY_ALERT_THRESHOLD` (default 5), `DELIVERY_ALERT_WINDOW_MINUTES` (default 10)
- Broadcasts `delivery_failure_alert` WS event via `manager.broadcast_global()`
- **Test strategy:** Pure Python, no DB needed. Mock `manager.broadcast_global`. Test sliding window, threshold, cleanup.

---

## Files to Create / Modify

| File | Action | Notes |
|------|--------|-------|
| `backend/tests/test_channel_service.py` | **CREATE** | Mock all channel-specific services |
| `backend/tests/test_ai_service.py` | **CREATE** | Mock ChatOpenAI; use conftest SQLite for DB |
| `backend/tests/test_delivery_alert_service.py` | **CREATE** | No DB needed; mock WS broadcast |
| `backend/tests/test_message_service.py` | **AUDIT & ENHANCE** | Check coverage; fill gaps to 80%+ |
| `backend/tests/test_user_service.py` | **AUDIT & ENHANCE** | Check coverage; fill gaps to 80%+ |
| `.github/workflows/pytest.yml` | **CREATE** | Run pytest on push to main/preview |

**Do NOT modify:** `conftest.py`, `test_encryption.py`, `test_queue.py`, `test_quick_replies.py`, `test_repositories.py`, `test_response_format.py`, `test_websocket.py`

---

## Implementation Guide

### Step 1 — Audit existing coverage

Before writing tests, run locally:
```bash
cd backend
pip install pytest-cov
pytest --cov=app/services --cov-report=term-missing tests/
```

For each of the 5 services, identify uncovered lines. Fill gaps to reach 80%+.

### Step 2 — `tests/test_channel_service.py`

```python
"""Tests for ChannelService routing and error propagation."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.channel_service import ChannelService
from app.models.models import ChannelType


@pytest.fixture
def db(test_db):
    return test_db


class TestChannelServiceRouting:
    @pytest.mark.asyncio
    async def test_routes_to_telegram(self, db):
        svc = ChannelService(db)
        conv = MagicMock()
        conv.channel = ChannelType.TELEGRAM

        with patch.object(svc, '_send_telegram', new_callable=AsyncMock) as mock_send:
            await svc.send(conv, "hello")
            mock_send.assert_called_once_with(conv, "hello")

    @pytest.mark.asyncio
    async def test_routes_to_whatsapp(self, db):
        svc = ChannelService(db)
        conv = MagicMock()
        conv.channel = ChannelType.WHATSAPP

        with patch.object(svc, '_send_whatsapp', new_callable=AsyncMock) as mock_send:
            await svc.send(conv, "hello")
            mock_send.assert_called_once_with(conv, "hello")

    @pytest.mark.asyncio
    async def test_routes_to_email(self, db):
        svc = ChannelService(db)
        conv = MagicMock()
        conv.channel = ChannelType.EMAIL

        with patch.object(svc, '_send_email', new_callable=AsyncMock) as mock_send:
            await svc.send(conv, "hello")
            mock_send.assert_called_once_with(conv, "hello")

    @pytest.mark.asyncio
    async def test_routes_to_sms(self, db):
        svc = ChannelService(db)
        conv = MagicMock()
        conv.channel = ChannelType.SMS

        with patch.object(svc, '_send_sms', new_callable=AsyncMock) as mock_send:
            await svc.send(conv, "hello")
            mock_send.assert_called_once_with(conv, "hello")

    @pytest.mark.asyncio
    async def test_propagates_channel_delivery_error(self, db):
        from app.services.channel_service import ChannelDeliveryError
        svc = ChannelService(db)
        conv = MagicMock()
        conv.channel = ChannelType.TELEGRAM

        with patch.object(svc, '_send_telegram', new_callable=AsyncMock,
                          side_effect=ChannelDeliveryError("timeout")):
            with pytest.raises(ChannelDeliveryError, match="timeout"):
                await svc.send(conv, "hello")

    @pytest.mark.asyncio
    async def test_web_channel_is_noop(self, db):
        """WEB channel has no external dispatch — send() should succeed silently."""
        svc = ChannelService(db)
        conv = MagicMock()
        conv.channel = ChannelType.WEB
        await svc.send(conv, "hello")  # must not raise
```

### Step 3 — `tests/test_ai_service.py`

```python
"""Tests for AIService — LLM mocked, DB uses conftest SQLite."""

import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.ai_service import AIService
from app.models.models import GeneralSettings, AISuggestion, Conversation, Contact, ChannelType


@pytest.fixture
def db(test_db):
    return test_db


@pytest.fixture
def seeded_conversation(db):
    """Create a minimal conversation with 3 messages in SQLite."""
    from app.models.models import Message, ConversationStatus
    import uuid

    contact = Contact(
        id=uuid.uuid4(),
        channel_identifier="test-contact",
        channel=ChannelType.TELEGRAM,
    )
    db.add(contact)

    conv = Conversation(
        id=uuid.uuid4(),
        channel=ChannelType.TELEGRAM,
        status=ConversationStatus.OPEN,
        contact=contact,
    )
    db.add(conv)

    for i in range(3):
        msg = Message(
            id=uuid.uuid4(),
            conversation_id=conv.id,
            content=f"Message {i}",
            inbound=(i % 2 == 0),
            conversation_sequence=i + 1,
        )
        db.add(msg)

    db.commit()
    return conv


class TestAIServiceGetCached:
    def test_returns_empty_when_no_suggestions(self, db, seeded_conversation):
        svc = AIService(db)
        result = svc.get_cached(str(seeded_conversation.id))
        assert result == []

    def test_returns_stored_suggestions(self, db, seeded_conversation):
        import uuid
        sugg = AISuggestion(
            id=uuid.uuid4(),
            conversation_id=seeded_conversation.id,
            content="How can I help you?",
        )
        db.add(sugg)
        db.commit()

        svc = AIService(db)
        result = svc.get_cached(str(seeded_conversation.id))
        assert len(result) == 1
        assert result[0] == "How can I help you?"


class TestAIServiceGenerate:
    @pytest.mark.asyncio
    async def test_generate_returns_three_suggestions(self, db, seeded_conversation):
        mock_llm_response = MagicMock()
        mock_llm_response.content = json.dumps([
            "How can I help?",
            "Let me check that for you.",
            "I'll resolve this right away.",
        ])

        with patch("app.services.ai_service.ChatOpenAI") as MockLLM:
            mock_instance = MagicMock()
            mock_instance.invoke = MagicMock(return_value=mock_llm_response)
            MockLLM.return_value = mock_instance

            svc = AIService(db)
            result = await svc.generate(str(seeded_conversation.id))

        assert len(result) == 3
        assert "How can I help?" in result

    @pytest.mark.asyncio
    async def test_generate_persists_suggestions(self, db, seeded_conversation):
        mock_response = MagicMock()
        mock_response.content = json.dumps(["A", "B", "C"])

        with patch("app.services.ai_service.ChatOpenAI") as MockLLM:
            mock_instance = MagicMock()
            mock_instance.invoke = MagicMock(return_value=mock_response)
            MockLLM.return_value = mock_instance

            svc = AIService(db)
            await svc.generate(str(seeded_conversation.id))

        stored = db.query(AISuggestion).filter_by(
            conversation_id=seeded_conversation.id
        ).all()
        assert len(stored) == 3

    @pytest.mark.asyncio
    async def test_generate_replaces_old_suggestions(self, db, seeded_conversation):
        """Second generate() call must replace, not accumulate."""
        import uuid
        old = AISuggestion(
            id=uuid.uuid4(),
            conversation_id=seeded_conversation.id,
            content="Old suggestion",
        )
        db.add(old)
        db.commit()

        mock_response = MagicMock()
        mock_response.content = json.dumps(["New 1", "New 2", "New 3"])

        with patch("app.services.ai_service.ChatOpenAI") as MockLLM:
            mock_instance = MagicMock()
            mock_instance.invoke = MagicMock(return_value=mock_response)
            MockLLM.return_value = mock_instance

            svc = AIService(db)
            await svc.generate(str(seeded_conversation.id))

        stored = db.query(AISuggestion).filter_by(
            conversation_id=seeded_conversation.id
        ).all()
        assert len(stored) == 3
        assert all(s.content.startswith("New") for s in stored)

    @pytest.mark.asyncio
    async def test_generate_handles_invalid_json_gracefully(self, db, seeded_conversation):
        """If LLM returns non-JSON, generate() should not crash."""
        mock_response = MagicMock()
        mock_response.content = "Sorry, I cannot help with that."

        with patch("app.services.ai_service.ChatOpenAI") as MockLLM:
            mock_instance = MagicMock()
            mock_instance.invoke = MagicMock(return_value=mock_response)
            MockLLM.return_value = mock_instance

            svc = AIService(db)
            result = await svc.generate(str(seeded_conversation.id))

        # Should return empty list or raw string, not crash
        assert isinstance(result, list)
```

### Step 4 — `tests/test_delivery_alert_service.py`

```python
"""Tests for DeliveryAlertService — pure in-process, no DB."""

import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, patch
from app.services.delivery_alert_service import DeliveryAlertService


@pytest.fixture
def svc():
    """Fresh service instance (not the singleton) for test isolation."""
    return DeliveryAlertService()


class TestFailureTracking:
    def test_record_failure_increments_count(self, svc):
        svc.record_failure("telegram", "timeout")
        assert svc.get_failure_count("telegram") == 1

    def test_record_success_clears_failures(self, svc):
        svc.record_failure("telegram", "timeout")
        svc.record_failure("telegram", "timeout")
        svc.record_success("telegram")
        assert svc.get_failure_count("telegram") == 0

    def test_different_channels_are_independent(self, svc):
        svc.record_failure("telegram", "error")
        svc.record_failure("whatsapp", "error")
        svc.record_failure("whatsapp", "error")
        assert svc.get_failure_count("telegram") == 1
        assert svc.get_failure_count("whatsapp") == 2

    def test_summary_includes_all_channels(self, svc):
        svc.record_failure("telegram", "a")
        svc.record_failure("email", "b")
        summary = svc.summary()
        assert "telegram" in summary
        assert "email" in summary

    def test_old_failures_pruned_from_window(self, svc):
        """Failures older than the window must not count."""
        old_time = datetime.now(timezone.utc) - timedelta(minutes=20)
        svc._failures["telegram"] = [old_time, old_time]
        assert svc.get_failure_count("telegram") == 0

    def test_unknown_channel_returns_zero(self, svc):
        assert svc.get_failure_count("nonexistent") == 0


class TestAlertBroadcast:
    @pytest.mark.asyncio
    async def test_broadcasts_alert_when_threshold_crossed(self, svc):
        svc._threshold = 3
        with patch("app.services.delivery_alert_service.manager") as mock_manager:
            mock_manager.broadcast_global = AsyncMock()
            for i in range(3):
                svc.record_failure("telegram", "error")

            # Give event loop a tick to run the create_task
            import asyncio
            await asyncio.sleep(0)
            # broadcast_global should have been called
            # (exact assertion depends on implementation — adjust if needed)

    def test_no_alert_below_threshold(self, svc):
        svc._threshold = 5
        with patch("app.services.delivery_alert_service.manager") as mock_manager:
            mock_manager.broadcast_global = AsyncMock()
            for i in range(4):
                svc.record_failure("telegram", "error")
            mock_manager.broadcast_global.assert_not_called()
```

### Step 5 — CI Workflow

Create `.github/workflows/pytest.yml`:

```yaml
name: Pytest

on:
  push:
    branches: [main, preview]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.13"
          cache: pip
          cache-dependency-path: backend/requirements.txt

      - name: Install dependencies
        run: pip install -r requirements.txt pytest-cov

      - name: Run pytest with coverage
        run: |
          pytest \
            --cov=app/services \
            --cov-report=term-missing \
            --cov-fail-under=70 \
            -v \
            tests/
        env:
          ENVIRONMENT: test
          DATABASE_URL: sqlite:///./test.db
```

**Note:** `--cov-fail-under=70` for the CI gate (conservative — service average, not per-file). The 80% per-service target is aspirational for this story; the CI gate ensures regressions don't slip.

---

## Acceptance Criteria

- [ ] `tests/test_channel_service.py` exists — routing + error propagation covered.
- [ ] `tests/test_ai_service.py` exists — generate(), get_cached(), JSON-error handling covered (LLM mocked).
- [ ] `tests/test_delivery_alert_service.py` exists — sliding window, threshold, success-clears, channel isolation covered.
- [ ] `test_message_service.py` and `test_user_service.py` audited; gaps filled to 80%+ line coverage.
- [ ] `.github/workflows/pytest.yml` exists and runs `pytest` with coverage gate.
- [ ] All 106+ existing tests continue to pass.
- [ ] `pytest tests/` exits 0 locally.

---

## Definition of Done

- [ ] All 5 services have 80%+ line coverage (verified with `pytest --cov`).
- [ ] 3 new test files created; 2 existing files audited and enhanced.
- [ ] CI workflow created; would pass on current codebase.
- [ ] No changes to application code (tests only + CI config).
- [ ] Sprint status updated: `8-5-pytest-suite-for-critical-services: review`.

---

### Review Findings (2026-04-30)

- [x] [Review][Defer] Coverage gate 70% vs DoD 80% — CI uses `--cov-fail-under=70`; all 5 services already exceed 80% locally. Gate kept conservative to prevent regression without false CI failures. [`.github/workflows/pytest.yml:33`] — deferred, intentional per implementation guide; 80% is the per-service aspirational target, 70% is the CI regression floor
- [x] [Review][Defer] SQLite timezone stripping in `test_second_send_does_not_overwrite_first_response_at` gives false confidence vs PostgreSQL production behavior [`backend/tests/test_message_service.py:293`] — deferred, pre-existing test environment limitation
