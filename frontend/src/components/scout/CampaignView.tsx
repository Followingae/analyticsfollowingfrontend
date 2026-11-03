"use client"

/**
 * One campaign in ScoutOutreach, top to bottom: 1. who fits, 2. reach out (the WhatsApp
 * network and new creators by Instagram DM), 3. progress, everyone reached and where they are.
 */
import * as React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import { ArrowLeft, ArrowUpRight, Check, Globe, Hash, Instagram, Loader2, MessageCircle, Search, Send, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  scoutApi, type ScoutCampaign, type ScoutCampaignsData, type ScoutCriteria, type ScoutOutreachItem, type ScoutRosterPlan,
} from "@/services/scoutApi"
import { Bar, LiveDot } from "./CampaignList"
import { PeopleTable } from "./PeopleTable"
import { ChipGroup, Face, FollowerRange, ProposedCard, Scanning, criteriaSentence, langName } from "./outreachParts"

const lime = "rounded-full bg-[#d3ff02] text-[#111] hover:bg-[#c4ef00]"

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

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-background p-5">
      <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">{icon}{title}</p>
      {children}
    </div>
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

/* ------------------------------------------------------------ 2. reach out */

function WhatsAppCard({ listId, plan, canEdit, onSent }: { listId: string; plan: ScoutRosterPlan; canEdit: boolean; onSent: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const { matching, already_alerted, to_send, sample } = plan.contacts
  const reason = plan.open_call?.status !== "live" ? "Open call is not live"
    : !plan.template_approved ? "Alert template waiting for Meta" : null
  const send = async () => {
    setBusy(true)
    try {
      const r = await scoutApi.sendWhatsApp(listId)
      toast.success(`Alert going out to ${r.data.queued} creators`)
      setConfirming(false); onSent()
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  return (
    <Card icon={<MessageCircle className="h-4 w-4" />} title="Your WhatsApp network">
      {to_send > 0 ? (
        <>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-4xl font-semibold tabular-nums tracking-tight">{to_send.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{to_send === 1 ? "creator" : "creators"} not yet alerted</p>
            </div>
            {sample.length > 0 && (
              <div className="flex -space-x-2.5">
                {sample.slice(0, 5).map(s => <Face key={s.username} c={s} size={32} ring />)}
              </div>
            )}
          </div>
          {canEdit && (
            <div className="mt-auto flex flex-col gap-1.5">
              <AnimatePresence mode="wait" initial={false}>
                {confirming ? (
                  <motion.div key="c" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">Send to {to_send.toLocaleString()} now?</span>
                    <Button size="sm" className={`gap-1.5 px-4 ${lime}`} disabled={busy} onClick={send}>
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}Yes
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-full" disabled={busy} onClick={() => setConfirming(false)}>Cancel</Button>
                  </motion.div>
                ) : (
                  <motion.div key="s" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <Button className={`gap-2 px-6 ${lime}`} disabled={!!reason} onClick={() => setConfirming(true)}>
                      <Send className="h-4 w-4" />Send to {to_send.toLocaleString()}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
              {reason && <p className="text-xs text-muted-foreground">{reason}</p>}
            </div>
          )}
        </>
      ) : matching > 0 ? (
        <div>
          <p className="text-xl font-semibold">Everyone who fits has the alert</p>
          <p className="text-sm text-muted-foreground">{(already_alerted || matching).toLocaleString()} alerted</p>
        </div>
      ) : (
        <div>
          <p className="text-4xl font-semibold tabular-nums tracking-tight">0</p>
          <p className="text-sm text-muted-foreground">in your network fit</p>
        </div>
      )}
    </Card>
  )
}

type Search = { hashtags: string[]; lookalikes: boolean; max_new: number }

function searchSentence(s: Search) {
  const tags = s.hashtags.map(t => `#${t}`)
  if (!tags.length) return s.lookalikes ? "Scout will search look-alikes of creators who fit" : ""
  const head = tags.length <= 2 ? tags.join(" and ") : `${tags.slice(0, 2).join(", ")} and ${tags.length - 2} more`
  return `Scout will search ${head}${s.lookalikes ? ", plus look-alikes" : ""}`
}

function SearchEditor({ s, onChange }: { s: Search; onChange: (s: Search) => void }) {
  const [draft, setDraft] = useState("")
  const add = (v: string) => {
    const next = v.split(/[\s,]+/).map(t => t.replace(/^#+/, "").toLowerCase()).filter(Boolean)
    if (next.length) onChange({ ...s, hashtags: Array.from(new Set([...s.hashtags, ...next])) })
    setDraft("")
  }
  return (
    <div className="flex flex-col gap-3 rounded-xl border p-3">
      <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border px-2 py-1.5 focus-within:border-foreground/40">
        <Hash className="h-3.5 w-3.5 text-muted-foreground" />
        {s.hashtags.map(t => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
            #{t}
            <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange({ ...s, hashtags: s.hashtags.filter(x => x !== t) })}>
              <X className="h-3 w-3" /></button>
          </span>
        ))}
        <input value={draft} placeholder={s.hashtags.length ? "" : "Add hashtags"}
               onChange={e => { const v = e.target.value; if (/[\s,]$/.test(v)) add(v); else setDraft(v) }}
               onKeyDown={e => {
                 if (e.key === "Enter") { e.preventDefault(); add(draft) }
                 if (e.key === "Backspace" && !draft && s.hashtags.length) onChange({ ...s, hashtags: s.hashtags.slice(0, -1) })
               }}
               onBlur={() => draft.trim() && add(draft)}
               className="min-w-[6rem] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <label className="flex items-center gap-2">
          <Switch checked={s.lookalikes} onCheckedChange={(v: boolean) => onChange({ ...s, lookalikes: v })} />Look-alikes
        </label>
        <label className="flex items-center gap-2">
          Up to
          <Input inputMode="numeric" value={String(s.max_new || "")} aria-label="Most new creators"
                 onChange={e => onChange({ ...s, max_new: Number(e.target.value.replace(/\D/g, "").slice(0, 4)) || 0 })}
                 className="h-8 w-20 rounded-full text-center tabular-nums" />
          new
        </label>
      </div>
    </div>
  )
}

function DmCard({ listId, plan, canEdit, onStarted }: { listId: string; plan: ScoutRosterPlan; canEdit: boolean; onStarted: () => void }) {
  const [s, setS] = useState<Search | null>(null)
  const [changing, setChanging] = useState(false)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    scoutApi.suggest(listId).then(r => setS(r.data)).catch(() => setS({ hashtags: [], lookalikes: true, max_new: 200 }))
  }, [listId])
  const { dm, sourcing } = plan
  const find = async () => {
    if (!s) return
    setBusy(true)
    try {
      await scoutApi.source(listId, { lookalikes: s.lookalikes, hashtags: s.hashtags, max_new: s.max_new || 200 })
      toast.success("Scout is searching")
      setChanging(false); onStarted()
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  const extra = [[dm.replied, "replied"], [dm.approved, "waiting to send"]].filter(([v]) => (v as number) > 0)
    .map(([v, l]) => `${(v as number).toLocaleString()} ${l}`).join(" · ")
  const sentence = s ? searchSentence(s) : ""

  return (
    <Card icon={<Instagram className="h-4 w-4" />} title="New creators by Instagram DM">
      <div>
        <p className="text-4xl font-semibold tabular-nums tracking-tight">{dm.sent.toLocaleString()}</p>
        <p className="text-sm text-muted-foreground">DMs sent{extra ? ` · ${extra}` : ""}</p>
      </div>
      {sourcing.running ? <Scanning note={sourcing.last_note} /> : canEdit && s && (
        <div className="mt-auto flex flex-col gap-3">
          {sentence && (
            <p className="text-sm text-muted-foreground">
              {sentence}{" "}
              <button type="button" onClick={() => setChanging(c => !c)} className="text-foreground underline-offset-2 hover:underline">
                {changing ? "Done" : "Change"}</button>
            </p>
          )}
          {(changing || !sentence) && <SearchEditor s={s} onChange={setS} />}
          <Button className={`gap-2 self-start px-6 ${lime}`} disabled={busy || (!s.lookalikes && s.hashtags.length === 0)} onClick={find}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Find new creators
          </Button>
        </div>
      )}
    </Card>
  )
}

const SHOW = 30

function Found({ listId, plan, canEdit, onChanged, onOpen }: {
  listId: string; plan: ScoutRosterPlan; canEdit: boolean; onChanged: () => void; onOpen: (u: string) => void
}) {
  const [items, setItems] = useState<ScoutOutreachItem[]>([])
  const [picked, setPicked] = useState<Record<string, boolean>>({})
  const [all, setAll] = useState(false)
  const [busy, setBusy] = useState<"approve" | "skip" | null>(null)
  const sig = `${plan.dm.proposed}|${plan.dm.approved}|${plan.dm.skipped}`
  const load = useCallback(async () => {
    try { setItems((await scoutApi.outreach(listId, "proposed")).data.items || []) } catch { /* next change */ }
  }, [listId])
  useEffect(() => { load() }, [load, sig])
  const proposed = useMemo(() => items.filter(i => i.status === "proposed"), [items])
  const ids = useMemo(() => proposed.filter(p => picked[p.id]).map(p => p.id), [proposed, picked])
  const allPicked = proposed.length > 0 && ids.length === proposed.length

  const decide = async (d: "approve" | "skip") => {
    setBusy(d)
    try {
      const r = await scoutApi.decide(ids, d)
      toast.success(d === "approve" ? `${r.data.updated} approved` : `${r.data.updated} skipped`)
      setPicked({}); await load(); onChanged()
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(null) }
  }
  if (proposed.length === 0) return null

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-background p-5">
      <div className="flex flex-wrap items-center gap-3">
        {canEdit && <Checkbox checked={allPicked} aria-label="Select all"
                              onCheckedChange={() => setPicked(allPicked ? {} : Object.fromEntries(proposed.map(p => [p.id, true])))} />}
        <p className="font-semibold"><span className="tabular-nums">{proposed.length.toLocaleString()}</span> new creators found</p>
        {canEdit && (
          <div className="ml-auto flex gap-1.5">
            <Button size="sm" variant="ghost" className="rounded-full" disabled={!ids.length || !!busy} onClick={() => decide("skip")}>
              {busy === "skip" && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}Skip</Button>
            <Button size="sm" className={`gap-1.5 px-4 ${lime}`} disabled={!ids.length || !!busy} onClick={() => decide("approve")}>
              {busy === "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}Approve{ids.length ? ` ${ids.length}` : ""}
            </Button>
          </div>
        )}
      </div>
      <div className="grid max-h-[560px] gap-2 overflow-y-auto pr-1 md:grid-cols-2">
        <AnimatePresence initial={false}>
          {(all ? proposed : proposed.slice(0, SHOW)).map(c => (
            <ProposedCard key={c.id} c={c} canEdit={canEdit} picked={!!picked[c.id]}
                          onPick={() => setPicked(p => ({ ...p, [c.id]: !p[c.id] }))} onOpen={() => onOpen(c.username)} />
          ))}
        </AnimatePresence>
      </div>
      {!all && proposed.length > SHOW && (
        <Button variant="outline" size="sm" className="self-center rounded-full" onClick={() => setAll(true)}>Show all {proposed.length}</Button>
      )}
      <p className="text-xs text-muted-foreground">The bot sends approved DMs at human pace, about {plan.worker.daily_cap} today.</p>
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
              <WhatsAppCard listId={listId} plan={plan} canEdit={canEdit} onSent={load} />
              <DmCard listId={listId} plan={plan} canEdit={canEdit} onStarted={load} />
            </div>
            <Found listId={listId} plan={plan} canEdit={canEdit} onChanged={load} onOpen={onOpen} />
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
