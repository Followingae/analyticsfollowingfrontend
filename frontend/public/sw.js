// Service Worker for Following Analytics Platform — Minimal & Bulletproof
const CACHE_NAME = 'following-v4'

// Install: skip waiting immediately, don't cache anything that could fail
self.addEventListener('install', () => {
  self.skipWaiting()
})

// Activate: clean old caches, claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  )
})

// Fetch: network-first for everything, cache Next.js static assets only
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Only cache /_next/static/* (immutable build assets)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        }).catch(() => cached || new Response('', { status: 503 }))
      })
    )
    return
  }

  // Everything else: network only, no caching
  // Don't intercept API calls, images, or navigation — let the browser handle them
})

// Handle messages
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
