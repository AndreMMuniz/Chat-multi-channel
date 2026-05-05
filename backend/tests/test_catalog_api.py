from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.api import api_router
from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.models import AuditLog, CatalogCategory, CatalogItem, CatalogItemStatus, CatalogItemType, DefaultRole, User, UserType


def _seed_user(db):
    user_type = UserType(name="Catalog Admin", base_role=DefaultRole.ADMIN, is_system=False)
    db.add(user_type)
    db.flush()

    user = User(
        auth_id="auth-catalog-api",
        email="catalog-api@example.com",
        full_name="Catalog API User",
        user_type_id=user_type.id,
    )
    db.add(user)
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


def test_create_list_and_get_catalog_items(db):
    user = _seed_user(db)
    client = _make_client(db, user)

    create_response = client.post(
        "/api/v1/admin/catalog-items",
        json={
            "name": "WhatsApp Automation Setup",
            "commercial_name": "WhatsApp Automation Setup",
            "type": "service",
            "status": "active",
            "category": "Implementation",
            "sku": "SRV-WA-001",
            "commercial_description": "Setup and configure the first automation workflow.",
            "internal_notes": "Confirm credentials first.",
            "base_price": 4200,
            "unit": "Fixed fee",
            "sla_or_delivery_time": "5 business days",
            "active_for_support": True,
            "can_be_quoted": True,
            "allows_discount": True,
            "tags": ["onboarding", "whatsapp"],
        },
    )
    assert create_response.status_code == 200
    created = create_response.json()["data"]
    assert created["reference"].startswith("CAT-")
    assert created["can_be_quoted"] is True
    assert created["category_id"] is not None

    list_response = client.get("/api/v1/admin/catalog-items", params={"type": "service", "can_be_quoted": "true"})
    assert list_response.status_code == 200
    assert len(list_response.json()["data"]) == 1
    assert list_response.json()["data"][0]["commercial_name"] == "WhatsApp Automation Setup"

    get_response = client.get(f"/api/v1/admin/catalog-items/{created['id']}")
    assert get_response.status_code == 200
    assert get_response.json()["data"]["sku"] == "SRV-WA-001"

    categories_response = client.get("/api/v1/admin/catalog-categories")
    assert categories_response.status_code == 200
    assert categories_response.json()["data"][0]["label"] == "Implementation"

    audit_actions = [log.action for log in db.query(AuditLog).order_by(AuditLog.created_at.asc()).all()]
    assert "create_catalog_item" in audit_actions


def test_update_duplicate_and_status_transition_catalog_item(db):
    user = _seed_user(db)
    item = CatalogItem(
        name="Premium SLA Monitoring",
        commercial_name="Premium SLA Monitoring",
        type=CatalogItemType.PRODUCT,
        status=CatalogItemStatus.ACTIVE,
        category="Operations",
        sku="PRD-SLA-003",
        commercial_description="Real-time SLA tracking with alerts.",
        base_price=1490,
        unit="Monthly",
        active_for_support=True,
        can_be_quoted=True,
        allows_discount=True,
        tags=["sla", "enterprise"],
        created_by_user_id=user.id,
        updated_by_user_id=user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    client = _make_client(db, user)

    update_response = client.patch(
        f"/api/v1/admin/catalog-items/{item.id}",
        json={"base_price": 1590, "internal_notes": "Updated commercial baseline.", "category": "Operations Premium"},
    )
    assert update_response.status_code == 200
    updated = update_response.json()["data"]
    assert updated["base_price"] == 1590
    assert updated["internal_notes"] == "Updated commercial baseline."
    assert updated["category"] == "Operations Premium"
    assert updated["category_id"] is not None

    duplicate_response = client.post(f"/api/v1/admin/catalog-items/{item.id}/duplicate")
    assert duplicate_response.status_code == 200
    duplicated = duplicate_response.json()["data"]
    assert duplicated["status"] == "under_review"
    assert duplicated["can_be_quoted"] is False

    status_response = client.patch(
        f"/api/v1/admin/catalog-items/{item.id}/status",
        json={"status": "inactive"},
    )
    assert status_response.status_code == 200
    assert status_response.json()["data"]["status"] == "inactive"

    categories = db.query(CatalogCategory).order_by(CatalogCategory.label.asc()).all()
    assert [category.label for category in categories] == ["Operations Premium"]

    audit_actions = [log.action for log in db.query(AuditLog).order_by(AuditLog.created_at.asc()).all()]
    assert "update_catalog_item" in audit_actions
    assert "update_catalog_price" in audit_actions
    assert "update_catalog_status" in audit_actions
    assert "duplicate_catalog_item" in audit_actions


def test_create_catalog_category_endpoint_is_idempotent(db):
    user = _seed_user(db)
    client = _make_client(db, user)

    first = client.post("/api/v1/admin/catalog-categories", json={"label": "Consulting", "position": 3})
    assert first.status_code == 200
    assert first.json()["data"]["key"] == "consulting"

    second = client.post("/api/v1/admin/catalog-categories", json={"label": "Consulting", "position": 7})
    assert second.status_code == 200
    assert second.json()["data"]["id"] == first.json()["data"]["id"]

    assert db.query(CatalogCategory).count() == 1


def test_catalog_item_ready_for_proposal_requires_active_state(db):
    user = _seed_user(db)
    client = _make_client(db, user)

    response = client.post(
        "/api/v1/admin/catalog-items",
        json={
            "name": "Legacy SMS Connector",
            "commercial_name": "Legacy SMS Connector",
            "type": "product",
            "status": "inactive",
            "category": "Channels",
            "commercial_description": "Legacy connector.",
            "base_price": 590,
            "unit": "Monthly",
            "active_for_support": True,
            "can_be_quoted": True,
            "allows_discount": False,
            "tags": [],
        },
    )
    assert response.status_code == 422
    assert response.json()["detail"]["error"]["code"] == "INVALID_QUOTE_STATUS"
