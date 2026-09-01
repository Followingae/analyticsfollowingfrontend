"use client"

/**
 * What we have measured about this creator. Density tier: WORKING.
 *
 * The screen used to open with a 4xl "0.00%" for every creator we have never analysed, and
 * then say underneath that there was no analytics data. Two claims, one of them false, and
 * the false one set in the largest type on the page. A creator we have not measured now says
 * so once, in words, and prints no figures at all: an unmeasured creator and a creator whose
 * audience does not engage look identical as a zero, and only one of those is a reason to
 * drop them from a proposal.
 *
 * The cards are gone with them. Three averages in a row are three of the same kind of thing;
 * the space between them says that already.
 */
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RefreshCw, Brain } from "lucide-react"
import type { MasterInfluencer } from "@/types/influencerDatabase"
import { getEngagementColor } from "@/types/influencerDatabase"
import { count } from "./Money"
import { cn } from "@/lib/utils"

interface InfluencerAnalyticsTabProps {
  influencer: MasterInfluencer
  onRefresh: () => void
}

export function InfluencerAnalyticsTab({
  influencer,
  onRefresh,
}: InfluencerAnalyticsTabProps) {
  const rate = influencer.engagement_rate
  // Measured, not "measured and non-zero". A real 0% is a finding; never having run is not.
  const measured = rate != null

  const languageEntries = Object.entries(influencer.language_distribution || {}).sort(
    (a, b) => b[1] - a[1]
  )
  const maxLangValue = languageEntries.length > 0 ? languageEntries[0][1] : 1

  const lastRefresh = influencer.last_analytics_refresh
    ? new Date(influencer.last_analytics_refresh).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Never"

  return (
    <div className="flex max-w-[640px] flex-col gap-ds-5">
      {measured ? (
        <>
          <div>
            <p className="text-ds-caption text-muted-foreground">Engagement</p>
            <p className={cn("mt-ds-1 text-[40px] font-semibold leading-none tabular-nums", getEngagementColor(rate))}>
              {rate.toFixed(2)}%
            </p>
            <p className="mt-ds-2 max-w-[65ch] text-ds-caption text-muted-foreground">
              Against {count(influencer.avg_likes)} likes and {count(influencer.avg_comments)} comments
              on a typical post.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-x-ds-5 gap-y-ds-3">
            <div>
              <p className="text-ds-caption text-muted-foreground">Likes, typical</p>
              <p className="mt-ds-1 text-ds-heading tabular-nums">{count(influencer.avg_likes)}</p>
            </div>
            <div>
              <p className="text-ds-caption text-muted-foreground">Comments, typical</p>
              <p className="mt-ds-1 text-ds-heading tabular-nums">{count(influencer.avg_comments)}</p>
            </div>
            <div>
              <p className="text-ds-caption text-muted-foreground">Views, typical</p>
              <p className="mt-ds-1 text-ds-heading tabular-nums">{count(influencer.avg_views)}</p>
            </div>
          </div>
        </>
      ) : (
        <p className="max-w-[65ch] text-ds-body text-muted-foreground">
          We have never measured this creator. Nothing is shown rather than zeros: an
          unmeasured creator and a creator nobody engages with are not the same thing, and
          only one of them is a reason not to book them.
        </p>
      )}

      {/* AI analysis, only where there is some. */}
      {(influencer.ai_content_categories?.length > 0 || influencer.ai_sentiment_score !== null) && (
        <section className="flex flex-col gap-ds-3">
          <h3 className="flex items-center gap-ds-2 text-ds-label">
            <Brain className="h-4 w-4 text-muted-foreground" />
            What they post about
          </h3>

          {influencer.ai_content_categories?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {influencer.ai_content_categories.map((cat) => (
                <Badge key={cat} variant="secondary" className="text-[10px] capitalize">
                  {cat}
                </Badge>
              ))}
            </div>
          )}

          {influencer.ai_sentiment_score !== null && (
            <div className="flex items-center gap-ds-2">
              <span className="w-40 text-ds-caption text-muted-foreground">Tone of their comments</span>
              <Progress value={(influencer.ai_sentiment_score || 0) * 100} className="h-1.5 flex-1" />
              <span className="w-12 text-right text-ds-caption tabular-nums">
                {influencer.ai_sentiment_score.toFixed(2)}
              </span>
            </div>
          )}

          {influencer.ai_audience_quality_score !== null && (
            <div className="flex items-center gap-ds-2">
              <span className="w-40 text-ds-caption text-muted-foreground">Audience quality</span>
              <Progress value={(influencer.ai_audience_quality_score || 0) * 100} className="h-1.5 flex-1" />
              <span className="w-12 text-right text-ds-caption tabular-nums">
                {influencer.ai_audience_quality_score.toFixed(2)}
              </span>
            </div>
          )}
        </section>
      )}

      {/* Languages, only where there are some. */}
      {languageEntries.length > 0 && (
        <section className="flex flex-col gap-ds-2">
          <h3 className="text-ds-label">Languages they post in</h3>
          <div className="flex flex-col gap-ds-2">
            {languageEntries.map(([lang, value]) => (
              <div key={lang} className="flex items-center gap-ds-2">
                <span className="w-12 text-ds-caption uppercase text-muted-foreground">{lang}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-[var(--console-lime)]"
                    style={{ width: `${(value / maxLangValue) * 100}%` }}
                  />
                </div>
                <span className="w-10 text-right text-ds-caption tabular-nums text-muted-foreground">
                  {(value * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-ds-2 border-t pt-ds-3">
        <p className="text-ds-caption text-muted-foreground">Last measured: {lastRefresh}</p>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="mr-1.5 h-3 w-3" />
          Pull the latest analytics
        </Button>
      </div>
    </div>
  )
}
