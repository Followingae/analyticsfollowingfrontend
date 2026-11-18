'use client'

/**
 * The hand-off to RFM, read from the lead row.
 *
 * Since 9 Nov 2026 a lead goes to the RFM platform the moment it arrives instead of to an
 * inbox; this is the log of whether it did. Leads from before that date were worked by hand
 * and say so rather than reading as failures. Shared by the partners table and the lead panel.
 */

import { AlertCircle, Check, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PartnerLead } from '@/services/partnerLeadsApi'
import { cn } from '@/lib/utils'

const RFM_FROM = '2026-11-09'
const RFM_OK = new Set(['queued', 'duplicate', 'opted_out', 'ok'])

export const shortTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''

export type RfmKind = 'sent' | 'failed' | 'waiting' | 'before' | 'no_consent'

export function rfmState(l: PartnerLead): { kind: RfmKind; text: string; detail?: string } {
  if (l.rfm_sent_at) {
    return {
      kind: 'sent',
      text: `Sent ${shortTime(l.rfm_sent_at)}`,
      detail: l.rfm_status === 'duplicate' ? 'RFM already had this number'
        : l.rfm_status === 'opted_out' ? 'This person asked RFM not to call'
        : l.rfm_contact_id ? `RFM contact ${l.rfm_contact_id.slice(0, 8)}` : undefined,
    }
  }
  if ((l.created_at || '') < RFM_FROM) return { kind: 'before', text: 'Worked by hand' }
  if (!l.consent_at) return { kind: 'no_consent', text: 'No consent given', detail: 'The applicant did not tick the consent line, so RFM is not sent this lead.' }
  if (l.rfm_status && !RFM_OK.has(l.rfm_status)) {
    return { kind: 'failed', text: l.rfm_status === 'rejected' ? 'RFM refused it' : l.rfm_status === 'not_configured' ? 'Key not set' : 'Not through yet',
             detail: l.rfm_error || undefined }
  }
  return { kind: 'waiting', text: 'Sending' }
}

/** Can "Send to RFM now" do anything for this lead? */
export const canSendToRfm = (l: PartnerLead) => {
  const st = rfmState(l)
  return !!l.consent_at && (st.kind === 'failed' || st.kind === 'waiting' || (st.kind === 'sent' && l.rfm_status === 'duplicate'))
}

export function RfmCell({ l, onSend, busy }: { l: PartnerLead; onSend?: () => void; busy?: boolean }) {
  const st = rfmState(l)
  const Icon = st.kind === 'sent' ? Check : st.kind === 'failed' ? AlertCircle : st.kind === 'waiting' ? Loader2 : null
  return (
    <div className="flex items-center gap-2">
      <span
        title={st.detail}
        className={cn('inline-flex items-center gap-1 text-[12.5px]',
          st.kind === 'sent' ? 'text-[var(--tone-good-ink)]'
          : st.kind === 'failed' ? 'text-[var(--tone-warn-ink)]'
          : 'text-muted-foreground')}
      >
        {Icon && <Icon className={cn('size-3.5', st.kind === 'waiting' && 'animate-spin')} aria-hidden />}
        {st.text}
      </span>
      {onSend && (st.kind === 'failed' || st.kind === 'waiting') && (
        <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[12px]" disabled={busy} onClick={onSend} title="Send to RFM now">
          <Send className="size-3" aria-hidden />
        </Button>
      )}
    </div>
  )
}
