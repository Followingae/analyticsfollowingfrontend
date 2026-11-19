"use client"

import { useEffect, useState } from "react"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, ListPlus, Plus, Check } from "lucide-react"
import { toast } from "sonner"
import { rosterSheetApi, imdListsApi, type ImdListSummary } from "@/services/imdListsApi"

/**
 * Drop the current master-DB selection into a list — existing or brand new.
 *
 * Re-adding is safe: the backend skips anyone already in the list and reports what it
 * ACTUALLY added, which is what gets shown. "Added 40" when 37 were already there is the
 * kind of lie that makes an operator stop trusting the number.
 */
export function AddToListDialog({ open, onOpenChange, influencerIds, onDone }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  influencerIds: string[]
  onDone?: () => void
}) {
  const [lists, setLists] = useState<ImdListSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  /** Client rounds only: send them to Zain or Hajar for approval in the same press. */
  const [sendNow, setSendNow] = useState(true)

  useEffect(() => {
    if (!open) return
    setCreating(false); setNewName("")
    setLoading(true)
    imdListsApi.list()
      .then((r) => setLists(r?.data?.lists ?? []))
      .catch((e) => toast.error((e as Error).message || "Failed to load lists"))
      .finally(() => setLoading(false))
  }, [open])

  const addTo = async (list: ImdListSummary) => {
    setSaving(true)
    try {
      const res = await imdListsApi.addItems(list.id, influencerIds)
      const { added = 0, skipped = 0 } = res?.data ?? {}
      const sent = sendNow && list.kind === "client"
      if (sent) await rosterSheetApi.talent(list.id, influencerIds, "shortlist")
      toast.success(`Added ${added} to "${list.name}"${skipped > 0 ? `, ${skipped} already in it` : ""}${sent ? ", sent for approval" : ""}`)
      onOpenChange(false)
      onDone?.()
    } catch (e) {
      toast.error((e as Error).message || "Failed to add")
    } finally {
      setSaving(false)
    }
  }

  const createWith = async () => {
    if (!newName.trim()) return toast.error("Give the list a name")
    setSaving(true)
    try {
      const res = await imdListsApi.create({ name: newName.trim(), influencer_ids: influencerIds })
      toast.success(`Created "${newName.trim()}" with ${res?.data?.items_count ?? influencerIds.length} creator(s)`)
      onOpenChange(false)
      onDone?.()
    } catch (e) {
      toast.error((e as Error).message || "Failed to create list")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ListPlus className="h-4 w-4" />Add to a round</DialogTitle>
          <DialogDescription>
            {influencerIds.length} creator{influencerIds.length === 1 ? "" : "s"} selected.
            Anyone already there is skipped. Client rounds go to a founder for approval, then onto that client's proposal.
          </DialogDescription>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={sendNow} onChange={e => setSendNow(e.target.checked)} />
            Send for approval now (client rounds)
          </label>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : creating ? (
          <div className="space-y-2">
            <Label>List name</Label>
            <Input
              autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. KSA food creators"
              onKeyDown={(e) => { if (e.key === "Enter") createWith() }}
            />
          </div>
        ) : (
          <div className="max-h-[45vh] space-y-1.5 overflow-y-auto">
            {lists.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No lists yet. Create the first one.</p>
            ) : [...lists].sort((a, b) => Number(b.kind === "client") - Number(a.kind === "client")).map((l) => (
              <button
                key={l.id} type="button" disabled={saving} onClick={() => addTo(l)}
                className="flex w-full items-center justify-between gap-2 rounded-lg border p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{l.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{[l.kind === "client" ? (l.team_name || "Client round") : "Sample list", l.description].filter(Boolean).join(" · ")}</span>
                </span>
                <Badge variant="secondary" className="shrink-0">{l.items_count}</Badge>
              </button>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          {creating ? (
            <>
              <Button variant="ghost" onClick={() => setCreating(false)} disabled={saving}>Back</Button>
              <Button onClick={createWith} disabled={saving} className="gap-1.5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Create with {influencerIds.length}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setCreating(true)} disabled={saving} className="gap-1.5">
              <Plus className="h-4 w-4" />New list from selection
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
