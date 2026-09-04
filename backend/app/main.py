from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd
import json

from . import models, schemas, auth
from .database import engine, get_db

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="HillShield Backend Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load ML Model
model = None
try:
    # Attempt to load the pre-trained model from the models directory
    model = joblib.load('../models/xgboost_flood_model.pkl')
    print("ML Model loaded successfully.")
except Exception as e:
    print(f"Warning: Could not load ML model: {e}")

# WebSockets manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()


@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter((models.User.email == user.email) | (models.User.phone_number == user.phone_number)).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email or phone already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        full_name=user.full_name,
        email=user.email,
        phone_number=user.phone_number,
        hashed_password=hashed_password,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.post("/api/auth/login")
def login_user(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter((models.User.email == user.identifier) | (models.User.phone_number == user.identifier)).first()
    if not db_user:
        print(f"Login failed: user not found for identifier '{user.identifier}'")
    if db_user and not auth.verify_password(user.password, db_user.hashed_password):
        print(f"Login failed: password mismatch for user '{user.identifier}'")
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "access_token": "fake-jwt-token-for-now",
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "full_name": db_user.full_name,
            "role": db_user.role
        }
    }


@app.post("/api/telemetry")
async def receive_telemetry(data: schemas.TelemetryData, db: Session = Depends(get_db)):
    # 1. Run ML Prediction if model exists
    risk_score = 0.0
    if model:
        try:
            # We construct a dataframe matching training features
            # This is a simplified representation. Actual features depend on notebook.
            df = pd.DataFrame([{
                'Rainfall_1hr': data.rain_1h_mm,
                'Soil_Moisture': data.soil_moisture_pct,
                'River_Level': data.river_water_level_m
            }])
            # Make prediction
            prediction = model.predict(df)
            risk_score = float(prediction[0])
        except Exception as e:
            print(f"ML Prediction Error: {e}")
            risk_score = -1.0
    
    # 2. Save to DB
    telemetry = models.TelemetryLog(
        sensor_id=data.sensor_id,
        rain_1h_mm=data.rain_1h_mm,
        soil_moisture_pct=data.soil_moisture_pct,
        river_water_level_m=data.river_water_level_m,
        prediction_risk_score=risk_score
    )
    db.add(telemetry)
    db.commit()
    
    # 3. Broadcast to all connected frontends via WebSocket
    broadcast_data = {
        "event": "TELEMETRY_UPDATE",
        "sensor_id": data.sensor_id,
        "rain_1h_mm": data.rain_1h_mm,
        "soil_moisture_pct": data.soil_moisture_pct,
        "river_water_level_m": data.river_water_level_m,
        "risk_score": risk_score
    }
    await manager.broadcast(broadcast_data)
    
    return {"status": "success", "prediction": risk_score}


@app.websocket("/ws/dashboard")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # wait for messages if frontend wants to send any
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
