"""Base repository with common CRUD operations for synchronous SQLAlchemy Session."""

from typing import TypeVar, Generic, List, Optional, Type, Dict, Any
from sqlalchemy import select, func
from sqlalchemy.orm import Session

T = TypeVar('T')


class BaseRepository(Generic[T]):
    def __init__(self, model: Type[T], session: Session):
        self.model = model
        self.session = session

    async def find_by_id(self, id: str) -> Optional[T]:
        stmt = select(self.model).where(self.model.id == id)
        result = self.session.execute(stmt)
        return result.scalars().first()

    async def find_all(self, skip: int = 0, limit: int = 20) -> List[T]:
        stmt = select(self.model).offset(skip).limit(limit)
        result = self.session.execute(stmt)
        return result.scalars().all()

    async def count(self) -> int:
        stmt = select(func.count(self.model.id))
        result = self.session.execute(stmt)
        return result.scalar() or 0

    async def create(self, data: Dict[str, Any]) -> T:
        obj = self.model(**data)
        self.session.add(obj)
        self.session.commit()
        self.session.refresh(obj)
        return obj

    async def update(self, id: str, data: Dict[str, Any]) -> Optional[T]:
        obj = await self.find_by_id(id)
        if not obj:
            return None
        for key, value in data.items():
            if hasattr(obj, key):
                setattr(obj, key, value)
        self.session.commit()
        self.session.refresh(obj)
        return obj

    async def delete(self, id: str) -> bool:
        obj = await self.find_by_id(id)
        if not obj:
            return False
        self.session.delete(obj)
        self.session.commit()
        return True

    async def exists(self, id: str) -> bool:
        stmt = select(func.count(self.model.id)).where(self.model.id == id)
        result = self.session.execute(stmt)
        return (result.scalar() or 0) > 0
