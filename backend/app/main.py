from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models
from app.api.routes import api_router
from app.core.config import CORS_ORIGINS
from app.core.database import Base, engine


def create_app() -> FastAPI:
    Base.metadata.create_all(bind=engine)

    app = FastAPI(title="HillShield Backend Engine")

    # NOTE: allow_credentials=True cannot be used with allow_origins=["*"].
    # Set specific origins or use allow_origin_regex for development.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router)

    return app


app = create_app()
