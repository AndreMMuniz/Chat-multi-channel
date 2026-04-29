"""User repository with user-specific database operations."""

from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.models import User
from app.repositories.base_repo import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository for User model with specialized queries."""

    def __init__(self, session: Session):
        super().__init__(User, session)

    async def find_by_email(self, email: str) -> Optional[User]:
        """Find user by email address."""
        stmt = select(User).where(User.email == email)
        result = self.session.execute(stmt)
        return result.scalars().first()

    async def find_by_auth_id(self, auth_id: str) -> Optional[User]:
        """Find user by Supabase auth_id."""
        stmt = select(User).where(User.auth_id == auth_id)
        result = self.session.execute(stmt)
        return result.scalars().first()

    async def find_approved_users(self, skip: int = 0, limit: int = 20) -> List[User]:
        """Find approved and active users."""
        stmt = (
            select(User)
            .where(User.is_approved == True)
            .where(User.is_active == True)
            .offset(skip)
            .limit(limit)
        )
        result = self.session.execute(stmt)
        return result.scalars().all()

    async def find_pending_approval(self, skip: int = 0, limit: int = 20) -> List[User]:
        """Find users pending approval."""
        stmt = (
            select(User)
            .where(User.is_approved == False)
            .offset(skip)
            .limit(limit)
        )
        result = self.session.execute(stmt)
        return result.scalars().all()

    async def find_by_role(self, role_id: str, skip: int = 0, limit: int = 20) -> List[User]:
        """Find users with specific role."""
        stmt = (
            select(User)
            .where(User.user_type_id == role_id)
            .offset(skip)
            .limit(limit)
        )
        result = self.session.execute(stmt)
        return result.scalars().all()

    async def approve_user(self, user_id: str) -> Optional[User]:
        """Approve a user."""
        return await self.update(user_id, {"is_approved": True})

    async def deactivate_user(self, user_id: str) -> Optional[User]:
        """Deactivate a user."""
        return await self.update(user_id, {"is_active": False})

    async def activate_user(self, user_id: str) -> Optional[User]:
        """Activate a user."""
        return await self.update(user_id, {"is_active": True})
