"""FastAPI application entrypoint."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import router
from .database import Base, engine


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Initialize the SQLite schema when the service starts."""
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Hilly Region Flash Flood Prediction API",
    version="1.0.0",
    description="Hyper-local environmental risk assessment and early-warning backend.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
app.include_router(router)


@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    """Return a lightweight liveness response."""
    return {"status": "ok"}
