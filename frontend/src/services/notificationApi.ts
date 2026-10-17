"use client"

import { API_CONFIG, ENDPOINTS } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'

// ── Backend notification types ──────────────────────────────────────────
//
// GENERATED. The union, the groups, the labels and the unread-count shape all come from
// app/services/notifications/event_catalog.py in the backend repository, because they were
// four hand-maintained copies of one Python list and the copies had drifted to thirteen of
// its sixty entries. Regenerate with:
//
//     py -3 scripts/gen_notification_types.py <path to this frontend>

// ──── GENERATED from app/services/notifications/event_catalog.py ────
// Do not edit by hand. Run: py -3 scripts/gen_notification_types.py <frontend>

export type ServerNotificationType =
  | 'access_anomaly'
  | 'analytics_completed'
  | 'approval_decided'
  | 'approval_requested'
  | 'area_client_responded'
  | 'brand_gone_quiet'
  | 'campaign_application'
  | 'campaign_deliverable'
  | 'campaign_invite_accepted'
  | 'campaign_invite_declined'
  | 'content_approved'
  | 'content_arrived'
  | 'content_changes_requested'
  | 'creator_approved'
  | 'creator_cost_captured'
  | 'creator_rejected'
  | 'creator_submitted'
  | 'credit_purchase'
  | 'fa_application'
  | 'fa_content_approved'
  | 'fa_content_edit_requested'
  | 'fa_content_submitted'
  | 'fa_proof_submitted'
  | 'fa_withdrawal'
  | 'invoice_payment_failed'
  | 'low_balance'
  | 'managed_content_due'
  | 'managed_content_missed'
  | 'mor_order_received'
  | 'opportunity_logged'
  | 'payable_overdue'
  | 'payable_paid'
  | 'payable_recorded'
  | 'proposal_approved'
  | 'proposal_internal'
  | 'proposal_more_added'
  | 'proposal_more_requested'
  | 'proposal_received'
  | 'proposal_rejected'
  | 'proposal_updated'
  | 'quote_confirmed'
  | 'rate_proposed'
  | 'rfp_quote_received'
  | 'round_amended'
  | 'round_client_responded'
  | 'round_due_soon'
  | 'round_more_requested'
  | 'round_opened'
  | 'round_overdue'
  | 'round_ready_for_review'
  | 'round_shareable'
  | 'share_expiring'
  | 'share_extended'
  | 'share_received'
  | 'share_revoked'
  | 'sourcing_started'
  | 'subscription_cancelled'
  | 'system'
  | 'team_invite'
  | 'team_update'
  | 'waiting_room_backlog'

/** Every notification type, grouped the way the catalog groups them. The
 *  notifications screen builds one tab per group from this. */
export const NOTIFICATION_CATEGORIES = {
  proposals: [
    'proposal_approved',
    'proposal_internal',
    'proposal_more_added',
    'proposal_more_requested',
    'proposal_received',
    'proposal_rejected',
    'proposal_updated',
    'quote_confirmed',
  ],
  campaigns: [
    'campaign_application',
    'campaign_invite_accepted',
    'campaign_invite_declined',
    'fa_application',
  ],
  creators: [
    'creator_approved',
    'creator_cost_captured',
    'creator_rejected',
    'creator_submitted',
    'waiting_room_backlog',
  ],
  sourcing: [
    'area_client_responded',
    'opportunity_logged',
    'round_amended',
    'round_client_responded',
    'round_due_soon',
    'round_more_requested',
    'round_opened',
    'round_overdue',
    'round_ready_for_review',
    'round_shareable',
    'sourcing_started',
  ],
  approvals: [
    'approval_decided',
    'approval_requested',
  ],
  clients: [
    'brand_gone_quiet',
  ],
  deliverables: [
    'campaign_deliverable',
    'content_approved',
    'content_arrived',
    'content_changes_requested',
    'fa_content_approved',
    'fa_content_edit_requested',
    'fa_content_submitted',
    'fa_proof_submitted',
    'managed_content_due',
    'managed_content_missed',
  ],
  inflink: [
    'rfp_quote_received',
  ],
  payouts: [
    'fa_withdrawal',
    'mor_order_received',
    'payable_overdue',
    'payable_paid',
    'payable_recorded',
    'rate_proposed',
  ],
  shares: [
    'share_expiring',
    'share_extended',
    'share_received',
    'share_revoked',
  ],
  analytics: [
    'analytics_completed',
  ],
  billing: [
    'credit_purchase',
    'invoice_payment_failed',
    'low_balance',
    'subscription_cancelled',
  ],
  team: [
    'team_invite',
    'team_update',
  ],
  system: [
    'access_anomaly',
    'system',
  ],
} as const

export type NotificationCategory = keyof typeof NOTIFICATION_CATEGORIES

/** The domain name the backend expects for ?domain= on mark-all-read. */
export const CATEGORY_DOMAIN: Record<NotificationCategory, string> = {
  proposals: 'Proposals',
  campaigns: 'Campaigns',
  creators: 'Creators',
  sourcing: 'Sourcing',
  approvals: 'Approvals',
  clients: 'Clients',
  deliverables: 'Deliverables',
  inflink: 'Inflink',
  payouts: 'Payouts',
  shares: 'Shares',
  analytics: 'Analytics',
  billing: 'Billing',
  team: 'Team',
  system: 'System',
}

export const CATEGORY_LABEL: Record<NotificationCategory, string> = {
  proposals: 'Proposals',
  campaigns: 'Campaigns',
  creators: 'Creators',
  sourcing: 'Sourcing',
  approvals: 'Approvals',
  clients: 'Clients',
  deliverables: 'Deliverables',
  inflink: 'Inflink',
  payouts: 'Payouts',
  shares: 'Shares',
  analytics: 'Analytics',
  billing: 'Billing',
  team: 'Team',
  system: 'System',
}

/** What each event is, in one line, for a reader who has never seen it. */
export const EVENT_LABEL: Partial<Record<ServerNotificationType, string>> = {
  access_anomaly: "Unusual access volume",
  analytics_completed: "Creator analytics ready",
  approval_decided: "An approval was answered",
  approval_requested: "Your approval is needed",
  area_client_responded: "Client answered on a shared set",
  brand_gone_quiet: "A brand has gone quiet",
  campaign_application: "New campaign application (brand)",
  campaign_deliverable: "Deliverable / content update (brand)",
  campaign_invite_accepted: "Creator accepted campaign invite",
  campaign_invite_declined: "Creator declined campaign invite",
  content_approved: "Client approved content",
  content_arrived: "Creator content arrived",
  content_changes_requested: "Client asked for changes on content",
  creator_approved: "Creator released to the master database",
  creator_cost_captured: "Creator cost captured",
  creator_rejected: "Creator turned down",
  creator_submitted: "Creators added to the waiting room",
  credit_purchase: "Credits added / subscription active",
  fa_application: "New campaign application (team)",
  fa_content_approved: "Content approved (team)",
  fa_content_edit_requested: "An edit was requested on content (team)",
  fa_content_submitted: "Content submitted for review (team)",
  fa_proof_submitted: "Proof of posting, verify required (team)",
  fa_withdrawal: "Withdrawal request (team)",
  invoice_payment_failed: "Invoice payment failed",
  low_balance: "Low credit balance",
  managed_content_due: "Content due on a managed campaign",
  managed_content_missed: "Content missed on a managed campaign",
  mor_order_received: "A brand instructed a payment",
  opportunity_logged: "A brand was logged as worth chasing",
  payable_overdue: "Creator payment overdue",
  payable_paid: "Creator paid",
  payable_recorded: "Creator payment recorded",
  proposal_approved: "Proposal approved by brand",
  proposal_internal: "Internal proposal workflow update",
  proposal_more_added: "More influencers added to proposal",
  proposal_more_requested: "Brand requested more influencers",
  proposal_received: "Proposal sent to brand",
  proposal_rejected: "Proposal rejected by brand",
  proposal_updated: "Proposal updated (generic)",
  quote_confirmed: "Client confirmed a quotation themselves",
  rate_proposed: "Negotiated rate waiting on a founder",
  rfp_quote_received: "Creator quoted on an RFP",
  round_amended: "Creators were taken back off a roster",
  round_due_soon: "Roster is due",
  round_more_requested: "Client asked for more creators",
  round_opened: "Roster opened",
  round_overdue: "Roster is overdue",
  round_ready_for_review: "Roster stocked, waiting on a founder",
  round_shareable: "Roster is ready to send to the client",
  share_expiring: "A client's link is about to expire",
  share_extended: "Share access extended",
  share_received: "Influencer list shared",
  share_revoked: "Share access revoked",
  sourcing_started: "Sourcing released to the team",
  subscription_cancelled: "Subscription cancelled",
  system: "System notification",
  team_invite: "Team invitation sent",
  team_update: "Team update",
  waiting_room_backlog: "Waiting room is backing up",
}

export interface UnreadCounts {
  total_unread: number
  unread_proposals: number
  unread_campaigns: number
  unread_creators: number
  unread_sourcing: number
  unread_approvals: number
  unread_clients: number
  unread_deliverables: number
  unread_inflink: number
  unread_payouts: number
  unread_shares: number
  unread_analytics: number
  unread_billing: number
  unread_team: number
  unread_system: number
  /** Live but uncatalogued, so the total and the tabs always agree. */
  unread_other: number
}

export const EMPTY_UNREAD_COUNTS: UnreadCounts = {
  total_unread: 0,
  unread_proposals: 0,
  unread_campaigns: 0,
  unread_creators: 0,
  unread_sourcing: 0,
  unread_approvals: 0,
  unread_clients: 0,
  unread_deliverables: 0,
  unread_inflink: 0,
  unread_payouts: 0,
  unread_shares: 0,
  unread_analytics: 0,
  unread_billing: 0,
  unread_team: 0,
  unread_system: 0,
  unread_other: 0,
}
// ──── end generated ────

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

export interface NotificationListParams {
  page?: number
  page_size?: number
  notification_type?: string
  unread_only?: boolean
}

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
    const empty: UnreadCounts = EMPTY_UNREAD_COUNTS
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

  /**
   * Clear everything, one event type, or a whole domain.
   *
   * The domain form exists because the notifications screen groups by domain: pressing
   * "mark all read" on a tab used to send the FIRST type in that group and nothing else,
   * so a tab showing eight alerts cleared one and looked broken.
   */
  async markAllAsRead(opts?: { notificationType?: string; domain?: string }): Promise<boolean> {
    try {
      const qs = new URLSearchParams()
      if (opts?.notificationType) qs.set('notification_type', opts.notificationType)
      else if (opts?.domain) qs.set('domain', opts.domain)
      const q = qs.toString() ? `?${qs.toString()}` : ''
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
