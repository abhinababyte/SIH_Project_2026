from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.auth import UserCreate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def get_user_by_identifier(db: Session, identifier: str) -> User | None:
    return db.query(User).filter(
        (User.email == identifier) | (User.phone_number == identifier)
    ).first()


def create_user(db: Session, user: UserCreate) -> User:
    existing = db.query(User).filter(
        (User.email == user.email) | (User.phone_number == user.phone_number)
    ).first()
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
