"""
Shared pytest fixtures.

Uses an in-memory SQLite DB so tests run without a real Postgres instance.
The FastAPI app is patched to use this test DB.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session

from app.core.database import Base, get_db

# ── In-memory SQLite ──────────────────────────────────────────────────────────

SQLITE_URL = "sqlite://"

engine = create_engine(
    SQLITE_URL,
    connect_args={"check_same_thread": False},
)

# SQLite doesn't enforce FK constraints by default — enable them
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


@pytest.fixture(scope="function")
def db() -> Session:
    """Fresh DB session per test — rolls back after each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db: Session) -> TestClient:
    """FastAPI TestClient with DB dependency overridden."""
    # Import here to avoid startup side-effects before DB is ready
    from app.api.api import api_router
    from fastapi import FastAPI

    app = FastAPI()
    app.include_router(api_router, prefix="/api/v1")

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
