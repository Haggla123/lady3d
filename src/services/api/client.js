export const getApiBaseUrl = () => import.meta.env.VITE_API_URL || ''

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
    const response = await fetch(`${base}/api${path}`, {
      credentials: 'include',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
    const text = response.status === 204 ? null : await response.text()
    let data = null
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        const clean = text.replace(/<[^>]*>/g, '').trim()
        data = { error: clean || `Request failed (${response.status})` }
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
