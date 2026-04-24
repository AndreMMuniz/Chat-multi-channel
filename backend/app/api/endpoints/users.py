from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db, get_supabase
from app.core.auth import get_current_user, require_permission, get_client_ip
from app.models.models import User, UserType, DefaultRole, AuditLog, Conversation, Message
from app.schemas.user import (
    UserCreate, UserUpdate, UserResponse, UserPasswordChange,
    UserTypeCreate, UserTypeUpdate, UserTypeResponse,
)
from app.services.audit_service import log_action
from app.core.email import send_approval_email

router = APIRouter()


# ─── Seed default UserTypes on first call ─────────────────────────────────

def seed_default_user_types(db: Session) -> None:
    """Create built-in Admin/Manager/User roles if they don't exist."""
    existing = db.query(UserType).filter(UserType.is_system == True).count()
    if existing >= 3:
        return

    defaults = [
        UserType(
            name="Admin", base_role=DefaultRole.ADMIN, is_system=True,
            can_view_all_conversations=True, can_delete_conversations=True,
            can_edit_messages=True, can_delete_messages=True,
            can_manage_users=True, can_assign_roles=True,
            can_disable_users=True, can_change_user_password=True,
            can_change_settings=True, can_change_branding=True,
            can_change_ai_model=True, can_view_audit_logs=True,
            can_create_user_types=True,
        ),
        UserType(
            name="Manager", base_role=DefaultRole.MANAGER, is_system=True,
            can_view_all_conversations=True,
            can_edit_messages=True,
            can_view_audit_logs=True,
        ),
        UserType(
            name="User", base_role=DefaultRole.USER, is_system=True,
        ),
    ]
    for ut in defaults:
        exists = db.query(UserType).filter(UserType.name == ut.name).first()
        if not exists:
            db.add(ut)
    db.commit()


# ─── UserType CRUD ────────────────────────────────────────────────────────

@router.get("/user-types", response_model=List[UserTypeResponse])
def list_user_types(db: Session = Depends(get_db)):
    """List all user types (public for registration forms)."""
    seed_default_user_types(db)
    return db.query(UserType).order_by(UserType.name).all()


@router.post("/user-types", response_model=UserTypeResponse)
def create_user_type(
    data: UserTypeCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_create_user_types")),
):
    """Create a custom user type (Admin only)."""
    exists = db.query(UserType).filter(UserType.name == data.name).first()
    if exists:
        raise HTTPException(status_code=400, detail="UserType with this name already exists")

    user_type = UserType(**data.model_dump(), is_system=False)
    db.add(user_type)
    db.commit()
    db.refresh(user_type)

    log_action(db, current_user.id, "create_user_type", "user_type", str(user_type.id),
               details=data.model_dump(mode='json'), ip_address=get_client_ip(request))
    return user_type


@router.patch("/user-types/{user_type_id}", response_model=UserTypeResponse)
def update_user_type(
    user_type_id: UUID,
    data: UserTypeUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_create_user_types")),
):
    """Update a user type's permissions."""
    user_type = db.query(UserType).filter(UserType.id == user_type_id).first()
    if not user_type:
        raise HTTPException(status_code=404, detail="UserType not found")

    update_dict = data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(user_type, key, value)

    db.commit()
    db.refresh(user_type)

    log_action(db, current_user.id, "update_user_type", "user_type", str(user_type.id),
               details=data.model_dump(mode='json', exclude_unset=True), ip_address=get_client_ip(request))
    return user_type


@router.delete("/user-types/{user_type_id}")
def delete_user_type(
    user_type_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_create_user_types")),
):
    """Delete a custom user type (cannot delete system types)."""
    user_type = db.query(UserType).filter(UserType.id == user_type_id).first()
    if not user_type:
        raise HTTPException(status_code=404, detail="UserType not found")
    if user_type.is_system:
        raise HTTPException(status_code=400, detail="Cannot delete system roles")

    # Check if any users are using this type
    user_count = db.query(User).filter(User.user_type_id == user_type_id).count()
    if user_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete: {user_count} user(s) still assigned to this role")

    db.delete(user_type)
    db.commit()

    log_action(db, current_user.id, "delete_user_type", "user_type", str(user_type_id),
               details={"name": user_type.name}, ip_address=get_client_ip(request))
    return {"detail": "UserType deleted"}


# ─── User CRUD ────────────────────────────────────────────────────────────

@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_users")),
):
    """List approved users (excludes pending signups)."""
    users = (
        db.query(User)
        .options(joinedload(User.user_type))
        .filter(User.is_approved == True)
        .order_by(User.full_name)
        .all()
    )
    return users


@router.get("/users/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    """Get the authenticated user's own profile."""
    return current_user


# NOTE: /users/pending must be defined before /users/{user_id} to avoid route conflict
@router.get("/users/pending", response_model=List[UserResponse])
def list_pending_users_inline(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_users")),
):
    """List users who signed up and are awaiting admin approval."""
    users = (
        db.query(User)
        .options(joinedload(User.user_type))
        .filter(User.is_approved == False)
        .order_by(User.created_at.asc())
        .all()
    )
    return users


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_users")),
):
    """Get a specific user by ID."""
    user = db.query(User).options(joinedload(User.user_type)).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/users", response_model=UserResponse, status_code=201)
def create_user(
    data: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_users")),
):
    """Create a new system user (registers in Supabase Auth + local DB)."""
    # Validate user_type exists
    user_type = db.query(UserType).filter(UserType.id == data.user_type_id).first()
    if not user_type:
        raise HTTPException(status_code=400, detail="Invalid user_type_id")

    # Check email uniqueness
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user in Supabase Auth
    supabase = get_supabase()
    try:
        auth_response = supabase.auth.admin.create_user({
            "email": data.email,
            "password": data.password,
            "email_confirm": True,
        })
        auth_id = auth_response.user.id
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create auth user: {str(e)}")

    # Create local user record
    user = User(
        auth_id=str(auth_id),
        email=data.email,
        full_name=data.full_name,
        avatar=data.avatar,
        user_type_id=data.user_type_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Eager load user_type for response
    db.refresh(user, attribute_names=["user_type"])

    log_action(db, current_user.id, "create_user", "user", str(user.id),
               details={"email": data.email, "role": user_type.name}, ip_address=get_client_ip(request))
    return user


@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: UUID,
    data: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_users")),
):
    """Update user profile (name, avatar, role, active status)."""
    user = db.query(User).options(joinedload(User.user_type)).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_dict = data.model_dump(exclude_unset=True)

    # Validate user_type_id if changing role
    if "user_type_id" in update_dict:
        user_type = db.query(UserType).filter(UserType.id == update_dict["user_type_id"]).first()
        if not user_type:
            raise HTTPException(status_code=400, detail="Invalid user_type_id")

    for key, value in update_dict.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)

    log_action(db, current_user.id, "update_user", "user", str(user_id),
               details=data.model_dump(mode='json', exclude_unset=True), ip_address=get_client_ip(request))
    return user


@router.post("/users/{user_id}/change-password")
def change_user_password(
    user_id: UUID,
    data: UserPasswordChange,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_change_user_password")),
):
    """Admin-level password reset for a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    supabase = get_supabase()
    try:
        supabase.auth.admin.update_user_by_id(user.auth_id, {"password": data.new_password})
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update password: {str(e)}")

    log_action(db, current_user.id, "change_user_password", "user", str(user_id),
               ip_address=get_client_ip(request))
    return {"detail": "Password updated"}


@router.post("/users/{user_id}/disable")
def disable_user(
    user_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_disable_users")),
):
    """Disable a user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot disable your own account")

    user.is_active = False
    db.commit()

    log_action(db, current_user.id, "disable_user", "user", str(user_id),
               details={"email": user.email}, ip_address=get_client_ip(request))
    return {"detail": "User disabled"}


@router.post("/users/{user_id}/enable")
def enable_user(
    user_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_disable_users")),
):
    """Re-enable a disabled user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = True
    db.commit()

    log_action(db, current_user.id, "enable_user", "user", str(user_id),
                details={"email": user.email}, ip_address=get_client_ip(request))
    return {"detail": "User enabled"}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_users")),
):
    """Delete a user account permanently."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    # Handle foreign key constraints
    # Reassign conversations
    db.query(Conversation).filter(Conversation.assigned_user_id == user_id).update({"assigned_user_id": None})
    # Reassign messages
    db.query(Message).filter(Message.owner_id == user_id).update({"owner_id": None})
    # Delete audit logs
    db.query(AuditLog).filter(AuditLog.user_id == user_id).delete()

    # Delete from Supabase Auth
    supabase = get_supabase()
    try:
        supabase.auth.admin.delete_user(user.auth_id)
    except Exception:
        pass  # Proceed even if Supabase deletion fails

    # Log the deletion
    log_action(db, current_user.id, "delete_user", "user", str(user_id),
                details={"email": user.email}, ip_address=get_client_ip(request))

    # Delete from local database
    db.delete(user)
    db.commit()

    return {"detail": "User deleted"}


# ─── Self-signup approval flow ────────────────────────────────────────────

@router.post("/users/{user_id}/approve", response_model=UserResponse)
def approve_user(
    user_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_users")),
):
    """Approve a pending signup — activates account and sends notification email."""
    user = db.query(User).options(joinedload(User.user_type)).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_approved:
        raise HTTPException(status_code=400, detail="User is already approved")

    user.is_approved = True
    user.is_active = True
    db.commit()
    db.refresh(user)

    send_approval_email(user.email, user.full_name, db)

    log_action(db, current_user.id, "approve_user", "user", str(user_id),
               details={"email": user.email}, ip_address=get_client_ip(request))
    return user


@router.post("/users/{user_id}/reject")
def reject_user(
    user_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_users")),
):
    """Reject and remove a pending signup request."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_approved:
        raise HTTPException(status_code=400, detail="Cannot reject an already approved user")

    supabase = get_supabase()
    try:
        supabase.auth.admin.delete_user(user.auth_id)
    except Exception:
        pass

    log_action(db, current_user.id, "reject_user", "user", str(user_id),
               details={"email": user.email}, ip_address=get_client_ip(request))

    db.delete(user)
    db.commit()
    return {"detail": "User rejected and removed"}
