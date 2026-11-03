"use client"

/**
 * Small pieces of a campaign's outreach: the criteria chips, the scanning state and a found
 * creator's card. Used by the open campaign in ScoutOutreach.
 */
import * as React from "react"
import { useMemo, useState } from "react"
import { motion } from "motion/react"
import { MapPin, Radar } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import type { ScoutCreator, ScoutCriteria, ScoutOutreachItem } from "@/services/scoutApi"
import { compact } from "./WorkerPill"

const LANG_NAMES: Record<string, string> = {
  en: "English", ar: "Arabic", arabizi: "Arabizi", hi: "Hindi", ur: "Urdu", tl: "Tagalog", ru: "Russian", fr: "French",
}
export const langName = (c: string) => LANG_NAMES[c.toLowerCase()] || c.toUpperCase()

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

export function rangeText(c: ScoutCriteria) {
  if (c.min_followers && c.max_followers) return `${compact(c.min_followers)} to ${compact(c.max_followers)} followers`
  if (c.min_followers) return `${compact(c.min_followers)}+ followers`
  if (c.max_followers) return `Up to ${compact(c.max_followers)} followers`
  return ""
}

/** "Creators in Dubai · 10K to 500K followers · lifestyle, food · English" */
export function criteriaSentence(c: ScoutCriteria) {
  const list = (xs: string[]) => xs.length <= 3 ? xs.join(", ") : `${xs.slice(0, 3).join(", ")} and ${xs.length - 3} more`
  const parts = [
    c.cities.length ? `Creators in ${list(c.cities.map(x => x.split(",")[0]))}` : "Creators anywhere",
    rangeText(c),
    c.categories.length ? list(c.categories) : "",
    c.languages.length ? list(c.languages.map(langName)) : "",
  ].filter(Boolean)
  return parts.join(" · ")
}

export function Chip({ on, children, onClick, disabled }: { on: boolean; children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
            className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs transition ${on
              ? "border-foreground bg-foreground text-background" : "bg-background hover:border-foreground/40"} disabled:cursor-default`}>
      {children}
    </button>
  )
}

export function Face({ c, size = 40, ring = false }: { c: Pick<ScoutCreator, "avatar" | "username">; size?: number; ring?: boolean }) {
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

export function ChipGroup({ label, options, value, onChange, format = (s: string) => s, capitalize }: {
  label: string; options: string[]; value: string[]; onChange: (v: string[]) => void
  format?: (s: string) => string; capitalize?: boolean
}) {
  const [all, setAll] = useState(false)
  const merged = useMemo(() => Array.from(new Set([...value, ...options])), [value, options])
  if (merged.length === 0) return null
  const shown = all ? merged : merged.slice(0, 10)
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter(x => x !== o) : [...value, o])
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-20 shrink-0 text-xs text-muted-foreground">{label}</span>
      <Chip on={value.length === 0} onClick={() => onChange([])}>Any</Chip>
      {shown.map(o => (
        <Chip key={o} on={value.includes(o)} onClick={() => toggle(o)}>
          <span className={capitalize ? "capitalize" : ""}>{format(o)}</span>
        </Chip>
      ))}
      {merged.length > 10 && (
        <button type="button" onClick={() => setAll(a => !a)} className="px-1 text-xs text-muted-foreground underline-offset-2 hover:underline">
          {all ? "Fewer" : `${merged.length - 10} more`}
        </button>
      )}
    </div>
  )
}

export function FollowerRange({ c, onChange }: { c: ScoutCriteria; onChange: (p: Partial<ScoutCriteria>) => void }) {
  const [min, setMin] = useState(c.min_followers ? compact(c.min_followers) : "")
  const [max, setMax] = useState(c.max_followers ? compact(c.max_followers) : "")
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

export function Scanning({ note }: { note: string | null }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="relative flex h-6 w-6 items-center justify-center">
          <motion.span className="absolute inset-0 rounded-full bg-[#d3ff02]" animate={{ scale: [0.6, 1.4], opacity: [0.7, 0] }}
                       transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }} />
          <Radar className="relative h-4 w-4" />
        </span>
        <span className="font-medium">Searching</span>
      </div>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div className="absolute inset-y-0 w-1/3 rounded-full bg-[#d3ff02]"
                    animate={{ left: ["-33%", "100%"] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />
      </div>
      {note && <p className="truncate text-xs text-muted-foreground">{note}</p>}
    </div>
  )
}

export function ProposedCard({ c, picked, onPick, canEdit, onOpen }: {
  c: ScoutOutreachItem; picked: boolean; onPick: () => void; canEdit: boolean; onOpen?: () => void
}) {
  return (
    <motion.div layout initial={{ opacity: 0, y: -6, backgroundColor: "rgba(211,255,2,0.22)" }}
                animate={{ opacity: 1, y: 0, backgroundColor: "rgba(211,255,2,0)" }} exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5 }} onClick={onOpen}
                className={`flex gap-3 rounded-xl border p-3 transition-colors ${onOpen ? "cursor-pointer" : ""} ${picked ? "border-foreground" : "hover:border-foreground/25"}`}>
      {canEdit && <Checkbox checked={picked} onCheckedChange={onPick} onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            className="mt-1" aria-label={`Select @${c.username}`} />}
      <Face c={c} size={44} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-sm font-semibold">@{c.username}</span>
          {c.full_name && <span className="truncate text-xs text-muted-foreground">{c.full_name}</span>}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
          <span><span className="font-semibold tabular-nums">{compact(c.followers)}</span> <span className="text-muted-foreground">followers</span></span>
          {c.engagement_rate != null && <span><span className="font-semibold tabular-nums">{Number(c.engagement_rate).toFixed(1)}%</span> <span className="text-muted-foreground">ER</span></span>}
          {c.city && <span className="inline-flex items-center gap-0.5 text-muted-foreground"><MapPin className="h-3 w-3" />{c.city.split(",")[0]}</span>}
        </div>
        {c.summary && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.summary}</p>}
        {(c.categories?.length ?? 0) > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {(c.categories || []).slice(0, 3).map(x => <span key={x} className="rounded-full bg-muted px-2 py-0.5 text-[11px] capitalize">{x}</span>)}
          </div>
        )}
      </div>
    </motion.div>
  )
}
