from __future__ import annotations
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, field_validator, model_validator


class ClientBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    country: str = "BR"
    client_type: str = "company"       # individual | company
    tax_id: Optional[str] = None
    tax_id_type: Optional[str] = None  # CPF | CNPJ | VAT | EIN | OTHER
    currency: str = "BRL"
    company_name: Optional[str] = None
    website: Optional[str] = None
    notes: Optional[str] = None
    contact_id: Optional[UUID] = None

    @model_validator(mode="after")
    def tax_id_consistency(self) -> "ClientBase":
        if self.tax_id and not self.tax_id_type:
            raise ValueError("tax_id_type é obrigatório quando tax_id é informado")
        return self


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    client_type: Optional[str] = None
    tax_id: Optional[str] = None
    tax_id_type: Optional[str] = None
    currency: Optional[str] = None
    company_name: Optional[str] = None
    website: Optional[str] = None
    notes: Optional[str] = None
    contact_id: Optional[UUID] = None


class ClientResponse(ClientBase):
    id: UUID
    created_by_user_id: UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ClientListResponse(BaseModel):
    id: UUID
    name: str
    email: Optional[str] = None
    company_name: Optional[str] = None
    country: str
    client_type: str
    currency: str
    created_at: datetime
    deleted_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
