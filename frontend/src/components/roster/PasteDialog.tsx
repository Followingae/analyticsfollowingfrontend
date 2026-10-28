"use client"

/**
 * Paste rows from a sheet, or a list of handles, straight onto the roster.
 *
 * The talent team's sheets already hold handle, link, followers and "Standard: 2000 QAR /
 * Negotiated: 1000 QAR". Paste them as they are; the platform reads them back first, so what
 * it understood (who we already hold, who is new, which price) is checked before it is saved.
 */
import * as React from "react"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { rosterSheetApi, type PasteRow } from "@/services/imdListsApi"
import { BUNDLE_LABEL, amount } from "./rosterFormat"

const STATE_LABEL: Record<PasteRow["state"], string> = {
  known: "In the database",
  new: "New",
  already_here: "Already on this roster",
}

export function PasteDialog({ open, onOpenChange, listId, onDone }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  listId: string
  onDone: () => void
}) {
  const [text, setText] = useState("")
  const [rows, setRows] = useState<PasteRow[] | null>(null)
  const [busy, setBusy] = useState(false)

  const reset = (o: boolean) => {
    if (!o) { setText(""); setRows(null) }
    onOpenChange(o)
  }

  const read = async () => {
    setBusy(true)
    try {
      const res = await rosterSheetApi.paste(listId, text, true)
      setRows(res.data.rows || [])
    } catch (e) {
      toast.error((e as Error).message || "Could not read that")
    } finally {
      setBusy(false)
    }
  }

  const save = async () => {
    setBusy(true)
    try {
      const res = await rosterSheetApi.paste(listId, text, false)
      toast.success(res.data.message || "Added")
      reset(false)
      onDone()
    } catch (e) {
      toast.error((e as Error).message || "Could not add them")
    } finally {
      setBusy(false)
    }
  }

  const adding = (rows || []).filter(r => r.state !== "already_here").length

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogContent className="w-[95vw] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Paste a list</DialogTitle>
          <DialogDescription>
            Rows straight from a sheet, or one handle per line. Prices like “Standard: 2000 QAR
            Negotiated: 1000 QAR” or “$3,500 reel cross-posted on TikTok” are read as they are.
            New creators go to the waiting room without running analytics.
          </DialogDescription>
        </DialogHeader>

        {!rows ? (
          <Textarea rows={12} value={text} onChange={e => setText(e.target.value)}
                    className="font-mono text-xs"
                    placeholder={"@dinamahfouz, https://www.instagram.com/dinamahfouz/, 30.8K, Standard: 2000 QAR Negotiated: 1000 QAR\n@itsara.ae  $8,000 reel reposted on TikTok\nsara.eats"} />
        ) : (
          <div className="max-h-[52vh] overflow-y-auto rounded-ds-lg border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background text-left text-ds-caption text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Creator</th>
                  <th className="px-3 py-2 font-medium">Read as</th>
                  <th className="px-3 py-2 font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.handle} className={`border-t ${r.state === "already_here" ? "opacity-50" : ""}`}>
                    <td className="px-3 py-2 font-medium">@{r.handle}</td>
                    <td className="px-3 py-2 text-muted-foreground">{STATE_LABEL[r.state]}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {r.asked == null && r.agreed == null ? <span className="text-muted-foreground">no price</span> : (
                        <span className="flex flex-col">
                          <span>
                            {r.asked != null && <>asked {amount(r.asked, r.currency)}</>}
                            {r.asked != null && r.agreed != null && " · "}
                            {r.agreed != null && <>agreed {amount(r.agreed, r.currency)}</>}
                          </span>
                          <span className="text-ds-caption text-muted-foreground">
                            {[r.bundle ? BUNDLE_LABEL[r.bundle] : null,
                              r.currency && r.currency !== "AED" && (r.agreed_aed ?? r.asked_aed)
                                ? `AED ${Math.round((r.agreed_aed ?? r.asked_aed) as number).toLocaleString("en-US")}` : null,
                              r.usage_monthly ? `usage ${amount(r.usage_monthly, r.currency)}/mo` : null,
                            ].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <DialogFooter>
          {rows ? (
            <>
              <Button variant="outline" onClick={() => setRows(null)} disabled={busy}>Back to the text</Button>
              <Button onClick={save} disabled={busy || adding === 0}>
                {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Add {adding} to the roster
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => reset(false)} disabled={busy}>Cancel</Button>
              <Button onClick={read} disabled={busy || !text.trim()}>
                {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}Read it
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
