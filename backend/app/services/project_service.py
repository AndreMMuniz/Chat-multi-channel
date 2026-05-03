from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.models import Conversation, Message, Project, ProjectSourceType, User
from app.repositories.project_repo import ProjectRepository, ProjectStageRepository
from app.schemas.common import create_error_response
from app.schemas.project import ProjectCreate, ProjectFromMessageCreate, ProjectUpdate


class ProjectService:
    def __init__(self, db: Session):
        self.db = db
        self.projects = ProjectRepository(db)
        self.stages = ProjectStageRepository(db)

    async def ensure_stage_exists(self, stage_key: str) -> None:
        stage = await self.stages.find_by_key(stage_key)
        if not stage or not stage.is_active:
            error_response, status = create_error_response(
                code="INVALID_STAGE",
                message=f"Stage '{stage_key}' is invalid",
                status_code=422,
            )
            raise HTTPException(status_code=status, detail=error_response)

    async def ensure_owner_exists(self, owner_user_id: Optional[UUID]) -> None:
        if not owner_user_id:
            return
        owner = self.db.query(User).filter(User.id == owner_user_id).first()
        if not owner:
            error_response, status = create_error_response(
                code="OWNER_NOT_FOUND",
                message="Owner user not found",
                status_code=404,
            )
            raise HTTPException(status_code=status, detail=error_response)

    async def ensure_project_context_exists(self, project_context_id: Optional[UUID]) -> None:
        if not project_context_id:
            return
        project = await self.projects.find_project(project_context_id)
        if not project:
            error_response, status = create_error_response(
                code="PROJECT_CONTEXT_NOT_FOUND",
                message="Project context not found",
                status_code=404,
            )
            raise HTTPException(status_code=status, detail=error_response)

    async def validate_payload(self, payload: ProjectCreate | ProjectUpdate) -> None:
        if payload.stage:
            await self.ensure_stage_exists(payload.stage)
        if payload.owner_user_id:
            await self.ensure_owner_exists(payload.owner_user_id)
        project_context_id = getattr(payload, "project_context_id", None)
        if project_context_id:
            await self.ensure_project_context_exists(project_context_id)
        if payload.source_type == ProjectSourceType.MESSAGE and not payload.source_message_id:
            error_response, status = create_error_response(
                code="SOURCE_MESSAGE_REQUIRED",
                message="source_message_id is required when source_type is 'message'",
                status_code=422,
            )
            raise HTTPException(status_code=status, detail=error_response)

    async def create_project(self, payload: ProjectCreate, current_user: User) -> Project:
        await self.validate_payload(payload)
        project = await self.projects.create(
            {
                **payload.model_dump(),
                "created_by_user_id": current_user.id,
            }
        )
        return await self.projects.find_project(project.id)

    async def update_project(self, project: Project, payload: ProjectUpdate) -> Project:
        await self.validate_payload(payload)
        updated = await self.projects.update(project.id, payload.model_dump(exclude_unset=True))
        return await self.projects.find_project(updated.id)

    async def move_stage(self, project: Project, stage_key: str) -> Project:
        await self.ensure_stage_exists(stage_key)
        updated = await self.projects.update(project.id, {"stage": stage_key})
        return await self.projects.find_project(updated.id)

    async def create_project_from_message(
        self,
        message_id: UUID,
        payload: ProjectFromMessageCreate,
        current_user: User,
    ) -> Project:
        await self.ensure_stage_exists(payload.stage)
        if payload.owner_user_id:
            await self.ensure_owner_exists(payload.owner_user_id)
        if payload.project_context_id:
            await self.ensure_project_context_exists(payload.project_context_id)

        message = (
            self.db.query(Message)
            .options(
                joinedload(Message.conversation)
                .joinedload(Conversation.contact)
            )
            .filter(Message.id == message_id)
            .first()
        )
        if not message:
            error_response, status = create_error_response(
                code="MESSAGE_NOT_FOUND",
                message="Message not found",
                status_code=404,
            )
            raise HTTPException(status_code=status, detail=error_response)

        conversation = message.conversation
        if not conversation:
            error_response, status = create_error_response(
                code="CONVERSATION_REQUIRED",
                message="Message is not linked to a valid conversation",
                status_code=422,
            )
            raise HTTPException(status_code=status, detail=error_response)

        contact_name = None
        if conversation.contact:
            contact_name = conversation.contact.name or conversation.contact.email or conversation.contact.phone

        title = payload.title or (contact_name and f"{contact_name} demand") or "Message demand"
        description = payload.description or message.content
        project_context_id = payload.project_context_id or conversation.project_context_id

        project = await self.projects.create(
            {
                "title": title,
                "description": description,
                "stage": payload.stage,
                "status": "open",
                "priority": payload.priority,
                "source_type": ProjectSourceType.MESSAGE,
                "source_message_id": message.id,
                "source_conversation_id": conversation.id,
                "project_context_id": project_context_id,
                "contact_name": contact_name,
                "channel": conversation.channel,
                "tag": payload.tag,
                "owner_user_id": payload.owner_user_id,
                "created_by_user_id": current_user.id,
                "due_date": payload.due_date,
                "value": payload.value,
                "progress": payload.progress,
            }
        )
        if payload.attach_conversation_to_project:
            conversation.project_context_id = project_context_id or project.id
            self.db.commit()
        return await self.projects.find_project(project.id)


def serialize_project(project: Project) -> dict:
    return {
        "id": project.id,
        "reference": project.reference_code,
        "title": project.title,
        "description": project.description,
        "stage": project.stage,
        "priority": project.priority,
        "status": project.status,
        "source_type": project.source_type,
        "source_message_id": project.source_message_id,
        "conversation_id": project.source_conversation_id,
        "project_context_id": project.project_context_id,
        "contact_name": project.contact_name,
        "channel": project.channel,
        "tag": project.tag,
        "owner_id": project.owner_user_id,
        "owner_name": project.owner.full_name if project.owner else None,
        "due_date": project.due_date,
        "value": project.value,
        "progress": project.progress,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    }
