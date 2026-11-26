'use client'

/**
 * /merchant/campaign: the one campaign, in whatever state it is in.
 *
 * Status at the top, the creator's card beside the facts, then creators and
 * content. Applications appear only when the merchant approves each creator
 * by hand and the campaign is live; with automatic approval there is nothing
 * to decide. Accept and reject reuse the brand campaign calls.
 */
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Pencil, Check, X, Loader2, Quote, Megaphone, ArrowRight, Camera, Users, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { brandCampaignApi } from '@/services/faAdminApi'
import { useMerchantHome, useInvalidateMerchant } from '@/hooks/useMerchantHome'
import {
  merchantApi,
  tierFor,
  totalValue,
  deliverablesLine,
  visitScheduleLine,
  visitStatusLine,
  type MerchantCampaign,
  type MerchantHomeData,
} from '@/services/merchantApi'
import { OfferSlotsDialog } from '@/components/visits/OfferSlotsDialog'
import { MerchantShell, ShellHeader } from './MerchantShell'
import { DropoutNotice } from './DropoutNotice'
import { Tile, TileTitle, StatusPill, Face, Dot, DOT, DOT_LABEL, Money, Quiet, EmptyState, TileEmpty, shortDate, type PillTone } from './bits'
import { CreatorCard } from './CreatorCard'
import { Thumb } from './tiles'

interface Application {
  id: string
  status: string
  creator_name?: string
  creator_username?: string
  creator_avatar?: string | null
  followers?: number | null
  city?: string | null
  applied_at?: string | null
  [k: string]: unknown
}

const STATUS: Record<string, { tone: PillTone; label: string }> = {
  draft: { tone: 'draft', label: 'Draft' },
  in_review: { tone: 'review', label: 'In review' },
  active: { tone: 'live', label: 'Live' },
  paused: { tone: 'draft', label: 'Paused' },
  completed: { tone: 'done', label: 'Finished' },
  rejected: { tone: 'change', label: 'Needs a change' },
}

export function CampaignView() {
  const home = useMerchantHome()
  const campaign = useQuery({ queryKey: ['merchant', 'campaign'], queryFn: merchantApi.campaign, retry: 0, enabled: !home.notMerchant })

  if (home.notMerchant) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="text-sm text-muted-foreground">This page is for merchant accounts on the barter trial.</p>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/dashboard">Back to your dashboard</Link>
        </Button>
      </div>
    )
  }

  if (home.loading || !home.data) {
    return (
      <MerchantShell name=" " subtitle=" ">
        <Skeleton className="h-9 w-72" />
        <div className="grid gap-4 lg:grid-cols-12">
          <Skeleton className="h-72 rounded-[20px] lg:col-span-7" />
          <Skeleton className="h-72 rounded-[20px] lg:col-span-5" />
        </div>
      </MerchantShell>
    )
  }

  return <CampaignBody home={home.data} campaign={campaign.data ?? null} loading={campaign.isPending} failed={campaign.isError} />
}

function CampaignBody({
  home,
  campaign,
  loading,
  failed,
}: {
  home: MerchantHomeData
  campaign: Awaited<ReturnType<typeof merchantApi.campaign>>
  loading: boolean
  failed: boolean
}) {
  const programme = home.trial.programme
  const status = campaign?.status || home.campaign?.status || null
  const info = status ? STATUS[status] || STATUS.draft : null
  const value = campaign ? totalValue(campaign.barter_items) : home.campaign?.value_per_creator_aed ?? 0
  const tier = campaign?.tier ?? tierFor(programme, value)
  const editable = !campaign || campaign.status === 'draft' || campaign.status === 'rejected' || !!campaign.review_note
  const manual = (campaign?.creator_approval_mode || home.settings?.creator_approval_mode || 'manual') === 'manual'
  const live = status === 'active' || status === 'paused'
  const subtitle = home.trial.status === 'complete' ? 'Trial complete' : 'Free trial'
  // An unsent draft is not a campaign yet. The wizard saves as it goes, so a draft can be
  // nothing more than an opened page; it gets the same calm start screen, with Continue.
  const unsent = !!campaign && campaign.status === 'draft' && !campaign.review_note
  const showStart = !campaign || unsent
  const visitFor = (participantId: string) => campaign?.visits?.find((v) => v.participant_id === participantId)

  return (
    <MerchantShell name={home.merchant.name} logoUrl={home.merchant.logo_url} subtitle={subtitle} className="lg:overflow-y-auto">
      <ShellHeader
        lead="Your"
        accent="campaign"
        right={
          <>
            {info && !showStart ? <StatusPill tone={info.tone}>{info.label}</StatusPill> : null}
            {editable && !loading && !showStart ? (
              <Link
                href="/merchant/campaign/new"
                className="inline-flex h-[34px] items-center gap-1.5 rounded-full bg-foreground px-4 text-[13px] font-medium text-background hover:opacity-90"
              >
                <Pencil className="size-3.5" strokeWidth={2} />
                {campaign ? 'Edit' : 'Start'}
              </Link>
            ) : null}
          </>
        }
      />

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-12">
          <Skeleton className="h-72 rounded-[20px] lg:col-span-7" />
          <Skeleton className="h-72 rounded-[20px] lg:col-span-5" />
        </div>
      ) : failed ? (
        <Tile>
          <Quiet>We could not load your campaign just now. Reload in a moment, or email partners@following.ae.</Quiet>
        </Tile>
      ) : showStart ? (
        <EmptyState
          icon={Megaphone}
          title={unsent ? 'Your draft is waiting' : 'No campaign yet'}
          line={unsent ? 'A few questions left.' : 'Seven questions. Ten minutes.'}
          className="min-h-[60dvh]"
          action={
            <Button asChild className="h-12 rounded-full px-6">
              <Link href="/merchant/campaign/new">
                {unsent ? 'Continue' : 'Start'}
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          {campaign.review_note && (campaign.status === 'rejected' || campaign.status === 'draft') ? (
            <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5">
              <Quote className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
              <div className="flex flex-col gap-1">
                <span className="text-[13px] font-medium">One change before it can go live</span>
                <p className="m-0 text-sm leading-relaxed text-muted-foreground">{campaign.review_note}</p>
              </div>
            </div>
          ) : null}

          <DropoutNotice dropouts={campaign.dropouts} manual={manual && live} href="#applications" />

          <section className="grid gap-4 lg:grid-cols-12">
            <Tile className="gap-5 p-6 lg:col-span-7">
              <TileTitle aside={campaign.submitted_at ? `Sent ${shortDate(campaign.submitted_at)}` : undefined}>{campaign.name || 'Your campaign'}</TileTitle>
              <dl className="m-0 grid gap-x-6 gap-y-4 text-[13px] sm:grid-cols-2">
                <Row k="Value per creator">
                  <Money amount={value} />
                </Row>
                <Row k="Tier">{tier?.label || 'Below the minimum'}</Row>
                <Row k="Each creator posts">{tier ? deliverablesLine(tier.guaranteed) : '–'}</Row>
                <Row k="If they can">{tier && tier.attempted.length ? deliverablesLine(tier.attempted) : 'Nothing extra'}</Row>
                <Row k="How they redeem">
                  {campaign.fulfilment_mode === 'delivery' ? 'Delivered' : campaign.fulfilment_mode === 'brand_ships' ? 'Shipped' : 'They come in'}
                  {campaign.fulfilment_mode === 'dine_in' && campaign.guests_allowed ? `, plus ${campaign.guests_allowed} ${campaign.guests_allowed === 1 ? 'guest' : 'guests'}` : ''}
                </Row>
                <Row k="Where">{campaign.visit_location || '–'}</Row>
                {campaign.fulfilment_mode === 'dine_in' ? <Row k="When they come">{visitScheduleLine(campaign.visit_schedule)}</Row> : null}
                <Row k="Dates">
                  {campaign.start_date ? `From ${shortDate(campaign.start_date)}` : 'When approved'}
                  {campaign.end_date ? ` to ${shortDate(campaign.end_date)}` : ''}
                </Row>
                <Row k="Creators">
                  {campaign.max_participants ?? programme.creators_per_month} this month, {manual ? 'you approve each one' : 'approved automatically'}
                </Row>
              </dl>
              {(campaign.content_requirements?.length || campaign.things_to_avoid?.length) ? (
                <div className="grid gap-4 border-t border-border pt-4 text-[13px] sm:grid-cols-2">
                  {campaign.content_requirements?.length ? <List title="Show this" items={campaign.content_requirements} /> : null}
                  {campaign.things_to_avoid?.length ? <List title="Please avoid" items={campaign.things_to_avoid} /> : null}
                </div>
              ) : null}
              {(campaign.mandatory_tags?.length || campaign.mandatory_hashtags?.length) ? (
                <div className="flex flex-wrap gap-1.5">
                  {[...(campaign.mandatory_tags || []), ...(campaign.mandatory_hashtags || [])].map((t) => (
                    <span key={t} className="rounded-full bg-muted px-2.5 py-1 text-xs">
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </Tile>

            <div id="preview" className="flex justify-center lg:col-span-5">
              <CreatorCard brief={campaign} merchantName={home.merchant.name} logoUrl={home.merchant.logo_url} tier={tier} />
            </div>
          </section>

          {live && manual ? <Applications campaignId={campaign.id} campaign={campaign} /> : null}
        </>
      )}

      {campaign && !showStart ? (
      <section id="creators" className="grid gap-4 lg:grid-cols-12">
        <Tile className="min-h-[220px] lg:col-span-6">
          <TileTitle>Your creators</TileTitle>
          {home.creators.length === 0 ? (
            <TileEmpty icon={Users} title="No creators yet" line={live ? 'Creators who apply and join show up here with where they are up to.' : 'Once your campaign is live, creators who join are listed here.'} />
          ) : (
            <div className="flex flex-col gap-2.5">
              {home.creators.map((c) => (
                <div key={c.id} className="flex items-center gap-2.5">
                  <Face name={c.name} src={c.avatar_url} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[13px] font-medium">{c.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{visitStatusLine(visitFor(c.id), campaign.visit_schedule) || c.note || DOT_LABEL[c.state]}</span>
                  </span>
                  <Dot className={DOT[c.state]} />
                </div>
              ))}
            </div>
          )}
        </Tile>

        <Tile id="content" className="min-h-[220px] lg:col-span-6">
          <TileTitle aside={home.content?.views ? `${new Intl.NumberFormat('en', { notation: 'compact' }).format(home.content.views)} views` : undefined}>
            Content
          </TileTitle>
          {!home.content?.latest?.length ? (
            <TileEmpty icon={Camera} title="Nothing posted yet" line="The first reel or story lands here as soon as a creator posts it." />
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {home.content.latest.map((item) => (
                <Thumb key={item.id} item={item} className="aspect-[4/5]" />
              ))}
            </div>
          )}
        </Tile>
      </section>
      ) : null}
    </MerchantShell>
  )
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="m-0 font-medium">{children}</dd>
    </div>
  )
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground">{title}</span>
      <ul className="m-0 list-disc pl-4">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  )
}

/* ── Applications ────────────────────────────────────────────────────────── */

function Applications({ campaignId, campaign }: { campaignId: string; campaign: MerchantCampaign }) {
  const slotsMode = campaign.visit_schedule?.mode === 'slots'
  const [offering, setOffering] = useState<Application | null>(null)
  const [apps, setApps] = useState<Application[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading')
  const [busy, setBusy] = useState<string | null>(null)
  const invalidate = useInvalidateMerchant()

  const load = useCallback(async () => {
    setState('loading')
    try {
      const res = await brandCampaignApi.getApplications(campaignId)
      if (res?.success === false) throw new Error()
      setApps((res?.data ?? res ?? []) as Application[])
      setState('ready')
    } catch {
      setState('failed')
    }
  }, [campaignId])

  useEffect(() => {
    load()
  }, [load])

  // Arriving from "Choose a replacement" on the home: the list draws after the page does, so scroll once it is there.
  useEffect(() => {
    if (state === 'ready' && typeof window !== 'undefined' && window.location.hash === '#applications') {
      document.getElementById('applications')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [state])

  const decide = async (app: Application, accept: boolean, offeredSlotIds?: string[]): Promise<boolean> => {
    // Set visit times: approving first asks which times to offer.
    if (accept && slotsMode && !offeredSlotIds) {
      setOffering(app)
      return false
    }
    setBusy(app.id)
    try {
      if (accept) {
        const res = await brandCampaignApi.acceptApplication(campaignId, app.id, offeredSlotIds ? { offered_slot_ids: offeredSlotIds } : undefined)
        if (res?.success === false) throw new Error()
      } else {
        await brandCampaignApi.rejectApplication(campaignId, app.id)
      }
      setApps((prev) => prev.map((a) => (a.id === app.id ? { ...a, status: accept ? 'accepted' : 'rejected' } : a)))
      toast.success(accept ? (offeredSlotIds ? 'They are in. They pick a time on WhatsApp.' : 'They are in') : 'Declined')
      invalidate()
      return true
    } catch {
      toast.error('That did not go through')
      return false
    } finally {
      setBusy(null)
    }
  }

  // Approved rows: the time they confirmed, or that the offer is out. Matched on participant_id when the row carries it.
  const visitLine = (a: Application): string | null => {
    const pid = typeof a.participant_id === 'string' ? a.participant_id : null
    if (!pid || a.status === 'pending') return null
    return visitStatusLine(campaign.visits?.find((v) => v.participant_id === pid), campaign.visit_schedule)
  }

  const pending = apps.filter((a) => a.status === 'pending')
  const decided = apps.filter((a) => a.status !== 'pending')

  return (
    <Tile id="applications" className="scroll-mt-6 gap-4">
      <TileTitle aside={pending.length ? `${pending.length} waiting` : undefined}>Creators who want to come</TileTitle>
      {state === 'loading' ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      ) : state === 'failed' ? (
        <Quiet>We could not load applications just now.</Quiet>
      ) : apps.length === 0 ? (
        <TileEmpty icon={UserPlus} title="No one has applied yet" line="Creators see your campaign in the app and apply from there." />
      ) : (
        <div className="flex flex-col gap-2">
          {[...pending, ...decided].map((a) => {
            const name = a.creator_name || a.creator_username || 'Creator'
            const sub = [a.followers ? `${new Intl.NumberFormat('en', { notation: 'compact' }).format(a.followers)} followers` : null, a.city].filter(Boolean).join(' · ')
            return (
              <div key={a.id} className={cn('flex items-center gap-3 rounded-xl bg-muted/60 px-3 py-2.5', a.status !== 'pending' && 'opacity-60')}>
                <Face name={name} src={a.creator_avatar} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[13px] font-medium">{name}</span>
                  {sub ? <span className="truncate text-xs text-muted-foreground">{sub}</span> : null}
                  {visitLine(a) ? <span className="truncate text-xs font-medium text-foreground">{visitLine(a)}</span> : null}
                </span>
                {a.status === 'pending' ? (
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="rounded-full" disabled={busy === a.id} onClick={() => decide(a, false)} aria-label="Decline">
                      <X className="size-3.5" />
                    </Button>
                    <Button size="sm" className="rounded-full" disabled={busy === a.id} onClick={() => decide(a, true)}>
                      {busy === a.id ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                      Approve
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">{a.status === 'accepted' ? 'Approved' : 'Declined'}</span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {slotsMode ? (
        <OfferSlotsDialog
          open={!!offering}
          onOpenChange={(v) => !v && setOffering(null)}
          who={offering ? offering.creator_username ? `@${offering.creator_username}` : offering.creator_name : null}
          slots={campaign.visit_schedule?.slots || []}
          bookings={campaign.slot_bookings}
          onConfirm={async (ids) => {
            if (offering && !(await decide(offering, true, ids))) throw new Error('not approved')
            setOffering(null)
          }}
        />
      ) : null}
    </Tile>
  )
}
