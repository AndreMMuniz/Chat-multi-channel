from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.api import api_router
from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.models import (
    ChannelType,
    Contact,
    Conversation,
    ConversationStatus,
    DefaultRole,
    OFFICIAL_PROJECT_STAGES,
    Project,
    ProjectPriority,
    ProjectSourceType,
    ProjectStage,
    ProjectStatus,
    User,
    UserType,
)


def _seed_user_and_stages(db):
    user_type = UserType(name="Project Admin", base_role=DefaultRole.ADMIN, is_system=False)
    db.add(user_type)
    db.flush()

    user = User(
        auth_id="auth-project-api",
        email="project-api@example.com",
        full_name="Project API User",
        user_type_id=user_type.id,
    )
    db.add(user)

    stages = [
        ProjectStage(key=key, label=label, position=position)
        for key, label, position in OFFICIAL_PROJECT_STAGES
    ]
    db.add_all(stages)
    db.commit()
    db.refresh(user)
    return user


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


def test_list_project_stages_returns_official_commercial_stages(db):
    user = _seed_user_and_stages(db)
    client = _make_client(db, user)

    response = client.get("/api/v1/admin/project-stages")
    assert response.status_code == 200
    payload = response.json()
    labels = [item["label"] for item in payload["data"]]
    assert labels == ["Lead", "Qualification", "Proposal", "Negotiation", "Closed"]


def test_create_and_get_project(db):
    user = _seed_user_and_stages(db)
    client = _make_client(db, user)

    response = client.post(
        "/api/v1/admin/projects",
        json={
            "title": "Client onboarding demand",
            "description": "Customer asked for onboarding support",
            "stage": "lead",
            "priority": "medium",
            "status": "open",
            "source_type": "manual",
            "progress": 10,
        },
    )
    assert response.status_code == 200
    created = response.json()["data"]
    assert created["reference"].startswith("PRJ-")
    assert created["stage"] == "lead"

    get_response = client.get(f"/api/v1/admin/projects/{created['id']}")
    assert get_response.status_code == 200
    assert get_response.json()["data"]["title"] == "Client onboarding demand"


def test_list_projects_supports_stage_and_channel_filters(db):
    user = _seed_user_and_stages(db)
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

    db.add_all(
        [
            Project(
                title="Lead project",
                description="Alpha",
                stage="lead",
                priority=ProjectPriority.MEDIUM,
                status=ProjectStatus.OPEN,
                source_type=ProjectSourceType.MANUAL,
                created_by_user_id=user.id,
                channel=ChannelType.WHATSAPP,
            ),
            Project(
                title="Closed email project",
                description="Beta",
                stage="closed",
                priority=ProjectPriority.HIGH,
                status=ProjectStatus.DONE,
                source_type=ProjectSourceType.MANUAL,
                created_by_user_id=user.id,
                channel=ChannelType.EMAIL,
            ),
        ]
    )
    db.commit()

    client = _make_client(db, user)

    stage_response = client.get("/api/v1/admin/projects", params={"stage": "lead"})
    assert stage_response.status_code == 200
    assert len(stage_response.json()["data"]) == 1
    assert stage_response.json()["data"][0]["title"] == "Lead project"

    channel_response = client.get("/api/v1/admin/projects", params={"channel": "email"})
    assert channel_response.status_code == 200
    assert len(channel_response.json()["data"]) == 1
    assert channel_response.json()["data"][0]["title"] == "Closed email project"


def test_update_move_stage_and_delete_project(db):
    user = _seed_user_and_stages(db)
    project = Project(
        title="Mutable project",
        description="Initial description",
        stage="lead",
        priority=ProjectPriority.MEDIUM,
        status=ProjectStatus.OPEN,
        source_type=ProjectSourceType.MANUAL,
        created_by_user_id=user.id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    client = _make_client(db, user)

    update_response = client.patch(
        f"/api/v1/admin/projects/{project.id}",
        json={"title": "Updated project", "progress": 55, "priority": "high"},
    )
    assert update_response.status_code == 200
    updated = update_response.json()["data"]
    assert updated["title"] == "Updated project"
    assert updated["progress"] == 55
    assert updated["priority"] == "high"

    stage_response = client.patch(
        f"/api/v1/admin/projects/{project.id}/stage",
        json={"stage": "negotiation"},
    )
    assert stage_response.status_code == 200
    assert stage_response.json()["data"]["stage"] == "negotiation"

    delete_response = client.delete(f"/api/v1/admin/projects/{project.id}")
    assert delete_response.status_code == 200
    assert delete_response.json()["data"]["deleted"] is True


def test_reject_invalid_progress_and_missing_message_source(db):
    user = _seed_user_and_stages(db)
    client = _make_client(db, user)

    progress_response = client.post(
        "/api/v1/admin/projects",
        json={
            "title": "Broken project",
            "description": "Invalid progress",
            "stage": "lead",
            "priority": "medium",
            "status": "open",
            "source_type": "manual",
            "progress": 101,
        },
    )
    assert progress_response.status_code == 422

    source_response = client.post(
        "/api/v1/admin/projects",
        json={
            "title": "Message project",
            "description": "Missing source message",
            "stage": "lead",
            "priority": "medium",
            "status": "open",
            "source_type": "message",
            "progress": 10,
        },
    )
    assert source_response.status_code == 422
    assert source_response.json()["detail"]["error"]["code"] == "SOURCE_MESSAGE_REQUIRED"
