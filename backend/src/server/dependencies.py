"""FastAPI dependencies for the agent server."""

from app.core.database import get_db  # reuse existing DB dependency

__all__ = ["get_db"]
