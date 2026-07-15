import { PLATFORM_LABELS, STATUS_LABELS } from '../constants'

function formatDeadline(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// Pure display formatting — urgency/sort decisions come from the API.
function countdownLabel(daysLeft) {
  if (daysLeft == null) return 'No deadline'
  if (daysLeft < 0) return 'Overdue'
  if (daysLeft < 1) return `Due in ${Math.max(1, Math.round(daysLeft * 24))}h`
  const days = Math.floor(daysLeft)
  return days === 1 ? 'Due in 1 day' : `Due in ${days} days`
}

export default function CompetitionCard({ comp, onEdit, onDelete, onStatusChange }) {
  return (
    <article className={`card urgency-${comp.urgency}`}>
      <div className="card-main">
        <div className="card-title-row">
          <h2>{comp.name}</h2>
          <span className="chip">{PLATFORM_LABELS[comp.platform] ?? comp.platform}</span>
          <span className="chip">Round {comp.current_round}</span>
        </div>
        {comp.organizer && <p className="organizer">{comp.organizer}</p>}
        {comp.notes && <p className="notes">{comp.notes}</p>}
      </div>

      <div className="card-side">
        <span className={`pill pill-${comp.urgency}`}>{countdownLabel(comp.days_left)}</span>
        <span className="deadline">
          {comp.current_deadline ? formatDeadline(comp.current_deadline) : '—'}
        </span>
      </div>

      <div className="card-actions">
        <select
          value={comp.status}
          onChange={(e) => onStatusChange(e.target.value)}
          aria-label={`Status of ${comp.name}`}
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button className="btn" onClick={onEdit}>
          Edit
        </button>
        <button className="btn btn-danger" onClick={onDelete}>
          Delete
        </button>
      </div>
    </article>
  )
}
