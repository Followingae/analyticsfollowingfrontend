"use client"

/**
 * Everyone ScoutOutreach has reached for one campaign (or General outreach), where each of
 * them is, and every step they have taken. Click a row for the creator in full.
 */
import * as React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Instagram, Link2, Loader2, MessageCircle, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { scoutApi, type PersonChannel, type PersonStage, type ScoutPerson } from "@/services/scoutApi"
import { ago, compact } from "./WorkerPill"
import { STAGE_LABEL, stageTone, when } from "./scoutText"

type Mode = "campaign" | "general"

const CAMPAIGN_CHIPS: PersonStage[] = ["contacted", "clicked", "chatting", "applied", "relevant", "shortlisted", "in_proposal", "passed"]
const CAMPAIGN_EXTRA: PersonStage[] = ["queued", "failed", "skipped"]
const GENERAL_CHIPS: PersonStage[] = ["queued", "contacted", "clicked", "joined_app", "in_database"]
const GENERAL_EXTRA: PersonStage[] = ["failed", "skipped"]

const CHANNEL: Record<PersonChannel, { label: string; Icon: typeof Instagram }> = {
  instagram: { label: "Instagram", Icon: Instagram },
  whatsapp: { label: "WhatsApp", Icon: MessageCircle },
  link: { label: "Link", Icon: Link2 },
}

type Step = { label: string; at: string | null; reached: boolean; bad?: boolean }

export function personSteps(p: ScoutPerson, mode: Mode): Step[] {
  const s = p.steps
  if (mode === "general") {
    return [
      { label: "Queued", at: s.queued_at, reached: !!s.queued_at },
      { label: "DM sent", at: s.sent_at, reached: !!s.sent_at, bad: p.stage === "failed" },
      { label: "Clicked", at: s.clicked_at, reached: !!s.clicked_at },
      { label: "Joined app", at: null, reached: s.joined_app },
      { label: "In database", at: null, reached: p.stage === "in_database" },
    ]
  }
  const out: Step[] = []
  if (p.channel !== "link") {
    out.push({ label: "Queued", at: s.queued_at, reached: !!s.queued_at })
    out.push({ label: p.channel === "whatsapp" ? "Alert sent" : "DM sent", at: s.sent_at, reached: !!s.sent_at, bad: p.stage === "failed" })
  }
  if (p.channel !== "whatsapp") out.push({ label: p.channel === "link" ? "Opened the link" : "Clicked", at: s.clicked_at, reached: !!s.clicked_at })
  out.push({ label: "Chatting", at: s.chat_at, reached: !!s.chat_at })
  out.push({ label: "Applied", at: s.applied_at, reached: !!s.applied_at })
  out.push({ label: "Relevant", at: null, reached: s.relevant === true, bad: s.relevant === false })
  out.push({ label: "Shortlisted", at: null, reached: s.review === "shortlisted" || s.review === "approved", bad: s.review === "passed" })
  out.push({ label: "In proposal", at: null, reached: s.in_proposal })
  return out
}

export function StepTracker({ steps }: { steps: Step[] }) {
  const last = steps.reduce((acc, s, i) => (s.reached ? i : acc), -1)
  return (
    <div className="flex items-center">
      {steps.map((s, i) => (
        <React.Fragment key={s.label}>
          {i > 0 && <span className={`h-px w-2.5 sm:w-3.5 ${steps[i - 1].reached && s.reached ? "bg-foreground/70" : "bg-border"}`} />}
          <span title={s.bad ? `${s.label}: no` : s.reached ? `${s.label}${s.at ? `: ${when(s.at)}` : ""}` : `${s.label}: not yet`}
                className={`h-2.5 w-2.5 shrink-0 rounded-full border transition-colors ${s.bad ? "border-red-500 bg-red-500"
                  : i === last ? "border-foreground bg-[#d3ff02]"
                  : s.reached ? "border-foreground bg-foreground" : "border-border bg-background"}`} />
        </React.Fragment>
      ))}
    </div>
  )
}

function Face({ p }: { p: Pick<ScoutPerson, "avatar" | "username" | "full_name"> }) {
  const [bad, setBad] = useState(false)
  if (p.avatar && !bad) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={p.avatar} alt="" onError={() => setBad(true)} className="h-9 w-9 shrink-0 rounded-full object-cover" />
  }
  return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold uppercase">{(p.username || p.full_name || "?").slice(0, 2)}</span>
}

function Chip({ on, dim, children, onClick }: { on: boolean; dim?: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
            className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs transition ${on
              ? "border-foreground bg-foreground text-background" : `bg-background hover:border-foreground/40 ${dim ? "text-muted-foreground" : ""}`}`}>
      {children}
    </button>
  )
}

const PAGE = 100

export function PeopleTable({ listId, mode, onOpen }: { listId: string; mode: Mode; onOpen: (username: string) => void }) {
  const [people, setPeople] = useState<ScoutPerson[] | null>(null)
  const [search, setSearch] = useState("")
  const [q, setQ] = useState("")
  const [stage, setStage] = useState<PersonStage | "all">("all")
  const [channel, setChannel] = useState<PersonChannel | "all">("all")
  const [limit, setLimit] = useState(PAGE)

  useEffect(() => { const t = setTimeout(() => setQ(search.trim()), 300); return () => clearTimeout(t) }, [search])
  const load = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return
    try { setPeople((await scoutApi.people(listId, { search: q || undefined })).data.people || []) } catch { /* next tick */ }
  }, [listId, q])
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t) }, [load])

  const byChannel = useMemo(() => (people || []).filter(p => channel === "all" || p.channel === channel), [people, channel])
  const counts = useMemo(() => {
    const c: Partial<Record<PersonStage, number>> = {}
    byChannel.forEach(p => { c[p.stage] = (c[p.stage] || 0) + 1 })
    return c
  }, [byChannel])
  const channels = useMemo(() => {
    const c: Partial<Record<PersonChannel, number>> = {}
    ;(people || []).forEach(p => { c[p.channel] = (c[p.channel] || 0) + 1 })
    return c
  }, [people])
  const rows = useMemo(() => byChannel.filter(p => stage === "all" || p.stage === stage), [byChannel, stage])

  if (people === null) return <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
  if (people.length === 0 && !q) return null

  const chips = mode === "general" ? GENERAL_CHIPS : CAMPAIGN_CHIPS
  const extra = (mode === "general" ? GENERAL_EXTRA : CAMPAIGN_EXTRA).filter(s => counts[s])
  const channelKeys = (Object.keys(channels) as PersonChannel[])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip on={stage === "all"} onClick={() => setStage("all")}>All <span className="ml-0.5 tabular-nums opacity-60">{byChannel.length}</span></Chip>
        {[...chips, ...extra].map(s => (
          <Chip key={s} on={stage === s} dim={!counts[s]} onClick={() => setStage(stage === s ? "all" : s)}>
            {STAGE_LABEL[s]} <span className="ml-0.5 tabular-nums opacity-60">{counts[s] || 0}</span>
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {channelKeys.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <Chip on={channel === "all"} onClick={() => setChannel("all")}>Every channel</Chip>
            {channelKeys.map(k => {
              const { label, Icon } = CHANNEL[k]
              return <Chip key={k} on={channel === k} onClick={() => setChannel(channel === k ? "all" : k)}>
                <Icon className="mr-1 inline h-3 w-3" />{label} <span className="tabular-nums opacity-60">{channels[k]}</span></Chip>
            })}
          </div>
        )}
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-9 rounded-full pl-9" placeholder="Handle or name" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {rows.length > 0 && (
        <div className="overflow-hidden rounded-xl border bg-background">
          <div className="hidden grid-cols-[minmax(0,1.5fr)_72px_minmax(0,1.6fr)_112px_56px] gap-4 border-b bg-muted/30 px-4 py-2 text-[11px] uppercase tracking-wide text-muted-foreground md:grid">
            <span>Creator</span><span className="text-right">Followers</span><span>Steps</span><span>Now</span><span className="text-right">Last</span>
          </div>
          <AnimatePresence initial={false}>
            {rows.slice(0, limit).map(p => {
              const { label, Icon } = CHANNEL[p.channel] || CHANNEL.instagram
              return (
                <motion.button type="button" layout key={`${p.username}-${p.outreach_id || p.conversation_id || ""}`}
                               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                               onClick={() => p.username && onOpen(p.username)}
                               className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-muted/40 md:grid-cols-[minmax(0,1.5fr)_72px_minmax(0,1.6fr)_112px_56px]">
                  <span className="flex min-w-0 items-center gap-3">
                    <Face p={p} />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        <span className="truncate">{p.username ? `@${p.username}` : (p.full_name || "WhatsApp contact")}</span>
                        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label={label} />
                      </span>
                      {(p.full_name || p.city) && <span className="block truncate text-xs text-muted-foreground">
                        {[p.full_name, p.city?.split(",")[0]].filter(Boolean).join(" · ")}</span>}
                    </span>
                  </span>
                  <span className="text-right text-sm tabular-nums md:order-none">{compact(p.followers)}</span>
                  <span className="col-span-2 md:col-span-1"><StepTracker steps={personSteps(p, mode)} /></span>
                  <span><span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${stageTone(p.stage)}`}>{STAGE_LABEL[p.stage] || p.stage}</span></span>
                  <span className="text-right text-xs text-muted-foreground tabular-nums">{p.last_at ? ago(p.last_at) : ""}</span>
                </motion.button>
              )
            })}
          </AnimatePresence>
        </div>
      )}
      {rows.length > limit && (
        <Button variant="outline" size="sm" className="self-center rounded-full" onClick={() => setLimit(l => l + PAGE)}>
          Show {Math.min(PAGE, rows.length - limit)} more of {rows.length - limit}
        </Button>
      )}
    </div>
  )
}
