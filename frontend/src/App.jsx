import { useCallback, useEffect, useState } from 'react'
import { api } from './api'
import CompetitionCard from './components/CompetitionCard'
import CompetitionForm from './components/CompetitionForm'

export default function App() {
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
    refresh()
  }, [refresh])

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
        <button className="btn btn-primary" onClick={() => setEditing('new')}>
          + Add competition
        </button>
      </header>

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
    </div>
  )
}
