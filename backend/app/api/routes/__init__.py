from fastapi import APIRouter

from app.api.routes import auth, bhashini, incidents, prediction, reports, telemetry, websocket

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(telemetry.router)
api_router.include_router(incidents.router)
api_router.include_router(reports.router)
api_router.include_router(prediction.router)
api_router.include_router(bhashini.router)
api_router.include_router(websocket.router)

__all__ = ["api_router"]
