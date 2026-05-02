from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.auth import require_permission
from app.models.models import AuditLog, User
from app.schemas.user import AuditLogResponse
from app.schemas.common import create_paginated_response

router = APIRouter()


@router.get("/audit-logs")
async def list_audit_logs(
    action: Optional[str] = Query(None, description="Filter by action type"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_view_audit_logs")),
) -> Dict[str, Any]:
    """List audit log entries (Admin/Manager only)."""
    query = db.query(AuditLog).options(joinedload(AuditLog.user))
    count_query = db.query(AuditLog)

    if action:
        query = query.filter(AuditLog.action == action)
        count_query = count_query.filter(AuditLog.action == action)
    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)
        count_query = count_query.filter(AuditLog.resource_type == resource_type)

    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    total = count_query.count()
    return create_paginated_response(
        data=[AuditLogResponse.model_validate(log) for log in logs],
        total=total,
        page=(skip // limit) + 1,
        page_size=limit
    )
