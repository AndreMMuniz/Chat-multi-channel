from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from app.models.models import ChannelType, ConversationStatus, ConversationTag, MessageType

# --- Contacts ---
class ContactBase(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    channel_identifier: Optional[str] = None

class ContactResponse(ContactBase):
    id: UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Messages ---
class MessageBase(BaseModel):
    content: str
    inbound: bool
    message_type: MessageType
    image: Optional[str] = None
    file: Optional[str] = None

class MessageCreate(MessageBase):
    conversation_id: UUID
    owner_id: Optional[UUID] = None

class MessageResponse(MessageBase):
    id: UUID
    conversation_id: UUID
    owner_id: Optional[UUID] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Conversations ---
class ConversationBase(BaseModel):
    channel: ChannelType
    status: ConversationStatus
    tag: Optional[ConversationTag] = None
    is_unread: bool = False

class ConversationCreate(ConversationBase):
    contact_id: UUID
    thread_id: Optional[str] = None

class ConversationUpdate(BaseModel):
    status: Optional[ConversationStatus] = None
    tag: Optional[ConversationTag] = None
    is_unread: Optional[bool] = None

class ConversationResponse(ConversationBase):
    id: UUID
    contact_id: UUID
    thread_id: Optional[str] = None
    last_message: Optional[str] = None
    last_message_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    contact: Optional[ContactResponse] = None
    model_config = ConfigDict(from_attributes=True)

class ConversationWithMessagesResponse(ConversationResponse):
    messages: List[MessageResponse] = []
