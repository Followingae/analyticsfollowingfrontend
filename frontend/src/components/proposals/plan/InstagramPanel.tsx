"use client"

/**
 * A creator's Instagram, as we measured it. The one rendering, used by the brand's proposal
 * panel and by our own creator database, so the two never show the same creator differently.
 *
 * Everything here is measured. A section with nothing measured is not drawn.
 *
 * `internal` is our own screens: they also get the bottom size band ("below average for
 * their size"), which a client is never shown about a creator we are pitching.
 */
import { BarChart3, CalendarDays, Clock, Eye, Heart, MessageCircle, TriangleAlert, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BrandInfluencer } from "@/services/adminProposalMasterApi"

export type InstagramMeasured = NonNullable<BrandInfluencer["measured"]>

const fmt = (n?: number | null) =>
  n == null ? "—" : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}K` : `${Math.round(n)}`

const FORMAT: Record<string, string> = { reel: "Reels", carousel: "Carousels", image: "Photos", video: "Videos" }

export const STANDING_LABEL: Record<string, string> = {
  exceptional: "Exceptional for their size",
  above_average: "Above average for their size",
  typical: "Typical for their size",
  below_average: "Below average for their size",
}

/** The size-band chip. Clients only ever see the two compliments. */
export function StandingChip({ standing, internal = false }: { standing?: string | null; internal?: boolean }) {
  if (!standing) return null
  if (!internal && !(standing === "exceptional" || standing === "above_average")) return null
  const label = STANDING_LABEL[standing]
  if (!label) return null
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
      standing === "exceptional" || standing === "above_average" ? "bg-emerald-500/15 text-emerald-600"
        : standing === "below_average" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
        : "bg-muted text-muted-foreground",
    )}>
      <Heart className="size-3" />{label}
    </span>
  )
}

export function InstagramPanel({
  m, followers, fallbackEr,
}: {
  m?: InstagramMeasured | null
  followers?: number | null
  /** The rate on the creator's own record, used only when we hold no measured block. */
  fallbackEr?: number | null
}) {
  const hidden = !!m?.likes_hidden
  const er = hidden ? null : (m?.engagement_rate ?? fallbackEr ?? null)
  const byFormat = Object.entries(m?.by_content_type ?? {})
    .sort((a, b) => (b[1]?.sample_size ?? 0) - (a[1]?.sample_size ?? 0))
  const maxEr = Math.max(...byFormat.map(([, v]) => v?.engagement_rate ?? 0), 0.0001)
  const mix = Object.entries(m?.content_mix ?? {}).sort((a, b) => b[1] - a[1])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex overflow-hidden rounded-2xl border bg-muted/40">
        <div className="flex-1 p-3.5 text-center">
          <b className="block text-[17px] font-bold tracking-[-0.025em]">{fmt(followers)}</b>
          <span className="text-[10px] uppercase tracking-[0.09em] text-muted-foreground">followers</span>
        </div>
        <div className="flex-1 border-l p-3.5 text-center">
          {hidden ? (
            <>
              <b className="flex items-center justify-center gap-1.5 text-[15px] font-bold tracking-[-0.02em]">
                <EyeOff className="size-4" />Likes hidden
              </b>
              <span className="text-[10px] uppercase tracking-[0.09em] text-muted-foreground">engagement</span>
            </>
          ) : (
            <>
              <b className="block text-[17px] font-bold tracking-[-0.025em]">{er != null ? `${er.toFixed(2)}%` : "—"}</b>
              <span className="text-[10px] uppercase tracking-[0.09em] text-muted-foreground">engagement</span>
            </>
          )}
        </div>
        {m?.median_views != null && (
          <div className="flex-1 border-l p-3.5 text-center">
            <b className="block text-[17px] font-bold tracking-[-0.025em]">{fmt(m.median_views)}</b>
            <span className="text-[10px] uppercase tracking-[0.09em] text-muted-foreground">median views</span>
          </div>
        )}
      </div>

      {hidden && (
        <p className="-mt-2 text-[12px] leading-relaxed text-muted-foreground">
          They hide their like counts on Instagram, so an engagement rate cannot be measured.
          {m?.median_comments != null && <> A typical post gets {fmt(m.median_comments)} comments.</>}
        </p>
      )}

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

      {m?.posts_analysed != null && (
        <p className="text-[11.5px] leading-relaxed text-muted-foreground">
          Measured from their last {m.posts_analysed} posts by our own pipeline, not supplied by the creator.
        </p>
      )}
    </div>
  )
}

/** The full-analytics payload (/api/v2/creator-analytics) in the shape the panel reads. */
export function measuredFromV2(p: any): InstagramMeasured | null {
  if (!p) return null
  const eng = p.engagement ?? {}
  const perf = p.performance ?? {}
  const mix = p.content_mix ?? {}
  const cad = p.cadence ?? {}
  const ca = p.content_analysis ?? {}
  if (eng.source !== "measured" && perf.source !== "measured") return null
  const headline = eng.likes_hidden ? null : (eng[eng.headline_metric ?? "engagement_rate"] ?? eng.engagement_rate ?? null)
  return {
    posts_analysed: eng.sample_size_all ?? eng.sample_size ?? undefined,
    engagement_rate: headline,
    standing: eng.benchmark?.standing ?? null,
    likes_hidden: !!eng.likes_hidden,
    comment_rate: eng.comment_rate ?? null,
    by_content_type: Object.fromEntries(
      Object.entries(eng.by_content_type ?? {})
        .filter(([, v]: [string, any]) => v?.engagement_rate != null)
        .map(([k, v]: [string, any]) => [k, { engagement_rate: v.engagement_rate, sample_size: v.sample_size }]),
    ),
    viral_skew: !!eng.viral_skew,
    median_likes: eng.likes_hidden ? null : (perf.median_likes ?? null),
    median_comments: perf.median_comments ?? eng.median_comments ?? null,
    median_views: perf.median_views ?? eng.median_views ?? null,
    content_mix: mix.distribution ?? {},
    primary_format: mix.primary_format ?? null,
    posts_per_week: cad.posts_per_week ?? null,
    most_active_weekday: cad.most_active_weekday ?? null,
    category: ca.source === "inferred" ? ca.primary_category ?? null : null,
    language: ca.source === "inferred" ? ca.primary_language ?? null : null,
  }
}
