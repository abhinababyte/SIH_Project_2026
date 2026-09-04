"""
HillShield - Flash Flood & Disaster
Management Command Center
Backend API: risk prediction, live
dashboard broadcasting, and
downstream alert dispatch (SMS + regional language translation).
"""
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Tuple

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("hillshield")

MODEL_PATH = Path(__file__).parent / "xgboost_flood_model.pkl"

# ---------------------------------------------------------------------------
# Model container
# ---------------------------------------------------------------------------
class FloodModel:
    """Wraps the trained XGBoost model so
    the rest of the app doesn't care
    whether it loaded successfully or we
    fell back to a rule-based stand-in
    (keeps the demo alive even if the .pkl
    isn't present on stage)."""
    
    def __init__(self):
        self.model = None
        self.is_fallback = True
        
    def load(self):
        if MODEL_PATH.exists():
            self.model = joblib.load(MODEL_PATH)
            self.is_fallback = False
            logger.info("Loaded XGBoost model from %s", MODEL_PATH)
        else:
            self.is_fallback = True
            logger.warning(
                "%s not found - using a rule-based fallback so the demo "
                "keeps working. Drop the trained .pkl next to main.py to "
                "use the real model.",
                MODEL_PATH.name,
            )
            
    def predict(self, rain: float, soil: float, river: float) -> Tuple[int, float]:
        """Returns (risk_level 0-3, risk_score 0-100)."""
        features = np.array([[rain, soil, river]])
        
        if self.model is not None:
            risk_level = int(self.model.predict(features)[0])
            if hasattr(self.model, "predict_proba"):
                proba = self.model.predict_proba(features)[0]
                risk_score = float(np.max(proba) * 100)
            else:
                risk_score = risk_level / 3 * 100
            risk_score = max(0.0, min(100.0, risk_score))
            return risk_level, round(risk_score, 1)
            
        # Fallback heuristic - mirrors the frontend What-If Simulator logic
        # so a missing .pkl never breaks the live demo.
        risk_score = min(100.0, (rain * 0.45) + (soil * 0.35) + (river * 0.35))
        if risk_score >= 75:
            risk_level = 3
        elif risk_score >= 50:
            risk_level = 2
        elif risk_score >= 25:
            risk_level = 1
        else:
            risk_level = 0
            
        return risk_level, round(risk_score, 1)

flood_model = FloodModel()

# ---------------------------------------------------------------------------
# WebSocket connection manager
# ---------------------------------------------------------------------------
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(
            "Dashboard client connected (%d total)", len(self.active_connections)
        )
        
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(
            "Dashboard client disconnected (%d total)", len(self.active_connections)
        )
        
    async def broadcast(self, payload: dict):
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_json(payload)
            except Exception:
                dead_connections.append(connection)
                
        for connection in dead_connections:
            self.disconnect(connection)

manager = ConnectionManager()

# ---------------------------------------------------------------------------
# App lifecycle
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    flood_model.load()
    yield
    logger.info("Shutting down HillShield backend")

app = FastAPI(title="HillShield Command Center API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # add your deployed frontend URL too
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class PredictionRequest(BaseModel):
    rain: float = Field(..., ge=0, le=100, description="Rainfall intensity, 0-100")
    soil: float = Field(..., ge=0, le=100, description="Soil saturation, 0-100")
    river: float = Field(..., ge=0, le=100, description="River level, 0-100")
    location: str = Field(default="Unspecified sector")

class PredictionResponse(BaseModel):
    risk_level: int
    risk_score: float
    label: str
    is_fallback_model: bool
    timestamp: str

RISK_LABELS = {0: "Low", 1: "Moderate", 2: "High", 3: "Critical"}

# ---------------------------------------------------------------------------
# Placeholder downstream integrations
# ---------------------------------------------------------------------------
async def send_emergency_sms(location: str, message: str) -> None:
    """
    TODO: Wire up Twilio here.
    from twilio.rest import Client
    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    client.messages.create(
        body=message,
        from_=TWILIO_FROM_NUMBER,
        to=resident_number,   # loop over subscribers in `location`
    )
    """
    logger.info("[Twilio stub] Would SMS residents in %s: %s", location, message)

async def translate_alert(message: str, target_language: str = "ta") -> str:
    """
    TODO: Wire up Bhashini here for regional-language translation
    (e.g. Tamil "ta", Kannada "kn", Hindi "hi") before the SMS/voice
    call goes out.
    response = requests.post(BHASHINI_ENDPOINT, json={
        "input": [{"source": message}],
        "config": {
            "language": {"sourceLanguage": "en", "targetLanguage": target_language}
        },
    })
    return response.json()["output"][0]["target"]
    """
    logger.info(
        "[Bhashini stub] Would translate to '%s': %s", target_language, message
    )
    return message  # unchanged until the real integration is wired in

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/")
async def root():
    return {"service": "HillShield Command Center API", "status": "online"}

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": flood_model.model is not None,
        "using_fallback": flood_model.is_fallback,
    }

@app.post("/api/predict", response_model=PredictionResponse)
async def predict(payload: PredictionRequest):
    try:
        risk_level, risk_score = flood_model.predict(
            payload.rain, payload.soil, payload.river
        )
    except Exception as exc:
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}")
        
    response = PredictionResponse(
        risk_level=risk_level,
        risk_score=risk_score,
        label=RISK_LABELS.get(risk_level, "Unknown"),
        is_fallback_model=flood_model.is_fallback,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
    
    # Level 3 = critical. Push it straight to every connected dashboard and
    # kick off the citizen-alert pipeline.
    if risk_level == 3:
        alert_message = (
            f"CRITICAL flood risk detected near {payload.location}. "
            "Evacuate to higher ground immediately."
        )
        translated = await translate_alert(alert_message)
        
        await manager.broadcast(
            {
                "type": "EMERGENCY_ALERT",
                "risk_level": risk_level,
                "risk_score": risk_score,
                "location": payload.location,
                "message": alert_message,
                "timestamp": response.timestamp,
            }
        )
        
        await send_emergency_sms(payload.location, translated)
        
    return response

@app.websocket("/ws/dashboard")
async def dashboard_socket(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # The dashboard doesn't need to send anything, but keeping the
            # receive loop alive lets us detect disconnects promptly.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
