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
  processingToasts: ProcessingToast[]
}

const ProcessingToastContext = createContext<ProcessingToastContextType | undefined>(undefined)

const STORAGE_KEY = 'processing-toasts'
const POLL_INTERVAL = 20000 // 20 seconds

export function ProcessingToastProvider({ children }: { children: React.ReactNode }) {
  const [processingToasts, setProcessingToasts] = useState<ProcessingToast[]>([])
  const [toastIds, setToastIds] = useState<Map<string, string | number>>(new Map())

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const toasts = JSON.parse(stored) as ProcessingToast[]
        setProcessingToasts(toasts)
        // Show toasts for persisted items
        toasts.forEach(toastItem => {
          showProcessingToast(toastItem.username, toastItem.id)
        })
      } catch (error) {
        console.error('Failed to parse stored processing toasts:', error)
      }
    }
  }, [])

  // Save to localStorage whenever processingToasts changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(processingToasts))
  }, [processingToasts])

  const showProcessingToast = useCallback((username: string, id: string) => {
    const toastId = toast(
      <div className="flex items-center gap-3">
        <ToastLoader size={40} text="AI" />
        <span className="text-sm font-medium">
          AI Powered Analytics Processing for {username}
        </span>
      </div>,
      {
        duration: Infinity, // Keep until manually dismissed
        position: 'bottom-center',
        className: 'bg-gray-900/95 text-white border-gray-700',
      }
    )

    setToastIds(prev => new Map(prev.set(id, toastId)))
    return toastId
  }, [])

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

    showProcessingToast(username, id)
  }, [showProcessingToast])

  const removeProcessingToast = useCallback((username: string) => {
    setProcessingToasts(prev => {
      const toastToRemove = prev.find(t => t.username === username)
      if (toastToRemove) {
        // Dismiss the Sonner toast
        const toastId = toastIds.get(toastToRemove.id)
        if (toastId) {
          toast.dismiss(toastId)
          setToastIds(prev => {
            const newMap = new Map(prev)
            newMap.delete(toastToRemove.id)
            return newMap
          })
        }
      }
      return prev.filter(t => t.username !== username)
    })
  }, [toastIds])

  // Polling logic to check for completion
  useEffect(() => {
    if (processingToasts.length === 0) return

    const checkCompletion = async () => {
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
            unlockedUsernames = data.profiles.map((p: any) => p.username)
          } else if (Array.isArray(data)) {
            unlockedUsernames = data.map((p: any) => p.username)
          } else if (data.data?.profiles) {
            unlockedUsernames = data.data.profiles.map((p: any) => p.username)
          }

          console.log('Processing toasts:', processingToasts.map(t => t.username))
          console.log('Unlocked usernames:', unlockedUsernames)

          // Remove toasts for completed processing
          processingToasts.forEach(toastItem => {
            if (unlockedUsernames.includes(toastItem.username)) {
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
    }

    const interval = setInterval(checkCompletion, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [processingToasts, removeProcessingToast])

  return (
    <ProcessingToastContext.Provider value={{
      addProcessingToast,
      removeProcessingToast,
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