import { useState } from 'react'
import { PLATFORM_LABELS, STATUS_LABELS } from '../constants'

// datetime-local wants "YYYY-MM-DDTHH:mm"; the API uses naive ISO strings.
function toInputValue(iso) {
  return iso ? iso.slice(0, 16) : ''
}

export default function CompetitionForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    organizer: initial?.organizer ?? '',
    platform: initial?.platform ?? 'other',
    current_round: initial?.current_round ?? 1,
    current_deadline: toInputValue(initial?.current_deadline),
    status: initial?.status ?? 'upcoming',
    notes: initial?.notes ?? '',
  })

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  function handleSubmit(e) {
    e.preventDefault()
    onSave({
      ...form,
      current_round: Number(form.current_round) || 1,
      current_deadline: form.current_deadline || null,
    })
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>{initial ? 'Edit competition' : 'Add competition'}</h2>

        <label>
          Name *
          <input value={form.name} onChange={set('name')} required autoFocus />
        </label>

        <label>
          Organizer
          <input value={form.organizer} onChange={set('organizer')} />
        </label>

        <div className="form-row">
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
          <label>
            Round
            <input
              type="number"
              min="1"
              value={form.current_round}
              onChange={set('current_round')}
            />
          </label>
        </div>

        <label>
          Deadline
          <input
            type="datetime-local"
            value={form.current_deadline}
            onChange={set('current_deadline')}
          />
        </label>

        <label>
          Status
          <select value={form.status} onChange={set('status')}>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Notes
          <textarea rows="3" value={form.notes} onChange={set('notes')} />
        </label>

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {initial ? 'Save' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  )
}
