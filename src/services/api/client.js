export const getApiBaseUrl = () => (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

const TOKEN_KEY = 'lady3d_token'

export const getAuthToken = () => {
  try {
    return typeof window !== 'undefined' ? (window.localStorage.getItem(TOKEN_KEY) || '') : ''
  } catch {
    return ''
  }
}

export const setAuthToken = token => {
  try {
    if (typeof window !== 'undefined') {
      if (token) window.localStorage.setItem(TOKEN_KEY, token)
      else window.localStorage.removeItem(TOKEN_KEY)
    }
  } catch {}
}

let activeRequests = 0
const listeners = new Set()

const notify = () => {
  const isBusy = activeRequests > 0
  for (const listener of listeners) {
    try { listener(isBusy, activeRequests) } catch {}
  }
}

export const subscribeApiActivity = listener => {
  listeners.add(listener)
  try { listener(activeRequests > 0, activeRequests) } catch {}
  return () => listeners.delete(listener)
}

export const isApiBusy = () => activeRequests > 0

export async function api(path, options = {}) {
  const base = getApiBaseUrl()
  activeRequests++
  notify()
  try {
    const token = getAuthToken()
    const response = await fetch(`${base}/api${path}`, {
      credentials: 'include',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    })
    const text = response.status === 204 ? null : await response.text()
    let data = null
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        if (response.ok && (response.headers.get('content-type')?.includes('text/html') || /^\s*</.test(text))) {
          throw new Error('The API returned a website page instead of data. Set VITE_API_URL to your deployed backend URL and redeploy the frontend.')
        }
        if (!response.ok && (response.headers.get('content-type')?.includes('text/html') || /^\s*</.test(text))) {
          data = { error: `Request failed (${response.status})` }
        } else {
          const clean = text.trim()
          data = { error: clean || `Request failed (${response.status})` }
        }
      }
    }
    if (!response.ok) {
      throw new Error(data?.error || `Request failed (${response.status})`)
    }
    return data
  } finally {
    activeRequests = Math.max(0, activeRequests - 1)
    notify()
  }
}
