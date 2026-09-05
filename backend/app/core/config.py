from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SQLALCHEMY_DATABASE_URL = f"sqlite:///{BASE_DIR / 'database' / 'hillshield.db'}"

CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

# Next.js/Vite pick a different port when their default one is already taken,
# so also allow any localhost/127.0.0.1 port for local development.
CORS_ORIGIN_REGEX = r"^http://(localhost|127\.0\.0\.1):\d+$"

ML_MODEL_PATH = BASE_DIR / "ml" / "artifacts" / "xgboost_flood_model.pkl"
