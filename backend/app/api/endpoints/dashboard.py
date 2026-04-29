from datetime import datetime, timedelta, timezone
from typing import Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.models import Conversation, Message, ConversationStatus, ChannelType
from app.schemas.common import create_response

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats(
    days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    period_start = now - timedelta(days=days)
    prev_period_start = period_start - timedelta(days=days)

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

    # ── Avg resolution time (hours) — closed conversations in selected period
    closed_in_period = db.query(Conversation).filter(
        Conversation.status == ConversationStatus.CLOSED,
        Conversation.updated_at >= period_start,
    ).all()
    if closed_in_period:
        total_hours = sum(
            (c.updated_at - c.created_at).total_seconds() / 3600
            for c in closed_in_period
            if c.updated_at and c.created_at and c.updated_at > c.created_at
        )
        avg_resolution_hours = round(total_hours / len(closed_in_period), 1)
    else:
        avg_resolution_hours = None

    # ── Channel breakdown ──────────────────────────────────────────────────
    channels = {
        (row[0].name if hasattr(row[0], "name") else str(row[0])).upper(): row[1]
        for row in db.query(
            Conversation.channel, func.count(Conversation.id)
        ).group_by(Conversation.channel).all()
    }

    # ── Current period totals (for comparison) ────────────────────────────
    current_period_convs = db.query(func.count(Conversation.id)).filter(
        Conversation.created_at >= period_start
    ).scalar() or 0
    prev_period_convs = db.query(func.count(Conversation.id)).filter(
        Conversation.created_at >= prev_period_start,
        Conversation.created_at < period_start,
    ).scalar() or 0

    current_period_msgs = db.query(func.count(Message.id)).filter(
        Message.created_at >= period_start
    ).scalar() or 0
    prev_period_msgs = db.query(func.count(Message.id)).filter(
        Message.created_at >= prev_period_start,
        Message.created_at < period_start,
    ).scalar() or 0

    # ── Daily trend for selected period ───────────────────────────────────
    daily_conversations = []
    for i in range(days - 1, -1, -1):
        day_start = (now - timedelta(days=i)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        day_end = day_start + timedelta(days=1)
        count = db.query(func.count(Conversation.id)).filter(
            Conversation.created_at >= day_start,
            Conversation.created_at < day_end,
        ).scalar() or 0
        label = day_start.strftime("%d/%m") if days > 7 else day_start.strftime("%a")
        daily_conversations.append({
            "date": label,
            "full_date": day_start.strftime("%b %d"),
            "count": count,
        })

    daily_messages = []
    for i in range(days - 1, -1, -1):
        day_start = (now - timedelta(days=i)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        day_end = day_start + timedelta(days=1)
        count = db.query(func.count(Message.id)).filter(
            Message.created_at >= day_start,
            Message.created_at < day_end,
        ).scalar() or 0
        label = day_start.strftime("%d/%m") if days > 7 else day_start.strftime("%a")
        daily_messages.append({
            "date": label,
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
        "avg_resolution_hours": avg_resolution_hours,
        "channels": channels,
        "daily_conversations": daily_conversations,
        "daily_messages": daily_messages,
        "period_days": days,
        "current_period_conversations": current_period_convs,
        "prev_period_conversations": prev_period_convs,
        "current_period_messages": current_period_msgs,
        "prev_period_messages": prev_period_msgs,
    })
