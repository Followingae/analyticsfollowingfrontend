"use client"

/**
 * ScoutOutreach: Following's outreach teammate, on one page.
 *
 * Its goals (RELEVANT applicants per roster, 4x what the brand needs; new creators per
 * category and market), what it is doing right now, and everyone it has found. Founders set
 * goals and start light analytics; everyone on the talent side can watch it work.
 */
import * as React from "react"
import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { ArrowRight, CheckCircle2, Database, Loader2, Pause, Play, Plus, Send, Sparkles, Target, Users, Wand2 } from "lucide-react"
import { toast } from "sonner"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ScoutAvatar } from "@/components/roster/ScoutAvatar"
import { CampaignsTable } from "@/components/scout/CampaignsTable"
import { CreatorSheet } from "@/components/scout/CreatorSheet"
import { NetworkBrowser } from "@/components/scout/NetworkBrowser"
import { PeopleTable } from "@/components/scout/PeopleTable"
import { ScoutBotCard } from "@/components/scout/ScoutBotCard"
import { eventText } from "@/components/scout/scoutText"
import { useAdminAccess } from "@/hooks/useAdminAccess"
import { imdListsApi, type ImdListSummary } from "@/services/imdListsApi"
import { scoutApi, type ScoutCampaignsData, type ScoutEvent, type ScoutGoal, type ScoutOverview } from "@/services/scoutApi"

const CATS = ["food", "beauty", "lifestyle", "fashion", "family", "fitness", "travel", "tech", "luxury", "automotive", "entertainment"]
const MARKETS: [string, string][] = [["AE", "UAE"], ["SA", "Saudi Arabia"], ["QA", "Qatar"], ["KW", "Kuwait"], ["BH", "Bahrain"], ["OM", "Oman"]]

function ago(t: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(t).getTime()) / 1000))
  return s < 60 ? `${s}s` : s < 3600 ? `${Math.round(s / 60)}m` : s < 86400 ? `${Math.round(s / 3600)}h` : `${Math.round(s / 86400)}d`
}

type Tab = "overview" | "campaigns" | "general" | "network"
const TABS: Tab[] = ["overview", "campaigns", "general", "network"]

const GENERAL_STEPS: [string, string][] = [["contacted", "Contacted"], ["clicked", "Clicked"], ["joined_app", "Joined app"], ["in_database", "In database"]]

function Ring({ value, target, size = 92 }: { value: number; target: number; size?: number }) {
  const pct = Math.min(1, target ? value / target : 0)
  const r = (size - 10) / 2, c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={8} />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#c8f000" strokeWidth={8} strokeLinecap="round"
                     strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - pct) }}
                     transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
    </svg>
  )
}

function GoalCard({ g, canEdit, onChanged }: { g: ScoutGoal; canEdit: boolean; onChanged: () => void }) {
  const title = g.scope === "roster" ? (g.brand || g.list_name || "Roster")
    : [g.category && g.category[0].toUpperCase() + g.category.slice(1), MARKETS.find(m => m[0] === g.market)?.[1]].filter(Boolean).join(", ") || "Network"
  const unit = g.metric === "relevant_applicants" ? "relevant applicants" : g.metric === "new_creators" ? "new creators"
    : g.metric === "contacted" ? "contacted" : "light analysed"
  const toggle = async () => {
    try { await scoutApi.setGoal(g.id, g.status === "active" ? "paused" : "active"); onChanged() }
    catch (e) { toast.error((e as Error).message) }
  }
  return (
    <div className="flex items-center gap-5 rounded-2xl border bg-background p-5">
      <div className="relative">
        <Ring value={g.progress} target={g.target} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold tabular-nums">{g.progress}</span>
          <span className="text-[11px] text-muted-foreground">of {g.target}</span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{g.scope === "roster" ? `Roster · round ${g.round_no}` : "Network"}</p>
        <p className="truncate text-lg font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{unit}</p>
        <div className="mt-2 flex items-center gap-2">
          {g.status === "done" ? <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />Done</span>
            : g.status === "paused" ? <span className="text-xs text-amber-600">Paused</span>
            : <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#9bd400]" />Working</span>}
          {g.list_id && <Link href={`/work/areas/${g.list_id}`} className="text-xs underline-offset-2 hover:underline">Open roster</Link>}
          {canEdit && g.status !== "done" && (
            <button type="button" onClick={toggle} className="ml-auto inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs hover:border-foreground/40">
              {g.status === "active" ? <><Pause className="h-3 w-3" />Pause</> : <><Play className="h-3 w-3" />Resume</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function NewGoal({ onDone }: { onDone: () => void }) {
  const [scope, setScope] = useState<"roster" | "network">("roster")
  const [lists, setLists] = useState<ImdListSummary[]>([])
  const [listId, setListId] = useState("")
  const [target, setTarget] = useState("")
  const [category, setCategory] = useState("food")
  const [market, setMarket] = useState("AE")
  const [busy, setBusy] = useState(false)
  useEffect(() => { imdListsApi.list({ kind: "client" }).then(r => setLists(r.data.lists || [])).catch(() => {}) }, [])
  const save = async () => {
    setBusy(true)
    try {
      const r = await scoutApi.createGoal(scope === "roster"
        ? { scope, list_id: listId, target: target ? Number(target) : undefined }
        : { scope, category, market, metric: "new_creators", target: Number(target) })
      toast.success(`Goal set: ${r.data.target}`)
      setTarget(""); onDone()
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-dashed p-5">
      <div className="flex gap-2">
        {([["roster", "For a roster"], ["network", "Grow the network"]] as const).map(([k, l]) => (
          <button key={k} type="button" onClick={() => setScope(k)}
                  className={`rounded-full border px-3 py-1.5 text-xs ${scope === k ? "border-foreground bg-foreground text-background" : ""}`}>{l}</button>
        ))}
      </div>
      {scope === "roster" ? (
        <>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={listId} onChange={e => setListId(e.target.value)}>
            <option value="">Pick a roster</option>
            {lists.map(l => <option key={l.id} value={l.id}>{l.team_name || l.name}{l.team_name && l.name !== l.team_name ? `: ${l.name}` : ""}</option>)}
          </select>
          <Input inputMode="numeric" placeholder="Relevant applicants (leave empty for 4x the brief)" value={target}
                 onChange={e => setTarget(e.target.value.replace(/\D/g, ""))} />
        </>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <select className="h-10 rounded-md border bg-background px-3 text-sm capitalize" value={category} onChange={e => setCategory(e.target.value)}>
            {CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={market} onChange={e => setMarket(e.target.value)}>
            {MARKETS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <Input inputMode="numeric" placeholder="New creators" value={target} onChange={e => setTarget(e.target.value.replace(/\D/g, ""))} />
        </div>
      )}
      <Button className="self-start gap-1.5 rounded-full bg-[#d3ff02] text-[#111] hover:bg-[#c4ef00]" disabled={busy || (scope === "roster" ? !listId : !target)}
              onClick={save}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}Set goal</Button>
    </div>
  )
}

function LightLauncher({ contacts, onStarted }: { contacts: number | null; onStarted: () => void }) {
  const [handles, setHandles] = useState("")
  const [seeds, setSeeds] = useState("")
  const [busy, setBusy] = useState<string | null>(null)
  const go = async (source: "contacts" | "app" | "handles" | "lookalikes") => {
    setBusy(source)
    try {
      const r = await scoutApi.light({
        source,
        handles: source === "handles" ? handles.split(/[\s,]+/).filter(Boolean) : undefined,
        seeds: source === "lookalikes" ? seeds.split(/[\s,]+/).filter(Boolean) : undefined,
      })
      toast.success(`Light analytics started on ${r.data.queued} creators`, { description: `Capped at $${r.data.cap_usd}. Watch them arrive in the feed.` })
      setHandles(""); onStarted()
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(null) }
  }
  const B = ({ id, children }: { id: "contacts" | "app" | "handles" | "lookalikes"; children: React.ReactNode }) => (
    <Button size="sm" variant="outline" className="gap-1.5 rounded-full" disabled={!!busy} onClick={() => go(id)}>
      {busy === id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}{children}
    </Button>
  )
  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-background p-5">
      <div>
        <p className="font-semibold">Light analytics</p>
        <p className="text-sm text-muted-foreground">One profile read per creator, under a cent each: followers, engagement, city, categories, language, email. Only legit creators are kept.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <B id="contacts">My WhatsApp contacts{contacts ? ` (${contacts.toLocaleString()})` : ""}</B>
        <B id="app">App creators</B>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Input placeholder="Look-alikes of: @maiarrar, @fattumreviews" value={seeds} onChange={e => setSeeds(e.target.value)} />
        <B id="lookalikes">Find look-alikes</B>
      </div>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Textarea rows={2} placeholder="Or paste handles, one per line" value={handles} onChange={e => setHandles(e.target.value)} />
        <B id="handles">Analyse these</B>
      </div>
    </div>
  )
}

function GeneralFunnel({ g }: { g: ScoutCampaignsData["general"] }) {
  const values: Record<string, number> = g.funnel
  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-background p-5 md:flex-row md:items-center">
      <div className="flex flex-1 flex-wrap items-center gap-2 md:flex-nowrap">
        {GENERAL_STEPS.map(([k, l], i) => (
          <React.Fragment key={k}>
            {i > 0 && <ArrowRight className="hidden h-4 w-4 shrink-0 text-muted-foreground md:block" />}
            <div className="min-w-[120px] flex-1 rounded-xl bg-muted/40 px-4 py-3">
              <motion.p key={values[k]} initial={{ opacity: 0.4, y: 3 }} animate={{ opacity: 1, y: 0 }}
                        className="text-2xl font-semibold tabular-nums">{(values[k] || 0).toLocaleString()}</motion.p>
              <p className="text-xs text-muted-foreground">{l}</p>
            </div>
          </React.Fragment>
        ))}
      </div>
      {g.queue > 0 && (
        <div className="flex items-center gap-2 text-sm md:border-l md:pl-5">
          <Send className="h-4 w-4 text-muted-foreground" />
          <span><span className="font-semibold tabular-nums">{g.queue.toLocaleString()}</span> <span className="text-muted-foreground">waiting for the bot</span></span>
        </div>
      )}
    </div>
  )
}

export default function ScoutPageWrapper() {
  return <Suspense fallback={null}><ScoutPage /></Suspense>
}

function ScoutPage() {
  const { canDestroy } = useAdminAccess()
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const rawTab = params.get("tab") as Tab | null
  const tab: Tab = rawTab && TABS.includes(rawTab) ? rawTab : "overview"
  const list = params.get("list")
  const creator = params.get("creator")
  // Tab, open campaign and open creator live in the URL, so any view can be linked to.
  const setParams = useCallback((patch: Record<string, string | null>) => {
    const p = new URLSearchParams(params.toString())
    Object.entries(patch).forEach(([k, v]) => { if (v) p.set(k, v); else p.delete(k) })
    const qs = p.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [params, pathname, router])
  const openCreator = useCallback((u: string) => setParams({ creator: u }), [setParams])

  const [camps, setCamps] = useState<ScoutCampaignsData | null>(null)
  const loadCamps = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return
    try { setCamps((await scoutApi.campaigns()).data) } catch { /* next tick */ }
  }, [])
  // Campaigns feed the tabs and every "DM about" picker: live while on Campaigns or General, once otherwise.
  useEffect(() => {
    loadCamps()
    if (tab !== "campaigns" && tab !== "general") return
    const t = setInterval(loadCamps, 10000)
    return () => clearInterval(t)
  }, [tab, loadCamps])

  const [data, setData] = useState<ScoutOverview | null>(null)
  const [events, setEvents] = useState<ScoutEvent[]>([])
  const [adding, setAdding] = useState(false)
  const lastId = useRef<number | undefined>(undefined)

  const load = useCallback(async () => {
    try {
      const r = await scoutApi.overview()
      setData(r.data)
      setEvents(r.data.events)
      lastId.current = r.data.events[0]?.id
    } catch (e) { toast.error((e as Error).message) }
  }, [])
  useEffect(() => { load() }, [load])
  // The live feed: new steps slide in as ScoutOutreach takes them.
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const r = await scoutApi.events(lastId.current)
        if (r.data.events.length) {
          lastId.current = r.data.events[0].id
          setEvents(prev => [...r.data.events, ...prev].slice(0, 120))
        }
      } catch { /* the next tick tries again */ }
    }, 4000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => { const t = setInterval(load, 60000); return () => clearInterval(t) }, [load])

  const now = events[0]
  const c = data?.counts || {}
  const stats: [string, number | undefined][] = [
    ["Light analysed today", c.light_today], ["Contacted today", c.contacted_today],
    ["Applications this week", c.applied_week], ["Added to database this week", c.added_week],
  ]
  const active = (data?.goals || []).filter(g => g.status !== "done")
  const done = (data?.goals || []).filter(g => g.status === "done")

  return (
    <SuperadminLayout>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 pb-24">
        <section className="flex flex-col gap-6 rounded-3xl border bg-background p-6 md:flex-row md:items-center md:p-8">
          <ScoutAvatar size={112} state={now && Date.now() - new Date(now.created_at).getTime() < 120000 ? "working" : "default"} interactive />
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Your outreach teammate</p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">ScoutOutreach</h1>
            <AnimatePresence mode="wait">
              <motion.p key={now?.id || 0} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        className="mt-2 text-sm text-muted-foreground">
                {now ? <>Latest: <span className="text-foreground">{eventText(now)}</span> · {ago(now.created_at)} ago</> : "Waiting for its first job."}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:w-[420px]">
            {stats.map(([l, n]) => (
              <div key={l}><p className="text-2xl font-semibold tabular-nums">{(n ?? 0).toLocaleString()}</p><p className="text-xs text-muted-foreground">{l}</p></div>
            ))}
          </div>
        </section>

        <ScoutBotCard canEdit={canDestroy} />

        <Tabs value={tab} onValueChange={(v: string) => setParams({ tab: v === "overview" ? null : v, list: v === "campaigns" ? list : null })}
              className="gap-6">
          <TabsList className="h-10 w-full justify-start overflow-x-auto rounded-full p-1 sm:w-fit">
            {([["overview", "Overview", null], ["campaigns", "Campaigns", camps?.campaigns.length],
               ["general", "General", null], ["network", "Network", null]] as const).map(([k, l, n]) => (
              <TabsTrigger key={k} value={k} className="rounded-full px-4">
                {l}{n ? <span className="ml-1 tabular-nums text-muted-foreground">{n}</span> : null}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="flex flex-col gap-8">
        <section className="grid gap-4 md:grid-cols-3">
          {[["Creator database", data?.network.database, Database], ["Found by light analytics", data?.network.light_only, Sparkles],
            ["App creators", data?.network.app, Users]].map(([l, n, Icon]: any) => (
            <div key={l} className="flex items-center gap-4 rounded-2xl border bg-background p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted"><Icon className="h-5 w-5" /></span>
              <div><p className="text-2xl font-semibold tabular-nums">{(n ?? 0).toLocaleString()}</p><p className="text-xs text-muted-foreground">{l}</p></div>
            </div>
          ))}
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-semibold">Goals</h2>
              {canDestroy && <Button size="sm" variant="ghost" className="gap-1.5 rounded-full" onClick={() => setAdding(a => !a)}>
                <Plus className="h-3.5 w-3.5" />New goal</Button>}
            </div>
            {adding && <NewGoal onDone={() => { setAdding(false); load() }} />}
            {active.length === 0 && !adding && (
              <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No goals yet. Set one per roster (it counts relevant applicants, 4x what the brief needs) or to grow a category.
              </p>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              {active.map(g => <GoalCard key={g.id} g={g} canEdit={canDestroy} onChanged={load} />)}
            </div>
            {done.length > 0 && <>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Done recently</p>
              <div className="grid gap-3 md:grid-cols-2">{done.map(g => <GoalCard key={g.id} g={g} canEdit={false} onChanged={load} />)}</div>
            </>}
            {canDestroy && <LightLauncher contacts={null} onStarted={load} />}
            {data?.light_spend_30d_usd != null && (
              <p className="text-xs text-muted-foreground">Light analytics spend, last 30 days: ${Number(data.light_spend_30d_usd).toFixed(2)} (measured from Apify).</p>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Live</h2>
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#9bd400]" />
            </div>
            <div className="max-h-[720px] overflow-y-auto rounded-2xl border bg-background">
              {events.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Nothing yet.</p>}
              <AnimatePresence initial={false}>
                {events.map(e => (
                  <motion.div key={e.id} layout initial={{ opacity: 0, y: -8, backgroundColor: "rgba(211,255,2,0.25)" }}
                              animate={{ opacity: 1, y: 0, backgroundColor: "rgba(211,255,2,0)" }} transition={{ duration: 0.6 }}
                              onClick={e.username ? () => openCreator(e.username!) : undefined}
                              role={e.username ? "button" : undefined}
                              className={`flex items-center gap-3 border-b px-4 py-3 last:border-0 ${e.username ? "cursor-pointer hover:bg-muted/40" : ""}`}>
                    {e.avatar
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={e.avatar} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                      : <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                          {e.kind === "goal_met" ? <Target className="h-3.5 w-3.5" /> : <Wand2 className="h-3.5 w-3.5" />}</span>}
                    <p className="min-w-0 flex-1 truncate text-sm">{eventText(e)}</p>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{ago(e.created_at)}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>
          </TabsContent>

          <TabsContent value="campaigns" className="flex flex-col gap-4">
            {camps ? (
              <CampaignsTable campaigns={camps.campaigns} expanded={list} onToggle={id => setParams({ list: id })} onOpen={openCreator} />
            ) : <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
          </TabsContent>

          <TabsContent value="general" className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold">General outreach</h2>
              <p className="text-sm text-muted-foreground">Creators invited to join Following, not tied to one campaign</p>
            </div>
            {camps && <GeneralFunnel g={camps.general} />}
            <PeopleTable listId="general" mode="general" onOpen={openCreator} />
          </TabsContent>

          <TabsContent value="network" className="flex flex-col gap-4">
            <NetworkBrowser defaultSegment="all" canAdd={canDestroy} onOpen={openCreator} dmCampaigns={camps?.campaigns || []} />
          </TabsContent>
        </Tabs>
      </div>

      <CreatorSheet username={creator} onClose={() => setParams({ creator: null })} canEdit={canDestroy}
                    campaigns={camps?.campaigns || []} onChanged={loadCamps} />
    </SuperadminLayout>
  )
}
