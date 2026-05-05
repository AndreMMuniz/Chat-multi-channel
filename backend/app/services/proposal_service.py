from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.models import CatalogItem, CatalogItemStatus, Proposal, ProposalItem, ProposalStatus, User
from app.repositories.catalog_repo import CatalogItemRepository
from app.repositories.proposal_repo import ProposalItemRepository, ProposalRepository
from app.schemas.common import create_error_response
from app.schemas.proposal import (
    ProposalCreate,
    ProposalFromCatalogCreate,
    ProposalItemFromCatalogCreate,
    ProposalItemUpdate,
    ProposalUpdate,
)


class ProposalService:
    def __init__(self, db: Session):
        self.db = db
        self.proposals = ProposalRepository(db)
        self.items = ProposalItemRepository(db)
        self.catalog = CatalogItemRepository(db)

    async def ensure_catalog_item_quotable(self, item: Optional[CatalogItem]) -> CatalogItem:
        if not item:
            error_response, status = create_error_response(
                code="CATALOG_ITEM_NOT_FOUND",
                message="Catalog item not found",
                status_code=404,
            )
            raise HTTPException(status_code=status, detail=error_response)
        if item.status != CatalogItemStatus.ACTIVE or not item.can_be_quoted:
            error_response, status = create_error_response(
                code="CATALOG_ITEM_NOT_QUOTABLE",
                message="Catalog item is not ready for proposal use",
                status_code=422,
            )
            raise HTTPException(status_code=status, detail=error_response)
        return item

    async def create_proposal(self, payload: ProposalCreate, current_user: User) -> Proposal:
        proposal = await self.proposals.create(
            {
                **payload.model_dump(),
                "created_by_user_id": current_user.id,
            }
        )
        return await self.proposals.find_proposal(proposal.id)

    async def update_proposal(self, proposal: Proposal, payload: ProposalUpdate) -> Proposal:
        updated = await self.proposals.update(proposal.id, payload.model_dump(exclude_unset=True))
        return await self.proposals.find_proposal(updated.id)

    async def create_proposal_from_catalog(
        self,
        catalog_item_id: UUID,
        payload: ProposalFromCatalogCreate,
        current_user: User,
    ) -> Proposal:
        item = await self.ensure_catalog_item_quotable(await self.catalog.find_catalog_item(catalog_item_id))
        proposal = await self.proposals.create(
            {
                "title": payload.title or f"Proposal for {item.commercial_name}",
                "customer_name": payload.customer_name,
                "notes": payload.notes,
                "status": ProposalStatus.DRAFT,
                "created_by_user_id": current_user.id,
            }
        )
        await self.add_catalog_item_to_proposal(
            proposal_id=proposal.id,
            catalog_item_id=catalog_item_id,
            payload=ProposalItemFromCatalogCreate(quantity=payload.quantity),
        )
        return await self.proposals.find_proposal(proposal.id)

    async def add_catalog_item_to_proposal(
        self,
        *,
        proposal_id: UUID,
        catalog_item_id: UUID,
        payload: ProposalItemFromCatalogCreate,
    ) -> ProposalItem:
        proposal = await self.proposals.find_proposal(proposal_id)
        if not proposal:
            error_response, status = create_error_response(
                code="PROPOSAL_NOT_FOUND",
                message="Proposal not found",
                status_code=404,
            )
            raise HTTPException(status_code=status, detail=error_response)

        item = await self.ensure_catalog_item_quotable(await self.catalog.find_catalog_item(catalog_item_id))
        existing_items = await self.items.list_for_proposal(proposal.id)
        position = len(existing_items) + 1
        unit_price = item.base_price
        total_amount = max((payload.quantity * unit_price) - payload.discount_amount, 0)

        proposal_item = await self.items.create(
            {
                "proposal_id": proposal.id,
                "catalog_item_id": item.id,
                "catalog_reference_code": item.reference_code,
                "name_snapshot": item.name,
                "commercial_name_snapshot": item.commercial_name,
                "type_snapshot": item.type.value if hasattr(item.type, "value") else str(item.type),
                "sku_snapshot": item.sku,
                "category_snapshot": item.category,
                "commercial_description_snapshot": item.commercial_description,
                "base_price_snapshot": item.base_price,
                "unit_snapshot": item.unit,
                "sla_or_delivery_time_snapshot": item.sla_or_delivery_time,
                "allows_discount_snapshot": item.allows_discount,
                "quantity": payload.quantity,
                "unit_price": unit_price,
                "discount_amount": payload.discount_amount,
                "total_amount": total_amount,
                "position": position,
            }
        )
        await self.recalculate_totals(proposal.id)
        return proposal_item

    async def update_proposal_item(
        self,
        *,
        proposal_id: UUID,
        proposal_item_id: UUID,
        payload: ProposalItemUpdate,
    ) -> ProposalItem:
        proposal_item = await self.items.find_proposal_item(proposal_id, proposal_item_id)
        if not proposal_item:
            error_response, status = create_error_response(
                code="PROPOSAL_ITEM_NOT_FOUND",
                message="Proposal item not found",
                status_code=404,
            )
            raise HTTPException(status_code=status, detail=error_response)

        data = payload.model_dump(exclude_unset=True)
        quantity = data.get("quantity", proposal_item.quantity)
        discount_amount = data.get("discount_amount", proposal_item.discount_amount)
        total_amount = max((quantity * proposal_item.unit_price) - discount_amount, 0)

        updated = await self.items.update(
            proposal_item.id,
            {
                **data,
                "total_amount": total_amount,
            },
        )
        await self.recalculate_totals(proposal_id)
        refreshed = await self.items.find_proposal_item(proposal_id, updated.id)
        return refreshed

    async def recalculate_totals(self, proposal_id: UUID) -> None:
        proposal = await self.proposals.find_proposal(proposal_id)
        if not proposal:
            return
        items = await self.items.list_for_proposal(proposal_id)
        subtotal = sum(item.quantity * item.unit_price for item in items)
        discount = sum(item.discount_amount for item in items)
        total = sum(item.total_amount for item in items)
        await self.proposals.update(
            proposal_id,
            {
                "subtotal_amount": subtotal,
                "discount_amount": discount,
                "total_amount": total,
            },
        )


def serialize_proposal_item(item: ProposalItem) -> dict:
    return {
        "id": item.id,
        "proposal_id": item.proposal_id,
        "catalog_item_id": item.catalog_item_id,
        "catalog_reference_code": item.catalog_reference_code,
        "name_snapshot": item.name_snapshot,
        "commercial_name_snapshot": item.commercial_name_snapshot,
        "type_snapshot": item.type_snapshot,
        "sku_snapshot": item.sku_snapshot,
        "category_snapshot": item.category_snapshot,
        "commercial_description_snapshot": item.commercial_description_snapshot,
        "base_price_snapshot": item.base_price_snapshot,
        "unit_snapshot": item.unit_snapshot,
        "sla_or_delivery_time_snapshot": item.sla_or_delivery_time_snapshot,
        "allows_discount_snapshot": item.allows_discount_snapshot,
        "quantity": item.quantity,
        "unit_price": item.unit_price,
        "discount_amount": item.discount_amount,
        "total_amount": item.total_amount,
        "position": item.position,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
    }


def serialize_proposal(proposal: Proposal, include_items: bool = False) -> dict:
    data = {
        "id": proposal.id,
        "reference": proposal.reference_code,
        "title": proposal.title,
        "customer_name": proposal.customer_name,
        "status": proposal.status,
        "notes": proposal.notes,
        "subtotal_amount": proposal.subtotal_amount,
        "discount_amount": proposal.discount_amount,
        "total_amount": proposal.total_amount,
        "created_by_id": proposal.created_by_user_id,
        "created_by_name": proposal.created_by.full_name if proposal.created_by else None,
        "items_count": len(proposal.items or []),
        "created_at": proposal.created_at,
        "updated_at": proposal.updated_at,
    }
    if include_items:
        data["items"] = [serialize_proposal_item(item) for item in proposal.items]
    return data
