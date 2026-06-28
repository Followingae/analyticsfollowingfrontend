"use client"

// Presentational AI-snapshot view shared by the campaign progress panel (and usable
// anywhere a snapshot is already fetched). Renders the SiriOrb visual + a headline,
// score pills, typed insights (categories / demographics / reach) and recommendations.
// Crucially it NEVER dumps raw JSON — unknown insight shapes fall back to a humanised
// key/value list, so a brand never sees `{"total_followers": ...}` on screen.

import { SiriOrb } from "@/components/siri-orb"
import { Sparkles, TrendingUp, Users, Shield } from "lucide-react"

interface AIInsight { type: string; title: string; data: any }
export interface AISnapshotData {
  headline?: string
  insights?: AIInsight[]
  recommendations?: string[]
  scores?: {
    authenticity?: number
    sentiment?: number
    avg_engagement?: number
    total_reach?: number
    creators_with_ai_data?: number
    total_selected?: number
  }
}

function humanizeKey(k: string): string {
  return k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function fmtVal(v: any): string {
  if (v == null) return "—"
  if (typeof v === "number") return v.toLocaleString()
  if (typeof v === "object") {
    // e.g. gender { female, male } → "62% F / 38% M"
    if ("female" in v || "male" in v) return `${v.female ?? 0}% F / ${v.male ?? 0}% M`
    return Object.entries(v).map(([k, val]) => `${humanizeKey(k)}: ${fmtVal(val)}`).join(" · ")
  }
  return String(v)
}

function InsightCard({ insight }: { insight: AIInsight }) {
  const { type, title, data } = insight
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{title}</p>
      {type === "categories" && Array.isArray(data) ? (
        <div className="space-y-1">
          {data.slice(0, 4).map((cat: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-foreground">{cat.name}</span>
              <span className="text-muted-foreground tabular-nums">{cat.value}%</span>
            </div>
          ))}
        </div>
      ) : type === "demographics" && data ? (
        <div className="space-y-1 text-xs">
          {data.gender && <Row label="Gender" value={`${data.gender.female ?? 0}% F / ${data.gender.male ?? 0}% M`} />}
          {data.top_age_group && <Row label="Top age" value={data.top_age_group} />}
          {data.top_country && <Row label="Top region" value={data.top_country} />}
        </div>
      ) : type === "reach" && data ? (
        <div className="space-y-1 text-xs">
          {data.total_followers != null && <Row label="Total followers" value={`${(data.total_followers / 1000).toFixed(0)}K`} />}
          {data.avg_engagement != null && <Row label="Avg engagement" value={`${Number(data.avg_engagement).toFixed(1)}%`} />}
        </div>
      ) : Array.isArray(data) ? (
        <div className="flex flex-wrap gap-1.5">
          {data.map((d: any, j: number) => (
            <span key={j} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">
              {d?.name ?? humanizeKey(String(j))}{d?.value != null ? ` · ${d.value}%` : ""}
            </span>
          ))}
        </div>
      ) : data && typeof data === "object" ? (
        <div className="space-y-1 text-xs">
          {Object.entries(data).map(([k, v]) => <Row key={k} label={humanizeKey(k)} value={fmtVal(v)} />)}
        </div>
      ) : (
        <p className="text-xs text-foreground/80">{fmtVal(data)}</p>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground text-right">{value}</span>
    </div>
  )
}

export function AISnapshotView({ snapshot, loading }: { snapshot: AISnapshotData | null; loading: boolean }) {
  const s = snapshot?.scores
  return (
    <div className="space-y-4">
      {/* Orb */}
      <div className="flex flex-col items-center pt-1">
        <div className={`transition-opacity duration-500 ${loading ? "opacity-60" : "opacity-100"}`}>
          <SiriOrb
            size="88px"
            animationDuration={loading ? 8 : 20}
            colors={{ c1: "oklch(75% 0.18 280)", c2: "oklch(70% 0.15 200)", c3: "oklch(72% 0.16 330)" }}
            className="drop-shadow-lg"
          />
        </div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mt-2.5 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" /> AI Snapshot
        </p>
      </div>

      {loading && !snapshot ? (
        <p className="text-xs text-muted-foreground text-center">Analyzing your approved creators…</p>
      ) : !snapshot ? (
        <p className="text-xs text-muted-foreground text-center">Generate to see audience &amp; content insights.</p>
      ) : (
        <>
          {snapshot.headline && (
            <p className="text-sm font-semibold text-foreground text-center leading-snug">{snapshot.headline}</p>
          )}

          {s && (
            <div className="flex flex-wrap gap-1.5 justify-center">
              {!!s.avg_engagement && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 text-[11px] font-medium">
                  <TrendingUp className="h-3 w-3" />{Number(s.avg_engagement).toFixed(1)}% eng
                </span>
              )}
              {!!s.total_reach && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2.5 py-1 text-[11px] font-medium">
                  <Users className="h-3 w-3" />{(s.total_reach / 1000).toFixed(0)}K reach
                </span>
              )}
              {!!s.authenticity && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 px-2.5 py-1 text-[11px] font-medium">
                  <Shield className="h-3 w-3" />{s.authenticity}% auth
                </span>
              )}
              {!!s.total_selected && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground px-2.5 py-1 text-[11px] font-medium">
                  <Users className="h-3 w-3" />{s.total_selected} creators
                </span>
              )}
            </div>
          )}

          {Array.isArray(snapshot.insights) && snapshot.insights.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {snapshot.insights.map((ins, i) => <InsightCard key={i} insight={ins} />)}
            </div>
          )}

          {Array.isArray(snapshot.recommendations) && snapshot.recommendations.length > 0 && (
            <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
              <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1.5">Recommendations</p>
              <ul className="space-y-1">
                {snapshot.recommendations.map((rec, i) => (
                  <li key={i} className="text-xs text-foreground/80 flex gap-1.5">
                    <span className="text-primary mt-0.5 shrink-0">•</span>{rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
