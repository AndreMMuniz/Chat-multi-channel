from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.models import CatalogItemStatus, CatalogItemType


class CatalogItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    commercial_name: str = Field(..., min_length=1, max_length=255)
    type: CatalogItemType
    status: CatalogItemStatus = CatalogItemStatus.ACTIVE
    category: str = Field(..., min_length=1, max_length=120)
    sku: Optional[str] = Field(default=None, max_length=120)
    commercial_description: str = Field(..., min_length=1)
    internal_notes: Optional[str] = None
    base_price: int = Field(default=0, ge=0)
    unit: str = Field(..., min_length=1, max_length=120)
    sla_or_delivery_time: Optional[str] = Field(default=None, max_length=255)
    usage_rules: Optional[str] = None
    active_for_support: bool = True
    can_be_quoted: bool = False
    allows_discount: bool = False
    tags: list[str] = Field(default_factory=list)
    replaced_by_catalog_item_id: Optional[UUID] = None

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, value: list[str]) -> list[str]:
        cleaned = [tag.strip() for tag in value if tag and tag.strip()]
        return cleaned[:12]

class CatalogItemCreate(CatalogItemBase):
    pass


class CatalogItemUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    commercial_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    type: Optional[CatalogItemType] = None
    status: Optional[CatalogItemStatus] = None
    category: Optional[str] = Field(default=None, min_length=1, max_length=120)
    sku: Optional[str] = Field(default=None, max_length=120)
    commercial_description: Optional[str] = Field(default=None, min_length=1)
    internal_notes: Optional[str] = None
    base_price: Optional[int] = Field(default=None, ge=0)
    unit: Optional[str] = Field(default=None, min_length=1, max_length=120)
    sla_or_delivery_time: Optional[str] = Field(default=None, max_length=255)
    usage_rules: Optional[str] = None
    active_for_support: Optional[bool] = None
    can_be_quoted: Optional[bool] = None
    allows_discount: Optional[bool] = None
    tags: Optional[list[str]] = None
    replaced_by_catalog_item_id: Optional[UUID] = None

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, value: Optional[list[str]]) -> Optional[list[str]]:
        if value is None:
            return value
        cleaned = [tag.strip() for tag in value if tag and tag.strip()]
        return cleaned[:12]


class CatalogItemStatusUpdate(BaseModel):
    status: CatalogItemStatus


class CatalogItemResponse(BaseModel):
    id: UUID
    reference: str
    name: str
    commercial_name: str
    type: CatalogItemType
    status: CatalogItemStatus
    category: str
    sku: Optional[str] = None
    commercial_description: str
    internal_notes: Optional[str] = None
    base_price: int
    unit: str
    sla_or_delivery_time: Optional[str] = None
    usage_rules: Optional[str] = None
    active_for_support: bool
    can_be_quoted: bool
    allows_discount: bool
    tags: list[str] = Field(default_factory=list)
    replaced_by_catalog_item_id: Optional[UUID] = None
    created_by_id: Optional[UUID] = None
    updated_by_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    price_updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
