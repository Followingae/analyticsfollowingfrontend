"use client"

/**
 * What we are booking from one creator. The one picker, used by every screen that puts a
 * creator on a proposal, so the choice reads and works the same wherever it is made.
 *
 * It only offers what this creator actually has: their platforms (Instagram always, TikTok
 * and YouTube once a handle is saved), the deliverables they are priced for, and their saved
 * packages. Anything else is a one-off deal: tick what it includes, name it if you like, and
 * enter the price. A deal holds for this proposal only and never changes their rates.
 *
 * The server checks the same rules (creator_lines.normalise_lines), so a choice made here is
 * one it will accept. Prices follow the person's role: talent see what we pay, account
 * management see what we charge, leadership see both.
 */
import { useEffect, useMemo, useRef, useState } from "react"
import { Gift, Loader2, Minus, Package, Plus, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { PlatformIcon } from "@/components/icons/PlatformIcon"
import {
  DELIVERABLE_SPECS, PLATFORM_LABEL, describeIncludes, isBundleKey, type DeliverableKey,
} from "@/lib/deliverables"
import { creatorPackagesApi, type BookableCreator } from "@/services/creatorPackagesApi"
import { useMoneyColumns } from "@/components/superadmin/influencer-database/useMoneyColumns"

export interface BookingLine {
  /** A deliverable key, "pkg_<id>" for a saved package, "deal" for a new one-off deal, or
   *  "deal_<hex>" for one already on the proposal. */
  type: string
  quantity: number
  name?: string | null
  includes?: { type: string; quantity: number }[] | null
  sell_aed?: number | null
  cost_aed?: number | null
}

const aed = (n?: number | null) => (n == null ? null : `AED ${Math.round(n).toLocaleString("en-US")}`)

/** What a creator starts with when ticked: a reel if they have one, else their first priced
 *  deliverable, else their first package. Product-paid creators start on a reel. */
export function defaultLines(b: BookableCreator | undefined, productMode = false): BookingLine[] {
  if (!b) return []
  const priced = b.deliverables.filter((d) => productMode || d.sell_aed != null || d.cost_aed != null)
  const reel = priced.find((d) => d.type === "reel")
  if (reel) return [{ type: "reel", quantity: 1 }]
  if (priced.length) return [{ type: priced[0].type, quantity: 1 }]
  if (b.packages.length) return [{ type: b.packages[0].key, quantity: 1 }]
  return []
}

/** Platforms, rates and packages for a set of creators, fetched once per id. */
export function useBookable(ids: string[]) {
  const [data, setData] = useState<Record<string, BookableCreator>>({})
  const asked = useRef<Set<string>>(new Set())
  const key = ids.slice().sort().join(",")
  useEffect(() => {
    const missing = ids.filter((id) => !asked.current.has(id))
    if (!missing.length) return
    missing.forEach((id) => asked.current.add(id))
    creatorPackagesApi.bookable(missing)
      .then((r) => setData((prev) => ({ ...prev, ...r.data.creators })))
      .catch(() => missing.forEach((id) => asked.current.delete(id)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return data
}

function Stepper({ q, onMinus, onPlus, label }: { q: number; onMinus: () => void; onPlus: () => void; label: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-lg bg-primary/10 px-1 py-0.5 text-xs">
      <button type="button" onClick={onMinus} className="rounded p-0.5 hover:bg-background" aria-label={`One fewer ${label}`}>
        <Minus className="h-3 w-3" />
      </button>
      <span className="px-1 font-medium">{q > 1 ? `${q} × ` : ""}{label}</span>
      <button type="button" onClick={onPlus} className="rounded p-0.5 hover:bg-background" aria-label={`One more ${label}`}>
        <Plus className="h-3 w-3" />
      </button>
    </span>
  )
}

export function BookingPicker({
  creator, value, onChange, productMode = false, className,
}: {
  creator?: BookableCreator
  value: BookingLine[]
  onChange: (lines: BookingLine[]) => void
  /** Paid in product (barter, or on product): no rate is needed to book a deliverable. */
  productMode?: boolean
  className?: string
}) {
  const { canSeeCost, canSeeSell } = useMoneyColumns()
  const [dealOpen, setDealOpen] = useState(false)
  const [dealName, setDealName] = useState("")
  const [dealCounts, setDealCounts] = useState<Partial<Record<DeliverableKey, number>>>({})
  const [dealSell, setDealSell] = useState("")
  const [dealCost, setDealCost] = useState("")

  const qtyOf = (type: string) => value.find((l) => l.type === type)?.quantity ?? 0
  const setQty = (type: string, q: number) => {
    const rest = value.filter((l) => l.type !== type)
    onChange(q > 0 ? [...rest, { ...(value.find((l) => l.type === type) ?? { type }), type, quantity: Math.min(q, 50) }] : rest)
  }

  const platforms = creator?.platforms ?? ["instagram"]
  const byKey = useMemo(() => Object.fromEntries((creator?.deliverables ?? []).map((d) => [d.type, d])), [creator])
  const deals = value.filter((l) => l.type === "deal" || l.type.startsWith("deal_"))

  if (!creator) {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" />Loading their rates
      </div>
    )
  }

  function addDeal() {
    const includes = Object.entries(dealCounts)
      .filter(([, q]) => q && q > 0)
      .map(([type, quantity]) => ({ type, quantity: quantity as number }))
    if (!includes.length) return
    const sell = dealSell.trim() ? Number(dealSell) : null
    const cost = dealCost.trim() ? Number(dealCost) : null
    if ((sell != null && (Number.isNaN(sell) || sell < 0)) || (cost != null && (Number.isNaN(cost) || cost < 0))) return
    onChange([...value, {
      type: "deal", quantity: 1, name: dealName.trim() || null, includes,
      ...(canSeeSell ? { sell_aed: sell } : {}), ...(canSeeCost ? { cost_aed: cost } : {}),
    }])
    setDealOpen(false); setDealName(""); setDealCounts({}); setDealSell(""); setDealCost("")
  }

  const dealReady = Object.values(dealCounts).some((q) => (q ?? 0) > 0)
    && (productMode || !canSeeSell || dealSell.trim() !== "")

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {platforms.map((plat) => (
        <div key={plat} className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex w-24 shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            <PlatformIcon platform={plat} className="h-3.5 w-3.5" />{PLATFORM_LABEL[plat]}
          </span>
          {DELIVERABLE_SPECS.filter((s) => s.platform === plat).map((s) => {
            const d = byKey[s.key]
            const priced = productMode || d?.sell_aed != null || d?.cost_aed != null
            const q = qtyOf(s.key)
            const price = canSeeSell ? d?.sell_aed : canSeeCost ? d?.cost_aed : null
            if (q > 0) {
              return <Stepper key={s.key} q={q} label={s.label} onMinus={() => setQty(s.key, q - 1)} onPlus={() => setQty(s.key, q + 1)} />
            }
            return (
              <button
                key={s.key}
                type="button"
                disabled={!priced}
                onClick={() => setQty(s.key, 1)}
                title={priced ? undefined : "No rate for this yet. Set one on their Rates tab, or book it as a one-off deal."}
                className={cn(
                  "rounded-lg border border-dashed px-2 py-1 text-xs transition",
                  priced ? "text-muted-foreground hover:border-primary hover:text-foreground" : "cursor-not-allowed opacity-40",
                )}
              >
                + {s.label}{!productMode && price != null ? ` · ${aed(price)}` : ""}
              </button>
            )
          })}
        </div>
      ))}

      {creator.packages.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex w-24 shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            <Package className="h-3.5 w-3.5" />Packages
          </span>
          {creator.packages.map((p) => {
            const on = qtyOf(p.key) > 0
            const price = canSeeSell ? p.sell_aed : canSeeCost ? p.cost_aed : null
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange(on
                  ? value.filter((l) => l.type !== p.key)
                  : [...value, { type: p.key, quantity: 1, name: p.name, includes: p.includes, sell_aed: p.sell_aed }])}
                title={describeIncludes(p.includes)}
                className={cn(
                  "rounded-lg border px-2 py-1 text-xs transition",
                  on ? "border-primary bg-primary/10 font-medium" : "border-dashed text-muted-foreground hover:border-primary hover:text-foreground",
                )}
              >
                {on ? "✓ " : "+ "}{p.name}{!productMode && price != null ? ` · ${aed(price)}` : ""}
              </button>
            )
          })}
        </div>
      )}

      {deals.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex w-24 shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />This proposal
          </span>
          {deals.map((d, i) => (
            <span key={d.type + i} className="inline-flex items-center gap-1 rounded-lg border border-primary bg-primary/10 px-2 py-1 text-xs font-medium">
              {d.name || describeIncludes(d.includes)}
              {canSeeSell && d.sell_aed != null && <span className="font-normal text-muted-foreground">· {aed(d.sell_aed)}</span>}
              <button type="button" onClick={() => onChange(value.filter((l) => l !== d))} className="rounded p-0.5 hover:bg-background" aria-label="Remove this deal">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {!dealOpen ? (
        <button type="button" onClick={() => setDealOpen(true)} className="w-fit text-xs font-medium text-primary hover:underline">
          + One-off deal for this proposal
        </button>
      ) : (
        <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-2.5">
          <p className="text-xs text-muted-foreground">
            What they agreed for this proposal only, e.g. the reel cross-posted to TikTok at the same price. Their standard rates do not change.
          </p>
          {platforms.map((plat) => (
            <div key={plat} className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex w-24 shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                <PlatformIcon platform={plat} className="h-3.5 w-3.5" />{PLATFORM_LABEL[plat]}
              </span>
              {DELIVERABLE_SPECS.filter((s) => s.platform === plat).map((s) => {
                const q = dealCounts[s.key] || 0
                const set = (n: number) => setDealCounts((c) => {
                  const next = { ...c }
                  if (n > 0) next[s.key] = Math.min(n, 50); else delete next[s.key]
                  return next
                })
                return q > 0
                  ? <Stepper key={s.key} q={q} label={s.label} onMinus={() => set(q - 1)} onPlus={() => set(q + 1)} />
                  : (
                    <button key={s.key} type="button" onClick={() => set(1)} className="rounded-lg border border-dashed px-2 py-1 text-xs text-muted-foreground hover:border-primary hover:text-foreground">
                      + {s.label}
                    </button>
                  )
              })}
            </div>
          ))}
          <div className="grid gap-2 sm:grid-cols-3">
            <Input className="h-8 text-xs" placeholder="Name (optional), e.g. All 3 platforms" value={dealName} onChange={(e) => setDealName(e.target.value)} />
            {canSeeSell && !productMode && (
              <Input className="h-8 text-xs" inputMode="decimal" placeholder="We charge, AED" value={dealSell} onChange={(e) => setDealSell(e.target.value)} />
            )}
            {canSeeCost && !productMode && (
              <Input className="h-8 text-xs" inputMode="decimal" placeholder="We pay, AED" value={dealCost} onChange={(e) => setDealCost(e.target.value)} />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setDealOpen(false)}>Cancel</Button>
            <Button type="button" size="sm" className="h-7 text-xs" disabled={!dealReady} onClick={addDeal}>Add deal</Button>
          </div>
        </div>
      )}

      {productMode && (
        <p className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Gift className="h-3 w-3" />Paid in product: no rate is needed for what they post.
        </p>
      )}
      {value.length === 0 && (
        <p className="text-[11px] text-amber-700 dark:text-amber-400">Pick at least one thing to book.</p>
      )}
    </div>
  )
}

/** For lines already on a proposal: is this a package or deal (booked whole)? */
export const isWholeLine = (l: BookingLine) => isBundleKey(l.type) || l.type === "deal"
