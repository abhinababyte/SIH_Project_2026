# HillShield backend — agent guide

FastAPI + SQLAlchemy (SQLite) + XGBoost/SHAP, managed with [uv](https://docs.astral.sh/uv/).
Python 3.13, `backend/pyproject.toml` is the single source of truth for dependencies.

Read `../AGENTS.md` first for repo-wide conventions (git workflow, the "no mock
fallback data" rule, CORS/status-casing gotchas). This file is backend-specific.

## Running

```bash
uv sync            # installs/updates .venv from pyproject.toml + uv.lock
uv run main.py      # starts uvicorn on http://0.0.0.0:8000 with --reload
```

`backend/main.py` is a thin entrypoint (`from app.main import app`); the real
application factory is `app/main.py`. Never run/import `main.py` from anywhere other
than the `backend/` directory — `app/core/config.py` resolves paths relative to its own
file location (not cwd), but `uv --project backend run main.py` (as used by the root
`Taskfile.yml`) still expects to execute from that project root.

## Architecture

Layered, one concern per package — mirror this when adding anything new:

```
app/
  core/       settings (config.py) + DB engine/session (database.py)
  models/     SQLAlchemy ORM models, one file per entity
  schemas/    Pydantic request/response schemas, one file per domain
  ml/         feature engineering (features.py) + model load/predict/SHAP (predictor.py)
  services/   business logic — DB queries, state transitions — no HTTP concerns
  ws/         WebSocket ConnectionManager (manager.py), a module-level singleton
  api/routes/ thin FastAPI routers that call into services/, one file per resource
  main.py     application factory: CORS, table creation, router wiring
```

### Adding a new resource (model + endpoints)

Follow the existing `Report` or `Escalation` features as templates — they're the
newest and cleanest examples of the full pattern. In order:

1. `app/models/<thing>.py` — SQLAlchemy model. Register it in `app/models/__init__.py`
   (both the import and `__all__`) — `app/main.py` imports the whole `models` package
   before `Base.metadata.create_all()`, so a model that isn't imported there never gets
   its table created.
2. `app/schemas/<thing>.py` — `<Thing>Create` / `<Thing>Response` Pydantic models.
   Register in `app/schemas/__init__.py`.
3. `app/services/<thing>s.py` — plain functions taking a `Session` first, no FastAPI
   imports. This is what you'd unit-test if this project had tests.
4. `app/api/routes/<thing>s.py` — an `APIRouter(prefix="/api/<thing>s")` with thin
   handlers that call the service layer and (for creates/state-changes) broadcast a
   websocket event via `from app.ws.manager import manager`.
5. Register the router in `app/api/routes/__init__.py`.

Status/state fields are plain `String` columns with a comment listing the valid values
— there's no enum. Keep the comment accurate; it's the only documentation of the valid
set, and the frontend must match it exactly (case included).

## Database

SQLite at `app/database/hillshield.db`, **committed to git**. `Base.metadata.create_all()`
runs on every app startup and only adds tables that don't exist yet — it will not add a
column to an existing table or otherwise migrate anything (there's no Alembic). If you
change a model's columns, delete the local db file in dev to get a clean schema; in
review, remember the checked-in file reflects real accumulated test data, so revert it
(`git checkout -- app/database/hillshield.db`) if your own local testing wrote to it and
that data shouldn't ship.

## CORS

`app/core/config.py` defines `CORS_ORIGIN_REGEX` (any `localhost`/`127.0.0.1` port) in
addition to the fixed `CORS_ORIGINS` list. Both are wired into `CORSMiddleware` in
`app/main.py`. Keep the regex — a fixed port list breaks the moment Next.js falls back
to a non-default port, and the failure is invisible in the UI (just a browser console
CORS warning), not an obvious error.

## Auth

`app/services/auth.py` hashes passwords with **argon2** (`passlib`'s bcrypt backend is
incompatible with `bcrypt>=4.1`, which breaks `pwd_context.hash()`/`verify()` at
runtime with no import-time error — it fails the first time someone registers/logs in).
Don't switch this back to `bcrypt` without adding a pinned, compatible `bcrypt` version
and verifying registration actually works, not just that the app boots.

## ML model

`app/ml/predictor.py` loads `app/ml/artifacts/xgboost_flood_model.pkl` at import time
(module-level singleton `predictor`). `app/ml/features.py` builds the exact feature
frame the model expects — column order matters, see `EXPECTED_COLUMNS`.

Known pre-existing issue: `POST /api/telemetry`'s live prediction
(`predictor.predict_risk_score`) throws an XGBoost dtype mismatch on `Land_Cover_Type`
and falls back to returning `-1.0` — telemetry is still recorded, but the risk score is
never real. Root cause not yet fixed. `POST /api/predict/explain` (SHAP) works fine
independently of this.

## Testing (no formal suite yet)

There's no pytest setup in this repo. The established way to verify a change actually
works, used throughout this project's history:

```bash
uv run python -c "
from fastapi.testclient import TestClient
from app.main import app
client = TestClient(app)
print(client.get('/api/incidents').json())
"
```

(requires `uv pip install httpx2` once, for `starlette.testclient` — it's not a runtime
dependency, don't add it to `pyproject.toml`)

or run the live server (`uv run main.py`) and hit it with `curl`, ideally driving the
*actual* frontend against it (see `../frontend/AGENTS.md`) rather than only checking
the API in isolation — most real bugs here have been in the frontend/backend contract
(status casing, CORS, field names), not inside either side alone.
