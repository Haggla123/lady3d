// Lady 3D's Catering - PWA Service Worker
const CACHE_NAME = 'lady3d-cache-v1'
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/lady3d-logo.jpg',
  '/campus-branch-flyer.jpg',
  '/main-branch-signboard.jpg'
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE)
    }).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    }).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put('/index.html', response.clone()))
      return response
    }).catch(() => caches.match('/index.html')))
    return
  }
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached
      return fetch(event.request).then(response => {
        if (response.ok && response.type === 'basic') caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()))
        return response
      })
    })
  )
})
