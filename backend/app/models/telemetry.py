from sqlalchemy import Column, DateTime, Float, Integer, String
from sqlalchemy.sql import func

from app.core.database import Base


class TelemetryLog(Base):
    __tablename__ = "telemetry_logs"

    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(String, index=True)
    rain_1h_mm = Column(Float)
    soil_moisture_pct = Column(Float)
    river_water_level_m = Column(Float)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    prediction_risk_score = Column(Float, nullable=True)  # ML output
