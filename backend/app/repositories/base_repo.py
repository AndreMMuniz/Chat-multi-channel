"""Base repository class with common CRUD operations."""

from typing import TypeVar, Generic, List, Optional, Type, Dict, Any
from sqlalchemy import select, func
from sqlalchemy.orm import Session

T = TypeVar('T')


class BaseRepository(Generic[T]):
    """
    Generic repository for common database operations.

    Usage:
        repo = BaseRepository(model=User, session=db)
        user = repo.find_by_id(user_id)
    """

    def __init__(self, model: Type[T], session: Session):
        self.model = model
        self.session = session

    async def find_by_id(self, id: str) -> Optional[T]:
        """Find single record by ID."""
        stmt = select(self.model).where(self.model.id == id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def find_all(self, skip: int = 0, limit: int = 20) -> List[T]:
        """Find all records with pagination."""
        stmt = select(self.model).offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def count(self) -> int:
        """Count total records."""
        stmt = select(func.count(self.model.id))
        result = await self.session.execute(stmt)
        return result.scalar() or 0

    async def create(self, data: Dict[str, Any]) -> T:
        """Create new record."""
        obj = self.model(**data)
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def update(self, id: str, data: Dict[str, Any]) -> Optional[T]:
        """Update existing record."""
        obj = await self.find_by_id(id)
        if not obj:
            return None

        for key, value in data.items():
            if hasattr(obj, key):
                setattr(obj, key, value)

        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def delete(self, id: str) -> bool:
        """Delete record by ID."""
        obj = await self.find_by_id(id)
        if not obj:
            return False

        await self.session.delete(obj)
        await self.session.commit()
        return True

    async def exists(self, id: str) -> bool:
        """Check if record exists."""
        stmt = select(func.count(self.model.id)).where(self.model.id == id)
        result = await self.session.execute(stmt)
        return (result.scalar() or 0) > 0
