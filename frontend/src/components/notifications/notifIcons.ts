/**
 * Which glyph and which tone each notification carries.
 *
 * Deliberately hand-written and deliberately partial, unlike the type union and the groups
 * next door, which are generated. Choosing a glyph for an event is a judgement, and a
 * generator would have to invent one; a missing entry falls back to the bell, which is
 * correct and legible, so a new event type can never break a row.
 *
 * Tone is reserved for the three cases where colour IS the information: something needs
 * money or attention (warn), something was taken away or has failed (bad), something
 * arrived or completed (good). Everything else is the muted ink. Thirteen types once
 * carried thirteen hand-picked hues, none of them a token in this theme, and the page read
 * as a wall rather than a list.
 */
import {
  AlertTriangle,
  Ban,
  BarChart3,
  Bell,
  Banknote,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck,
  FileText,
  FileUp,
  Gavel,
  HandCoins,
  Inbox,
  Link2,
  ListChecks,
  Megaphone,
  MessageSquareReply,
  PauseCircle,
  Receipt,
  Send,
  ShieldAlert,
  UserMinus,
  UserPlus,
  UserRoundCheck,
  UserRoundSearch,
  Users,
} from 'lucide-react'
import type { ServerNotificationType } from '@/services/notificationApi'

export type NotifTone = 'plain' | 'good' | 'warn' | 'bad'

export interface NotifLook {
  icon: React.ComponentType<{ className?: string }>
  tone: NotifTone
}

export const NOTIF_LOOK: Partial<Record<ServerNotificationType, NotifLook>> = {
  // Proposals and quotations
  proposal_received: { icon: FileText, tone: 'plain' },
  proposal_updated: { icon: FileCheck, tone: 'plain' },
  proposal_approved: { icon: CheckCircle2, tone: 'good' },
  proposal_rejected: { icon: Ban, tone: 'bad' },
  proposal_more_requested: { icon: MessageSquareReply, tone: 'plain' },
  proposal_more_added: { icon: FileUp, tone: 'plain' },
  proposal_internal: { icon: Gavel, tone: 'plain' },
  quote_confirmed: { icon: CheckCircle2, tone: 'good' },

  // Campaigns
  campaign_application: { icon: Megaphone, tone: 'plain' },
  fa_application: { icon: Megaphone, tone: 'plain' },
  campaign_invite_accepted: { icon: UserRoundCheck, tone: 'good' },
  campaign_invite_declined: { icon: UserMinus, tone: 'bad' },

  // Creators and the waiting room
  creator_submitted: { icon: UserRoundSearch, tone: 'plain' },
  creator_approved: { icon: UserRoundCheck, tone: 'good' },
  creator_cost_captured: { icon: Banknote, tone: 'plain' },
  creator_rejected: { icon: UserMinus, tone: 'plain' },
  waiting_room_backlog: { icon: AlertTriangle, tone: 'warn' },

  // Sourcing
  opportunity_logged: { icon: FileText, tone: 'plain' },
  sourcing_started: { icon: Send, tone: 'plain' },
  round_opened: { icon: ListChecks, tone: 'plain' },
  round_ready_for_review: { icon: Gavel, tone: 'plain' },
  round_shareable: { icon: Send, tone: 'good' },
  round_amended: { icon: UserMinus, tone: 'plain' },
  round_more_requested: { icon: MessageSquareReply, tone: 'plain' },
  round_due_soon: { icon: CalendarClock, tone: 'warn' },
  round_overdue: { icon: CalendarClock, tone: 'bad' },
  area_client_responded: { icon: MessageSquareReply, tone: 'good' },

  // Approvals
  approval_requested: { icon: Gavel, tone: 'warn' },
  approval_decided: { icon: CheckCircle2, tone: 'plain' },

  // Clients
  brand_gone_quiet: { icon: PauseCircle, tone: 'warn' },

  // Deliverables and content
  campaign_deliverable: { icon: FileUp, tone: 'plain' },
  fa_content_submitted: { icon: FileUp, tone: 'plain' },
  fa_content_approved: { icon: CheckCircle2, tone: 'good' },
  fa_content_edit_requested: { icon: MessageSquareReply, tone: 'warn' },
  fa_proof_submitted: { icon: FileCheck, tone: 'plain' },
  content_arrived: { icon: FileUp, tone: 'good' },
  content_changes_requested: { icon: MessageSquareReply, tone: 'warn' },
  content_approved: { icon: CheckCircle2, tone: 'good' },
  managed_content_due: { icon: CalendarClock, tone: 'warn' },
  managed_content_missed: { icon: CalendarClock, tone: 'bad' },

  // Inflink
  rfp_quote_received: { icon: HandCoins, tone: 'plain' },

  // Payouts and money owed to creators
  fa_withdrawal: { icon: HandCoins, tone: 'plain' },
  rate_proposed: { icon: Banknote, tone: 'warn' },
  payable_recorded: { icon: Receipt, tone: 'plain' },
  payable_paid: { icon: CheckCircle2, tone: 'good' },
  payable_overdue: { icon: AlertTriangle, tone: 'bad' },
  mor_order_received: { icon: Receipt, tone: 'warn' },

  // Shares
  share_received: { icon: Link2, tone: 'good' },
  share_revoked: { icon: Link2, tone: 'bad' },
  share_extended: { icon: Clock, tone: 'plain' },
  share_expiring: { icon: Clock, tone: 'warn' },

  // Analytics
  analytics_completed: { icon: BarChart3, tone: 'plain' },

  // Billing
  credit_purchase: { icon: CreditCard, tone: 'good' },
  low_balance: { icon: AlertTriangle, tone: 'warn' },
  subscription_cancelled: { icon: Ban, tone: 'bad' },
  invoice_payment_failed: { icon: CreditCard, tone: 'bad' },

  // Team
  team_invite: { icon: UserPlus, tone: 'plain' },
  team_update: { icon: Users, tone: 'plain' },

  // The Desk
  desk_message_received: { icon: Inbox, tone: 'plain' },

  // System
  access_anomaly: { icon: ShieldAlert, tone: 'warn' },
  system: { icon: Bell, tone: 'plain' },
}

export const FALLBACK_LOOK: NotifLook = { icon: Bell, tone: 'plain' }

export function lookFor(type: string): NotifLook {
  return NOTIF_LOOK[type as ServerNotificationType] ?? FALLBACK_LOOK
}

export const TONE_INK: Record<NotifTone, string> = {
  plain: 'text-muted-foreground',
  good: 'text-success',
  warn: 'text-warning',
  bad: 'text-danger',
}

/** The disc behind the glyph in the bell dropdown, where rows are tighter and need the mass. */
export const TONE_BG: Record<NotifTone, string> = {
  plain: 'bg-muted',
  good: 'bg-success/10',
  warn: 'bg-warning/10',
  bad: 'bg-danger/10',
}
