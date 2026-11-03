"use client"

/**
 * The Job: one brand brief, every creator on it, and for each one the step they are on and
 * the one thing that moves them on. What needs you is at the top with its button; what waits
 * on the client, a creator or Scout is a quiet chip; done and out sit below.
 *
 * Stage, source and the open creator live in the URL.
 */
import * as React from "react"
import { Suspense, useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { ArrowLeft, ArrowUpRight, ChevronDown } from "lucide-react"
import { SuperadminLayout } from "@/components/layouts/SuperadminLayout"
import { CreatorSheet } from "@/components/scout/CreatorSheet"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Chip, Face, LIME, LiveLine, LoadFailed, PulseDot, SOURCE_META, SourceMarks, Spinner, StageRail, WAITING_ON, WHO_SHORT,
  actionHref, actionRank, compactNum, dueChip, isMine, pileHref, stageOf, usePoll,
} from "@/components/jobs/jobParts"
import { useAdminAccess } from "@/hooks/useAdminAccess"
import { cn } from "@/lib/utils"
import { jobsApi, type JobDetail, type JobPerson, type StageKey, type Who } from "@/services/jobsApi"
import { scoutApi, type ScoutCampaign } from "@/services/scoutApi"

type SourceTab = "all" | "talent" | "scoutai" | "scoutoutreach"
const STAGE_KEYS: StageKey[] = ["find", "price", "propose", "book", "deliver", "paid"]

export default function JobPageWrapper() {
  return <Suspense fallback={null}><JobPage /></Suspense>
}

function JobPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const { canDestroy } = useAdminAccess()

  const rawStage = params.get("stage") as StageKey | null
  const stage = rawStage && STAGE_KEYS.includes(rawStage) ? rawStage : null
  const rawSource = params.get("source")
  const source: SourceTab = rawSource === "talent" || rawSource === "scoutai" || rawSource === "scoutoutreach" ? rawSource : "all"
  const pickedOnly = params.get("picked") === "1"
  const creator = params.get("creator")

  const setParams = useCallback((patch: Record<string, string | null>) => {
    const p = new URLSearchParams(params.toString())
    Object.entries(patch).forEach(([k, v]) => { if (v) p.set(k, v); else p.delete(k) })
    const qs = p.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [params, pathname, router])

  const [d, setD] = useState<JobDetail | null>(null)
  const [failed, setFailed] = useState(false)
  const load = useCallback(async () => {
    if (!id) return
    try { setD((await jobsApi.get(id)).data); setFailed(false) } catch { setFailed(true) }
  }, [id])
  usePoll(load, 15000)

  // The creator sheet offers "DM about a campaign"; it only needs the list once a sheet opens.
  const [scoutCamps, setScoutCamps] = useState<ScoutCampaign[] | null>(null)
  React.useEffect(() => {
    if (!creator || scoutCamps) return
    scoutApi.campaigns().then(r => setScoutCamps(r.data.campaigns)).catch(() => setScoutCamps([]))
  }, [creator, scoutCamps])

  return (
    <SuperadminLayout>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 pb-24">
        <Link href="/work/jobs" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />Jobs
        </Link>
        {!d ? (failed ? <LoadFailed onRetry={load} /> : <Spinner />) : (
          <JobBody d={d} stage={stage} source={source} pickedOnly={pickedOnly}
                   setStage={k => setParams({ stage: k })}
                   setSource={s => setParams({ source: s === "all" ? null : s, picked: null })}
                   setPicked={on => setParams({ picked: on ? "1" : null })}
                   openCreator={u => setParams({ creator: u })} />
        )}
      </div>
      <CreatorSheet username={creator} onClose={() => setParams({ creator: null })} canEdit={canDestroy}
                    campaigns={scoutCamps || []} onChanged={load} />
    </SuperadminLayout>
  )
}

/* ------------------------------------------------------------------ the page */

function JobBody({ d, stage, source, pickedOnly, setStage, setSource, setPicked, openCreator }: {
  d: JobDetail
  stage: StageKey | null
  source: SourceTab
  pickedOnly: boolean
  setStage: (k: StageKey | null) => void
  setSource: (s: SourceTab) => void
  setPicked: (on: boolean) => void
  openCreator: (u: string) => void
}) {
  const { job, people, you_are: viewer } = d
  const campaignId = d.campaign?.id ?? null

  const counts = useMemo(() => ({
    all: people.length,
    talent: people.filter(p => p.sources.includes("talent") || p.sources.includes("scout")).length,
    picked: people.filter(p => p.sources.includes("scout")).length,
    scoutai: people.filter(p => p.sources.includes("scoutai")).length,
    scoutoutreach: people.filter(p => p.sources.includes("scoutoutreach")).length,
  }), [people])

  const shown = useMemo(() => people.filter(p => {
    if (stage && stageOf(p.step) !== stage) return false
    if (source === "talent") return pickedOnly ? p.sources.includes("scout") : (p.sources.includes("talent") || p.sources.includes("scout"))
    if (source !== "all") return p.sources.includes(source)
    return true
  }), [people, stage, source, pickedOnly])

  const groups = useMemo(() => {
    const yours: JobPerson[] = [], waiting: JobPerson[] = [], done: JobPerson[] = [], out: JobPerson[] = []
    for (const p of shown) {
      if (p.step === "out") out.push(p)
      else if (p.step === "paid") done.push(p)
      else if (p.action && isMine(p.who, viewer)) yours.push(p)
      else waiting.push(p)
    }
    yours.sort((a, b) => actionRank(a.action) - actionRank(b.action) || b.rank - a.rank)
    waiting.sort((a, b) => b.rank - a.rank)
    return { yours, waiting, done, out }
  }, [shown, viewer])

  // The one primary action: whatever most of your pile is, across the whole job.
  const primary = useMemo(() => {
    const mine = people.filter(p => p.action && isMine(p.who, viewer))
    const by = new Map<string, JobPerson[]>()
    for (const p of mine) by.set(p.action!, [...(by.get(p.action!) || []), p])
    const top = [...by.entries()].sort((a, b) => b[1].length - a[1].length || actionRank(a[0]) - actionRank(b[0]))[0]
    return top ? { action: top[0], n: top[1].length, href: pileHref(top[0], top[1], job.id, campaignId) } : null
  }, [people, viewer, job.id, campaignId])

  const waitingSummary = useMemo(() => {
    const c = new Map<Who, number>()
    for (const p of groups.waiting) c.set(p.who, (c.get(p.who) || 0) + 1)
    return [...c.entries()].filter(([w]) => w !== "nobody").sort((a, b) => b[1] - a[1])
  }, [groups.waiting])

  const due = dueChip(job.due_at)
  const need = typeof job.brief?.target_count === "number" ? job.brief.target_count as number : null
  const callLive = job.open_call_status === "live"
  const hasEnrolments = people.some(p => p.enrolment_id)
  const sourceTabs = (["all", "talent", "scoutai", "scoutoutreach"] as SourceTab[]).filter(t => t === "all" || counts[t] > 0)

  return (
    <>
      {/* ---- header: who, what is running, the one thing to do */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          {job.brand && <p className="truncate text-sm text-muted-foreground">{job.brand}</p>}
          <h1 className="text-ds-title break-words">{job.name}</h1>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <Chip tone="outline">{d.total} creators{need ? ` · need ${need}` : ""}</Chip>
            {callLive && <Chip tone="outline"><PulseDot className="mr-0.5 scale-75" />Open call live</Chip>}
            {due && <Chip tone={due.late ? "warn" : "outline"}>{due.text}</Chip>}
          </div>
        </div>
        {primary && (
          <Link href={primary.href}
                className={cn("inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-full px-5 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-[0.99]", LIME)}>
            {primary.action}
            <span className="rounded-full bg-[#111]/10 px-2 py-0.5 text-xs tabular-nums">{primary.n}</span>
          </Link>
        )}
      </header>

      {d.live.length > 0 && <LiveLine lines={d.live} className="-mt-2" />}

      {/* ---- the job's tools */}
      <nav className="-mt-1 flex flex-wrap items-center gap-1.5" aria-label="Job tools">
        <Tool href={`/work/areas/${job.id}`}>Roster</Tool>
        {(job.open_call_id || counts.scoutai > 0) && <Tool href={`/work/areas/${job.id}?chats=1`}>ScoutAI chats</Tool>}
        <Tool href={`/work/scout?list=${job.id}`}>ScoutOutreach</Tool>
        {d.proposals.length === 1 && <Tool href={`/work/proposals/${d.proposals[0].id}`}>Proposal</Tool>}
        {d.proposals.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-7 items-center gap-1 rounded-full border px-3 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">
              Proposals · {d.proposals.length}<ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-56">
              {d.proposals.map(p => (
                <DropdownMenuItem key={p.id} asChild>
                  <Link href={`/work/proposals/${p.id}`} className="flex items-center justify-between gap-3">
                    <span className="truncate">{p.name || "Proposal"}</span>
                    <span className="text-xs capitalize text-muted-foreground">{p.status.replace(/_/g, " ")}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {d.campaign && <Tool href={`/work/campaigns/${d.campaign.id}`}>Campaign</Tool>}
        {hasEnrolments && <Tool href="/work/enrolments">Enrolments</Tool>}
      </nav>

      {/* ---- stages, as filters */}
      <StageRail stages={d.stages} size="lg" selected={stage} onSelect={setStage} />

      {/* ---- sources */}
      {sourceTabs.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={source} onValueChange={(v: string) => setSource(v as SourceTab)}>
            <TabsList className="h-9 max-w-full overflow-x-auto rounded-full p-1">
              {sourceTabs.map(t => (
                <TabsTrigger key={t} value={t} className="gap-1.5 rounded-full px-3 text-xs sm:px-4 sm:text-sm">
                  {t === "all" ? "All" : SOURCE_META[t].label}
                  <span className="tabular-nums text-muted-foreground">{counts[t]}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {source === "talent" && counts.picked > 0 && (
            <button type="button" onClick={() => setPicked(!pickedOnly)} aria-pressed={pickedOnly}
                    className={cn("inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors",
                                  pickedOnly ? "border-foreground bg-foreground text-background" : "text-muted-foreground hover:bg-muted/60")}>
              Picked by Scout<span className="tabular-nums opacity-70">{counts.picked}</span>
            </button>
          )}
        </div>
      )}

      {/* ---- the people */}
      <div className="flex flex-col gap-6">
        {groups.yours.length > 0 && (
          <Group title="Needs you" count={groups.yours.length} lime>
            {groups.yours.map(p => <PersonRow key={p.username} p={p} jobId={job.id} campaignId={campaignId} kind="yours" onOpen={openCreator} />)}
          </Group>
        )}
        {groups.waiting.length > 0 && (
          <Group title="Waiting on others" count={groups.waiting.length}
                 extra={waitingSummary.slice(0, 3).map(([w, n]) => `${WHO_SHORT[w]} ${n}`).join(" · ")}>
            {groups.waiting.map(p => <PersonRow key={p.username} p={p} jobId={job.id} campaignId={campaignId} kind="waiting" onOpen={openCreator} />)}
          </Group>
        )}
        {groups.done.length > 0 && (
          <Group title="Done" count={groups.done.length}>
            {groups.done.map(p => <PersonRow key={p.username} p={p} jobId={job.id} campaignId={campaignId} kind="done" onOpen={openCreator} />)}
          </Group>
        )}
        {groups.out.length > 0 && (
          <Group title="Out" count={groups.out.length} collapsible>
            {groups.out.map(p => <PersonRow key={p.username} p={p} jobId={job.id} campaignId={campaignId} kind="out" onOpen={openCreator} />)}
          </Group>
        )}
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ pieces */

function Tool({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href}
          className="inline-flex h-7 items-center gap-1 rounded-full border px-3 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">
      {children}<ArrowUpRight className="h-3 w-3 opacity-50" />
    </Link>
  )
}

function Group({ title, count, extra, lime, collapsible, children }: {
  title: string; count: number; extra?: string; lime?: boolean; collapsible?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(!collapsible)
  const head = (
    <span className="flex min-w-0 items-center gap-2">
      <span className="text-sm font-semibold">{title}</span>
      <span className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                          lime ? LIME : "bg-muted text-muted-foreground")}>{count}</span>
      {extra && <span className="truncate text-xs text-muted-foreground">{extra}</span>}
      {collapsible && <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />}
    </span>
  )
  return (
    <section className="flex flex-col gap-1">
      {collapsible
        ? <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} className="w-fit px-3 py-1 text-left">{head}</button>
        : <div className="px-3 py-1">{head}</div>}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={collapsible ? { height: 0, opacity: 0 } : false} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden">
            <div className="flex flex-col divide-y divide-border/60 rounded-3xl border bg-background px-1 py-1 sm:px-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function PersonRow({ p, jobId, campaignId, kind, onOpen }: {
  p: JobPerson; jobId: string; campaignId: string | null; kind: "yours" | "waiting" | "done" | "out"; onOpen: (u: string) => void
}) {
  const followers = compactNum(p.followers)
  const step = (
    <span className={cn("truncate", kind === "out" && "text-muted-foreground/70")}>{kind === "out" && p.note ? p.note : p.label}</span>
  )
  return (
    <div className="flex min-w-0 items-center gap-3 px-2 py-2.5 sm:px-3">
      <button type="button" onClick={() => onOpen(p.username)}
              className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Face src={p.avatar} name={p.username} size={36} className={cn(kind === "out" && "opacity-50")} />
        <span className="min-w-0">
          <span className={cn("block truncate text-sm font-medium group-hover:underline", kind === "out" && "text-muted-foreground")}>
            {p.full_name || `@${p.username}`}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {p.full_name ? `@${p.username}` : null}
            {/* On a phone the step rides under the name instead of in its own column. */}
            <span className="sm:hidden">{p.full_name ? " · " : ""}{kind === "out" && p.note ? p.note : p.label}</span>
          </span>
        </span>
      </button>

      <span className="hidden w-14 shrink-0 text-right text-sm tabular-nums text-muted-foreground md:block">{followers ?? ""}</span>
      <span className="hidden w-[84px] shrink-0 md:flex"><SourceMarks sources={p.sources} /></span>
      <span className="hidden w-44 shrink-0 text-xs text-muted-foreground sm:flex lg:w-56">
        {p.note && kind !== "out" ? (
          <Tooltip>
            <TooltipTrigger asChild><span className="min-w-0 cursor-default truncate underline decoration-dotted underline-offset-4">{step}</span></TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">{p.note}</TooltipContent>
          </Tooltip>
        ) : step}
      </span>

      <span className="flex w-auto shrink-0 justify-end sm:w-48">
        {kind === "yours" && p.action ? (
          <Link href={actionHref(p, jobId, campaignId)}
                className="inline-flex h-8 max-w-[10rem] items-center gap-1 rounded-full border border-foreground/15 px-3 text-xs font-medium transition-colors hover:border-foreground/40 hover:bg-muted/50 sm:max-w-none">
            <span className="truncate">{p.action}</span>
          </Link>
        ) : kind === "waiting" ? (
          <Chip className="max-w-[10rem] sm:max-w-none"><span className="truncate">{WAITING_ON[p.who] || p.label}</span></Chip>
        ) : kind === "done" ? (
          <Chip tone="good">Paid</Chip>
        ) : null}
      </span>
    </div>
  )
}
