from sqlalchemy import Boolean, Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from .db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    phone_number = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="resident") # "resident" or "responder"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class TelemetryLog(Base):
    __tablename__ = "telemetry_logs"

    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(String, index=True)
    rain_1h_mm = Column(Float)
    soil_moisture_pct = Column(Float)
    river_water_level_m = Column(Float)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    prediction_risk_score = Column(Float, nullable=True) # ML Output
