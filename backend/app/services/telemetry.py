from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from app.models.telemetry import TelemetryLog
from app.schemas.telemetry import TelemetryData


def _save_telemetry_sync(db: Session, data: TelemetryData, risk_score: float) -> TelemetryLog:
    """Encapsulates blocking SQLAlchemy calls for threadpool execution."""
    telemetry = TelemetryLog(
        sensor_id=data.sensor_id,
        rain_1h_mm=data.rain_1h_mm,
        soil_moisture_pct=data.soil_moisture_pct,
        river_water_level_m=data.river_water_level_m,
        prediction_risk_score=risk_score,
    )
    try:
        db.add(telemetry)
        db.commit()
        db.refresh(telemetry)
        return telemetry
    except Exception:
        db.rollback()
        raise


async def save_telemetry(db: Session, data: TelemetryData, risk_score: float) -> TelemetryLog:
    return await run_in_threadpool(_save_telemetry_sync, db, data, risk_score)
