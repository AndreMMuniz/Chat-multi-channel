from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.models import ProposalStatus, ProposalType
from app.schemas.client import ClientListResponse


# --- Service Details ---

class ProposalServiceDetailsCreate(BaseModel):
    service_name: str = Field(..., min_length=1, max_length=255)
    scope_of_work: Optional[str] = None
    methodology: Optional[str] = None
    hourly_rate: Optional[Decimal] = Field(default=None, ge=0)
    estimated_hours: Optional[int] = Field(default=None, ge=0)
    client_responsibilities: list[str] = Field(default_factory=list)
    delivery_responsibilities: list[str] = Field(default_factory=list)
    revision_rounds: Optional[int] = Field(default=None, ge=0)
    support_period_days: Optional[int] = Field(default=None, ge=0)


class ProposalServiceDetailsUpdate(BaseModel):
    service_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    scope_of_work: Optional[str] = None
    methodology: Optional[str] = None
    hourly_rate: Optional[Decimal] = Field(default=None, ge=0)
    estimated_hours: Optional[int] = Field(default=None, ge=0)
    client_responsibilities: Optional[list[str]] = None
    delivery_responsibilities: Optional[list[str]] = None
    revision_rounds: Optional[int] = Field(default=None, ge=0)
    support_period_days: Optional[int] = Field(default=None, ge=0)


class ProposalServiceDetailsResponse(BaseModel):
    id: UUID
    proposal_id: UUID
    service_name: str
    scope_of_work: Optional[str] = None
    methodology: Optional[str] = None
    hourly_rate: Optional[Decimal] = None
    estimated_hours: Optional[int] = None
    client_responsibilities: list[str] = []
    delivery_responsibilities: list[str] = []
    revision_rounds: Optional[int] = None
    support_period_days: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Status History ---

class ProposalStatusHistoryResponse(BaseModel):
    id: UUID
    proposal_id: UUID
    from_status: Optional[str] = None
    to_status: str
    changed_by_user_id: UUID
    reason: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProposalStatusTransition(BaseModel):
    status: ProposalStatus
    reason: Optional[str] = None


# --- Proposal Create / Update ---

class ProposalCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    customer_name: Optional[str] = Field(default=None, max_length=255)
    notes: Optional[str] = None
    status: ProposalStatus = ProposalStatus.DRAFT
    # campos do módulo comercial
    client_id: Optional[UUID] = None
    owner_user_id: Optional[UUID] = None
    proposal_type: Optional[ProposalType] = None
    currency: str = Field(default="BRL", max_length=3)
    payment_method: Optional[str] = Field(default=None, max_length=100)
    payment_terms: Optional[str] = None
    payment_installments: Optional[int] = Field(default=None, ge=1)
    delivery_deadline: Optional[date] = None
    delivery_days: Optional[int] = Field(default=None, ge=1)
    valid_until: Optional[date] = None
    service_details: Optional[ProposalServiceDetailsCreate] = None

    @model_validator(mode="after")
    def deadline_exclusive(self) -> "ProposalCreate":
        if self.delivery_deadline and self.delivery_days:
            raise ValueError("Informe apenas delivery_deadline OU delivery_days, não os dois")
        return self


class ProposalUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    customer_name: Optional[str] = Field(default=None, max_length=255)
    notes: Optional[str] = None
    status: Optional[ProposalStatus] = None
    client_id: Optional[UUID] = None
    owner_user_id: Optional[UUID] = None
    proposal_type: Optional[ProposalType] = None
    currency: Optional[str] = Field(default=None, max_length=3)
    payment_method: Optional[str] = Field(default=None, max_length=100)
    payment_terms: Optional[str] = None
    payment_installments: Optional[int] = Field(default=None, ge=1)
    delivery_deadline: Optional[date] = None
    delivery_days: Optional[int] = Field(default=None, ge=1)
    valid_until: Optional[date] = None
    service_details: Optional[ProposalServiceDetailsUpdate] = None

    @model_validator(mode="after")
    def deadline_exclusive(self) -> "ProposalUpdate":
        if self.delivery_deadline and self.delivery_days:
            raise ValueError("Informe apenas delivery_deadline OU delivery_days, não os dois")
        return self


class ProposalFromCatalogCreate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    customer_name: Optional[str] = Field(default=None, max_length=255)
    notes: Optional[str] = None
    quantity: int = Field(default=1, ge=1)


class ProposalItemFromCatalogCreate(BaseModel):
    quantity: int = Field(default=1, ge=1)
    discount_amount: int = Field(default=0, ge=0)


class ProposalItemUpdate(BaseModel):
    quantity: Optional[int] = Field(default=None, ge=1)
    discount_amount: Optional[int] = Field(default=None, ge=0)


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
    # campos do módulo comercial
    client_id: Optional[UUID] = None
    owner_user_id: Optional[UUID] = None
    proposal_type: Optional[ProposalType] = None
    currency: str = "BRL"
    payment_method: Optional[str] = None
    payment_terms: Optional[str] = None
    payment_installments: Optional[int] = None
    delivery_deadline: Optional[date] = None
    delivery_days: Optional[int] = None
    valid_until: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProposalDetailResponse(ProposalResponse):
    items: list[ProposalItemResponse] = Field(default_factory=list)
    service_details: Optional[ProposalServiceDetailsResponse] = None
    status_history: list[ProposalStatusHistoryResponse] = Field(default_factory=list)
    client: Optional[ClientListResponse] = None
