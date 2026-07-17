import { useCallback, useEffect, useState } from 'react'
import { api } from './api'
import CompetitionCard from './components/CompetitionCard'
import CompetitionForm from './components/CompetitionForm'
import EmailsView from './components/EmailsView'
import ReviewView from './components/ReviewView'

// Labels only — which statuses belong to which tab is the API's business
// (the `bucket` query param), not the frontend's.
const COMPETITION_TABS = {
  upcoming: { label: 'Upcoming', empty: 'Nothing upcoming. Add a competition or sync your email.' },
  awaiting_result: { label: 'Awaiting result', empty: 'No competitions awaiting results.' },
  archive: { label: 'Archive', empty: 'No completed or rejected competitions yet.' },
}

function formatSyncTime(iso) {
  if (!iso) return 'Never synced'
  return `Last sync ${new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })}`
}

export default function App() {
  const [view, setView] = useState('upcoming') // bucket key | 'review' | 'emails'
  const [competitions, setCompetitions] = useState(null)
  const [overview, setOverview] = useState(null)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null) // null | 'new' | competition

  const isCompetitionTab = view in COMPETITION_TABS

  const refreshOverview = useCallback(async () => {
    try {
      setOverview(await api.overview())
    } catch {
      /* badge/indicator data — never blocks the page */
    }
  }, [])

  const refreshCompetitions = useCallback(
    async (bucket) => {
      try {
        setCompetitions(await api.listCompetitions(bucket))
        setError(null)
      } catch (err) {
        setError(err.message)
      }
    },
    [],
  )

  useEffect(() => {
    refreshOverview()
    if (view in COMPETITION_TABS) {
      setCompetitions(null)
      refreshCompetitions(view)
    }
  }, [view, refreshCompetitions, refreshOverview])

  async function afterMutation() {
    await refreshOverview()
    if (isCompetitionTab) await refreshCompetitions(view)
  }

  async function handleSave(data) {
    try {
      if (editing === 'new') await api.createCompetition(data)
      else await api.updateCompetition(editing.id, data)
      setEditing(null)
      await afterMutation()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(comp) {
    if (!window.confirm(`Delete "${comp.name}"?`)) return
    try {
      await api.deleteCompetition(comp.id)
      await afterMutation()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleStatusChange(comp, status) {
    try {
      await api.updateCompetition(comp.id, { status })
      // The comp may have moved to another tab — the refresh makes that visible.
      await afterMutation()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>CaseTrack</h1>
          <p className="tagline">Case competition deadlines, nearest first</p>
        </div>
        <div className="topbar-actions">
          <button
            className="sync-indicator"
            onClick={() => setView('emails')}
            title="Open email sync"
          >
            <span className={overview?.gmail_connected ? 'dot dot-on' : 'dot dot-off'} />
            {overview ? formatSyncTime(overview.last_synced_at) : '…'}
          </button>
          <button className="btn btn-primary" onClick={() => setEditing('new')}>
            + Add competition
          </button>
        </div>
      </header>

      <nav className="view-switch tabs-row">
        {Object.entries(COMPETITION_TABS).map(([key, tab]) => (
          <button
            key={key}
            className={view === key ? 'active' : ''}
            onClick={() => setView(key)}
          >
            {tab.label}
          </button>
        ))}
        <button
          className={view === 'review' ? 'active' : ''}
          onClick={() => setView('review')}
        >
          Review
          {overview?.needs_review > 0 && <span className="badge">{overview.needs_review}</span>}
        </button>
        <button
          className={view === 'emails' ? 'active' : ''}
          onClick={() => setView('emails')}
        >
          Emails
        </button>
      </nav>

      {view === 'emails' ? (
        <EmailsView onChanged={refreshOverview} />
      ) : view === 'review' ? (
        <ReviewView onChanged={refreshOverview} />
      ) : (
        <>
          {error && <div className="error-banner">API error: {error}</div>}

          {competitions === null ? (
            <p className="muted">Loading…</p>
          ) : competitions.length === 0 ? (
            <div className="empty">
              <p>{COMPETITION_TABS[view].empty}</p>
              {view === 'upcoming' && (
                <button className="btn btn-primary" onClick={() => setEditing('new')}>
                  Add your first one
                </button>
              )}
            </div>
          ) : (
            <main className="list">
              {competitions.map((comp) => (
                <CompetitionCard
                  key={comp.id}
                  comp={comp}
                  onEdit={() => setEditing(comp)}
                  onDelete={() => handleDelete(comp)}
                  onStatusChange={(status) => handleStatusChange(comp, status)}
                />
              ))}
            </main>
          )}
        </>
      )}

      {editing !== null && (
        <CompetitionForm
          initial={editing === 'new' ? null : editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  )
}
