import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// Raw ingestion view: exists so the Gmail filter can be tuned — shows exactly
// what a sync pulled in, nothing more. Extraction comes in Phase 3.
export default function EmailsView() {
  const [emails, setEmails] = useState(null)
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null) // { kind: 'ok' | 'err', text }

  const refresh = useCallback(async () => {
    try {
      const [emailList, syncStatus] = await Promise.all([api.listEmails(), api.syncStatus()])
      setEmails(emailList)
      setStatus(syncStatus)
    } catch (err) {
      setNotice({ kind: 'err', text: err.message })
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function handleConnect() {
    setBusy(true)
    setNotice({ kind: 'ok', text: 'Complete the Google consent screen in the browser window that just opened on the machine running the backend…' })
    try {
      await api.gmailConnect()
      setNotice({ kind: 'ok', text: 'Gmail connected.' })
      await refresh()
    } catch (err) {
      setNotice({ kind: 'err', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  async function handleSync() {
    setBusy(true)
    setNotice(null)
    try {
      const result = await api.syncNow()
      const extraction = result.extraction
      const extractionText = extraction.extractor_error
        ? ` Extraction skipped: ${extraction.extractor_error}`
        : ` Extracted ${extraction.processed}: ${extraction.needs_review} to review, ${extraction.dismissed} dismissed.`
      setNotice({
        kind: extraction.extractor_error ? 'err' : 'ok',
        text:
          `Sync done: ${result.matched} matched the filter, ` +
          `${result.stored_new} new stored, ${result.skipped_existing} already known` +
          (result.truncated ? ' (hit the per-sync cap — sync again for more)' : '') +
          '.' +
          extractionText,
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
          <span className={status?.gmail_connected ? 'dot dot-on' : 'dot dot-off'} />
          <span>
            {status === null
              ? 'Loading…'
              : status.gmail_connected
                ? 'Gmail connected'
                : status.has_credentials_file
                  ? 'Gmail not connected yet'
                  : 'No credentials.json — see README for Google Cloud setup'}
          </span>
          <span className="muted">
            {status?.last_synced_at
              ? `· Last sync ${formatDate(status.last_synced_at)}`
              : '· Never synced'}
            {status ? ` · ${status.email_count} emails stored` : ''}
          </span>
        </div>
        <div className="sync-actions">
          {status && !status.gmail_connected && (
            <button className="btn" onClick={handleConnect} disabled={busy}>
              Connect Gmail
            </button>
          )}
          <button className="btn btn-primary" onClick={handleSync} disabled={busy}>
            {busy ? 'Working…' : 'Sync Now'}
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
          <p>No emails synced yet. Connect Gmail and hit Sync Now.</p>
        </div>
      ) : (
        <div className="email-list">
          {emails.map((email) => (
            <details key={email.id} className="email-row">
              <summary>
                <span className="email-date">{formatDate(email.received_at)}</span>
                <span className="email-sender">{email.sender}</span>
                <span className="email-subject">{email.subject || '(no subject)'}</span>
                <span className={`chip chip-${email.review_status}`}>{email.review_status}</span>
              </summary>
              <p className="email-snippet">{email.raw_body_snippet || '(empty body)'}</p>
            </details>
          ))}
        </div>
      )}
    </main>
  )
}
