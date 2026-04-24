import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Enum, JSON, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

# Enums
class ChannelType(enum.Enum):
    WHATSAPP = "whatsapp"
    TELEGRAM = "telegram"
    EMAIL = "email"
    SMS = "sms"
    WEB = "web"

class ConversationStatus(enum.Enum):
    OPEN = "open"
    CLOSED = "closed"
    PENDING = "pending"

class ConversationTag(enum.Enum):
    SUPPORT = "support"
    SALES = "sales"
    GENERAL = "general"

class MessageType(enum.Enum):
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    AUDIO = "audio"

class DefaultRole(enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"


# --- RBAC Models ---

class UserType(Base):
    """Custom role definitions with granular permissions."""
    __tablename__ = "user_types"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)  # e.g. "Admin", "Manager", "User"
    base_role = Column(Enum(DefaultRole), nullable=False, default=DefaultRole.USER)
    is_system = Column(Boolean, default=False)  # True for built-in roles (Admin, Manager, User)

    # Conversation permissions
    can_view_all_conversations = Column(Boolean, default=False)
    can_delete_conversations = Column(Boolean, default=False)

    # Message permissions
    can_edit_messages = Column(Boolean, default=False)
    can_delete_messages = Column(Boolean, default=False)

    # User management permissions
    can_manage_users = Column(Boolean, default=False)
    can_assign_roles = Column(Boolean, default=False)
    can_disable_users = Column(Boolean, default=False)
    can_change_user_password = Column(Boolean, default=False)

    # System permissions
    can_change_settings = Column(Boolean, default=False)
    can_change_branding = Column(Boolean, default=False)
    can_change_ai_model = Column(Boolean, default=False)
    can_view_audit_logs = Column(Boolean, default=False)
    can_create_user_types = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    users = relationship("User", back_populates="user_type")


class User(Base):
    """Internal system users (agents/operators who respond to customers)."""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    auth_id = Column(String(255), unique=True, nullable=False, index=True)  # Supabase Auth UID
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    avatar = Column(String, nullable=True)

    user_type_id = Column(UUID(as_uuid=True), ForeignKey("user_types.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=True)  # False for self-signup users until admin approves

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user_type = relationship("UserType", back_populates="users")
    audit_logs = relationship("AuditLog", back_populates="user")


class AuditLog(Base):
    """Tracks sensitive actions for accountability."""
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False)  # e.g. "delete_message", "change_ai_model"
    resource_type = Column(String(100), nullable=True)  # e.g. "message", "conversation", "user"
    resource_id = Column(String(255), nullable=True)
    details = Column(JSON, nullable=True)  # Extra context about the action
    ip_address = Column(String(45), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="audit_logs")


# --- Core Chat Models ---

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    avatar = Column(String, nullable=True) # URL to image
    channel_identifier = Column(String(255), nullable=True) # phone number, telegram chat_id, email, etc.

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    conversations = relationship("Conversation", back_populates="contact")

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    thread_id = Column(String(255), nullable=True, index=True) # Thread ID for LangGraph or channel specific thread
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=False)
    assigned_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    channel = Column(Enum(ChannelType), default=ChannelType.WEB)
    status = Column(Enum(ConversationStatus), default=ConversationStatus.OPEN)
    tag = Column(Enum(ConversationTag), nullable=True)

    is_unread = Column(Boolean, default=False)
    last_message = Column(Text, nullable=True)
    last_message_date = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    contact = relationship("Contact", back_populates="conversations")
    assigned_user = relationship("User", foreign_keys=[assigned_user_id])
    messages = relationship("Message", back_populates="conversation")
    ai_suggestions = relationship("AISuggestion", back_populates="conversation")

class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False)

    # User ID ties to an agent (internal). Contacts don't have user accounts.
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    content = Column(Text, nullable=False)
    inbound = Column(Boolean, default=True) # True if from Contact, False if from us (Agent/Bot)
    message_type = Column(Enum(MessageType), default=MessageType.TEXT)

    image = Column(String, nullable=True) # URL to image
    file = Column(String, nullable=True) # URL to file

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    conversation = relationship("Conversation", back_populates="messages")
    owner = relationship("User", foreign_keys=[owner_id])

class AISuggestion(Base):
    __tablename__ = "ai_suggestions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False)

    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    conversation = relationship("Conversation", back_populates="ai_suggestions")

class QuickReply(Base):
    __tablename__ = "quick_replies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shortcut = Column(String(50), unique=True, index=True, nullable=False) # e.g., /hello
    content = Column(Text, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class GeneralSettings(Base):
    __tablename__ = "general_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    app_name = Column(String(255), nullable=False, default="Multi-Channel Chat")
    app_email = Column(String(255), nullable=True)
    app_logo = Column(String, nullable=True) # URL to logo

    # Branding
    primary_color = Column(String(7), nullable=True, default="#0F172A")
    secondary_color = Column(String(7), nullable=True, default="#3B82F6")
    accent_color = Column(String(7), nullable=True, default="#10B981")

    # AI Config
    ai_model = Column(String(100), nullable=True, default="gpt-4o-mini")
    ai_provider = Column(String(50), nullable=True, default="openrouter")

    # WhatsApp (Meta Cloud API)
    whatsapp_phone_id = Column(String, nullable=True)
    whatsapp_account_id = Column(String, nullable=True)
    whatsapp_access_token = Column(String, nullable=True)
    whatsapp_webhook_token = Column(String, nullable=True)

    # Email (IMAP/SMTP)
    email_imap_host = Column(String, nullable=True)
    email_imap_port = Column(Integer, nullable=True, default=993)
    email_smtp_host = Column(String, nullable=True)
    email_smtp_port = Column(Integer, nullable=True, default=587)
    email_address = Column(String, nullable=True)
    email_password = Column(String, nullable=True)

    # SMS (Twilio)
    twilio_account_sid = Column(String, nullable=True)
    twilio_auth_token = Column(String, nullable=True)
    twilio_phone_number = Column(String, nullable=True)

    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
