"use client"

/**
 * The whole creator network: the Creator database plus everyone light analytics has found.
 * Cards, not a spreadsheet. Pick one or many and Add to Database (main analytics), founders only.
 */
import * as React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { BadgeCheck, Check, Database, Loader2, Mail, MapPin, Search, Smartphone, Sparkles, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { scoutApi, type NetworkCreator, type NetworkQuery } from "@/services/scoutApi"

const CATEGORIES = ["fashion", "beauty", "lifestyle", "food", "travel", "fitness", "tech", "gaming", "business",
  "entertainment", "education", "automotive", "luxury", "family"]
const LANGS: [string, string][] = [["en", "English"], ["ar", "Arabic"], ["arabizi", "Arabizi"], ["hi", "Hindi"],
  ["ur", "Urdu"], ["tl", "Tagalog"], ["ru", "Russian"], ["fr", "French"]]
const SIZES: [string, number | undefined, number | undefined][] = [["Any size", undefined, undefined],
  ["2K to 10K", 2000, 10000], ["10K to 50K", 10000, 50000], ["50K to 250K", 50000, 250000], ["250K+", 250000, undefined]]

function compact(n?: number | null) {
  if (n == null) return "–"
  return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 100) / 10}K` : String(n)
}

function Chip({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition ${on
              ? "border-foreground bg-foreground text-background" : "hover:border-foreground/40"}`}>
      {children}
    </button>
  )
}

function Avatar({ c }: { c: NetworkCreator }) {
  const [bad, setBad] = useState(false)
  if (c.avatar && !bad) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={c.avatar} alt="" onError={() => setBad(true)} className="h-14 w-14 rounded-full object-cover" />
  }
  return <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-sm font-semibold uppercase">
    {c.username.slice(0, 2)}</span>
}

function CreatorCard({ c, picked, onPick, canPick }: { c: NetworkCreator; picked: boolean; onPick: () => void; canPick: boolean }) {
  const place = [c.city?.split(",")[0], c.country].filter(Boolean).join(", ")
  return (
    <div className={`group relative flex flex-col gap-3 rounded-2xl border bg-background p-4 transition ${picked
      ? "border-foreground" : "hover:border-foreground/25"}`}>
      {canPick && c.stage === "light" && (
        <Checkbox checked={picked} onCheckedChange={onPick} className="absolute right-3 top-3" aria-label="Select" />
      )}
      <div className="flex items-center gap-3">
        <Avatar c={c} />
        <div className="min-w-0 flex-1 pr-6">
          <a href={`https://instagram.com/${c.username}`} target="_blank" rel="noreferrer"
             className="flex items-center gap-1 truncate text-sm font-semibold hover:underline">
            @{c.username}{c.is_verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-sky-500" />}
          </a>
          {c.full_name && <p className="truncate text-xs text-muted-foreground">{c.full_name}</p>}
          <div className="mt-1 flex flex-wrap gap-1">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${c.stage === "database"
              ? "bg-foreground text-background" : "bg-[#d3ff02] text-[#111]"}`}>
              {c.stage === "database" ? <><Database className="h-3 w-3" />Database</> : <><Sparkles className="h-3 w-3" />Light</>}
            </span>
            {c.on_app && <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px]">
              <Smartphone className="h-3 w-3" />On app</span>}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div><p className="text-base font-semibold tabular-nums">{compact(c.followers_count)}</p><p className="text-[11px] text-muted-foreground">followers</p></div>
        <div><p className="text-base font-semibold tabular-nums">{c.engagement_rate != null ? `${Number(c.engagement_rate).toFixed(1)}%` : "–"}</p>
          <p className="text-[11px] text-muted-foreground">{c.stage === "light" ? "est. engagement" : "engagement"}</p></div>
        <div><p className="text-base font-semibold tabular-nums">{c.avg_views ? compact(Math.round(Number(c.avg_views))) : "–"}</p>
          <p className="text-[11px] text-muted-foreground">avg views</p></div>
      </div>
      {c.ai_summary && <p className="line-clamp-2 text-xs text-muted-foreground">{c.ai_summary}</p>}
      <div className="mt-auto flex flex-wrap gap-1.5">
        {place && <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px]"><MapPin className="h-3 w-3" />{place}</span>}
        {(c.categories || []).slice(0, 3).map(x => <span key={x} className="rounded-full bg-muted px-2 py-0.5 text-[11px] capitalize">{x}</span>)}
        {(c.languages || []).slice(0, 2).map(x => <span key={x} className="rounded-full bg-muted px-2 py-0.5 text-[11px] uppercase">{x}</span>)}
        {c.public_email && <span title={typeof c.public_email === "string" ? c.public_email : "Has a public email"}
                                 className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px]"><Mail className="h-3 w-3" />email</span>}
        {c.nationality && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{c.nationality}</span>}
      </div>
    </div>
  )
}

export function NetworkBrowser({ defaultSegment = "all", canAdd, compactHeader }: {
  defaultSegment?: NetworkQuery["segment"]; canAdd: boolean; compactHeader?: boolean
}) {
  const [q, setQ] = useState<NetworkQuery>({ segment: defaultSegment, sort: "followers", page_size: 48 })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [rows, setRows] = useState<NetworkCreator[]>([])
  const [total, setTotal] = useState(0)
  const [segments, setSegments] = useState<{ database: number; light: number; app: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [picked, setPicked] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState(false)

  const load = useCallback(async (query: NetworkQuery, append = false) => {
    setLoading(true)
    try {
      const r = await scoutApi.network(query)
      setRows(prev => append ? [...prev, ...r.data.creators] : r.data.creators)
      setTotal(r.data.total)
      setSegments(r.data.segments)
    } catch (e) { toast.error((e as Error).message || "Could not load creators") } finally { setLoading(false) }
  }, [])
  useEffect(() => { setPage(1); load({ ...q, page: 1 }) }, [q, load])
  useEffect(() => {
    const t = setTimeout(() => setQ(p => (p.search || "") === search ? p : { ...p, search }), 350)
    return () => clearTimeout(t)
  }, [search])

  const set = (p: Partial<NetworkQuery>) => setQ(prev => ({ ...prev, ...p }))
  const ids = useMemo(() => Object.keys(picked).filter(k => picked[k]), [picked])
  const size = SIZES.findIndex(s => s[1] === q.min_followers && s[2] === q.max_followers)

  const add = async () => {
    setBusy(true)
    try {
      const r = await scoutApi.addToDatabase(ids)
      toast.success(`${r.data.added.length} added to the database`, {
        description: [r.data.added.length ? "Main analytics has started for them." : "",
                      r.data.already_in_database.length ? `${r.data.already_in_database.length} were already there.` : "",
                      r.data.failed.length ? `${r.data.failed.length} could not be added.` : ""].filter(Boolean).join(" ") || undefined,
      })
      setPicked({}); setPage(1); load({ ...q, page: 1 })
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border bg-background p-4">
        <div className="flex flex-wrap items-center gap-2">
          {([["all", "All creators", segments ? segments.database + segments.light : null], ["database", "Database", segments?.database],
             ["light", "Light analytics", segments?.light], ["app", "App creators", segments?.app]] as const).map(([k, label, n]) => (
            <Chip key={k} on={q.segment === k} onClick={() => set({ segment: k })}>
              {label}{n != null && <span className="ml-1 opacity-60 tabular-nums">{Number(n).toLocaleString()}</span>}
            </Chip>
          ))}
          <div className="relative ml-auto w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Handle or name" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s, i) => <Chip key={s[0]} on={size === i || (i === 0 && size === -1 && !q.min_followers)}
                                     onClick={() => set({ min_followers: s[1], max_followers: s[2] })}>{s[0]}</Chip>)}
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip on={!q.category} onClick={() => set({ category: undefined })}>Any category</Chip>
          {CATEGORIES.map(c => <Chip key={c} on={q.category === c} onClick={() => set({ category: q.category === c ? undefined : c })}>
            <span className="capitalize">{c}</span></Chip>)}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Input placeholder="Country code, e.g. AE" value={q.country || ""} onChange={e => set({ country: e.target.value || undefined })} />
          <Input placeholder="City, e.g. Abu Dhabi" value={q.city || ""} onChange={e => set({ city: e.target.value || undefined })} />
          <Input placeholder="Keywords in bio, e.g. mom, brunch" value={q.keywords || ""} onChange={e => set({ keywords: e.target.value || undefined })} />
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={q.language || ""}
                  onChange={e => set({ language: e.target.value || undefined })}>
            <option value="">Any language</option>
            {LANGS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={q.sort}
                  onChange={e => set({ sort: e.target.value as NetworkQuery["sort"] })}>
            <option value="followers">Most followers</option>
            <option value="engagement">Highest engagement</option>
            <option value="newest">Newest found</option>
            <option value="name">Handle A to Z</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip on={!!q.has_email} onClick={() => set({ has_email: q.has_email ? undefined : true })}><Mail className="mr-1 inline h-3 w-3" />Has a public email</Chip>
          <span className="ml-auto text-sm text-muted-foreground tabular-nums">{total.toLocaleString()} creators</span>
        </div>
      </div>

      {rows.length === 0 && !loading ? (
        <p className="py-20 text-center text-sm text-muted-foreground">No creators match these filters.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {rows.map(c => <CreatorCard key={`${c.stage}-${c.id}`} c={c} canPick={canAdd}
                                      picked={!!picked[c.username]} onPick={() => setPicked(p => ({ ...p, [c.username]: !p[c.username] }))} />)}
        </div>
      )}
      {loading && <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
      {!loading && rows.length < total && (
        <Button variant="outline" className="self-center rounded-full" onClick={() => {
          const next = page + 1; setPage(next); load({ ...q, page: next }, true)
        }}>Show more</Button>
      )}

      {ids.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border bg-background/95 py-1.5 pl-4 pr-1.5 shadow-lg backdrop-blur">
          <span className="text-sm font-medium tabular-nums">{ids.length} selected</span>
          <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setPicked({})}><X className="h-3.5 w-3.5" /></Button>
          <Button size="sm" className="gap-1.5 rounded-full bg-[#111] text-white hover:bg-black" disabled={busy} onClick={add}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}Add {ids.length} to Database
          </Button>
        </div>
      )}
    </div>
  )
}
