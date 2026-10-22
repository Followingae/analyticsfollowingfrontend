"use client"

/**
 * A creator's numbers, beside the wall rather than instead of it.
 *
 * Sending someone to a full analytics page mid-decision loses them the plan they were
 * building. This is the same measured data our pipeline produces — engagement by format,
 * the typical post rather than the best one, what they post and how often — in a panel
 * they can close and carry on.
 *
 * Everything here is measured. A creator we have not analysed shows the sections we have
 * and simply omits the rest, rather than filling the gaps with zeros.
 */
import {
  Instagram, Heart, Users, Eye, MessageCircle, CalendarDays, Clock, BarChart3, Check, Plus, Star, TriangleAlert,
  ChevronRight, Youtube,
} from "lucide-react"
import { useEffect, useState } from "react"
import { ScreenshotLightbox } from "@/components/ScreenshotLightbox"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { cdnAvatar } from "@/lib/avatar"
import type { BrandInfluencer } from "@/services/adminProposalMasterApi"
import { creatorCost, whyFor } from "./optimiser"
import { PlatformIcon, TikTokGlyph } from "@/components/icons/PlatformIcon"
import { PLATFORM_LABEL, describeIncludes, describeLine, isBundleKey, platformsOfLine, type Platform } from "@/lib/deliverables"
import { PlatformPanel } from "./PlatformPanel"
import { InstagramPanel, StandingChip } from "./InstagramPanel"

const fmt = (n?: number | null) =>
  n == null ? "—" : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}K` : `${Math.round(n)}`
const aed = (n: number) => `AED ${Math.round(n).toLocaleString("en-US")}`

const SOCIAL_BTN =
  "grid size-9 shrink-0 place-items-center rounded-lg border text-muted-foreground transition hover:bg-muted hover:text-foreground"

export function CreatorSheet({
  creator: c, pool, showPricing, chosen, onToggle, onOpenChange,
}: {
  creator: BrandInfluencer | null
  pool: BrandInfluencer[]
  showPricing: boolean
  chosen: boolean
  onToggle: (c: BrandInfluencer) => void
  onOpenChange: (open: boolean) => void
}) {
  const [insightsOpen, setInsightsOpen] = useState(false)
  const [tab, setTab] = useState<Platform>("instagram")
  useEffect(() => { setInsightsOpen(false); setTab("instagram") }, [c?.id])
  if (!c) return null
  // A tab per platform we actually measured. Instagram is always there; a TikTok we hold
  // a link for but have not measured gets its link in the header, not an empty tab.
  const measuredOn = c.platforms_measured ?? {}
  const tabs: Platform[] = ["instagram", ...(["tiktok", "youtube"] as const).filter((p) => measuredOn[p])]
  const lines = c.assigned_deliverables ?? []
  const m = c.measured
  const insights = c.direct_analytics ?? []
  const why = whyFor(c, pool)

  return (
    <Sheet open={!!c} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto px-5 pb-6 sm:max-w-xl lg:max-w-2xl [&>button]:top-5 [&>button]:right-5">
        <SheetHeader className="px-0">
          <div className="flex items-center gap-3">
            <img src={cdnAvatar(c.profile_image_url || undefined)} alt="" className="size-12 rounded-full object-cover" />
            <div className="min-w-0">
              <SheetTitle className="truncate text-left text-lg">{c.full_name || c.username}</SheetTitle>
              <p className="text-sm text-muted-foreground">@{c.username}</p>
            </div>
            {/* Each channel we hold a link for, Instagram first. TikTok and YouTube only
                appear when we saved a link, so a button never leads nowhere. */}
            <div className="ml-auto mr-9 flex shrink-0 items-center gap-1.5">
              {c.username && (
                <a
                  href={`https://instagram.com/${c.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`@${c.username} on Instagram`}
                  className={SOCIAL_BTN}
                >
                  <Instagram className="size-4" />
                </a>
              )}
              {c.socials?.tiktok && (
                <a href={c.socials.tiktok} target="_blank" rel="noopener noreferrer" title="On TikTok" className={SOCIAL_BTN}>
                  <TikTokGlyph className="size-4" />
                </a>
              )}
              {c.socials?.youtube && (
                <a href={c.socials.youtube} target="_blank" rel="noopener noreferrer" title="On YouTube" className={SOCIAL_BTN}>
                  <Youtube className="size-4" />
                </a>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-col gap-5">
          {/* Our recommendation reads in full here, and where it stands the optimiser's chip
              stands down — the same order of precedence the tile keeps. */}
          {c.recommended && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-lime-400/50 bg-lime-400/10 px-3.5 py-3">
              <Star className="mt-0.5 size-4 shrink-0 fill-lime-500 text-lime-500" />
              <div className="min-w-0">
                <b className="block text-[13px] font-bold tracking-[-0.01em]">Recommended by us</b>
                {c.recommended_note && (
                  <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">{c.recommended_note}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {why && !c.recommended && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-bold text-primary">
                {why.title} · {why.value}
              </span>
            )}
            {/* Only ever a compliment. The bottom band is not served to a client by the
                API any more, and this guard keeps it that way if anything else ever feeds
                this sheet. */}
            <StandingChip standing={m?.standing} />
            {m?.category && <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">{m.category}</span>}
          </div>

          {tabs.length > 1 && (
            <div role="tablist" aria-label="Platform" className="flex gap-1 rounded-full bg-muted p-1">
              {tabs.map((p) => (
                <button
                  key={p}
                  type="button"
                  role="tab"
                  aria-selected={tab === p}
                  onClick={() => setTab(p)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold transition",
                    tab === p ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <PlatformIcon platform={p} className="size-3.5" />{PLATFORM_LABEL[p]}
                </button>
              ))}
            </div>
          )}

          {tab !== "instagram" && measuredOn[tab] && <PlatformPanel data={measuredOn[tab]!} />}

          {tab === "instagram" && (<>
          {/* Screenshots of their own Instagram insights, sent to us by the creator. Only
              there when we have some: no screenshots, no button. */}
          {insights.length > 0 && (
            <button
              type="button"
              onClick={() => setInsightsOpen(true)}
              className="group flex w-full items-center gap-3.5 rounded-2xl border bg-card p-3 text-left transition hover:border-foreground/20 hover:bg-muted/40"
            >
              <span className="relative h-14 w-[4.5rem] shrink-0">
                {insights.slice(0, 3).map((src, i) => (
                  <img
                    key={src}
                    src={src}
                    alt=""
                    style={{ left: i * 14, zIndex: 3 - i, transform: `rotate(${(i - 1) * 5}deg)` }}
                    className="absolute top-0 h-14 w-10 rounded-md border-2 border-background object-cover object-top shadow-sm transition group-hover:-translate-y-0.5"
                  />
                ))}
              </span>
              <span className="min-w-0 flex-1">
                <b className="block text-[14px] font-bold tracking-[-0.01em]">Creator insights</b>
                <span className="block text-xs text-muted-foreground">
                  {insights.length} screenshot{insights.length === 1 ? "" : "s"} from their own Instagram
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
            </button>
          )}

          <InstagramPanel m={m} followers={c.followers_count} fallbackEr={c.engagement_rate} />
          </>)}

          {/* What this booking is, on which platform. Said whether or not prices are shown:
              the work is the brand's to know even on a deal priced by the head. A package
              is one line, taken whole, with what it contains underneath. */}
          {lines.length > 0 && (
            <section className="flex flex-col gap-2.5 border-t pt-4">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">What you are booking</p>
              <ul className="flex flex-col gap-2">
                {lines.map((d, i) => (
                  <li key={d.type + i} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex shrink-0 gap-1 text-muted-foreground">
                      {platformsOfLine(d).map((p) => <PlatformIcon key={p} platform={p} className="size-3.5" />)}
                    </span>
                    <span className="min-w-0 text-[13px]">
                      <b className="font-semibold">{describeLine(d)}</b>
                      {isBundleKey(d.type) && d.includes?.length ? (
                        <span className="block text-[12px] text-muted-foreground">{describeIncludes(d.includes)}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
              {showPricing && creatorCost(c) > 0 && (
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[12.5px] text-muted-foreground">Total for this creator</span>
                  <b className="text-xl font-bold tracking-[-0.03em]">{aed(creatorCost(c))}</b>
                </div>
              )}
            </section>
          )}

          <Button
            size="lg"
            variant={chosen ? "outline" : "default"}
            className="w-full gap-2"
            onClick={() => onToggle(c)}
          >
            {chosen ? <><Check className="size-4" />In your line-up</> : <><Plus className="size-4" />Add to line-up</>}
          </Button>

          {c.username && (
            <a href={`/creator-analytics/${c.username}`} className="text-center text-[12.5px] font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground">
              Open their full analytics
            </a>
          )}
        </div>
      </SheetContent>
      <ScreenshotLightbox
        images={insights}
        open={insightsOpen}
        onOpenChange={setInsightsOpen}
        title={`${c.full_name || `@${c.username}`}: insights`}
        subtitle="Screenshots from the creator's own Instagram"
      />
    </Sheet>
  )
}
