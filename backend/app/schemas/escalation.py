from datetime import datetime

from pydantic import BaseModel


class EscalationCreate(BaseModel):
    resource_type: str
    priority: str
    location: str
    description: str


class EscalationResponse(BaseModel):
    id: str
    resource_type: str
    priority: str
    location: str
    description: str
    status: str
    timestamp: datetime

    class Config:
        from_attributes = True
