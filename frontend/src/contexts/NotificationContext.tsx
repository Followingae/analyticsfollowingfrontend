"use client"

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import {
  notificationApiService,
  ServerNotification,
  UnreadCounts,
  NotificationCategory,
  EMPTY_UNREAD_COUNTS,
  NOTIFICATION_CATEGORIES,
  CATEGORY_DOMAIN,
} from '@/services/notificationApi'
import { useAuth } from '@/contexts/AuthContext'
import { tokenManager } from '@/utils/tokenManager'

interface NotificationContextType {
  notifications: ServerNotification[]
  unreadCounts: UnreadCounts
  loading: boolean
  markAsRead: (id: string) => void
  markAllAsRead: (opts?: { notificationType?: string; domain?: string }) => void
  /** Mark notifications as read by reference (e.g. when visiting a proposal page) */
  markReadByReference: (referenceType: string, referenceId?: string) => void
  /** Re-fetch both list + counts from server */
  refresh: () => void
  /** Show a toast only if the same message wasn't shown in the last 10 seconds */
  deduplicatedToast: (message: string, type?: 'error' | 'success' | 'info') => void
}

// Generated from the backend event catalog, so a new domain cannot be missed in the zero
// case — which is how a bucket silently stayed at zero while its notifications arrived.
const defaultCounts: UnreadCounts = EMPTY_UNREAD_COUNTS

/** The event types a domain covers, for scoping an optimistic mark-all-read. */
function typesInDomain(domain: string): readonly string[] {
  const key = (Object.keys(CATEGORY_DOMAIN) as NotificationCategory[])
    .find(k => CATEGORY_DOMAIN[k] === domain)
  return key ? (NOTIFICATION_CATEGORIES[key] as readonly string[]) : []
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider')
  return ctx
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<ServerNotification[]>([])
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>(defaultCounts)
  const [loading, setLoading] = useState(true)
  const [apiAvailable, setApiAvailable] = useState(true)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { user } = useAuth()

  // ── Toast deduplication (Issue 60) ──────────────────────────────────
  const lastToastRef = useRef<{ message: string; time: number }>({ message: '', time: 0 })
  const deduplicatedToast = useCallback((message: string, type: 'error' | 'success' | 'info' = 'error') => {
    const now = Date.now()
    if (lastToastRef.current.message === message && now - lastToastRef.current.time < 10_000) return
    lastToastRef.current = { message, time: now }
    toast[type](message)
  }, [])

  // ── Fetchers ────────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    if (!tokenManager.isAuthenticated()) return  // skip until logged in (avoids no-token errors)
    const result = await notificationApiService.getNotifications({ page: 1, page_size: 20 })
    if (result.success) {
      setNotifications(result.data)
      setApiAvailable(true)
    } else {
      setApiAvailable(false)
    }
  }, [])

  const fetchUnreadCounts = useCallback(async () => {
    if (!tokenManager.isAuthenticated()) return  // skip until logged in (avoids no-token errors)
    const result = await notificationApiService.getUnreadCount()
    if (result.success) {
      setUnreadCounts(result.data)
    }
  }, [])

  const refresh = useCallback(async () => {
    await Promise.all([fetchNotifications(), fetchUnreadCounts()])
  }, [fetchNotifications, fetchUnreadCounts])

  // ── Initial load ────────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true
    ;(async () => {
      await refresh()
      if (mounted) setLoading(false)
    })()
    return () => { mounted = false }
  }, [refresh, user])

  // ── Poll every 30 seconds (both list + counts) ─────────────────────

  useEffect(() => {
    if (!apiAvailable) return
    pollRef.current = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      refresh()
    }, 30_000)

    // Resume polling immediately when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [apiAvailable, refresh])

  // ── Refresh on job completion (from useJobPolling window event) ─
  useEffect(() => {
    const handler = () => {
      refresh()
    }
    window.addEventListener('job-completed', handler)
    return () => window.removeEventListener('job-completed', handler)
  }, [refresh])

  // ── Actions ─────────────────────────────────────────────────────────

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
    )
    setUnreadCounts(prev => ({
      ...prev,
      total_unread: Math.max(0, prev.total_unread - 1),
    }))
    // Persist, then re-sync the per-category counts from the server so the
    // category badges (campaigns/proposals/etc.) stay accurate, not just total.
    notificationApiService.markAsRead(id).then(() => {
      fetchUnreadCounts()
    })
  }, [fetchUnreadCounts])

  const markAllAsRead = useCallback((opts?: { notificationType?: string; domain?: string }) => {
    // Scoped optimistically, matching what the server will actually do. This used to mark
    // EVERY notification read locally and zero every count even when one category was
    // asked for, so clearing the Billing tab emptied the whole page until the next poll
    // put it all back.
    const scope: readonly string[] | null = opts?.notificationType
      ? [opts.notificationType]
      : opts?.domain ? typesInDomain(opts.domain) : null

    setNotifications(prev => prev.map(n =>
      (!scope || scope.includes(n.notification_type))
        ? { ...n, is_read: true, read_at: n.read_at || new Date().toISOString() }
        : n
    ))
    if (!scope) setUnreadCounts(defaultCounts)
    notificationApiService.markAllAsRead(opts).then(() => {
      fetchUnreadCounts()
    })
  }, [fetchUnreadCounts])

  const markReadByReference = useCallback((referenceType: string, referenceId?: string) => {
    // Optimistic update: mark matching notifications as read locally
    setNotifications(prev =>
      prev.map(n => {
        if (n.reference_type !== referenceType) return n
        if (referenceId && n.reference_id !== referenceId) return n
        if (n.is_read) return n
        return { ...n, is_read: true, read_at: new Date().toISOString() }
      })
    )
    // Fire API call and refresh counts
    notificationApiService.markReadByReference(referenceType, referenceId).then(() => {
      fetchUnreadCounts()
    })
  }, [fetchUnreadCounts])

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCounts,
      loading,
      markAsRead,
      markAllAsRead,
      markReadByReference,
      refresh,
      deduplicatedToast,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

// Legacy helper hooks kept for backwards compatibility with toast-based notifications
export function useNotificationHelpers() {
  return {
    notifySuccess: (..._args: any[]) => {},
    notifyError: (..._args: any[]) => {},
    notifyWarning: (..._args: any[]) => {},
    notifyInfo: (..._args: any[]) => {},
  }
}
