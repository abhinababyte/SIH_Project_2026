# Flash Flood Prediction Backend for Hilly Regions

A modular FastAPI backend that accepts hyper-local IoT observations, persists them in SQLite, calculates a transparent placeholder flood-risk score, and exposes forecasts and active early warnings for villages or wards.

> **Operational disclaimer:** The heuristic is a software placeholder, not a certified hydrological or life-safety system. Before operational use, calibrate it against local rainfall, soil, terrain, drainage, landslide, and historical incident data; validate false-positive and false-negative rates; add authentication, audit logging, monitoring, durable migrations, and an independent emergency-warning process.

## Project structure

```text
flash_flood_backend/
├── app/
│   ├── api/routes.py       # REST endpoints
│   ├── database.py         # SQLite engine and session dependency
│   ├── main.py             # FastAPI application
│   ├── ml_service.py       # Heuristic model and alert workflow
│   ├── models.py           # SQLAlchemy entities
│   └── schemas.py          # Pydantic contracts
├── tests/test_api.py
├── requirements.txt
├── sample_payload.json
├── seed.py
└── README.md
```

## Run locally

```bash
cd /home/ubuntu/flash_flood_backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload
```

Interactive OpenAPI documentation is available at `http://127.0.0.1:8000/docs`.

## API endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness check |
| `POST` | `/api/v1/ingest` | Validate and persist one IoT observation; return its prediction |
| `GET` | `/api/v1/forecast/{location_id}` | Return the latest observation and recalculated forecast |
| `GET` | `/api/v1/alerts` | Return active, unexpired alerts; supports `location_id` and `minimum_risk=High|Critical` |
| `GET` | `/api/v1/sensor-data/{location_id}` | Return recent observations for diagnostics/calibration |

### Ingest example

```bash
curl -X POST http://127.0.0.1:8000/api/v1/ingest \\
  -H 'Content-Type: application/json' \\
  --data @sample_payload.json
```

The request requires a timezone-aware ISO-8601 timestamp. Rainfall is bounded to `0..2000` mm per observation window, soil moisture to `0..100` percent, and slope stability to `0..1`.

## Heuristic prediction logic

The service normalizes three signals to a 0–100 range and computes a weighted score:

| Signal | Transformation | Weight |
|---|---|---:|
| Rainfall | 0 at 20 mm and 100 at 150 mm or above | 50% |
| Soil moisture | 0 at 45% and 100 at 95% or above | 30% |
| Slope instability | `1 - slope_stability_index`, converted to percent | 20% |

The result is clipped to `0..100` and categorized as **Low** below 35, **Medium** from 35 to below 60, **High** from 60 to below 80, and **Critical** from 80 upward. Estimated lead time is a simple bounded inverse mapping from 24 hours at low score to 0.5 hours at maximum score. These thresholds and weights are illustrative and should not be treated as regional truth.

For High or Critical predictions, the service creates an active `Alert`. If an active alert for the same location and severity already exists, it is refreshed rather than duplicated. If severity changes, the prior alert is deactivated and a new alert is stored.

## Replacing the heuristic with a trained model

Keep the `predict_risk(sensor: SensorData) -> PredictionResult` interface stable and replace its body with feature engineering plus a loaded scikit-learn, TensorFlow, or PyTorch model. The production implementation should version the model, validate feature freshness, handle missing sensor values, emit calibrated probabilities rather than uncalibrated scores, and separately model lead time using historical event onset data. The API and alert workflow can remain unchanged.

## Test

```bash
pytest -q
```

The included tests use an isolated in-memory SQLite database and cover critical alert creation and unknown-location handling.
