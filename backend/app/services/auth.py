from datetime import UTC, datetime, timedelta

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core import config
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import UserCreate

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# tokenUrl points at the login endpoint for FastAPI's interactive docs
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


# ── Password helpers ──────────────────────────────────────────────────────────


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# ── User DB helpers ───────────────────────────────────────────────────────────


def get_user_by_identifier(db: Session, identifier: str) -> User | None:
    return (
        db.query(User)
        .filter((User.email == identifier) | (User.phone_number == identifier))
        .first()
    )


def create_user(db: Session, user: UserCreate) -> User:
    existing = (
        db.query(User)
        .filter((User.email == user.email) | (User.phone_number == user.phone_number))
        .first()
    )
    if existing:
        raise ValueError("Email or phone already registered")

    db_user = User(
        full_name=user.full_name,
        email=user.email,
        phone_number=user.phone_number,
        hashed_password=get_password_hash(user.password),
        role=user.role,
    )
    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception:
        db.rollback()
        raise


# ── JWT helpers ───────────────────────────────────────────────────────────────


def _make_token(data: dict, expires_delta: timedelta) -> str:
    payload = data.copy()
    payload["iat"] = datetime.now(UTC)
    payload["exp"] = datetime.now(UTC) + expires_delta
    return jwt.encode(payload, config.JWT_SECRET_KEY, algorithm=config.JWT_ALGORITHM)


def create_access_token(user: User) -> str:
    return _make_token(
        {"sub": str(user.id), "role": user.role, "type": "access"},
        timedelta(minutes=config.JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(user: User) -> str:
    return _make_token(
        {"sub": str(user.id), "type": "refresh"},
        timedelta(days=config.JWT_REFRESH_TOKEN_EXPIRE_DAYS),
    )


def decode_token(token: str, expected_type: str = "access") -> dict:
    """Decode and validate a JWT.  Raises HTTP 401 on any failure."""
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, config.JWT_SECRET_KEY, algorithms=[config.JWT_ALGORITHM]
        )
    except JWTError:
        raise credentials_error

    if payload.get("type") != expected_type:
        raise credentials_error
    if payload.get("sub") is None:
        raise credentials_error

    return payload


# ── FastAPI dependency ────────────────────────────────────────────────────────


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Dependency that resolves the current authenticated User from the Bearer token."""
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(token, expected_type="access")
    user_id: str = payload["sub"]
    user = db.get(User, int(user_id))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
