"""
Tests for DeliveryAlertService — sliding window, threshold, channel isolation.

DeliveryAlertService is a singleton via __new__. Each test resets the
singleton so it gets a fresh instance. Methods record_failure and
record_success are async.

Module-level constants (_FAILURE_THRESHOLD, _WINDOW_MINUTES) are patched
via monkeypatch to control threshold in tests.
"""

import pytest
import asyncio
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, patch

import app.services.delivery_alert_service as das_module
from app.services.delivery_alert_service import DeliveryAlertService


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def reset_singleton():
    """Reset singleton before and after each test for isolation."""
    DeliveryAlertService._instance = None
    yield
    DeliveryAlertService._instance = None


@pytest.fixture
def svc():
    """Fresh DeliveryAlertService instance (singleton reset by autouse fixture)."""
    return DeliveryAlertService()


# ── Failure tracking ──────────────────────────────────────────────────────────

class TestFailureTracking:
    @pytest.mark.asyncio
    async def test_record_failure_increments_count(self, svc):
        await svc.record_failure("telegram", "timeout")
        assert svc.get_failure_count("telegram") == 1

    @pytest.mark.asyncio
    async def test_two_failures_give_count_two(self, svc):
        await svc.record_failure("telegram", "timeout")
        await svc.record_failure("telegram", "timeout")
        assert svc.get_failure_count("telegram") == 2

    @pytest.mark.asyncio
    async def test_record_success_clears_channel(self, svc):
        await svc.record_failure("telegram", "timeout")
        await svc.record_failure("telegram", "timeout")
        await svc.record_success("telegram")
        assert svc.get_failure_count("telegram") == 0

    @pytest.mark.asyncio
    async def test_different_channels_are_independent(self, svc):
        await svc.record_failure("telegram", "err")
        await svc.record_failure("whatsapp", "err")
        await svc.record_failure("whatsapp", "err")
        assert svc.get_failure_count("telegram") == 1
        assert svc.get_failure_count("whatsapp") == 2

    def test_unknown_channel_returns_zero(self, svc):
        assert svc.get_failure_count("nonexistent") == 0

    @pytest.mark.asyncio
    async def test_success_only_clears_target_channel(self, svc):
        await svc.record_failure("telegram", "err")
        await svc.record_failure("email", "err")
        await svc.record_success("telegram")
        assert svc.get_failure_count("telegram") == 0
        assert svc.get_failure_count("email") == 1


# ── Sliding window pruning ────────────────────────────────────────────────────

class TestSlidingWindow:
    def test_old_failures_pruned_from_window(self, svc):
        """Timestamps older than _WINDOW_MINUTES must not count."""
        old_time = datetime.now(timezone.utc) - timedelta(minutes=20)
        svc._counts["telegram"] = [old_time, old_time]
        assert svc.get_failure_count("telegram") == 0

    def test_recent_failures_are_counted(self, svc):
        recent = datetime.now(timezone.utc) - timedelta(minutes=1)
        svc._counts["telegram"] = [recent, recent, recent]
        assert svc.get_failure_count("telegram") == 3

    def test_mixed_age_only_counts_recent(self, svc):
        old = datetime.now(timezone.utc) - timedelta(minutes=20)
        recent = datetime.now(timezone.utc) - timedelta(minutes=1)
        svc._counts["telegram"] = [old, old, recent]
        assert svc.get_failure_count("telegram") == 1


# ── Summary ───────────────────────────────────────────────────────────────────

class TestSummary:
    @pytest.mark.asyncio
    async def test_summary_includes_channels_with_failures(self, svc):
        await svc.record_failure("telegram", "a")
        await svc.record_failure("email", "b")
        summary = svc.summary()
        assert "telegram" in summary
        assert "email" in summary

    @pytest.mark.asyncio
    async def test_summary_counts_are_accurate(self, svc):
        await svc.record_failure("whatsapp", "x")
        await svc.record_failure("whatsapp", "x")
        summary = svc.summary()
        assert summary.get("whatsapp", 0) == 2


# ── Alert broadcast ───────────────────────────────────────────────────────────

class TestAlertBroadcast:
    @pytest.mark.asyncio
    async def test_broadcasts_when_threshold_crossed(self, svc, monkeypatch):
        # manager is imported inside _broadcast_alert — patch at the source module
        monkeypatch.setattr(das_module, "_FAILURE_THRESHOLD", 3)
        with patch("app.core.websocket.manager") as mock_manager:
            mock_manager.broadcast_global = AsyncMock()
            for _ in range(3):
                await svc.record_failure("telegram", "error")
            mock_manager.broadcast_global.assert_called()

    @pytest.mark.asyncio
    async def test_no_broadcast_below_threshold(self, svc, monkeypatch):
        monkeypatch.setattr(das_module, "_FAILURE_THRESHOLD", 5)
        with patch("app.core.websocket.manager") as mock_manager:
            mock_manager.broadcast_global = AsyncMock()
            for _ in range(4):
                await svc.record_failure("telegram", "error")
            mock_manager.broadcast_global.assert_not_called()

    @pytest.mark.asyncio
    async def test_broadcast_contains_channel_info(self, svc, monkeypatch):
        monkeypatch.setattr(das_module, "_FAILURE_THRESHOLD", 1)
        captured = {}

        async def mock_broadcast(event_type, data):
            captured["event_type"] = event_type
            captured["data"] = data

        with patch("app.core.websocket.manager") as mock_manager:
            mock_manager.broadcast_global = mock_broadcast
            await svc.record_failure("whatsapp", "timeout")

        assert captured.get("event_type") == "delivery_failure_alert"
        assert captured.get("data", {}).get("channel") == "whatsapp"
