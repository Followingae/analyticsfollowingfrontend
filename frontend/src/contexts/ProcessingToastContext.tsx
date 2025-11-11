'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { ToastLoader } from '@/components/ui/toast-loader'

interface ProcessingToast {
  username: string
  startedAt: number
  id: string
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

export function ProcessingToastProvider({ children }: { children: React.ReactNode }) {
  const [processingToasts, setProcessingToasts] = useState<ProcessingToast[]>([])
  const [toastIds, setToastIds] = useState<Map<string, string | number>>(new Map())
  const [consolidatedToastId, setConsolidatedToastId] = useState<string | number | null>(null)
  const [completedToasts, setCompletedToasts] = useState<string[]>([])

  // Load from localStorage on mount and check completion
  useEffect(() => {
    const loadAndCheck = async () => {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const toasts = JSON.parse(stored) as ProcessingToast[]
          console.log('🔄 Restored processing toasts from localStorage:', toasts)

          if (toasts.length === 0) {
            return
          }

          // Immediately verify if these are still processing
          try {
            const storedTokens = localStorage.getItem('auth_tokens')
            if (storedTokens) {
              const tokenData = JSON.parse(storedTokens)
              if (tokenData?.access_token) {
                const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
                const response = await fetch(`${API_BASE_URL}/api/v1/auth/unlocked-profiles`, {
                  headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`,
                    'Content-Type': 'application/json',
                  },
                })

                if (response.ok) {
                  const data = await response.json()
                  let unlockedUsernames: string[] = []
                  if (data.profiles) {
                    unlockedUsernames = data.profiles.map((p: any) => p.username?.toLowerCase())
                  } else if (Array.isArray(data)) {
                    unlockedUsernames = data.map((p: any) => p.username?.toLowerCase())
                  } else if (data.data?.profiles) {
                    unlockedUsernames = data.data.profiles.map((p: any) => p.username?.toLowerCase())
                  }

                  // Filter out any undefined/null values
                  unlockedUsernames = unlockedUsernames.filter(Boolean)

                  // Filter out already completed toasts (case-insensitive comparison)
                  const stillProcessing = toasts.filter(t => !unlockedUsernames.includes(t.username.toLowerCase()))

                  if (stillProcessing.length !== toasts.length) {
                    console.log(`🧹 Removed ${toasts.length - stillProcessing.length} completed toasts on mount`)
                    setProcessingToasts(stillProcessing)
                  } else {
                    setProcessingToasts(toasts)
                  }
                  return
                }
              }
            }
          } catch (error) {
            console.error('Failed to verify processing status on mount:', error)
          }

          // Fallback: just load the toasts
          setProcessingToasts(toasts)
        } catch (error) {
          console.error('Failed to parse stored processing toasts:', error)
        }
      }
    }

    loadAndCheck()
  }, []) // Only run on mount

  // Save to localStorage whenever processingToasts changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(processingToasts))
  }, [processingToasts])

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

    console.log('🧹 Cleared all processing toasts')
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
      console.log('Not authenticated, skipping toast display')
      return
    }

    // Show consolidated toast with your beautiful ToastLoader animation
    const toastId = toast(
      <div className="flex items-center gap-3">
        <ToastLoader size={40} text="AI" />
        <div>
          <div className="font-medium">
            {processingToasts.length === 1
              ? `AI Analytics Processing for ${processingToasts[0].username}`
              : `Processing ${processingToasts.length} creators with AI`
            }
          </div>
          <div className="text-xs text-gray-400">
            {processingToasts.slice(0, 2).map(t => t.username).join(', ')}
            {processingToasts.length > 2 && ` +${processingToasts.length - 2} more`}
          </div>
        </div>
      </div>,
      {
        duration: Infinity,
        position: 'bottom-center',
        className: 'bg-gray-900/95 text-white border-gray-700',
      }
    )

    setConsolidatedToastId(toastId)
  }, [processingToasts]) // Simplified dependencies to prevent infinite loops

  // Extract polling logic into reusable function
  const checkCompletionNow = useCallback(async () => {
      try {
        // Get auth tokens properly
        const storedTokens = localStorage.getItem('auth_tokens')
        if (!storedTokens) {
          console.log('No auth tokens found, skipping polling')
          return
        }

        const tokenData = JSON.parse(storedTokens)
        if (!tokenData?.access_token) {
          console.log('No access token found, skipping polling')
          return
        }

        // Use the correct API endpoint and base URL
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/unlocked-profiles`, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          console.log('Polling response:', data)

          // Handle different possible response structures
          let unlockedUsernames: string[] = []
          if (data.profiles) {
            unlockedUsernames = data.profiles.map((p: any) => p.username?.toLowerCase())
          } else if (Array.isArray(data)) {
            unlockedUsernames = data.map((p: any) => p.username?.toLowerCase())
          } else if (data.data?.profiles) {
            unlockedUsernames = data.data.profiles.map((p: any) => p.username?.toLowerCase())
          }

          // Filter out any undefined/null values
          unlockedUsernames = unlockedUsernames.filter(Boolean)

          console.log('Processing toasts:', processingToasts.map(t => t.username))
          console.log('Unlocked usernames:', unlockedUsernames)

          // Remove toasts for completed processing (case-insensitive comparison)
          processingToasts.forEach(toastItem => {
            const normalizedUsername = toastItem.username.toLowerCase()
            if (unlockedUsernames.includes(normalizedUsername)) {
              console.log(`✅ Found ${toastItem.username} in unlocked profiles, removing toast`)
              removeProcessingToast(toastItem.username)

              // Show success toast
              toast.success(`Analytics ready for ${toastItem.username}`, {
                position: 'bottom-center',
                duration: 3000,
              })
            }
          })
        } else {
          console.error('Polling failed:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('Failed to check processing completion:', error)
      }
  }, [processingToasts, removeProcessingToast])

  // Polling logic to check for completion
  useEffect(() => {
    if (processingToasts.length === 0) return

    const interval = setInterval(checkCompletionNow, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [processingToasts, checkCompletionNow])

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