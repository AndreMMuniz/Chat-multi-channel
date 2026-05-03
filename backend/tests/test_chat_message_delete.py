from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.api import api_router
from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.models import (
    ChannelType,
    Contact,
    Conversation,
    ConversationTag,
    ConversationStatus,
    DefaultRole,
    Message,
    MessageType,
    OFFICIAL_PROJECT_STAGES,
    Project,
    ProjectPriority,
    ProjectSourceType,
    ProjectStage,
    ProjectStatus,
    User,
    UserType,
)


def _make_client(db, current_user):
    app = FastAPI()
    app.include_router(api_router, prefix="/api/v1")

    def override_get_db():
        try:
            yield db
        finally:
            pass

    async def override_current_user():
        return current_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_current_user
    return TestClient(app, raise_server_exceptions=True)


def _seed_user_with_delete_permission(db):
    user_type = UserType(
        name="Message Admin",
        base_role=DefaultRole.ADMIN,
        is_system=False,
        can_delete_messages=True,
    )
    db.add(user_type)
    db.flush()

    user = User(
        auth_id="auth-delete-message",
        email="delete-message@example.com",
        full_name="Delete Message User",
        user_type_id=user_type.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_delete_message_updates_conversation_last_message(db):
    user = _seed_user_with_delete_permission(db)
    contact = Contact(name="TechCorp")
    db.add(contact)
    db.flush()

    conversation = Conversation(
        contact_id=contact.id,
        assigned_user_id=user.id,
        channel=ChannelType.WHATSAPP,
        status=ConversationStatus.OPEN,
        is_unread=True,
    )
    db.add(conversation)
    db.flush()

    first = Message(
        conversation_id=conversation.id,
        owner_id=user.id,
        content="Older message",
        inbound=True,
        message_type=MessageType.TEXT,
        conversation_sequence=1,
    )
    second = Message(
        conversation_id=conversation.id,
        owner_id=user.id,
        content="Latest message",
        inbound=False,
        message_type=MessageType.TEXT,
        conversation_sequence=2,
    )
    db.add_all([first, second])
    conversation.last_message = second.content
    conversation.last_message_date = second.created_at
    db.commit()
    db.refresh(second)

    client = _make_client(db, user)
    response = client.delete(f"/api/v1/chat/conversations/{conversation.id}/messages/{second.id}")
    assert response.status_code == 200
    assert response.json()["data"]["deleted"] is True

    db.refresh(conversation)
    assert conversation.last_message == "Older message"
    assert db.query(Message).filter(Message.id == second.id).first() is None


def test_delete_message_rejects_project_provenance_references(db):
    user = _seed_user_with_delete_permission(db)
    stages = [ProjectStage(key=key, label=label, position=position) for key, label, position in OFFICIAL_PROJECT_STAGES]
    db.add_all(stages)

    contact = Contact(name="TechCorp")
    db.add(contact)
    db.flush()

    conversation = Conversation(
        contact_id=contact.id,
        assigned_user_id=user.id,
        channel=ChannelType.WHATSAPP,
        status=ConversationStatus.OPEN,
    )
    db.add(conversation)
    db.flush()

    message = Message(
        conversation_id=conversation.id,
        owner_id=user.id,
        content="Demand that became a project",
        inbound=True,
        message_type=MessageType.TEXT,
        conversation_sequence=1,
    )
    db.add(message)
    db.flush()

    project = Project(
        title="Linked project",
        description="Created from message",
        stage="lead",
        priority=ProjectPriority.MEDIUM,
        status=ProjectStatus.OPEN,
        source_type=ProjectSourceType.MESSAGE,
        source_message_id=message.id,
        source_conversation_id=conversation.id,
        created_by_user_id=user.id,
    )
    db.add(project)
    db.commit()

    client = _make_client(db, user)
    response = client.delete(f"/api/v1/chat/conversations/{conversation.id}/messages/{message.id}")
    assert response.status_code == 409
    assert response.json()["detail"]["error"]["code"] == "MESSAGE_LINKED_TO_PROJECT"


def test_update_conversation_accepts_uppercase_status_and_tag_values(db):
    user = _seed_user_with_delete_permission(db)
    contact = Contact(name="Tagged Contact")
    db.add(contact)
    db.flush()

    conversation = Conversation(
        contact_id=contact.id,
        assigned_user_id=user.id,
        channel=ChannelType.TELEGRAM,
        status=ConversationStatus.OPEN,
        tag=None,
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    client = _make_client(db, user)
    response = client.patch(
        f"/api/v1/chat/conversations/{conversation.id}",
        json={"status": "OPEN", "tag": "SUPPORT"},
    )

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["status"] == "open"
    assert payload["tag"] == "support"

    db.refresh(conversation)
    assert conversation.status == ConversationStatus.OPEN
    assert conversation.tag == ConversationTag.SUPPORT
