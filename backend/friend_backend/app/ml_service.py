"""Prediction service boundary.

The heuristic in this module is intentionally deterministic and replaceable. A trained
model can later implement the same ``predict_risk`` contract without changing routes.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Alert, Location, RiskLevel, SensorData


@dataclass(frozen=True)
class PredictionResult:
    """Normalized prediction output consumed by the API and alert workflow."""

    score: float
    risk_level: RiskLevel
    lead_time_hours: float
    advisory: str


def _linear_score(value: float, low: float, high: float) -> float:
    """Map a value to 0-100 between two thresholds, clipping outside the range."""
    if high <= low:
        raise ValueError("high threshold must be greater than low threshold")
    return max(0.0, min(100.0, ((value - low) / (high - low)) * 100.0))


def predict_risk(sensor: SensorData) -> PredictionResult:
    """Calculate a transparent flood-risk score from one environmental observation.

    Weights: rainfall intensity/accumulation 50%, soil saturation 30%, and slope
    instability 20%. The slope component is inverted because a stability index of 1
    means stable ground while 0 means unstable ground. Thresholds are illustrative
    starting points and must be calibrated with local historical events.
    """
    rainfall_component = _linear_score(sensor.rainfall_mm, 20.0, 150.0)
    soil_component = _linear_score(sensor.soil_moisture_percent, 45.0, 95.0)
    slope_component = (1.0 - sensor.slope_stability_index) * 100.0
    score = round((0.50 * rainfall_component) + (0.30 * soil_component) + (0.20 * slope_component), 2)

    if score >= 80:
        risk_level = RiskLevel.CRITICAL
        advisory = "Immediate evacuation readiness, route monitoring, and emergency notification are advised."
    elif score >= 60:
        risk_level = RiskLevel.HIGH
        advisory = "Prepare response teams, inspect drainage and slopes, and issue a local precautionary warning."
    elif score >= 35:
        risk_level = RiskLevel.MEDIUM
        advisory = "Increase monitoring and communicate preparedness guidance to exposed communities."
    else:
        risk_level = RiskLevel.LOW
        advisory = "Continue routine monitoring; no immediate action is indicated by this heuristic."

    # Higher risk means shorter actionable warning time, bounded to a practical 0.5-24 hour range.
    lead_time_hours = round(max(0.5, min(24.0, 24.0 - (score / 100.0) * 23.5)), 2)
    return PredictionResult(score, risk_level, lead_time_hours, advisory)


def generate_alert_if_needed(db: Session, location: Location, sensor: SensorData, result: PredictionResult) -> Alert | None:
    """Create or refresh an active alert for High/Critical predictions.

    Repeated sensor readings do not create an alert storm: an existing active alert at
    the same risk level is updated, while a level change creates a new alert record.
    """
    if result.risk_level not in (RiskLevel.HIGH, RiskLevel.CRITICAL):
        return None

    active = db.scalar(
        select(Alert)
        .where(Alert.location_id == location.id, Alert.is_active.is_(True))
        .order_by(Alert.created_at.desc())
        .limit(1)
    )
    message = f"{result.risk_level.value} flash-flood risk detected for {location.name}. {result.advisory}"
    expires_at = datetime.now(timezone.utc) + timedelta(hours=max(1.0, result.lead_time_hours))

    if active and active.risk_level == result.risk_level.value:
        active.flood_risk_score = result.score
        active.estimated_lead_time_hours = result.lead_time_hours
        active.message = message
        active.expires_at = expires_at
        return active

    if active:
        active.is_active = False

    alert = Alert(
        location_id=location.id,
        risk_level=result.risk_level.value,
        flood_risk_score=result.score,
        estimated_lead_time_hours=result.lead_time_hours,
        message=message,
        expires_at=expires_at,
    )
    db.add(alert)
    return alert
