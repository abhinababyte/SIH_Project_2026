from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import joblib
import pandas as pd
import json

from app.routes import auth
from app.database import models, schemas
from app.database.db import engine, get_db

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="HillShield Backend Engine")

# NOTE: allow_credentials=True cannot be used with allow_origins=["*"].
# Set specific origins or use allow_origin_regex for development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load ML Model
model = None
try:
    model = joblib.load('./app/models/xgboost_flood_model.pkl')
    print("ML Model loaded successfully.")
except Exception as e:
    print(f"Warning: Could not load ML model: {e}")


# WebSockets manager with auto-cleanup for dead sockets
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        
        # Remove any connections that failed during send
        for conn in disconnected:
            self.disconnect(conn)


manager = ConnectionManager()


@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(
        (models.User.email == user.email) | (models.User.phone_number == user.phone_number)
    ).first()
    
    if db_user:
        raise HTTPException(status_code=400, detail="Email or phone already registered")
    
    try:
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
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/api/auth/login")
def login_user(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(
        (models.User.email == user.identifier) | (models.User.phone_number == user.identifier)
    ).first()
    
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


def _save_telemetry_sync(db: Session, data: schemas.TelemetryData, risk_score: float):
    """Encapsulates blocking SQLAlchemy calls for threadpool execution."""
    telemetry = models.TelemetryLog(
        sensor_id=data.sensor_id,
        rain_1h_mm=data.rain_1h_mm,
        soil_moisture_pct=data.soil_moisture_pct,
        river_water_level_m=data.river_water_level_m,
        prediction_risk_score=risk_score
    )
    try:
        db.add(telemetry)
        db.commit()
        db.refresh(telemetry)
        return telemetry
    except Exception:
        db.rollback()
        raise


@app.post("/api/telemetry")
async def receive_telemetry(data: schemas.TelemetryData, db: Session = Depends(get_db)):
    # 1. Run ML Prediction if model exists
    risk_score = 0.0
    if model:
        try:
            df = pd.DataFrame([{
                'Rainfall_1hr': data.rain_1h_mm,
                'Soil_Moisture': data.soil_moisture_pct,
                'River_Level': data.river_water_level_m
            }])
            # Run prediction in a threadpool to prevent CPU blocking on event loop
            prediction = await run_in_threadpool(model.predict, df)
            risk_score = float(prediction[0])
        except Exception as e:
            print(f"ML Prediction Error: {e}")
            risk_score = -1.0
    
    # 2. Save to DB in threadpool (avoids blocking the async loop)
    try:
        await run_in_threadpool(_save_telemetry_sync, db, data, risk_score)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record telemetry: {str(e)}")
    
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
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
