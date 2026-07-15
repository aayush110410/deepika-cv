// The only file that knows about the backend API.

async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.text()
    let detail = body
    try {
      detail = JSON.parse(body).detail ?? body
    } catch { /* not JSON — keep raw text */ }
    if (typeof detail !== 'string') detail = JSON.stringify(detail)
    throw new Error(`${res.status} ${res.statusText}${detail ? ` — ${detail}` : ''}`)
  }
  return res.status === 204 ? null : res.json()
}

export const api = {
  listCompetitions: (bucket) =>
    request(`/api/competitions${bucket ? `?bucket=${bucket}` : ''}`),
  overview: () => request('/api/overview'),
  createCompetition: (data) =>
    request('/api/competitions', { method: 'POST', body: JSON.stringify(data) }),
  updateCompetition: (id, data) =>
    request(`/api/competitions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCompetition: (id) =>
    request(`/api/competitions/${id}`, { method: 'DELETE' }),

  listEmails: (reviewStatus) =>
    request(`/api/emails${reviewStatus ? `?review_status=${reviewStatus}` : ''}`),
  syncStatus: () => request('/api/sync/status'),
  syncNow: () => request('/api/sync/now', { method: 'POST' }),
  gmailConnect: () => request('/api/gmail/connect', { method: 'POST' }),

  processEmails: () => request('/api/emails/process', { method: 'POST' }),
  confirmEmail: (id, data) =>
    request(`/api/emails/${id}/confirm`, { method: 'POST', body: JSON.stringify(data) }),
  dismissEmail: (id) => request(`/api/emails/${id}/dismiss`, { method: 'POST' }),
}
