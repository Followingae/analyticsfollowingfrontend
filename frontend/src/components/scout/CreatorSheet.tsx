"use client"

/**
 * One creator in full, from anywhere on ScoutOutreach: who they are, and every step of every
 * outreach to them (DMs, clicks, chats, applications, reviews) in order, with each chat's
 * transcript a click away. Founders DM them about a campaign or add them to the database.
 */
import * as React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  BadgeCheck, Check, ChevronDown, Database, Instagram, Loader2, Mail, MapPin, MessageCircle, MousePointerClick,
  Send, Smartphone, Sparkles, Star, Wand2, XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { openCallsApi } from "@/services/openCallsApi"
import { scoutApi, type ScoutCampaign, type ScoutCreatorDetail } from "@/services/scoutApi"
import { DmAboutMenu } from "./DmAboutMenu"
import { compact } from "./WorkerPill"
import { eventText, when } from "./scoutText"

type Conv = ScoutCreatorDetail["conversations"][number]
/** `at` is shown; `sortAt` only orders (for steps whose own time we do not hold). */
type Item = { key: string; at: string | null; sortAt?: string | null; icon: React.ReactNode; title: string; sub?: string | null
              quote?: string | null; tone?: "good" | "bad"; conv?: Conv }

function creatorEventText(e: ScoutCreatorDetail["events"][number]): string {
  switch (e.kind) {
    case "found": return `Found${e.channel ? ` via ${e.channel}` : ""}`
    case "light_analysed": return "Checked by Scout"
    case "added_to_database": return "Added to the database"
    default: return eventText(e)
  }
}

const LANG_NAMES: Record<string, string> = {
  en: "English", ar: "Arabic", arabizi: "Arabizi", hi: "Hindi", ur: "Urdu", tl: "Tagalog", ru: "Russian", fr: "French",
}
const ico = "h-3.5 w-3.5"

function buildTimeline(d: ScoutCreatorDetail): Item[] {
  const items: Item[] = []
  for (const o of d.outreach) {
    const about = o.list_name || (o.list_id ? "a campaign" : "General outreach")
    const wa = o.channel === "whatsapp"
    if (!o.sent_at && ["proposed", "approved", "sending"].includes(o.status)) {
      items.push({ key: `q-${o.id}`, at: null, icon: <Send className={ico} />, sub: about,
                   title: o.status === "proposed" ? "Proposed, waiting for approval" : o.status === "sending" ? "Sending now" : "Queued for the bot" })
    }
    if (o.status === "failed") items.push({ key: `f-${o.id}`, at: o.sent_at, icon: <XCircle className={ico} />, title: "Could not send", sub: about, tone: "bad" })
    if (o.sent_at && o.status !== "failed") {
      items.push({ key: `s-${o.id}`, at: o.sent_at, icon: wa ? <MessageCircle className={ico} /> : <Instagram className={ico} />,
                   title: wa ? "Campaign alert sent on WhatsApp" : "DM sent on Instagram", sub: about, quote: o.message })
    }
    if (o.clicked_at) {
      items.push({ key: `c-${o.id}`, at: o.clicked_at, icon: <MousePointerClick className={ico} />, sub: about,
                   title: `Clicked the link${o.clicks && o.clicks > 1 ? ` ×${o.clicks}` : ""}` })
    }
    if (o.replied_at) items.push({ key: `r-${o.id}`, at: o.replied_at, icon: <MessageCircle className={ico} />, title: "Replied", sub: about, quote: o.reply_text })
  }
  for (const c of d.conversations) {
    const about = c.list_name || c.title
    items.push({ key: `chat-${c.id}`, at: c.created_at, icon: <MessageCircle className={ico} />, title: "Chat started with ScoutAI", sub: about, conv: c })
    // Real times where the backend holds them; otherwise ordered by the chat, with no time shown.
    const s = c.last_inbound_at || c.created_at
    const applied = c.applied_at || null
    const fitAt = applied || s
    const reviewed = c.reviewed_at || null
    if (applied || c.state === "done") items.push({ key: `ap-${c.id}`, at: applied, sortAt: s, icon: <Check className={ico} />, title: "Applied", sub: about })
    if (c.fit === "fits") items.push({ key: `fit-${c.id}`, at: null, sortAt: fitAt, icon: <Star className={ico} />, title: "Relevant applicant", sub: about, tone: "good" })
    if (c.fit === "screened_out") items.push({ key: `fit-${c.id}`, at: null, sortAt: fitAt, icon: <XCircle className={ico} />, title: "Did not fit the brief", sub: about, tone: "bad" })
    if (c.review === "shortlisted" || c.review === "approved") items.push({ key: `rv-${c.id}`, at: reviewed, sortAt: s, icon: <Star className={ico} />, title: c.review === "approved" ? "Approved" : "Shortlisted", sub: about, tone: "good" })
    if (c.review === "passed") items.push({ key: `rv-${c.id}`, at: reviewed, sortAt: s, icon: <XCircle className={ico} />, title: "Passed", sub: about, tone: "bad" })
  }
  const covered = new Set<string>()
  if (d.outreach.length) { covered.add("contacted"); covered.add("replied") }
  if (d.conversations.length) { covered.add("applied"); covered.add("relevant") }
  for (const e of d.events) {
    if (covered.has(e.kind)) continue
    items.push({ key: `e-${e.id}`, at: e.created_at, title: creatorEventText(e),
                 icon: e.kind === "added_to_database" ? <Database className={ico} /> : e.kind === "light_analysed" ? <Sparkles className={ico} />
                   : e.kind === "in_proposal" || e.kind === "shortlisted" ? <Star className={ico} /> : <Wand2 className={ico} />,
                 tone: e.kind === "warning" ? "bad" : e.kind === "added_to_database" || e.kind === "in_proposal" ? "good" : undefined })
  }
  // Oldest first, so it reads as the story of this creator; pending steps last.
  const t = (i: Item) => { const v = i.at || i.sortAt; return v ? new Date(v).getTime() : Infinity }
  return items.map((it, i) => ({ it, i })).sort((a, b) => (t(a.it) - t(b.it)) || (a.i - b.i)).map(x => x.it)
}

function Transcript({ cid }: { cid: string }) {
  const [d, setD] = useState<Awaited<ReturnType<typeof openCallsApi.conversation>>["data"] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => {
    openCallsApi.conversation(cid).then(r => setD(r.data)).catch(e => setErr((e as Error).message))
  }, [cid])
  if (err) return <p className="text-xs text-red-600">{err}</p>
  if (!d) return <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-muted/30 p-3">
      {(d.phone || d.email) && (
        <p className="text-[11px] text-muted-foreground">{[d.phone, d.email].filter(Boolean).join(" · ")}</p>
      )}
      {d.messages.map((m, i) => (
        <div key={i} className={`flex flex-col ${m.direction === "out" ? "items-end" : "items-start"}`}>
          <div className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${m.direction === "out"
            ? "rounded-br-md bg-foreground text-background" : "rounded-bl-md border bg-background"}`}>{m.body}</div>
          <span className="mt-0.5 px-1 text-[10px] text-muted-foreground">{m.author ? `${m.author} · ` : ""}{when(m.created_at)}</span>
        </div>
      ))}
    </div>
  )
}

function TimelineRow({ it, last }: { it: Item; last: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative flex gap-3 pb-4">
      {!last && <span className="absolute left-[13px] top-7 h-[calc(100%-1.5rem)] w-px bg-border" />}
      <span className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-background ${it.tone === "good"
        ? "border-emerald-300 text-emerald-700" : it.tone === "bad" ? "border-red-300 text-red-600" : ""}`}>{it.icon}</span>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-baseline gap-2">
          <p className="min-w-0 flex-1 text-sm font-medium">{it.title}</p>
          {it.at && <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">{when(it.at)}</span>}
        </div>
        {it.sub && <p className="text-xs text-muted-foreground">{it.sub}</p>}
        {it.quote && <p className="mt-1.5 line-clamp-4 whitespace-pre-line rounded-xl bg-muted/50 px-3 py-2 text-xs">{it.quote}</p>}
        {it.conv && (
          <>
            <button type="button" onClick={() => setOpen(o => !o)}
                    className="mt-1.5 inline-flex items-center gap-1 text-xs underline-offset-2 hover:underline">
              {open ? "Hide the chat" : "Read the chat"}<ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="mt-2 overflow-hidden"><Transcript cid={it.conv.id} /></motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  )
}

function Stat({ v, l }: { v: string; l: string }) {
  return <div><p className="text-lg font-semibold tabular-nums">{v}</p><p className="text-[11px] text-muted-foreground">{l}</p></div>
}

export function CreatorSheet({ username, onClose, canEdit, campaigns, onChanged }: {
  username: string | null; onClose: () => void; canEdit: boolean; campaigns: ScoutCampaign[]; onChanged?: () => void
}) {
  const [d, setD] = useState<ScoutCreatorDetail | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [bad, setBad] = useState(false)

  const load = useCallback(async (u: string) => {
    try { setD((await scoutApi.creator(u)).data); setErr(null) } catch (e) { setErr((e as Error).message) }
  }, [])
  useEffect(() => { setD(null); setErr(null); setBad(false); if (username) load(username) }, [username, load])

  const timeline = useMemo(() => (d ? buildTimeline(d) : []), [d])

  const addToDb = async () => {
    if (!d) return
    setAdding(true)
    try {
      const r = await scoutApi.addToDatabase([d.creator.username])
      if (r.data.added.length) toast.success(`@${d.creator.username} added to the database`, { description: "Main analytics has started." })
      else if (r.data.already_in_database.length) toast.success("Already in the database")
      else toast.error(r.data.failed[0]?.reason || "Could not add")
      load(d.creator.username); onChanged?.()
    } catch (e) { toast.error((e as Error).message) } finally { setAdding(false) }
  }

  const c = d?.creator
  const place = c ? [c.city?.split(",")[0], c.country].filter(Boolean).join(", ") : ""
  const stats: [string, string][] = c ? ([
    [c.followers != null ? compact(c.followers) : "", "followers"],
    [c.engagement_rate != null ? `${Number(c.engagement_rate).toFixed(1)}%` : "", "engagement"],
    [c.avg_views ? compact(Math.round(Number(c.avg_views))) : "", "avg views"],
    [c.posts_per_week != null ? Number(c.posts_per_week).toFixed(1) : "", "posts a week"],
  ] as [string, string][]).filter(([v]) => v) : []

  return (
    <Sheet open={!!username} onOpenChange={(o: boolean) => { if (!o) onClose() }}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl">
        <SheetTitle className="sr-only">{username ? `@${username}` : "Creator"}</SheetTitle>
        <SheetDescription className="sr-only">Creator detail and outreach timeline</SheetDescription>
        {err && <p className="p-6 text-sm text-red-600">{err}</p>}
        {!c && !err && <div className="flex flex-1 items-center justify-center py-24"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
        {c && (
          <div className="flex flex-col gap-6 p-6">
            <div className="flex items-start gap-4 pr-6">
              {c.avatar && !bad
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={c.avatar} alt="" onError={() => setBad(true)} className="h-16 w-16 shrink-0 rounded-full object-cover" />
                : <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-semibold uppercase">{(c.username || c.full_name || "?").slice(0, 2)}</span>}
              <div className="min-w-0 flex-1">
                <a href={`https://instagram.com/${c.username}`} target="_blank" rel="noreferrer"
                   className="flex items-center gap-1 truncate text-lg font-semibold hover:underline">
                  @{c.username}{c.is_creator && <BadgeCheck className="h-4 w-4 shrink-0 text-sky-500" />}
                </a>
                {c.full_name && <p className="truncate text-sm text-muted-foreground">{c.full_name}</p>}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.on_app && <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px]"><Smartphone className="h-3 w-3" />On app</span>}
                  {c.in_database && <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-[11px] text-background"><Database className="h-3 w-3" />In database</span>}
                  {c.whatsapp && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700"><MessageCircle className="h-3 w-3" />WhatsApp contact</span>}
                </div>
              </div>
            </div>

            {stats.length > 0 && (
              <div className="grid grid-cols-4 gap-3 rounded-2xl border p-4">{stats.map(([v, l]) => <Stat key={l} v={v} l={l} />)}</div>
            )}

            {(place || (c.categories?.length ?? 0) > 0 || (c.languages?.length ?? 0) > 0 || c.public_email) && (
              <div className="flex flex-wrap gap-1.5">
                {place && <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs"><MapPin className="h-3 w-3" />{place}</span>}
                {(c.categories || []).map(x => <span key={x} className="rounded-full bg-muted px-2.5 py-1 text-xs capitalize">{x}</span>)}
                {(c.languages || []).map(x => <span key={x} className="rounded-full bg-muted px-2.5 py-1 text-xs">{LANG_NAMES[x.toLowerCase()] || x.toUpperCase()}</span>)}
                {c.public_email && <a href={`mailto:${c.public_email}`} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs hover:underline"><Mail className="h-3 w-3" />{c.public_email}</a>}
              </div>
            )}

            {canEdit && (
              <div className="flex flex-wrap gap-2">
                <DmAboutMenu usernames={[c.username]} campaigns={campaigns} size="default" className="px-5"
                             onDone={() => { load(c.username); onChanged?.() }} />
                {!c.in_database && (
                  <Button variant="outline" className="gap-1.5 rounded-full" disabled={adding} onClick={addToDb}>
                    {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}Add to Database
                  </Button>
                )}
              </div>
            )}

            {(c.summary || c.biography) && (
              <div className="flex flex-col gap-2">
                {c.summary && <p className="text-sm leading-relaxed">{c.summary}</p>}
                {c.biography && <p className="whitespace-pre-line text-xs text-muted-foreground">{c.biography}</p>}
              </div>
            )}

            {timeline.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold">Outreach timeline</p>
                <div>{timeline.map((it, i) => <TimelineRow key={it.key} it={it} last={i === timeline.length - 1} />)}</div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
