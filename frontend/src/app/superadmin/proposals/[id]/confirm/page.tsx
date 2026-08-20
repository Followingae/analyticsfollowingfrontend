"use client"

/**
 * Confirming a proposal on the client's behalf.
 *
 * A page rather than a dialog, because this is not a small decision dressed up as one: it
 * locks a roster, opens a campaign, and commits us to paying every creator on the list. The
 * person doing it is reading an email in another window and deciding, line by line, who is
 * actually in — and settling what each of them really costs while the negotiation is still
 * fresh. That does not fit in a modal, and putting it in one makes it feel like a formality.
 *
 * Everything the decision needs is on the screen at once: who they took, what we charge for
 * each of them, what we are paying, and what that leaves. The rail on the right keeps the
 * total honest as rows are ticked and costs are typed, so nobody locks a deal and discovers
 * the margin afterwards.
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Check, Loader2, Lock, Mail, MessageCircle, Phone, Users2,
  AlertTriangle, Sparkles,
} from "lucide-react"
import { toast } from "sonner"

import { AuthGuard } from "@/components/AuthGuard"
import { SuperAdminInterface } from "@/components/admin/SuperAdminInterface"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { adminProposalApi, type AdminProposalDetail, type AdminProposalInfluencer } from "@/services/adminProposalMasterApi"
import { API_CONFIG } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"
import { cdnAvatar } from "@/lib/avatar"
import { sellFor, costFor } from "@/components/proposals/proposal-utils"
import { Aed } from "@/components/console/primitives"
import { cn } from "@/lib/utils"

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin`

const VIA = [
  { key: "email", label: "By email", icon: Mail },
  { key: "whatsapp", label: "On WhatsApp", icon: MessageCircle },
  { key: "call", label: "On a call", icon: Phone },
  { key: "meeting", label: "In a meeting", icon: Users2 },
] as const

type TierItem = {
  id: string
  tier?: string | null
  label?: string | null
  above_band?: boolean
}

type TierPayload = {
  selection_mode?: string
  allowances?: Record<string, number>
  state?: { tiers: Array<{ tier: string; label: string; allowed: number; picked: number; full: boolean }>; complete: boolean; total_allowed: number; total_picked: number }
  items?: TierItem[]
}

// Priced the way the proposal itself is priced — see sellFor/costFor. Reading a single
// deliverable key showed a reel-priced roster as zero.
const sellOf = (i: AdminProposalInfluencer) => sellFor(i)
const costOf = (i: AdminProposalInfluencer) => costFor(i)

const compact = (n?: number | null) =>
  n == null ? "—" : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : `${n}`

const money = (n?: number | null) =>
  n == null ? "—" : Number(n).toLocaleString("en-AE", { maximumFractionDigits: 0 })

export default function ConfirmForClientPage() {
  const id = useParams().id as string
  const router = useRouter()

  const [detail, setDetail] = useState<AdminProposalDetail | null>(null)
  const [tiers, setTiers] = useState<TierPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [via, setVia] = useState<string>("email")
  const [note, setNote] = useState("")
  const [picked, setPicked] = useState<Record<string, boolean>>({})
  const [costs, setCosts] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    try {
      const [d, t] = await Promise.all([
        adminProposalApi.getDetail(id),
        fetchWithAuth(`${BASE}/proposals/${id}/tiers`).then(r => r.ok ? r.json() : null).catch(() => null),
      ])
      setDetail(d)
      setTiers(t?.data || null)
      // Their own ticks are the starting point: most of the time the email says yes to a
      // list they already went through themselves.
      setPicked(Object.fromEntries(d.influencers.map(i => [i.id, !!i.selected_by_user])))
      if (d.proposal.status === "approved") {
        toast.info("This proposal is already confirmed")
        router.replace(`/superadmin/proposals/${id}`)
      }
    } catch (e) {
      toast.error((e as Error).message || "Could not load this proposal")
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { load() }, [load])

  const influencers = detail?.influencers || []
  const chosen = useMemo(() => influencers.filter(i => picked[i.id]), [influencers, picked])

  const tierById = useMemo(
    () => Object.fromEntries((tiers?.items || []).map(i => [i.id, i])),
    [tiers],
  )
  const byTier = (tiers?.selection_mode || "budget") === "tiers"

  /** What the tier bands look like for the selection as it stands, not as it was saved. */
  const tierState = useMemo(() => {
    if (!byTier) return null
    const allowances = tiers?.allowances || {}
    const counts: Record<string, number> = {}
    for (const i of chosen) {
      const t = tierById[i.id]?.tier
      if (t) counts[t] = (counts[t] || 0) + 1
    }
    const rows = Object.entries(allowances)
      .filter(([, want]) => Number(want) > 0)
      .map(([tier, want]) => {
        const label = (tiers?.state?.tiers || []).find(r => r.tier === tier)?.label
          || tier.charAt(0).toUpperCase() + tier.slice(1)
        const have = counts[tier] || 0
        return { tier, label, allowed: Number(want), picked: have, full: have >= Number(want) }
      })
    return {
      rows,
      complete: rows.length > 0 && rows.every(r => r.picked >= r.allowed),
      total_allowed: rows.reduce((s, r) => s + r.allowed, 0),
      total_picked: rows.reduce((s, r) => s + r.picked, 0),
    }
  }, [byTier, tiers, chosen, tierById])

  /** The money as it stands: quoted where nothing has been typed, so it is never blank. */
  const totals = useMemo(() => {
    let sell = 0, cost = 0, typed = 0
    for (const i of chosen) {
      sell += sellOf(i)
      const t = costs[i.id]
      const n = Number(t)
      if (t !== undefined && t !== "" && Number.isFinite(n)) { cost += n; typed += 1 }
      else cost += costOf(i)
    }
    return { sell, cost, margin: sell - cost, pct: sell ? ((sell - cost) / sell) * 100 : null, typed }
  }, [chosen, costs])

  const confirm = async () => {
    if (!chosen.length) { toast.error("Choose the creators they confirmed"); return }
    if (byTier && tierState && !tierState.complete) {
      toast.error(`That is not a full selection — ${tierState.total_picked} of ${tierState.total_allowed} places filled`)
      return
    }
    setSaving(true)
    try {
      const body = {
        via,
        note: note.trim() || undefined,
        selected_influencer_ids: chosen.map(i => i.id),
        costs: chosen
          .map(i => ({
            id: i.influencer_db_id || i.profile_id || i.id,
            amount_aed: Number(costs[i.id]),
          }))
          .filter(c => Number.isFinite(c.amount_aed) && c.amount_aed > 0),
      }
      const res = await fetchWithAuth(`${BASE}/proposals/${id}/confirm-for-client`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.detail || "Could not confirm this proposal")
      toast.success(j.message || "Confirmed")
      router.push(`/superadmin/proposals/${id}`)
    } catch (e) {
      toast.error((e as Error).message || "Could not confirm this proposal")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <SuperAdminInterface>
          <div className="space-y-5 p-6">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              <Skeleton className="h-[520px] rounded-2xl" />
              <Skeleton className="h-[420px] rounded-2xl" />
            </div>
          </div>
        </SuperAdminInterface>
      </AuthGuard>
    )
  }

  if (!detail) return null

  return (
    <AuthGuard>
      <SuperAdminInterface>
        <div className="space-y-6 p-6 pb-24">
          {/* ── who and what ─────────────────────────────────────────────────── */}
          <div>
            <Link href={`/superadmin/proposals/${id}`}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" />Back to the proposal
            </Link>
            <h1 className="mt-2 text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] lg:text-[34px]">
              Confirm for the client
            </h1>
            <p className="mt-1.5 max-w-2xl text-muted-foreground">
              {detail.proposal.campaign_name || detail.proposal.title}
              {detail.proposal.user_email ? ` · ${detail.proposal.user_email}` : ""}
              {" — "}locking this opens the campaign exactly as their own confirmation would.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            {/* ── the roster ─────────────────────────────────────────────────── */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-0">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5">
                    <div>
                      <h2 className="text-[15px] font-semibold">Who they confirmed</h2>
                      <p className="text-[13px] text-muted-foreground">
                        {chosen.length} of {influencers.length} selected
                        {totals.typed ? ` · ${totals.typed} costs entered` : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm"
                              onClick={() => setPicked(Object.fromEntries(influencers.map(i => [i.id, true])))}>
                        Select all
                      </Button>
                      <Button variant="ghost" size="sm"
                              onClick={() => setPicked({})}>
                        Clear
                      </Button>
                    </div>
                  </div>

                  <div className="divide-y">
                    {influencers.map(i => {
                      const on = !!picked[i.id]
                      const t = tierById[i.id]
                      const quoted = costOf(i)
                      const typed = costs[i.id]
                      const effective = typed !== undefined && typed !== "" && Number.isFinite(Number(typed))
                        ? Number(typed) : quoted
                      const margin = sellOf(i) - effective
                      return (
                        <div key={i.id}
                             className={cn("flex flex-wrap items-center gap-3 px-5 py-3.5 transition-colors",
                                           on ? "bg-primary/[0.035]" : "opacity-70")}>
                          <Checkbox
                            checked={on}
                            onCheckedChange={(v: boolean | "indeterminate") =>
                              setPicked(p => ({ ...p, [i.id]: !!v }))}
                          />
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={cdnAvatar(i.profile_image_url) || undefined} className="object-cover" />
                            <AvatarFallback className="text-[11px]">
                              {(i.username || "?").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-medium">@{i.username}</span>
                              {t?.label && (
                                <Badge variant="secondary" className="rounded-full font-normal">
                                  {t.label}
                                  {t.above_band && <Sparkles className="ml-1 h-3 w-3" />}
                                </Badge>
                              )}
                            </div>
                            <div className="text-[12.5px] text-muted-foreground">
                              {compact(i.followers_count)} followers
                              {i.assigned_deliverables?.length
                                ? ` · ${i.assigned_deliverables.map(d => `${d.quantity > 1 ? `${d.quantity}× ` : ""}${d.type}`).join(", ")}`
                                : ""}
                            </div>
                          </div>

                          <div className="w-24 text-right">
                            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">We charge</div>
                            <div className="text-[13.5px] font-medium tabular-nums"><Aed>{money(sellOf(i))}</Aed></div>
                          </div>

                          <div className="w-36">
                            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Confirmed cost</div>
                            <Input
                              inputMode="decimal"
                              disabled={!on}
                              value={costs[i.id] ?? ""}
                              placeholder={quoted ? String(quoted) : "—"}
                              onChange={e => setCosts(c => ({ ...c, [i.id]: e.target.value.replace(/[^\d.]/g, "") }))}
                              className="mt-0.5 h-9 text-right tabular-nums"
                            />
                          </div>

                          <div className="w-24 text-right">
                            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Margin</div>
                            <div className={cn("text-[13.5px] font-medium tabular-nums",
                                               margin < 0 && "text-rose-600 dark:text-rose-400")}>
                              <Aed>{money(margin)}</Aed>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <p className="text-[13px] text-muted-foreground">
                Leave a cost blank and the quote stands in for now — the campaign will ask for
                it again before the margin counts as real.
              </p>
            </div>

            {/* ── the decision ───────────────────────────────────────────────── */}
            <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
              <Card>
                <CardContent className="space-y-5 p-5">
                  <div>
                    <Label className="text-[13px]">How did they confirm?</Label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {VIA.map(v => (
                        <button
                          key={v.key}
                          type="button"
                          onClick={() => setVia(v.key)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-[13px] transition-colors",
                            via === v.key ? "border-primary bg-primary/10 font-medium" : "hover:bg-muted",
                          )}
                        >
                          <v.icon className="h-4 w-4" />
                          {v.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="note" className="text-[13px]">What did they say?</Label>
                    <Textarea
                      id="note"
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="“Approved — go ahead with all four for September.”"
                      className="mt-2 min-h-[90px]"
                    />
                    <p className="mt-1.5 text-[12px] text-muted-foreground">
                      Pasting the line from their email is what makes this answerable months later.
                    </p>
                  </div>

                  {byTier && tierState && (
                    <div className="rounded-xl bg-muted/50 p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-medium">Their retainer</span>
                        <span className="text-[13px] text-muted-foreground tabular-nums">
                          {tierState.total_picked}/{tierState.total_allowed}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {tierState.rows.map(r => (
                          <Badge key={r.tier} variant={r.full ? "default" : "outline"}
                                 className="rounded-full font-normal">
                            {r.label} {r.picked}/{r.allowed}
                          </Badge>
                        ))}
                      </div>
                      {!tierState.complete && (
                        <p className="mt-2 flex items-start gap-1.5 text-[12.5px] text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          Every place has to be filled before this can be locked.
                        </p>
                      )}
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[13.5px]">
                      <span className="text-muted-foreground">They pay</span>
                      <span className="font-medium tabular-nums"><Aed>{money(totals.sell)}</Aed></span>
                    </div>
                    <div className="flex items-center justify-between text-[13.5px]">
                      <span className="text-muted-foreground">We pay</span>
                      <span className="font-medium tabular-nums"><Aed>{money(totals.cost)}</Aed></span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13.5px] text-muted-foreground">Margin</span>
                      <span className={cn("text-lg font-semibold tabular-nums",
                                          totals.margin < 0 && "text-rose-600 dark:text-rose-400")}>
                        <Aed>{money(totals.margin)}</Aed>
                        {totals.pct != null && (
                          <span className="ml-1.5 text-[13px] font-normal text-muted-foreground">
                            {totals.pct.toFixed(1)}%
                          </span>
                        )}
                      </span>
                    </div>
                    {totals.margin < 0 && (
                      <p className="flex items-start gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-[12.5px] text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        This selection costs more than it earns.
                      </p>
                    )}
                  </div>

                  <Button onClick={confirm} disabled={saving || !chosen.length} className="w-full gap-2 rounded-xl">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                    Lock it in
                  </Button>
                  <p className="text-center text-[12px] text-muted-foreground">
                    Opens the campaign and books {chosen.length || "no"} creator{chosen.length === 1 ? "" : "s"}.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-dashed">
                <CardContent className="space-y-2 p-4 text-[12.5px] text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    Their copy of the proposal keeps the roster and the agreed total. The
                    per-creator prices come off the moment it is locked.
                  </p>
                  <p className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    It is recorded as confirmed by us, with how they told us — never as a click
                    they did not make.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SuperAdminInterface>
    </AuthGuard>
  )
}
