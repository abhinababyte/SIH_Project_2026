import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from the backend project root (one level above app/)
_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(_BACKEND_ROOT / ".env")

BASE_DIR = Path(__file__).resolve().parent.parent

# ── Server ────────────────────────────────────────────────────────────────────
HOST: str = os.getenv("HOST", "0.0.0.0")
PORT: int = int(os.getenv("PORT", "9432"))
DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("1", "true", "yes", "false")

# ── Database ──────────────────────────────────────────────────────────────────
_default_db_url = f"sqlite:///{BASE_DIR / 'database' / 'hillshield.db'}"
SQLALCHEMY_DATABASE_URL: str = os.getenv("DATABASE_URL", _default_db_url)

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS_ORIGINS: list[str] = [
    o.strip() for o in os.getenv("CORS_ORIGINS").split(",") if o.strip()
]

# Next.js/Vite pick a different port when their default one is already taken,
# so also allow any localhost/127.0.0.1 port for local development.
CORS_ORIGIN_REGEX = r"^http://(localhost|127\.0\.0\.1):\d+$"

# ── ML ────────────────────────────────────────────────────────────────────────
ML_MODEL_PATH = BASE_DIR / "ml" / "artifacts" / "xgboost_flood_model.pkl"

# ── JWT ───────────────────────────────────────────────────────────────────────
# Override JWT_SECRET_KEY in production with a long random secret.
# Never commit a real secret here — use a .env file or environment variable.
JWT_SECRET_KEY: str = os.getenv(
    "JWT_SECRET_KEY", "dev-only-insecure-secret-change-in-prod"
)
JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
    os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60")
)
JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = int(
    os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7")
)
