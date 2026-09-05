import joblib
import shap
from fastapi.concurrency import run_in_threadpool

from app.core.config import ML_MODEL_PATH
from app.ml.features import engineer_features
from app.schemas.telemetry import TelemetryData


class FloodRiskPredictor:
    """Wraps the trained XGBoost flood-risk model and its SHAP explainer."""

    def __init__(self):
        self.model = None
        try:
            self.model = joblib.load(ML_MODEL_PATH)
            print("ML Model loaded successfully.")
        except Exception as e:
            print(f"Warning: Could not load ML model: {e}")

    @property
    def is_loaded(self) -> bool:
        return self.model is not None

    async def predict_risk_score(self, data: TelemetryData) -> float:
        if not self.is_loaded:
            return 0.0
        try:
            df = engineer_features(data)
            # Run prediction in a threadpool to prevent CPU blocking on the event loop
            prediction = await run_in_threadpool(self.model.predict, df)
            return float(prediction[0])
        except Exception as e:
            print(f"ML Prediction Error: {e}")
            return -1.0

    def explain(self, data: TelemetryData) -> dict:
        if not self.is_loaded:
            raise RuntimeError("Model not loaded")

        df = engineer_features(data)
        explainer = shap.TreeExplainer(self.model)
        shap_values = explainer.shap_values(df)

        # Handle multi-class XGBoost SHAP output (1 row, 23 features, 4 classes).
        # We take class index 3 (High Risk) for our explanation.
        base_value = float(explainer.expected_value[3])
        vals = shap_values[0, :, 3]

        feature_impacts = {
            "Rainfall_1hr": float(vals[0]),
            "Soil_Moisture": float(vals[4]),
            "River_Level": float(vals[10]),
        }

        return {
            "base_value": base_value,
            "feature_impacts": feature_impacts,
            "explanation": "Positive values push towards flood prediction. Negative values mean safety.",
        }


predictor = FloodRiskPredictor()
