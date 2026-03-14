const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

let tokenGetter: (() => Promise<string | null>) | null = null

export function setTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter
}

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message)
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (tokenGetter) {
    const token = await tokenGetter()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText, code: 'UNKNOWN' }))
    throw new ApiError(res.status, body.code, body.error)
  }

  const json = await res.json()
  return json.data !== undefined ? json.data : json
}
