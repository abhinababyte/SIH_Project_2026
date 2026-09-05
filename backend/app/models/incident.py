from sqlalchemy import Column, DateTime, String
from sqlalchemy.sql import func

from app.core.database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    location = Column(String)
    priority = Column(String)  # low, medium, high, critical
    status = Column(String, default="detected")  # detected, acknowledged, dispatched, resolved
    reported_by = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
