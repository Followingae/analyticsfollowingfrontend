"use client"

/**
 * Column 3 of the Inflink models campaign: every model who answered the invite on Instagram and
 * how far each got. Android models get the Play Store steps and the code in the chat; iPhone
 * models wait on the launch list and are told in the same chat the day the App Store listing
 * appears (the server checks Apple itself). Nothing here is a client roster.
 */
import * as React from "react"
import { Apple, Smartphone } from "lucide-react"
import type { ModelLead, ModelLeads } from "@/services/scoutApi"
import { Face } from "./outreachParts"
import { compact } from "./WorkerPill"

const STATUS: Record<ModelLead["status"], { label: string; tone: string }> = {
  interested: { label: "Asked which phone", tone: "bg-muted text-foreground" },
  android_sent: { label: "Sent the Android steps", tone: "bg-[#d3ff02] text-[#111]" },
  ios_waitlist: { label: "iPhone launch list", tone: "bg-violet-100 text-violet-900" },
  ios_sent: { label: "Sent the App Store steps", tone: "bg-[#d3ff02] text-[#111]" },
  already_member: { label: "Already on Inflink", tone: "bg-muted text-muted-foreground" },
  declined: { label: "Not interested", tone: "bg-muted text-muted-foreground" },
}

export function modelsJoined(d: ModelLeads | null): number | null {
  if (!d) return null
  return (d.counts.android_sent || 0) + (d.counts.ios_sent || 0) + (d.counts.ios_waitlist || 0)
}

export function BoardModels({ data, onOpen }: { data: ModelLeads | null; onOpen: (u: string) => void }) {
  if (!data) return null
  const c = data.counts
  const tiles: [React.ReactNode, number, string][] = [
    [<Smartphone key="a" className="h-4 w-4" />, (c.android_sent || 0) + (c.ios_sent || 0), "told how to join"],
    [<Apple key="i" className="h-4 w-4" />, c.ios_waitlist || 0, data.ios_live ? "iPhone, being told now" : "iPhone launch list"],
  ]
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {tiles.map(([icon, n, label]) => (
          <div key={label} className="flex flex-col gap-1 rounded-2xl border bg-background p-3">
            <span className="text-muted-foreground">{icon}</span>
            <span className="text-2xl font-semibold tabular-nums tracking-tight">{n.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
      <p className="px-1 text-xs text-muted-foreground">
        {data.ios_live ? "The iPhone app is live: the launch list hears it in their chat."
          : "The iPhone list hears in their chat the day the App Store listing appears."}
      </p>
      {data.items.length === 0 ? (
        <p className="px-1 py-6 text-center text-sm text-muted-foreground">Models who answer the invite land here.</p>
      ) : data.items.map(l => (
        <button key={l.id} type="button" onClick={() => onOpen(l.username)}
                className="flex items-center gap-3 rounded-2xl border bg-background p-3 text-left transition-colors hover:border-foreground/30">
          <Face c={{ avatar: l.avatar, username: l.username, full_name: l.full_name }} size={36} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">@{l.username}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {[l.followers ? `${compact(l.followers)} followers` : null, l.city, l.device === "iphone" ? "iPhone" : l.device === "android" ? "Android" : null]
                .filter(Boolean).join(" · ")}
            </span>
          </span>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS[l.status].tone}`}>{STATUS[l.status].label}</span>
        </button>
      ))}
    </>
  )
}
