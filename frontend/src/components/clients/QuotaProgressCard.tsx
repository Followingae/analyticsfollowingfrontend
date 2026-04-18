"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Pencil, Loader2, Target, Check, X } from "lucide-react"
import { API_CONFIG, getAuthHeaders } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"
import { toast } from "sonner"

interface QuotaData {
  team_id: string
  team_name: string
  contracted_influencers_per_month: number | null
  delivered_this_month: number
  remaining_this_month: number | null
  month_start: string
  per_campaign: Array<{
    id: string
    name: string
    campaign_type: string
    status: string
    target_influencer_count: number | null
    delivered_count: number
  }>
}

interface Props {
  teamId: string
  /** When true, shows the edit control so admin can set contracted_influencers_per_month. */
  editable?: boolean
}

export function QuotaProgressCard({ teamId, editable = false }: Props) {
  const [data, setData] = useState<QuotaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/admin/clients/${teamId}/quota-progress`,
        { headers: getAuthHeaders() }
      )
      if (!res.ok) throw new Error(await res.text())
      const body = await res.json()
      setData(body?.data ?? null)
    } catch (e: any) {
      toast.error(e.message || "Failed to load quota")
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [teamId])

  const saveContract = async () => {
    const n = draft.trim() === "" ? null : parseInt(draft, 10)
    if (n !== null && (isNaN(n) || n < 0)) {
      toast.error("Enter a positive number or leave blank")
      return
    }
    setSaving(true)
    try {
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/admin/clients/${teamId}`,
        {
          method: "PUT",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ contracted_influencers_per_month: n }),
        }
      )
      if (!res.ok) throw new Error(await res.text())
      toast.success("Contract updated")
      setEditing(false)
      load()
    } catch (e: any) {
      toast.error(e.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center min-h-[120px]">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }
  if (!data) return null

  const contracted = data.contracted_influencers_per_month
  const delivered = data.delivered_this_month
  const pct = contracted && contracted > 0 ? Math.min(100, Math.round((delivered / contracted) * 100)) : 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" />
              Contract Delivery
            </CardTitle>
            <CardDescription className="text-xs">
              Influencers locked in this month ·{" "}
              {new Date(data.month_start).toLocaleDateString("en-AE", { month: "long", year: "numeric" })}
            </CardDescription>
          </div>
          {editable && !editing && (
            <Button variant="outline" size="sm" onClick={() => { setEditing(true); setDraft(contracted ? String(contracted) : "") }}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              {contracted ? "Edit quota" : "Set quota"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="quota-input" className="text-xs">Contracted influencers per month</Label>
              <Input
                id="quota-input"
                type="number"
                min={0}
                placeholder="e.g. 30"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button size="sm" onClick={saveContract} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Check className="h-3.5 w-3.5 mr-1" />Save</>}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : contracted ? (
          <>
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-3xl font-semibold tabular-nums">
                  {delivered}
                  <span className="text-lg text-muted-foreground"> / {contracted}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {data.remaining_this_month != null
                    ? `${data.remaining_this_month} remaining`
                    : "—"}
                </p>
              </div>
              <Badge variant={pct >= 100 ? "default" : "outline"} className="font-medium">
                {pct}%
              </Badge>
            </div>
            <Progress value={pct} className="h-2" />
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">No monthly quota set for this client.</p>
            {editable && (
              <Button size="sm" variant="outline" onClick={() => { setEditing(true); setDraft("") }}>
                Set quota
              </Button>
            )}
          </div>
        )}

        {/* Per-campaign breakdown */}
        {data.per_campaign.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">Per-campaign delivery</p>
            <div className="space-y-1.5 max-h-[180px] overflow-auto">
              {data.per_campaign.slice(0, 10).map((c) => {
                const campPct = c.target_influencer_count && c.target_influencer_count > 0
                  ? Math.min(100, Math.round((c.delivered_count / c.target_influencer_count) * 100))
                  : null
                return (
                  <div key={c.id} className="flex items-center gap-2 text-xs">
                    <div className="flex-1 min-w-0 flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {(c.campaign_type || "influencer").replace("_", " ")}
                      </Badge>
                      <span className="truncate">{c.name}</span>
                    </div>
                    <span className="tabular-nums text-muted-foreground">
                      {c.delivered_count}
                      {c.target_influencer_count != null && c.target_influencer_count > 0 && (
                        <>
                          <span className="text-muted-foreground/60"> / {c.target_influencer_count}</span>
                          <span className="ml-1 text-[10px]">({campPct}%)</span>
                        </>
                      )}
                    </span>
                  </div>
                )
              })}
              {data.per_campaign.length > 10 && (
                <p className="text-[11px] text-muted-foreground">+{data.per_campaign.length - 10} more</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
