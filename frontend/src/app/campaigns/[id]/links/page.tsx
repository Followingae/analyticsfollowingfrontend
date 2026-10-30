"use client"

/**
 * Following Track: which of the brand's creators sent people to buy.
 *
 * NOTHING HERE UNTIL A PERSON RELEASES IT. The server answers `{ released: false }` and nothing
 * else until a superadmin has checked the links are live and the numbers are right, the same
 * rule as published results. The page says so in one calm sentence rather than drawing a row
 * of zeroes that reads as "your campaign sold nothing".
 *
 * The brand's copy carries no set-up: no retailer URLs, no sub-id parameter, no postback, no
 * individual orders. Those are ours.
 */

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react"
import { AuthGuard } from "@/components/AuthGuard"
import { BrandUserInterface } from "@/components/brand/BrandUserInterface"
import { Button } from "@/components/ui/button"
import { CARD } from "@/components/console/primitives"
import {
  ClickBreakdowns, CopyButton, CreatorCell, DailyClicksChart, JourneyFunnel, LinksTotals,
  RetailerCards,
} from "@/components/campaigns/links/LinksResults"
import { cn } from "@/lib/utils"
import { count, money, trackedLinksApi, type BrandLinksReport } from "@/services/trackedLinksApi"

function ClicksAndSales({ campaignId }: { campaignId: string }) {
  const router = useRouter()
  const [data, setData] = useState<BrandLinksReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [failure, setFailure] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await trackedLinksApi.brand(campaignId))
      setFailure(null)
    } catch (e: unknown) {
      setData(null)
      setFailure(e instanceof Error ? e.message : "The request did not complete")
    } finally { setLoading(false) }
  }, [campaignId])

  useEffect(() => { void load() }, [load])

  const report = data && data.released ? data : null
  const currency = report?.totals.currency || "AED"

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <Button variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground"
                onClick={() => router.push(`/campaigns/${campaignId}`)}>
          <ArrowLeft className="h-3.5 w-3.5" /> Campaign
        </Button>
        <h1 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] lg:text-[34px]">
          Following Track
        </h1>
        <p className="text-[17px] font-medium">Clicks and sales from your creators</p>
        <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Every creator has their own link to each retailer. Each tap is counted, and each sale
          the retailer reports back is credited to the creator who sent it.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : failure ? (
        <div className="py-20 text-center">
          <p className="text-[16px]">Could not load your clicks and sales</p>
          <p className="mt-2 text-[13.5px] text-muted-foreground">
            Nothing is missing. We just could not read it.
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={load}>
            <RefreshCw className="mr-1.5 h-4 w-4" /> Try again
          </Button>
        </div>
      ) : !report ? (
        <p className="py-16 text-center text-[15px] text-muted-foreground">
          Clicks and sales appear here once your campaign&apos;s links are live and checked.
        </p>
      ) : (
        <div className="space-y-8">
          <LinksTotals totals={report.totals} />
          <JourneyFunnel funnel={report.funnel} uniqueClicks={report.totals.unique_clicks} />
          <DailyClicksChart daily={report.daily} />
          {report.by_retailer.length > 1 && (
            <RetailerCards retailers={report.by_retailer} currency={currency} />
          )}
          <ClickBreakdowns byCountry={report.by_country} byDevice={report.by_device}
                           byApp={report.by_app} />

          {report.creators.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-[18px] font-semibold">By creator</h2>
              <div className={cn(CARD, "overflow-x-auto bg-card")}>
                <table className="w-full min-w-[760px] text-[13.5px]">
                  <thead>
                    <tr className="border-b text-left text-[12px] text-muted-foreground">
                      <th className="px-4 py-2.5 font-medium">Creator</th>
                      <th className="px-3 py-2.5 font-medium">Retailer</th>
                      <th className="px-3 py-2.5 font-medium">Link</th>
                      <th className="px-3 py-2.5 font-medium">Code</th>
                      <th className="px-3 py-2.5 text-right font-medium">Clicks</th>
                      <th className="px-3 py-2.5 text-right font-medium">Unique</th>
                      <th className="px-3 py-2.5 text-right font-medium">Sales</th>
                      <th className="px-4 py-2.5 text-right font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.creators.map((c) => (
                      <tr key={c.short_url} className="border-b last:border-0">
                        <td className="px-4 py-2.5">
                          <CreatorCell username={c.username} fullName={c.full_name} pic={c.profile_pic_url} />
                        </td>
                        <td className="px-3 py-2.5">{c.retailer}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[12.5px]">
                              {c.short_url.replace(/^https?:\/\//, "")}
                            </span>
                            <CopyButton text={c.short_url} />
                          </div>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[12.5px]">{c.discount_code}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{count(c.clicks)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{count(c.unique_clicks)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{count(c.sales)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {c.revenue_cents ? money(c.revenue_cents, currency) : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

export default function CampaignLinksPage() {
  const campaignId = useParams().id as string
  return (
    <AuthGuard>
      <BrandUserInterface>
        {campaignId ? <ClicksAndSales campaignId={campaignId} /> : null}
      </BrandUserInterface>
    </AuthGuard>
  )
}
