"use client"

/**
 * How ScoutOutreach fills one roster, side by side:
 *  1. Your network on WhatsApp: creators we already have whose light analytics match the
 *     campaign get the campaign alert from our number. One button, everyone not yet alerted.
 *  2. New creators by Instagram DM: look-alikes and hashtags, light analysed, proposed here.
 *     A founder approves them and the desktop bot sends at human pace.
 * Founders edit and act; everyone else watches it work.
 */
import * as React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Check, Hash, Instagram, Loader2, MapPin, MessageCircle, Radar, Search, Send, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { WorkerPill, ago, compact } from "@/components/scout/WorkerPill"
import {
  scoutApi, type ScoutCreator, type ScoutCriteria, type ScoutOutreachItem, type ScoutRosterPlan,
} from "@/services/scoutApi"

const LANG_NAMES: Record<string, string> = {
  en: "English", ar: "Arabic", arabizi: "Arabizi", hi: "Hindi", ur: "Urdu", tl: "Tagalog", ru: "Russian", fr: "French",
}
const langName = (c: string) => LANG_NAMES[c.toLowerCase()] || c.toUpperCase()

const SIZE_PRESETS: [string, number | null, number | null][] = [
  ["Any size", null, null], ["5K+", 5000, null], ["10K+", 10000, null], ["50K+", 50000, null], ["100K+", 100000, null],
]

/** "10k", "1.2m", "25000" → number; empty → null; anything else → undefined (not yet valid). */
function parseCount(s: string): number | null | undefined {
  const t = s.trim().toLowerCase().replace(/,/g, "")
  if (!t) return null
  const m = t.match(/^(\d+(?:\.\d+)?)([km])?$/)
  if (!m) return undefined
  return Math.round(Number(m[1]) * (m[2] === "m" ? 1_000_000 : m[2] === "k" ? 1000 : 1))
}

function rangeText(c: ScoutCriteria) {
  if (c.min_followers && c.max_followers) return `${compact(c.min_followers)} to ${compact(c.max_followers)} followers`
  if (c.min_followers) return `${compact(c.min_followers)}+ followers`
  if (c.max_followers) return `Up to ${compact(c.max_followers)} followers`
  return "Any size"
}

function Chip({ on, children, onClick, disabled }: { on: boolean; children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
            className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs transition ${on
              ? "border-foreground bg-foreground text-background" : "bg-background hover:border-foreground/40"} disabled:cursor-default`}>
      {children}
    </button>
  )
}

function Face({ c, size = 40, ring = false }: { c: Pick<ScoutCreator, "avatar" | "username">; size?: number; ring?: boolean }) {
  const [bad, setBad] = useState(false)
  const style = { width: size, height: size }
  const cls = `shrink-0 rounded-full object-cover ${ring ? "ring-2 ring-background" : ""}`
  if (c.avatar && !bad) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={c.avatar} alt="" style={style} onError={() => setBad(true)} className={cls} />
  }
  return <span style={style} className={`${cls} flex items-center justify-center bg-muted text-[11px] font-semibold uppercase`}>
    {c.username.slice(0, 2)}</span>
}

/* ---------------------------------------------------------------- criteria */

function ChipGroup({ label, options, value, onChange, canEdit, format = (s: string) => s, capitalize }: {
  label: string; options: string[]; value: string[]; onChange: (v: string[]) => void; canEdit: boolean
  format?: (s: string) => string; capitalize?: boolean
}) {
  const [all, setAll] = useState(false)
  const merged = useMemo(() => Array.from(new Set([...value, ...options])), [value, options])
  if (!canEdit && value.length === 0) return null
  if (canEdit && merged.length === 0) return null
  const shown = canEdit ? (all ? merged : merged.slice(0, 10)) : value
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter(x => x !== o) : [...value, o])
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-20 shrink-0 text-xs text-muted-foreground">{label}</span>
      {canEdit && <Chip on={value.length === 0} onClick={() => onChange([])}>Any</Chip>}
      {shown.map(o => (
        <Chip key={o} on={value.includes(o)} disabled={!canEdit} onClick={canEdit ? () => toggle(o) : undefined}>
          <span className={capitalize ? "capitalize" : ""}>{format(o)}</span>
        </Chip>
      ))}
      {canEdit && merged.length > 10 && (
        <button type="button" onClick={() => setAll(a => !a)} className="px-1 text-xs text-muted-foreground underline-offset-2 hover:underline">
          {all ? "Fewer" : `${merged.length - 10} more`}
        </button>
      )}
    </div>
  )
}

function FollowerRange({ c, canEdit, onChange }: { c: ScoutCriteria; canEdit: boolean; onChange: (p: Partial<ScoutCriteria>) => void }) {
  const [min, setMin] = useState(c.min_followers ? compact(c.min_followers) : "")
  const [max, setMax] = useState(c.max_followers ? compact(c.max_followers) : "")
  if (!canEdit) {
    if (!c.min_followers && !c.max_followers) return null
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="w-20 shrink-0 text-xs text-muted-foreground">Followers</span>
        <Chip on disabled>{rangeText(c)}</Chip>
      </div>
    )
  }
  const preset = (lo: number | null, hi: number | null) => {
    setMin(lo ? compact(lo) : ""); setMax(hi ? compact(hi) : "")
    onChange({ min_followers: lo, max_followers: hi })
  }
  const typed = (which: "min" | "max", s: string) => {
    if (which === "min") setMin(s); else setMax(s)
    const n = parseCount(s)
    if (n !== undefined) onChange(which === "min" ? { min_followers: n } : { max_followers: n })
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-20 shrink-0 text-xs text-muted-foreground">Followers</span>
      {SIZE_PRESETS.map(([l, lo, hi]) => (
        <Chip key={l} on={c.min_followers === lo && c.max_followers === hi} onClick={() => preset(lo, hi)}>{l}</Chip>
      ))}
      <div className="flex items-center gap-1">
        <Input value={min} onChange={e => typed("min", e.target.value)} placeholder="Min" aria-label="Minimum followers"
               className="h-7 w-16 rounded-full px-2.5 text-xs" />
        <span className="text-xs text-muted-foreground">to</span>
        <Input value={max} onChange={e => typed("max", e.target.value)} placeholder="Max" aria-label="Maximum followers"
               className="h-7 w-16 rounded-full px-2.5 text-xs" />
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- WhatsApp lane */

function WhatsAppLane({ listId, plan, canEdit, saving, onSent }: {
  listId: string; plan: ScoutRosterPlan; canEdit: boolean; saving: boolean; onSent: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const { matching, already_alerted, to_send, sample } = plan.contacts
  const live = plan.open_call?.status === "live"
  const reason = !live ? "Open call is not live"
    : !plan.template_approved ? "Waiting for Meta to approve the alert template"
    : to_send === 0 ? (matching > 0 ? "Everyone matching has been alerted" : "Widen the criteria to reach more creators")
    : null
  useEffect(() => { if (reason) setConfirming(false) }, [reason])

  const send = async () => {
    setBusy(true)
    try {
      const r = await scoutApi.sendWhatsApp(listId)
      toast.success(`Campaign alert going out to ${r.data.queued} creators`, { description: "From our WhatsApp number, one at a time." })
      setConfirming(false); onSent()
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }

  const faces = sample.slice(0, 7)
  const rest = Math.max(0, matching - faces.length)
  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-background p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><MessageCircle className="h-4 w-4" /></span>
        <div>
          <p className="text-sm font-semibold">Your network on WhatsApp</p>
          <p className="text-xs text-muted-foreground">Creators we already have, matched by light analytics</p>
        </div>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <motion.p key={matching} initial={{ opacity: 0.4, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className={`text-4xl font-semibold tabular-nums tracking-tight ${saving ? "opacity-50" : ""}`}>
            {matching.toLocaleString()}
          </motion.p>
          <p className="text-sm text-muted-foreground">creators in your network match</p>
        </div>
        {faces.length > 0 && (
          <div className="flex items-center">
            <div className="flex -space-x-2.5">
              {faces.map((c, i) => (
                <motion.span key={c.username} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                             title={`@${c.username}${c.followers ? ` · ${compact(c.followers)}` : ""}`}>
                  <Face c={c} size={34} ring />
                </motion.span>
              ))}
            </div>
            {rest > 0 && <span className="ml-2 text-xs text-muted-foreground tabular-nums">+{compact(rest)}</span>}
          </div>
        )}
      </div>

      {sample.length > 0 && (
        <p className="truncate text-xs text-muted-foreground">
          {sample.slice(0, 3).map(c => `@${c.username}`).join(", ")}{matching > 3 ? ` and ${(matching - 3).toLocaleString()} more` : ""}
        </p>
      )}

      {already_alerted > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Check className="h-3.5 w-3.5 text-emerald-600" />{already_alerted.toLocaleString()} already alerted for this campaign
        </p>
      )}

      {canEdit && (
        <div className="mt-auto flex flex-col gap-1.5">
          <AnimatePresence mode="wait" initial={false}>
            {confirming ? (
              <motion.div key="confirm" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">Send to {to_send.toLocaleString()} now?</span>
                <Button size="sm" className="gap-1.5 rounded-full bg-[#d3ff02] px-4 text-[#111] hover:bg-[#c4ef00]" disabled={busy} onClick={send}>
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}Yes, send
                </Button>
                <Button size="sm" variant="ghost" className="rounded-full" disabled={busy} onClick={() => setConfirming(false)}>Cancel</Button>
              </motion.div>
            ) : (
              <motion.div key="send" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                <Button className="w-full gap-2 rounded-full bg-[#d3ff02] text-[#111] hover:bg-[#c4ef00] sm:w-auto sm:px-6"
                        disabled={!!reason || saving} onClick={() => setConfirming(true)}>
                  <Send className="h-4 w-4" />Send to {to_send.toLocaleString()}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          {reason && <p className="text-xs text-muted-foreground">{reason}</p>}
        </div>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- DM lane */

function Scanning({ note }: { note: string | null }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="relative flex h-6 w-6 items-center justify-center">
          <motion.span className="absolute inset-0 rounded-full bg-[#d3ff02]" animate={{ scale: [0.6, 1.4], opacity: [0.7, 0] }}
                       transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }} />
          <Radar className="relative h-4 w-4" />
        </span>
        <span className="font-medium">Finding new creators</span>
      </div>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div className="absolute inset-y-0 w-1/3 rounded-full bg-[#d3ff02]"
                    animate={{ left: ["-33%", "100%"] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />
      </div>
      {note && (
        <AnimatePresence mode="wait">
          <motion.p key={note} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="truncate text-xs text-muted-foreground">{note}</motion.p>
        </AnimatePresence>
      )}
    </div>
  )
}

function FindControl({ listId, running, onStarted }: { listId: string; running: boolean; onStarted: () => void }) {
  const [lookalikes, setLookalikes] = useState(true)
  const [tags, setTags] = useState<string[]>([])
  const [draft, setDraft] = useState("")
  const [maxNew, setMaxNew] = useState("200")
  const [busy, setBusy] = useState(false)
  const addTags = (s: string) => {
    const next = s.split(/[\s,]+/).map(t => t.replace(/^#+/, "").toLowerCase()).filter(Boolean)
    if (next.length) setTags(prev => Array.from(new Set([...prev, ...next])))
    setDraft("")
  }
  const go = async () => {
    const all = draft.trim() ? Array.from(new Set([...tags, ...draft.split(/[\s,]+/).map(t => t.replace(/^#+/, "").toLowerCase()).filter(Boolean)])) : tags
    setBusy(true)
    try {
      await scoutApi.source(listId, { lookalikes, hashtags: all, max_new: Number(maxNew) || 200 })
      toast.success("ScoutOutreach is looking", { description: "New creators appear here as they are light analysed." })
      setTags(all); setDraft(""); onStarted()
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  return (
    <div className="flex flex-col gap-3 rounded-xl border p-3">
      <label className="flex items-center justify-between gap-3 text-sm">
        <span>Look-alikes of creators who fit</span>
        <Switch checked={lookalikes} onCheckedChange={setLookalikes} />
      </label>
      <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border px-2 py-1.5 focus-within:border-foreground/40">
        <Hash className="h-3.5 w-3.5 text-muted-foreground" />
        {tags.map(t => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
            #{t}
            <button type="button" aria-label={`Remove ${t}`} onClick={() => setTags(p => p.filter(x => x !== t))}><X className="h-3 w-3" /></button>
          </span>
        ))}
        <input value={draft} placeholder={tags.length ? "" : "Hashtags, e.g. dubaifood, abudhabimoms"}
               onChange={e => { const v = e.target.value; if (/[\s,]$/.test(v)) addTags(v); else setDraft(v) }}
               onKeyDown={e => {
                 if (e.key === "Enter") { e.preventDefault(); addTags(draft) }
                 if (e.key === "Backspace" && !draft && tags.length) setTags(p => p.slice(0, -1))
               }}
               onBlur={() => draft.trim() && addTags(draft)}
               className="min-w-[8rem] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Up to</span>
        <Input inputMode="numeric" value={maxNew} onChange={e => setMaxNew(e.target.value.replace(/\D/g, "").slice(0, 4))}
               className="h-8 w-20 rounded-full text-center text-sm tabular-nums" aria-label="Maximum new creators" />
        <span className="text-xs text-muted-foreground">new creators</span>
        <Button size="sm" className="ml-auto gap-1.5 rounded-full bg-[#d3ff02] px-4 text-[#111] hover:bg-[#c4ef00]"
                disabled={busy || running || (!lookalikes && tags.length === 0 && !draft.trim())} onClick={go}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}Find
        </Button>
      </div>
    </div>
  )
}

function ProposedCard({ c, picked, onPick, canEdit }: { c: ScoutOutreachItem; picked: boolean; onPick: () => void; canEdit: boolean }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: -6, backgroundColor: "rgba(211,255,2,0.22)" }}
                animate={{ opacity: 1, y: 0, backgroundColor: "rgba(211,255,2,0)" }} exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5 }}
                className={`flex gap-3 rounded-xl border p-3 transition-colors ${picked ? "border-foreground" : "hover:border-foreground/25"}`}>
      {canEdit && <Checkbox checked={picked} onCheckedChange={onPick} className="mt-1" aria-label={`Select @${c.username}`} />}
      <Face c={c} size={44} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <a href={`https://instagram.com/${c.username}`} target="_blank" rel="noreferrer" className="truncate text-sm font-semibold hover:underline">
            @{c.username}
          </a>
          {c.full_name && <span className="truncate text-xs text-muted-foreground">{c.full_name}</span>}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
          <span><span className="font-semibold tabular-nums">{compact(c.followers)}</span> <span className="text-muted-foreground">followers</span></span>
          {c.engagement_rate != null && <span><span className="font-semibold tabular-nums">{Number(c.engagement_rate).toFixed(1)}%</span> <span className="text-muted-foreground">ER</span></span>}
          {c.city && <span className="inline-flex items-center gap-0.5 text-muted-foreground"><MapPin className="h-3 w-3" />{c.city.split(",")[0]}</span>}
        </div>
        {c.summary && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.summary}</p>}
        {(c.categories ?? []).length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {(c.categories ?? []).slice(0, 3).map(x => <span key={x} className="rounded-full bg-muted px-2 py-0.5 text-[11px] capitalize">{x}</span>)}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function DmBubble({ text, from }: { text: string; from: string | null }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-muted-foreground">What they receive{from ? ` from @${from}` : ""}</p>
      <div className="flex justify-end">
        <div className="max-w-[90%] whitespace-pre-line rounded-2xl rounded-br-md bg-foreground px-3.5 py-2.5 text-sm text-background shadow-sm">
          {text}
        </div>
      </div>
    </div>
  )
}

function LatestDms({ items }: { items: ScoutOutreachItem[] }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">Latest</p>
      <AnimatePresence initial={false}>
        {items.map(it => (
          <motion.div key={it.id} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5">
              <Face c={it} size={28} />
              <p className="min-w-0 flex-1 truncate text-sm">
                <span className="font-medium">@{it.username}</span>{" "}
                <span className="text-muted-foreground">
                  {it.status === "replied" ? "replied" : it.status === "sending" ? "sending now" : it.status === "failed" ? `not sent${it.error ? `: ${it.error}` : ""}` : "messaged"}
                </span>
              </p>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{ago(it.replied_at || it.sent_at)}</span>
            </div>
            {it.status === "replied" && it.reply_text && (
              <div className="ml-9 max-w-[85%] rounded-2xl rounded-bl-md bg-muted px-3 py-2 text-sm">{it.reply_text}</div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

const SHOW = 30

function DmLane({ listId, plan, canEdit, onChanged }: { listId: string; plan: ScoutRosterPlan; canEdit: boolean; onChanged: () => void }) {
  const [items, setItems] = useState<ScoutOutreachItem[]>([])
  const [picked, setPicked] = useState<Record<string, boolean>>({})
  const [showAll, setShowAll] = useState(false)
  const [busy, setBusy] = useState<"approve" | "skip" | null>(null)
  const { dm, sourcing, worker } = plan

  // Refetch the list only when the counts move, so polling the plan stays light.
  const sig = `${dm.proposed}|${dm.approved}|${dm.sent}|${dm.replied}|${dm.skipped}|${dm.failed}`
  const loadItems = useCallback(async () => {
    try { setItems((await scoutApi.outreach(listId, "all")).data.items || []) } catch { /* next change tries again */ }
  }, [listId])
  useEffect(() => { loadItems() }, [loadItems, sig])

  const proposed = useMemo(() => items.filter(i => i.status === "proposed"), [items])
  const latest = useMemo(() => items
    .filter(i => ["sending", "sent", "replied", "failed"].includes(i.status))
    .sort((a, b) => new Date(b.replied_at || b.sent_at || 0).getTime() - new Date(a.replied_at || a.sent_at || 0).getTime())
    .slice(0, 5), [items])
  const ids = useMemo(() => proposed.filter(p => picked[p.id]).map(p => p.id), [proposed, picked])
  const allPicked = proposed.length > 0 && ids.length === proposed.length

  const decide = async (decision: "approve" | "skip") => {
    setBusy(decision)
    try {
      const r = await scoutApi.decide(ids, decision)
      toast.success(decision === "approve" ? `${r.data.updated} approved, the bot sends them at human pace` : `${r.data.updated} skipped`)
      setPicked({}); await loadItems(); onChanged()
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(null) }
  }

  const waiting = dm.approved
  const queue: [string, number][] = [["Waiting to send", waiting], ["Sent", dm.sent], ["Replied", dm.replied]]
  const hasQueue = waiting + dm.sent + dm.replied + dm.failed > 0

  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-background p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"><Instagram className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">New creators by Instagram DM</p>
          <p className="text-xs text-muted-foreground">Found, light analysed, approved by you, sent by the bot</p>
        </div>
        <WorkerPill w={worker} />
      </div>

      {canEdit && <FindControl listId={listId} running={sourcing.running} onStarted={onChanged} />}
      <AnimatePresence>
        {sourcing.running && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Scanning note={sourcing.last_note} />
          </motion.div>
        )}
      </AnimatePresence>
      {!sourcing.running && sourcing.last_note && <p className="text-xs text-muted-foreground">{sourcing.last_note}</p>}

      {proposed.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && <Checkbox checked={allPicked} aria-label="Select all"
                                  onCheckedChange={() => setPicked(allPicked ? {} : Object.fromEntries(proposed.map(p => [p.id, true])))} />}
            <span className="text-sm font-medium tabular-nums">{proposed.length} proposed</span>
            {canEdit && (
              <div className="ml-auto flex gap-1.5">
                <Button size="sm" variant="ghost" className="h-8 rounded-full" disabled={!ids.length || !!busy} onClick={() => decide("skip")}>
                  {busy === "skip" && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}Skip
                </Button>
                <Button size="sm" className="h-8 gap-1.5 rounded-full bg-[#d3ff02] px-4 text-[#111] hover:bg-[#c4ef00]"
                        disabled={!ids.length || !!busy} onClick={() => decide("approve")}>
                  {busy === "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}Approve {ids.length || ""}
                </Button>
              </div>
            )}
          </div>
          <div className="flex max-h-[460px] flex-col gap-2 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {(showAll ? proposed : proposed.slice(0, SHOW)).map(c => (
                <ProposedCard key={c.id} c={c} canEdit={canEdit} picked={!!picked[c.id]}
                              onPick={() => setPicked(p => ({ ...p, [c.id]: !p[c.id] }))} />
              ))}
            </AnimatePresence>
            {!showAll && proposed.length > SHOW && (
              <Button variant="outline" size="sm" className="self-center rounded-full" onClick={() => setShowAll(true)}>
                Show all {proposed.length}
              </Button>
            )}
          </div>
        </div>
      )}

      {hasQueue && (
        <div className="grid grid-cols-3 gap-2">
          {queue.map(([l, n]) => (
            <div key={l} className="rounded-lg bg-muted/50 px-2 py-2 text-center">
              <p className="text-lg font-semibold tabular-nums">{n.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
      )}
      {dm.failed > 0 && <p className="text-xs text-red-600">{dm.failed} could not be sent</p>}

      {latest.length > 0 && <LatestDms items={latest} />}
      {plan.dm_message_preview && <DmBubble text={plan.dm_message_preview} from={worker.ig_username} />}
    </div>
  )
}

/* ---------------------------------------------------------------- the two lanes */

export function ScoutOutreachLanes({ listId, canEdit }: { listId: string; canEdit: boolean }) {
  const [plan, setPlan] = useState<ScoutRosterPlan | null>(null)
  const [criteria, setCriteria] = useState<ScoutCriteria | null>(null)
  const [saving, setSaving] = useState(false)
  const dirty = useRef(false)
  const saveSeq = useRef(0)

  const load = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return
    try {
      const p = (await scoutApi.plan(listId)).data
      setPlan(p)
      setCriteria(c => (c && dirty.current ? c : p.criteria))
    } catch { /* the roster still works without it */ }
  }, [listId])
  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t) }, [load])

  // Save criteria a moment after the last change, then recount.
  useEffect(() => {
    if (!criteria || !dirty.current) return
    const seq = ++saveSeq.current
    setSaving(true)
    const t = setTimeout(async () => {
      try {
        const r = await scoutApi.setCriteria(listId, criteria)
        if (seq !== saveSeq.current) return
        setPlan(p => p ? { ...p, criteria, contacts: { ...p.contacts, matching: r.data.matching, to_send: r.data.to_send } } : p)
        dirty.current = false
        load()
      } catch (e) { toast.error((e as Error).message) } finally { if (seq === saveSeq.current) setSaving(false) }
    }, 500)
    return () => clearTimeout(t)
  }, [criteria, listId, load])

  const edit = (p: Partial<ScoutCriteria>) => { dirty.current = true; setCriteria(c => (c ? { ...c, ...p } : c)) }

  if (!plan || !criteria) return null
  const opts = plan.criteria_options
  const anyCriteria = criteria.cities.length || criteria.categories.length || criteria.languages.length || criteria.min_followers || criteria.max_followers

  return (
    <div className="flex flex-col gap-4 border-t pt-4">
      {(canEdit || anyCriteria) && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">Who fits this campaign</p>
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </div>
          <ChipGroup label="City" options={opts.cities} value={criteria.cities} canEdit={canEdit}
                     onChange={v => edit({ cities: v })} format={s => s.split(",")[0]} />
          <FollowerRange c={criteria} canEdit={canEdit} onChange={edit} />
          <ChipGroup label="Category" options={opts.categories} value={criteria.categories} canEdit={canEdit}
                     onChange={v => edit({ categories: v })} capitalize />
          <ChipGroup label="Language" options={opts.languages} value={criteria.languages} canEdit={canEdit}
                     onChange={v => edit({ languages: v })} format={langName} />
        </div>
      )}
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <WhatsAppLane listId={listId} plan={plan} canEdit={canEdit} saving={saving} onSent={load} />
        <DmLane listId={listId} plan={plan} canEdit={canEdit} onChanged={load} />
      </div>
    </div>
  )
}
