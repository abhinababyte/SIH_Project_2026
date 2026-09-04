# main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
from typing import List, Dict, Any
import asyncio
import json

# ------------------------------
# Pydantic Models
# ------------------------------
class PredictRequest(BaseModel):
    rain: float
    soil: float
    river: float

class PredictResponse(BaseModel):
    risk_level: int          # 0,1,2,3 (3 = highest)
    probability: float       # flood probability
    message: str

# ------------------------------
# FastAPI App Initialization
# ------------------------------
app = FastAPI(title="HillShield Backend", version="1.0.0")

# CORS (allow your Next.js frontend origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Update with your actual frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------
# Global Variables
# ------------------------------
model = None
# Simulate an in‑memory storage for active WebSocket connections
active_connections: List[WebSocket] = []

# ------------------------------
# Dummy API Integrations (Twilio & Bhashini)
# ------------------------------
def send_sms_alert(phone_number: str, message: str):
    """
    Placeholder for Twilio SMS integration.
    In production, use Twilio's Python SDK:
        from twilio.rest import Client
        client = Client(account_sid, auth_token)
        client.messages.create(...)
    """
    print(f"[Twilio] Sending SMS to {phone_number}: {message}")

def translate_text(text: str, target_language: str) -> str:
    """
    Placeholder for Bhashini translation API.
    In production, call Bhashini's REST API or use their SDK.
    """
    # For now, just return original text
    print(f"[Bhashini] Translating to {target_language}: {text[:50]}...")
    return text

# ------------------------------
# Startup Event: Load ML Model
# ------------------------------
@app.on_event("startup")
async def load_model():
    global model
    try:
        # Load the pre‑trained XGBoost model from .pkl file
        model = joblib.load("xgboost_flood_model.pkl")
        print("✅ XGBoost model loaded successfully.")
    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        model = None

# ------------------------------
# Helper: Predict risk from model
# ------------------------------
def predict_risk(rain: float, soil: float, river: float) -> tuple[int, float]:
    """
    Uses the loaded model to predict risk level and probability.
    Assumes the model expects features [rain, soil, river] and returns
    either a probability (for binary classification) or a class.
    We convert to risk levels 0‑3.
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    # Prepare features (2D array)
    features = np.array([[rain, soil, river]])

    # Try to get probability if model supports predict_proba
    try:
        proba = model.predict_proba(features)[0]
        flood_probability = float(proba[1]) if len(proba) > 1 else float(proba[0])
    except AttributeError:
        # Fallback: model only has predict
        raw_pred = model.predict(features)[0]
        # Assume binary output 0 or 1
        flood_probability = float(raw_pred)

    # Map probability to risk level (custom thresholds)
    if flood_probability >= 0.75:
        risk_level = 3
    elif flood_probability >= 0.5:
        risk_level = 2
    elif flood_probability >= 0.25:
        risk_level = 1
    else:
        risk_level = 0

    return risk_level, flood_probability

# ------------------------------
# POST /api/predict
# ------------------------------
@app.post("/api/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    try:
        risk_level, proba = predict_risk(request.rain, request.soil, request.river)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

    messages = {
        0: "No significant flood risk.",
        1: "Low flood risk. Monitor conditions.",
        2: "Moderate flood risk. Prepare for possible evacuation.",
        3: "High flood risk! Evacuation recommended.",
    }
    return PredictResponse(
        risk_level=risk_level,
        probability=round(proba, 4),
        message=messages[risk_level],
    )

# ------------------------------
# WebSocket /ws/dashboard
# ------------------------------
@app.websocket("/ws/dashboard")
async def dashboard_websocket(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    print(f"🔌 WebSocket connected: {websocket.client.host}")

    try:
        while True:
            # Receive any message from the client (if needed)
            data = await websocket.receive_text()
            # Parse and maybe trigger a prediction
            try:
                payload = json.loads(data)
                if "rain" in payload and "soil" in payload and "river" in payload:
                    # The frontend can send real‑time sensor data via WebSocket
                    risk_level, proba = predict_risk(
                        float(payload["rain"]),
                        float(payload["soil"]),
                        float(payload["river"]),
                    )
                    # If risk level is 3, broadcast emergency alert to all connected clients
                    if risk_level == 3:
                        alert = {
                            "type": "emergency_alert",
                            "risk_level": 3,
                            "message": "🚨 High flood risk detected! Take immediate action.",
                            "timestamp": asyncio.get_event_loop().time(),
                        }
                        # Broadcast to all active connections
                        for connection in active_connections:
                            try:
                                await connection.send_text(json.dumps(alert))
                            except:
                                pass  # ignore broken connections
                    else:
                        # Optionally send back the prediction
                        response = {
                            "type": "prediction",
                            "risk_level": risk_level,
                            "probability": proba,
                        }
                        await websocket.send_text(json.dumps(response))
            except Exception as e:
                # Send error message
                await websocket.send_text(json.dumps({"type": "error", "detail": str(e)}))

    except WebSocketDisconnect:
        active_connections.remove(websocket)
        print(f"🔌 WebSocket disconnected: {websocket.client.host}")

# ------------------------------
# Root endpoint
# ------------------------------
@app.get("/")
async def root():
    return {"status": "HillShield backend running", "model_loaded": model is not None}
