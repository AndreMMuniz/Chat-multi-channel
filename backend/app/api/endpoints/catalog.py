from typing import Any, Dict, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.core.limiter import limiter
from app.models.models import User
from app.schemas.catalog import CatalogItemCreate, CatalogItemResponse, CatalogItemStatusUpdate, CatalogItemUpdate
from app.schemas.common import create_error_response, create_paginated_response, create_response
from app.services.catalog_service import CatalogService, serialize_catalog_item

router = APIRouter()


def _parse_bool_filter(value: Optional[str]) -> Optional[bool]:
    if value is None:
        return None
    normalized = value.strip().lower()
    if normalized in {"true", "1", "yes"}:
        return True
    if normalized in {"false", "0", "no"}:
        return False
    return None


@router.get("/catalog-items")
@limiter.limit("60/minute")
async def list_catalog_items(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    type: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    can_be_quoted: Optional[str] = None,
    active_for_support: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    service = CatalogService(db)
    quoted_flag = _parse_bool_filter(can_be_quoted)
    support_flag = _parse_bool_filter(active_for_support)
    items = await service.items.list_with_filters(
        skip=skip,
        limit=limit,
        search=search,
        type=type,
        category=category,
        status=status,
        can_be_quoted=quoted_flag,
        active_for_support=support_flag,
    )
    total = await service.items.count_with_filters(
        search=search,
        type=type,
        category=category,
        status=status,
        can_be_quoted=quoted_flag,
        active_for_support=support_flag,
    )
    return create_paginated_response(
        data=[CatalogItemResponse.model_validate(serialize_catalog_item(item)) for item in items],
        total=total,
        page=(skip // limit) + 1,
        page_size=limit,
    )


@router.post("/catalog-items")
@limiter.limit("60/minute")
async def create_catalog_item(
    request: Request,
    payload: CatalogItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    item = await CatalogService(db).create_catalog_item(payload, current_user)
    return create_response(CatalogItemResponse.model_validate(serialize_catalog_item(item)))


@router.get("/catalog-items/{item_id}")
@limiter.limit("60/minute")
async def get_catalog_item(
    request: Request,
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    item = await CatalogService(db).items.find_catalog_item(item_id)
    if not item:
        error_response, status = create_error_response(
            code="CATALOG_ITEM_NOT_FOUND",
            message="Catalog item not found",
            status_code=404,
        )
        raise HTTPException(status_code=status, detail=error_response)
    return create_response(CatalogItemResponse.model_validate(serialize_catalog_item(item)))


@router.patch("/catalog-items/{item_id}")
@limiter.limit("60/minute")
async def update_catalog_item(
    request: Request,
    item_id: UUID,
    payload: CatalogItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    service = CatalogService(db)
    item = await service.items.find_catalog_item(item_id)
    if not item:
        error_response, status = create_error_response(
            code="CATALOG_ITEM_NOT_FOUND",
            message="Catalog item not found",
            status_code=404,
        )
        raise HTTPException(status_code=status, detail=error_response)
    updated = await service.update_catalog_item(item, payload, current_user)
    return create_response(CatalogItemResponse.model_validate(serialize_catalog_item(updated)))


@router.patch("/catalog-items/{item_id}/status")
@limiter.limit("60/minute")
async def update_catalog_item_status(
    request: Request,
    item_id: UUID,
    payload: CatalogItemStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    service = CatalogService(db)
    item = await service.items.find_catalog_item(item_id)
    if not item:
        error_response, status = create_error_response(
            code="CATALOG_ITEM_NOT_FOUND",
            message="Catalog item not found",
            status_code=404,
        )
        raise HTTPException(status_code=status, detail=error_response)
    updated = await service.update_catalog_item(item, CatalogItemUpdate(status=payload.status), current_user)
    return create_response(CatalogItemResponse.model_validate(serialize_catalog_item(updated)))


@router.post("/catalog-items/{item_id}/duplicate")
@limiter.limit("60/minute")
async def duplicate_catalog_item(
    request: Request,
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    service = CatalogService(db)
    item = await service.items.find_catalog_item(item_id)
    if not item:
        error_response, status = create_error_response(
            code="CATALOG_ITEM_NOT_FOUND",
            message="Catalog item not found",
            status_code=404,
        )
        raise HTTPException(status_code=status, detail=error_response)
    duplicated = await service.duplicate_catalog_item(item, current_user)
    return create_response(CatalogItemResponse.model_validate(serialize_catalog_item(duplicated)))
