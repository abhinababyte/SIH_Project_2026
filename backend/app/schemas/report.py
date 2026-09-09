from datetime import datetime

from pydantic import BaseModel


class ReportCreate(BaseModel):
    report_type: str
    description: str
    location: str | None = None
    reported_by: str | None = None


class ReportResponse(BaseModel):
    id: str
    report_type: str
    description: str
    location: str | None = None
    status: str
    reported_by: str | None = None
    timestamp: datetime

    class Config:
        from_attributes = True
