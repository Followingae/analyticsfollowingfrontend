'use client'

/**
 * The home before the campaign is live: no campaign yet, a draft, one in
 * review, or one sent back with a note. The hero tells them which, and the
 * rest of the screen shows what they offered and what comes back.
 */
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { merchantApi, tierFor, totalValue, type MerchantHomeData } from '@/services/merchantApi'
import { useInvalidateMerchant } from '@/hooks/useMerchantHome'
import { ShellHeader } from './MerchantShell'
import { Tile, Eyebrow, StatusPill, Cover, todayLine, type PillTone } from './bits'
import { TrialTile, OfferTile, GetBackTile } from './tiles'

type Phase = 'none' | 'draft' | 'review' | 'change'

function phaseOf(data: MerchantHomeData): Phase {
  const c = data.campaign
  if (!c) return 'none'
  if (c.status === 'in_review') return 'review'
  if (c.status === 'rejected' || (c.status === 'draft' && c.review_note)) return 'change'
  return 'draft'
}

const PILL: Record<Phase, { tone: PillTone; label: string }> = {
  none: { tone: 'draft', label: 'No campaign yet' },
  draft: { tone: 'draft', label: 'Draft' },
  review: { tone: 'review', label: 'In review' },
  change: { tone: 'change', label: 'Needs a change' },
}

export function HomeInReview({ data }: { data: MerchantHomeData }) {
  const phase = phaseOf(data)
  const campaign = data.campaign
  const invalidate = useInvalidateMerchant()
  const [switching, setSwitching] = useState(false)

  // The brief itself (items, value) is not on /home. One more read, cached with the rest.
  const brief = useQuery({ queryKey: ['merchant', 'campaign'], queryFn: merchantApi.campaign, enabled: !!campaign, retry: 0 })
  const items = (brief.data?.barter_items || []).map((i) => ({ name: i.name, value_aed: Number(i.value_aed) || 0 }))
  const total = brief.data ? totalValue(brief.data.barter_items) : campaign?.value_per_creator_aed ?? 0
  const programme = data.trial.programme
  const tier = brief.data?.tier ?? tierFor(programme, total)
  const mode = data.settings?.creator_approval_mode || campaign?.creator_approval_mode || 'manual'

  const switchMode = async () => {
    setSwitching(true)
    try {
      await merchantApi.saveSettings({ creator_approval_mode: mode === 'manual' ? 'auto' : 'manual' })
      await invalidate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'That did not save')
    } finally {
      setSwitching(false)
    }
  }

  const step = phase === 'review' ? 2 : phase === 'change' ? 1 : 0
  const hasCover = !!(campaign?.hero_image_url || data.merchant.cover_image_url)
  const hasLogo = !!data.merchant.logo_url

  return (
    <>
      <ShellHeader
        kicker={todayLine()}
        lead="Welcome,"
        accent={data.merchant.name}
        right={<StatusPill tone={PILL[phase].tone}>{PILL[phase].label}</StatusPill>}
      />

      <section
        aria-label="Overview"
        className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12 lg:grid-rows-2 lg:[&>*]:min-h-0"
      >
        {/* Hero */}
        <Tile className="flex-row gap-0 p-0 md:col-span-2 lg:col-span-8">
          <div className="hidden w-[34%] shrink-0 sm:block">
            <Cover src={campaign?.hero_image_url || data.merchant.cover_image_url} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 p-6 sm:p-7">
            <div className="flex flex-col gap-2">
              <Eyebrow>Your campaign</Eyebrow>
              <h2 className="m-0 text-[22px] font-semibold leading-tight tracking-[-0.02em] sm:text-[24px]">
                {phase === 'none' ? 'Set up your first campaign' : campaign?.name || 'Your campaign'}
              </h2>
              <p className="m-0 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
                {phase === 'none' &&
                  `Seven short questions, about ten minutes. Tell creators what they get, and we will put it in front of ${programme.creators_per_month} of them a month.`}
                {phase === 'draft' && 'You have started. Pick up where you left off and send it to us when it reads right.'}
                {phase === 'review' &&
                  'We are reading it now. Campaigns are usually approved within one business day, and creators see it the moment it goes live.'}
                {phase === 'change' && (campaign?.review_note ? `We read it and have one note: “${campaign.review_note}”` : 'We read it and need one change before it can go live.')}
              </p>
            </div>

            <ol className="m-0 flex list-none items-center p-0">
              {['Submitted', 'In review', 'Live for creators'].map((label, i) => {
                const done = i < step
                const current = i === step
                return (
                  <li key={label} className="contents">
                    <span className={cn('flex items-center gap-2 text-[13px]', done || current ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                      <span
                        aria-hidden="true"
                        className={cn(
                          'inline-flex size-[22px] items-center justify-center rounded-full text-[11px]',
                          done && 'bg-foreground text-background',
                          current && phase !== 'change' && 'bg-[var(--tone-warn-dot)] text-foreground',
                          current && phase === 'change' && 'bg-destructive text-white',
                          !done && !current && 'border border-border',
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className="hidden sm:inline">{label}</span>
                    </span>
                    {i < 2 ? <span aria-hidden="true" className={cn('mx-2.5 h-px flex-1', i < step ? 'bg-foreground' : 'bg-border')} /> : null}
                  </li>
                )
              })}
            </ol>

            <div className="flex flex-wrap gap-2.5">
              {phase === 'none' ? (
                <Link href="/merchant/campaign/new" className="inline-flex h-9 items-center rounded-full bg-foreground px-4 text-[13px] font-medium text-background hover:opacity-90">
                  Start your campaign
                </Link>
              ) : (
                <>
                  <Link
                    href={phase === 'review' ? '/merchant/campaign' : '/merchant/campaign/new'}
                    className="inline-flex h-9 items-center rounded-full border border-border bg-card px-4 text-[13px] font-medium hover:bg-muted"
                  >
                    {phase === 'review' ? 'View campaign' : phase === 'change' ? 'Make the change' : 'Continue setting up'}
                  </Link>
                  <Link href="/merchant/campaign#preview" className="inline-flex h-9 items-center rounded-full bg-muted px-4 text-[13px] font-medium hover:bg-accent">
                    Preview as a creator
                  </Link>
                </>
              )}
            </div>
          </div>
        </Tile>

        <TrialTile trial={data.trial} className="lg:col-span-4" />

        <OfferTile items={items} total={total} minimum={programme.min_value_per_creator_aed} tier={tier} className="lg:col-span-4" />
        <GetBackTile tier={tier} className="lg:col-span-4" />

        {/* While you wait */}
        <Tile className="lg:col-span-4">
          <h2 className="m-0 text-[15px] font-semibold">While you wait</h2>
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
            <Link href="/merchant/campaign/new?step=1" className="flex items-center gap-2.5 rounded-xl bg-muted/60 px-3 py-2.5 hover:bg-muted">
              <span className="flex-1 text-[13px] font-medium">Add your logo and cover</span>
              <span className={cn('text-xs font-medium', hasLogo && hasCover ? 'text-[var(--tone-good-ink)]' : 'text-muted-foreground')}>
                {hasLogo && hasCover ? 'Done' : 'To do'}
              </span>
            </Link>
            <button
              type="button"
              onClick={switchMode}
              disabled={switching}
              className="flex items-center gap-2.5 rounded-xl bg-muted/60 px-3 py-2.5 text-left hover:bg-muted disabled:opacity-60"
            >
              <span className="flex-1 text-[13px] font-medium">Choose how creators are approved</span>
              <span className="text-xs text-muted-foreground">{mode === 'manual' ? 'You approve' : 'Automatic'}</span>
            </button>
            <Link href="/guide" className="flex items-center gap-2.5 rounded-xl bg-muted/60 px-3 py-2.5 hover:bg-muted">
              <span className="flex-1 text-[13px] font-medium">Tell your floor team to expect creators</span>
              <span className="text-xs text-muted-foreground">Read</span>
            </Link>
          </div>
          <span className="text-xs text-muted-foreground">Questions? Reply to any email from us.</span>
        </Tile>
      </section>
    </>
  )
}
