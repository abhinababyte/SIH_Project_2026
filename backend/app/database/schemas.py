from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    full_name: str
    email: str
    phone_number: str
    password: str
    role: str

class UserLogin(BaseModel):
    identifier: str
    password: str

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone_number: str
    role: str
    
    class Config:
        from_attributes = True

class TelemetryData(BaseModel):
    sensor_id: str
    rain_1h_mm: float
    soil_moisture_pct: float
    river_water_level_m: float

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
