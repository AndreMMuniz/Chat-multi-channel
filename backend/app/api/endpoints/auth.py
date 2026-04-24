import os
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, field_validator
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


class SetPasswordRequest(BaseModel):
    new_password: str

    @field_validator('new_password')
    @classmethod
    def password_strength(cls, v: str) -> str:
        from app.schemas.user import validate_password_strength
        return validate_password_strength(v)


@router.post("/forgot-password")
@limiter.limit("3/minute")
def forgot_password(data: dict, request: Request):
    """Send password reset email via Supabase."""
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email required")

    supabase = get_supabase()
    try:
        supabase.auth.reset_password_for_email(email, {
            "redirect_to": f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/reset-password"
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to send reset email: {str(e)}")

    return {"detail": "Password reset email sent. Check your inbox."}


@router.post("/set-password")
def set_password(data: SetPasswordRequest, request: Request, db: Session = Depends(get_db)):
    """Set a new password using a Supabase recovery token.
    Auto-creates the local user record if the email was registered directly in Supabase.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Recovery token required")

    token = auth_header[7:]
    supabase = get_supabase()

    try:
        auth_response = supabase.auth.get_user(token)
        if not auth_response or not auth_response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired recovery link")
        auth_user = auth_response.user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired recovery link")

    try:
        supabase.auth.admin.update_user_by_id(str(auth_user.id), {"password": data.new_password})
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update password: {str(e)}")

    # Auto-create local user record if admin registered the email directly in Supabase
    auth_id = str(auth_user.id)
    user = db.query(User).filter(User.auth_id == auth_id).first()
    if not user:
        seed_default_user_types(db)
        default_role = db.query(UserType).filter(UserType.name == "User", UserType.is_system == True).first()
        if default_role and auth_user.email:
            name = auth_user.email.split("@")[0].replace(".", " ").title()
            new_user = User(
                auth_id=auth_id,
                email=auth_user.email,
                full_name=name,
                user_type_id=default_role.id,
                is_active=True,
                is_approved=True,
            )
            db.add(new_user)
            db.commit()

    return {"detail": "Password set successfully. You can now sign in."}


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
