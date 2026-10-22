"use client"

/**
 * What we have measured about this creator, on every platform we hold.
 *
 * This tab used to read the handful of averages copied onto the creator's database row (one
 * engagement figure, "typical" likes and comments, a tone score) while a brand looking at
 * the same creator on a proposal got the full measured panel. Our own team was shown the
 * thinner and, for creators who hide likes, the wrong picture. It now renders exactly the
 * panel the brand sees, from the same measurement, plus what only we should see: the size
 * band even when it is unflattering, the run status, and the buttons to measure again.
 *
 * A creator we have not measured says so once, in words, with no figures.
 */
import { useCallback, useEffect, useState } from "react"
import { ExternalLink, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { MasterInfluencer } from "@/types/influencerDatabase"
import { creatorAnalyticsV2Api, NotAnalysedError } from "@/services/creatorAnalyticsV2Api"
import { creatorPackagesApi, type PlatformAnalyticsRow } from "@/services/creatorPackagesApi"
import { InstagramPanel, StandingChip, measuredFromV2, type InstagramMeasured } from "@/components/proposals/plan/InstagramPanel"
import { PlatformPanel } from "@/components/proposals/plan/PlatformPanel"
import { PlatformIcon } from "@/components/icons/PlatformIcon"
import { PLATFORM_LABEL, platformsOfCreator, type Platform } from "@/lib/deliverables"

interface InfluencerAnalyticsTabProps {
  influencer: MasterInfluencer
  onRefresh: () => void
}

const when = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null

const STATUS_WORDS: Record<PlatformAnalyticsRow["status"], string> = {
  queued: "Waiting to be measured",
  running: "Being measured now",
  complete: "Measured",
  partial: "Measured, with some parts missing",
  no_content: "No videos we could read on this account",
  failed: "The last attempt failed",
  unavailable: "We could not read this account",
}

export function InfluencerAnalyticsTab({ influencer, onRefresh }: InfluencerAnalyticsTabProps) {
  const [tab, setTab] = useState<Platform>("instagram")
  const [ig, setIg] = useState<InstagramMeasured | null>(null)
  const [igAt, setIgAt] = useState<string | null>(null)
  const [igState, setIgState] = useState<"loading" | "ok" | "none" | "error">("loading")
  const [others, setOthers] = useState<Partial<Record<"tiktok" | "youtube", PlatformAnalyticsRow>>>({})
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIgState("loading")
    creatorAnalyticsV2Api.get(influencer.username)
      .then((p: any) => {
        setIg(measuredFromV2(p))
        setIgAt(p?.collected_at ?? p?._provenance?.collected_at ?? null)
        setIgState("ok")
      })
      .catch((e) => setIgState(e instanceof NotAnalysedError ? "none" : "error"))
    creatorPackagesApi.platformAnalytics(influencer.id)
      .then((r) => setOthers(r.data.platforms || {}))
      .catch(() => setOthers({}))
  }, [influencer.id, influencer.username])

  useEffect(() => { setTab("instagram"); load() }, [load])

  // While a TikTok or YouTube run is in flight, look again every few seconds.
  useEffect(() => {
    const live = Object.values(others).some((r) => r && (r.status === "queued" || r.status === "running"))
    if (!live) return
    const t = setTimeout(() => {
      creatorPackagesApi.platformAnalytics(influencer.id).then((r) => setOthers(r.data.platforms || {})).catch(() => {})
    }, 6000)
    return () => clearTimeout(t)
  }, [others, influencer.id])

  const tabs = platformsOfCreator(influencer)

  async function measure(platform: "tiktok" | "youtube") {
    setBusy(platform)
    try {
      await creatorPackagesApi.refreshPlatform(influencer.id, platform)
      toast.success(`Measuring their ${PLATFORM_LABEL[platform]}. It takes a minute or two.`)
      setOthers((o) => ({ ...o, [platform]: { ...(o[platform] as PlatformAnalyticsRow), status: "queued" } }))
    } catch (e) {
      toast.error((e as Error).message || "Could not start it")
    } finally {
      setBusy(null)
    }
  }

  const row = tab !== "instagram" ? others[tab] : undefined

  return (
    <div className="flex max-w-[720px] flex-col gap-ds-4">
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

      {tab === "instagram" && (
        <>
          {igState === "loading" && (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading their analytics</div>
          )}
          {igState === "none" && (
            <p className="py-6 text-ds-body text-muted-foreground">We have not measured their Instagram yet.</p>
          )}
          {igState === "error" && (
            <p className="py-6 text-ds-body text-muted-foreground">Their analytics could not be loaded. Try again in a moment.</p>
          )}
          {igState === "ok" && (
            <>
              {(ig?.standing || ig?.category) && (
                <div className="flex flex-wrap gap-2">
                  <StandingChip standing={ig?.standing} internal />
                  {ig?.category && <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">{ig.category}</span>}
                </div>
              )}
              {ig
                ? <InstagramPanel m={ig} followers={influencer.followers_count} />
                : <p className="text-ds-body text-muted-foreground">Their profile was read, but no posts we could measure.</p>}
            </>
          )}
          <div className="flex flex-wrap items-center justify-between gap-ds-2 border-t pt-ds-3">
            <span className="text-ds-caption text-muted-foreground">
              {igAt || influencer.last_analytics_refresh ? `Last measured ${when(igAt || influencer.last_analytics_refresh)}` : "Never measured"}
            </span>
            <span className="flex flex-wrap gap-ds-2">
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />Pull the latest analytics
              </Button>
              {igState === "ok" && (
                <Button size="sm" asChild>
                  <a href={`/creator-analytics/${influencer.username}`} target="_blank" rel="noopener noreferrer">
                    Open full analytics<ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                  </a>
                </Button>
              )}
            </span>
          </div>
        </>
      )}

      {tab !== "instagram" && (
        <>
          {row?.payload && (row.status === "complete" || row.status === "partial") ? (
            <PlatformPanel data={row.payload} />
          ) : (
            <div className="flex flex-col gap-ds-1 py-6">
              <p className="text-ds-body">
                {row ? STATUS_WORDS[row.status] : `We have not measured their ${PLATFORM_LABEL[tab]} yet.`}
              </p>
              {row?.error && <p className="text-ds-caption text-muted-foreground">{row.error}</p>}
              {row && (row.status === "queued" || row.status === "running") && (
                <p className="flex items-center gap-1.5 text-ds-caption text-muted-foreground"><Loader2 className="size-3 animate-spin" />This page updates by itself.</p>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-ds-2 border-t pt-ds-3">
            <span className="text-ds-caption text-muted-foreground">
              {row?.collected_at ? `Last measured ${when(row.collected_at)}` : "Never measured"}
            </span>
            <Button variant="outline" size="sm" disabled={busy === tab || row?.status === "queued" || row?.status === "running"}
                    onClick={() => measure(tab as "tiktok" | "youtube")}>
              {busy === tab ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
              Measure their {PLATFORM_LABEL[tab]} again
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
