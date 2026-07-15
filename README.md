# CaseTrack

Personal case-competition deadline tracker. Single user, runs entirely on the local machine — no cloud, no paid services.

- **Backend:** FastAPI + SQLite (SQLAlchemy). Owns all business logic (API-first — a native client can reuse the same API later).
- **Frontend:** React + Vite. Dumb client: calls the API and renders.

## Requirements

- Python 3.11+
- Node 18+

## Run it

### Backend (port 8000)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The SQLite database (`backend/casetrack.db`) is created automatically on first start. It is gitignored.

### Frontend — dev mode (port 5173)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The dev server proxies `/api` to the backend on port 8000.

### Single-process mode (daily use)

Build the frontend once, then uvicorn serves everything:

```bash
cd frontend && npm run build
```

Then just run the backend and open http://localhost:8000.

## Project phases

- [x] **Phase 1** — Manual CRUD tracker: dashboard sorted nearest-deadline-first with urgency bands (red < 3 days, amber < 7, green beyond, grey no deadline), add/edit/delete, status dropdown.
- [ ] **Phase 2** — Gmail OAuth + raw sync (manual "Sync Now" only).
- [ ] **Phase 3** — LLM extraction behind an `Extractor` interface (Ollama default), review queue.
- [ ] **Phase 4** — Auto-merge (thread-ID matches only) + round progression rules.
- [ ] **Phase 5** — Polish: tabs, review badge, sync status indicator.
