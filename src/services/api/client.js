export const getApiBaseUrl = () => import.meta.env.VITE_API_URL || ''

export async function api(path, options = {}) {
  const base = getApiBaseUrl()
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
}
