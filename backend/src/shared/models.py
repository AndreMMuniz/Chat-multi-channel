"""Pydantic models shared across the agent layer."""

from __future__ import annotations
from enum import Enum
from typing import Optional
from pydantic import BaseModel


class ChannelType(str, Enum):
    TELEGRAM = "TELEGRAM"
    WHATSAPP = "WHATSAPP"
    EMAIL = "EMAIL"
    SMS = "SMS"
    WEB = "WEB"


class AgentTask(BaseModel):
    """Payload enqueued when a new inbound message arrives."""
    message_id: str
    conversation_id: str
    channel: ChannelType
    content: str


class ClassificationResult(str, Enum):
    SUPPORT = "support"
    BILLING = "billing"
    FEEDBACK = "feedback"
    SPAM = "spam"
    OTHER = "other"


class AgentResult(BaseModel):
    """Output produced by the agent after processing a message."""
    conversation_id: str
    classification: ClassificationResult
    suggestions: list[str]
    auto_reply: Optional[str] = None
    confidence: float = 0.0
