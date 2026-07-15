// The only file that knows about the backend API.

async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${res.status} ${res.statusText}${body ? ` — ${body}` : ''}`)
  }
  return res.status === 204 ? null : res.json()
}

export const api = {
  listCompetitions: () => request('/api/competitions'),
  createCompetition: (data) =>
    request('/api/competitions', { method: 'POST', body: JSON.stringify(data) }),
  updateCompetition: (id, data) =>
    request(`/api/competitions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCompetition: (id) =>
    request(`/api/competitions/${id}`, { method: 'DELETE' }),
}
