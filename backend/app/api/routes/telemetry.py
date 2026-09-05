from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.ml.predictor import predictor
from app.schemas.telemetry import TelemetryData
from app.services.telemetry import save_telemetry
from app.ws.manager import manager

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])


@router.post("")
async def receive_telemetry(data: TelemetryData, db: Session = Depends(get_db)):
    risk_score = await predictor.predict_risk_score(data)

    try:
        await save_telemetry(db, data, risk_score)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record telemetry: {str(e)}")

    await manager.broadcast({
        "event": "TELEMETRY_UPDATE",
        "sensor_id": data.sensor_id,
        "rain_1h_mm": data.rain_1h_mm,
        "soil_moisture_pct": data.soil_moisture_pct,
        "river_water_level_m": data.river_water_level_m,
        "risk_score": risk_score,
    })

    return {"status": "success", "prediction": risk_score}
