from datetime import datetime, timedelta, timezone
from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import Conversation, Message, ConversationStatus, ChannelType
from app.schemas.common import create_response

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # ── Conversations overview ─────────────────────────────────────────────
    total = db.query(func.count(Conversation.id)).scalar() or 0

    by_status = {
        row[0].name if hasattr(row[0], "name") else str(row[0]): row[1]
        for row in db.query(
            Conversation.status, func.count(Conversation.id)
        ).group_by(Conversation.status).all()
    }
    open_count    = by_status.get("OPEN", 0)
    closed_count  = by_status.get("CLOSED", 0)
    pending_count = by_status.get("PENDING", 0)
    unread_count  = db.query(func.count(Conversation.id)).filter(
        Conversation.is_unread == True
    ).scalar() or 0

    # ── Messages today ─────────────────────────────────────────────────────
    messages_today = db.query(func.count(Message.id)).filter(
        Message.created_at >= today_start
    ).scalar() or 0

    # ── Resolution rate ────────────────────────────────────────────────────
    resolution_rate = round((closed_count / total * 100) if total > 0 else 0, 1)

    # ── Channel breakdown ──────────────────────────────────────────────────
    channels = {
        (row[0].name if hasattr(row[0], "name") else str(row[0])).upper(): row[1]
        for row in db.query(
            Conversation.channel, func.count(Conversation.id)
        ).group_by(Conversation.channel).all()
    }

    # ── Last 7 days trend ──────────────────────────────────────────────────
    daily_conversations = []
    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        day_end = day_start + timedelta(days=1)
        count = db.query(func.count(Conversation.id)).filter(
            Conversation.created_at >= day_start,
            Conversation.created_at < day_end,
        ).scalar() or 0
        daily_conversations.append({
            "date": day_start.strftime("%a"),
            "full_date": day_start.strftime("%b %d"),
            "count": count,
        })

    # ── Messages last 7 days ───────────────────────────────────────────────
    daily_messages = []
    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        day_end = day_start + timedelta(days=1)
        count = db.query(func.count(Message.id)).filter(
            Message.created_at >= day_start,
            Message.created_at < day_end,
        ).scalar() or 0
        daily_messages.append({
            "date": day_start.strftime("%a"),
            "count": count,
        })

    return create_response({
        "total_conversations": total,
        "open_conversations": open_count,
        "closed_conversations": closed_count,
        "pending_conversations": pending_count,
        "unread_conversations": unread_count,
        "messages_today": messages_today,
        "resolution_rate": resolution_rate,
        "channels": channels,
        "daily_conversations": daily_conversations,
        "daily_messages": daily_messages,
    })
