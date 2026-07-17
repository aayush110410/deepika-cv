# CaseTrack

Personal case-competition deadline tracker. Single user. Runs locally, or self-host it to reach it from any device — extraction uses the Gemini API (free tier) so no local model is required.

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
dismissed, high-confidence competition mail creates or updates competitions
automatically, and low-confidence or flagged mail lands in the **Review** tab where
every extracted field is editable before you confirm or dismiss.

The extractor is chosen by the `EXTRACTOR` env var — swapping backends is one config
change, never a code change:

- **`gemini` (default, hosted, free tier).** No local model needed, so this is the right
  choice for a hosted deployment. Get an API key from
  [Google AI Studio](https://aistudio.google.com/apikey), set `GEMINI_API_KEY=...` in the
  environment (or `backend/.env`), and optionally `GEMINI_MODEL` (defaults to
  `gemini-3.1-pro-preview`, the current Gemini 3 Pro text model for structured
  extraction; set it to any model string your key can access).
- **`openrouter` (hosted fallback).** Set `OPENROUTER_API_KEY`, `EXTRACTOR=openrouter`,
  and optionally `OPENROUTER_MODEL`. The default is `openai/gpt-oss-20b:free`;
  OpenRouter free models use IDs ending in `:free` and have their own rate limits.
- **`ollama` (local, free).** Install [Ollama](https://ollama.com), `ollama pull llama3.2`,
  set `EXTRACTOR=ollama`. For a local-only setup with no API keys.
- **`claude` (Anthropic API).** `pip install anthropic`, `ANTHROPIC_API_KEY=...`,
  `EXTRACTOR=claude`.

If the extractor is unreachable (missing key, quota, Ollama down), sync still stores the
emails — hit **Process Emails** in the Emails or Review tab once it's fixed. A single email blocked
by a safety filter just goes to Review; it never halts the sync. All knobs live in
`backend/.env` (see `backend/.env.example`).

## Auto-merge (Phase 4)

Matching and autopilot run in strict priority order on every processed email:

1. **Gmail thread already linked to a competition** → certain match. This is the *only*
   path that auto-merges: round progression applies automatically (`round_clear` bumps
   the round, sets `cleared_next_round`, replaces the deadline; `rejection` → rejected;
   `result` → completed) and the email is marked `auto_linked`.
2. **High-confidence fuzzy name match + known sender domain** → auto-update the
   existing competition.
3. **High-confidence new competition** → auto-create it in the right tab
   (registered/upcoming/awaiting result/archive).
4. Anything low-confidence or ambiguous → Review.

Guard rails: a deadline is never overwritten with null — a `round_clear` without a
parseable deadline changes nothing and is flagged into Review (with its thread link
kept). A stale email can never move a competition's round backwards. Tune the fuzzy
threshold with `FUZZY_NAME_THRESHOLD` (default 0.75); lowering it only affects
suggestions and high-confidence auto-updates.

Run the backend tests (matching/parsing/transition logic, per project rules):

```bash
cd backend && pip install -r requirements-dev.txt && python -m pytest tests/
```

## Hosting on Render

The repo ships a `Dockerfile` (builds the frontend, serves everything from one FastAPI
process) and a `render.yaml` blueprint. Steps:

1. **Push to GitHub**, then in Render: **New → Blueprint** → pick this repo. It creates one
   Docker web service on the free plan.
2. **Set env vars** (Render dashboard → Environment):
   - `GEMINI_API_KEY` — your Google AI Studio key.
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from your Google **Web** OAuth client
     (the `web` block of the downloaded JSON).
   - `OAUTH_REDIRECT_URI` — `https://<your-service>.onrender.com/api/gmail/callback`.
3. **Register the redirect URI** in Google Cloud console → Credentials → your OAuth client →
   **Authorized redirect URIs** → add the exact `OAUTH_REDIRECT_URI` above.
4. **Consent screen → Publishing status:** move it to **In production** (an "unverified app"
   warning is fine for personal use). In *Testing* mode Google expires the refresh token
   every 7 days; Production makes it long-lived.
5. **Open the app → Emails → Connect Gmail.** After consent, the callback page shows a
   `GMAIL_REFRESH_TOKEN=...` — copy it into a Render env var and redeploy. That makes Gmail
   access survive restarts (Render's free disk is ephemeral, so `token.json` alone won't).

**Data persistence caveat:** on Render's free tier the filesystem is ephemeral, so the
SQLite database (your tracked competitions) resets when the service restarts or redeploys.
To keep data, either add a **Render Disk** and set `DATABASE_PATH` to a file on it, or set
`DATABASE_URL` to a free hosted database (e.g. Postgres — then `pip install psycopg2-binary`).
The code reads `DATABASE_URL` / `DATABASE_PATH` from the env, so this is config-only.

> Note: the app has no login — anyone with the URL can see the data and trigger syncs. Keep
> the URL private, or add an access gate later if you share the link.

## Project phases

- [x] **Phase 1** — Manual CRUD tracker: dashboard sorted nearest-deadline-first with urgency bands (red < 3 days, amber < 7, green beyond, grey no deadline), add/edit/delete, status dropdown.
- [x] **Phase 2** — Gmail OAuth + raw sync (manual "Sync Now" only).
- [x] **Phase 3** — LLM extraction behind an `Extractor` interface (Ollama default), review queue.
- [x] **Phase 4** — Auto-merge (thread-ID matches only) + round progression rules.
- [x] **Phase 5** — Polish: tabs (Upcoming / Awaiting result / Archive / Review / Emails)
  with a needs-review badge and an always-visible sync status indicator. Tab-to-status
  grouping and all counts come from the API (`/api/overview`, `?bucket=`), so any future
  client groups identically. Manual add and per-field overrides stay available everywhere.
