from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import joblib
import pandas as pd
import numpy as np

import shap
import uuid
import json

from app.routes import auth
from app.routes import bhashini
from app.database import models, schemas
from app.database.db import engine, get_db

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="HillShield Backend Engine")
app.include_router(bhashini.router)

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



def engineer_features(data):
    df = pd.DataFrame([{
        'Rain_1h_mm': data.rain_1h_mm,
        'Rain_3h_mm': data.rain_1h_mm * 2.5,
        'Rain_24h_mm': data.rain_1h_mm * 8.0,
        'Forecast_Rain_3h_mm': data.rain_1h_mm * 2.0,
        'Soil_Moisture_Pct': data.soil_moisture_pct,
        'Slope_Deg': 15.0,
        'Elevation_m': 500.0,
        'Distance_to_River_m': 100.0,
        'Land_Cover_Type': 1,
        'Flow_Accumulation': 1000.0,
        'River_Water_Level_m': data.river_water_level_m,
    }])
    
    df['Is_Rain_Sentinel'] = df['Rain_1h_mm'].isna().astype(int)
    df['Is_River_Sentinel'] = df['River_Water_Level_m'].isna().astype(int)
    df['Is_Forecast_Sentinel'] = df['Forecast_Rain_3h_mm'].isna().astype(int)
    
    slope_rad = np.radians(df['Slope_Deg'].clip(lower=0.1))
    df['TWI'] = np.log((df['Flow_Accumulation'] + 1) / np.tan(slope_rad))
    
    df['River_Proximity_Score'] = 1 / (df['Distance_to_River_m'] + 10)
    df['Steepness_Danger'] = df['Slope_Deg'] * df['River_Proximity_Score']
    
    df['Storm_Trend'] = df['Forecast_Rain_3h_mm'] / (df['Rain_3h_mm'] + 1)
    df['Rain_Burst_Ratio'] = df['Rain_1h_mm'] / (df['Rain_3h_mm'] + 1)
    
    df['Soil_Deficit'] = 100 - df['Soil_Moisture_Pct']
    df['Runoff_Acceleration'] = df['Rain_1h_mm'] / (df['Soil_Deficit'] + 10)
    
    df['River_Rain1'] = df['River_Water_Level_m'] * df['Rain_1h_mm']
    df['Doorstep_Threat'] = df['River_Water_Level_m'] * df['River_Proximity_Score']
    
    expected_cols = [
        'Rain_1h_mm', 'Rain_3h_mm', 'Rain_24h_mm', 'Forecast_Rain_3h_mm', 
        'Soil_Moisture_Pct', 'Slope_Deg', 'Elevation_m', 'Distance_to_River_m', 
        'Land_Cover_Type', 'Flow_Accumulation', 'River_Water_Level_m', 
        'Is_Rain_Sentinel', 'Is_River_Sentinel', 'Is_Forecast_Sentinel', 
        'TWI', 'River_Proximity_Score', 'Steepness_Danger', 'Storm_Trend', 
        'Rain_Burst_Ratio', 'Soil_Deficit', 'Runoff_Acceleration', 
        'River_Rain1', 'Doorstep_Threat'
    ]
    return df[expected_cols]

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
            df = engineer_features(data)
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



@app.post("/api/predict/explain")
async def explain_prediction(data: schemas.TelemetryData):
    if not model:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    df = engineer_features(data)
    
    try:
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(df)
        
        # Handle multi-class XGBoost SHAP output (1 row, 23 features, 4 classes)
        # We take class index 3 (High Risk) for our explanation
        base_value = float(explainer.expected_value[3])
        vals = shap_values[0, :, 3]
        
        feature_importance = {
            "Rainfall_1hr": float(vals[0]),
            "Soil_Moisture": float(vals[4]),
            "River_Level": float(vals[10])
        }
        
        return {
            "status": "success",
            "base_value": base_value,
            "feature_impacts": feature_importance,
            "explanation": "Positive values push towards flood prediction. Negative values mean safety."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/incidents", response_model=list[schemas.IncidentResponse])
def get_incidents(db: Session = Depends(get_db)):
    return db.query(models.Incident).all()

@app.post("/api/incidents/escalate", response_model=schemas.IncidentResponse)
async def escalate_incident(incident: schemas.IncidentCreate, db: Session = Depends(get_db)):
    db_incident = models.Incident(
        id=str(uuid.uuid4()),
        title=incident.title,
        location=incident.location,
        priority=incident.priority,
        status="detected"
    )
    db.add(db_incident)
    db.commit()
    db.refresh(db_incident)
    
    await manager.broadcast({
        "event": "INCIDENT_ESCALATED",
        "incident": {
            "id": db_incident.id,
            "title": db_incident.title,
            "location": db_incident.location,
            "priority": db_incident.priority,
            "status": db_incident.status,
            "timestamp": str(db_incident.timestamp)
        }
    })
    return db_incident

@app.post("/api/incidents/{incident_id}/acknowledge")
async def acknowledge_incident(incident_id: str, db: Session = Depends(get_db)):
    db_incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not db_incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    db_incident.status = "acknowledged"
    db.commit()
    db.refresh(db_incident)
    
    await manager.broadcast({
        "event": "INCIDENT_ACKNOWLEDGED",
        "incident_id": incident_id
    })
    return {"status": "success", "incident_id": incident_id}


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

