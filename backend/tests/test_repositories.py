"""Test repositories to ensure they work correctly."""

import pytest
from sqlalchemy.orm import Session
from app.models.models import User, UserType, Conversation, Message
from app.repositories import UserRepository, ConversationRepository, MessageRepository
from app.core.database import SessionLocal


@pytest.fixture
def db_session():
    """Create a test database session."""
    session = SessionLocal()
    yield session
    session.close()


class TestUserRepository:
    """Test UserRepository methods."""

    def test_find_by_email(self, db_session):
        """Test finding user by email."""
        repo = UserRepository(db_session)

        # This is a read test, won't create data
        # In real tests, you'd seed test data
        # user = repo.find_by_email("test@example.com")
        # assert user is not None

    def test_find_by_auth_id(self, db_session):
        """Test finding user by auth_id."""
        repo = UserRepository(db_session)
        # user = repo.find_by_auth_id("auth_123")
        # assert user is not None

    def test_find_approved_users(self, db_session):
        """Test finding approved users."""
        repo = UserRepository(db_session)
        # users = repo.find_approved_users()
        # assert len(users) >= 0


class TestConversationRepository:
    """Test ConversationRepository methods."""

    def test_find_by_user(self, db_session):
        """Test finding conversations by user."""
        repo = ConversationRepository(db_session)
        # conversations = repo.find_by_user("user_id_123")
        # assert isinstance(conversations, list)

    def test_find_by_status(self, db_session):
        """Test finding conversations by status."""
        repo = ConversationRepository(db_session)
        # conversations = repo.find_by_status("open")
        # assert isinstance(conversations, list)


class TestMessageRepository:
    """Test MessageRepository methods."""

    def test_find_by_conversation(self, db_session):
        """Test finding messages in conversation."""
        repo = MessageRepository(db_session)
        # messages = repo.find_by_conversation("conv_id_123")
        # assert isinstance(messages, list)

    def test_find_by_user(self, db_session):
        """Test finding messages by user."""
        repo = MessageRepository(db_session)
        # messages = repo.find_by_user("user_id_123")
        # assert isinstance(messages, list)


if __name__ == "__main__":
    print("✅ Repository tests created")
    print("📝 NOTE: Uncomment tests and seed test data before running")
