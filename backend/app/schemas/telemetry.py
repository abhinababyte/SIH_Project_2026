from pydantic import BaseModel


class TelemetryData(BaseModel):
    sensor_id: str
    rain_1h_mm: float
    soil_moisture_pct: float
    river_water_level_m: float
