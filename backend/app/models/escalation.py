from sqlalchemy import Column, DateTime, String
from sqlalchemy.sql import func

from app.core.database import Base


class Escalation(Base):
    __tablename__ = "escalations"

    id = Column(String, primary_key=True, index=True)
    resource_type = Column(String)  # Helicopter Evacuation, Medical Airdrop, etc.
    priority = Column(String, default="Standard")  # Standard, Urgent, Critical
    location = Column(String)
    description = Column(String)
    status = Column(String, default="PENDING")  # PENDING, DISPATCHED
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
