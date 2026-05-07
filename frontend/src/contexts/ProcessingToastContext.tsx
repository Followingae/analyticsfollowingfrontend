'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { ToastLoader } from '@/components/ui/toast-loader'
import { useNotifications } from '@/contexts/NotificationContext'

interface ProcessingToast {
  username: string
  startedAt: number
  id: string
}

// Latest backend status for a given username's in-flight job. Set by
// the `creator-search-progress` window event (emitted by useCreatorSearch).
interface ToastProgress {
  progress_percent?: number
  progress_message?: string | null
  current_stage?: string
  status?: string
}

interface ProcessingToastContextType {
  addProcessingToast: (username: string) => void
  removeProcessingToast: (username: string) => void
  clearAllProcessingToasts: () => void
  processingToasts: ProcessingToast[]
}

const ProcessingToastContext = createContext<ProcessingToastContextType | undefined>(undefined)

const STORAGE_KEY = 'processing-toasts'
const POLL_INTERVAL = 20000 // 20 seconds
const STALE_TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes — auto-remove stale toasts

export function ProcessingToastProvider({ children }: { children: React.ReactNode }) {
  const [processingToasts, setProcessingToasts] = useState<ProcessingToast[]>([])
  const [toastIds, setToastIds] = useState<Map<string, string | number>>(new Map())
  const [consolidatedToastId, setConsolidatedToastId] = useState<string | number | null>(null)
  const [completedToasts, setCompletedToasts] = useState<string[]>([])
  // F3: keep latest backend status per username so toast can render real progress
  const [progressByUsername, setProgressByUsername] = useState<Record<string, ToastProgress>>({})
  const { refresh: refreshNotifications } = useNotifications()
  const queryClient = useQueryClient()
  const prevToastCountRef = useRef(0)
  const processingToastsRef = useRef<ProcessingToast[]>(processingToasts)

  // Load from localStorage on mount and check completion
  useEffect(() => {
    const loadAndCheck = async () => {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const toasts = JSON.parse(stored) as ProcessingToast[]


          if (toasts.length === 0) {
            return
          }

          // Immediately verify if these are still processing
          try {
            const storedTokens = localStorage.getItem('auth_tokens')
            if (storedTokens) {
              const tokenData = JSON.parse(storedTokens)
              if (tokenData?.access_token) {
                const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
                const response = await fetch(`${API_BASE_URL}/api/v1/auth/unlocked-profiles`, {
                  headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`,
                    'Content-Type': 'application/json',
                  },
                })

                if (response.ok) {
                  const data = await response.json()
                  let unlockedUsernames: string[] = []
                  if (Array.isArray(data.profiles)) {
                    unlockedUsernames = data.profiles.map((p: any) => p.username?.toLowerCase())
                  } else if (Array.isArray(data)) {
                    unlockedUsernames = data.map((p: any) => p.username?.toLowerCase())
                  } else if (Array.isArray(data.data?.profiles)) {
                    unlockedUsernames = data.data.profiles.map((p: any) => p.username?.toLowerCase())
                  }

                  // Filter out any undefined/null values
                  unlockedUsernames = unlockedUsernames.filter(Boolean)

                  // Filter out already completed toasts (case-insensitive comparison)
                  const stillProcessing = toasts.filter(t => !unlockedUsernames.includes(t.username.toLowerCase()))

                  if (stillProcessing.length !== toasts.length) {

                    setProcessingToasts(stillProcessing)
                  } else {
                    setProcessingToasts(toasts)
                  }
                  return
                }
              }
            }
          } catch (error) {
            console.error('Failed to verify processing toast completion:', error)
          }

          // Fallback: load toasts but filter out stale ones (>10 min old)
          const now = Date.now()
          const fresh = toasts.filter(t => now - t.startedAt < STALE_TIMEOUT_MS)
          if (fresh.length !== toasts.length) {

          }
          setProcessingToasts(fresh)
        } catch (error) {
          console.error('Failed to parse stored processing toasts:', error)
        }
      }
    }

    loadAndCheck()
  }, []) // Only run on mount

  // Keep ref in sync with state
  useEffect(() => {
    processingToastsRef.current = processingToasts
  }, [processingToasts])

  // Save to localStorage whenever processingToasts changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(processingToasts))
  }, [processingToasts])

  // Refresh notification bell when a processing toast is removed (job completed)
  useEffect(() => {
    const prevCount = prevToastCountRef.current
    const currentCount = processingToasts.length
    if (prevCount > 0 && currentCount < prevCount) {
      refreshNotifications()
    }
    prevToastCountRef.current = currentCount
  }, [processingToasts.length, refreshNotifications])

  const clearAllProcessingToasts = useCallback(() => {
    // Dismiss consolidated toast
    if (consolidatedToastId) {
      toast.dismiss(consolidatedToastId)
      setConsolidatedToastId(null)
    }

    // Clear all state
    setProcessingToasts([])
    setToastIds(new Map())
    setCompletedToasts([])
    localStorage.removeItem(STORAGE_KEY)


  }, [consolidatedToastId])

  const addProcessingToast = useCallback((username: string) => {
    const id = `${username}-${Date.now()}`
    const newToast: ProcessingToast = {
      username,
      startedAt: Date.now(),
      id
    }

    setProcessingToasts(prev => {
      // Don't add if username is already being processed
      if (prev.some(t => t.username === username)) {
        return prev
      }
      return [...prev, newToast]
    })
  }, [])

  const removeProcessingToast = useCallback((username: string) => {
    setProcessingToasts(prev => prev.filter(t => t.username !== username))
  }, [])

  // Update consolidated toast when processing or completed toasts change
  useEffect(() => {
    // Dismiss existing toast
    if (consolidatedToastId) {
      toast.dismiss(consolidatedToastId)
      setConsolidatedToastId(null)
    }

    // Don't show toast if no items
    if (processingToasts.length === 0) {
      return
    }

    // Don't show toast if not authenticated (but don't clear state - just don't show)
    const storedTokens = localStorage.getItem('auth_tokens')
    if (!storedTokens) {

      return
    }

    // F3: render real backend progress when single creator processing.
    // Pull latest progress for the username; if missing (first ~4s before
    // first poll lands), fall through to the spinner-only state.
    const single = processingToasts.length === 1 ? processingToasts[0] : null
    const singleProgress = single ? progressByUsername[single.username] : undefined
    const pct =
      typeof singleProgress?.progress_percent === 'number'
        ? Math.max(0, Math.min(100, singleProgress.progress_percent))
        : undefined
    const subtitle = single
      ? singleProgress?.progress_message ||
        (typeof pct === 'number' ? `${Math.round(pct)}% complete` : 'Starting analysis…')
      : `${processingToasts.slice(0, 2).map(t => t.username).join(', ')}${processingToasts.length > 2 ? ` +${processingToasts.length - 2} more` : ''}`

    const toastId = toast(
      <div className="flex items-center gap-3 min-w-[260px]">
        <ToastLoader size={40} text="AI" />
        <div className="flex-1">
          <div className="font-medium">
            {single
              ? `Analyzing @${single.username}`
              : `Processing ${processingToasts.length} creators`}
          </div>
          <div className="text-xs text-gray-400">{subtitle}</div>
          {single && typeof pct === 'number' && (
            <div className="mt-1.5 h-1 w-full bg-gray-700/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>
      </div>,
      {
        duration: Infinity,
        position: 'bottom-center',
        className: 'bg-gray-900/95 text-white border-gray-700',
      }
    )

    setConsolidatedToastId(toastId)
  }, [processingToasts, progressByUsername])

  // Extract polling logic into reusable function
  const checkCompletionNow = useCallback(async () => {
      try {
        // Get auth tokens properly
        const storedTokens = localStorage.getItem('auth_tokens')
        if (!storedTokens) {

          return
        }

        const tokenData = JSON.parse(storedTokens)
        if (!tokenData?.access_token) {

          return
        }

        // Use the correct API endpoint and base URL
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/unlocked-profiles`, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()


          // Handle different possible response structures
          let unlockedUsernames: string[] = []
          if (Array.isArray(data.profiles)) {
            unlockedUsernames = data.profiles.map((p: any) => p.username?.toLowerCase())
          } else if (Array.isArray(data)) {
            unlockedUsernames = data.map((p: any) => p.username?.toLowerCase())
          } else if (Array.isArray(data.data?.profiles)) {
            unlockedUsernames = data.data.profiles.map((p: any) => p.username?.toLowerCase())
          }

          // Filter out any undefined/null values
          unlockedUsernames = unlockedUsernames.filter(Boolean)




          // Remove toasts for completed processing (case-insensitive comparison)
          let anyCompleted = false
          processingToastsRef.current.forEach(toastItem => {
            const normalizedUsername = toastItem.username.toLowerCase()
            if (unlockedUsernames.includes(normalizedUsername)) {
              anyCompleted = true
              removeProcessingToast(toastItem.username)

              // Show success toast that navigates to the creator on click
              toast.success(`Analytics ready for ${toastItem.username}`, {
                position: 'bottom-center',
                duration: 5000,
                action: {
                  label: 'Open',
                  onClick: () => {
                    window.location.href = `/creator-analytics/${toastItem.username}`
                  },
                },
              })
            }
          })

          // Refresh any list that depends on unlocked profiles so newly-ready
          // creators appear immediately instead of waiting on staleTime.
          if (anyCompleted) {
            queryClient.invalidateQueries({ queryKey: ['unlocked-creators-page'] })
            queryClient.invalidateQueries({ queryKey: ['unlocked-profiles'] })
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
          }
        } else {

        }
      } catch (error) {
        console.error('Processing toast completion check failed:', error)
      }
  }, [removeProcessingToast])

  // Polling logic to check for completion (skip when tab is hidden)
  useEffect(() => {
    if (processingToasts.length === 0) return

    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      checkCompletionNow()
    }, POLL_INTERVAL)

    // Resume polling immediately when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && processingToastsRef.current.length > 0) {
        checkCompletionNow()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [processingToasts.length, checkCompletionNow])

  // Listen for job-failed events from useJobPolling and remove matching toasts.
  // F7: terminal job state (completed/failed) is what dismisses the toast — no
  // longer dependent on the lazy 20s unlocked-profiles poll.
  useEffect(() => {
    const handleJobFailed = (event: Event) => {
      const detail = (event as CustomEvent).detail
      const failedUsername = detail?.username
      if (failedUsername) {
        const normalized = failedUsername.toLowerCase()
        const match = processingToasts.find(
          t => t.username.toLowerCase() === normalized
        )
        if (match) {
          removeProcessingToast(match.username)
          // Clear stored progress for this username
          setProgressByUsername(prev => {
            const { [match.username]: _, ...rest } = prev
            return rest
          })
          toast.error(`Processing failed for @${match.username}`, {
            position: 'bottom-center',
            duration: 5000,
          })
        }
      }
    }

    const handleJobCompleted = (event: Event) => {
      const detail = (event as CustomEvent).detail
      const result = detail?.result
      const username =
        result?.profile?.username || result?.username
      if (username) {
        const normalized = username.toLowerCase()
        const match = processingToasts.find(
          t => t.username.toLowerCase() === normalized
        )
        if (match) {
          removeProcessingToast(match.username)
          setProgressByUsername(prev => {
            const { [match.username]: _, ...rest } = prev
            return rest
          })
          // Invalidate dependent queries immediately on completion event
          queryClient.invalidateQueries({ queryKey: ['unlocked-creators-page'] })
          queryClient.invalidateQueries({ queryKey: ['unlocked-profiles'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        }
      }
    }

    // F1+F3: real backend progress events drive the toast UI
    const handleProgress = (event: Event) => {
      const detail = (event as CustomEvent).detail
      const username = detail?.username
      const status = detail?.status
      if (username && status) {
        setProgressByUsername(prev => ({
          ...prev,
          [username]: {
            progress_percent: status.progress_percent,
            progress_message: status.progress_message,
            current_stage: status.current_stage,
            status: status.status,
          },
        }))
      }
    }

    // F6: soft timeout — don't dismiss the toast or show an error. Just mark
    // the progress data so the UI shows "still processing in background".
    // The 20s unlocked-profiles poll will catch completion when it lands.
    const handlePollingTimeout = (event: Event) => {
      const detail = (event as CustomEvent).detail
      const username = detail?.username
      if (username && processingToasts.some(t => t.username.toLowerCase() === username.toLowerCase())) {
        setProgressByUsername(prev => ({
          ...prev,
          [username]: {
            ...(prev[username] || {}),
            progress_message: 'Still working in background — check notifications',
            status: 'processing',
          },
        }))
      }
    }

    window.addEventListener('job-failed', handleJobFailed)
    window.addEventListener('job-completed', handleJobCompleted)
    window.addEventListener('creator-search-progress', handleProgress)
    window.addEventListener('job-polling-timeout', handlePollingTimeout)
    return () => {
      window.removeEventListener('job-failed', handleJobFailed)
      window.removeEventListener('job-completed', handleJobCompleted)
      window.removeEventListener('creator-search-progress', handleProgress)
      window.removeEventListener('job-polling-timeout', handlePollingTimeout)
    }
  }, [processingToasts, removeProcessingToast, queryClient])

  // Staleness safety net: auto-remove toasts older than 10 minutes
  useEffect(() => {
    if (processingToasts.length === 0) return

    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      const now = Date.now()
      processingToasts.forEach(t => {
        if (now - t.startedAt > STALE_TIMEOUT_MS) {
          removeProcessingToast(t.username)
          toast.error(
            `Processing timed out for @${t.username}. Please try again.`,
            { position: 'bottom-center', duration: 6000 }
          )
        }
      })
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [processingToasts, removeProcessingToast])

  return (
    <ProcessingToastContext.Provider value={{
      addProcessingToast,
      removeProcessingToast,
      clearAllProcessingToasts,
      processingToasts
    }}>
      {children}
    </ProcessingToastContext.Provider>
  )
}

export function useProcessingToast() {
  const context = useContext(ProcessingToastContext)
  if (context === undefined) {
    throw new Error('useProcessingToast must be used within a ProcessingToastProvider')
  }
  return context
}