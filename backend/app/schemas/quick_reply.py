from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


class QuickReplyCreate(BaseModel):
    shortcut: str = Field(..., min_length=2, max_length=50, description="Shortcut starting with /")
    content: str = Field(..., min_length=1, max_length=2000)


class QuickReplyUpdate(BaseModel):
    shortcut: Optional[str] = Field(None, min_length=2, max_length=50)
    content: Optional[str] = Field(None, min_length=1, max_length=2000)


class QuickReplyResponse(BaseModel):
    id: UUID
    shortcut: str
    content: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
