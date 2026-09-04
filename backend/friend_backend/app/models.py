"""SQLAlchemy ORM models for the flash-flood prediction system."""

from datetime import datetime, timezone
from enum import StrEnum

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utc_now() -> datetime:
    """Return a timezone-aware UTC timestamp."""
    return datetime.now(timezone.utc)


class RiskLevel(StrEnum):
    """Supported public risk categories."""

    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class Location(Base):
    """Village/ward monitored by the system."""

    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    district: Mapped[str] = mapped_column(String(120), nullable=False)
    state: Mapped[str] = mapped_column(String(120), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    elevation_m: Mapped[float | None] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    sensor_data: Mapped[list["SensorData"]] = relationship(back_populates="location", cascade="all, delete-orphan")
    alerts: Mapped[list["Alert"]] = relationship(back_populates="location", cascade="all, delete-orphan")


class SensorData(Base):
    """Point-in-time environmental observation from an IoT sensor."""

    __tablename__ = "sensor_data"
    __table_args__ = (Index("ix_sensor_data_location_timestamp", "location_id", "timestamp"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    location_id: Mapped[int] = mapped_column(ForeignKey("locations.id", ondelete="CASCADE"), nullable=False, index=True)
    rainfall_mm: Mapped[float] = mapped_column(Float, nullable=False)
    soil_moisture_percent: Mapped[float] = mapped_column(Float, nullable=False)
    slope_stability_index: Mapped[float] = mapped_column(Float, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    location: Mapped[Location] = relationship(back_populates="sensor_data")


class Alert(Base):
    """Generated early warning associated with a monitored location."""

    __tablename__ = "alerts"
    __table_args__ = (Index("ix_alerts_active_location_created", "is_active", "location_id", "created_at"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    location_id: Mapped[int] = mapped_column(ForeignKey("locations.id", ondelete="CASCADE"), nullable=False, index=True)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False)
    flood_risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    estimated_lead_time_hours: Mapped[float] = mapped_column(Float, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    location: Mapped[Location] = relationship(back_populates="alerts")
