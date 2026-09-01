"use client"

// FA creator reliability board — APP creators only (those with real in-app
// deliverables). Shows each creator's computed reliability score + standing and any
// open overdue / missed deliverables, so the team can reach out before it escalates.
// Team-suggested/offline creators never appear here (the team has direct contact).

import { useState, useEffect, useCallback } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AlertTriangle, ShieldCheck, Clock, Instagram, Phone, ChevronDown } from "lucide-react"
import { PageHead, Stat, StatGrid } from "@/components/console/primitives"
import {
  FaPage, Failed, Loading, Nothing, TONE_BADGE, TONE_TEXT, figure, type Tone,
} from "../_ui"
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

/* Five standings, five hand-picked palette families: rose, emerald, sky, amber, slate.
   They are the console's tones now, so "at risk" here is the same rose as a missed
   deadline anywhere else, and the word is always beside the colour. */
const STATUS_META: Record<Creator["status"], { label: string; tone: Tone }> = {
  at_risk: { label: "At risk", tone: "bad" },
  reliable: { label: "Reliable", tone: "good" },
  good: { label: "Good standing", tone: "info" },
  building: { label: "Building", tone: "warn" },
  new: { label: "New", tone: "neutral" },
}

const scoreTone = (s: number | null): Tone =>
  s === null ? "neutral" : s >= 90 ? "good" : s >= 70 ? "info" : s >= 50 ? "warn" : "bad"

const initials = (name?: string | null, handle?: string | null) =>
  (name || handle || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()

const prettyType = (t: string) => String(t || "content").replace(/^instagram_/, "").replace(/_/g, " ")

export default function FAReliabilityPage() {
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  /**
   * Whether the board actually answered.
   *
   * `load` had a `finally` and no `catch`, so a failed request threw, left `creators` at
   * [] and `summary` at its {0, 0} initial, and the screen rendered "0 tracked", "0 at
   * risk" and the words "No creators at risk. Nice." over a 500. That is the worst
   * variant of the bug: a reliability board whose entire job is to raise a flag, showing
   * none, confidently, because it never managed to ask.
   */
  const [error, setError] = useState(false)
  const [tab, setTab] = useState<"at_risk" | "all">("at_risk")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [summary, setSummary] = useState<{ total: number | null; at_risk: number | null }>({
    total: null, at_risk: null,
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await faReliabilityApi.list(false)
      const list: Creator[] = res?.data?.creators || []
      setCreators(list)
      setSummary({
        total: res?.data?.total ?? list.length,
        at_risk: res?.data?.at_risk ?? list.filter((c) => c.is_low).length,
      })
    } catch {
      setError(true)
      setSummary({ total: null, at_risk: null })
    } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const shown = tab === "at_risk" ? creators.filter((c) => c.is_low) : creators

  return (
    <AuthGuard requireAdmin={true}>
      <SuperAdminInterface>
        <FaPage className="mx-auto w-full max-w-5xl">
          <PageHead
            title="Creator reliability"
            sub="App creators only, scored on whether they deliver and whether they deliver on time. The point of the board is to reach somebody before a deadline turns into a default."
          />

          {/* Two figures, given the room the bordered pills were using. A count that never
              arrived is a dash: "nobody is at risk" and "we could not check" must not read
              the same on this screen. */}
          <StatGrid cols={3}>
            <Stat label="Creators tracked" value={figure(summary.total)}
                  hint="Everyone with a real in-app deliverable" />
            <Stat label="At risk" value={figure(summary.at_risk)}
                  tone={summary.at_risk ? "bad" : "neutral"}
                  hint="Worth a message today" />
          </StatGrid>

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList>
              <TabsTrigger value="at_risk">At risk{summary.at_risk ? ` · ${summary.at_risk}` : ""}</TabsTrigger>
              <TabsTrigger value="all">Everyone</TabsTrigger>
            </TabsList>
          </Tabs>

          {loading ? (
            <Loading label="Loading the board" />
          ) : error ? (
            <Failed what="the reliability board" onRetry={load} />
          ) : shown.length === 0 ? (
            <Nothing>
              {tab === "at_risk"
                ? "Nobody is at risk right now."
                : "No app creator has a deliverable yet."}
            </Nothing>
          ) : (
            /* Was a Card per creator: a border and a shadow around every person, so a list
               of thirty put sixty edges between the first name and the last. It is a list,
               so it is drawn as one. Every field the card carried is still on the row. */
            <div className="divide-y divide-black/[0.06] dark:divide-white/[0.07]">
              {shown.map((c) => {
                const sm = STATUS_META[c.status]
                const isOpen = !!expanded[c.member_id]
                return (
                  <div key={c.member_id} className="py-ds-3">
                    <div className="flex items-center gap-ds-3">
                      <Avatar className="h-11 w-11">
                        {c.avatar_url ? <AvatarImage src={c.avatar_url} alt="" /> : null}
                        <AvatarFallback>{initials(c.full_name, c.instagram_username)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">{c.full_name || c.instagram_username || "Creator"}</span>
                          <Badge variant="outline" className={TONE_BADGE[sm.tone]}>{sm.label}</Badge>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          {c.instagram_username ? <span className="inline-flex items-center gap-1"><Instagram className="h-3 w-3" />@{c.instagram_username}</span> : null}
                          {c.phone ? <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span> : null}
                          <span>{c.campaigns_participated} campaign{c.campaigns_participated === 1 ? "" : "s"}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className={`text-2xl font-semibold leading-none tabular-nums ${TONE_TEXT[scoreTone(c.reliability_score)]}`}>
                          {c.reliability_score === null ? "—" : c.reliability_score}
                        </div>
                        <div className="mt-0.5 text-ds-caption text-muted-foreground">reliability</div>
                      </div>
                    </div>

                    {/* What is actually on their record */}
                    <div className="mt-ds-2 flex flex-wrap items-center gap-1.5">
                      {c.open_defaults > 0 ? (
                        <span className={`inline-flex items-center gap-1 rounded-ds-xs px-2 py-0.5 text-xs font-medium ${TONE_BADGE.bad}`}>
                          <AlertTriangle className="h-3 w-3" /> {c.open_defaults} open default{c.open_defaults === 1 ? "" : "s"}
                        </span>
                      ) : null}
                      {c.defaults > 0 ? <span className={`rounded-ds-xs px-2 py-0.5 text-xs ${TONE_BADGE.neutral}`}>{c.defaults} missed of the last 10</span> : null}
                      {c.lates > 0 ? <span className={`rounded-ds-xs px-2 py-0.5 text-xs ${TONE_BADGE.neutral}`}>{c.lates} late of the last 10</span> : null}
                      {c.defaults === 0 && c.lates === 0 && c.resolved_count > 0 ? (
                        <span className={`inline-flex items-center gap-1 rounded-ds-xs px-2 py-0.5 text-xs font-medium ${TONE_BADGE.good}`}>
                          <ShieldCheck className="h-3 w-3" /> Spotless
                        </span>
                      ) : null}
                      {c.overdue_deliverables.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setExpanded((e) => ({ ...e, [c.member_id]: !isOpen }))}
                          className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                        >
                          {c.overdue_deliverables.length} overdue
                          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </button>
                      ) : null}
                    </div>

                    {isOpen && c.overdue_deliverables.length > 0 ? (
                      <div className="mt-ds-2 space-y-1.5 border-t border-black/[0.06] pt-ds-2 dark:border-white/[0.07]">
                        {c.overdue_deliverables.map((o) => (
                          <div key={o.id} className="flex items-center justify-between gap-2 text-sm">
                            <div className="flex min-w-0 items-center gap-2">
                              <Clock className={`h-3.5 w-3.5 shrink-0 ${TONE_TEXT.bad}`} />
                              <span className="truncate">
                                <span className="font-medium">{o.quantity}× {prettyType(o.type)}</span>
                                <span className="text-muted-foreground"> · {o.campaign_name || "Campaign"}</span>
                              </span>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              {o.extension_used ? <span className="text-ds-caption text-muted-foreground">extended once</span> : null}
                              <Badge variant="outline" className={o.defaulted ? TONE_BADGE.bad : TONE_BADGE.warn}>
                                {o.defaulted ? "Missed" : `${o.days_overdue ?? 0}d overdue`}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </FaPage>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
