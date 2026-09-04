"""API tests for core ingestion, forecast, and alert behavior."""

from datetime import datetime, timezone

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import Location

TEST_ENGINE = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=TEST_ENGINE, autoflush=False, autocommit=False)
Base.metadata.create_all(bind=TEST_ENGINE)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def setup_function():
    Base.metadata.drop_all(bind=TEST_ENGINE)
    Base.metadata.create_all(bind=TEST_ENGINE)
    with TestingSessionLocal() as db:
        db.add(Location(name="Test Ward", district="Demo", state="Uttarakhand", latitude=30.0, longitude=78.0))
        db.commit()


def test_ingest_creates_critical_prediction_and_alert():
    response = client.post("/api/v1/ingest", json={
        "location_id": 1,
        "rainfall_mm": 180,
        "soil_moisture_percent": 95,
        "slope_stability_index": 0.05,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    assert response.status_code == 201
    assert response.json()["risk_level"] == "Critical"
    alerts = client.get("/api/v1/alerts")
    assert alerts.status_code == 200
    assert len(alerts.json()) == 1


def test_unknown_location_is_rejected():
    response = client.post("/api/v1/ingest", json={
        "location_id": 999,
        "rainfall_mm": 50,
        "soil_moisture_percent": 60,
        "slope_stability_index": 0.8,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    assert response.status_code == 404
