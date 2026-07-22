// Service Worker for Following Analytics Platform — Minimal & Bulletproof
// RULE: Never block installation. Never cache expiring URLs. Never intercept API calls.
const CACHE_NAME = 'following-v5'

// Install: skip waiting immediately, don't cache anything that could fail
self.addEventListener('install', () => {
  self.skipWaiting()
})

// Activate: clean old caches, claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) =>
        Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
      )
      .then(() => self.clients.claim())
      .catch(() => self.clients.claim())
  )
})

// Fetch: network-first for everything, cache Next.js static assets only
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Never intercept non-http(s) protocols (chrome-extension:, etc.)
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return

  // Never intercept localhost
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return

  // Never intercept API requests — let them pass through to the network
  if (url.pathname.startsWith('/api/')) return

  // Never intercept Instagram CDN images — they expire and caching causes 503s
  if (url.hostname.includes('cdninstagram.com') || url.hostname.includes('fbcdn.net')) return

  // Only cache /_next/static/* (immutable build assets with content hashes)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {})
          }
          return response
        }).catch(() => {
          // Network failed and no cache — return empty 503
          return new Response('', { status: 503 })
        })
      }).catch(() => {
        // Cache lookup itself failed — just fetch from network
        return fetch(request).catch(() => new Response('', { status: 503 }))
      })
    )
    return
  }

  // Everything else: network only, no caching, no interception
})

// Handle messages
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
