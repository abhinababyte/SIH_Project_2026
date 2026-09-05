from datetime import datetime
from typing import Optional

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
    reported_by: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True
