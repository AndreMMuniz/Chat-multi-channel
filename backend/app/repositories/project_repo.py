from typing import List, Optional

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.models import Project, ProjectStage
from app.repositories.base_repo import BaseRepository


class ProjectRepository(BaseRepository[Project]):
    def __init__(self, session: Session):
        super().__init__(Project, session)

    async def find_all_with_filters(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        search: Optional[str] = None,
        stage: Optional[str] = None,
        owner_user_id: Optional[str] = None,
        priority: Optional[str] = None,
        channel: Optional[str] = None,
        source_type: Optional[str] = None,
    ) -> List[Project]:
        stmt = (
            select(Project)
            .options(joinedload(Project.owner), joinedload(Project.source_conversation))
            .order_by(Project.created_at.desc())
        )

        if search:
            pattern = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    Project.title.ilike(pattern),
                    Project.description.ilike(pattern),
                    Project.contact_name.ilike(pattern),
                    Project.reference_code.ilike(pattern),
                )
            )
        if stage:
            stmt = stmt.where(Project.stage == stage)
        if owner_user_id:
            stmt = stmt.where(Project.owner_user_id == owner_user_id)
        if priority:
            stmt = stmt.where(Project.priority == priority)
        if channel:
            stmt = stmt.where(Project.channel == channel)
        if source_type:
            stmt = stmt.where(Project.source_type == source_type)

        stmt = stmt.offset(skip).limit(limit)
        result = self.session.execute(stmt)
        return result.scalars().all()

    async def count_with_filters(
        self,
        *,
        search: Optional[str] = None,
        stage: Optional[str] = None,
        owner_user_id: Optional[str] = None,
        priority: Optional[str] = None,
        channel: Optional[str] = None,
        source_type: Optional[str] = None,
    ) -> int:
        stmt = select(Project)

        if search:
            pattern = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    Project.title.ilike(pattern),
                    Project.description.ilike(pattern),
                    Project.contact_name.ilike(pattern),
                    Project.reference_code.ilike(pattern),
                )
            )
        if stage:
            stmt = stmt.where(Project.stage == stage)
        if owner_user_id:
            stmt = stmt.where(Project.owner_user_id == owner_user_id)
        if priority:
            stmt = stmt.where(Project.priority == priority)
        if channel:
            stmt = stmt.where(Project.channel == channel)
        if source_type:
            stmt = stmt.where(Project.source_type == source_type)

        result = self.session.execute(stmt)
        return len(result.scalars().all())

    async def find_project(self, project_id: str) -> Optional[Project]:
        stmt = (
            select(Project)
            .options(joinedload(Project.owner), joinedload(Project.source_conversation))
            .where(Project.id == project_id)
        )
        result = self.session.execute(stmt)
        return result.scalars().first()


class ProjectStageRepository(BaseRepository[ProjectStage]):
    def __init__(self, session: Session):
        super().__init__(ProjectStage, session)

    async def find_by_key(self, key: str) -> Optional[ProjectStage]:
        stmt = select(ProjectStage).where(ProjectStage.key == key)
        result = self.session.execute(stmt)
        return result.scalars().first()

    async def find_active_stages(self) -> List[ProjectStage]:
        stmt = (
            select(ProjectStage)
            .where(ProjectStage.is_active.is_(True))
            .order_by(ProjectStage.position.asc())
        )
        result = self.session.execute(stmt)
        return result.scalars().all()
