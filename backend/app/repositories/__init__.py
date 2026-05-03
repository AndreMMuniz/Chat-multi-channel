"""Repository factory and dependency injection for FastAPI."""

from sqlalchemy.orm import Session
from app.repositories.user_repo import UserRepository
from app.repositories.conversation_repo import ConversationRepository
from app.repositories.message_repo import MessageRepository
from app.repositories.project_repo import ProjectRepository, ProjectStageRepository
from app.core.database import get_db
from fastapi import Depends


class RepositoryFactory:
    """
    Factory to create all repositories with a single session.

    Usage in endpoints:
        @router.get("/users/{user_id}")
        async def get_user(user_id: str, repos: RepositoryFactory = Depends(get_repositories)):
            user = await repos.users.find_by_id(user_id)
            return user
    """

    def __init__(self, session: Session):
        self.session = session
        self._user_repo: UserRepository | None = None
        self._conversation_repo: ConversationRepository | None = None
        self._message_repo: MessageRepository | None = None
        self._project_repo: ProjectRepository | None = None
        self._project_stage_repo: ProjectStageRepository | None = None

    @property
    def users(self) -> UserRepository:
        """Get user repository."""
        if self._user_repo is None:
            self._user_repo = UserRepository(self.session)
        return self._user_repo

    @property
    def conversations(self) -> ConversationRepository:
        """Get conversation repository."""
        if self._conversation_repo is None:
            self._conversation_repo = ConversationRepository(self.session)
        return self._conversation_repo

    @property
    def messages(self) -> MessageRepository:
        """Get message repository."""
        if self._message_repo is None:
            self._message_repo = MessageRepository(self.session)
        return self._message_repo

    @property
    def projects(self) -> ProjectRepository:
        if self._project_repo is None:
            self._project_repo = ProjectRepository(self.session)
        return self._project_repo

    @property
    def project_stages(self) -> ProjectStageRepository:
        if self._project_stage_repo is None:
            self._project_stage_repo = ProjectStageRepository(self.session)
        return self._project_stage_repo


async def get_repositories(session: Session = Depends(get_db)) -> RepositoryFactory:
    """
    Dependency for getting repository factory.

    Usage:
        repos = Depends(get_repositories)
    """
    return RepositoryFactory(session)


__all__ = [
    "RepositoryFactory",
    "get_repositories",
    "UserRepository",
    "ConversationRepository",
    "MessageRepository",
    "ProjectRepository",
    "ProjectStageRepository",
]
