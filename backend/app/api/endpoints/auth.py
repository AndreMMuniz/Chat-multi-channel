import os
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.database import get_db, get_supabase
from app.models.models import User, UserType
from app.schemas.user import UserResponse, UserSignup
from app.api.endpoints.users import seed_default_user_types

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

_IS_PROD = os.getenv("ENVIRONMENT", "development") == "production"


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    # SameSite=none required for cross-domain cookie sharing (Vercel + Railway)
    samesite = "none" if _IS_PROD else "lax"
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=_IS_PROD,
        samesite=samesite,
        max_age=3600,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=_IS_PROD,
        samesite=samesite,
        max_age=7 * 24 * 3600,
        path="/",
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserResponse


@router.post("/login", response_model=LoginResponse)
@limiter.limit("10/minute")
def login(data: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    """Authenticate via Supabase, set HttpOnly cookies and return tokens."""
    supabase = get_supabase()

    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": data.email,
            "password": data.password,
        })
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not auth_response.session:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    auth_id = str(auth_response.user.id)

    user = (
        db.query(User)
        .options(joinedload(User.user_type))
        .filter(User.auth_id == auth_id)
        .first()
    )

    if not user:
        raise HTTPException(status_code=403, detail="User profile not found. Contact an administrator.")

    if not user.is_approved:
        raise HTTPException(status_code=403, detail="Account pending admin approval. You will be notified by email when approved.")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled. Contact an administrator.")

    _set_auth_cookies(response, auth_response.session.access_token, auth_response.session.refresh_token)

    return LoginResponse(
        access_token=auth_response.session.access_token,
        refresh_token=auth_response.session.refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/signup")
@limiter.limit("5/minute")
def signup(data: UserSignup, request: Request, db: Session = Depends(get_db)):
    """Self-service registration — creates account pending admin approval."""
    seed_default_user_types(db)

    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    default_role = db.query(UserType).filter(UserType.name == "User", UserType.is_system == True).first()
    if not default_role:
        raise HTTPException(status_code=500, detail="Default role not found. Contact an administrator.")

    supabase = get_supabase()
    try:
        auth_response = supabase.auth.admin.create_user({
            "email": data.email,
            "password": data.password,
            "email_confirm": True,
        })
        auth_id = auth_response.user.id
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create account: {str(e)}")

    user = User(
        auth_id=str(auth_id),
        email=data.email,
        full_name=data.full_name,
        user_type_id=default_role.id,
        is_active=False,
        is_approved=False,
    )
    db.add(user)
    db.commit()

    return {"detail": "Account created. An administrator will review your request and notify you by email."}


@router.post("/logout")
def logout(response: Response):
    """Invalidate session by clearing auth cookies."""
    _clear_auth_cookies(response)
    return {"detail": "Logged out"}


@router.post("/refresh")
def refresh_token(request: Request, response: Response):
    """Refresh access token using the HttpOnly refresh cookie."""
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")

    supabase = get_supabase()
    try:
        auth_response = supabase.auth.refresh_session(token)
        _set_auth_cookies(response, auth_response.session.access_token, auth_response.session.refresh_token)
        return {
            "access_token": auth_response.session.access_token,
            "refresh_token": auth_response.session.refresh_token,
        }
    except Exception:
        _clear_auth_cookies(response)
        raise HTTPException(status_code=401, detail="Invalid refresh token")
