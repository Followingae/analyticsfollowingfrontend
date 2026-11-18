'use client'

/**
 * Where a merchant is, as one chip.
 *
 * Six words the server works out from the merchant log and the latest campaign (Invited,
 * Reminded, Signed up, Campaign in review, Sent back, Live), each with the colour it carries
 * everywhere else in the console: warm for "needs somebody", info for "with them", good for
 * live. Shared by the merchants table, the partner leads table and the lead panel so the
 * same merchant never reads two different words on two screens.
 */

import { Badge } from '@/components/ui/badge'
import type { MerchantLog, MerchantStage } from '@/services/merchantAdminApi'
import { cn } from '@/lib/utils'

export const STAGE_META: Record<MerchantStage, { label: string; cls: string }> = {
  invited: { label: 'Invited', cls: 'bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]' },
  reminded: { label: 'Reminded', cls: 'bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]' },
  signed_up: { label: 'Signed up', cls: 'bg-[var(--tone-info-wash)] text-[var(--tone-info-ink)]' },
  campaign_in_review: { label: 'Campaign in review', cls: 'bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]' },
  sent_back: { label: 'Sent back', cls: 'bg-[var(--tone-info-wash)] text-[var(--tone-info-ink)]' },
  live: { label: 'Live', cls: 'bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]' },
}

export const stageLabel = (stage: MerchantStage | null | undefined) =>
  stage ? (STAGE_META[stage]?.label ?? String(stage).replace(/_/g, ' ')) : null

/** Has the merchant never been in? True for the two stages before a password exists. */
export const neverSignedIn = (stage: MerchantStage | null | undefined) =>
  stage === 'invited' || stage === 'reminded'

/**
 * Which timestamp sits under the chip. "Invited 2d ago" is the invite date; "Signed up" is
 * when the password was set; the campaign stages carry the moment the campaign changed hands.
 */
export function stageAt(
  stage: MerchantStage | null | undefined,
  log: MerchantLog,
  extra: { last_login?: string | null; campaign_submitted_at?: string | null } = {},
): string | null {
  switch (stage) {
    case 'invited': return log.invited_at
    case 'reminded': return log.reminder_sent_at
    case 'signed_up': return log.password_set_at || log.first_login_at || extra.last_login || null
    case 'campaign_in_review': return log.campaign_submitted_at || extra.campaign_submitted_at || null
    case 'sent_back': return log.campaign_sent_back_at
    case 'live': return log.campaign_approved_at
    default: return null
  }
}

export function StageChip({ stage, className, children }: {
  stage: MerchantStage | null | undefined
  className?: string
  /** Anything to sit inside the chip after the word, such as a chevron. */
  children?: React.ReactNode
}) {
  if (!stage) return null
  const s = STAGE_META[stage] ?? STAGE_META.invited
  return (
    <Badge variant="outline" className={cn('border-transparent font-medium', s.cls, className)}>
      {s.label}
      {children}
    </Badge>
  )
}
