from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ReportCreate(BaseModel):
    report_type: str
    description: str
    location: Optional[str] = None
    reported_by: Optional[str] = None


class ReportResponse(BaseModel):
    id: str
    report_type: str
    description: str
    location: Optional[str] = None
    status: str
    reported_by: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True
