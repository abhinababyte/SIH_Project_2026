import numpy as np
import pandas as pd

from app.schemas.telemetry import TelemetryData

EXPECTED_COLUMNS = [
    "Rain_1h_mm", "Rain_3h_mm", "Rain_24h_mm", "Forecast_Rain_3h_mm",
    "Soil_Moisture_Pct", "Slope_Deg", "Elevation_m", "Distance_to_River_m",
    "Land_Cover_Type", "Flow_Accumulation", "River_Water_Level_m",
    "Is_Rain_Sentinel", "Is_River_Sentinel", "Is_Forecast_Sentinel",
    "TWI", "River_Proximity_Score", "Steepness_Danger", "Storm_Trend",
    "Rain_Burst_Ratio", "Soil_Deficit", "Runoff_Acceleration",
    "River_Rain1", "Doorstep_Threat",
]


def engineer_features(data: TelemetryData) -> pd.DataFrame:
    df = pd.DataFrame([{
        "Rain_1h_mm": data.rain_1h_mm,
        "Rain_3h_mm": data.rain_1h_mm * 2.5,
        "Rain_24h_mm": data.rain_1h_mm * 8.0,
        "Forecast_Rain_3h_mm": data.rain_1h_mm * 2.0,
        "Soil_Moisture_Pct": data.soil_moisture_pct,
        "Slope_Deg": 15.0,
        "Elevation_m": 500.0,
        "Distance_to_River_m": 100.0,
        "Land_Cover_Type": 1,
        "Flow_Accumulation": 1000.0,
        "River_Water_Level_m": data.river_water_level_m,
    }])

    df["Is_Rain_Sentinel"] = df["Rain_1h_mm"].isna().astype(int)
    df["Is_River_Sentinel"] = df["River_Water_Level_m"].isna().astype(int)
    df["Is_Forecast_Sentinel"] = df["Forecast_Rain_3h_mm"].isna().astype(int)

    slope_rad = np.radians(df["Slope_Deg"].clip(lower=0.1))
    df["TWI"] = np.log((df["Flow_Accumulation"] + 1) / np.tan(slope_rad))

    df["River_Proximity_Score"] = 1 / (df["Distance_to_River_m"] + 10)
    df["Steepness_Danger"] = df["Slope_Deg"] * df["River_Proximity_Score"]

    df["Storm_Trend"] = df["Forecast_Rain_3h_mm"] / (df["Rain_3h_mm"] + 1)
    df["Rain_Burst_Ratio"] = df["Rain_1h_mm"] / (df["Rain_3h_mm"] + 1)

    df["Soil_Deficit"] = 100 - df["Soil_Moisture_Pct"]
    df["Runoff_Acceleration"] = df["Rain_1h_mm"] / (df["Soil_Deficit"] + 10)

    df["River_Rain1"] = df["River_Water_Level_m"] * df["Rain_1h_mm"]
    df["Doorstep_Threat"] = df["River_Water_Level_m"] * df["River_Proximity_Score"]

    df["Land_Cover_Type"] = df["Land_Cover_Type"].astype("category")
    
    return df[EXPECTED_COLUMNS]
