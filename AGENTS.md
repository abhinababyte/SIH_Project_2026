# HillShield — agent guide

HillShield is a flash-flood early-warning and disaster-response app: a resident-facing
safety dashboard, a responder command dashboard, and an ML flood-risk model behind
both. This is a monorepo with two independent projects that talk to each other over
HTTP/WebSocket — there is no shared build, shared types, or shared package manager.

```
backend/    FastAPI + SQLAlchemy (SQLite) + XGBoost/SHAP, managed with uv
frontend/   Next.js 16 App Router + Tailwind v4, managed with bun
```

Each has its own `AGENTS.md` with stack-specific detail — read it before touching code
in that directory:

- `backend/AGENTS.md`
- `frontend/AGENTS.md`

## Running it locally

```bash
task setup      # bun install + uv sync, from repo root (requires https://taskfile.dev)
task dev:all    # both servers in a tmux session
task dev:split  # both servers in split tmux panes
```

Or manually, in two terminals:

```bash
cd backend && uv run main.py     # http://localhost:8000
cd frontend && bun run dev       # http://localhost:3000 (or next free port)
```

The frontend talks to the backend over a **hardcoded** `http://localhost:8000` (see
`frontend/AGENTS.md`) — there's no `.env`/base-URL config yet. Both must be running for
any feature that isn't pure static UI.

## The one rule that matters most here

**Never leave hardcoded/mock data as a "temporary" stand-in for a real API call, and
never let a fetch failure degrade silently into looking like empty-but-valid data.**
This bit the project twice in real history: a reports panel and an incident board both
shipped with a dummy dataset "for now," the dummy data was never fully replaced, and a
casing mismatch between frontend filters and backend status strings meant the real API
response was silently discarded on every fetch — so the UI looked broken/fake for a
long time with no error anywhere. If you build a panel that reads from the database,
make it impossible for a fetch failure to look identical to "legitimately empty" (show
a visible error state), and delete the mock data in the same commit that wires up the
real endpoint — don't leave it as a fallback.

## Cross-cutting gotchas (found the hard way)

- **CORS is a regex, not a fixed port list.** `backend/app/core/config.py` allows any
  `localhost`/`127.0.0.1` port via `CORS_ORIGIN_REGEX`, because Next.js silently falls
  back to a different port when 3000 is taken, and a fixed allow-list made every fetch
  fail with no visible error in the app (only a CORS console warning). If you add a new
  origin pattern, extend the regex — don't go back to a fixed list.
- **Status casing is per-resource, not uniform — check, don't assume.** Status columns
  are plain, unconstrained SQLAlchemy `String` fields with no enum or migration behind
  them, and each resource picked its own convention: incidents are lowercase
  (`detected`, `acknowledged`, `evacuating`, `completed`), reports are lowercase
  (`new`, `verified`), escalations are uppercase (`PENDING`, `DISPATCHED`). A frontend
  filter that guesses the case wrong doesn't error — it just silently matches zero rows.
  Grep the model file for the actual values before writing a filter against one.
- **The SQLite DB file is committed to git** (`backend/app/database/hillshield.db`).
  When you run the backend locally to test something, you *will* write real rows into
  this file. Before committing, check `git status` on it and `git checkout --` it back
  if your test data shouldn't ship — don't hand-edit or `rm` it.
- **`Base.metadata.create_all()` only adds missing tables**, it never alters existing
  ones (see `backend/app/main.py`). Adding a new model works with zero migration step;
  changing a column on an existing model does not — you'll need to delete the local db
  file in dev, since there's no Alembic here.
- Build artifacts (`backend/.venv`, `frontend/node_modules`, `frontend/.next`,
  `__pycache__`, `frontend/tsconfig.tsbuildinfo`) must never be committed. They're
  gitignored, but double-check `git status` after a local test run before staging.

## Git workflow

- One branch per fix/feature, named `claude/<short-slug>`, off the latest `main` — not
  stacked on an already-merged branch. Push, don't merge locally.
- Don't create a PR unless asked; when a PR already exists for the branch you're
  pushing to, just push — GitHub updates it automatically.
- Verify behavior against a live run (both servers, real requests) before committing,
  not just a type-check — most of the real bugs in this project's history were runtime
  data-flow issues (CORS, casing, dead mock data) that `tsc`/imports alone don't catch.
