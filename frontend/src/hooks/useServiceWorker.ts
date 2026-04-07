// hooks/useServiceWorker.ts
import { useEffect, useState, useRef } from 'react'

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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const controllerChangeHandlerRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    // Check if service worker is supported
    if ('serviceWorker' in navigator) {
      setIsSupported(true)
      registerServiceWorker()
    }

    return () => {
      // Cleanup interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      // Cleanup controllerchange listener
      if (controllerChangeHandlerRef.current && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', controllerChangeHandlerRef.current)
        controllerChangeHandlerRef.current = null
      }
    }
  }, [])

  const registerServiceWorker = async () => {
    try {

      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      })

      setRegistration(reg)
      setIsRegistered(true)


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

              } else {
                // First install

              }
              setIsUpdating(false)
            }
          })
        }
      })

      // Handle controller change (when new SW takes control)
      const onControllerChange = () => {
        // needRefresh is checked via closure at time of event
        window.location.reload()
      }
      controllerChangeHandlerRef.current = onControllerChange
      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

      // Periodic update check
      intervalRef.current = setInterval(() => {
        reg.update()
      }, 60000) // Check every minute

    } catch (error) {
      console.error('Service worker registration failed:', error)
      setIsRegistered(false)
    }
  }

  const updateServiceWorker = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      setNeedRefresh(false)
      // Give SW time to take control, then reload
      setTimeout(() => {
        window.location.reload()
      }, 100)
    } else {
      // Fallback: just reload the page
      window.location.reload()
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
