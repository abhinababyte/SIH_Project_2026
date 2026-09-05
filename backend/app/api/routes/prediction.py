from fastapi import APIRouter, HTTPException

from app.ml.predictor import predictor
from app.schemas.telemetry import TelemetryData

router = APIRouter(prefix="/api/predict", tags=["prediction"])


@router.post("/explain")
async def explain_prediction(data: TelemetryData):
    if not predictor.is_loaded:
        raise HTTPException(status_code=500, detail="Model not loaded")

    try:
        result = predictor.explain(data)
        return {"status": "success", **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
