from datetime import datetime

from pydantic import BaseModel


class IncidentCreate(BaseModel):
    title: str
    location: str
    priority: str


class IncidentResponse(BaseModel):
    id: str
    title: str
    location: str
    priority: str
    status: str
    reported_by: str | None = None
    timestamp: datetime

    class Config:
        from_attributes = True
