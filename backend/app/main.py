from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models
from app.api.routes import api_router
from app.core.config import CORS_ORIGIN_REGEX, CORS_ORIGINS
from app.core.database import Base, engine


def create_app() -> FastAPI:
    Base.metadata.create_all(bind=engine)

    app = FastAPI(title="HillShield Backend Engine")

    # NOTE: allow_credentials=True cannot be used with allow_origins=["*"].
    # allow_origin_regex covers dev servers that fall back to a different
    # port when their default one is already taken.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_origin_regex=CORS_ORIGIN_REGEX,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router)

    return app


app = create_app()
