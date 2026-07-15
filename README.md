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

## Gmail setup (Phase 2, one-time)

CaseTrack reads Gmail with the `gmail.readonly` scope via Desktop-app OAuth. The consent
screen stays in **Testing** mode — no Google app verification needed.

1. Go to [Google Cloud Console](https://console.cloud.google.com/), create a project (any name).
2. **APIs & Services → Library** → enable **Gmail API**.
3. **APIs & Services → OAuth consent screen** → External → fill the minimal fields →
   keep **Publishing status: Testing** → add your own Gmail address under **Test users**.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID** →
   Application type **Desktop app** → download the JSON.
5. Save the downloaded file as `backend/credentials.json` (gitignored, never commit it).
6. Start the app, open the **Emails** view, click **Connect Gmail** — your browser opens
   the consent screen (expect the "unverified app" warning; that's the Testing-mode flow).
   The token lands in `backend/token.json` (gitignored). To re-consent, delete that file.

Sync is **manual only**: the **Sync Now** button pulls messages matching
`GMAIL_SEARCH_QUERY` since the last sync (first run looks back
`GMAIL_INITIAL_SYNC_DAYS`, default 30). Tune the filter in `backend/app/config.py`
or via environment variables of the same names — no code changes needed.

## Extraction (Phase 3)

Every sync runs the configured LLM extractor over new emails: irrelevant mail is
dismissed, relevant mail lands in the **Review** tab where every extracted field is
editable before you confirm (creates or updates a competition) or dismiss. Nothing is
auto-merged in this phase.

- **Default extractor: Ollama** (local, free). Install [Ollama](https://ollama.com), then
  `ollama pull llama3.2` (or set `OLLAMA_MODEL` to a bigger model like `llama3.1:8b`
  for better extraction). If Ollama is down, sync still stores emails — hit
  **Run extraction** in the Review tab later.
- **Optional: Claude** (Anthropic API). `pip install anthropic`, put
  `ANTHROPIC_API_KEY=...` in `backend/.env`, set `EXTRACTOR=claude`. That's the whole
  switch — same interface, no code changes.
- All knobs live in `backend/.env` (see `backend/.env.example`).

Run the backend tests (matching/parsing/transition logic only, per project rules):

```bash
cd backend && pip install -r requirements-dev.txt && python -m pytest tests/
```

## Project phases

- [x] **Phase 1** — Manual CRUD tracker: dashboard sorted nearest-deadline-first with urgency bands (red < 3 days, amber < 7, green beyond, grey no deadline), add/edit/delete, status dropdown.
- [x] **Phase 2** — Gmail OAuth + raw sync (manual "Sync Now" only).
- [x] **Phase 3** — LLM extraction behind an `Extractor` interface (Ollama default), review queue.
- [ ] **Phase 4** — Auto-merge (thread-ID matches only) + round progression rules.
- [ ] **Phase 5** — Polish: tabs, review badge, sync status indicator.
