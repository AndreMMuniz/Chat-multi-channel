from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from app.models.models import DefaultRole


# --- UserType Schemas ---

class UserTypeBase(BaseModel):
    name: str
    base_role: DefaultRole = DefaultRole.USER
    can_view_all_conversations: bool = False
    can_delete_conversations: bool = False
    can_edit_messages: bool = False
    can_delete_messages: bool = False
    can_manage_users: bool = False
    can_assign_roles: bool = False
    can_disable_users: bool = False
    can_change_user_password: bool = False
    can_change_settings: bool = False
    can_change_branding: bool = False
    can_change_ai_model: bool = False
    can_view_audit_logs: bool = False
    can_create_user_types: bool = False

class UserTypeCreate(UserTypeBase):
    pass

class UserTypeUpdate(BaseModel):
    name: Optional[str] = None
    can_view_all_conversations: Optional[bool] = None
    can_delete_conversations: Optional[bool] = None
    can_edit_messages: Optional[bool] = None
    can_delete_messages: Optional[bool] = None
    can_manage_users: Optional[bool] = None
    can_assign_roles: Optional[bool] = None
    can_disable_users: Optional[bool] = None
    can_change_user_password: Optional[bool] = None
    can_change_settings: Optional[bool] = None
    can_change_branding: Optional[bool] = None
    can_change_ai_model: Optional[bool] = None
    can_view_audit_logs: Optional[bool] = None
    can_create_user_types: Optional[bool] = None

class UserTypeResponse(UserTypeBase):
    id: UUID
    is_system: bool
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


# --- User Schemas ---

class UserBase(BaseModel):
    email: str
    full_name: str
    avatar: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    user_type_id: UUID

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar: Optional[str] = None
    user_type_id: Optional[UUID] = None
    is_active: Optional[bool] = None

class UserPasswordChange(BaseModel):
    new_password: str = Field(..., min_length=8)

class UserResponse(UserBase):
    id: UUID
    auth_id: str
    user_type_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    user_type: Optional[UserTypeResponse] = None
    model_config = ConfigDict(from_attributes=True)


# --- AuditLog Schemas ---

class AuditLogResponse(BaseModel):
    id: UUID
    user_id: UUID
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    details: Optional[dict] = None
    ip_address: Optional[str] = None
    created_at: datetime
    user: Optional[UserResponse] = None
    model_config = ConfigDict(from_attributes=True)
