from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.ml.predictor import predictor
from app.schemas.telemetry import TelemetryData
from app.services.telemetry import save_telemetry
from app.services.weather import fetch_open_meteo_live
from app.ws.manager import manager

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])


@router.post("/fetch-live")
async def fetch_and_predict_live_weather(lat: float = 26.7271, lon: float = 88.3953, db: Session = Depends(get_db)):
    """Pulls live satellite data from Open-Meteo and predicts flood risk."""
    weather_data = fetch_open_meteo_live(lat, lon)
    if not weather_data or "current" not in weather_data:
         raise HTTPException(status_code=502, detail="Failed to fetch live weather from Open-Meteo")
         
    current = weather_data["current"]
    rain = current.get("rain", 0.0)
    # Open-Meteo soil moisture is volumetric (m³/m³), multiply by 100 for percentage
    soil_moisture = current.get("soil_moisture_0_to_7cm", 0.0) * 100
    
    # Mock river level based on recent rain, since API doesn't do river gauges
    mock_river_level = 2.0 + (rain * 0.5) 
    
    data = TelemetryData(
        sensor_id="OPEN_METEO_SATELLITE",
        rain_1h_mm=rain,
        soil_moisture_pct=soil_moisture,
        river_water_level_m=mock_river_level
    )
    
    risk_score = await predictor.predict_risk_score(data)
    
    try:
        await save_telemetry(db, data, risk_score)
    except Exception as e:
        pass # ignore db save error in demo if it happens

    await manager.broadcast({
        "event": "TELEMETRY_UPDATE",
        "sensor_id": data.sensor_id,
        "rain_1h_mm": data.rain_1h_mm,
        "soil_moisture_pct": data.soil_moisture_pct,
        "river_water_level_m": data.river_water_level_m,
        "risk_score": risk_score,
    })

    return {
        "status": "success", 
        "source": "Open-Meteo API",
        "raw_api_response": current,
        "xgboost_prediction": risk_score
    }



@router.post("")
async def receive_telemetry(data: TelemetryData, db: Session = Depends(get_db)):
    risk_score = await predictor.predict_risk_score(data)

    try:
        await save_telemetry(db, data, risk_score)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record telemetry: {str(e)}")

    await manager.broadcast({
        "event": "TELEMETRY_UPDATE",
        "sensor_id": data.sensor_id,
        "rain_1h_mm": data.rain_1h_mm,
        "soil_moisture_pct": data.soil_moisture_pct,
        "river_water_level_m": data.river_water_level_m,
        "risk_score": risk_score,
    })

    return {"status": "success", "prediction": risk_score}
