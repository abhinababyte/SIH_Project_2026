from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import (
    RefreshRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.services import auth as auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _token_response(user: User) -> TokenResponse:
    """Build a full TokenResponse for a given user."""
    return TokenResponse(
        access_token=auth_service.create_access_token(user),
        refresh_token=auth_service.create_refresh_token(user),
        user=UserResponse.model_validate(user),
    )


@router.post("/register", response_model=TokenResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        db_user = auth_service.create_user(db, user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e!s}")
    return _token_response(db_user)


@router.post("/login", response_model=TokenResponse)
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    db_user = auth_service.get_user_by_identifier(db, user.identifier)
    if not db_user or not auth_service.verify_password(
        user.password, db_user.hashed_password
    ):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return _token_response(db_user)


@router.post("/refresh", response_model=TokenResponse)
def refresh_tokens(body: RefreshRequest, db: Session = Depends(get_db)):
    """Exchange a valid refresh token for a fresh access + refresh token pair."""
    payload = auth_service.decode_token(body.refresh_token, expected_type="refresh")
    user = db.get(User, int(payload["sub"]))
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return _token_response(user)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(auth_service.get_current_user)):
    """Return the profile of the currently authenticated user."""
    return current_user
