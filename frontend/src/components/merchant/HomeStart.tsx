'use client'

/**
 * The home before there is anything to measure: no campaign yet, or a draft
 * that was started and left. There are no numbers to show, so the screen shows
 * the shape of what is coming instead: how the offer turns into content, what
 * each value tier earns, the card creators will see, and what to have ready.
 * One button matters, and it is the dark one.
 */
import Link from 'next/link'
import { Gift, ShieldCheck, Camera, Play, Circle, Image as ImageIcon, Check, Store, UserCheck, ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { tierFor, type MerchantHomeData, type ProgrammeTier } from '@/services/merchantApi'
import { ShellHeader } from './MerchantShell'
import { Tile, Eyebrow, StatusPill, Money, FOREST, LIME, greetingWord, todayLine } from './bits'
import { TrialTile } from './tiles'
import { CreatorCard } from './CreatorCard'

const STEPS = [
  { icon: Gift, title: 'You set the offer', line: 'What a creator gets when they come in.' },
  { icon: ShieldCheck, title: 'We read and approve it', line: 'Usually within one business day.' },
  { icon: Camera, title: 'Creators visit and post', line: 'Reels and stories land in your dashboard.' },
]

const DELIVERABLE_ICON: Record<string, typeof Play> = { reel: Play, video: Play, tiktok_video: Play, story: Circle, post: ImageIcon, carousel: ImageIcon }

function rangeLabel(t: ProgrammeTier): React.ReactNode {
  if (t.max == null) {
    return (
      <>
        <Money amount={t.min} /> and up
      </>
    )
  }
  return (
    <>
      <Money amount={t.min} /> to <Money amount={t.max} />
    </>
  )
}

export function HomeStart({ data }: { data: MerchantHomeData }) {
  const campaign = data.campaign
  const draft = !!campaign
  const programme = data.trial.programme
  const tiers = programme.tiers || []
  const minimum = programme.min_value_per_creator_aed
  const sampleTier = tierFor(programme, minimum)
  const hasLogo = !!data.merchant.logo_url
  const hasCover = !!(data.merchant.cover_image_url || campaign?.hero_image_url)

  return (
    <>
      <ShellHeader
        kicker={todayLine()}
        lead={`${greetingWord()},`}
        accent={data.merchant.name}
        right={<StatusPill tone="draft">{draft ? 'Draft saved' : 'No campaign yet'}</StatusPill>}
      />

      <section
        aria-label="Get started"
        className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12 lg:grid-rows-2 lg:[&>*]:min-h-0"
      >
        {/* Hero: the picture of what happens, then the one button */}
        <Tile className="flex-row gap-0 p-0 md:col-span-2 lg:col-span-8">
          <div className={cn('relative hidden w-[38%] shrink-0 overflow-hidden sm:block', FOREST)} aria-hidden="true">
            <span className="absolute -left-10 -top-10 size-44 rounded-full bg-[oklch(0.9354_0.2254_121.5)]/90" />
            <span className="absolute bottom-8 right-6 size-24 rounded-full border-[10px] border-[oklch(0.9354_0.2254_121.5)]/70" />
            <span className="absolute left-[18%] top-[36%] flex w-[64%] flex-col gap-2 rounded-[18px] bg-background/95 p-3 text-foreground shadow-[0_20px_40px_-24px_rgba(0,0,0,0.6)]">
              <span className="flex items-center gap-2">
                <span className="inline-flex size-7 items-center justify-center rounded-lg bg-foreground text-background"><Play className="size-3.5" strokeWidth={2} /></span>
                <span className="h-2 w-20 rounded-full bg-muted" />
              </span>
              <span className="h-16 rounded-xl bg-[linear-gradient(160deg,var(--muted)_0%,var(--accent)_100%)]" />
              <span className="flex items-center justify-between">
                <span className="h-2 w-16 rounded-full bg-muted" />
                <span className={cn('inline-flex h-6 items-center rounded-full px-2 text-[11px] font-semibold', LIME)}>Barter</span>
              </span>
            </span>
            <span className="absolute bottom-6 left-5 inline-flex items-center gap-1.5 rounded-full bg-background/95 px-2.5 py-1.5 text-[11px] font-medium text-foreground shadow-sm">
              <Sparkles className="size-3.5" strokeWidth={2} />
              {programme.creators_per_month} creators a month
            </span>
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-between gap-5 p-6 sm:p-7">
            <div className="flex flex-col gap-2">
              <Eyebrow>{draft ? 'Your draft' : 'Your first campaign'}</Eyebrow>
              <h2 className="m-0 text-[24px] font-semibold leading-tight tracking-[-0.02em] sm:text-[26px]">
                {draft ? (campaign?.name || 'Pick up where you left off') : 'Tell creators what is on the table'}
              </h2>
              <p className="m-0 max-w-[44ch] text-sm leading-relaxed text-muted-foreground">
                {draft
                  ? 'Your answers are saved. Finish the last few questions and send it to us.'
                  : `Seven short questions, about ten minutes. We put your offer in front of ${programme.creators_per_month} creators a month, and nothing goes live until we have read it.`}
              </p>
            </div>

            <ol className="m-0 grid list-none grid-cols-3 gap-3 p-0">
              {STEPS.map(({ icon: Icon, title, line }, i) => (
                <li key={title} className="flex flex-col gap-2">
                  <span className="inline-flex size-9 items-center justify-center rounded-full bg-muted text-foreground">
                    <Icon className="size-4" strokeWidth={1.75} />
                  </span>
                  <span className="text-[13px] font-medium leading-tight">
                    <span className="text-muted-foreground">{i + 1}. </span>
                    {title}
                  </span>
                  <span className="hidden text-xs leading-snug text-muted-foreground xl:block">{line}</span>
                </li>
              ))}
            </ol>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/merchant/campaign/new"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                {draft ? 'Continue setting up' : 'Start your campaign'}
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
              <span className="text-xs text-muted-foreground">Saves as you go.</span>
            </div>
          </div>
        </Tile>

        <TrialTile trial={data.trial} className="lg:col-span-4" />

        {/* What each value tier earns */}
        <Tile className="lg:col-span-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="m-0 text-[15px] font-semibold">What your offer earns</h2>
            <span className="text-xs text-muted-foreground">per creator</span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col justify-center gap-2">
            {tiers.map((t, i) => {
              const last = i === tiers.length - 1
              return (
                <div
                  key={t.key}
                  className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5', last ? LIME : 'bg-muted/60')}
                >
                  <span className={cn('w-[118px] shrink-0 text-[13px] font-medium tabular-nums', last ? '' : 'text-foreground')}>{rangeLabel(t)}</span>
                  <span className="flex flex-1 items-center gap-1.5">
                    {[...t.guaranteed, ...t.attempted].map((d, j) => {
                      const Icon = DELIVERABLE_ICON[d.type] || ImageIcon
                      const attempted = j >= t.guaranteed.length
                      return (
                        <span
                          key={`${d.type}-${j}`}
                          title={attempted ? 'Attempted, not promised' : 'Guaranteed'}
                          className={cn(
                            'inline-flex size-7 items-center justify-center rounded-lg',
                            attempted ? 'border border-dashed border-current/40 text-current/70' : last ? 'bg-[oklch(0.2_0.03_140)] text-[oklch(0.9354_0.2254_121.5)]' : 'bg-foreground text-background',
                          )}
                        >
                          <Icon className="size-3.5" strokeWidth={2} />
                        </span>
                      )
                    })}
                  </span>
                  <span className={cn('shrink-0 text-xs font-medium', last ? '' : 'text-muted-foreground')}>{t.label}</span>
                </div>
              )
            })}
          </div>
          <span className="text-xs text-muted-foreground">
            Minimum <Money amount={minimum} /> per creator. Dashed means attempted, not promised.
          </span>
        </Tile>

        {/* The card as a creator sees it */}
        <Tile className="items-center justify-center bg-muted/40 p-4 lg:col-span-4">
          <div className="flex w-full items-baseline justify-between px-1">
            <h2 className="m-0 text-[15px] font-semibold">In the creator app</h2>
            <span className="text-xs text-muted-foreground">Example at the minimum</span>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
            <CreatorCard
              className="origin-center scale-[0.78] xl:scale-[0.86]"
              merchantName={data.merchant.name}
              logoUrl={data.merchant.logo_url}
              tier={sampleTier}
              brief={{
                name: 'Your campaign name',
                hero_image_url: data.merchant.cover_image_url || null,
                barter_items: [{ name: 'What a creator gets', value_aed: minimum }],
                fulfilment_mode: 'dine_in',
                visit_location: 'Your address',
                guests_allowed: 1,
              } as never}
            />
          </div>
        </Tile>

        {/* Have ready */}
        <Tile className="lg:col-span-3">
          <h2 className="m-0 text-[15px] font-semibold">Have these ready</h2>
          <div className="flex min-h-0 flex-1 flex-col justify-center gap-2">
            <Ready icon={Store} label="Your logo" done={hasLogo} href="/merchant/campaign/new?step=1" />
            <Ready icon={ImageIcon} label="One cover photo" done={hasCover} href="/merchant/campaign/new?step=1" />
            <Ready icon={Gift} label="What a creator gets" done={draft && (campaign?.value_per_creator_aed ?? 0) >= minimum} href="/merchant/campaign/new?step=2" />
            <Ready icon={UserCheck} label="How you approve creators" done={!!campaign?.creator_approval_mode} href="/merchant/campaign/new?step=6" />
          </div>
          <span className="text-xs text-muted-foreground">Questions? Reply to any email from us.</span>
        </Tile>
      </section>
    </>
  )
}

function Ready({ icon: Icon, label, done, href }: { icon: typeof Store; label: string; done: boolean; href: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 rounded-xl bg-muted/60 px-3 py-2 transition-colors hover:bg-muted">
      <span className={cn('inline-flex size-8 shrink-0 items-center justify-center rounded-full', done ? LIME : 'bg-card text-foreground')}>
        {done ? <Check className="size-3.5" strokeWidth={2.5} /> : <Icon className="size-3.5" strokeWidth={1.75} />}
      </span>
      <span className="flex-1 text-[13px] font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">{done ? 'Done' : 'Add'}</span>
    </Link>
  )
}
