from typing import List, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db
from app.core.auth import get_current_user, require_permission, get_client_ip
from app.models.models import User, UserType
from app.schemas.user import (
    UserCreate, UserUpdate, UserResponse, UserPasswordChange,
    UserTypeCreate, UserTypeUpdate, UserTypeResponse,
)
from app.schemas.common import create_response, create_paginated_response, create_error_response
from app.services.user_service import UserService

router = APIRouter()


def seed_default_user_types(db: Session) -> None:
    """Thin shim — delegates to UserService (kept for backward compat with auth.py import)."""
    UserService(db).seed_default_user_types()


# ─── UserType CRUD ────────────────────────────────────────────────────────

@router.get("/user-types")
async def list_user_types(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """List all user types (public for registration forms)."""
    svc = UserService(db)
    svc.seed_default_user_types()
    user_types = db.query(UserType).order_by(UserType.name).all()
    return create_response([UserTypeResponse.model_validate(ut) for ut in user_types])


@router.post("/user-types")
async def create_user_type(
    data: UserTypeCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_create_user_types")),
) -> Dict[str, Any]:
    """Create a custom user type (Admin only)."""
    svc = UserService(db)
    exists = db.query(UserType).filter(UserType.name == data.name).first()
    if exists:
        error_response, status = create_error_response(
            code="DUPLICATE_NAME",
            message="UserType with this name already exists",
            details={"field": "name", "value": data.name},
            status_code=409
        )
        raise HTTPException(status_code=status, detail=error_response)

    from app.services.audit_service import log_action
    user_type = svc.create_user_type(data.model_dump())
    log_action(db, current_user.id, "create_user_type", "user_type", str(user_type.id),
               details=data.model_dump(mode='json'), ip_address=get_client_ip(request))
    return create_response(UserTypeResponse.model_validate(user_type))


@router.patch("/user-types/{user_type_id}")
async def update_user_type(
    user_type_id: UUID,
    data: UserTypeUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_create_user_types")),
) -> Dict[str, Any]:
    """Update a user type's permissions."""
    user_type = db.query(UserType).filter(UserType.id == user_type_id).first()
    if not user_type:
        error_response, status = create_error_response(
            code="USER_TYPE_NOT_FOUND",
            message="UserType not found",
            status_code=404
        )
        raise HTTPException(status_code=status, detail=error_response)

    update_dict = data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(user_type, key, value)

    db.commit()
    db.refresh(user_type)

    log_action(db, current_user.id, "update_user_type", "user_type", str(user_type.id),
               details=data.model_dump(mode='json', exclude_unset=True), ip_address=get_client_ip(request))
    return create_response(UserTypeResponse.model_validate(user_type))


@router.delete("/user-types/{user_type_id}")
async def delete_user_type(
    user_type_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_create_user_types")),
) -> Dict[str, Any]:
    """Delete a custom user type (cannot delete system types)."""
    user_type = db.query(UserType).filter(UserType.id == user_type_id).first()
    if not user_type:
        error_response, status = create_error_response(
            code="USER_TYPE_NOT_FOUND",
            message="UserType not found",
            status_code=404
        )
        raise HTTPException(status_code=status, detail=error_response)
    if user_type.is_system:
        error_response, status = create_error_response(
            code="CANNOT_DELETE_SYSTEM_ROLE",
            message="Cannot delete system roles",
            status_code=400
        )
        raise HTTPException(status_code=status, detail=error_response)

    # Check if any users are using this type
    user_count = db.query(User).filter(User.user_type_id == user_type_id).count()
    if user_count > 0:
        error_response, status = create_error_response(
            code="ROLE_IN_USE",
            message=f"Cannot delete: {user_count} user(s) still assigned to this role",
            details={"user_count": user_count},
            status_code=400
        )
        raise HTTPException(status_code=status, detail=error_response)

    db.delete(user_type)
    db.commit()

    log_action(db, current_user.id, "delete_user_type", "user_type", str(user_type_id),
               details={"name": user_type.name}, ip_address=get_client_ip(request))
    return create_response({"detail": "UserType deleted"})


# ─── User CRUD ────────────────────────────────────────────────────────────

@router.get("/users")
async def list_users(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_users")),
) -> Dict[str, Any]:
    """List approved users (excludes pending signups)."""
    users = (
        db.query(User)
        .options(joinedload(User.user_type))
        .filter(User.is_approved == True)
        .order_by(User.full_name)
        .offset(skip)
        .limit(limit)
        .all()
    )
    total = db.query(User).filter(User.is_approved == True).count()
    return create_paginated_response(
        data=[UserResponse.model_validate(u) for u in users],
        total=total,
        page=(skip // limit) + 1,
        page_size=limit
    )


@router.get("/users/me")
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get the authenticated user's own profile."""
    return create_response(UserResponse.model_validate(current_user))


# NOTE: /users/pending must be defined before /users/{user_id} to avoid route conflict
@router.get("/users/pending")
async def list_pending_users_inline(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_users")),
) -> Dict[str, Any]:
    """List users who signed up and are awaiting admin approval."""
    users = (
        db.query(User)
        .options(joinedload(User.user_type))
        .filter(User.is_approved == False)
        .order_by(User.created_at.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    total = db.query(User).filter(User.is_approved == False).count()
    return create_paginated_response(
        data=[UserResponse.model_validate(u) for u in users],
        total=total,
        page=(skip // limit) + 1,
        page_size=limit
    )


@router.get("/users/{user_id}")
async def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_users")),
) -> Dict[str, Any]:
    """Get a specific user by ID."""
    user = db.query(User).options(joinedload(User.user_type)).filter(User.id == user_id).first()
    if not user:
        error_response, status = create_error_response(
            code="USER_NOT_FOUND",
            message="User not found",
            status_code=404
        )
        raise HTTPException(status_code=status, detail=error_response)
    return create_response(UserResponse.model_validate(user))


@router.post("/users")
async def create_user(
    data: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_users")),
) -> Dict[str, Any]:
    """Create a new system user (registers in Supabase Auth + local DB)."""
    svc = UserService(db)

    if not svc.get_user_type(data.user_type_id):
        error_response, status = create_error_response(
            code="INVALID_USER_TYPE", message="Invalid user_type_id", status_code=400
        )
        raise HTTPException(status_code=status, detail=error_response)

    if db.query(User).filter(User.email == data.email).first():
        error_response, status = create_error_response(
            code="DUPLICATE_EMAIL", message="Email already registered",
            details={"field": "email", "value": data.email}, status_code=409
        )
        raise HTTPException(status_code=status, detail=error_response)

    try:
        user = svc.create_user(
            email=data.email, password=data.password, full_name=data.full_name,
            user_type_id=data.user_type_id, avatar=data.avatar,
            actor_id=current_user.id, ip_address=get_client_ip(request),
        )
    except Exception as e:
        error_response, status = create_error_response(
            code="INTERNAL_ERROR", message="Failed to create user",
            details={"error": str(e)}, status_code=400
        )
        raise HTTPException(status_code=status, detail=error_response)

    return create_response(UserResponse.model_validate(user))


@router.patch("/users/{user_id}")
async def update_user(
    user_id: UUID,
    data: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_users")),
) -> Dict[str, Any]:
    """Update user profile (name, avatar, role, active status)."""
    user = db.query(User).options(joinedload(User.user_type)).filter(User.id == user_id).first()
    if not user:
        error_response, status = create_error_response(
            code="USER_NOT_FOUND", message="User not found", status_code=404
        )
        raise HTTPException(status_code=status, detail=error_response)

    update_dict = data.model_dump(exclude_unset=True)
    if "user_type_id" in update_dict:
        if not db.query(UserType).filter(UserType.id == update_dict["user_type_id"]).first():
            error_response, status = create_error_response(
                code="INVALID_USER_TYPE", message="Invalid user_type_id", status_code=400
            )
            raise HTTPException(status_code=status, detail=error_response)

    svc = UserService(db)
    user = svc.update_user(user, update_dict, actor_id=current_user.id, ip_address=get_client_ip(request))
    return create_response(UserResponse.model_validate(user))


@router.post("/users/{user_id}/change-password")
async def change_user_password(
    user_id: UUID,
    data: UserPasswordChange,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_change_user_password")),
) -> Dict[str, Any]:
    """Admin-level password reset for a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        error_response, status = create_error_response(
            code="USER_NOT_FOUND", message="User not found", status_code=404
        )
        raise HTTPException(status_code=status, detail=error_response)

    try:
        UserService(db).change_password(
            user, data.new_password,
            actor_id=current_user.id, ip_address=get_client_ip(request)
        )
    except Exception as e:
        error_response, status = create_error_response(
            code="INTERNAL_ERROR", message="Failed to update password",
            details={"error": str(e)}, status_code=400
        )
        raise HTTPException(status_code=status, detail=error_response)

    return create_response({"detail": "Password updated"})


@router.post("/users/{user_id}/disable")
async def disable_user(
    user_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_disable_users")),
) -> Dict[str, Any]:
    """Disable a user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        error_response, status = create_error_response(
            code="USER_NOT_FOUND", message="User not found", status_code=404
        )
        raise HTTPException(status_code=status, detail=error_response)
    if user.id == current_user.id:
        error_response, status = create_error_response(
            code="PERMISSION_DENIED", message="Cannot disable your own account", status_code=400
        )
        raise HTTPException(status_code=status, detail=error_response)

    UserService(db).disable_user(user, actor_id=current_user.id, ip_address=get_client_ip(request))
    return create_response({"detail": "User disabled"})


@router.post("/users/{user_id}/enable")
async def enable_user(
    user_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_disable_users")),
) -> Dict[str, Any]:
    """Re-enable a disabled user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        error_response, status = create_error_response(
            code="USER_NOT_FOUND", message="User not found", status_code=404
        )
        raise HTTPException(status_code=status, detail=error_response)

    UserService(db).enable_user(user, actor_id=current_user.id, ip_address=get_client_ip(request))
    return create_response({"detail": "User enabled"})


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_users")),
) -> Dict[str, Any]:
    """Delete a user account permanently."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        error_response, status = create_error_response(
            code="USER_NOT_FOUND", message="User not found", status_code=404
        )
        raise HTTPException(status_code=status, detail=error_response)
    if user.id == current_user.id:
        error_response, status = create_error_response(
            code="PERMISSION_DENIED", message="Cannot delete your own account", status_code=400
        )
        raise HTTPException(status_code=status, detail=error_response)

    UserService(db).delete_user(user, actor_id=current_user.id, ip_address=get_client_ip(request))
    return create_response({"detail": "User deleted"})


# ─── Self-signup approval flow ────────────────────────────────────────────

@router.post("/users/{user_id}/approve")
async def approve_user(
    user_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_users")),
) -> Dict[str, Any]:
    """Approve a pending signup — activates account and sends notification email."""
    user = db.query(User).options(joinedload(User.user_type)).filter(User.id == user_id).first()
    if not user:
        error_response, status = create_error_response(
            code="USER_NOT_FOUND", message="User not found", status_code=404
        )
        raise HTTPException(status_code=status, detail=error_response)
    if user.is_approved:
        error_response, status = create_error_response(
            code="INVALID_STATE", message="User is already approved", status_code=400
        )
        raise HTTPException(status_code=status, detail=error_response)

    user = UserService(db).approve_user(user, actor_id=current_user.id, ip_address=get_client_ip(request))
    return create_response(UserResponse.model_validate(user))


@router.post("/users/{user_id}/reject")
async def reject_user(
    user_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_users")),
) -> Dict[str, Any]:
    """Reject and remove a pending signup request."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        error_response, status = create_error_response(
            code="USER_NOT_FOUND", message="User not found", status_code=404
        )
        raise HTTPException(status_code=status, detail=error_response)
    if user.is_approved:
        error_response, status = create_error_response(
            code="INVALID_STATE", message="Cannot reject an already approved user", status_code=400
        )
        raise HTTPException(status_code=status, detail=error_response)

    UserService(db).reject_user(user, actor_id=current_user.id, ip_address=get_client_ip(request))
    return create_response({"detail": "User rejected and removed"})
