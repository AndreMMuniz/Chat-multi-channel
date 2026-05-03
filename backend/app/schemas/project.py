from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.models import (
    ChannelType,
    ProjectPriority,
    ProjectSourceType,
    ProjectStatus,
    ProjectTaskStatus,
)


class ProjectBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    stage: str = Field(..., min_length=1, max_length=50)
    status: ProjectStatus = ProjectStatus.OPEN
    priority: ProjectPriority = ProjectPriority.MEDIUM
    source_type: ProjectSourceType = ProjectSourceType.MANUAL
    source_message_id: Optional[UUID] = None
    source_conversation_id: Optional[UUID] = None
    project_context_id: Optional[UUID] = None
    contact_name: Optional[str] = None
    channel: Optional[ChannelType] = None
    tag: Optional[str] = None
    owner_user_id: Optional[UUID] = None
    due_date: Optional[datetime] = None
    value: Optional[int] = None
    progress: int = 0

    @field_validator("progress")
    @classmethod
    def validate_progress(cls, value: int) -> int:
        if value < 0 or value > 100:
            raise ValueError("Progress must be between 0 and 100")
        return value


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    stage: Optional[str] = Field(default=None, min_length=1, max_length=50)
    status: Optional[ProjectStatus] = None
    priority: Optional[ProjectPriority] = None
    source_type: Optional[ProjectSourceType] = None
    source_message_id: Optional[UUID] = None
    source_conversation_id: Optional[UUID] = None
    project_context_id: Optional[UUID] = None
    contact_name: Optional[str] = None
    channel: Optional[ChannelType] = None
    tag: Optional[str] = None
    owner_user_id: Optional[UUID] = None
    due_date: Optional[datetime] = None
    value: Optional[int] = None
    progress: Optional[int] = None

    @field_validator("progress")
    @classmethod
    def validate_progress(cls, value: Optional[int]) -> Optional[int]:
        if value is None:
            return value
        if value < 0 or value > 100:
            raise ValueError("Progress must be between 0 and 100")
        return value


class ProjectStageUpdate(BaseModel):
    stage: str = Field(..., min_length=1, max_length=50)


class ProjectFromMessageCreate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    stage: str = Field(default="lead", min_length=1, max_length=50)
    priority: ProjectPriority = ProjectPriority.MEDIUM
    owner_user_id: Optional[UUID] = None
    project_context_id: Optional[UUID] = None
    attach_conversation_to_project: bool = False
    due_date: Optional[datetime] = None
    value: Optional[int] = None
    progress: int = 0
    tag: Optional[str] = None

    @field_validator("progress")
    @classmethod
    def validate_progress(cls, value: int) -> int:
        if value < 0 or value > 100:
            raise ValueError("Progress must be between 0 and 100")
        return value


class ProjectStageResponse(BaseModel):
    key: str
    label: str
    position: int
    is_active: bool
    model_config = ConfigDict(from_attributes=True)


class ProjectResponse(BaseModel):
    id: UUID
    reference: str
    title: str
    description: Optional[str] = None
    stage: str
    priority: ProjectPriority
    status: ProjectStatus
    source_type: ProjectSourceType
    source_message_id: Optional[UUID] = None
    conversation_id: Optional[UUID] = None
    project_context_id: Optional[UUID] = None
    contact_name: Optional[str] = None
    channel: Optional[ChannelType] = None
    tag: Optional[str] = None
    owner_id: Optional[UUID] = None
    owner_name: Optional[str] = None
    due_date: Optional[datetime] = None
    value: Optional[int] = None
    progress: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProjectTaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: ProjectTaskStatus = ProjectTaskStatus.OPEN
    priority: ProjectPriority = ProjectPriority.MEDIUM
    owner_user_id: Optional[UUID] = None
    source_message_id: Optional[UUID] = None
    source_conversation_id: Optional[UUID] = None
    due_date: Optional[datetime] = None


class ProjectTaskCreate(ProjectTaskBase):
    pass


class ProjectTaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[ProjectTaskStatus] = None
    priority: Optional[ProjectPriority] = None
    owner_user_id: Optional[UUID] = None
    source_message_id: Optional[UUID] = None
    source_conversation_id: Optional[UUID] = None
    due_date: Optional[datetime] = None


class ProjectTaskFromMessageCreate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    priority: ProjectPriority = ProjectPriority.MEDIUM
    status: ProjectTaskStatus = ProjectTaskStatus.OPEN
    owner_user_id: Optional[UUID] = None
    project_context_id: Optional[UUID] = None
    attach_conversation_to_project: bool = False
    create_project_context: bool = False
    new_project_title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    due_date: Optional[datetime] = None


class ProjectTaskResponse(BaseModel):
    id: UUID
    project_id: UUID
    title: str
    description: Optional[str] = None
    status: ProjectTaskStatus
    priority: ProjectPriority
    owner_id: Optional[UUID] = None
    owner_name: Optional[str] = None
    source_message_id: Optional[UUID] = None
    source_conversation_id: Optional[UUID] = None
    due_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
