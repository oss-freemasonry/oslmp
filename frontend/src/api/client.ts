const BASE = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token')

  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  })

  if (response.status === 401) {
    localStorage.removeItem('token')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error((body as { message?: string }).message ?? 'Something went wrong')
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

async function upload<T>(path: string, body: FormData): Promise<T> {
  const token = localStorage.getItem('token')

  const response = await fetch(`${BASE}${path}`, {
    method: 'POST',
    body,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (response.status === 401) {
    localStorage.removeItem('token')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? 'Something went wrong')
  }

  return response.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, body: FormData) => upload<T>(path, body),
}
