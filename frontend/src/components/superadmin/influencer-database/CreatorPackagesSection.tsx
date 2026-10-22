"use client"

/**
 * A creator's packages: several deliverables at one price.
 *
 * "Reel, also posted to TikTok and YouTube, AED 5,500" is how a lot of these deals are
 * actually agreed, and before this it lived in somebody's notes. A package is booked whole
 * on a proposal: the client takes it as it is and never a part of it.
 *
 * Money follows the same rule as the rates above it: talent see and set what we pay,
 * account management see what we charge, only leadership see both. The server enforces it;
 * this only decides what to draw.
 */
import { useEffect, useState } from "react"
import { Minus, Package, Pencil, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  DELIVERABLE_SPECS, PLATFORM_LABEL, describeIncludes, platformsOfCreator,
  type DeliverableKey,
} from "@/lib/deliverables"
import type { CreatorPackage, MasterInfluencer } from "@/types/influencerDatabase"
import { creatorPackagesApi } from "@/services/creatorPackagesApi"
import { useMoneyColumns } from "./useMoneyColumns"

const aed = (n: number | null | undefined) =>
  n == null ? "–" : `AED ${Math.round(n).toLocaleString("en-US")}`

interface Draft {
  id?: string
  name: string
  counts: Partial<Record<DeliverableKey, number>>
  cost: string
  sell: string
}

const EMPTY: Draft = { name: "", counts: {}, cost: "", sell: "" }

export function CreatorPackagesSection({ influencer }: { influencer: MasterInfluencer }) {
  const { canSeeCost, canSeeSell } = useMoneyColumns()
  const [packages, setPackages] = useState<CreatorPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)

  const platforms = platformsOfCreator(influencer)
  const specs = DELIVERABLE_SPECS.filter((d) => platforms.includes(d.platform))

  useEffect(() => {
    let live = true
    creatorPackagesApi.list(influencer.id)
      .then((r) => { if (live) setPackages(r.data.packages) })
      .catch(() => { if (live) setPackages([]) })
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [influencer.id])

  function edit(p: CreatorPackage) {
    setDraft({
      id: p.id,
      name: p.name,
      counts: Object.fromEntries(p.includes.map((i) => [i.type, i.quantity])),
      cost: p.cost_aed != null ? String(p.cost_aed) : "",
      sell: p.sell_aed != null ? String(p.sell_aed) : "",
    })
  }

  function bump(key: DeliverableKey, by: number) {
    setDraft((d) => {
      if (!d) return d
      const next = Math.max(0, Math.min(50, (d.counts[key] || 0) + by))
      const counts = { ...d.counts }
      if (next) counts[key] = next
      else delete counts[key]
      return { ...d, counts }
    })
  }

  async function save() {
    if (!draft) return
    const includes = Object.entries(draft.counts)
      .filter(([, q]) => q && q > 0)
      .map(([type, quantity]) => ({ type: type as DeliverableKey, quantity: quantity as number }))
    if (!draft.name.trim()) return toast.error("Give the package a name, e.g. \"All 3 platforms\"")
    if (!includes.length) return toast.error("Pick at least one deliverable")
    const money: { cost_aed?: number | null; sell_aed?: number | null } = {}
    if (canSeeCost) money.cost_aed = draft.cost.trim() ? Number(draft.cost) : null
    if (canSeeSell) money.sell_aed = draft.sell.trim() ? Number(draft.sell) : null
    if ([money.cost_aed, money.sell_aed].some((v) => v != null && (Number.isNaN(v) || v < 0))) {
      return toast.error("Prices must be numbers in AED")
    }
    setSaving(true)
    try {
      const body = { name: draft.name.trim(), includes, ...money }
      const res = draft.id
        ? await creatorPackagesApi.update(influencer.id, draft.id, body)
        : await creatorPackagesApi.create(influencer.id, body)
      const saved = res.data.package
      setPackages((ps) => (draft.id ? ps.map((p) => (p.id === saved.id ? saved : p)) : [...ps, saved]))
      setDraft(null)
      toast.success(draft.id ? "Package updated" : "Package added")
    } catch (e: any) {
      toast.error(e?.message || "Could not save the package")
    } finally {
      setSaving(false)
    }
  }

  async function remove(p: CreatorPackage) {
    try {
      await creatorPackagesApi.archive(influencer.id, p.id)
      setPackages((ps) => ps.filter((x) => x.id !== p.id))
      toast.success(`"${p.name}" removed. Proposals already sent with it keep it.`)
    } catch (e: any) {
      toast.error(e?.message || "Could not remove the package")
    }
  }

  return (
    <section className="flex flex-col gap-ds-3">
      <div className="flex items-end justify-between gap-ds-3">
        <div>
          <h3 className="text-ds-label">Packages</h3>
          <p className="text-ds-caption text-muted-foreground">
            Several deliverables at one price, booked whole. E.g. a reel also posted to TikTok.
          </p>
        </div>
        {!draft && (
          <Button variant="outline" size="sm" onClick={() => setDraft({ ...EMPTY })}>
            <Plus className="mr-1 h-3.5 w-3.5" />Add package
          </Button>
        )}
      </div>

      {!loading && packages.length > 0 && (
        <ul className="flex flex-col divide-y rounded-lg border">
          {packages.map((p) => (
            <li key={p.id} className="flex items-center gap-ds-3 px-3 py-2.5">
              <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="truncate text-ds-caption text-muted-foreground">{describeIncludes(p.includes)}</p>
              </div>
              {canSeeCost && (
                <div className="text-right">
                  <p className="text-[11px] text-muted-foreground">We pay</p>
                  <p className="text-sm tabular-nums">{aed(p.cost_aed)}</p>
                </div>
              )}
              {canSeeSell && (
                <div className="text-right">
                  <p className="text-[11px] text-muted-foreground">We charge</p>
                  <p className="text-sm font-medium tabular-nums">{aed(p.sell_aed)}</p>
                </div>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => edit(p)} aria-label={`Edit ${p.name}`}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => remove(p)} aria-label={`Remove ${p.name}`}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {draft && (
        <div className="flex flex-col gap-ds-3 rounded-lg border p-ds-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{draft.id ? "Edit package" : "New package"}</p>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDraft(null)} aria-label="Cancel">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Input
            placeholder="Name, e.g. All 3 platforms"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <div className="flex flex-col gap-ds-2">
            <Label className="text-ds-caption text-muted-foreground">What it includes</Label>
            {platforms.map((plat) => (
              <div key={plat} className="flex flex-wrap items-center gap-1.5">
                <span className="w-20 shrink-0 text-ds-caption text-muted-foreground">{PLATFORM_LABEL[plat]}</span>
                {specs.filter((s) => s.platform === plat).map((s) => {
                  const q = draft.counts[s.key] || 0
                  return (
                    <span
                      key={s.key}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-1 py-0.5 text-xs transition",
                        q ? "border-foreground bg-foreground text-background" : "text-muted-foreground",
                      )}
                    >
                      {q > 0 && (
                        <button type="button" onClick={() => bump(s.key, -1)} className="grid h-5 w-5 place-items-center rounded-full hover:bg-background/20" aria-label={`One fewer ${s.label}`}>
                          <Minus className="h-3 w-3" />
                        </button>
                      )}
                      <button type="button" onClick={() => bump(s.key, 1)} className="px-1.5 py-0.5">
                        {q > 1 ? `${q} × ` : ""}{s.label}
                      </button>
                      {q > 0 && (
                        <button type="button" onClick={() => bump(s.key, 1)} className="grid h-5 w-5 place-items-center rounded-full hover:bg-background/20" aria-label={`One more ${s.label}`}>
                          <Plus className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  )
                })}
              </div>
            ))}
            {platforms.length < 3 && (
              <p className="text-ds-caption text-muted-foreground">
                To include {["tiktok", "youtube"].filter((p) => !platforms.includes(p as any)).map((p) => PLATFORM_LABEL[p as "tiktok"]).join(" or ")},
                add their handle on the Overview tab first.
              </p>
            )}
          </div>
          <div className={cn("grid gap-ds-2", canSeeCost && canSeeSell ? "sm:grid-cols-2" : "grid-cols-1")}>
            {canSeeCost && (
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ds-caption text-muted-foreground">We pay AED</span>
                <Input className="h-9 pl-24 text-right tabular-nums" placeholder="Not set" value={draft.cost}
                  onChange={(e) => setDraft({ ...draft, cost: e.target.value })} />
              </div>
            )}
            {canSeeSell && (
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ds-caption text-muted-foreground">We charge AED</span>
                <Input className="h-9 pl-28 text-right tabular-nums" placeholder="Not set" value={draft.sell}
                  onChange={(e) => setDraft({ ...draft, sell: e.target.value })} />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-ds-2">
            <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save package"}</Button>
          </div>
        </div>
      )}
    </section>
  )
}
