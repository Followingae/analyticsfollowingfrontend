// hooks/useServiceWorker.ts
import { useEffect, useState } from 'react'

interface ServiceWorkerStatus {
  isSupported: boolean
  isRegistered: boolean
  isUpdating: boolean
  needRefresh: boolean
  updateServiceWorker: () => void
}

export const useServiceWorker = (): ServiceWorkerStatus => {
  const [isSupported, setIsSupported] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [needRefresh, setNeedRefresh] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    // Check if service worker is supported
    if ('serviceWorker' in navigator) {
      setIsSupported(true)
      registerServiceWorker()
    }
  }, [])

  const registerServiceWorker = async () => {
    try {
      console.log('Service Worker: Registering...')
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      })

      setRegistration(reg)
      setIsRegistered(true)
      console.log('Service Worker: Registered successfully', reg)

      // Check for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (newWorker) {
          setIsUpdating(true)
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New update available
                setNeedRefresh(true)
                console.log('Service Worker: New version available')
              } else {
                // First install
                console.log('Service Worker: First install complete')
              }
              setIsUpdating(false)
            }
          })
        }
      })

      // Handle controller change (when new SW takes control)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (needRefresh) {
          window.location.reload()
        }
      })

      // Periodic update check
      setInterval(() => {
        reg.update()
      }, 60000) // Check every minute

    } catch (error) {
      console.error('Service Worker: Registration failed', error)
      setIsRegistered(false)
    }
  }

  const updateServiceWorker = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  }

  return {
    isSupported,
    isRegistered,
    isUpdating,
    needRefresh,
    updateServiceWorker
  }
}

// Service Worker messaging utilities
export const sendMessageToSW = (message: any) => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message)
  }
}

// Cache invalidation utility
export const invalidateCache = async (pattern?: string) => {
  sendMessageToSW({
    type: 'INVALIDATE_CACHE',
    pattern: pattern || '*'
  })
}

// Force cache refresh for specific URLs
export const refreshCacheForURL = async (url: string) => {
  sendMessageToSW({
    type: 'REFRESH_CACHE',
    url
  })
}