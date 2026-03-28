"use client"

import { useServiceWorker } from '@/hooks/useServiceWorker'
import { useEffect } from 'react'
import { toast } from 'sonner'

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  const { isSupported, isRegistered, needRefresh, updateServiceWorker } = useServiceWorker()

  useEffect(() => {
    if (needRefresh) {
      toast.success('🚀 App update available!', {
        description: 'Click to refresh and get the latest features',
        action: {
          label: 'Refresh Now',
          onClick: () => {
            toast.loading('Updating app...', { duration: 2000 })
            updateServiceWorker()
          }
        },
        duration: Infinity,
        important: true
      })
    }
  }, [needRefresh, updateServiceWorker])

  useEffect(() => {
    if (isRegistered) {

    }
  }, [isRegistered])

  return <>{children}</>
}