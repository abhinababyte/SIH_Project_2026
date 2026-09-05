from sqlalchemy import Column, DateTime, String
from sqlalchemy.sql import func

from app.core.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, index=True)
    report_type = Column(String)  # Landslide, Flood, Blocked Road, Other
    location = Column(String, nullable=True)
    description = Column(String)
    status = Column(String, default="new")  # new, verified
    reported_by = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
