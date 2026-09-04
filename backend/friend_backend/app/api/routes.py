"""Versioned API routes."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..ml_service import generate_alert_if_needed, predict_risk
from ..models import Alert, Location, SensorData
from ..schemas import AlertResponse, PredictionResponse, SensorDataResponse, SensorIngestRequest

router = APIRouter(prefix="/api/v1", tags=["flood-risk"])


def _latest_sensor(db: Session, location_id: int) -> SensorData | None:
    return db.scalar(
        select(SensorData)
        .where(SensorData.location_id == location_id)
        .order_by(SensorData.timestamp.desc())
        .limit(1)
    )


@router.post("/ingest", response_model=PredictionResponse, status_code=status.HTTP_201_CREATED)
def ingest_sensor_data(payload: SensorIngestRequest, db: Session = Depends(get_db)) -> PredictionResponse:
    """Persist a sensor observation, calculate risk, and generate an alert when warranted."""
    location = db.get(Location, payload.location_id)
    if location is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")

    sensor = SensorData(**payload.model_dump())
    db.add(sensor)
    db.flush()
    result = predict_risk(sensor)
    alert = generate_alert_if_needed(db, location, sensor, result)
    db.commit()
    db.refresh(sensor)
    if alert:
        db.refresh(alert)

    return PredictionResponse(
        location_id=location.id,
        risk_level=result.risk_level,
        flood_risk_score=result.score,
        estimated_lead_time_hours=result.lead_time_hours,
        environmental_data=sensor,
        generated_at=datetime.now(timezone.utc),
        advisory=result.advisory,
    )


@router.get("/forecast/{location_id}", response_model=PredictionResponse)
def get_forecast(location_id: int, db: Session = Depends(get_db)) -> PredictionResponse:
    """Return the latest environmental observation and its current risk assessment."""
    location = db.get(Location, location_id)
    if location is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
    sensor = _latest_sensor(db, location_id)
    if sensor is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No sensor data available for location")

    result = predict_risk(sensor)
    return PredictionResponse(
        location_id=location.id,
        risk_level=result.risk_level,
        flood_risk_score=result.score,
        estimated_lead_time_hours=result.lead_time_hours,
        environmental_data=sensor,
        generated_at=datetime.now(timezone.utc),
        advisory=result.advisory,
    )


@router.get("/alerts", response_model=list[AlertResponse])
def get_active_alerts(
    location_id: int | None = Query(default=None, gt=0),
    minimum_risk: str | None = Query(default=None, pattern="^(High|Critical)$"),
    db: Session = Depends(get_db),
) -> list[Alert]:
    """Retrieve active, unexpired alerts, optionally filtered by location and severity."""
    now = datetime.now(timezone.utc)
    query = select(Alert).where(
        Alert.is_active.is_(True),
        (Alert.expires_at.is_(None) | (Alert.expires_at >= now)),
    )
    if location_id is not None:
        query = query.where(Alert.location_id == location_id)
    if minimum_risk == "Critical":
        query = query.where(Alert.risk_level == "Critical")
    elif minimum_risk == "High":
        query = query.where(Alert.risk_level.in_(["High", "Critical"]))
    return list(db.scalars(query.order_by(Alert.created_at.desc())).all())


@router.get("/sensor-data/{location_id}", response_model=list[SensorDataResponse])
def get_recent_sensor_data(
    location_id: int,
    limit: int = Query(default=20, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[SensorData]:
    """Return recent observations; useful for diagnostics and model calibration."""
    if db.get(Location, location_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
    query = select(SensorData).where(SensorData.location_id == location_id).order_by(SensorData.timestamp.desc()).limit(limit)
    return list(db.scalars(query).all())
