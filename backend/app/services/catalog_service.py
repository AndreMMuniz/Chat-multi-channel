import re
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.models import CatalogCategory, CatalogItem, CatalogItemStatus, User
from app.repositories.catalog_repo import CatalogCategoryRepository, CatalogItemRepository
from app.schemas.catalog import CatalogCategoryCreate, CatalogItemCreate, CatalogItemUpdate
from app.schemas.common import create_error_response
from app.services.audit_service import log_action


def _slugify_category(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", value.strip().lower())
    normalized = normalized.strip("-")
    return normalized[:120] or "catalog-category"


class CatalogService:
    def __init__(self, db: Session):
        self.db = db
        self.items = CatalogItemRepository(db)
        self.categories = CatalogCategoryRepository(db)

    async def ensure_user_exists(self, user_id: Optional[UUID]) -> None:
        if not user_id:
            return
        owner = self.db.query(User).filter(User.id == user_id).first()
        if not owner:
            error_response, status = create_error_response(
                code="USER_NOT_FOUND",
                message="User not found",
                status_code=404,
            )
            raise HTTPException(status_code=status, detail=error_response)

    async def ensure_replacement_exists(self, item_id: Optional[UUID]) -> None:
        if not item_id:
            return
        item = await self.items.find_catalog_item(item_id)
        if not item:
            error_response, status = create_error_response(
                code="REPLACEMENT_NOT_FOUND",
                message="Replacement catalog item not found",
                status_code=404,
            )
            raise HTTPException(status_code=status, detail=error_response)

    async def validate_quoted_state(self, payload: dict) -> None:
        if not payload.get("can_be_quoted"):
            return
        missing = [
            field
            for field in ("commercial_name", "commercial_description", "unit")
            if not payload.get(field)
        ]
        if payload.get("base_price") is None:
            missing.append("base_price")
        if missing:
            error_response, status = create_error_response(
                code="QUOTE_FIELDS_REQUIRED",
                message="Quoted catalog items must include all required commercial fields",
                details={"missing_fields": missing},
                status_code=422,
            )
            raise HTTPException(status_code=status, detail=error_response)
        if payload.get("status") != CatalogItemStatus.ACTIVE:
            error_response, status = create_error_response(
                code="INVALID_QUOTE_STATUS",
                message="Only active catalog items can be marked as ready for proposal",
                status_code=422,
            )
            raise HTTPException(status_code=status, detail=error_response)

    async def ensure_category(self, label: str) -> CatalogCategory:
        normalized_label = label.strip()
        existing = await self.categories.find_by_label(normalized_label)
        if existing:
            return existing

        base_key = _slugify_category(normalized_label)
        candidate_key = base_key
        suffix = 2
        while await self.categories.find_by_key(candidate_key):
            candidate_key = f"{base_key[:116]}-{suffix}"
            suffix += 1

        return await self.categories.create(
            {
                "label": normalized_label,
                "key": candidate_key,
                "position": 0,
                "is_active": True,
            }
        )

    async def create_category(self, payload: CatalogCategoryCreate, current_user: User) -> CatalogCategory:
        label = payload.label.strip()
        existing = await self.categories.find_by_label(label)
        if existing:
            return existing

        key = payload.key.strip() if payload.key else _slugify_category(label)
        candidate_key = key
        suffix = 2
        while await self.categories.find_by_key(candidate_key):
            candidate_key = f"{key[:116]}-{suffix}"
            suffix += 1

        category = await self.categories.create(
            {
                "label": label,
                "key": candidate_key,
                "position": payload.position,
                "is_active": payload.is_active,
            }
        )
        log_action(
            self.db,
            current_user.id,
            "create_catalog_category",
            "catalog_category",
            str(category.id),
            details={"key": category.key, "label": category.label, "is_active": category.is_active},
        )
        return category

    def _snapshot_catalog_item(self, item: CatalogItem) -> dict:
        return {
            "name": item.name,
            "commercial_name": item.commercial_name,
            "status": item.status,
            "category": item.category,
            "base_price": item.base_price,
            "unit": item.unit,
            "active_for_support": item.active_for_support,
            "can_be_quoted": item.can_be_quoted,
            "allows_discount": item.allows_discount,
            "usage_rules": item.usage_rules,
            "replaced_by_catalog_item_id": item.replaced_by_catalog_item_id,
        }

    def _log_catalog_update_actions(self, item_before: dict, item_after: CatalogItem, current_user: User) -> None:
        changed_fields = {}
        for field, before_value in item_before.items():
            after_value = getattr(item_after, field)
            if before_value != after_value:
                changed_fields[field] = {"before": before_value, "after": after_value}

        if changed_fields:
            log_action(
                self.db,
                current_user.id,
                "update_catalog_item",
                "catalog_item",
                str(item_after.id),
                details={"reference": item_after.reference_code, "changes": changed_fields},
            )

        if item_before["base_price"] != item_after.base_price:
            log_action(
                self.db,
                current_user.id,
                "update_catalog_price",
                "catalog_item",
                str(item_after.id),
                details={
                    "reference": item_after.reference_code,
                    "before": item_before["base_price"],
                    "after": item_after.base_price,
                },
            )

        if item_before["status"] != item_after.status:
            log_action(
                self.db,
                current_user.id,
                "update_catalog_status",
                "catalog_item",
                str(item_after.id),
                details={
                    "reference": item_after.reference_code,
                    "before": item_before["status"],
                    "after": item_after.status,
                },
            )

        if item_before["can_be_quoted"] != item_after.can_be_quoted:
            log_action(
                self.db,
                current_user.id,
                "update_catalog_quote_readiness",
                "catalog_item",
                str(item_after.id),
                details={
                    "reference": item_after.reference_code,
                    "before": item_before["can_be_quoted"],
                    "after": item_after.can_be_quoted,
                },
            )

    async def create_catalog_item(self, payload: CatalogItemCreate, current_user: User) -> CatalogItem:
        data = payload.model_dump()
        await self.ensure_replacement_exists(data.get("replaced_by_catalog_item_id"))
        await self.validate_quoted_state(data)
        category = await self.ensure_category(data["category"])
        item = await self.items.create(
            {
                **data,
                "category": category.label,
                "category_id": category.id,
                "created_by_user_id": current_user.id,
                "updated_by_user_id": current_user.id,
                "price_updated_at": datetime.now(timezone.utc),
            }
        )
        created = await self.items.find_catalog_item(item.id)
        log_action(
            self.db,
            current_user.id,
            "create_catalog_item",
            "catalog_item",
            str(created.id),
            details={
                "reference": created.reference_code,
                "category": created.category,
                "category_id": created.category_id,
                "base_price": created.base_price,
                "status": created.status,
                "can_be_quoted": created.can_be_quoted,
            },
        )
        return created

    async def update_catalog_item(self, item: CatalogItem, payload: CatalogItemUpdate, current_user: User) -> CatalogItem:
        data = payload.model_dump(exclude_unset=True)
        before = self._snapshot_catalog_item(item)
        if "replaced_by_catalog_item_id" in data:
            await self.ensure_replacement_exists(data.get("replaced_by_catalog_item_id"))
        if "category" in data and data["category"]:
            category = await self.ensure_category(data["category"])
            data["category"] = category.label
            data["category_id"] = category.id
        next_status = data.get("status", item.status)
        if next_status != CatalogItemStatus.ACTIVE and "can_be_quoted" not in data:
            data["can_be_quoted"] = False
        merged = {
            "commercial_name": data.get("commercial_name", item.commercial_name),
            "commercial_description": data.get("commercial_description", item.commercial_description),
            "unit": data.get("unit", item.unit),
            "base_price": data.get("base_price", item.base_price),
            "status": next_status,
            "can_be_quoted": data.get("can_be_quoted", item.can_be_quoted),
        }
        await self.validate_quoted_state(merged)
        if "base_price" in data and data["base_price"] != item.base_price:
            data["price_updated_at"] = datetime.now(timezone.utc)
        data["updated_by_user_id"] = current_user.id
        updated = await self.items.update(item.id, data)
        refreshed = await self.items.find_catalog_item(updated.id)
        self._log_catalog_update_actions(before, refreshed, current_user)
        return refreshed

    async def duplicate_catalog_item(self, item: CatalogItem, current_user: User) -> CatalogItem:
        category = await self.ensure_category(item.category)
        payload = {
            "name": f"{item.name} Copy",
            "commercial_name": f"{item.commercial_name} Copy",
            "type": item.type,
            "status": CatalogItemStatus.UNDER_REVIEW,
            "category": category.label,
            "category_id": category.id,
            "sku": None,
            "commercial_description": item.commercial_description,
            "internal_notes": item.internal_notes,
            "base_price": item.base_price,
            "unit": item.unit,
            "sla_or_delivery_time": item.sla_or_delivery_time,
            "usage_rules": item.usage_rules,
            "active_for_support": item.active_for_support,
            "can_be_quoted": False,
            "allows_discount": item.allows_discount,
            "tags": item.tags or [],
            "replaced_by_catalog_item_id": None,
            "created_by_user_id": current_user.id,
            "updated_by_user_id": current_user.id,
            "price_updated_at": datetime.now(timezone.utc),
        }
        duplicated = await self.items.create(payload)
        created = await self.items.find_catalog_item(duplicated.id)
        log_action(
            self.db,
            current_user.id,
            "duplicate_catalog_item",
            "catalog_item",
            str(created.id),
            details={
                "reference": created.reference_code,
                "source_catalog_item_id": item.id,
                "source_reference": item.reference_code,
            },
        )
        return created


def serialize_catalog_item(item: CatalogItem) -> dict:
    return {
        "id": item.id,
        "reference": item.reference_code,
        "name": item.name,
        "commercial_name": item.commercial_name,
        "type": item.type,
        "status": item.status,
        "category": item.category,
        "category_id": item.category_id,
        "sku": item.sku,
        "commercial_description": item.commercial_description,
        "internal_notes": item.internal_notes,
        "base_price": item.base_price,
        "unit": item.unit,
        "sla_or_delivery_time": item.sla_or_delivery_time,
        "usage_rules": item.usage_rules,
        "active_for_support": item.active_for_support,
        "can_be_quoted": item.can_be_quoted,
        "allows_discount": item.allows_discount,
        "tags": item.tags or [],
        "replaced_by_catalog_item_id": item.replaced_by_catalog_item_id,
        "created_by_id": item.created_by_user_id,
        "updated_by_id": item.updated_by_user_id,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
        "price_updated_at": item.price_updated_at,
    }
