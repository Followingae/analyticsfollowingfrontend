"use client"

/**
 * A creator's TikTok or YouTube, as we measured them, in the same language as the
 * Instagram tab beside it.
 *
 * Every figure here is measured by our own pipeline. A section with nothing measured is not
 * drawn: no zeros, no "not available" placeholders. There are no "typical for their size"
 * bands on these platforms: ours are calibrated on Instagram, and a TikTok rate judged
 * against an Instagram band would be a confident lie.
 *
 * Engagement leads per VIEW here. TikTok and YouTube reach comes from the feed and from
 * recommendations rather than from followers, so per view is the native measure and is
 * what those platforms' own tools report. The per-follower rate sits beside it.
 */
import { CalendarDays, Clock, Eye, Heart, MessageCircle, Play, Share2, Bookmark, TriangleAlert, BadgeCheck } from "lucide-react"
import type { PlatformEngagement, PlatformMeasured, PlatformTopVideo, YouTubeFormat } from "@/services/adminProposalMasterApi"
import { PlatformIcon } from "@/components/icons/PlatformIcon"
import { PLATFORM_LABEL } from "@/lib/deliverables"

const fmt = (n?: number | null) =>
  n == null ? "—" : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}K` : `${Math.round(n)}`

const pct = (n?: number | null) => (n == null ? null : `${n.toFixed(2)}%`)

const dur = (s?: number | null) =>
  s == null ? null : s >= 60 ? `${Math.floor(s / 60)}m ${Math.round(s % 60)}s` : `${Math.round(s)}s`

function Label({ icon: Icon, children }: { icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
      {Icon && <Icon className="size-3.5" />}{children}
    </p>
  )
}

function Tile({ icon: Icon, value, label }: { icon: React.ComponentType<{ className?: string }>; value: string; label: string }) {
  return (
    <div className="rounded-2xl border bg-muted/40 p-3">
      <Icon className="size-4 text-muted-foreground" />
      <b className="mt-1 block text-[17px] font-bold tracking-[-0.025em]">{value}</b>
      <span className="text-[10.5px] text-muted-foreground">{label}</span>
    </div>
  )
}

/** The headline strip: audience, engagement per view, typical views. */
function Strip({ followers, followersLabel, eng, views }: {
  followers?: number | null; followersLabel: string; eng: PlatformEngagement; views?: number | null
}) {
  const cells = [
    { v: fmt(followers), l: followersLabel, show: followers != null },
    { v: pct(eng.engagement_rate_by_views) ?? pct(eng.engagement_rate) ?? "—", l: eng.engagement_rate_by_views != null ? "engagement per view" : "engagement", show: true },
    { v: fmt(views), l: "median views", show: views != null },
  ].filter((c) => c.show)
  return (
    <div className="flex overflow-hidden rounded-2xl border bg-muted/40">
      {cells.map((c, i) => (
        <div key={c.l} className={`flex-1 p-3.5 text-center ${i ? "border-l" : ""}`}>
          <b className="block text-[17px] font-bold tracking-[-0.025em]">{c.v}</b>
          <span className="text-[10px] uppercase tracking-[0.09em] text-muted-foreground">{c.l}</span>
        </div>
      ))}
    </div>
  )
}

function TopVideos({ videos, platform }: { videos: PlatformTopVideo[]; platform: "tiktok" | "youtube" }) {
  const shown = videos.filter((v) => v.cover)
  if (!shown.length) return null
  const tall = platform === "tiktok"
  return (
    <section className="flex flex-col gap-3">
      <Label icon={Play}>Their most watched</Label>
      <div className={tall ? "grid grid-cols-3 gap-2" : "grid grid-cols-2 gap-2"}>
        {shown.map((v, i) => (
          <a
            key={(v.url ?? "") + i}
            href={v.url ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            title={v.caption}
            className="group relative overflow-hidden rounded-xl border bg-muted"
          >
            <img
              src={v.cover!}
              alt=""
              loading="lazy"
              className={`w-full object-cover transition duration-300 group-hover:scale-[1.03] ${tall || v.kind === "short" ? "aspect-[9/16]" : "aspect-video"}`}
            />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-black/75 to-transparent px-2 pb-1.5 pt-5 text-[11.5px] font-bold text-white">
              <Eye className="size-3" />{fmt(v.views)}
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}

function Rhythm({ cadence }: { cadence?: PlatformMeasured["cadence"] }) {
  if (!cadence || cadence.source !== "measured") return null
  return (
    <section className="flex flex-col gap-3">
      <Label icon={CalendarDays}>Posting activity</Label>
      <div className="grid grid-cols-2 gap-2.5">
        {cadence.posts_per_week != null && <Tile icon={CalendarDays} value={String(cadence.posts_per_week)} label="posts a week" />}
        {cadence.most_active_weekday && <Tile icon={Clock} value={cadence.most_active_weekday.slice(0, 3)} label="most active day" />}
      </div>
    </section>
  )
}

function YouTubeFormatBlock({ title, f }: { title: string; f?: YouTubeFormat }) {
  if (!f || f.source !== "measured") return null
  const eng = f.engagement
  const tiles = [
    { icon: Eye, v: f.median_views, l: "median views" },
    { icon: Heart, v: f.median_likes, l: "median likes" },
    { icon: MessageCircle, v: f.median_comments, l: "median comments" },
  ].filter((t) => t.v != null)
  return (
    <section className="flex flex-col gap-3">
      <Label>{title} · {f.count} checked{f.median_duration_s != null ? ` · typically ${dur(f.median_duration_s)}` : ""}</Label>
      <div className="grid grid-cols-3 gap-2.5">
        {tiles.map((t) => <Tile key={t.l} icon={t.icon} value={fmt(t.v)} label={t.l} />)}
      </div>
      {eng?.source === "measured" && eng.engagement_rate_by_views != null && (
        <p className="text-[12.5px] text-muted-foreground">
          <b className="text-foreground">{pct(eng.engagement_rate_by_views)}</b> of viewers like or comment
        </p>
      )}
    </section>
  )
}

export function PlatformPanel({ data }: { data: PlatformMeasured }) {
  const { platform, profile, engagement: eng } = data
  const isTikTok = platform === "tiktok"
  const t = data.typical
  const ads = isTikTok ? data.brands?.self_declared_ads : data.brands?.paid_promotions

  return (
    <div className="flex flex-col gap-5">
      {profile.url && (
        <a
          href={profile.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-2 text-[13px] font-semibold text-muted-foreground hover:text-foreground"
        >
          <PlatformIcon platform={platform} className="size-4" />
          {profile.display_name || profile.handle}
          {profile.is_verified && <BadgeCheck className="size-3.5" />}
          <span className="font-normal">{isTikTok ? `@${profile.handle}` : profile.handle}</span>
        </a>
      )}

      <Strip
        followers={profile.followers_count}
        followersLabel={isTikTok ? "followers" : "subscribers"}
        eng={eng}
        views={isTikTok ? t?.median_views : (data.shorts?.median_views ?? data.long_videos?.median_views)}
      />

      {eng.engagement_rate != null && eng.engagement_rate_by_views != null && (
        <p className="-mt-2 text-[12px] leading-relaxed text-muted-foreground">
          Per view, because {PLATFORM_LABEL[platform]} shows posts to people beyond their followers.
          Per follower it is {pct(eng.engagement_rate)}.
        </p>
      )}

      {isTikTok && t?.source === "measured" && (
        <section className="flex flex-col gap-3">
          <Label icon={Eye}>Typical video{t.median_duration_s != null ? ` · ${dur(t.median_duration_s)}` : ""}</Label>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { icon: Heart, v: t.median_likes, l: "median likes" },
              { icon: MessageCircle, v: t.median_comments, l: "median comments" },
              { icon: Share2, v: t.median_shares, l: "median shares" },
              { icon: Bookmark, v: t.median_saves, l: "median saves" },
              { icon: Eye, v: t.median_views, l: "median views" },
            ].filter((x) => x.v != null).slice(0, 6).map((x) => (
              <Tile key={x.l} icon={x.icon} value={fmt(x.v)} label={x.l} />
            ))}
          </div>
        </section>
      )}

      {!isTikTok && (
        <>
          <YouTubeFormatBlock title="Long videos" f={data.long_videos} />
          <YouTubeFormatBlock title="Shorts" f={data.shorts} />
        </>
      )}

      <TopVideos videos={data.top_videos ?? []} platform={platform} />

      <Rhythm cadence={data.cadence} />

      {eng.viral_skew && (
        <p className="flex items-start gap-2.5 rounded-2xl bg-amber-500/10 p-3 text-[12.5px] leading-relaxed text-amber-700 dark:text-amber-400">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          Their average is carried by one video that went far beyond the rest. A typical video
          performs closer to the medians above.
        </p>
      )}

      {ads != null && ads > 0 && data.brands?.posts_checked != null && (
        <p className="text-[12.5px] text-muted-foreground">
          {ads} of their last {data.brands.posts_checked} {isTikTok ? "videos were marked as ads" : "videos were marked as paid promotion"}.
        </p>
      )}

      {eng.sample_size_all != null && (
        <p className="text-[11.5px] leading-relaxed text-muted-foreground">
          Measured from their last {eng.sample_size_all} {isTikTok ? "videos" : "uploads"} by our own pipeline, not supplied by the creator.
        </p>
      )}
    </div>
  )
}
