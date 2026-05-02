"""
EXAMPLE: Refactored users.py using new response format {data, meta}

This file shows the pattern for refactoring all endpoints.
Apply this pattern to your actual endpoints.

Key changes:
1. Import create_response, create_paginated_response, create_error_response
2. Replace response_model with Dict return type
3. Use helpers to wrap responses
4. Use proper error responses with codes
"""

from typing import Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import get_current_user, require_permission, get_client_ip
from app.models.models import User, UserType
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserTypeCreate, UserTypeUpdate, UserTypeResponse
from app.schemas.common import create_response, create_paginated_response, create_error_response
from app.services.audit_service import log_action
from app.core.email import send_approval_email
from app.repositories import RepositoryFactory, get_repositories

router = APIRouter()


# ─── LIST USER TYPES ───────────────────────────────────────────────────────

@router.get("/user-types")
async def list_user_types(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """List all user types (public for registration forms)."""
    from app.api.endpoints.users import seed_default_user_types

    seed_default_user_types(db)
    user_types = db.query(UserType).order_by(UserType.name).all()

    # NEW: Wrap response in {data, meta}
    return create_response(
        [UserTypeResponse.model_validate(ut) for ut in user_types]
    )


# ─── LIST USERS WITH PAGINATION ────────────────────────────────────────────

@router.get("/users")
async def list_users(
    skip: int = 0,
    limit: int = 20,
    repos: RepositoryFactory = Depends(get_repositories),
    current_user: User = Depends(require_permission("can_manage_users")),
) -> Dict[str, Any]:
    """List approved users with pagination."""

    # Get paginated users using repository
    users = await repos.users.find_approved_users(skip=skip, limit=limit)
    total = await repos.users.count()

    # NEW: Use paginated response helper
    return create_paginated_response(
        data=[UserResponse.model_validate(u) for u in users],
        total=total,
        page=(skip // limit) + 1,
        page_size=limit
    )


# ─── GET SINGLE USER ───────────────────────────────────────────────────────

@router.get("/users/{user_id}")
async def get_user(
    user_id: UUID,
    repos: RepositoryFactory = Depends(get_repositories),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """Get user by ID."""

    user = await repos.users.find_by_id(str(user_id))

    # NEW: Use error response helper with code
    if not user:
        response, status = create_error_response(
            code="USER_NOT_FOUND",
            message="User not found",
            status_code=404
        )
        raise HTTPException(status_code=status, detail=response)

    # NEW: Wrap success response
    return create_response(UserResponse.model_validate(user))


# ─── CREATE USER TYPE ──────────────────────────────────────────────────────

@router.post("/user-types")
async def create_user_type(
    data: UserTypeCreate,
    request: Request,
    repos: RepositoryFactory = Depends(get_repositories),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_create_user_types")),
) -> Dict[str, Any]:
    """Create a custom user type (Admin only)."""

    # Check if exists
    existing = db.query(UserType).filter(UserType.name == data.name).first()
    if existing:
        # NEW: Use error response with validation error code
        response, status = create_error_response(
            code="DUPLICATE_NAME",
            message="UserType with this name already exists",
            details={"field": "name", "value": data.name},
            status_code=409
        )
        raise HTTPException(status_code=status, detail=response)

    # Create user type
    user_type = UserType(**data.model_dump(), is_system=False)
    db.add(user_type)
    db.commit()
    db.refresh(user_type)

    # Audit log
    log_action(
        db, current_user.id, "create_user_type", "user_type", str(user_type.id),
        details=data.model_dump(mode='json'),
        ip_address=get_client_ip(request)
    )

    # NEW: Wrap success response
    return create_response(UserTypeResponse.model_validate(user_type))


# ─── UPDATE USER TYPE ──────────────────────────────────────────────────────

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

    # NEW: Use error response
    if not user_type:
        response, status = create_error_response(
            code="USER_TYPE_NOT_FOUND",
            message="UserType not found",
            status_code=404
        )
        raise HTTPException(status_code=status, detail=response)

    # Update
    update_dict = data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(user_type, key, value)

    db.commit()
    db.refresh(user_type)

    log_action(
        db, current_user.id, "update_user_type", "user_type", str(user_type.id),
        details=data.model_dump(mode='json', exclude_unset=True),
        ip_address=get_client_ip(request)
    )

    # NEW: Wrap response
    return create_response(UserTypeResponse.model_validate(user_type))


# ─── DELETE USER TYPE ──────────────────────────────────────────────────────

@router.delete("/user-types/{user_type_id}")
async def delete_user_type(
    user_type_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_create_user_types")),
) -> Dict[str, Any]:
    """Delete a custom user type (cannot delete system types)."""

    user_type = db.query(UserType).filter(UserType.id == user_type_id).first()

    # NEW: Use error response
    if not user_type:
        response, status = create_error_response(
            code="USER_TYPE_NOT_FOUND",
            message="UserType not found",
            status_code=404
        )
        raise HTTPException(status_code=status, detail=response)

    if user_type.is_system:
        # NEW: Error response for business logic
        response, status = create_error_response(
            code="CANNOT_DELETE_SYSTEM_ROLE",
            message="Cannot delete system roles",
            status_code=400
        )
        raise HTTPException(status_code=status, detail=response)

    # Check usage
    user_count = db.query(User).filter(User.user_type_id == user_type_id).count()
    if user_count > 0:
        # NEW: Error with details about the issue
        response, status = create_error_response(
            code="ROLE_IN_USE",
            message=f"Cannot delete: {user_count} user(s) still assigned to this role",
            details={"user_count": user_count},
            status_code=400
        )
        raise HTTPException(status_code=status, detail=response)

    # Delete
    db.delete(user_type)
    db.commit()

    log_action(
        db, current_user.id, "delete_user_type", "user_type", str(user_type_id),
        details={"name": user_type.name},
        ip_address=get_client_ip(request)
    )

    # NEW: Wrap deletion response
    return create_response({"detail": "UserType deleted"})


# ─── KEY CHANGES TO APPLY ──────────────────────────────────────────────────

"""
REFACTORING CHECKLIST:

1. Add import at top:
   from app.schemas.common import create_response, create_paginated_response, create_error_response

2. Change return type from response_model to Dict[str, Any]:
   OLD: @router.get("/users", response_model=List[UserResponse])
   NEW: @router.get("/users") -> Dict[str, Any]:

3. Make functions async:
   OLD: def list_users(...)
   NEW: async def list_users(...)

4. Wrap all responses:
   OLD: return user_type
   NEW: return create_response(UserTypeResponse.model_validate(user_type))

5. Wrap list responses with pagination:
   OLD: return db.query(User).all()
   NEW: return create_paginated_response(users, total, page, page_size)

6. Replace HTTPException with error helpers:
   OLD: raise HTTPException(status_code=404, detail="Not found")
   NEW: response, status = create_error_response(
            code="USER_NOT_FOUND",
            message="User not found",
            status_code=404
        )
        raise HTTPException(status_code=status, detail=response)

7. Use repositories instead of db.query():
   OLD: db.query(User).filter(User.email == email).first()
   NEW: await repos.users.find_by_email(email)

Estimated effort: Apply this pattern to all 7 endpoints files (~4-5 hours total)
"""
