from typing import List, Optional
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.models import CatalogItem
from app.repositories.base_repo import BaseRepository


class CatalogItemRepository(BaseRepository[CatalogItem]):
    def __init__(self, session: Session):
        super().__init__(CatalogItem, session)

    async def list_with_filters(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        type: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        can_be_quoted: Optional[bool] = None,
        active_for_support: Optional[bool] = None,
    ) -> List[CatalogItem]:
        stmt = (
            select(CatalogItem)
            .options(
                joinedload(CatalogItem.created_by),
                joinedload(CatalogItem.updated_by),
                joinedload(CatalogItem.replaced_by_catalog_item),
            )
            .order_by(CatalogItem.updated_at.desc())
        )

        if search:
            pattern = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    CatalogItem.name.ilike(pattern),
                    CatalogItem.commercial_name.ilike(pattern),
                    CatalogItem.category.ilike(pattern),
                    CatalogItem.sku.ilike(pattern),
                    CatalogItem.commercial_description.ilike(pattern),
                    CatalogItem.reference_code.ilike(pattern),
                )
            )
        if type:
            stmt = stmt.where(CatalogItem.type == type)
        if category:
            stmt = stmt.where(CatalogItem.category == category)
        if status:
            stmt = stmt.where(CatalogItem.status == status)
        if can_be_quoted is not None:
            stmt = stmt.where(CatalogItem.can_be_quoted.is_(can_be_quoted))
        if active_for_support is not None:
            stmt = stmt.where(CatalogItem.active_for_support.is_(active_for_support))

        result = self.session.execute(stmt.offset(skip).limit(limit))
        return result.scalars().all()

    async def count_with_filters(
        self,
        *,
        search: Optional[str] = None,
        type: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        can_be_quoted: Optional[bool] = None,
        active_for_support: Optional[bool] = None,
    ) -> int:
        stmt = select(CatalogItem)

        if search:
            pattern = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    CatalogItem.name.ilike(pattern),
                    CatalogItem.commercial_name.ilike(pattern),
                    CatalogItem.category.ilike(pattern),
                    CatalogItem.sku.ilike(pattern),
                    CatalogItem.commercial_description.ilike(pattern),
                    CatalogItem.reference_code.ilike(pattern),
                )
            )
        if type:
            stmt = stmt.where(CatalogItem.type == type)
        if category:
            stmt = stmt.where(CatalogItem.category == category)
        if status:
            stmt = stmt.where(CatalogItem.status == status)
        if can_be_quoted is not None:
            stmt = stmt.where(CatalogItem.can_be_quoted.is_(can_be_quoted))
        if active_for_support is not None:
            stmt = stmt.where(CatalogItem.active_for_support.is_(active_for_support))

        result = self.session.execute(stmt)
        return len(result.scalars().all())

    async def find_catalog_item(self, item_id: UUID | str) -> Optional[CatalogItem]:
        stmt = (
            select(CatalogItem)
            .options(
                joinedload(CatalogItem.created_by),
                joinedload(CatalogItem.updated_by),
                joinedload(CatalogItem.replaced_by_catalog_item),
            )
            .where(CatalogItem.id == item_id)
        )
        result = self.session.execute(stmt)
        return result.scalars().first()
