from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from app.core.database import get_db, get_supabase
from app.models.models import User
from app.schemas.user import UserResponse

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserResponse


@router.post("/login", response_model=LoginResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate via Supabase and return tokens + user profile."""
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

    # Find internal user profile
    user = (
        db.query(User)
        .options(joinedload(User.user_type))
        .filter(User.auth_id == auth_id)
        .first()
    )

    if not user:
        raise HTTPException(status_code=403, detail="User profile not found. Contact an administrator.")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    return LoginResponse(
        access_token=auth_response.session.access_token,
        refresh_token=auth_response.session.refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh")
def refresh_token(refresh_token: str):
    """Refresh an expired access token."""
    supabase = get_supabase()
    try:
        auth_response = supabase.auth.refresh_session(refresh_token)
        return {
            "access_token": auth_response.session.access_token,
            "refresh_token": auth_response.session.refresh_token,
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
