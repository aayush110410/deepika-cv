import { useCallback, useEffect, useState } from 'react'
import { api } from './api'
import CompetitionCard from './components/CompetitionCard'
import CompetitionForm from './components/CompetitionForm'
import EmailsView from './components/EmailsView'
import ReviewView from './components/ReviewView'

export default function App() {
  const [view, setView] = useState('competitions') // 'competitions' | 'emails'
  const [competitions, setCompetitions] = useState(null) // null = loading
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null) // null | 'new' | competition

  const refresh = useCallback(async () => {
    try {
      setCompetitions(await api.listCompetitions())
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    // Re-fetch on every return to the competitions view — confirms in the
    // Review tab create/update competitions behind this list's back.
    if (view === 'competitions') refresh()
  }, [view, refresh])

  async function handleSave(data) {
    try {
      if (editing === 'new') await api.createCompetition(data)
      else await api.updateCompetition(editing.id, data)
      setEditing(null)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(comp) {
    if (!window.confirm(`Delete "${comp.name}"?`)) return
    try {
      await api.deleteCompetition(comp.id)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleStatusChange(comp, status) {
    try {
      await api.updateCompetition(comp.id, { status })
      await refresh()
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
          <nav className="view-switch">
            <button
              className={view === 'competitions' ? 'active' : ''}
              onClick={() => setView('competitions')}
            >
              Competitions
            </button>
            <button
              className={view === 'review' ? 'active' : ''}
              onClick={() => setView('review')}
            >
              Review
            </button>
            <button
              className={view === 'emails' ? 'active' : ''}
              onClick={() => setView('emails')}
            >
              Emails
            </button>
          </nav>
          {view === 'competitions' && (
            <button className="btn btn-primary" onClick={() => setEditing('new')}>
              + Add competition
            </button>
          )}
        </div>
      </header>

      {view === 'emails' ? (
        <EmailsView />
      ) : view === 'review' ? (
        <ReviewView />
      ) : (
        <>
          {error && <div className="error-banner">API error: {error}</div>}

          {competitions === null ? (
            <p className="muted">Loading…</p>
          ) : competitions.length === 0 ? (
            <div className="empty">
              <p>No competitions tracked yet.</p>
              <button className="btn btn-primary" onClick={() => setEditing('new')}>
                Add your first one
              </button>
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

          {editing !== null && (
            <CompetitionForm
              initial={editing === 'new' ? null : editing}
              onSave={handleSave}
              onCancel={() => setEditing(null)}
            />
          )}
        </>
      )}
    </div>
  )
}
