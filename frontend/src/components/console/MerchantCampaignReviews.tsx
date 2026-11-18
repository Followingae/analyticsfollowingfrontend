'use client'

/**
 * Merchant campaigns waiting for a yes.
 *
 * A self-serve merchant built this on their own and pressed submit. Nothing has gone to a
 * creator yet. Approving pushes it to the creators near the merchant the moment you press
 * the button, so the card shows the campaign the way a creator will see it, on the left,
 * and the brief we would be standing behind, on the right.
 *
 * THE TWO THINGS A REVIEWER CHECKS. Is the value per creator at or above the programme
 * floor (AED 350), and does the brief ask for anything we would not want our creators asked
 * for. The value line turns amber below the floor; the rest is read.
 *
 * "Needs a change" demands a reason, and the reason goes to the merchant word for word.
 * That is said on the dialog, because a note written for a colleague reads very differently
 * from one written for the person who built the campaign.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { ReadState, SectionHead } from '@/components/console/surfaces'
import { useConfirm } from '@/components/console/confirm'
import {
  merchantAdminApi, type MerchantApiError, type MerchantCampaign,
} from '@/services/merchantAdminApi'
import { cn } from '@/lib/utils'

const ago = (iso: string | null) => {
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

export function MerchantCampaignReviews({ onCount }: { onCount?: (n: number) => void }) {
  const confirm = useConfirm()
  const [items, setItems] = useState<MerchantCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [notBuilt, setNotBuilt] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<MerchantCampaign | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setFailed(false)
    try {
      const r = await merchantAdminApi.listCampaigns('in_review')
      /* Oldest first. The merchant who has waited longest is the one about to give up. */
      const rows = [...r.items]
        .filter(c => c.status === 'in_review')
        .sort((a, b) => new Date(a.submitted_at || 0).getTime() - new Date(b.submitted_at || 0).getTime())
      setItems(rows)
      setNotBuilt(false)
      onCount?.(rows.length)
    } catch (e) {
      const err = e as MerchantApiError
      if (err.status === 404) {
        // Not built yet on the server. That is an empty queue, not a broken one.
        setNotBuilt(true)
        setItems([])
        onCount?.(0)
      } else {
        setFailed(true)
        setItems([])
      }
    } finally {
      setLoading(false)
    }
  }, [onCount])

  useEffect(() => { load() }, [load])

  /* Open straight onto a card when the merchants page linked here with its id. */
  useEffect(() => {
    if (loading || typeof window === 'undefined') return
    const id = window.location.hash.replace('#', '')
    if (!id.startsWith('merchant-campaign-')) return
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [loading, items])

  const remove = (id: string) => setItems(list => {
    const next = list.filter(c => c.id !== id)
    onCount?.(next.length)
    return next
  })

  const approve = async (c: MerchantCampaign) => {
    const below = c.value_per_creator_aed < c.min_value
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
    setBusy(c.id)
    try {
      const r = await merchantAdminApi.approveCampaign(c.id)
      remove(c.id)
      toast.success(`${c.name} is live`, {
        description: r.pushed_to > 0
          ? `Pushed to ${r.pushed_to} ${r.pushed_to === 1 ? 'creator' : 'creators'} near ${c.merchant.name}.`
          : `No creators were in range to push to yet. It is live and will show in the app.`,
      })
    } catch (e) {
      toast.error((e as Error).message || 'Could not approve')
      load()
    } finally {
      setBusy(null)
    }
  }

  const reject = async (c: MerchantCampaign, reason: string) => {
    setBusy(c.id)
    try {
      await merchantAdminApi.rejectCampaign(c.id, reason)
      remove(c.id)
      setRejecting(null)
      toast.success(`Sent back to ${c.merchant.name}`, { description: 'They see your reason word for word.' })
    } catch (e) {
      toast.error((e as Error).message || 'Could not send it back')
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="space-y-3" id="merchant-campaigns">
      <SectionHead
        icon={Store}
        title="Merchant campaigns"
        count={items.length}
        note="Built by a self-serve merchant and waiting for a yes. Approving pushes it to creators nearby."
      />

      <ReadState
        failed={failed}
        loading={loading}
        empty={items.length === 0}
        what="the merchant campaigns waiting"
        onRetry={load}
        nothing={notBuilt
          ? 'No merchant campaigns waiting. The review queue is not switched on at the server yet.'
          : 'No merchant campaigns waiting'}
        skeleton={<div className="flex items-center gap-2 py-6 text-ds-caption">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Reading the queue
        </div>}
      >
        <div className="flex flex-col gap-3">
          {items.map(c => (
            <ReviewCard
              key={c.id}
              c={c}
              busy={busy === c.id}
              onApprove={() => approve(c)}
              onReject={() => setRejecting(c)}
            />
          ))}
        </div>
      </ReadState>

      <RejectDialog
        campaign={rejecting}
        busy={!!rejecting && busy === rejecting.id}
        onClose={() => setRejecting(null)}
        onSend={reason => rejecting && reject(rejecting, reason)}
      />
    </section>
  )
}

function ReviewCard({ c, busy, onApprove, onReject }: {
  c: MerchantCampaign
  busy: boolean
  onApprove: () => void
  onReject: () => void
}) {
  const below = c.value_per_creator_aed < c.min_value
  const tier = tierLabel(c.deliverable_tier)
  const deliverables = useMemo(
    () => c.deliverable_requirements.filter(d => d.required !== false).map(deliverable),
    [c.deliverable_requirements],
  )
  const dates = c.start_date || c.end_date
    ? [day(c.start_date), day(c.end_date)].filter(Boolean).join(' to ')
    : null

  return (
    <article id={`merchant-campaign-${c.id}`} className={cn(CARD, 'bg-card p-4 scroll-mt-24')}>
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
                {c.barter_items.slice(0, 4).map((b, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span className="truncate">{b.name}</span>
                    {b.value_aed > 0 && <span className="shrink-0 tabular-nums text-muted-foreground">{fmt(b.value_aed)}</span>}
                  </li>
                ))}
                {c.barter_items.length > 4 && (
                  <li className="text-muted-foreground">and {c.barter_items.length - 4} more</li>
                )}
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
            <div className="flex shrink-0 gap-2">
              <Button size="sm" disabled={busy} onClick={onApprove}>
                {busy ? <Loader2 className="mr-1.5 size-3.5 animate-spin" aria-hidden /> : <Check className="mr-1.5 size-3.5" aria-hidden />}
                Approve
              </Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={onReject}>
                <Undo2 className="mr-1.5 size-3.5" aria-hidden />
                Needs a change
              </Button>
            </div>
          </div>

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

          {c.merchant.id && (
            <p className="mt-auto text-ds-caption text-muted-foreground">
              <Link href="/work/merchants" className="hover:underline">All merchants</Link>
              {c.merchant.email ? ` · ${c.merchant.email}` : ''}
            </p>
          )}
        </div>
      </div>
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
function RejectDialog({ campaign, busy, onClose, onSend }: {
  campaign: MerchantCampaign | null
  busy: boolean
  onClose: () => void
  onSend: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  useEffect(() => { if (campaign) setReason('') }, [campaign?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const ready = reason.trim().length >= 8

  return (
    <Dialog open={!!campaign} onOpenChange={(o: boolean) => { if (!o && !busy) onClose() }}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Send {campaign?.name || 'this campaign'} back</DialogTitle>
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
