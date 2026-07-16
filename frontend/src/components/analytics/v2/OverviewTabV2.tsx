"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Activity, CalendarClock, Clock, Heart, MessageCircle, TrendingUp, Trophy, Eye,
} from "lucide-react"
import {
  isPresent, formatPct, formatCount, headlineEngagement, CONTENT_TYPE_LABELS,
  type CreatorAnalyticsV2, type EngagementByType, type HeadlineMetric,
} from "@/types/creatorAnalyticsV2"

/**
 * Overview, v2.
 *
 * Gone from here, all of it fabricated: viral potential (the backend literally
 * wrote note:"insufficient_data" and the UI rendered the 0 as "Low"), lifecycle
 * stage ("Declining", computed from 12 of 8,016 posts), and content quality score.
 *
 * Nothing renders unless its block says measured/inferred. No placeholders.
 */
export function OverviewTabV2({ data }: { data: CreatorAnalyticsV2 }) {
  const { engagement, performance, content_mix, cadence, content_analysis } = data

  return (
    <div className="space-y-6">
      {isPresent(engagement) && (() => {
        // Obey the backend's choice of denominator. Reading `engagement_rate`
        // directly here would print 98.79% for a 248-follower account whose reels
        // pull 16,841 views — true division, meaningless number.
        const { value, byView } = headlineEngagement(engagement)
        const perType = (v: EngagementByType) =>
          byView ? v.engagement_rate_by_view : v.engagement_rate
        const typed = Object.entries(engagement.by_content_type)
          .filter(([, v]) => perType(v) !== null)
          .sort((a, b) => (perType(b[1]) ?? 0) - (perType(a[1]) ?? 0))
        const max = Math.max(0, ...typed.map(([, v]) => perType(v) ?? 0))

        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Engagement</CardTitle>
              <CardDescription>
                Median across {byView ? engagement.view_sample_size : engagement.sample_size} posts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {value !== null && (
                <div className="flex flex-wrap items-end gap-6">
                  <div>
                    <div className="text-3xl font-bold tabular-nums">{formatPct(value)}</div>
                    <p className="text-xs text-muted-foreground">
                      {byView ? "of people who saw the post" : "of followers"}
                    </p>
                  </div>
                  {/* Only meaningful against followers. Against views it would be
                      contrasting a median with a mean of a different denominator. */}
                  {!byView && engagement.engagement_rate_mean !== null && (
                    <div className="pb-1">
                      <div className="text-sm text-muted-foreground tabular-nums">
                        mean {formatPct(engagement.engagement_rate_mean)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Say plainly why the denominator changed. A brand comparing this
                  creator against one measured on followers needs to know they are
                  not the same ratio — and the reach multiple is the evidence. */}
              {byView && engagement.reach_ratio !== null && (
                <p className="text-xs text-muted-foreground">
                  Typical post reaches{" "}
                  <span className="font-medium text-foreground tabular-nums">
                    {engagement.reach_ratio.toFixed(1)}x
                  </span>{" "}
                  this creator&apos;s follower count, so engagement is measured against
                  views rather than followers.
                </p>
              )}

              {typed.length > 1 && (
                <>
                  <Separator />
                  <div>
                    <p className="mb-3 text-sm font-medium">By format</p>
                    <div className="space-y-3">
                      {typed.map(([kind, v]) => {
                        const rate = perType(v) ?? 0
                        return (
                          <div key={kind}>
                            <div className="mb-1 flex items-center justify-between text-sm">
                              <span>{CONTENT_TYPE_LABELS[kind] ?? kind}</span>
                              <span className="tabular-nums">
                                {formatPct(rate)}
                                <span className="ml-2 text-xs text-muted-foreground">
                                  n={v.sample_size}
                                </span>
                              </span>
                            </div>
                            <Progress value={max > 0 ? (rate / max) * 100 : 0} className="h-1.5" />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )
      })()}

      {isPresent(performance) && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon={<Heart className="h-4 w-4" />} label="Median likes"
                value={formatCount(performance.median_likes)} />
          <Stat icon={<MessageCircle className="h-4 w-4" />} label="Median comments"
                value={formatCount(performance.median_comments)} />
          {performance.median_views != null && (
            <Stat icon={<Eye className="h-4 w-4" />} label="Median views"
                  value={formatCount(performance.median_views)}
                  sub={`${performance.posts_with_views} posts`} />
          )}
          {isPresent(content_mix) && (
            <Stat icon={<Activity className="h-4 w-4" />} label="Mostly"
                  value={CONTENT_TYPE_LABELS[content_mix.primary_format] ?? content_mix.primary_format}
                  sub={`${Math.round((content_mix.distribution[content_mix.primary_format] ?? 0) * 100)}% of posts`} />
          )}
        </div>
      )}

      {isPresent(content_analysis) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What they post about</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {content_analysis.categories.map((c) => (
                <Badge key={c.category} variant="secondary" className="capitalize">
                  {c.category}
                  <span className="ml-1.5 tabular-nums opacity-60">
                    {Math.round(c.share * 100)}%
                  </span>
                </Badge>
              ))}
            </div>
            {content_analysis.themes.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium">Themes</p>
                <div className="flex flex-wrap gap-1.5">
                  {content_analysis.themes.map((t) => (
                    <Badge key={t} variant="outline" className="font-normal">{t}</Badge>
                  ))}
                </div>
              </div>
            )}
            {content_analysis.notes && (
              <p className="text-sm text-muted-foreground">{content_analysis.notes}</p>
            )}
          </CardContent>
        </Card>
      )}

      {isPresent(performance) && (performance.best_post || performance.worst_post) && (
        <div className="grid gap-3 md:grid-cols-2">
          {performance.best_post && (
            <PostCard title="Best post" icon={<Trophy className="h-4 w-4 text-amber-500" />}
                      post={performance.best_post} rankedBy={performance.ranked_by} />
          )}
          {performance.worst_post && (
            <PostCard title="Weakest post" icon={<TrendingUp className="h-4 w-4 rotate-180 text-muted-foreground" />}
                      post={performance.worst_post} rankedBy={performance.ranked_by} />
          )}
        </div>
      )}

      {isPresent(cadence) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Posting activity</CardTitle>
            <CardDescription>
              {cadence.sample_size} posts over {cadence.span_days} days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {cadence.posts_per_week != null && (
                <Stat icon={<CalendarClock className="h-4 w-4" />} label="Per week"
                      value={String(cadence.posts_per_week)} />
              )}
              {cadence.median_gap_days != null && (
                <Stat icon={<Clock className="h-4 w-4" />} label="Median gap"
                      value={`${cadence.median_gap_days}d`} />
              )}
              <Stat icon={<CalendarClock className="h-4 w-4" />} label="Most active"
                    value={cadence.most_active_weekday} />
              {/* UTC is explicit: we don't know the creator's timezone, so implying
                  local time would be a small lie. */}
              <Stat icon={<Clock className="h-4 w-4" />} label="Peak hour"
                    value={`${String(cadence.most_active_hour_utc).padStart(2, "0")}:00`}
                    sub="UTC" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Stat({ icon, label, value, sub }: {
  icon: React.ReactNode; label: string; value: string; sub?: string
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <div className="text-xl font-semibold tabular-nums">{value}</div>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function PostCard({ title, icon, post, rankedBy }: {
  title: string; icon: React.ReactNode; post: NonNullable<
    Extract<CreatorAnalyticsV2["performance"], { source: "measured" }>["best_post"]
  >
  /** The badge is a bare percentage, so it has to say what it is a percentage OF —
   *  otherwise it reads as the follower rate and silently contradicts the headline. */
  rankedBy: HeadlineMetric
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">{icon}{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 tabular-nums">
            <Heart className="h-3.5 w-3.5" />{formatCount(post.likes)}
          </span>
          <span className="flex items-center gap-1 tabular-nums">
            <MessageCircle className="h-3.5 w-3.5" />{formatCount(post.comments)}
          </span>
          {post.views != null && (
            <span className="flex items-center gap-1 tabular-nums">
              <Eye className="h-3.5 w-3.5" />{formatCount(post.views)}
            </span>
          )}
          <Badge variant="secondary" className="ml-auto tabular-nums">
            {formatPct(post.engagement_rate)}
            <span className="ml-1 font-normal opacity-70">
              {rankedBy === "engagement_rate_by_view" ? "of views" : "of followers"}
            </span>
          </Badge>
        </div>
        {post.url && (
          <a href={post.url} target="_blank" rel="noopener noreferrer"
             className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
            View on Instagram
          </a>
        )}
      </CardContent>
    </Card>
  )
}
