"use client"

/**
 * The client's proposal, as a plan they build rather than a list they judge.
 *
 * The problem this exists to solve: clients open a proposal, look at four or five
 * creators, and turn the whole thing down — so we learn nothing and the deal dies. Three
 * things here answer that. There is no proposal-level reject at all; turning people down
 * happens per creator with a reason, so a full no arrives as twelve diagnosable ones.
 * Asking for different creators unlocks only once they have genuinely read half the list.
 * And when they are over budget the page offers named, one-tap fixes instead of a red
 * number and a shrug.
 *
 * Smart pick fills the budget rather than fitting inside it: unused budget cannot be
 * carried into another campaign, so leftover money is money the client loses.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Sparkles, Check, Users, Heart, Wallet, MoreHorizontal, Download, Plus, AlertTriangle, Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button"
import { SiriOrb } from "@/components/siri-orb"
import { cdnAvatar } from "@/lib/avatar"
import { API_CONFIG } from "@/config/api"
import { fetchWithAuth } from "@/utils/apiInterceptor"
import { cn } from "@/lib/utils"
import { brandProposalViewApi, type BrandProposalView, type BrandInfluencer } from "@/services/adminProposalMasterApi"
import { planBuilderApi } from "@/services/planBuilderApi"
import { CreatorTile } from "./CreatorTile"
import { SmartPickModal } from "./SmartPickModal"
import { CreatorSheet } from "./CreatorSheet"
import {
  creatorCost, optimise, optimiseByPlaces, whyFor, STRATEGIES, type Strategy,
  modifierEligible, modifierExtra, type PriceModifier,
} from "./optimiser"
import type { ProposalSelection, RetainerMonth, TierRow } from "./types"

const COVERAGE = 0.5
const DECLINE_REASONS = ["Too expensive", "Not our audience", "Content style", "Worked with them", "Wrong category"]
const fmt = (n?: number | null) =>
  n == null ? "—" : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}K` : `${n}`
const aed = (n: number) => `AED ${Math.round(n).toLocaleString("en-US")}`

export function PlanBuilder({ proposalId, data, onReload }: {
  proposalId: string
  data: BrandProposalView
  onReload: () => Promise<void>
}) {
  const router = useRouter()
  const proposal = data.proposal as BrandProposalView["proposal"] & { total_budget?: number }
  const budget = Number(proposal.total_budget || 0)
  /* Part of this budget may already be gone. A client can say yes to some of a roster and
     come back for the rest, and when they do the creators they booked stay on the page as
     confirmed. What is left is what this visit can actually spend — planning against the
     full cap would let them build a line-up we cannot sell them. */
  const committed = Number(proposal.budget_committed || 0)
  const spendable = Math.max(0, budget - committed)
  /* Three ways a proposal is sold, and they are not variations on a theme: by the
     dirham, by the head, or the same places repeating month by month. */
  const selection = ((data as unknown as { selection?: ProposalSelection }).selection) ?? { mode: "budget" as const }
  const byTier = selection.mode === "tiers"
  const months: RetainerMonth[] = selection.periods ?? []
  const showPricing = !byTier && proposal.visible_fields?.show_sell_pricing !== false && budget > 0

  const [creators, setCreators] = useState<BrandInfluencer[]>(data.influencers)
  /* Opening a proposal starts from nothing. A selection carried over from a previous
     visit reads as us having chosen for them, and it is the first thing they see. */
  const [chosen, setChosen] = useState<Set<string>>(() => new Set())
  const [strategy, setStrategy] = useState<Strategy>("mix")
  const [sort, setSort] = useState<"rec" | "f" | "er" | "p">("rec")
  const [builtSig, setBuiltSig] = useState<string | null>(null)
  const [building, setBuilding] = useState(false)
  const [buildLog, setBuildLog] = useState<string[]>([])
  const [tested, setTested] = useState({ n: 0, total: 0, best: [] as BrandInfluencer[], spend: 0 })
  const [smartOpen, setSmartOpen] = useState(false)
  const [declining, setDeclining] = useState<BrandInfluencer | null>(null)
  const [askOpen, setAskOpen] = useState(false)
  const [askText, setAskText] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const shownRef = useRef(new Set<string>())
  const [month, setMonth] = useState<string | null>(selection.current_period ?? months[0]?.period ?? null)
  const [confirmingMonth, setConfirmingMonth] = useState(false)
  const [viewing, setViewing] = useState<BrandInfluencer | null>(null)
  /* The optional extra this proposal offers, e.g. boosting rights at +20%. It only
     applies to the creators the operator marked eligible, and only where the client
     asks for it, so it is tracked per creator rather than as one switch. */
  const modifier = (proposal as unknown as { price_modifier?: PriceModifier }).price_modifier ?? null
  const [withMod, setWithMod] = useState<Set<string>>(() => new Set())

  useEffect(() => { setCreators(data.influencers) }, [data.influencers])

  /* ---------- derived ---------- */
  /* The pool still open to them. A confirmed creator is neither choosable nor a candidate
     for the optimiser — they are already bought, and offering them again would double-book
     and double-charge. They stay on the wall; they just stop being a decision. */
  const live = useMemo(() => creators.filter(c => !c.declined_at && !c.locked), [creators])
  const lockedList = useMemo(() => creators.filter(c => c.locked), [creators])
  const picked = useMemo(() => creators.filter(c => chosen.has(c.id)), [creators, chosen])
  const extras = useMemo(
    () => picked.reduce((s, c) => s + (withMod.has(c.id) ? modifierExtra(c, modifier) : 0), 0),
    [picked, withMod, modifier])
  const eligibleCount = useMemo(() => live.filter(modifierEligible).length, [live])
  /* "With" only once every eligible creator in the line-up has it. An empty line-up reads
     as without, which is what it costs. */
  const allModOn = useMemo(() => {
    const pool = picked.filter(modifierEligible)
    return pool.length > 0 && pool.every(c => withMod.has(c.id))
  }, [picked, withMod])
  const spend = useMemo(
    () => picked.reduce((s, c) => s + creatorCost(c), 0) + extras, [picked, extras])
  /* What the whole campaign comes to: what they confirmed last time plus what they are
     adding now. The bar measures this against the cap, so a re-opened proposal starts
     part-full instead of pretending the first round never happened. */
  const allocated = committed + spend
  const over = showPricing && allocated > budget
  const reviewed = useMemo(
    () => creators.filter(c => c.client_opened_at || c.declined_at).length,
    [creators],
  )
  /* On a retainer a pick belongs to the month it was made for, so a creator taken for
     September does not eat October's places. */
  const tierOf = (c: BrandInfluencer) => (c as unknown as { tier?: string }).tier
  const places = useMemo(() => {
    const out: Record<string, number> = {}
    for (const c of picked) {
      if (months.length && ((c as unknown as { period?: string }).period ?? month) !== month) continue
      const t = tierOf(c)
      if (t) out[t] = (out[t] || 0) + 1
    }
    return out
  }, [picked, months.length, month])
  const tierRows: TierRow[] = useMemo(() =>
    Object.entries(selection.allowances ?? {})
      .filter(([, want]) => Number(want) > 0)
      .map(([tier, want]) => ({
        tier,
        label: selection.bands?.[tier]?.label || tier.charAt(0).toUpperCase() + tier.slice(1),
        allowed: Number(want),
        picked: places[tier] || 0,
      })), [selection.allowances, selection.bands, places])
  const tiersComplete = tierRows.length > 0 && tierRows.every(r => r.picked >= r.allowed)
  const openMonth = months.find(m => m.period === month) || null
  const monthLocked = !!openMonth?.is_locked || (months.length > 0 && !!openMonth && !openMonth.is_open)

  const need = Math.ceil(creators.length * COVERAGE)
  const covered = reviewed >= need

  const [recommended, setRecommended] = useState<BrandInfluencer[]>([])
  useEffect(() => {
    let alive = true
    if (!live.length) { setRecommended([]); return }
    if (byTier) { setRecommended(optimiseByPlaces(live, selection.allowances ?? {}, tierOf, strategy)); return }
    if (!showPricing) { setRecommended([]); return }
    optimise(live, spendable, strategy, undefined, 0).then(r => { if (alive) setRecommended(r.picks) })
    return () => { alive = false }
  }, [live, spendable, strategy, showPricing])
  const recIds = useMemo(() => new Set(recommended.map(c => c.id)), [recommended])

  const sig = (ids: Set<string>, s: Strategy) => `${s}:${[...ids].sort().join(",")}`
  const builtAlready = builtSig === sig(chosen, strategy)

  const sorted = useMemo(() => {
    const list = [...creators]
    if (sort === "f") list.sort((a, b) => (b.followers_count ?? 0) - (a.followers_count ?? 0))
    else if (sort === "er") list.sort((a, b) => (b.measured?.engagement_rate ?? b.engagement_rate ?? 0) - (a.measured?.engagement_rate ?? a.engagement_rate ?? 0))
    else if (sort === "p") list.sort((a, b) => creatorCost(b) - creatorCost(a))
    // The line-up floats to the top; anyone turned down sinks. Our own recommendations ride
    // just under it, in every sort and not only the default one: we were asked who we would
    // put forward, and an answer that moves when the client re-sorts is not an answer.
    return list.sort((a, b) =>
      (Number(!!b.locked) - Number(!!a.locked)) ||
      (Number(chosen.has(b.id)) - Number(chosen.has(a.id))) ||
      (Number(!!b.recommended) - Number(!!a.recommended)) ||
      (Number(!!a.declined_at) - Number(!!b.declined_at)))
  }, [creators, sort, chosen])

  /* ---------- actions ---------- */
  const save = useCallback(async (ids: Set<string>, mods?: Set<string>) => {
    const taking = mods ?? withMod
    try {
      await brandProposalViewApi.updateInfluencerSelection(proposalId, {
        selected_influencer_ids: [...ids],
        /* Only sent when there is an add-on to take. The line list mirrors what we
           assigned, with the add-on attached to the eligible lines they asked for it on;
           the server re-checks eligibility rather than trusting this. */
        deliverable_selections: modifier ? [...ids].map(id => {
          const c = creators.find(x => x.id === id)
          const on = taking.has(id)
          return {
            influencer_id: id,
            deliverables: (c?.assigned_deliverables ?? []).map((d: any) => ({
              type: d.type,
              quantity: d.quantity || 1,
              ...(on && d.modifier_eligible ? { modifier: modifier.id } : {}),
            })),
          }
        }) : undefined,
      })
    } catch { /* a failed autosave must not block the page; confirm re-sends it */ }
  }, [proposalId, creators, modifier, withMod])

  /* Taking the add-on, or dropping it, for one creator. */
  const toggleMod = useCallback((c: BrandInfluencer) => {
    setWithMod(prev => {
      const next = new Set(prev)
      next.has(c.id) ? next.delete(c.id) : next.add(c.id)
      save(chosen, next)
      return next
    })
  }, [chosen, save])

  /* With or without, across the whole line-up. Applies to everyone eligible, so a creator
     added afterwards still has to be ticked deliberately rather than silently inheriting a
     price the client never agreed to. */
  const setModAll = useCallback((on: boolean) => {
    const target = live.filter(c => modifierEligible(c) && chosen.has(c.id))
    setWithMod(prev => {
      const next = new Set(prev)
      target.forEach(c => on ? next.add(c.id) : next.delete(c.id))
      save(chosen, next)
      return next
    })
  }, [live, chosen, save])

  const toggle = useCallback((c: BrandInfluencer) => {
    /* Already booked. Not an error they made — the tile says so — but tapping it must do
       nothing rather than silently drop somebody who is briefed and shooting. */
    if (c.locked) {
      toast.info(`${c.full_name || c.username} is already confirmed`, {
        description: "They're on the campaign. This round is for adding to that.",
      })
      return
    }
    const adding = !chosen.has(c.id)
    /* A band that is full is full. Refusing here, with the reason, beats letting them
       build a selection of twenty-seven and turning it down at the end. */
    if (adding && byTier) {
      const t = tierOf(c)
      const row = tierRows.find(r => r.tier === t)
      if (!row) {
        toast.error(`${t ? t.charAt(0).toUpperCase() + t.slice(1) : "These"} creators are not part of your plan`)
        return
      }
      if (row.picked >= row.allowed) {
        toast.error(`All ${row.allowed} ${row.label} places are taken`, { description: "Remove one to swap somebody in." })
        return
      }
    }
    setChosen(prev => {
      const next = new Set(prev)
      next.has(c.id) ? next.delete(c.id) : next.add(c.id)
      save(next)
      return next
    })
    setBuiltSig(null)
  }, [save, chosen, byTier, tierRows])

  const markOpened = useCallback((c: BrandInfluencer) => {
    if (c.client_opened_at || shownRef.current.has(c.id)) return
    shownRef.current.add(c.id)
    planBuilderApi.opened(proposalId, c.id)
    setCreators(prev => prev.map(x => x.id === c.id ? { ...x, client_opened_at: new Date().toISOString() } : x))
  }, [proposalId])

  /* Beside the wall, never instead of it: sending someone to a full analytics page
     mid-decision loses them the plan they were building. */
  const openAnalytics = useCallback((c: BrandInfluencer) => {
    markOpened(c)
    setViewing(c)
  }, [markOpened])

  const doDecline = async (reason: string) => {
    const c = declining!
    setDeclining(null)
    try {
      await planBuilderApi.decline(proposalId, c.id, reason)
      setCreators(prev => prev.map(x => x.id === c.id
        ? { ...x, declined_at: new Date().toISOString(), declined_reason: reason, client_opened_at: x.client_opened_at || new Date().toISOString() }
        : x))
      setChosen(prev => { const n = new Set(prev); n.delete(c.id); return n })
    } catch (e) { toast.error((e as Error).message) }
  }

  const undecline = async (c: BrandInfluencer) => {
    try {
      await planBuilderApi.undecline(proposalId, c.id)
      setCreators(prev => prev.map(x => x.id === c.id ? { ...x, declined_at: null, declined_reason: null } : x))
    } catch (e) { toast.error((e as Error).message) }
  }

  /* The search, run in the open. It reads the shortlist back to them first, because a
     marketing team should finish this knowing people built the list, not a machine. */
  const runBuild = async () => {
    setBuilding(true); setBuildLog([])
    const posts = live.reduce((s, c) => s + (c.measured?.posts_analysed ?? 0), 0)
    const strong = live.filter(c => c.measured?.standing === "exceptional" || (c.measured?.engagement_rate ?? 0) >= 1).length
    const cats = [...new Set(live.map(c => c.measured?.category ?? c.categories?.[0]).filter(Boolean))]
    const beat = (t: string, ms = 760) => new Promise<void>(r => setTimeout(() => { setBuildLog(l => [...l, t]); r() }, ms))

    await beat(`${live.length} creators, shortlisted by our talent team for this brief`, 700)
    if (posts) await beat(`${posts.toLocaleString()} of their posts measured, not estimated`)
    if (strong) await beat(`${strong} of them engage above what is typical at their size`)
    if (cats.length) await beat(`Covering ${cats.slice(0, 4).join(", ")}${cats.length > 4 ? " and more" : ""}`)

    const r = await optimise(live, spendable, strategy, p => setTested({ n: p.tested, total: p.total, best: p.best, spend: p.spend }))
    const ids = new Set(r.picks.map(c => c.id))
    setChosen(ids); save(ids); setBuiltSig(sig(ids, strategy))
    setBuildLog(l => [...l, `Best fit found — ${aed(r.spend)} of ${aed(spendable)}, ${aed(r.leftover)} unspent`])
    await new Promise(r2 => setTimeout(r2, 900))
    setBuilding(false)
  }

  /* A retainer month is confirmed whole and on its own — approving the proposal would
     book the entire deal, which is not what this client was sold. */
  const confirmMonth = async () => {
    if (!month) return
    setConfirmingMonth(true)
    try {
      await save(chosen)
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/proposals/${proposalId}/confirm-month`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ period: month }) },
      )
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.detail || "Could not confirm that month")
      toast.success(j?.message || "Month confirmed", {
        description: j?.data?.proposal_closed
          ? "That is every month of your retainer booked."
          : "We will be in touch, and the next month opens on time.",
      })
      setConfirmOpen(false)
      await onReload()
    } catch (e) {
      toast.error((e as Error).message)
    } finally { setConfirmingMonth(false) }
  }

  const confirm = async () => {
    setSaving(true)
    try {
      const res = await brandProposalViewApi.approveProposal(proposalId, { selected_influencer_ids: [...chosen] })
      toast.success("Confirmed", { description: "We are briefing your creators now." })
      setConfirmOpen(false)
      if (res.campaign_id) setTimeout(() => router.push(`/campaigns/${res.campaign_id}`), 1200)
      else await onReload()
    } catch (e) {
      toast.error((e as Error).message || "Could not confirm")
    } finally { setSaving(false) }
  }

  const sendRequest = async () => {
    if (askText.trim().length < 5) return
    try {
      await brandProposalViewApi.requestMore(proposalId, { notes: askText.trim() })
      toast.success("Sent to the team", { description: "More creators will land here." })
      setAskOpen(false); setAskText("")
      await onReload()
    } catch (e) { toast.error((e as Error).message) }
  }

  /* ---------- over budget: named moves, not a red number ---------- */
  const moves = useMemo(() => {
    if (!over) return []
    const excess = allocated - budget
    const inPlan = [...picked].sort((a, b) => creatorCost(b) - creatorCost(a))
    const bench = live.filter(c => !chosen.has(c.id))
    const out: { key: string; title: string; sub: string; save: number; run: () => void }[] = []

    const drop = [...inPlan].reverse().find(c => creatorCost(c) >= excess)
    if (drop) out.push({
      key: "drop", title: `Drop ${drop.full_name || drop.username}`, sub: "Clears it in one move",
      save: creatorCost(drop), run: () => toggle(drop),
    })
    for (const a of inPlan) {
      const b = bench
        .filter(x => creatorCost(a) - creatorCost(x) >= excess)
        .sort((x, y) => (y.followers_count ?? 0) * (y.measured?.engagement_rate ?? 0) - (x.followers_count ?? 0) * (x.measured?.engagement_rate ?? 0))[0]
      if (b) {
        out.push({
          key: "swap",
          title: `Swap ${a.full_name || a.username} for ${b.full_name || b.username}`,
          sub: `${Math.round(((b.followers_count ?? 0) / (a.followers_count || 1)) * 100)}% of the reach at ${Math.round((creatorCost(b) / (creatorCost(a) || 1)) * 100)}% of the price`,
          save: creatorCost(a) - creatorCost(b),
          run: () => setChosen(prev => { const n = new Set(prev); n.delete(a.id); n.add(b.id); save(n); return n }),
        })
        break
      }
    }
    out.push({ key: "rebuild", title: "Rebuild it for me", sub: "Best line-up that fits, in one tap", save: excess, run: runBuild })
    return out.slice(0, 3)
  }, [over, allocated, budget, picked, live, chosen])   // eslint-disable-line react-hooks/exhaustive-deps

  const askForMore = () => { covered ? setAskOpen(true) : setSmartOpen(true) }

  /** The list, as a file. It never carries our prices — in any status. */
  const exportList = async () => {
    try {
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/campaigns/proposals/${proposalId}/export?format=xlsx`,
      )
      if (!res.ok) throw new Error(`Export failed (${res.status})`)
      const blob = await res.blob()
      const name = (res.headers.get("content-disposition") || "").match(/filename="?([^"]+)"?/)?.[1]
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url; a.download = name || "creators.xlsx"
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch (e) { toast.error((e as Error).message || "Export failed") }
  }

  /* ---------- render ---------- */
  return (
    <div className="mx-auto max-w-[1440px] px-6 pb-32">
      {/* Smart pick */}
      <section className="mt-6 rounded-[22px] border bg-gradient-to-br from-primary/[0.07] to-card p-5">
        <div className="flex flex-wrap items-center gap-5">
          <SiriOrb size="52px" animationDuration={building ? 4 : 20} />
          <div className="min-w-[168px]">
            <b className="block text-base font-bold tracking-[-0.02em]">Smart pick</b>
            <span className="text-[12.5px] text-muted-foreground">
              {building ? "Working through the list" : showPricing ? "Fills your budget, wastes nothing" : "The strongest line-up for this brief"}
            </span>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            <Tabs value={strategy} onValueChange={(v: string) => setStrategy(v as Strategy)}>
              <TabsList>
                {STRATEGIES.map(s => (
                  <TabsTrigger key={s.key} value={s.key} title={s.note}>{s.label}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className={cn(building || builtAlready ? "pointer-events-none opacity-50" : "")}>
              <LiquidMetalButton
                label={building ? "Building…" : builtAlready ? "Line-up is built" : "Build my line-up"}
                onClick={runBuild}
              />
            </div>
          </div>
        </div>

        {building && (
          <div className="mt-4 grid gap-6 border-t pt-4 md:grid-cols-[1.15fr_1fr]">
            <div className="flex flex-col gap-2.5">
              {buildLog.map((l, n) => (
                <div key={n} className="flex animate-in fade-in slide-in-from-bottom-1 items-start gap-2.5 text-[13px]">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />{l}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-baseline justify-between text-[12.5px] text-muted-foreground">
                <span>{tested.total ? "Testing every line-up against your budget" : "Reading the shortlist"}</span>
                <span className="tabular-nums"><b className="text-foreground">{tested.n.toLocaleString()}</b> / {tested.total.toLocaleString()}</span>
              </div>
              <Progress value={tested.total ? (tested.n / tested.total) * 100 : 0} className="h-[3px]" />
              <div className="flex items-center">
                {tested.best.slice(0, 8).map(c => (
                  <img key={c.id} src={cdnAvatar(c.profile_image_url || undefined)} alt=""
                       className="-ml-2 size-[30px] rounded-full object-cover ring-2 ring-card first:ml-0" />
                ))}
                {tested.spend > 0 && <b className="ml-3 text-[12.5px] tabular-nums text-muted-foreground">{aed(tested.spend)}</b>}
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_356px]">
        {/* the wall */}
        <div>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-[17px] font-bold tracking-[-0.022em]">{creators.length} creators</h2>
            <div className="ml-auto">
              <Select value={sort} onValueChange={(v: string) => setSort(v as typeof sort)}>
                <SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rec">Recommended</SelectItem>
                  <SelectItem value="f">Most followers</SelectItem>
                  <SelectItem value="er">Best engagement</SelectItem>
                  {showPricing && <SelectItem value="p">Price, high to low</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>

          {building ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(232px,1fr))] gap-4">
              {Array.from({ length: Math.min(creators.length, 8) }).map((_, n) => (
                <Skeleton key={n} className="aspect-[3/4] rounded-[20px]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(232px,1fr))] gap-4">
              {sorted.map(c => (
                <CreatorTile
                  key={c.id}
                  creator={c}
                  chosen={chosen.has(c.id)}
                  locked={!!c.locked}
                  smartPick={recIds.has(c.id)}
                  why={whyFor(c, live)}
                  showPricing={showPricing}
                  onToggle={toggle}
                  onOpen={openAnalytics}
                  onDecline={setDeclining}
                  onUndecline={undecline}
                />
              ))}
            </div>
          )}
        </div>

        {/* the plan */}
        <aside className="sticky top-[76px] flex max-h-[calc(100vh-96px)] flex-col gap-4 overflow-auto">
          {/* A retainer is the same places repeating. Each month is filled and confirmed on
              its own, and one that has not opened yet cannot be touched. */}
          {months.length > 0 && (
            <section className="rounded-[20px] border bg-card p-[18px]">
              <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                <Calendar className="size-3.5" />Your retainer
              </p>
              <div className="mt-3 flex gap-2">
                {months.map(m => (
                  <button
                    key={m.period}
                    onClick={() => {
                      if (!m.is_open && !m.is_locked) {
                        toast.info(`${m.label} is not open yet`, { description: "It opens shortly before the month starts." })
                        return
                      }
                      setMonth(m.period)
                    }}
                    className={cn(
                      "flex-1 rounded-[13px] border p-2.5 text-center transition",
                      m.period === month && "border-primary bg-primary/10",
                      m.is_locked && "border-emerald-500 bg-emerald-500/10",
                      !m.is_open && !m.is_locked && "opacity-60",
                    )}
                  >
                    <b className="block text-[12.5px] font-bold">{m.label.slice(0, 3)}</b>
                    <span className="text-[10.5px] text-muted-foreground">
                      {m.is_locked ? "confirmed" : m.is_open ? "open" : "later"}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Sold by the head: the client buys a count from each band and never sees a rate. */}
          {byTier && tierRows.length > 0 && (
            <section className="rounded-[20px] border bg-card p-[18px]">
              <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                <Check className="size-3.5" />{months.length ? `${openMonth?.label ?? "This month"}` : "What your plan includes"}
              </p>
              <div className="mt-2">
                {tierRows.map(r => (
                  <div key={r.tier} className="flex items-center justify-between border-b py-2.5 last:border-b-0">
                    <b className="text-[13px] font-semibold">{r.label}</b>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs tabular-nums text-muted-foreground">{r.picked} / {r.allowed}</span>
                      <div className="flex gap-1">
                        {Array.from({ length: r.allowed }).map((_, n) => (
                          <i key={n} className={cn("size-2.5 rounded-full border", n < r.picked ? "border-transparent bg-emerald-500" : "border-muted-foreground/40")} />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
                Prices are already agreed in your plan, so there is nothing to add up.
              </p>
            </section>
          )}

          {/* The optional extra, announced whether or not anything is picked yet. Hiding
              it inside the line-up meant a client who had chosen nobody saw no sign that
              an option existed at all, which is how it stayed invisible for weeks. */}
          {showPricing && modifier && eligibleCount > 0 && (
            <section className="rounded-[20px] border border-primary/30 bg-primary/[0.06] p-[18px]">
              <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.15em] text-primary">
                <Sparkles className="size-3.5" />Optional extra
              </p>
              <b className="mt-2.5 block text-[15px] font-bold tracking-[-0.02em]">
                {modifier.label}
                <span className="ml-2 text-[13px] font-bold text-primary">
                  {modifier.kind === "percent" ? `+${modifier.percent_value}%` : `+${aed(modifier.amount_aed ?? 0)}`}
                </span>
              </b>
              {modifier.description && (
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{modifier.description}</p>
              )}
              {/* One switch for the whole line-up, because a right like this is normally
                  bought across the board. The per-creator ticks below stay for the times
                  it is not. */}
              <div className="mt-3 grid grid-cols-2 gap-1.5 rounded-xl bg-muted/60 p-1">
                {[false, true].map(on => (
                  <button
                    key={String(on)}
                    type="button"
                    onClick={() => setModAll(on)}
                    className={cn(
                      "rounded-lg px-2 py-2 text-[12.5px] font-semibold transition",
                      allModOn === on ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {on ? "With" : "Without"}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                {allModOn
                  ? `Added to every creator in your line-up that can supply it.`
                  : `Not added. You can also add it to individual creators below.`}
              </p>
            </section>
          )}

          {showPricing && (
            <section className="rounded-[20px] border bg-card p-[18px]">
              <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                <Wallet className="size-3.5" />Your budget
              </p>
              <div className={cn("mt-3 text-[32px] font-extrabold leading-none tracking-[-0.04em]", over && "text-destructive")}>
                {aed(allocated)}
              </div>
              <Progress value={Math.min(100, budget ? (allocated / budget) * 100 : 0)} className="my-3 h-2" />
              {committed > 0 && (
                <p className="-mt-1 mb-1 flex items-center gap-1.5 text-[11.5px] font-medium text-emerald-600">
                  <Check className="size-3.5" />
                  {aed(committed)} already confirmed
                </p>
              )}
              {extras > 0 && (
                <p className="-mt-1 mb-1 text-[11.5px] text-muted-foreground">
                  Includes {aed(extras)} for {modifier?.label?.toLowerCase()}
                </p>
              )}
              <p className={cn("text-[12.5px] font-semibold", over ? "text-destructive" : allocated === budget ? "text-emerald-600" : "text-muted-foreground")}>
                {over ? `+${aed(allocated - budget)} over` : allocated === budget ? "Every dirham allocated" : `${aed(budget - allocated)} unspent of ${aed(budget)}`}
              </p>
              <p className="mt-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
                {/* A warning about losing money reads as pressure. The same fact, said as
                    something we will do for them, reads as service — and it is true. */}
                Anything left over, we&apos;ll come back with smaller creators to put it to work.
              </p>
            </section>
          )}

          {over && (
            <section className="flex animate-in fade-in flex-col gap-3 rounded-[18px] border border-destructive/35 bg-destructive/5 p-4">
              <div className="flex items-center gap-2 text-[13px] font-bold text-destructive">
                <AlertTriangle className="size-4" />{aed(allocated - budget)} over budget
              </div>
              {moves.map(m => (
                <button key={m.key} onClick={m.run}
                        className="flex w-full items-center gap-3 rounded-[14px] border bg-card p-2.5 text-left transition hover:border-foreground">
                  <span className="min-w-0 flex-1">
                    <b className="block text-[12.5px] font-bold tracking-[-0.01em]">{m.title}</b>
                    <span className="text-[11.5px] text-muted-foreground">{m.sub}</span>
                  </span>
                  {m.key !== "rebuild" && <span className="shrink-0 text-xs font-bold text-emerald-600">−{aed(m.save)}</span>}
                </button>
              ))}
            </section>
          )}

          <section className="rounded-[20px] border bg-card p-[18px]">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                <Check className="size-3.5" />Your line-up · {picked.length}
              </p>
              <div className="flex items-center gap-2" title="Opened or turned down">
                <div className="h-[5px] w-[42px] overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(reviewed / Math.max(creators.length, 1)) * 100}%` }} />
                </div>
                <span className="whitespace-nowrap text-[11.5px] font-semibold tabular-nums text-muted-foreground">{reviewed}/{creators.length} reviewed</span>
              </div>
            </div>
            {/* Already yours. Listed above the new picks rather than mixed into them: this
                part of the plan is settled and is what the rest is being added to. */}
            {lockedList.length > 0 && (
              <div className="mt-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
                  <Check className="size-3.5" />Already confirmed · {lockedList.length}
                </p>
                {lockedList.map(c => (
                  <div key={c.id} className="flex items-center gap-3 py-1.5">
                    <img src={cdnAvatar(c.profile_image_url || undefined)} alt="" className="size-8 shrink-0 rounded-full object-cover ring-2 ring-emerald-500" />
                    <b className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">{c.full_name || c.username}</b>
                    {showPricing && (
                      <span className="text-[12.5px] font-bold tabular-nums text-muted-foreground">{aed(creatorCost(c))}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3.5">
              {picked.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-5 text-center text-[12.5px] text-muted-foreground">
                  {lockedList.length > 0
                    ? "Add to your campaign — tap a creator, or let Smart pick build it."
                    : "Tap a creator, or let Smart pick build it."}
                </div>
              ) : (
                <div className="flex flex-col">
                  {[...picked].sort((a, b) => creatorCost(b) - creatorCost(a)).map(c => {
                    const canMod = !!modifier && modifierEligible(c)
                    const on = withMod.has(c.id)
                    const extra = on ? modifierExtra(c, modifier) : 0
                    return (
                      <div key={c.id} className="border-b py-2.5 last:border-b-0">
                        <div className="flex items-center gap-3">
                          <img src={cdnAvatar(c.profile_image_url || undefined)} alt="" className="size-9 shrink-0 rounded-full object-cover" />
                          <span className="min-w-0 flex-1">
                            <b className="block truncate text-[12.5px] font-semibold">{c.full_name || c.username}</b>
                            <span className="text-[11px] text-muted-foreground">
                              {fmt(c.followers_count)} · {(c.measured?.engagement_rate ?? c.engagement_rate ?? 0).toFixed(2)}%
                            </span>
                          </span>
                          {showPricing && (
                            <span className="text-right text-[12.5px] font-bold tabular-nums">
                              {aed(creatorCost(c) + extra)}
                              {extra > 0 && (
                                <span className="block text-[10.5px] font-medium text-muted-foreground">
                                  incl. {aed(extra)}
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                        {/* The priced extra, offered only on the creators it applies to. */}
                        {canMod && showPricing && (
                          <button
                            type="button"
                            onClick={() => toggleMod(c)}
                            className={cn(
                              "mt-2 flex w-full items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left transition",
                              on ? "border-primary/40 bg-primary/10" : "hover:bg-muted",
                            )}
                          >
                            <span className={cn(
                              "grid size-4 shrink-0 place-items-center rounded-[5px] border",
                              on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
                            )}>
                              {on && <Check className="size-3" />}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold">{modifier!.label}</span>
                            <span className="shrink-0 text-[11px] font-bold tabular-nums text-muted-foreground">
                              {modifier!.kind === "percent" ? `+${modifier!.percent_value}%` : `+${aed(modifier!.amount_aed ?? 0)}`}
                            </span>
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>

      {/* dock */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/80 backdrop-blur-xl md:left-[var(--sidebar-width,16.5rem)]">
        <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-6 py-3.5">
          <div className="flex">
            {picked.slice(0, 6).map(c => (
              <img key={c.id} src={cdnAvatar(c.profile_image_url || undefined)} alt=""
                   className="-ml-2.5 size-[34px] rounded-full object-cover ring-2 ring-background first:ml-0" />
            ))}
          </div>
          <div>
            <b className="block text-[15px] font-bold tabular-nums">
              {picked.length} creators{showPricing ? ` · ${aed(spend)}` : ""}
            </b>
            <span className="text-xs text-muted-foreground">
              {byTier
                ? tierRows.map(r => `${r.label} ${r.picked}/${r.allowed}`).join(" · ")
                : over ? `${aed(allocated - budget)} over budget`
                : showPricing ? `${aed(budget - allocated)} unspent`
                : `${reviewed} of ${creators.length} reviewed`}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="size-10"><MoreHorizontal className="size-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportList}>
                  <Download className="mr-2 size-4" />Export the list
                </DropdownMenuItem>
                <DropdownMenuItem onClick={askForMore}>
                  <Plus className="mr-2 size-4" />Ask for more creators
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="lg"
              className="h-10 gap-2"
              disabled={
                months.length
                  ? !tiersComplete || monthLocked
                  : byTier
                    ? !tiersComplete
                    : !picked.length || over
              }
              title={byTier && !tiersComplete ? tierRows.filter(r => r.picked < r.allowed).map(r => `${r.label} ${r.picked} of ${r.allowed}`).join(" · ") : undefined}
              onClick={() => setConfirmOpen(true)}
            >
              <Check className="size-4" />
              {months.length ? `Confirm ${openMonth?.label ?? "this month"}` : "Confirm"}
            </Button>
          </div>
        </div>
      </div>

      <CreatorSheet
        creator={viewing}
        pool={live}
        showPricing={showPricing}
        chosen={viewing ? chosen.has(viewing.id) : false}
        onToggle={c => { toggle(c); setViewing(null) }}
        onOpenChange={(open: boolean) => { if (!open) setViewing(null) }}
      />

      {/* smart pick */}
      <SmartPickModal
        open={smartOpen}
        onOpenChange={setSmartOpen}
        picks={recommended}
        pool={live}
        showPricing={showPricing}
        covered={covered}
        chosenIds={chosen}
        onAdd={toggle}
        onRemove={toggle}
        onRead={markOpened}
        onUseLineup={() => {
          const ids = new Set(recommended.map(c => c.id))
          setChosen(ids); save(ids); setBuiltSig(sig(ids, strategy))
          setSmartOpen(false); setConfirmOpen(true)
        }}
        onAskAnyway={() => { setSmartOpen(false); setAskOpen(true) }}
      />

      {/* turning one down */}
      <Dialog open={!!declining} onOpenChange={(v: boolean) => !v && setDeclining(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Not {declining?.full_name || declining?.username}?</DialogTitle>
            <DialogDescription>One tap. It is what tells us who to send you instead.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            {DECLINE_REASONS.map(r => (
              <Button key={r} variant="outline" size="sm" className="rounded-full" onClick={() => doDecline(r)}>{r}</Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* asking for more */}
      <Dialog open={askOpen} onOpenChange={setAskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ask for more creators</DialogTitle>
            <DialogDescription>Tell us what is missing and we will go and find it.</DialogDescription>
          </DialogHeader>
          <Textarea value={askText} onChange={e => setAskText(e.target.value)} placeholder="What kind of creators are you missing?" />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAskOpen(false)}>Cancel</Button>
            <Button disabled={askText.trim().length < 5} onClick={sendRequest}>Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* confirming */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{months.length ? `Confirm ${openMonth?.label ?? "this month"}` : "Confirm your line-up"}</DialogTitle>
            <DialogDescription>
              {months.length
                ? `${openMonth?.label ?? "This month"}: ${picked.length} creator${picked.length === 1 ? "" : "s"}. The next month opens on time.`
                : `${picked.length} creator${picked.length === 1 ? "" : "s"}${showPricing ? ` for ${aed(spend)}` : ""}. We brief them once you confirm.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex">
            {picked.slice(0, 8).map(c => (
              <img key={c.id} src={cdnAvatar(c.profile_image_url || undefined)} alt=""
                   className="-ml-2.5 size-9 rounded-full object-cover ring-2 ring-background first:ml-0" />
            ))}
          </div>
          {showPricing && budget - allocated > budget * 0.05 && (
            <p className="rounded-xl bg-muted p-3 text-[12.5px] leading-relaxed text-muted-foreground">
              {aed(budget - allocated)} of your budget stays open. Our team will put together a few
              smaller creators for it and send them over for your approval separately.
            </p>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Not yet</Button>
            <Button disabled={saving || confirmingMonth} onClick={months.length ? confirmMonth : confirm} className="gap-2">
              <Check className="size-4" />{saving || confirmingMonth ? "Confirming…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
