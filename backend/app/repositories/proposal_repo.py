from typing import List, Optional
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.models import Proposal, ProposalItem, ProposalServiceDetails
from app.repositories.base_repo import BaseRepository


class ProposalRepository(BaseRepository[Proposal]):
    def __init__(self, session: Session):
        super().__init__(Proposal, session)

    async def list_with_filters(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[Proposal]:
        stmt = (
            select(Proposal)
            .options(
                joinedload(Proposal.created_by),
                joinedload(Proposal.items),
                joinedload(Proposal.service_details),
            )
            .order_by(Proposal.updated_at.desc())
        )

        if search:
            pattern = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    Proposal.title.ilike(pattern),
                    Proposal.customer_name.ilike(pattern),
                    Proposal.reference_code.ilike(pattern),
                )
            )
        if status:
            stmt = stmt.where(Proposal.status == status)

        result = self.session.execute(stmt.offset(skip).limit(limit))
        return result.unique().scalars().all()

    async def count_with_filters(self, *, search: Optional[str] = None, status: Optional[str] = None) -> int:
        stmt = select(Proposal)
        if search:
            pattern = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    Proposal.title.ilike(pattern),
                    Proposal.customer_name.ilike(pattern),
                    Proposal.reference_code.ilike(pattern),
                )
            )
        if status:
            stmt = stmt.where(Proposal.status == status)

        result = self.session.execute(stmt)
        return len(result.scalars().all())

    async def find_proposal(self, proposal_id: UUID | str) -> Optional[Proposal]:
        stmt = (
            select(Proposal)
            .options(
                joinedload(Proposal.created_by),
                joinedload(Proposal.items),
                joinedload(Proposal.service_details),
            )
            .where(Proposal.id == proposal_id)
        )
        result = self.session.execute(stmt)
        return result.unique().scalars().first()


class ProposalItemRepository(BaseRepository[ProposalItem]):
    def __init__(self, session: Session):
        super().__init__(ProposalItem, session)

    async def list_for_proposal(self, proposal_id: UUID | str) -> List[ProposalItem]:
        stmt = (
            select(ProposalItem)
            .options(joinedload(ProposalItem.catalog_item))
            .where(ProposalItem.proposal_id == proposal_id)
            .order_by(ProposalItem.position.asc(), ProposalItem.created_at.asc())
        )
        result = self.session.execute(stmt)
        return result.scalars().all()

    async def find_proposal_item(self, proposal_id: UUID | str, proposal_item_id: UUID | str) -> Optional[ProposalItem]:
        stmt = (
            select(ProposalItem)
            .options(joinedload(ProposalItem.catalog_item), joinedload(ProposalItem.proposal))
            .where(ProposalItem.proposal_id == proposal_id, ProposalItem.id == proposal_item_id)
        )
        result = self.session.execute(stmt)
        return result.scalars().first()
