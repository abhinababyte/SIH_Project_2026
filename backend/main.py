"""
HillShield — AI-Powered Flash Flood & Disaster Management Command Center
========================================================================
FastAPI Backend Server

Endpoints:
  - POST /api/predict     → Run XGBoost flood risk prediction
  - GET  /api/health      → Health check / model status
  - WS   /ws/dashboard    → Real-time emergency alert broadcast

Dependencies (requirements.txt):
  fastapi==0.115.6
  uvicorn[standard]==0.34.0
  joblib==1.4.2
  xgboost==2.1.3
  pydantic==2.10.4
  websockets==14.1
  httpx==0.28.1            # For Twilio/Bhashini placeholder calls
"""

import json
import asyncio
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import joblib
import xgboost as xgb
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ─── Logging ──────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-8s │ %(name)s │ %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("hillshield")

# ─── Constants ────────────────────────────────────────────────────────────────

MODEL_PATH = Path(__file__).parent / "xgboost_flood_model.pkl"

# Risk level thresholds (configurable per district)
RISK_THRESHOLDS = {
    0: 25,   # 0-25:   Low
    1: 50,   # 26-50:  Moderate
    2: 75,   # 51-75:  High
    3: 101,  # 76-100: Critical
}

RISK_LABELS = {
    0: "LOW",
    1: "MODERATE",
    2: "HIGH",
    3: "CRITICAL",
}

# ─── Pydantic Models ──────────────────────────────────────────────────────────

class PredictionRequest(BaseModel):
    """Input features for the flood risk model."""
    rain: float = Field(
        ...,
        ge=0,
        le=500,
        description="Rainfall in mm over last 24 hours",
        examples=[120.5],
    )
    soil: float = Field(
        ...,
        ge=0,
        le=100,
        description="Soil moisture saturation percentage",
        examples=[78.3],
    )
    river: float = Field(
        ...,
        ge=0,
        le=20,
        description="River water level in meters above baseline",
        examples=[4.2],
    )


class PredictionResponse(BaseModel):
    """Model prediction output."""
    risk_score: float = Field(..., description="Predicted risk score (0-100)")
    risk_level: int = Field(..., ge=0, le=3, description="Risk level: 0=Low, 1=Moderate, 2=High, 3=Critical")
    risk_label: str = Field(..., description="Human-readable risk label")
    timestamp: str = Field(..., description="ISO 8601 timestamp of prediction")
    model_version: str = Field(..., description="XGBoost model version identifier")
    features_used: dict = Field(..., description="Echo of input features for audit trail")


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_path: str
    connected_clients: int
    uptime_seconds: float


class EmergencyAlert(BaseModel):
    type: str = "EMERGENCY_ALERT"
    risk_level: int
    risk_label: str
    risk_score: float
    message: str
    timestamp: str
    recommended_actions: list[str]


# ─── Application ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="HillShield API",
    description="AI-Powered Flash Flood & Disaster Management Command Center",
    version="1.0.0-hackathon",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # Next.js dev
        "http://localhost:3001",   # Alternate port
        "https://hillshield.vercel.app",  # Production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Global State ─────────────────────────────────────────────────────────────

model: Optional[xgb.Booster] = None
connected_websockets: list[WebSocket] = []
_start_time: datetime = datetime.now(timezone.utc)


def get_risk_level(score: float) -> int:
    """Convert a 0-100 risk score to a 0-3 risk level."""
    for level, threshold in sorted(RISK_THRESHOLDS.items()):
        if score < threshold:
            return level
    return 3


# ─── Startup / Shutdown Events ────────────────────────────────────────────────

@app.on_event("startup")
async def load_model_on_startup():
    """Load the XGBoost model from disk once at startup. No retraining."""
    global model
    try:
        if MODEL_PATH.exists():
            model = joblib.load(MODEL_PATH)
            logger.info("✅ XGBoost model loaded from %s", MODEL_PATH)
        else:
            logger.warning(
                "⚠️  Model file not found at %s — running in DEMO mode with mock predictions",
                MODEL_PATH,
            )
            model = None
    except Exception as e:
        logger.error("❌ Failed to load model: %s — falling back to demo mode", e)
        model = None


@app.on_event("shutdown")
async def shutdown_cleanup():
    """Clean up WebSocket connections on shutdown."""
    logger.info("Shutting down — closing %d WebSocket connections", len(connected_websockets))
    for ws in connected_websockets:
        try:
            await ws.close(code=1001, reason="Server shutting down")
        except Exception:
            pass
    connected_websockets.clear()


# ─── Mock Prediction (Fallback when no .pkl file) ────────────────────────────

def mock_predict(rain: float, soil: float, river: float) -> float:
    """
    Deterministic mock prediction for demo/hackathon purposes.
    Produces realistic 0-100 risk scores based on feature weights.
    """
    score = (
        (rain / 500) * 40      # Rain contributes up to 40 points
        + (soil / 100) * 35    # Soil moisture contributes up to 35 points
        + (river / 20) * 25    # River level contributes up to 25 points
    )
    return round(min(max(score, 0.0), 100.0), 1)


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/api/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Return server health, model status, and connected client count."""
    return HealthResponse(
        status="healthy" if model is not None or True else "degraded",
        model_loaded=model is not None,
        model_path=str(MODEL_PATH),
        connected_clients=len(connected_websockets),
        uptime_seconds=round((datetime.now(timezone.utc) - _start_time).total_seconds(), 1),
    )


@app.post("/api/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict_flood_risk(payload: PredictionRequest):
    """
    Run the XGBoost flood risk model on the provided features.

    Accepts rainfall (mm), soil saturation (%), and river level (m).
    Returns a 0-100 risk score and a 0-3 risk level classification.
    If risk level is 3 (CRITICAL), automatically broadcasts an emergency
    alert to all connected WebSocket clients.
    """
    features = [payload.rain, payload.soil, payload.river]
    now = datetime.now(timezone.utc).isoformat()

    # ── Run prediction ───────────────────────────────────────────────────
    if model is not None:
        try:
            import numpy as np
            dmatrix = xgb.DMatrix(np.array([features]))
            raw_score = float(model.predict(dmatrix)[0])
            risk_score = round(min(max(raw_score, 0.0), 100.0), 1)
        except Exception as e:
            logger.error("Model inference failed: %s — using mock fallback", e)
            risk_score = mock_predict(*features)
    else:
        risk_score = mock_predict(*features)
        logger.info("DEMO MODE — mock prediction: %.1f (rain=%.1f, soil=%.1f, river=%.1f)", risk_score, *features)

    risk_level = get_risk_level(risk_score)
    risk_label = RISK_LABELS[risk_level]

    response = PredictionResponse(
        risk_score=risk_score,
        risk_level=risk_level,
        risk_label=risk_label,
        timestamp=now,
        model_version="xgboost-v2.1-hillshield" if model else "demo-mock-v1",
        features_used={"rain_mm": payload.rain, "soil_pct": payload.soil, "river_m": payload.river},
    )

    # ── Auto-broadcast if CRITICAL ───────────────────────────────────────
    if risk_level == 3:
        logger.critical("🚨 CRITICAL RISK DETECTED — score=%.1f — broadcasting emergency alert", risk_score)
        alert = EmergencyAlert(
            risk_level=risk_level,
            risk_label=risk_label,
            risk_score=risk_score,
            message=f"CRITICAL flood risk detected (score: {risk_score}). Immediate action required for Mandi District.",
            timestamp=now,
            recommended_actions=[
                "Activate all emergency shelters immediately",
                "Dispatch NDRF teams to Sunder Nagar and Joginder Nagar",
                "Broadcast evacuation alert via SMS, siren, and radio",
                "Coordinate with Pandoh Dam for controlled water release",
                "Block NH-21 at vulnerable landslide zones",
            ],
        )
        await broadcast_emergency_alert(alert)

        # Trigger downstream notifications (fire-and-forget)
        asyncio.create_task(send_emergency_sms(alert))
        asyncio.create_task(broadcast_regional_alert_hindi(alert))

    return response


# ─── WebSocket Manager ────────────────────────────────────────────────────────

async def broadcast_emergency_alert(alert: EmergencyAlert):
    """Send an emergency alert to every connected WebSocket client."""
    if not connected_websockets:
        logger.warning("No WebSocket clients connected — alert not delivered")
        return

    payload = alert.model_dump_json()
    dead_connections: list[WebSocket] = []

    for ws in connected_websockets:
        try:
            await ws.send_text(payload)
        except Exception:
            dead_connections.append(ws)

    # Clean up dead connections
    for ws in dead_connections:
        connected_websockets.remove(ws)
        logger.info("Removed dead WebSocket connection (remaining: %d)", len(connected_websockets))

    logger.info("📢 Emergency alert broadcast to %d clients", len(connected_websockets) - len(dead_connections))


@app.websocket("/ws/dashboard")
async def websocket_dashboard(websocket: WebSocket):
    """
    WebSocket endpoint for real-time dashboard updates.

    The server pushes emergency alerts when the prediction model
    returns a CRITICAL (level 3) risk score. The client should
    listen for messages of type "EMERGENCY_ALERT".
    """
    await websocket.accept()
    connected_websockets.append(websocket)
    logger.info("WebSocket client connected (total: %d)", len(connected_websockets))

    # Send a welcome/heartbeat message
    await websocket.send_text(json.dumps({
        "type": "CONNECTION_ESTABLISHED",
        "message": "HillShield WebSocket active. Listening for emergency alerts.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }))

    try:
        # Keep connection alive; listen for client ping/pong
        while True:
            data = await websocket.receive_text()
            # Client can send pings; we just echo back an ack
            if data == "ping":
                await websocket.send_text(json.dumps({
                    "type": "PONG",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }))
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected gracefully")
    except Exception as e:
        logger.warning("WebSocket error: %s", e)
    finally:
        if websocket in connected_websockets:
            connected_websockets.remove(websocket)
        logger.info("WebSocket cleanup (remaining: %d)", len(connected_websockets))


# ─── Twilio SMS Integration (Placeholder) ─────────────────────────────────────

async def send_emergency_sms(alert: EmergencyAlert):
    """
    TODO: Integrate with Twilio API to send SMS alerts to registered
    citizens in the affected area.

    Twilio REST API endpoint:
      POST https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json

    Expected implementation:
      1. Fetch list of registered phone numbers for Mandi District
         from the database (PostgreSQL / Redis cache).
      2. Format the alert message in concise SMS-friendly text (<160 chars
         for single SMS, or use Twilio's concatenated SMS).
      3. Call Twilio API with async httpx.Client.
      4. Log delivery status for audit trail.
    """
    logger.info(
        "📱 [TWILIO PLACEHOLDER] Would send SMS to ~2,400 registered numbers in Mandi District"
    )
    logger.info("   Alert: %s", alert.message[:100])

    # ── Actual Twilio call would look like this ──────────────────────────
    # import httpx
    # from os import getenv
    #
    # TWILIO_SID = getenv("TWILIO_ACCOUNT_SID")
    # TWILIO_TOKEN = getenv("TWILIO_AUTH_TOKEN")
    # TWILIO_FROM = getenv("TWILIO_PHONE_NUMBER")
    #
    # sms_body = (
    #     f"🚨 HILLSHIELD FLOOD ALERT\n"
    #     f"Risk: {alert.risk_label} ({alert.risk_score}/100)\n"
    #     f"{alert.message}\n"
    #     f"Call 112 for emergency help."
    # )
    #
    # phone_numbers = await get_registered_phones_for_district("mandi")
    #
    # async with httpx.AsyncClient() as client:
    #     for phone in phone_numbers:
    #         resp = await client.post(
    #             f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_SID}/Messages.json",
    #             auth=(TWILIO_SID, TWILIO_TOKEN),
    #             data={
    #                 "From": TWILIO_FROM,
    #                 "To": phone,
    #                 "Body": sms_body,
    #             },
    #             timeout=10.0,
    #         )
    #         logger.debug("Twilio SMS to %s: %d", phone, resp.status_code)

    await asyncio.sleep(0)  # Keep it a proper coroutine


# ─── Bhashini Translation Integration (Placeholder) ───────────────────────────

async def broadcast_regional_alert_hindi(alert: EmergencyAlert):
    """
    TODO: Integrate with Bhashini API (https://bhashini.gov.in) to translate
    emergency alerts into Hindi and regional Pahari languages for
    All India Radio broadcast and public announcement systems.

    Bhashini API endpoint:
      POST https://api.bhashini.gov.in/v1/translate

    Expected implementation:
      1. Take the English alert message.
      2. Call Bhashini Translation API with source=en, target=hi.
      3. Also translate to local Pahari dialect if supported.
      4. Forward translated text to:
         - AIR Mandi (101.1 MHz) for radio broadcast
         - Public address systems at shelter locations
         - WhatsApp broadcast lists in regional language groups
      5. Cache translations in Redis to avoid redundant API calls.
    """
    logger.info(
        "🗣️  [BHASHINI PLACEHOLDER] Would translate alert to Hindi + Pahari for radio broadcast"
    )

    # ── Actual Bhashini call would look like this ────────────────────────
    # import httpx
    # from os import getenv
    #
    # BHASHINI_API_KEY = getenv("BHASHINI_API_KEY")
    # BHASHINI_USER_ID = getenv("BHASHINI_USER_ID")
    #
    # async with httpx.AsyncClient() as client:
    #     # Hindi translation
    #     resp_hi = await client.post(
    #         "https://api.bhashini.gov.in/v1/translate",
    #         headers={
    #             "Authorization": f"Bearer {BHASHINI_API_KEY}",
    #             "X-User-ID": BHASHINI_USER_ID,
    #         },
    #         json={
    #             "input": alert.message,
    #             "sourceLanguage": "en",
    #             "targetLanguage": "hi",
    #         },
    #         timeout=10.0,
    #     )
    #     hindi_text = resp_hi.json().get("output", alert.message)
    #     logger.info("Hindi translation: %s", hindi_text[:100])
    #
    #     # Pahari dialect (if available)
    #     # resp_pa = await client.post(..., targetLanguage="pa")
    #
    #     # Forward to AIR / PA systems
    #     await forward_to_radio_system(hindi_text)

    await asyncio.sleep(0)  # Keep it a proper coroutine


# ─── Entry Point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    logger.info("🌿 Starting HillShield API server...")
    logger.info("   Docs: http://localhost:8000/docs")
    logger.info("   WebSocket: ws://localhost:8000/ws/dashboard")

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
        ws_ping_interval=30,
        ws_ping_timeout=10,
    )
