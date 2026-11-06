"use client"

/**
 * The campaign's open call as one compact card in Scout's Brief column: what ScoutAI tells
 * creators on WhatsApp, whether it is live, and every action on it behind one menu. Talent
 * copy their own link; only a superadmin creates, edits, closes or sends the alert.
 */
import * as React from "react"
import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ChevronDown, Copy, Loader2, MessageCircle, MoreHorizontal, Pencil, Plus, Send, Smartphone, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { openCallsApi, type OpenCall } from "@/services/openCallsApi"
import { ConversationsSheet } from "@/components/roster/ConversationsSheet"
import { CampaignAlertDialog } from "@/components/roster/AlertDialog"
import { ScoutAvatar } from "@/components/roster/ScoutAvatar"
import { OpenCallDialog } from "./OpenCallDialog"
import { LiveDot } from "./outreachParts"

export function OpenCallCard({ listId, brand, oc, loaded, isSuperadmin, isFounder, onChanged }: {
  listId: string; brand?: string | null; oc: OpenCall | null; loaded: boolean; isSuperadmin: boolean; isFounder: boolean; onChanged: () => void
}) {
  const [edit, setEdit] = useState(false)
  const [chats, setChats] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)
  const [showCard, setShowCard] = useState(false)
  const [busy, setBusy] = useState(false)

  const copy = async (s: string, what: string) => {
    await navigator.clipboard.writeText(s)
    toast.success(`${what} copied`)
  }
  const myLink = async (dm: boolean) => {
    if (!oc) return
    try {
      const link = oc.my_link || (await openCallsApi.myLink(oc.id)).data.link
      if (!oc.my_link) onChanged()
      if (dm) {
        await copy(`Hi! We have a ${oc.comp_mode === "barter" ? "barter" : "paid"} campaign with ${oc.brand_descriptor}` +
                   `${oc.location ? ` in ${oc.location}` : ""} that fits you really well. All the details, and a quick way to send your rate, are here: ${link}`, "DM")
      } else await copy(link, "Your link")
    } catch (e) { toast.error((e as Error).message || "Could not get your link") }
  }
  const invite = async () => {
    if (!oc) return
    setBusy(true)
    try { const r = await openCallsApi.invite(oc.id, "app"); toast.success(`${r.data.invited} app creators invited`) }
    catch (e) { toast.error((e as Error).message || "Could not invite") } finally { setBusy(false) }
  }
  const outcomes = async () => {
    if (!oc) return
    setBusy(true)
    try {
      const r = await openCallsApi.outcomes(oc.id)
      toast.success(`${r.data.sent.length} creator${r.data.sent.length === 1 ? "" : "s"} told how it went`, {
        description: r.data.not_sent.length ? `Not sent (outside WhatsApp's 24-hour window): ${r.data.not_sent.join(", ")}` : undefined,
      })
      onChanged()
    } catch (e) { toast.error((e as Error).message || "Could not send") } finally { setBusy(false) }
  }
  const setStatus = async (status: "live" | "closed") => {
    setBusy(true)
    try { await openCallsApi.save(listId, { status }); onChanged() }
    catch (e) { toast.error((e as Error).message || "Could not change it") } finally { setBusy(false) }
  }

  const live = oc?.status === "live"
  const mode = oc?.comp_mode === "both" ? "Paid + product" : oc?.comp_mode === "barter" ? "Barter" : oc ? "Paid" : null

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-background p-4">
      <div className="flex items-center gap-2">
        <ScoutAvatar size={28} state={live ? "default" : "sleeping"} />
        <p className="text-xs font-medium text-muted-foreground">ScoutAI on WhatsApp</p>
        <span className="ml-auto">
          {!loaded ? null : !oc ? <span className="text-[11px] text-muted-foreground">No open call</span>
            : live ? <LiveDot /> : <span className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{oc.status === "closed" ? "Closed" : "Draft"}</span>}
        </span>
      </div>

      {!loaded ? (
        <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
      ) : !oc ? (
        <>
          <p className="text-sm text-muted-foreground">Creators answer it in WhatsApp and land in Review with their price.</p>
          {isSuperadmin && (
            <Button size="sm" className="gap-1.5 self-start rounded-full" onClick={() => setEdit(true)}>
              <Plus className="h-3.5 w-3.5" />Create the open call
            </Button>
          )}
        </>
      ) : (
        <>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{oc.title}</p>
            <p className="truncate text-xs text-muted-foreground">{[mode, oc.location, oc.dates].filter(Boolean).join(" · ")}</p>
          </div>
          <button type="button" onClick={() => setShowCard(s => !s)}
                  className="inline-flex items-center gap-1 self-start text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
            {showCard ? "Hide what creators read" : "What creators read"}<ChevronDown className={`h-3 w-3 transition-transform ${showCard ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence initial={false}>
            {showCard && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="whitespace-pre-line rounded-xl bg-muted/50 p-3 text-xs">{oc.card}</div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="flex-1 gap-1.5 rounded-full" disabled={!live} onClick={() => myLink(true)}>
              <Copy className="h-3.5 w-3.5" />Copy a DM with my link
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="outline" className="h-8 w-8 shrink-0 rounded-full" aria-label="More" disabled={busy}>
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem disabled={!live} onSelect={() => myLink(false)}><Copy className="h-4 w-4" />Copy my link</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setChats(true)}><MessageCircle className="h-4 w-4" />Conversations ({oc.counts.total})</DropdownMenuItem>
                {isSuperadmin && (
                  <>
                    <DropdownMenuSeparator />
                    {oc.comp_mode !== "paid" && (
                      <DropdownMenuItem disabled={!live} onSelect={() => setAlertOpen(true)}>
                        <Send className="h-4 w-4" />Send the WhatsApp alert{oc.counts.alerted ? ` (${oc.counts.alerted} sent)` : ""}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem disabled={!live} onSelect={invite}><Smartphone className="h-4 w-4" />Invite app creators</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => copy(oc.story_link, "Story link")}><Copy className="h-4 w-4" />Copy the story link</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setEdit(true)}><Pencil className="h-4 w-4" />Edit the open call</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setStatus(live ? "closed" : "live")}><X className="h-4 w-4" />{live ? "Close it" : "Open it again"}</DropdownMenuItem>
                  </>
                )}
                {isFounder && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={outcomes}><Send className="h-4 w-4" />Tell creators how it went</DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}

      {(isSuperadmin || oc) && (
        <OpenCallDialog listId={listId} brand={brand} oc={oc} open={edit} onOpenChange={setEdit} onSaved={onChanged} />
      )}
      {oc && <ConversationsSheet openCallId={oc.id} open={chats} onOpenChange={setChats} founder={isFounder} onChanged={onChanged} />}
      {oc && isSuperadmin && <CampaignAlertDialog openCallId={oc.id} open={alertOpen} onOpenChange={setAlertOpen} onSent={onChanged} />}
    </div>
  )
}
