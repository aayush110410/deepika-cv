import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import { PLATFORM_LABELS } from '../constants'

const EMAIL_TYPES = ['announcement', 'reminder', 'round_clear', 'rejection', 'result', 'other']

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// One review card: the email on the left, editable extracted fields on the
// right. Confirm creates or updates a Competition via the API; all decisions
// happen server-side.
function ReviewCard({ email, competitions, onDone, onError }) {
  const extracted = email.extracted_json ?? {}
  const failed = Boolean(extracted.error)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    competition_id: '',
    competition_name: extracted.competition_name ?? '',
    organizer: extracted.organizer ?? '',
    platform: extracted.platform ?? 'other',
    deadline: extracted.deadline ? extracted.deadline.slice(0, 16) : '',
    round_number: extracted.round_number ?? '',
    email_type: extracted.email_type ?? 'other',
  })

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  async function handleConfirm(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await api.confirmEmail(email.id, {
        competition_id: form.competition_id ? Number(form.competition_id) : null,
        competition_name: form.competition_name || null,
        organizer: form.organizer,
        platform: form.platform,
        deadline: form.deadline || null,
        round_number: form.round_number ? Number(form.round_number) : null,
        email_type: form.email_type,
      })
      onDone()
    } catch (err) {
      onError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDismiss() {
    setBusy(true)
    try {
      await api.dismissEmail(email.id)
      onDone()
    } catch (err) {
      onError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const linkingExisting = form.competition_id !== ''

  return (
    <article className="review-card">
      <div className="review-email">
        <div className="review-email-head">
          <strong>{email.subject || '(no subject)'}</strong>
          <span className="muted">{email.sender}</span>
          <span className="muted">{formatDate(email.received_at)}</span>
          <span className="pill pill-grey">
            {failed
              ? 'extraction failed'
              : `confidence ${Math.round((email.confidence ?? 0) * 100)}%`}
          </span>
        </div>
        {failed && <p className="error-banner">Extractor error: {extracted.error}</p>}
        <p className="email-snippet">{email.raw_body_snippet || '(empty body)'}</p>
      </div>

      <form className="review-form" onSubmit={handleConfirm}>
        <label>
          Link to
          <select value={form.competition_id} onChange={set('competition_id')}>
            <option value="">➕ Create new competition</option>
            {competitions.map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.name}
              </option>
            ))}
          </select>
        </label>

        {!linkingExisting && (
          <>
            <label>
              Name *
              <input value={form.competition_name} onChange={set('competition_name')} required />
            </label>
            <label>
              Organizer
              <input value={form.organizer} onChange={set('organizer')} />
            </label>
            <label>
              Platform
              <select value={form.platform} onChange={set('platform')}>
                {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        <div className="form-row">
          <label>
            Round
            <input type="number" min="1" value={form.round_number} onChange={set('round_number')} />
          </label>
          <label>
            Email type
            <select value={form.email_type} onChange={set('email_type')}>
              {EMAIL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replace('_', ' ')}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Deadline
          <input type="datetime-local" value={form.deadline} onChange={set('deadline')} />
        </label>
        {linkingExisting && (
          <p className="muted small">
            Confirming updates the linked competition's round/deadline (an empty deadline never
            clears the existing one).
          </p>
        )}

        <div className="modal-actions">
          <button type="button" className="btn" onClick={handleDismiss} disabled={busy}>
            Dismiss
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Confirm
          </button>
        </div>
      </form>
    </article>
  )
}

export default function ReviewView() {
  const [emails, setEmails] = useState(null)
  const [competitions, setCompetitions] = useState([])
  const [notice, setNotice] = useState(null)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const [pending, comps] = await Promise.all([
        api.listEmails('needs_review'),
        api.listCompetitions(),
      ])
      setEmails(pending)
      setCompetitions(comps)
    } catch (err) {
      setNotice({ kind: 'err', text: err.message })
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function handleProcess() {
    setBusy(true)
    setNotice(null)
    try {
      const result = await api.processEmails()
      setNotice({
        kind: result.extractor_error ? 'err' : 'ok',
        text: result.extractor_error
          ? `Extractor unavailable: ${result.extractor_error}`
          : `Processed ${result.processed}: ${result.needs_review} to review, ` +
            `${result.dismissed} dismissed` +
            (result.parse_failed ? `, ${result.parse_failed} unparseable` : ''),
      })
      await refresh()
    } catch (err) {
      setNotice({ kind: 'err', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <main>
      <div className="sync-bar">
        <div className="sync-info">
          <span>
            {emails === null ? 'Loading…' : `${emails.length} email(s) waiting for review`}
          </span>
        </div>
        <div className="sync-actions">
          <button className="btn" onClick={handleProcess} disabled={busy}>
            {busy ? 'Working…' : 'Run extraction'}
          </button>
        </div>
      </div>

      {notice && (
        <div className={notice.kind === 'err' ? 'error-banner' : 'ok-banner'}>{notice.text}</div>
      )}

      {emails === null ? (
        <p className="muted">Loading…</p>
      ) : emails.length === 0 ? (
        <div className="empty">
          <p>Review queue is empty. Sync emails, then extracted candidates land here.</p>
        </div>
      ) : (
        <div className="list">
          {emails.map((email) => (
            <ReviewCard
              key={email.id}
              email={email}
              competitions={competitions}
              onDone={refresh}
              onError={(text) => setNotice({ kind: 'err', text })}
            />
          ))}
        </div>
      )}
    </main>
  )
}
