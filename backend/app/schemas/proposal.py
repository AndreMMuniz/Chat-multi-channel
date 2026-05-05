from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.models import ProposalStatus


class ProposalCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    customer_name: Optional[str] = Field(default=None, max_length=255)
    notes: Optional[str] = None
    status: ProposalStatus = ProposalStatus.DRAFT


class ProposalUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    customer_name: Optional[str] = Field(default=None, max_length=255)
    notes: Optional[str] = None
    status: Optional[ProposalStatus] = None


class ProposalFromCatalogCreate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    customer_name: Optional[str] = Field(default=None, max_length=255)
    notes: Optional[str] = None
    quantity: int = Field(default=1, ge=1)


class ProposalItemFromCatalogCreate(BaseModel):
    quantity: int = Field(default=1, ge=1)
    discount_amount: int = Field(default=0, ge=0)


class ProposalItemResponse(BaseModel):
    id: UUID
    proposal_id: UUID
    catalog_item_id: Optional[UUID] = None
    catalog_reference_code: Optional[str] = None
    name_snapshot: str
    commercial_name_snapshot: str
    type_snapshot: str
    sku_snapshot: Optional[str] = None
    category_snapshot: str
    commercial_description_snapshot: str
    base_price_snapshot: int
    unit_snapshot: str
    sla_or_delivery_time_snapshot: Optional[str] = None
    allows_discount_snapshot: bool
    quantity: int
    unit_price: int
    discount_amount: int
    total_amount: int
    position: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProposalResponse(BaseModel):
    id: UUID
    reference: str
    title: str
    customer_name: Optional[str] = None
    status: ProposalStatus
    notes: Optional[str] = None
    subtotal_amount: int
    discount_amount: int
    total_amount: int
    created_by_id: UUID
    created_by_name: Optional[str] = None
    items_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProposalDetailResponse(ProposalResponse):
    items: list[ProposalItemResponse] = Field(default_factory=list)
