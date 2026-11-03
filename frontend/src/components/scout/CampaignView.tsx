"use client"

/**
 * One campaign in ScoutOutreach, top to bottom: 1. who fits, 2. reach out (runs itself: the
 * WhatsApp alert to the network, and new creators found, checked and DMed by the bot),
 * 3. progress, everyone reached and where they are.
 */
import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import { ArrowLeft, ArrowUpRight, Check, Clock, Globe, Instagram, Loader2, MessageCircle, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  scoutApi, type ScoutCampaign, type ScoutCampaignsData, type ScoutCriteria, type ScoutOutreachItem, type ScoutRosterPlan,
} from "@/services/scoutApi"
import { Bar, LiveDot } from "./CampaignList"
import { PeopleTable } from "./PeopleTable"
import { WorkerPill, compact } from "./WorkerPill"
import { ChipGroup, Face, FollowerRange, Scanning, criteriaSentence, langName } from "./outreachParts"

function Back({ onBack }: { onBack: () => void }) {
  return (
    <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" />All campaigns
    </button>
  )
}

function Section({ n, title, action, children }: { n?: number; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {n != null && <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">{n}</span>}
        <h3 className="text-lg font-semibold">{title}</h3>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {children}
    </section>
  )
}

function Card({ icon, title, aside, children }: { icon: React.ReactNode; title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-background p-5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">{icon}{title}</p>
        {aside && <div className="ml-auto min-w-0">{aside}</div>}
      </div>
      {children}
    </div>
  )
}

function Pulse() {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c8f000] opacity-70" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#9bd400]" />
    </span>
  )
}

/* ------------------------------------------------------------ 1. who fits */

function WhoFits({ listId, plan, canEdit, onSaved }: { listId: string; plan: ScoutRosterPlan; canEdit: boolean; onSaved: () => void }) {
  const [editing, setEditing] = useState(false)
  const [c, setC] = useState<ScoutCriteria>(plan.criteria)
  const [saving, setSaving] = useState(false)
  const dirty = useRef(false)
  const seq = useRef(0)
  useEffect(() => { if (!dirty.current) setC(plan.criteria) }, [plan.criteria])
  useEffect(() => {
    if (!dirty.current) return
    const my = ++seq.current
    setSaving(true)
    const t = setTimeout(async () => {
      try {
        await scoutApi.setCriteria(listId, c)
        if (my === seq.current) { dirty.current = false; onSaved() }
      } catch (e) { toast.error((e as Error).message) } finally { if (my === seq.current) setSaving(false) }
    }, 500)
    return () => clearTimeout(t)
  }, [c, listId, onSaved])
  const edit = (p: Partial<ScoutCriteria>) => { dirty.current = true; setC(prev => ({ ...prev, ...p })) }
  const o = plan.criteria_options

  return (
    <Section n={1} title="Who fits" action={canEdit && (
      <button type="button" onClick={() => setEditing(e => !e)} className="inline-flex items-center gap-1.5 text-sm underline-offset-2 hover:underline">
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}{editing ? "Done" : "Edit"}
      </button>
    )}>
      <p className="text-base">{criteriaSentence(c)}</p>
      <AnimatePresence initial={false}>
        {editing && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex flex-col gap-2 rounded-2xl border bg-background p-4">
              <ChipGroup label="City" options={o.cities} value={c.cities} onChange={v => edit({ cities: v })} format={s => s.split(",")[0]} />
              <FollowerRange c={c} onChange={edit} />
              <ChipGroup label="Category" options={o.categories} value={c.categories} onChange={v => edit({ categories: v })} capitalize />
              <ChipGroup label="Language" options={o.languages} value={c.languages} onChange={v => edit({ languages: v })} format={langName} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  )
}

/* ------------------------------------------------------------ 2. reach out (automatic) */

function WhatsAppCard({ plan }: { plan: ScoutRosterPlan }) {
  const { matching, already_alerted, to_send } = plan.contacts
  const live = plan.open_call?.status === "live"
  return (
    <Card icon={<MessageCircle className="h-4 w-4" />} title="Your WhatsApp network">
      <div>
        <p className="text-4xl font-semibold tabular-nums tracking-tight">{already_alerted.toLocaleString()}</p>
        <p className="text-sm text-muted-foreground">alerted on WhatsApp</p>
      </div>
      {!live ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" />Starts when the open call is live</p>
      ) : !plan.template_approved ? (
        <p className="flex items-start gap-2 text-sm text-amber-800"><Clock className="mt-0.5 h-4 w-4 shrink-0" />Waiting for Meta to approve the message, it sends itself once approved</p>
      ) : to_send > 0 ? (
        <p className="flex items-center gap-2 text-sm"><Pulse /><span><span className="font-semibold tabular-nums">{to_send.toLocaleString()}</span> more going out automatically</span></p>
      ) : matching > 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4 text-emerald-600" />Everyone who fits has the alert</p>
      ) : null}
    </Card>
  )
}

type SearchPlan = { hashtags: string[]; lookalikes: boolean; max_new: number }

function searchSentence(s: SearchPlan) {
  const tags = s.hashtags.map(t => `#${t}`)
  if (!tags.length) return s.lookalikes ? "Searching look-alikes of creators who fit" : ""
  const head = tags.length <= 2 ? tags.join(" and ") : `${tags.slice(0, 2).join(", ")} and ${tags.length - 2} more`
  return `Searching ${head}${s.lookalikes ? ", plus look-alikes" : ""}`
}

function DmCard({ listId, plan, canEdit, onStarted }: { listId: string; plan: ScoutRosterPlan; canEdit: boolean; onStarted: () => void }) {
  const [s, setS] = useState<SearchPlan | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    scoutApi.suggest(listId).then(r => setS(r.data)).catch(() => setS(null))
  }, [listId])
  const { dm, sourcing } = plan
  const again = async () => {
    setBusy(true)
    try {
      await scoutApi.source(listId, { lookalikes: s?.lookalikes ?? true, hashtags: s?.hashtags ?? [], max_new: s?.max_new || 200 })
      toast.success("Scout is searching")
      onStarted()
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  const sentence = s ? searchSentence(s) : ""
  const small: [number, string][] = [[dm.approved, "waiting"], [dm.replied, "replied"]]

  return (
    <Card icon={<Instagram className="h-4 w-4" />} title="New creators by Instagram DM" aside={<WorkerPill w={plan.worker} />}>
      <div className="flex items-end gap-6">
        <div>
          <p className="text-4xl font-semibold tabular-nums tracking-tight">{dm.sent.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">DMs sent</p>
        </div>
        {small.map(([v, l]) => (
          <div key={l}>
            <p className="text-xl font-semibold tabular-nums">{v.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>
      {sourcing.running && <Scanning note={sourcing.last_note} />}
      {(sentence || canEdit) && (
        <p className="text-sm text-muted-foreground">
          {sentence}
          {canEdit && !sourcing.running && (
            <button type="button" disabled={busy} onClick={again}
                    className={`${sentence ? "ml-2 " : ""}inline-flex items-center gap-1 text-foreground underline-offset-2 hover:underline disabled:opacity-50`}>
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}Search again now
            </button>
          )}
        </p>
      )}
    </Card>
  )
}

const UP_NEXT = 8

function UpNext({ listId, plan, onOpen }: { listId: string; plan: ScoutRosterPlan; onOpen: (u: string) => void }) {
  const [items, setItems] = useState<ScoutOutreachItem[]>([])
  const [all, setAll] = useState(false)
  const sig = `${plan.dm.approved}|${plan.dm.sent}`
  const load = useCallback(async () => {
    try { setItems((await scoutApi.outreach(listId, "approved")).data.items || []) } catch { /* next change */ }
  }, [listId])
  useEffect(() => { load() }, [load, sig])
  const queued = items.filter(i => i.status === "approved" || i.status === "sending")
  if (queued.length === 0) return null
  return (
    <div className="flex flex-col gap-2 rounded-2xl border bg-background p-5">
      <p className="text-sm font-semibold">Up next <span className="font-normal tabular-nums text-muted-foreground">{queued.length.toLocaleString()}</span></p>
      <div className="flex flex-col">
        <AnimatePresence initial={false}>
          {(all ? queued : queued.slice(0, UP_NEXT)).map(c => (
            <motion.button key={c.id} type="button" layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                           onClick={() => c.username && onOpen(c.username)}
                           className="flex items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/40">
              <Face c={c} size={32} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2 text-sm">
                  <span className="truncate font-medium">{c.username ? `@${c.username}` : c.full_name}</span>
                  {c.followers != null && <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{compact(c.followers)}</span>}
                  {c.status === "sending" && <span className="shrink-0 text-xs text-muted-foreground">sending now</span>}
                </span>
                {c.fit_reason && <span className="block truncate text-xs text-muted-foreground">{c.fit_reason}</span>}
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
      {!all && queued.length > UP_NEXT && (
        <Button variant="ghost" size="sm" className="self-start rounded-full" onClick={() => setAll(true)}>Show all {queued.length}</Button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------ the open campaign */

export function CampaignView({ listId, campaign, canEdit, onBack, onOpen }: {
  listId: string; campaign: ScoutCampaign | undefined; canEdit: boolean; onBack: () => void; onOpen: (u: string) => void
}) {
  const [plan, setPlan] = useState<ScoutRosterPlan | null>(null)
  const load = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return
    try { setPlan((await scoutApi.plan(listId)).data) } catch { /* next tick */ }
  }, [listId])
  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t) }, [load])

  const title = campaign ? campaign.brand || campaign.name : plan?.open_call?.title || "Campaign"
  const relevant = campaign?.funnel.relevant ?? 0
  const target = campaign?.goal?.target ?? null

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <Back onBack={onBack} />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-2xl font-semibold tracking-tight">{title}</h2>
              {(campaign?.open_call?.status || plan?.open_call?.status) === "live" && <LiveDot />}
            </div>
            <Link href={`/work/areas/${listId}`} className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
              {campaign && campaign.brand && campaign.name !== campaign.brand ? campaign.name : "Roster"}<ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="text-right">
            <p className="whitespace-nowrap">
              <span className="text-4xl font-semibold tabular-nums tracking-tight">{relevant.toLocaleString()}</span>
              {target ? <span className="text-2xl tabular-nums text-muted-foreground"> / {target.toLocaleString()}</span> : null}
            </p>
            <p className="text-sm text-muted-foreground">relevant applicants</p>
          </div>
        </div>
        {target ? <Bar value={relevant} target={target} className="h-1.5" /> : null}
      </div>

      {!plan ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <WhoFits listId={listId} plan={plan} canEdit={canEdit} onSaved={load} />
          <Section n={2} title="Reach out">
            <div className="grid items-stretch gap-4 md:grid-cols-2">
              <WhatsAppCard plan={plan} />
              <DmCard listId={listId} plan={plan} canEdit={canEdit} onStarted={load} />
            </div>
            <UpNext listId={listId} plan={plan} onOpen={onOpen} />
          </Section>
          <Section n={3} title="Progress">
            <PeopleTable listId={listId} mode="campaign" onOpen={onOpen} />
          </Section>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------ general outreach */

export function GeneralView({ general, onBack, onOpen }: {
  general: ScoutCampaignsData["general"]; onBack: () => void; onOpen: (u: string) => void
}) {
  const f = general.funnel
  const steps: [number, string][] = [[f.contacted, "contacted"], [f.clicked, "clicked"], [f.joined_app, "joined the app"], [f.in_database, "in database"]]
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <Back onBack={onBack} />
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-2xl font-semibold tracking-tight">General outreach</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {steps.map(([v, l]) => (
            <div key={l} className="rounded-2xl border bg-background p-4">
              <p className="text-3xl font-semibold tabular-nums tracking-tight">{v.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
        {general.queue > 0 && <p className="text-sm text-muted-foreground">{general.queue.toLocaleString()} waiting for the bot</p>}
      </div>
      <Section title="Progress">
        <PeopleTable listId="general" mode="general" onOpen={onOpen} />
      </Section>
    </div>
  )
}
