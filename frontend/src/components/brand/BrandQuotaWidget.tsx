"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Target, Loader2 } from "lucide-react"
import { API_CONFIG, getAuthHeaders } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"

interface QuotaData {
  team_id: string
  team_name: string
  contracted_influencers_per_month: number | null
  delivered_this_month: number
  remaining_this_month: number | null
  month_start: string
}

export function BrandQuotaWidget() {
  const [data, setData] = useState<QuotaData | null>(null)
  const [loading, setLoading] = useState(true)
  // A failed read is its own state. It is NOT "no contract configured".
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth(
          `${API_CONFIG.BASE_URL}/api/v1/campaigns/quota-progress`,
          { headers: getAuthHeaders() }
        )
        if (res.ok) {
          const body = await res.json()
          setData(body?.data ?? null)
        } else {
          // There was no `else` here and no `catch` before `finally`, so a 500 left `data`
          // as null and the panel returned null a few lines down — silently identical to
          // "this brand has no contract". The one panel that answers "am I getting what I
          // paid for" disappeared without a word, on a page where CampaignBars handles the
          // same failure correctly and says so.
          setFailed(true)
        }
      } catch {
        setFailed(true)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center min-h-[100px]">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  // A failed read says so, quietly, so it can never be read as "you have no contract".
  if (failed) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm font-medium">We could not load your delivery quota</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This is a display problem. It does not mean you have no contract.
          </p>
        </CardContent>
      </Card>
    )
  }

  // No team / no quota configured → hide entirely so dashboards don't show empty cards.
  if (!data || !data.contracted_influencers_per_month) return null

  const { contracted_influencers_per_month: contracted, delivered_this_month: delivered } = data
  const pct = contracted > 0 ? Math.min(100, Math.round((delivered / contracted) * 100)) : 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-primary" />
          Your Contract Delivery
        </CardTitle>
        <CardDescription className="text-xs">
          Influencers delivered this month ·{" "}
          {new Date(data.month_start).toLocaleDateString("en-AE", { month: "long", year: "numeric" })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-3xl font-semibold tabular-nums">
              {delivered}
              <span className="text-lg text-muted-foreground"> / {contracted}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {data.remaining_this_month != null ? `${data.remaining_this_month} remaining` : "—"}
            </p>
          </div>
          <Badge variant={pct >= 100 ? "default" : "outline"} className="font-medium">
            {pct}%
          </Badge>
        </div>
        <Progress value={pct} className="h-2" />
      </CardContent>
    </Card>
  )
}
