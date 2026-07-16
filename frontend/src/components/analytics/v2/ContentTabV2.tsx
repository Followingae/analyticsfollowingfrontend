"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { BadgeCheck, Handshake, Hash, Image as ImageIcon, MapPin, Music, Users } from "lucide-react"
import {
  isPresent, formatPct, BRAND_CONFIDENCE_LABELS, LANGUAGE_LABELS,
  type BrandConfidence, type CreatorAnalyticsV2,
} from "@/types/creatorAnalyticsV2"

const CONFIDENCE_STYLES: Record<BrandConfidence, string> = {
  collab: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
  tagged: "border-blue-500/20 bg-blue-500/10 text-blue-600",
  mention: "border-muted-foreground/20 bg-muted text-muted-foreground",
}

/**
 * Content, v2.
 *
 * Gone: aesthetic_score, professional_score, production_quality, visual_consistency
 * (CLIP never ran — analysis_method was "unavailable" on 70/70 profiles), and
 * caption diversity / writing level (the NLP fallback returned hardcoded 0s and a
 * hardcoded "lifestyle" theme for every creator).
 *
 * New and real: brands ranked by evidence strength with their actual logos,
 * languages that get Arabic and Arabizi right, and visual subjects derived from
 * Instagram's own alt text.
 */
export function ContentTabV2({ data }: { data: CreatorAnalyticsV2 }) {
  const { content_analysis, brands, locations, hashtags, format_detail, self_declared_ads } = data

  return (
    <div className="space-y-6">
      {isPresent(brands) && brands.brands.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Handshake className="h-4 w-4" />
                  Brands
                </CardTitle>
                <CardDescription>Ranked by how strong the evidence is</CardDescription>
              </div>
              {brands.brand_collab_detected && (
                <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
                  {brands.collab_count} collab{brands.collab_count === 1 ? "" : "s"} detected
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <TooltipProvider delayDuration={200}>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {brands.brands.map((b) => (
                  <div key={b.username}
                       className="flex items-center gap-3 rounded-lg border p-2.5">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={b.avatar_url ?? undefined} alt={b.username} />
                      <AvatarFallback className="text-[10px]">
                        {b.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="truncate text-sm font-medium">
                          {b.name ?? `@${b.username}`}
                        </span>
                        {b.is_verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-blue-500" />}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">@{b.username}</p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline"
                               className={`shrink-0 cursor-help text-[10px] ${CONFIDENCE_STYLES[b.confidence]}`}>
                          {BRAND_CONFIDENCE_LABELS[b.confidence]}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        {b.confidence === "collab" && "Formal Instagram Collab — the brand accepted co-authorship."}
                        {b.confidence === "tagged" && "Tagged by the creator in the image."}
                        {b.confidence === "mention" && "Mentioned in a caption only."}
                        {` ${b.post_count} post${b.post_count === 1 ? "" : "s"}.`}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                ))}
              </div>
            </TooltipProvider>
            {brands.tagged_by.length > 0 && (
              <div className="mt-4 border-t pt-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Users className="h-3.5 w-3.5" /> Tagged by
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {brands.tagged_by.slice(0, 12).map((t) => (
                    <Badge key={t.username} variant="secondary" className="text-[10px] font-normal">
                      @{t.username}
                      {t.post_count > 1 && <span className="ml-1 opacity-60">×{t.post_count}</span>}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isPresent(content_analysis) && (
        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Languages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {content_analysis.languages.map((l) => (
                <div key={l.language}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{LANGUAGE_LABELS[l.language] ?? l.language}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {Math.round(l.share * 100)}%
                    </span>
                  </div>
                  <Progress value={l.share * 100} className="h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Style</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Tone" value={content_analysis.tone} />
              <Row label="Register" value={content_analysis.audience_register} />
              {content_analysis.promotional_share != null && (
                <Row label="Promotional"
                     value={`${Math.round(content_analysis.promotional_share * 100)}% of posts`} />
              )}
              {isPresent(content_analysis.visual) && (
                <>
                  <Row label="Shot style" value={content_analysis.visual.shot_style ?? "—"} />
                  <Row label="Who's in frame" value={
                    (content_analysis.visual.people_presence ?? "—").replace(/_/g, " ")
                  } />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {isPresent(content_analysis) && isPresent(content_analysis.visual) &&
        content_analysis.visual.subjects.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ImageIcon className="h-4 w-4" /> What the images show
            </CardTitle>
            <CardDescription>
              From {content_analysis.visual.images_described} posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {content_analysis.visual.subjects.map((s) => (
                <Badge key={s} variant="outline" className="font-normal">{s}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isPresent(locations) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" /> Where they post from
            </CardTitle>
            <CardDescription>
              Tagged on {locations.posts_with_location} posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {locations.top.map((l) => (
                <div key={l.name} className="flex items-center justify-between text-sm">
                  <span className="truncate">{l.name}</span>
                  <span className="ml-3 shrink-0 tabular-nums text-muted-foreground">
                    {l.post_count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isPresent(self_declared_ads) && self_declared_ads.declared_ad_posts > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Paid vs organic</CardTitle>
            {/* Named honestly: these are the creator's own #ad/sponsored captions.
                Instagram's paid-partnership label is not obtainable via scraping. */}
            <CardDescription>
              From the creator&apos;s own #ad / sponsored captions
              {self_declared_ads.measured_by === "engagement_rate_by_view" &&
                " · engagement measured against views"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xl font-semibold tabular-nums">
                  {formatPct(self_declared_ads.declared_ad_engagement_rate)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Declared ads · {self_declared_ads.declared_ad_posts} posts
                </p>
              </div>
              <div>
                <div className="text-xl font-semibold tabular-nums">
                  {formatPct(self_declared_ads.organic_engagement_rate)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Organic · {self_declared_ads.organic_posts} posts
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isPresent(format_detail) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Production</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            {format_detail.median_video_seconds != null && (
              <Metric label="Median reel" value={`${format_detail.median_video_seconds}s`} />
            )}
            {format_detail.median_carousel_slides != null && (
              <Metric label="Carousel slides" value={String(format_detail.median_carousel_slides)} />
            )}
            {format_detail.audio?.original_audio_share != null && (
              <Metric label="Original audio"
                      value={`${Math.round(format_detail.audio.original_audio_share * 100)}%`} />
            )}
            {format_detail.aspect_ratios && (
              <Metric label="Mostly"
                      value={Object.entries(format_detail.aspect_ratios)
                        .sort((a, b) => b[1] - a[1])[0][0]} />
            )}
          </CardContent>
        </Card>
      )}

      {isPresent(format_detail) && format_detail.audio?.top_tracks?.length ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Music className="h-4 w-4" /> Audio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {format_detail.audio.top_tracks.map((t) => (
                <div key={t.track} className="flex items-center justify-between text-sm">
                  <span className="truncate">{t.track}</span>
                  <span className="ml-3 shrink-0 tabular-nums text-muted-foreground">{t.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {isPresent(hashtags) && hashtags.top.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Hash className="h-4 w-4" /> Hashtags
            </CardTitle>
            <CardDescription>
              {hashtags.unique_count} unique across {hashtags.posts_using_hashtags} posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {hashtags.top.map((t) => (
                <Badge key={t.tag} variant="secondary" className="font-normal">
                  #{t.tag}
                  {t.count > 1 && <span className="ml-1 opacity-60">{t.count}</span>}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="capitalize">{value}</span>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-lg font-semibold tabular-nums capitalize">{value}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
