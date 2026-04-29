"""
DeliveryAlertService — tracks delivery failures per channel and fires WebSocket
alerts to managers when the failure count exceeds a configurable threshold.

Implements Story 4.4 (delivery failure threshold alerts).
State is in-process (MVP) — reset on restart. For production, swap to Redis.
"""

import os
from collections import defaultdict
from datetime import datetime, timezone


# Configurable thresholds (env var overrides)
_FAILURE_THRESHOLD = int(os.getenv("DELIVERY_ALERT_THRESHOLD", "5"))
_WINDOW_MINUTES = int(os.getenv("DELIVERY_ALERT_WINDOW_MINUTES", "10"))


class DeliveryAlertService:
    """Singleton that tracks per-channel failure counts and broadcasts alerts."""

    _instance: "DeliveryAlertService | None" = None

    def __new__(cls) -> "DeliveryAlertService":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._counts: dict[str, list[datetime]] = defaultdict(list)
        return cls._instance

    # ── Public API ────────────────────────────────────────────────────────────

    async def record_failure(self, channel: str, reason: str) -> None:
        """Call after every outbound delivery failure."""
        now = datetime.now(timezone.utc)
        self._counts[channel].append(now)
        self._prune_window(channel, now)

        failures = len(self._counts[channel])
        if failures >= _FAILURE_THRESHOLD:
            await self._broadcast_alert(channel, failures, reason)

    async def record_success(self, channel: str) -> None:
        """Call after a successful delivery — resets that channel's counter."""
        self._counts[channel].clear()

    def get_failure_count(self, channel: str) -> int:
        now = datetime.now(timezone.utc)
        self._prune_window(channel, now)
        return len(self._counts[channel])

    def summary(self) -> dict[str, int]:
        now = datetime.now(timezone.utc)
        return {ch: len([t for t in ts if (now - t).total_seconds() < _WINDOW_MINUTES * 60])
                for ch, ts in self._counts.items()}

    # ── Internal ──────────────────────────────────────────────────────────────

    def _prune_window(self, channel: str, now: datetime) -> None:
        cutoff = _WINDOW_MINUTES * 60
        self._counts[channel] = [
            t for t in self._counts[channel]
            if (now - t).total_seconds() < cutoff
        ]

    async def _broadcast_alert(self, channel: str, count: int, last_reason: str) -> None:
        try:
            from app.core.websocket import manager
            await manager.broadcast_global(
                event_type="delivery_failure_alert",
                data={
                    "channel": channel,
                    "failure_count": count,
                    "window_minutes": _WINDOW_MINUTES,
                    "threshold": _FAILURE_THRESHOLD,
                    "last_reason": last_reason,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
            )
        except Exception as exc:
            print(f"[DeliveryAlertService] broadcast error: {exc}")


# Singleton instance
delivery_alerts = DeliveryAlertService()
