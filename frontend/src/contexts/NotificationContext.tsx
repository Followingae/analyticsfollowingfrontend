"use client"

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import {
  notificationApiService,
  ServerNotification,
  UnreadCounts,
  NotificationCategory,
} from '@/services/notificationApi'

interface NotificationContextType {
  notifications: ServerNotification[]
  unreadCounts: UnreadCounts
  loading: boolean
  markAsRead: (id: string) => void
  markAllAsRead: (notificationType?: string) => void
  /** Mark notifications as read by reference (e.g. when visiting a proposal page) */
  markReadByReference: (referenceType: string, referenceId?: string) => void
  /** Re-fetch both list + counts from server */
  refresh: () => void
}

const defaultCounts: UnreadCounts = {
  total_unread: 0, unread_shares: 0, unread_proposals: 0,
  unread_analytics: 0, unread_billing: 0, unread_team: 0, unread_system: 0,
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

  // ── Fetchers ────────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    const result = await notificationApiService.getNotifications({ page: 1, page_size: 20 })
    if (result.success) {
      setNotifications(result.data)
      setApiAvailable(true)
    } else {
      setApiAvailable(false)
    }
  }, [])

  const fetchUnreadCounts = useCallback(async () => {
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
  }, [refresh])

  // ── Poll every 30 seconds (both list + counts) ─────────────────────

  useEffect(() => {
    if (!apiAvailable) return
    pollRef.current = setInterval(refresh, 30_000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
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
    notificationApiService.markAsRead(id)
  }, [])

  const markAllAsRead = useCallback((notificationType?: string) => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, is_read: true, read_at: n.read_at || new Date().toISOString() }))
    )
    setUnreadCounts(defaultCounts)
    notificationApiService.markAllAsRead(notificationType).then(() => {
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
