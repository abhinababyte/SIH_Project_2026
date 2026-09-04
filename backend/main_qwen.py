import json
import logging
from contextlib import asynccontextmanager
from typing import List, Dict, Any

import joblib
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- Configuration & Logging ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Pydantic Models ---
class PredictionRequest(BaseModel):
    rain: float
    soil: float
    river: float

# --- WebSocket Connection Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"Client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except WebSocketDisconnect:
                self.disconnect(connection)

manager = ConnectionManager()

# --- Dummy External API Integrations ---
def send_twilio_sms(phone_number: str, message: str):
    """Placeholder for Twilio SMS API integration."""
    logger.info(f"[TWILIO DUMMY] Sending SMS to {phone_number}: {message}")
    # Real implementation:
    # client = Client(os.getenv("TWILIO_SID"), os.getenv("TWILIO_AUTH"))
    # client.messages.create(body=message, from_='+1234567890', to=phone_number)
    return True

def translate_with_bhashini(text: str, target_lang: str):
    """Placeholder for Bhashini Translation API integration."""
    logger.info(f"[BHASHINI DUMMY] Translating '{text}' to {target_lang}")
    # Real implementation:
    # payload = {"input": [{"source": text}], "config": {"language": {"sourceLanguage": "en", "targetLanguage": target_lang}}}
    # response = requests.post(BHASHINI_API_URL, json=payload, headers=headers)
    return f"[Translated to {target_lang}]: {text}"

# --- FastAPI App & Lifespan ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load the XGBoost model into memory
    try:
        # Ensure xgboost_flood_model.pkl is in the same directory or provide absolute path
        app.state.model = joblib.load("xgboost_flood_model.pkl")
        logger.info("✅ XGBoost Flood Model loaded successfully into memory.")
    except Exception as e:
        logger.error(f"❌ Failed to load model: {e}")
        # Fallback dummy model for development if .pkl is missing
        app.state.model = None 
        
    yield
    # Shutdown: Cleanup if necessary
    logger.info("Shutting down HillShield Backend...")

app = FastAPI(
    title="HillShield AI Backend",
    description="Real-time Flash Flood Prediction & Disaster Management API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS for Next.js Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Endpoints ---

@app.post("/api/predict")
async def predict_flood_risk(request: PredictionRequest):
    """
    Accepts sensor data and returns a risk level (0-3).
    0: Safe, 1: Watch, 2: Warning, 3: EMERGENCY (Broadcasts to WS)
    """
    features = np.array([[request.rain, request.soil, request.river]])
    
    # Mock prediction logic (Replace with actual model.predict when .pkl is ready)
    if app.state.model:
        # Assuming model outputs a class 0-3
        risk_level = int(app.state.model.predict(features)[0])
    else:
        # Fallback mock logic for hackathon demo
        total_score = request.rain + request.soil + request.river
        if total_score > 250: risk_level = 3
        elif total_score > 150: risk_level = 2
        elif total_score > 50: risk_level = 1
        else: risk_level = 0

    response_data = {
        "risk_level": risk_level,
        "rain_mm": request.rain,
        "soil_moisture": request.soil,
        "river_level": request.river,
        "status": "CRITICAL" if risk_level == 3 else "NORMAL"
    }

    # If Risk Level is 3 (Emergency), trigger WebSocket broadcast & external APIs
    if risk_level == 3:
        alert_payload = {
            "type": "EMERGENCY_ALERT",
            "message": "CRITICAL: Flash flood imminent. Immediate evacuation required!",
            "data": response_data
        }
        
        # 1. Broadcast to all connected dashboards
        await manager.broadcast(alert_payload)
        
        # 2. Trigger SMS via Twilio (Dummy)
        send_twilio_sms("+919999999999", alert_payload["message"])
        
        # 3. Translate and send regional alerts via Bhashini (Dummy)
        translated_msg = translate_with_bhashini(alert_payload["message"], "hi")
        send_twilio_sms("+919999999998", translated_msg)

    return response_data

@app.websocket("/ws/dashboard")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time dashboard updates.
    """
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and listen for client pings/messages if needed
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
