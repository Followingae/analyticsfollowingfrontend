"use client"

import { API_CONFIG, ENDPOINTS } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

// ── Backend notification types ──────────────────────────────────────────

export type ServerNotificationType =
  | 'share_received' | 'share_revoked' | 'share_extended'
  | 'proposal_received' | 'proposal_updated'
  | 'analytics_completed'
  | 'credit_purchase' | 'low_balance'
  | 'team_invite' | 'team_update'
  | 'system'

export interface ServerNotification {
  id: string
  user_id: string | null
  user_email: string
  notification_type: ServerNotificationType
  title: string
  message: string | null
  action_url: string | null
  reference_type: string | null
  reference_id: string | null
  metadata: Record<string, any>
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface UnreadCounts {
  total_unread: number
  unread_shares: number
  unread_proposals: number
  unread_analytics: number
  unread_billing: number
  unread_team: number
  unread_system: number
}

export interface NotificationListParams {
  page?: number
  page_size?: number
  notification_type?: string
  unread_only?: boolean
}

// ── Category mapping ────────────────────────────────────────────────────

export const NOTIFICATION_CATEGORIES = {
  shares: ['share_received', 'share_revoked', 'share_extended'],
  proposals: ['proposal_received', 'proposal_updated'],
  analytics: ['analytics_completed'],
  billing: ['credit_purchase', 'low_balance'],
  team: ['team_invite', 'team_update'],
  system: ['system'],
} as const

export type NotificationCategory = keyof typeof NOTIFICATION_CATEGORIES

// ── API service ─────────────────────────────────────────────────────────

const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' }

class NotificationApiService {
  private baseUrl: string
  constructor() { this.baseUrl = API_CONFIG.BASE_URL }

  async getNotifications(params?: NotificationListParams): Promise<{
    success: boolean
    data: ServerNotification[]
    pagination?: any
    error?: string
  }> {
    try {
      const q = new URLSearchParams()
      if (params?.page) q.set('page', params.page.toString())
      if (params?.page_size) q.set('page_size', params.page_size.toString())
      if (params?.notification_type) q.set('notification_type', params.notification_type)
      if (params?.unread_only) q.set('unread_only', 'true')
      const qs = q.toString()

      const res = await fetchWithAuth(
        `${this.baseUrl}${ENDPOINTS.notifications.list}${qs ? `?${qs}` : ''}`,
        { method: 'GET', headers }
      )
      if (!res.ok) return { success: false, data: [], error: `Status ${res.status}` }

      const json = await res.json()
      const items: ServerNotification[] =
        json?.data?.notifications || json?.data || json?.notifications || json || []
      return { success: true, data: Array.isArray(items) ? items : [], pagination: json?.data?.pagination || json?.pagination }
    } catch (e) {
      return { success: false, data: [], error: e instanceof Error ? e.message : 'Network error' }
    }
  }

  async getUnreadCount(): Promise<{ success: boolean; data: UnreadCounts }> {
    const empty: UnreadCounts = {
      total_unread: 0, unread_shares: 0, unread_proposals: 0,
      unread_analytics: 0, unread_billing: 0, unread_team: 0, unread_system: 0,
    }
    try {
      const res = await fetchWithAuth(
        `${this.baseUrl}${ENDPOINTS.notifications.unreadCount}`,
        { method: 'GET', headers }
      )
      if (!res.ok) return { success: false, data: empty }
      const json = await res.json()
      return { success: true, data: json?.data ?? json ?? empty }
    } catch (error) {
      console.error('Failed to fetch unread notification count:', error)
      return { success: false, data: empty }
    }
  }

  async markAsRead(id: string): Promise<boolean> {
    try {
      const res = await fetchWithAuth(
        `${this.baseUrl}${ENDPOINTS.notifications.markRead(id)}`,
        { method: 'POST', headers }
      )
      return res.ok
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      return false
    }
  }

  async markAllAsRead(notificationType?: string): Promise<boolean> {
    try {
      const q = notificationType ? `?notification_type=${notificationType}` : ''
      const res = await fetchWithAuth(
        `${this.baseUrl}${ENDPOINTS.notifications.markAllRead}${q}`,
        { method: 'POST', headers }
      )
      return res.ok
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      return false
    }
  }

  async markReadByReference(referenceType: string, referenceId?: string): Promise<boolean> {
    try {
      const q = new URLSearchParams({ reference_type: referenceType })
      if (referenceId) q.set('reference_id', referenceId)
      const res = await fetchWithAuth(
        `${this.baseUrl}${ENDPOINTS.notifications.markReadByReference}?${q.toString()}`,
        { method: 'POST', headers }
      )
      return res.ok
    } catch (error) {
      console.error('Failed to mark notifications read by reference:', error)
      return false
    }
  }
}

export const notificationApiService = new NotificationApiService()
