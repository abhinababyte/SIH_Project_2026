"""Pydantic schemas for API validation and serialization."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .models import RiskLevel


class SensorIngestRequest(BaseModel):
    """Validated IoT observation payload."""

    location_id: int = Field(gt=0)
    rainfall_mm: float = Field(ge=0, le=2000, description="Accumulated rainfall for the observation window")
    soil_moisture_percent: float = Field(ge=0, le=100)
    slope_stability_index: float = Field(ge=0, le=1, description="1 is stable; 0 is highly unstable")
    timestamp: datetime

    @field_validator("timestamp")
    @classmethod
    def timestamp_must_be_timezone_aware(cls, value: datetime) -> datetime:
        if value.tzinfo is None:
            raise ValueError("timestamp must include a timezone offset, preferably UTC")
        return value


class LocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    district: str
    state: str
    latitude: float
    longitude: float
    elevation_m: float | None


class SensorDataResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    location_id: int
    rainfall_mm: float
    soil_moisture_percent: float
    slope_stability_index: float
    timestamp: datetime


class PredictionResponse(BaseModel):
    location_id: int
    risk_level: RiskLevel
    flood_risk_score: float = Field(ge=0, le=100)
    estimated_lead_time_hours: float = Field(ge=0)
    environmental_data: SensorDataResponse | None
    generated_at: datetime
    advisory: str


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    location_id: int
    risk_level: RiskLevel
    flood_risk_score: float
    estimated_lead_time_hours: float
    message: str
    is_active: bool
    created_at: datetime
    expires_at: datetime | None
