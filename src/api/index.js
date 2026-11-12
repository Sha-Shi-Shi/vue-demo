const BASE_URL = '/api'

function buildQuery(params = {}) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.append(key, value)
    }
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

async function request(path, options = {}) {
  const response = await fetch(BASE_URL + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  let payload = null
  try {
    payload = await response.json()
  } catch {
    throw new Error('服务返回了无法解析的数据，请确认后端已启动')
  }

  if (!response.ok) {
    throw new Error(payload?.message || `请求失败（HTTP ${response.status}）`)
  }
  if (!payload?.success) {
    throw new Error(payload?.message || '操作失败')
  }
  return payload.data
}

export const authApi = {
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
}

export const studentPortalApi = {
  dashboard: (studentId) => request(`/student/dashboard${buildQuery({ studentId })}`),
  profile: (studentId) => request(`/student/profile${buildQuery({ studentId })}`),
  updateProfile: (studentId, data) =>
    request(`/student/profile${buildQuery({ studentId })}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
}

export const overviewApi = {
  get: () => request('/overview'),
}

export const roomApi = {
  list: (params = {}) => request(`/rooms${buildQuery(params)}`),
  create: (data) => request('/rooms', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => request(`/rooms/${id}`, { method: 'DELETE' }),
}

export const studentApi = {
  list: (params = {}) => request(`/students${buildQuery(params)}`),
  create: (data) => request('/students', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => request(`/students/${id}`, { method: 'DELETE' }),
}

export const repairApi = {
  list: (params = {}) => request(`/repairs${buildQuery(params)}`),
  create: (data) => request('/repairs', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id, data) => request(`/repairs/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id, params = {}) => request(`/repairs/${id}${buildQuery(params)}`, { method: 'DELETE' }),
}
