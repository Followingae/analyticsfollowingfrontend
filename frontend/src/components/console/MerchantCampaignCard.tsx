'use client'

/**
 * One merchant-built campaign, the way a reviewer reads it, with the decision on it.
 *
 * The creator's view on the left (cover, who, what, what it is worth, what they do for it),
 * the brief we would be standing behind on the right, and two buttons: Approve, which pushes
 * it to creators near the merchant the moment it is pressed, and Needs a change, which asks
 * for a reason the merchant reads word for word.
 *
 * The card owns the approve confirmation, the reject dialog and the two calls, so the review
 * queue (/work/approvals) and the lead panel on Partners show the same card and behave the
 * same. A campaign that is not in review shows its outcome where the buttons would be.
 *
 * THE TWO THINGS A REVIEWER CHECKS. Is the value per creator at or above the programme floor
 * (AED 350), and does the brief ask for anything we would not want our creators asked for.
 * The value line turns amber below the floor; the rest is read.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, Calendar, Check, Loader2, MapPin, Store, Undo2, Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Aed, CARD } from '@/components/console/primitives'
import { useConfirm } from '@/components/console/confirm'
import { merchantAdminApi, type MerchantCampaign } from '@/services/merchantAdminApi'
import { cn } from '@/lib/utils'

const ago = (iso: string | null | undefined) => {
  if (!iso) return null
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (!Number.isFinite(mins)) return null
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`
  return `${Math.floor(mins / 1440)}d ago`
}

const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : null

const fmt = (n: number) => Math.round(n).toLocaleString('en-GB')

/** The deliverable tier, in words rather than a slug. */
const TIER_LABEL: Record<string, string> = {
  story: 'Story tier', stories: 'Story tier', reel: 'Reel tier', reels: 'Reel tier',
  post: 'Post tier', bundle: 'Bundle tier', light: 'Light tier', standard: 'Standard tier',
  premium: 'Premium tier', tier_1: 'Tier 1', tier_2: 'Tier 2', tier_3: 'Tier 3',
}
const tierLabel = (t: string | null) =>
  t ? TIER_LABEL[t.toLowerCase()] || `${t.replace(/_/g, ' ')} tier` : null

const DELIVERABLE_LABEL: Record<string, string> = {
  story: 'story', stories: 'story', reel: 'reel', reels: 'reel', post: 'post', posts: 'post',
  carousel: 'carousel', video: 'video', tiktok: 'TikTok', youtube: 'YouTube video',
}
const deliverable = (d: { type: string; quantity: number }) => {
  const word = DELIVERABLE_LABEL[d.type?.toLowerCase()] || d.type?.replace(/_/g, ' ') || 'item'
  const n = Math.max(1, d.quantity || 1)
  return `${n} ${word}${n > 1 && !/^[A-Z]/.test(word) ? 's' : ''}`
}

/** How the creator redeems it. */
const redeemLine = (c: MerchantCampaign) => {
  const mode = (c.fulfilment_mode || '').toLowerCase()
  if (mode.includes('dine') || mode.includes('visit') || mode.includes('in_store') || mode.includes('instore')) {
    return c.guests_allowed && c.guests_allowed > 0
      ? `Visit in person, up to ${c.guests_allowed} ${c.guests_allowed === 1 ? 'guest' : 'guests'}`
      : 'Visit in person'
  }
  if (mode.includes('deliver') || mode.includes('ship')) return 'Delivered to the creator'
  if (mode.includes('voucher') || mode.includes('code')) return 'Voucher or code'
  return mode ? mode.replace(/_/g, ' ') : 'Redeem at the merchant'
}

const approvalLine = (mode: string | null) => {
  const m = (mode || '').toLowerCase()
  if (!m) return 'Approval mode not set'
  if (m.includes('auto')) return 'Creators are accepted automatically'
  if (m.includes('manual') || m.includes('review') || m.includes('merchant')) return 'The merchant approves each creator'
  return `Approval: ${m.replace(/_/g, ' ')}`
}

/** The campaign's status in four words a person uses, whatever the server calls it. */
export function campaignStatusChip(status: string | null | undefined): { label: string; cls: string } {
  const quiet = 'bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]'
  if (!status) return { label: 'No campaign', cls: quiet }
  switch (status) {
    case 'draft': return { label: 'Draft', cls: quiet }
    case 'in_review': return { label: 'In review', cls: 'bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]' }
    case 'live': case 'active': case 'approved':
      return { label: 'Live', cls: 'bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]' }
    case 'rejected': return { label: 'Sent back', cls: 'bg-[var(--tone-info-wash)] text-[var(--tone-info-ink)]' }
    case 'paused': return { label: 'Paused', cls: quiet }
    case 'completed': case 'closed': return { label: 'Finished', cls: quiet }
    default: return { label: String(status).replace(/_/g, ' '), cls: quiet }
  }
}

export type CampaignOutcome = 'approved' | 'sent_back'

export function MerchantCampaignCard({ c, onChanged, showMerchantLink = true, className }: {
  c: MerchantCampaign
  /** Fires after an approve or a send-back has gone through on the server. */
  onChanged?: (outcome: CampaignOutcome, campaign: MerchantCampaign, detail: { pushed_to?: number; reason?: string }) => void
  /** The "All merchants" line at the foot. Off inside the lead panel, which is already the merchant. */
  showMerchantLink?: boolean
  className?: string
}) {
  const confirm = useConfirm()
  const [busy, setBusy] = useState(false)
  const [rejecting, setRejecting] = useState(false)

  const inReview = c.status === 'in_review'
  const below = c.value_per_creator_aed < c.min_value
  const tier = tierLabel(c.deliverable_tier)
  const deliverables = useMemo(
    () => c.deliverable_requirements.filter(d => d.required !== false).map(deliverable),
    [c.deliverable_requirements],
  )
  const dates = c.start_date || c.end_date
    ? [day(c.start_date), day(c.end_date)].filter(Boolean).join(' to ')
    : null
  const chip = campaignStatusChip(c.status)
  /* A draft with a review note is one that went back: the merchant has not resubmitted yet. */
  const sentBack = c.status === 'draft' && !!c.review_note

  const approve = async () => {
    const ok = await confirm({
      kind: 'routine',
      title: `Approve ${c.name}`,
      body: (
        <>
          Creators near {c.merchant.name} get a push the moment you approve.
          {below && (
            <>
              <br />
              <span className="text-[var(--tone-warn-ink)]">
                The value per creator is below the programme minimum of AED {fmt(c.min_value)}.
              </span>
            </>
          )}
        </>
      ),
      confirmLabel: 'Approve and push',
    })
    if (!ok) return
    setBusy(true)
    try {
      const r = await merchantAdminApi.approveCampaign(c.id)
      toast.success(`${c.name} is live`, {
        description: r.pushed_to > 0
          ? `Pushed to ${r.pushed_to} ${r.pushed_to === 1 ? 'creator' : 'creators'} near ${c.merchant.name}.`
          : `No creators were in range to push to yet. It is live and will show in the app.`,
      })
      onChanged?.('approved', c, { pushed_to: r.pushed_to })
    } catch (e) {
      toast.error((e as Error).message || 'Could not approve')
    } finally {
      setBusy(false)
    }
  }

  const reject = async (reason: string) => {
    setBusy(true)
    try {
      await merchantAdminApi.rejectCampaign(c.id, reason)
      setRejecting(false)
      toast.success(`Sent back to ${c.merchant.name}`, { description: 'They see your reason word for word.' })
      onChanged?.('sent_back', c, { reason })
    } catch (e) {
      toast.error((e as Error).message || 'Could not send it back')
    } finally {
      setBusy(false)
    }
  }

  return (
    <article id={`merchant-campaign-${c.id}`} className={cn(CARD, 'bg-card p-4 scroll-mt-24', className)}>
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        {/* The creator's view. Same hierarchy as the card in the app: cover, who, what,
            what it is worth, what they do for it. */}
        <div className="overflow-hidden rounded-ds-xl border bg-background">
          <div className="relative h-32 bg-muted">
            {c.hero_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.hero_image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Store className="size-6" aria-hidden />
              </div>
            )}
            <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-ds-md bg-background/90 px-2 py-1 shadow-sm">
              {c.merchant.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.merchant.logo_url} alt="" className="size-6 rounded-ds-sm object-contain" />
              ) : (
                <span className="inline-flex size-6 items-center justify-center rounded-ds-sm bg-muted text-[10px] font-semibold">
                  {(c.merchant.name || '?').slice(0, 2).toUpperCase()}
                </span>
              )}
              <span className="max-w-[180px] truncate text-[12.5px] font-medium">{c.merchant.name}</span>
            </div>
          </div>
          <div className="space-y-2.5 p-3.5">
            <div>
              <div className="text-[15px] font-semibold leading-snug">{c.name}</div>
              <div className="text-[12px] text-muted-foreground">{c.merchant.category || 'Merchant'}</div>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[18px] font-semibold"><Aed>{fmt(c.value_per_creator_aed)}</Aed></span>
              {tier && <Badge variant="secondary" className="text-[11px]">{tier}</Badge>}
            </div>
            {c.barter_items.length > 0 && (
              <ul className="space-y-0.5 text-[12.5px]">
                {c.barter_items.map((b, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span className="truncate">{b.name}</span>
                    {b.value_aed > 0 && <span className="shrink-0 tabular-nums text-muted-foreground">{fmt(b.value_aed)}</span>}
                  </li>
                ))}
              </ul>
            )}
            <div className="space-y-1 border-t pt-2.5 text-[12.5px] text-muted-foreground">
              <div className="flex items-start gap-1.5">
                <Check className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span>{deliverables.length ? deliverables.join(', ') : 'Deliverables not set'}</span>
              </div>
              <div className="flex items-start gap-1.5">
                <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span>{redeemLine(c)}{c.visit_location ? ` · ${c.visit_location}` : ''}</span>
              </div>
              {dates && (
                <div className="flex items-start gap-1.5">
                  <Calendar className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span>{dates}</span>
                </div>
              )}
              <div className="flex items-start gap-1.5">
                <Users className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span>
                  {c.max_participants ? `${c.max_participants} creators wanted` : 'Creator count not set'}
                  {c.trial_month ? ` · month ${c.trial_month}` : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* The brief, and the decision. */}
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className={cn(
                'inline-flex items-center gap-1.5 rounded-ds-md px-2 py-1 text-[12.5px] font-medium',
                below
                  ? 'bg-[var(--tone-warn-wash)] text-[var(--tone-warn-ink)]'
                  : 'bg-[var(--tone-good-wash)] text-[var(--tone-good-ink)]',
              )}>
                {below && <AlertTriangle className="size-3.5" aria-hidden />}
                Value AED {fmt(c.value_per_creator_aed)} against a minimum of {fmt(c.min_value)}
              </p>
              <p className="text-ds-caption text-muted-foreground">
                {approvalLine(c.creator_approval_mode)}
                {c.submitted_at ? ` · submitted ${ago(c.submitted_at)}` : ''}
                {c.entitlement_cap_aed ? ` · spend cap AED ${fmt(c.entitlement_cap_aed)}` : ''}
              </p>
            </div>
            {inReview ? (
              <div className="flex shrink-0 gap-2">
                <Button size="sm" disabled={busy} onClick={approve}>
                  {busy ? <Loader2 className="mr-1.5 size-3.5 animate-spin" aria-hidden /> : <Check className="mr-1.5 size-3.5" aria-hidden />}
                  Approve
                </Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => setRejecting(true)}>
                  <Undo2 className="mr-1.5 size-3.5" aria-hidden />
                  Needs a change
                </Button>
              </div>
            ) : (
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge variant="outline" className={cn('border-transparent font-medium', sentBack ? 'bg-[var(--tone-info-wash)] text-[var(--tone-info-ink)]' : chip.cls)}>
                  {sentBack ? 'Sent back' : chip.label}
                </Badge>
                {c.reviewed_at && <span className="text-[11.5px] text-muted-foreground">{ago(c.reviewed_at)}</span>}
              </div>
            )}
          </div>

          {!inReview && c.review_note && (
            <p className="rounded-ds-lg bg-[var(--tone-info-wash)] px-3 py-2 text-[12.5px] leading-relaxed text-[var(--tone-info-ink)]">
              Sent back with: {c.review_note}
            </p>
          )}

          <div className="reading-width text-[13.5px] leading-relaxed">
            {c.description
              ? <p className="whitespace-pre-line">{c.description}</p>
              : <p className="text-muted-foreground">The merchant wrote no description.</p>}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <BriefList title="Show" items={c.content_requirements} empty="Nothing asked for" />
            <BriefList title="Avoid" items={c.things_to_avoid} empty="Nothing ruled out" />
          </div>

          {(c.mandatory_tags.length > 0 || c.mandatory_hashtags.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {c.mandatory_tags.map(t => (
                <Badge key={`t-${t}`} variant="outline" className="text-[11.5px] font-normal">
                  {t.startsWith('@') ? t : `@${t}`}
                </Badge>
              ))}
              {c.mandatory_hashtags.map(h => (
                <Badge key={`h-${h}`} variant="outline" className="text-[11.5px] font-normal">
                  {h.startsWith('#') ? h : `#${h}`}
                </Badge>
              ))}
            </div>
          )}

          {showMerchantLink && c.merchant.id && (
            <p className="mt-auto text-ds-caption text-muted-foreground">
              <Link href="/work/merchants" className="hover:underline">All merchants</Link>
              {c.merchant.email ? ` · ${c.merchant.email}` : ''}
            </p>
          )}
        </div>
      </div>

      <RejectDialog
        open={rejecting}
        campaign={c}
        busy={busy}
        onClose={() => setRejecting(false)}
        onSend={reject}
      />
    </article>
  )
}

function BriefList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="rounded-ds-lg border px-3 py-2.5">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {items.length === 0 ? (
        <p className="mt-1 text-[12.5px] text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-1 space-y-0.5 text-[13px]">
          {items.map((it, i) => <li key={i} className="flex gap-2"><span className="text-muted-foreground">·</span><span>{it}</span></li>)}
        </ul>
      )}
    </div>
  )
}

/** The reason is required and goes to the merchant word for word. */
function RejectDialog({ open, campaign, busy, onClose, onSend }: {
  open: boolean
  campaign: MerchantCampaign
  busy: boolean
  onClose: () => void
  onSend: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  useEffect(() => { if (open) setReason('') }, [open])
  const ready = reason.trim().length >= 10

  return (
    <Dialog open={open} onOpenChange={(o: boolean) => { if (!o && !busy) onClose() }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Send {campaign.name || 'this campaign'} back</DialogTitle>
          <DialogDescription>
            Say what to change, in plain words. This goes to the merchant word for word.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          autoFocus
          rows={4}
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="The value per creator needs to be at least AED 350. Add a second dish or raise the voucher."
        />
        <p className="text-[12px] text-muted-foreground">
          Write it as you would say it to them. They can edit and submit again.
        </p>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button disabled={!ready || busy} onClick={() => onSend(reason.trim())}>
            {busy && <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />}
            Send back with this reason
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
