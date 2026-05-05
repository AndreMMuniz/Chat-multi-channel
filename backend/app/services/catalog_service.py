from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.models import CatalogItem, CatalogItemStatus, User
from app.repositories.catalog_repo import CatalogItemRepository
from app.schemas.catalog import CatalogItemCreate, CatalogItemUpdate
from app.schemas.common import create_error_response


class CatalogService:
    def __init__(self, db: Session):
        self.db = db
        self.items = CatalogItemRepository(db)

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

    async def create_catalog_item(self, payload: CatalogItemCreate, current_user: User) -> CatalogItem:
        data = payload.model_dump()
        await self.ensure_replacement_exists(data.get("replaced_by_catalog_item_id"))
        await self.validate_quoted_state(data)
        item = await self.items.create(
            {
                **data,
                "created_by_user_id": current_user.id,
                "updated_by_user_id": current_user.id,
                "price_updated_at": datetime.now(timezone.utc),
            }
        )
        return await self.items.find_catalog_item(item.id)

    async def update_catalog_item(self, item: CatalogItem, payload: CatalogItemUpdate, current_user: User) -> CatalogItem:
        data = payload.model_dump(exclude_unset=True)
        if "replaced_by_catalog_item_id" in data:
            await self.ensure_replacement_exists(data.get("replaced_by_catalog_item_id"))
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
        return await self.items.find_catalog_item(updated.id)

    async def duplicate_catalog_item(self, item: CatalogItem, current_user: User) -> CatalogItem:
        payload = {
            "name": f"{item.name} Copy",
            "commercial_name": f"{item.commercial_name} Copy",
            "type": item.type,
            "status": CatalogItemStatus.UNDER_REVIEW,
            "category": item.category,
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
        return await self.items.find_catalog_item(duplicated.id)


def serialize_catalog_item(item: CatalogItem) -> dict:
    return {
        "id": item.id,
        "reference": item.reference_code,
        "name": item.name,
        "commercial_name": item.commercial_name,
        "type": item.type,
        "status": item.status,
        "category": item.category,
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
