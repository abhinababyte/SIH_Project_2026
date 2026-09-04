from __future__ import annotations

import asyncio
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# ============================================================
# Configuration
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "xgboost_flood_model.pkl"

# Update these for your actual deployed frontend.
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)

logger = logging.getLogger("hillshield")


# ============================================================
# Global Model Store
# ============================================================

model: Any | None = None


# ============================================================
# WebSocket Connection Manager
# ============================================================

class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: set[WebSocket] = set()
        self.lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()

        async with self.lock:
            self.active_connections.add(websocket)

        logger.info(
            "Dashboard connected. Active connections: %d",
            len(self.active_connections),
        )

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self.lock:
            self.active_connections.discard(websocket)

        logger.info(
            "Dashboard disconnected. Active connections: %d",
            len(self.active_connections),
        )

    async def broadcast(self, message: dict[str, Any]) -> None:
        async with self.lock:
            connections = list(self.active_connections)

        disconnected: list[WebSocket] = []

        for websocket in connections:
            try:
                await websocket.send_json(message)
            except Exception:
                disconnected.append(websocket)

        for websocket in disconnected:
            await self.disconnect(websocket)


manager = ConnectionManager()


# ============================================================
# Pydantic Schemas
# ============================================================

class FloodPredictionRequest(BaseModel):
    rain: float = Field(..., description="Rainfall measurement")
    soil: float = Field(..., description="Soil moisture/saturation measurement")
    river: float = Field(..., description="River/water-level measurement")


class FloodPredictionResponse(BaseModel):
    risk_level: int
    risk_score: float
    emergency: bool


# ============================================================
# Model Loading
# ============================================================

def load_model() -> Any:
    """
    Load the trained XGBoost model from disk.

    IMPORTANT:
    - No training occurs here.
    - The existing .pkl model is loaded into memory once at startup.
    """

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model file not found: {MODEL_PATH}"
        )

    logger.info("Loading flood prediction model from %s", MODEL_PATH)

    loaded_model = joblib.load(MODEL_PATH)

    logger.info("Flood prediction model loaded successfully.")

    return loaded_model


# ============================================================
# Application Lifespan
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI startup/shutdown lifecycle.

    The model is loaded ONCE when the application starts.
    """

    global model

    model = load_model()

    yield

    # Cleanup hook for future resources.
    model = None

    logger.info("HillShield backend shutdown complete.")


# ============================================================
# FastAPI Application
# ============================================================

app = FastAPI(
    title="HillShield Disaster Intelligence API",
    description=(
        "AI-powered Flash Flood Prediction and "
        "Disaster Management backend."
    ),
    version="1.0.0",
    lifespan=lifespan,
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Model Prediction Logic
# ============================================================

def predict_flood_risk(
    rain: float,
    soil: float,
    river: float,
) -> tuple[int, float]:
    """
    Run inference using the already-loaded model.

    Expected model behavior:
        model.predict(...) -> class/risk level

    Optional:
        model.predict_proba(...) -> probability distribution

    Returns:
        (risk_level, risk_score)

    risk_level:
        0 = Low
        1 = Moderate
        2 = High
        3 = Critical
    """

    global model

    if model is None:
        raise RuntimeError("Flood model is not loaded.")

    # Keep feature order identical to the order used during training.
    features = np.array(
        [[rain, soil, river]],
        dtype=np.float32,
    )

    # --------------------------------------------------------
    # Risk Level
    # --------------------------------------------------------

    raw_prediction = model.predict(features)

    risk_level = int(np.asarray(raw_prediction).reshape(-1)[0])

    # --------------------------------------------------------
    # Risk Score
    # --------------------------------------------------------
    #
    # If the XGBoost model supports predict_proba(), convert
    # probabilities into a 0-100 risk score.
    #
    # Otherwise fall back to a simple class-based score.
    # --------------------------------------------------------

    risk_score = float(risk_level / 3.0 * 100.0)

    if hasattr(model, "predict_proba"):
        try:
            probabilities = model.predict_proba(features)

            probabilities = np.asarray(probabilities)

            if probabilities.ndim == 2 and probabilities.shape[0] > 0:
                class_probabilities = probabilities[0]

                # Weight classes 0,1,2,3 as increasing danger.
                weights = np.arange(len(class_probabilities))

                weighted_risk = float(
                    np.sum(class_probabilities * weights)
                    / max(len(class_probabilities) - 1, 1)
                )

                risk_score = weighted_risk * 100.0

        except Exception as exc:
            logger.warning(
                "predict_proba() unavailable or failed: %s",
                exc,
            )

    risk_score = max(0.0, min(100.0, risk_score))

    return risk_level, risk_score


# ============================================================
# Twilio Placeholder
# ============================================================

async def send_emergency_sms(
    phone_numbers: list[str],
    message: str,
) -> None:
    """
    PLACEHOLDER: Twilio integration.

    Later replace this with the real Twilio SDK/API.

    Example future flow:

        from twilio.rest import Client

        client = Client(
            os.environ["TWILIO_ACCOUNT_SID"],
            os.environ["TWILIO_AUTH_TOKEN"],
        )

        client.messages.create(
            body=message,
            from_=os.environ["TWILIO_PHONE_NUMBER"],
            to=phone_number,
        )
    """

    logger.warning(
        "TWILIO PLACEHOLDER -> recipients=%s | message=%s",
        phone_numbers,
        message,
    )


# ============================================================
# Bhashini Placeholder
# ============================================================

async def translate_with_bhashini(
    text: str,
    source_language: str,
    target_language: str,
) -> str:
    """
    PLACEHOLDER: Bhashini translation integration.

    Later:
        1. Authenticate with Bhashini.
        2. Send text to the translation pipeline.
        3. Receive translated output.
        4. Return translated text.

    This currently returns the original text.
    """

    logger.warning(
        "BHASHINI PLACEHOLDER -> %s -> %s | %s",
        source_language,
        target_language,
        text,
    )

    return text


# ============================================================
# Health Check
# ============================================================

@app.get("/health")
async def health_check() -> dict[str, Any]:
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "active_dashboard_connections": len(
            manager.active_connections
        ),
    }


# ============================================================
# Prediction Endpoint
# ============================================================

@app.post(
    "/api/predict",
    response_model=FloodPredictionResponse,
)
async def predict(
    payload: FloodPredictionRequest,
) -> FloodPredictionResponse:
    """
    Predict flash flood risk from:

        rain
        soil
        river

    If Risk Level == 3:
        - broadcast emergency WebSocket event
        - trigger Twilio placeholder
    """

    risk_level, risk_score = predict_flood_risk(
        rain=payload.rain,
        soil=payload.soil,
        river=payload.river,
    )

    emergency = risk_level == 3

    response = FloodPredictionResponse(
        risk_level=risk_level,
        risk_score=round(risk_score, 2),
        emergency=emergency,
    )

    # ========================================================
    # Emergency Event
    # ========================================================

    if emergency:
        alert = {
            "type": "EMERGENCY_ALERT",
            "risk_level": 3,
            "risk_score": round(risk_score, 2),
            "message": (
                "CRITICAL FLASH FLOOD RISK DETECTED. "
                "Begin emergency response and evacuation procedures."
            ),
            "sensor_data": {
                "rain": payload.rain,
                "soil": payload.soil,
                "river": payload.river,
            },
        }

        logger.critical(
            "RISK LEVEL 3 DETECTED | %s",
            alert,
        )

        # Send real-time emergency event to all connected dashboards.
        await manager.broadcast(alert)

        # Future Twilio integration.
        await send_emergency_sms(
            phone_numbers=[],
            message=alert["message"],
        )

    return response


# ============================================================
# Dashboard WebSocket
# ============================================================

@app.websocket("/ws/dashboard")
async def dashboard_websocket(websocket: WebSocket):
    """
    Persistent real-time connection for the HillShield dashboard.

    Frontend:
        ws://localhost:8000/ws/dashboard

    When /api/predict detects Risk Level 3,
    all connected clients receive:

        {
            "type": "EMERGENCY_ALERT",
            ...
        }
    """

    await manager.connect(websocket)

    try:
        # Send initial connection event.
        await websocket.send_json(
            {
                "type": "CONNECTION_ESTABLISHED",
                "message": "HillShield dashboard WebSocket connected.",
            }
        )

        while True:
            # Keep connection alive and optionally allow the client
            # to send future commands/heartbeats.
            message = await websocket.receive_text()

            if message.lower() == "ping":
                await websocket.send_json(
                    {
                        "type": "PONG",
                    }
                )

    except WebSocketDisconnect:
        await manager.disconnect(websocket)

    except Exception as exc:
        logger.exception(
            "WebSocket error: %s",
            exc,
        )
        await manager.disconnect(websocket)


# ============================================================
# Local Development Entry Point
# ============================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=True,
    )
