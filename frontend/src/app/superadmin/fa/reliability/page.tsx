"use client"

// FA creator reliability board — APP creators only (those with real in-app
// deliverables). Shows each creator's computed reliability score + standing and any
// open overdue / missed deliverables, so the team can reach out before it escalates.
// Team-suggested/offline creators never appear here (the team has direct contact).

import { useState, useEffect, useCallback } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AlertTriangle, ShieldCheck, Clock, Instagram, Phone, Loader2, ChevronDown } from "lucide-react"
import { faReliabilityApi } from "@/services/faAdminApi"

interface Overdue {
  id: string
  type: string
  quantity: number
  deadline: string | null
  days_overdue: number | null
  defaulted: boolean
  extension_used: boolean
  campaign_name: string | null
}
interface Creator {
  member_id: string
  full_name: string | null
  instagram_username: string | null
  phone: string | null
  email: string | null
  avatar_url: string | null
  campaigns_participated: number
  reliability_score: number | null
  status: "at_risk" | "reliable" | "good" | "building" | "new"
  is_low: boolean
  open_defaults: number
  defaults: number
  lates: number
  resolved_count: number
  overdue_deliverables: Overdue[]
}

const STATUS_META: Record<Creator["status"], { label: string; cls: string }> = {
  at_risk:  { label: "At risk",       cls: "bg-rose-500/15 text-rose-700 border-rose-300/40" },
  reliable: { label: "Reliable",      cls: "bg-emerald-500/15 text-emerald-700 border-emerald-300/40" },
  good:     { label: "Good standing", cls: "bg-sky-500/15 text-sky-700 border-sky-300/40" },
  building: { label: "Building",      cls: "bg-amber-500/15 text-amber-700 border-amber-300/40" },
  new:      { label: "New",           cls: "bg-slate-500/10 text-slate-600 border-slate-300/40" },
}

const scoreColor = (s: number | null) =>
  s === null ? "text-muted-foreground"
    : s >= 90 ? "text-emerald-600"
    : s >= 70 ? "text-sky-600"
    : s >= 50 ? "text-amber-600"
    : "text-rose-600"

const initials = (name?: string | null, handle?: string | null) =>
  (name || handle || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()

const prettyType = (t: string) => String(t || "content").replace(/^instagram_/, "").replace(/_/g, " ")

export default function FAReliabilityPage() {
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"at_risk" | "all">("at_risk")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [summary, setSummary] = useState<{ total: number; at_risk: number }>({ total: 0, at_risk: 0 })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await faReliabilityApi.list(false)
      const list: Creator[] = res?.data?.creators || []
      setCreators(list)
      setSummary({ total: res?.data?.total || list.length, at_risk: res?.data?.at_risk || list.filter((c) => c.is_low).length })
    } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const shown = tab === "at_risk" ? creators.filter((c) => c.is_low) : creators

  return (
    <AuthGuard requiredRole="admin">
      <SuperAdminInterface>
        <div className="mx-auto w-full max-w-5xl px-4 py-6">
          {/* header */}
          <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Creator reliability</h1>
              <p className="text-sm text-muted-foreground mt-1">
                App creators only — scored on whether they deliver, on time. Reach out before it escalates.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg border bg-card px-3 py-1.5 text-center">
                <div className="text-lg font-semibold leading-none">{summary.total}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">tracked</div>
              </div>
              <div className="rounded-lg border border-rose-300/40 bg-rose-500/10 px-3 py-1.5 text-center">
                <div className="text-lg font-semibold leading-none text-rose-700">{summary.at_risk}</div>
                <div className="text-[11px] text-rose-700/70 mt-0.5">at risk</div>
              </div>
            </div>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mb-4">
            <TabsList>
              <TabsTrigger value="at_risk">At risk {summary.at_risk > 0 ? `· ${summary.at_risk}` : ""}</TabsTrigger>
              <TabsTrigger value="all">All creators</TabsTrigger>
            </TabsList>
          </Tabs>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
            </div>
          ) : shown.length === 0 ? (
            <Card><CardContent className="py-16 text-center text-muted-foreground">
              {tab === "at_risk" ? "No creators at risk. Nice." : "No app creators with deliverables yet."}
            </CardContent></Card>
          ) : (
            <div className="space-y-2.5">
              {shown.map((c) => {
                const sm = STATUS_META[c.status]
                const isOpen = !!expanded[c.member_id]
                return (
                  <Card key={c.member_id} className={c.is_low ? "border-rose-300/40" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11">
                          {c.avatar_url ? <AvatarImage src={c.avatar_url} alt="" /> : null}
                          <AvatarFallback>{initials(c.full_name, c.instagram_username)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{c.full_name || c.instagram_username || "Creator"}</span>
                            <Badge variant="outline" className={sm.cls}>{sm.label}</Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                            {c.instagram_username ? <span className="inline-flex items-center gap-1"><Instagram className="h-3 w-3" />@{c.instagram_username}</span> : null}
                            {c.phone ? <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span> : null}
                            <span>{c.campaigns_participated} campaign{c.campaigns_participated === 1 ? "" : "s"}</span>
                          </div>
                        </div>
                        {/* score */}
                        <div className="text-right shrink-0">
                          <div className={`text-2xl font-semibold leading-none tabular-nums ${scoreColor(c.reliability_score)}`}>
                            {c.reliability_score === null ? "—" : c.reliability_score}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">reliability</div>
                        </div>
                      </div>

                      {/* stat chips */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-3">
                        {c.open_defaults > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 text-rose-700 border border-rose-300/40 px-2 py-0.5 text-xs font-medium">
                            <AlertTriangle className="h-3 w-3" /> {c.open_defaults} open default{c.open_defaults === 1 ? "" : "s"}
                          </span>
                        ) : null}
                        {c.defaults > 0 ? <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{c.defaults} missed / last 10</span> : null}
                        {c.lates > 0 ? <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{c.lates} late / last 10</span> : null}
                        {c.defaults === 0 && c.lates === 0 && c.resolved_count > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-700 border border-emerald-300/40 px-2 py-0.5 text-xs font-medium">
                            <ShieldCheck className="h-3 w-3" /> Spotless
                          </span>
                        ) : null}
                        {c.overdue_deliverables.length > 0 ? (
                          <button
                            onClick={() => setExpanded((e) => ({ ...e, [c.member_id]: !isOpen }))}
                            className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                          >
                            {c.overdue_deliverables.length} overdue
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                          </button>
                        ) : null}
                      </div>

                      {/* overdue detail */}
                      {isOpen && c.overdue_deliverables.length > 0 ? (
                        <div className="mt-3 space-y-1.5 border-t pt-3">
                          {c.overdue_deliverables.map((o) => (
                            <div key={o.id} className="flex items-center justify-between gap-2 text-sm">
                              <div className="flex items-center gap-2 min-w-0">
                                <Clock className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                                <span className="truncate">
                                  <span className="font-medium">{o.quantity}× {prettyType(o.type)}</span>
                                  <span className="text-muted-foreground"> · {o.campaign_name || "Campaign"}</span>
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {o.extension_used ? <span className="text-[11px] text-muted-foreground">extended</span> : null}
                                <Badge variant="outline" className={o.defaulted ? "bg-rose-500/15 text-rose-700 border-rose-300/40" : "bg-amber-500/15 text-amber-700 border-amber-300/40"}>
                                  {o.defaulted ? "Missed" : `${o.days_overdue ?? 0}d overdue`}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
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
