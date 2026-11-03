"use client"

/**
 * "DM about…": pick a campaign with a live open call, or General outreach (join the Following
 * creator network), and the picked creators go straight into the bot's queue as approved.
 */
import * as React from "react"
import { useState } from "react"
import { ChevronDown, Globe, Loader2, Send } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { scoutApi, type ScoutCampaign } from "@/services/scoutApi"

export function DmAboutMenu({ usernames, campaigns, onDone, size = "sm", className = "" }: {
  usernames: string[]; campaigns: ScoutCampaign[]; onDone?: () => void; size?: "sm" | "default"; className?: string
}) {
  const [busy, setBusy] = useState(false)
  const live = campaigns.filter(c => c.open_call?.status === "live")

  const queue = async (listId: string | null, label: string) => {
    setBusy(true)
    try {
      const r = await scoutApi.queue(usernames, listId)
      const skipped = r.data.skipped || []
      const why = Array.from(new Set(skipped.map(s => s.reason))).slice(0, 2).join(", ")
      toast.success(`${r.data.queued} queued for the bot: ${label}`, {
        description: skipped.length
          ? `${skipped.length} skipped${why ? ` (${why})` : ""}: ${skipped.slice(0, 3).map(s => `@${s.username}`).join(", ")}${skipped.length > 3 ? "…" : ""}`
          : "It sends at human pace from the desktop.",
      })
      onDone?.()
    } catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size={size} disabled={busy || usernames.length === 0}
                className={`gap-1.5 rounded-full bg-[#d3ff02] text-[#111] hover:bg-[#c4ef00] ${className}`}>
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          DM about<ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {live.length > 0 && <>
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Campaigns with a live open call</DropdownMenuLabel>
          {live.map(c => (
            <DropdownMenuItem key={c.list_id} onSelect={() => queue(c.list_id, c.brand || c.name)} className="flex flex-col items-start gap-0">
              <span className="font-medium">{c.brand || c.name}</span>
              {c.brand && c.name !== c.brand && <span className="text-xs text-muted-foreground">{c.name}</span>}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
        </>}
        <DropdownMenuItem onSelect={() => queue(null, "General outreach")} className="flex items-start gap-2">
          <Globe className="mt-0.5 h-4 w-4" />
          <span className="flex flex-col">
            <span className="font-medium">General outreach</span>
            <span className="text-xs text-muted-foreground">Invite them to join Following</span>
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
