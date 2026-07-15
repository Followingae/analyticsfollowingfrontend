"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Loader2, ClipboardList, ExternalLink } from "lucide-react"
import Link from "next/link"
import { faCampaignApi } from "@/services/faAdminApi"
import { toast } from "sonner"

interface FunnelCreator {
  participant_id: string
  member_id: string | null
  offline: boolean
  handle: string | null
  full_name: string | null
  avatar_url: string | null
  followers_count: number | null
  participation_type: string | null
  source: string | null
  status: string
  bucket: string
  joined_at: string | null
  brand_rejection_reason: string | null
  deliverables: Record<string, number> & { total: number }
}

// Funnel order = lifecycle order. One creator lands in exactly one bucket (computed
// by the backend), so the counts read as a real funnel.
const BUCKETS: { key: string; label: string; cls: string }[] = [
  { key: "applied", label: "Applied", cls: "bg-slate-500/10 text-slate-600 border-slate-300/40" },
  { key: "enrolled", label: "Enrolled · content pending", cls: "bg-blue-500/10 text-blue-600 border-blue-300/40" },
  { key: "content_review", label: "Content review", cls: "bg-amber-500/15 text-amber-700 border-amber-300/40" },
  { key: "revision_requested", label: "Edit requested", cls: "bg-orange-500/15 text-orange-700 border-orange-300/40" },
  { key: "content_approved", label: "Approved · awaiting post", cls: "bg-sky-500/15 text-sky-700 border-sky-300/40" },
  { key: "proof_submitted", label: "Proof submitted", cls: "bg-violet-500/15 text-violet-700 border-violet-300/40" },
  { key: "completed", label: "Completed", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-300/40" },
  { key: "rejected", label: "Rejected", cls: "bg-rose-500/15 text-rose-700 border-rose-300/40" },
]

const DELIVERABLE_CHIP_LABELS: Record<string, string> = {
  pending: "pending",
  content_review: "in review",
  revision_requested: "edit requested",
  content_approved: "awaiting post",
  proof_submitted: "proof in",
  verified: "verified",
  rejected: "rejected",
}

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-AE", { month: "short", day: "numeric" }) : "—"

const fmtFollowers = (n?: number | null) =>
  n == null ? null : n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : `${n}`

export default function FACampaignFunnelPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [campaign, setCampaign] = useState<any>(null)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [creators, setCreators] = useState<FunnelCreator[]>([])
  const [bucket, setBucket] = useState<string>("all")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await faCampaignApi.funnel(id)
      const d = res?.data
      setCampaign(d?.campaign ?? null)
      setCounts(d?.counts ?? {})
      setCreators(Array.isArray(d?.creators) ? d.creators : [])
    } catch {
      toast.error("Failed to load campaign funnel")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const visible = useMemo(
    () => (bucket === "all" ? creators : creators.filter((c) => c.bucket === bucket)),
    [creators, bucket],
  )

  return (
    <AuthGuard requiredRole="admin">
      <SuperAdminInterface>
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Button size="sm" variant="ghost" onClick={() => router.push("/superadmin/fa/campaigns")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold truncate">{campaign?.name || "Campaign"}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {campaign?.campaign_type && <Badge variant="outline" className="text-[10px]">{campaign.campaign_type}</Badge>}
                  {campaign?.status && <Badge variant={campaign.status === "active" ? "default" : "secondary"} className="text-[10px]">{campaign.status}</Badge>}
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{creators.length}{campaign?.max_participants ? ` / ${campaign.max_participants}` : ""} creators</span>
                </div>
              </div>
            </div>
            <Link href="/superadmin/fa/deliverables">
              <Button size="sm" variant="outline"><ClipboardList className="h-4 w-4 mr-1.5" />All deliverables</Button>
            </Link>
          </div>

          {/* Funnel strip — click a stage to filter the list below */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {BUCKETS.map((b) => {
              const n = counts[b.key] ?? 0
              const active = bucket === b.key
              return (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => setBucket(active ? "all" : b.key)}
                  className={`rounded-lg border p-3 text-left transition-colors ${active ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                >
                  <p className="text-2xl font-semibold leading-none">{n}</p>
                  <p className="text-[11px] text-muted-foreground mt-1.5 leading-tight">{b.label}</p>
                </button>
              )
            })}
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : visible.length === 0 ? (
            <Card><CardContent className="text-center py-12">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {bucket === "all" ? "No creators in this campaign yet" : `No creators in “${BUCKETS.find((b) => b.key === bucket)?.label}”`}
              </p>
            </CardContent></Card>
          ) : (
            <div className="space-y-2">
              {visible.map((c) => {
                const meta = BUCKETS.find((b) => b.key === c.bucket) ?? BUCKETS[0]
                const chips = Object.entries(c.deliverables)
                  .filter(([k, v]) => k !== "total" && (v as number) > 0)
                  .map(([k, v]) => `${v} ${DELIVERABLE_CHIP_LABELS[k] ?? k}`)
                return (
                  <Card key={c.participant_id}>
                    <CardContent className="p-3.5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {c.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                            {(c.handle || c.full_name || "?").replace(/^@/, "").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            {c.handle ? (
                              <a
                                href={`https://instagram.com/${c.handle}`}
                                target="_blank" rel="noopener noreferrer"
                                className="font-medium truncate hover:underline inline-flex items-center gap-1"
                              >
                                @{c.handle}<ExternalLink className="h-3 w-3 text-muted-foreground" />
                              </a>
                            ) : (
                              <span className="font-medium truncate">{c.full_name || "Creator"}</span>
                            )}
                            {c.offline && <Badge variant="outline" className="text-[10px]">offline · team managed</Badge>}
                            {c.source === "team_suggested" && <Badge variant="outline" className="text-[10px]">team suggested</Badge>}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                            {c.full_name && c.handle && <span className="truncate">{c.full_name}</span>}
                            {fmtFollowers(c.followers_count) && <span>· {fmtFollowers(c.followers_count)} followers</span>}
                            <span>· joined {fmtDate(c.joined_at)}</span>
                            {chips.length > 0 && <span>· {chips.join(" · ")}</span>}
                          </div>
                          {c.bucket === "rejected" && c.brand_rejection_reason && (
                            <p className="text-[11px] text-rose-600 italic truncate max-w-[420px] mt-0.5">“{c.brand_rejection_reason}”</p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${meta.cls}`}>{meta.label}</Badge>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
