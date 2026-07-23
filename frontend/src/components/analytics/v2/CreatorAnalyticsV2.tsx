"use client"

import { useEffect, useMemo, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertTriangle, BadgeCheck, ExternalLink, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { creatorAnalyticsV2Api, NotAnalysedError } from "@/services/creatorAnalyticsV2Api"
import {
  isPresent, formatCount, formatPct, type CreatorAnalyticsV2 as Payload,
} from "@/types/creatorAnalyticsV2"
import { OverviewTabV2 } from "./OverviewTabV2"
import { PostsTabV2 } from "./PostsTabV2"
import { ContentTabV2 } from "./ContentTabV2"

/**
 * Creator Analytics, v2.
 *
 * THREE tabs, not four. The Audience tab is gone: its demographics were invented
 * from the creator's own hashtags (gender splits summing to 130%), its quality
 * scores were engagement variance relabelled as follower facts, and its fraud
 * gauge contradicted the quality panel on the same screen. With nothing real left
 * in it, and no empty states, there is no tab.
 *
 * Every block renders only when its own `source` says measured/inferred.
 */
export function CreatorAnalyticsV2({ username }: { username: string }) {
  const [data, setData] = useState<Payload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notAnalysed, setNotAnalysed] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    setLoading(true); setError(null); setNotAnalysed(false)
    try {
      setData(await creatorAnalyticsV2Api.get(username))
    } catch (e) {
      if (e instanceof NotAnalysedError) setNotAnalysed(true)
      else setError(e instanceof Error ? e.message : "Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [username])

  const refresh = async () => {
    setRefreshing(true)
    try {
      setData(await creatorAnalyticsV2Api.refresh(username))
      setNotAnalysed(false)
      toast.success(`@${username} analysed`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed")
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) return <LoadingState />

  if (notAnalysed) {
    // Not "no data" — never analysed. Conflating those is the exact defect this
    // rebuild removes, so say which one it is.
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <h3 className="mb-1 text-lg font-semibold">@{username} hasn&apos;t been analysed yet</h3>
          <p className="mb-5 max-w-sm text-center text-sm text-muted-foreground">
            No analytics have been collected for this creator.
          </p>
          <Button onClick={refresh} disabled={refreshing}>
            {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {refreshing ? "Analysing — this takes a minute…" : "Analyse now"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertTriangle className="mb-3 h-8 w-8 text-destructive" />
          <p className="mb-4 text-sm text-muted-foreground">{error ?? "No analytics"}</p>
          <Button variant="outline" onClick={load}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  const p = data.profile
  const eng = data.engagement
  const hasPosts =
    isPresent(data.recent_posts) && data.recent_posts.posts.some((x) => x.thumbnail_url)

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={p.profile_pic_url ?? undefined} alt={p.username} />
              <AvatarFallback>{p.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-2xl font-bold">{p.full_name ?? p.username}</h1>
                {p.is_verified && <BadgeCheck className="h-5 w-5 shrink-0 text-blue-500" />}
              </div>
              <p className="text-sm text-muted-foreground">@{p.username}</p>
              {p.biography && (
                <p className="mt-2 max-w-xl whitespace-pre-line text-sm text-muted-foreground">
                  {p.biography}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {p.business_category && (
                  <Badge variant="outline" className="capitalize">{p.business_category}</Badge>
                )}
                {isPresent(data.content_analysis) && (
                  <Badge variant="secondary" className="capitalize">
                    {data.content_analysis.primary_category}
                  </Badge>
                )}
                {p.external_urls?.slice(0, 1).map((u) => (
                  <a key={u.url} href={u.url} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
                    <ExternalLink className="h-3 w-3" />
                    {/* Prefer the creator's own label; fall back to the bare domain.
                        Guarded because this exact line assumed a string and threw
                        "e.replace is not a function" on Instagram's link objects. */}
                    {u.title || (typeof u.url === "string"
                      ? u.url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]
                      : "Link")}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {data._meta?.status === "partial" && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline"
                             className="cursor-help border-orange-500/20 bg-orange-500/10 text-orange-600">
                        Partial
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Some sources failed, so parts of this are missing rather than
                      estimated: {Object.keys(data._meta.source_errors).join(", ")}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
                {refreshing
                  ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
                Refresh
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-4">
            <Head label="Followers" value={formatCount(p.followers_count)} />
            {/* Real now — the old pipeline stored 0 here for every single creator,
                which made followers/following ratios like 821,480. */}
            <Head label="Following" value={formatCount(p.following_count)} />
            <Head label="Posts" value={formatCount(p.posts_count)} />
            {isPresent(eng) && (
              <Head label="Engagement" value={formatPct(eng.engagement_rate)} sub="median" />
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        {/* Column count must match the number of triggers actually rendered — the
            Posts tab is conditional, so 4 tabs when it shows, 3 when it doesn't.
            A fixed grid-cols-3 wrapped the 4th trigger onto a second row. */}
        <TabsList className={`grid w-full ${hasPosts ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {/* Hidden entirely when we hold no image for any post — an empty tab is worse
              than no tab. The CDN only ever mirrored 12 posts per creator, and 54 of
              195 creators have none at all. */}
          {hasPosts && <TabsTrigger value="posts">Posts</TabsTrigger>}
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="quality">Engagement quality</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTabV2 data={data} />
        </TabsContent>
        {hasPosts && (
          <TabsContent value="posts" className="mt-6">
            <PostsTabV2 data={data} />
          </TabsContent>
        )}
        <TabsContent value="content" className="mt-6">
          <ContentTabV2 data={data} />
        </TabsContent>
        <TabsContent value="quality" className="mt-6">
          <QualityTab data={data} />
        </TabsContent>
      </Tabs>

      {data._meta && (
        <p className="text-center text-xs text-muted-foreground">
          Updated {data._meta.updated_at ? new Date(data._meta.updated_at).toLocaleDateString() : "—"}
          {" · "}v{data._meta.pipeline_version}
        </p>
      )}
    </div>
  )
}

/**
 * Engagement quality — from the accounts actually commenting.
 *
 * This is the honest replacement for the deleted "Audience Authenticity 79.8% /
 * Estimated Bot Followers 16.7%" panel, which measured no accounts at all. These
 * numbers describe COMMENTERS, not the audience — the copy says so plainly rather
 * than letting a brand read it as follower demographics.
 */
function QualityTab({ data }: { data: Payload }) {
  const c = data.commenters
  if (!isPresent(c)) return null

  const items = [
    { label: "Low-effort comments", value: c.signals.low_effort_share,
      hint: "Empty or emoji-only. High shares suggest pods or bot traffic." },
    { label: "Numeric-suffix usernames", value: c.signals.numeric_username_share,
      hint: "Names like user8604 — a common throwaway/bot pattern." },
    { label: "No profile photo", value: c.signals.no_avatar_share,
      hint: "Accounts with no avatar." },
  ]

  return (
    <div className="space-y-6">
      <TooltipProvider delayDuration={200}>
        <div className="grid gap-3 sm:grid-cols-3">
          {items.map((i) => (
            <Card key={i.label}>
              <CardContent className="pt-6">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <div className={`text-2xl font-bold tabular-nums ${
                        i.value > 0.5 ? "text-red-600" : i.value > 0.25 ? "text-orange-600" : ""
                      }`}>
                        {Math.round(i.value * 100)}%
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{i.label}</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">{i.hint}</TooltipContent>
                </Tooltip>
              </CardContent>
            </Card>
          ))}
        </div>
      </TooltipProvider>

      {c.top_commenters.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="mb-3 text-sm font-medium">Most frequent commenters</p>
            <div className="flex flex-wrap gap-1.5">
              {c.top_commenters.map((t) => (
                <Badge key={t.username} variant="secondary" className="font-normal">
                  @{t.username}<span className="ml-1 opacity-60">×{t.comments}</span>
                </Badge>
              ))}
            </div>
            {c.repeat_commenter_share != null && (
              <p className="mt-3 text-xs text-muted-foreground">
                {Math.round(c.repeat_commenter_share * 100)}% of commenters appear on 3+ posts.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Head({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
      <p className="text-xs text-muted-foreground">
        {label}{sub && <span className="ml-1 opacity-60">({sub})</span>}
      </p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-4 gap-4 border-t pt-4">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
          </div>
        </CardContent>
      </Card>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
