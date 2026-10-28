"use client"

/**
 * The price column of the roster sheet: what they asked, what we agreed, in their currency,
 * for which bundle, and the AED it comes to. Click to edit, the way a sheet cell is edited.
 */
import * as React from "react"
import { useState } from "react"
import { Loader2, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { rosterSheetApi, type ImdListCreator } from "@/services/imdListsApi"
import { BUNDLE_LABEL, CURRENCIES, aed, amount, priceFlags } from "./rosterFormat"

const NONE = "__none__"

export function QuoteCell({ listId, c, editable, bandMax, onSaved }: {
  listId: string
  c: ImdListCreator
  editable: boolean
  bandMax?: number | null
  onSaved: () => void
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [asked, setAsked] = useState("")
  const [agreed, setAgreed] = useState("")
  const [currency, setCurrency] = useState("AED")
  const [bundle, setBundle] = useState<string>(NONE)
  const [usage, setUsage] = useState("")
  const [note, setNote] = useState("")

  const start = (o: boolean) => {
    if (o) {
      setAsked(c.quote_asked != null ? String(c.quote_asked) : "")
      setAgreed(c.quote_agreed != null ? String(c.quote_agreed) : "")
      setCurrency(c.quote_currency || "AED")
      setBundle(c.quote_bundle || NONE)
      setUsage(c.quote_usage_monthly != null ? String(c.quote_usage_monthly) : "")
      setNote(c.quote_note || "")
    }
    setOpen(o)
  }

  const save = async () => {
    setBusy(true)
    try {
      await rosterSheetApi.quote(listId, c.id, {
        asked: asked.trim() ? Number(asked.replace(/,/g, "")) : null,
        agreed: agreed.trim() ? Number(agreed.replace(/,/g, "")) : null,
        currency, bundle: bundle === NONE ? null : bundle,
        usage_monthly: usage.trim() ? Number(usage.replace(/,/g, "")) : null,
        note: note.trim() || null,
      })
      setOpen(false)
      onSaved()
    } catch (e) {
      toast.error((e as Error).message || "Could not save the price")
    } finally {
      setBusy(false)
    }
  }

  const has = c.quote_asked != null || c.quote_agreed != null
  const { overBand, aboveLast } = priceFlags(c, bandMax)
  const cur = c.quote_currency || "AED"
  const workingCents = c.quote_agreed_aed_cents ?? c.quote_asked_aed_cents

  const body = has ? (
    <span className="flex flex-col gap-0.5 text-left">
      <span className="text-sm tabular-nums">
        {c.quote_agreed != null && c.quote_asked != null && c.quote_agreed !== c.quote_asked ? (
          <>
            <span className="text-muted-foreground line-through decoration-1">{amount(c.quote_asked, cur)}</span>{" "}
            <span className={overBand ? "text-[var(--tone-warn-ink)]" : ""}>{amount(c.quote_agreed, cur)}</span>
          </>
        ) : (
          <span className={overBand ? "text-[var(--tone-warn-ink)]" : ""}>
            {amount(c.quote_agreed ?? c.quote_asked, cur)}
            {c.quote_agreed == null && <span className="ml-1 text-ds-caption text-muted-foreground">asked</span>}
          </span>
        )}
      </span>
      <span className="text-ds-caption text-muted-foreground">
        {[c.quote_bundle ? BUNDLE_LABEL[c.quote_bundle] : null,
          cur !== "AED" && workingCents != null ? aed(workingCents) : null,
          c.quote_usage_monthly ? `usage ${amount(c.quote_usage_monthly, cur)}/mo` : null,
        ].filter(Boolean).join(" · ")}
      </span>
      {(overBand || aboveLast) && (
        <span className="text-ds-caption text-[var(--tone-warn-ink)]">
          {overBand ? "Above the brief's budget" : ""}
          {overBand && aboveLast ? " · " : ""}
          {aboveLast ? `${aboveLast}% above last time` : ""}
        </span>
      )}
    </span>
  ) : (
    <span className="text-sm text-muted-foreground">{editable ? "Add a price" : "–"}</span>
  )

  if (!editable) return body

  return (
    <Popover open={open} onOpenChange={start}>
      <PopoverTrigger asChild>
        <button type="button" className="group/q -mx-1.5 flex items-start gap-1 rounded-md px-1.5 py-1 hover:bg-muted/60">
          {body}
          <Pencil className="mt-1 h-3 w-3 shrink-0 text-muted-foreground opacity-0 group-hover/q:opacity-100" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <div className="flex flex-col gap-ds-3">
          <p className="text-ds-label">@{c.username}</p>
          <div className="grid grid-cols-[1fr_1fr_5.5rem] gap-ds-2">
            <div className="flex flex-col gap-1">
              <Label className="text-ds-caption">They asked</Label>
              <Input inputMode="decimal" value={asked} onChange={e => setAsked(e.target.value)} placeholder="2000" />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-ds-caption">We agreed</Label>
              <Input inputMode="decimal" value={agreed} onChange={e => setAgreed(e.target.value)} placeholder="1500" />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-ds-caption">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-ds-caption">For</Label>
            <Select value={bundle} onValueChange={setBundle}>
              <SelectTrigger><SelectValue placeholder="What the price buys" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Reel (default)</SelectItem>
                {Object.entries(BUNDLE_LABEL).filter(([k]) => k !== "reel").map(([k, v]) =>
                  <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-ds-2">
            <div className="flex flex-col gap-1">
              <Label className="text-ds-caption">Usage rights / month</Label>
              <Input inputMode="decimal" value={usage} onChange={e => setUsage(e.target.value)} placeholder="optional" />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-ds-caption">Note</Label>
              <Input value={note} onChange={e => setNote(e.target.value)} placeholder="optional" />
            </div>
          </div>
          {c.last_agreed_aed_cents != null && (
            <p className="text-ds-caption text-muted-foreground">
              Last agreed with us: {aed(c.last_agreed_aed_cents)}
              {c.last_agreed_context ? `, ${c.last_agreed_context}` : ""}
            </p>
          )}
          <div className="flex justify-end gap-ds-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={busy || (!asked.trim() && !agreed.trim())}>
              {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
