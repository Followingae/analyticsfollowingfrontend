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
} from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { cdnAvatar } from "@/lib/avatar"
import type { BrandInfluencer } from "@/services/adminProposalMasterApi"
import { creatorCost, whyFor } from "./optimiser"

const fmt = (n?: number | null) =>
  n == null ? "—" : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}K` : `${Math.round(n)}`
const aed = (n: number) => `AED ${Math.round(n).toLocaleString("en-US")}`

const FORMAT: Record<string, string> = { reel: "Reels", carousel: "Carousels", image: "Photos", video: "Videos" }
const STANDING: Record<string, string> = {
  exceptional: "Exceptional for their size",
  typical: "Typical for their size",
  below_average: "Below average for their size",
}

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
  if (!c) return null
  const m = c.measured
  const why = whyFor(c, pool)
  const er = m?.engagement_rate ?? c.engagement_rate
  const byFormat = Object.entries(m?.by_content_type ?? {})
    .sort((a, b) => (b[1]?.sample_size ?? 0) - (a[1]?.sample_size ?? 0))
  const maxEr = Math.max(...byFormat.map(([, v]) => v?.engagement_rate ?? 0), 0.0001)
  const mix = Object.entries(m?.content_mix ?? {}).sort((a, b) => b[1] - a[1])

  return (
    <Sheet open={!!c} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto px-5 pb-6 sm:max-w-lg [&>button]:top-5 [&>button]:right-5">
        <SheetHeader className="px-0">
          <div className="flex items-center gap-3">
            <img src={cdnAvatar(c.profile_image_url || undefined)} alt="" className="size-12 rounded-full object-cover" />
            <div className="min-w-0">
              <SheetTitle className="truncate text-left text-lg">{c.full_name || c.username}</SheetTitle>
              <p className="text-sm text-muted-foreground">@{c.username}</p>
            </div>
            {c.username && (
              <a
                href={`https://instagram.com/${c.username}`}
                target="_blank"
                rel="noopener noreferrer"
                title={`@${c.username} on Instagram`}
                className="ml-auto mr-9 grid size-9 shrink-0 place-items-center rounded-lg border text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <Instagram className="size-4" />
              </a>
            )}
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
            {m?.standing && (
              <span className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
                m.standing === "exceptional" ? "bg-emerald-500/15 text-emerald-600"
                  : m.standing === "below_average" ? "bg-destructive/10 text-destructive"
                  : "bg-muted text-muted-foreground",
              )}>
                <Heart className="size-3" />{STANDING[m.standing]}
              </span>
            )}
            {m?.category && <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">{m.category}</span>}
          </div>

          <div className="flex overflow-hidden rounded-2xl border bg-muted/40">
            <div className="flex-1 p-3.5 text-center">
              <b className="block text-[17px] font-bold tracking-[-0.025em]">{fmt(c.followers_count)}</b>
              <span className="text-[10px] uppercase tracking-[0.09em] text-muted-foreground">followers</span>
            </div>
            <div className="flex-1 border-l p-3.5 text-center">
              <b className="block text-[17px] font-bold tracking-[-0.025em]">{er != null ? `${er.toFixed(2)}%` : "—"}</b>
              <span className="text-[10px] uppercase tracking-[0.09em] text-muted-foreground">engagement</span>
            </div>
            {m?.median_views != null && (
              <div className="flex-1 border-l p-3.5 text-center">
                <b className="block text-[17px] font-bold tracking-[-0.025em]">{fmt(m.median_views)}</b>
                <span className="text-[10px] uppercase tracking-[0.09em] text-muted-foreground">median views</span>
              </div>
            )}
          </div>

          {byFormat.length > 0 && (
            <section className="flex flex-col gap-3">
              <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                <BarChart3 className="size-3.5" />Engagement by format
              </p>
              {byFormat.map(([f, v]) => (
                <div key={f} className="grid grid-cols-[74px_1fr_52px_62px] items-center gap-2.5">
                  <span className="text-[12.5px] font-semibold">{FORMAT[f] ?? f}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-muted">
                    <i className="block h-full rounded-full bg-primary" style={{ width: `${Math.max(4, ((v?.engagement_rate ?? 0) / maxEr) * 100)}%` }} />
                  </span>
                  <span className="text-right text-[12.5px] font-bold tabular-nums">{(v?.engagement_rate ?? 0).toFixed(2)}%</span>
                  <span className="text-right text-[11px] text-muted-foreground">{v?.sample_size ?? 0} posts</span>
                </div>
              ))}
            </section>
          )}

          {(m?.median_likes != null || m?.median_comments != null) && (
            <section className="flex flex-col gap-3">
              <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                <Eye className="size-3.5" />Typical post
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { icon: Heart, v: m?.median_likes, l: "median likes" },
                  { icon: MessageCircle, v: m?.median_comments, l: "median comments" },
                  { icon: Eye, v: m?.median_views, l: "median views" },
                ].filter(x => x.v != null).map((x, n) => (
                  <div key={n} className="rounded-2xl border bg-muted/40 p-3">
                    <x.icon className="size-4 text-muted-foreground" />
                    <b className="mt-1 block text-[17px] font-bold tracking-[-0.025em]">{fmt(x.v)}</b>
                    <span className="text-[10.5px] text-muted-foreground">{x.l}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {mix.length > 0 && (
            <section className="flex flex-col gap-3">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">What they post</p>
              <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                {mix.map(([f, v]) => (
                  <i key={f} title={`${FORMAT[f] ?? f} ${Math.round(v * 100)}%`}
                     className={cn("block h-full", f === "reel" ? "bg-primary" : f === "carousel" ? "bg-blue-500" : "bg-emerald-500")}
                     style={{ width: `${v * 100}%` }} />
                ))}
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {mix.map(([f, v]) => (
                  <span key={f} className="inline-flex items-center gap-1.5">
                    <i className={cn("size-2 rounded-full", f === "reel" ? "bg-primary" : f === "carousel" ? "bg-blue-500" : "bg-emerald-500")} />
                    {FORMAT[f] ?? f} {Math.round(v * 100)}%
                  </span>
                ))}
              </div>
            </section>
          )}

          {(m?.posts_per_week != null || m?.most_active_weekday) && (
            <section className="flex flex-col gap-3">
              <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                <CalendarDays className="size-3.5" />Posting activity
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {m?.posts_per_week != null && (
                  <div className="rounded-2xl border bg-muted/40 p-3">
                    <CalendarDays className="size-4 text-muted-foreground" />
                    <b className="mt-1 block text-[17px] font-bold tracking-[-0.025em]">{m.posts_per_week}</b>
                    <span className="text-[10.5px] text-muted-foreground">posts a week</span>
                  </div>
                )}
                {m?.most_active_weekday && (
                  <div className="rounded-2xl border bg-muted/40 p-3">
                    <Clock className="size-4 text-muted-foreground" />
                    <b className="mt-1 block text-[17px] font-bold tracking-[-0.025em]">{m.most_active_weekday.slice(0, 3)}</b>
                    <span className="text-[10.5px] text-muted-foreground">most active day</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {m?.viral_skew && (
            <p className="flex items-start gap-2.5 rounded-2xl bg-amber-500/10 p-3 text-[12.5px] leading-relaxed text-amber-700 dark:text-amber-400">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              Their averages are carried by one post that went far beyond the rest. A typical
              post performs closer to the medians above.
            </p>
          )}

          {showPricing && creatorCost(c) > 0 && (
            <section className="flex items-baseline justify-between gap-3 border-t pt-4">
              <span className="text-[12.5px] text-muted-foreground">
                {(c.assigned_deliverables ?? []).map(d => `${d.quantity} × ${d.type}`).join(" + ") || "Rate"}
              </span>
              <b className="text-xl font-bold tracking-[-0.03em]">{aed(creatorCost(c))}</b>
            </section>
          )}

          {m?.posts_analysed != null && (
            <p className="text-[11.5px] leading-relaxed text-muted-foreground">
              Measured from their last {m.posts_analysed} posts by our own pipeline, not supplied by the creator.
            </p>
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
    </Sheet>
  )
}
