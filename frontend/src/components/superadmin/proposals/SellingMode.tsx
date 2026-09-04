'use client'

/**
 * How this proposal is sold, and who counts as what.
 *
 * Budget-wise is the old way: the client sees every price and picks against a number.
 * Tier-wise is how a retainer is actually bought — "three micro and one nano a month" — and
 * the client never sees a price at all.
 *
 * The money does not disappear, it just stops being their conversation: this screen keeps
 * cost, sell and margin on every row, because the person deciding which creators fill a band
 * is the person who has to keep us above our costs. That is the whole trade.
 *
 * A creator can be moved into a smaller band by hand. Not an edge case: a large creator
 * charging below their size can be offered as a micro, and since the client is then getting
 * more than they bought, the row says so and their card carries a badge.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Layers, Loader2, Sparkles, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { cdnAvatar } from '@/lib/avatar'
import { Aed } from '@/components/console/primitives'
import { cn } from '@/lib/utils'

type TierKey = 'nano' | 'micro' | 'macro' | 'mega'
const ORDER: TierKey[] = ['nano', 'micro', 'macro', 'mega']

type Item = {
  id: string
  username?: string | null
  avatar?: string | null
  followers_count?: number | null
  tier?: TierKey | null
  natural_tier?: TierKey | null
  label?: string | null
  set_by_hand?: boolean
  above_band?: boolean
  tier_note?: string | null
  weight?: number
  counts_as?: string | null
  weight_note?: string | null
  selected_by_user?: boolean
  sell_price_snapshot?: Record<string, number> | null
  cost_price_snapshot?: Record<string, number> | null
}

const compact = (n?: number | null) =>
  n == null ? '—' : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : `${n}`

/** The highest price we hold for a creator, so a row can be judged at a glance. */
const topOf = (m?: Record<string, number> | null) => {
  const vals = Object.values(m || {}).map(Number).filter(n => !Number.isNaN(n) && n > 0)
  return vals.length ? Math.max(...vals) : 0
}

export function SellingMode({ proposalId }: { proposalId: string }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<'budget' | 'tiers'>('budget')
  const [allowances, setAllowances] = useState<Record<string, number | string>>({})
  const [bands, setBands] = useState<Record<string, any>>({})
  const [items, setItems] = useState<Item[]>([])
  const [state, setState] = useState<any>(null)
  // What the payment structure says the deal is. A retainer for four creators a month is
  // a tier deal whether or not anybody flipped this switch, and until now nothing on the
  // screen pointed that out.
  const [terms, setTerms] = useState<{ mode?: string; months?: number; creators_per_month?: number } | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/admin/proposals/${proposalId}/tiers`)
      if (!res.ok) throw new Error('Could not load')
      const d = (await res.json()).data
      setMode(d.selection_mode === 'tiers' ? 'tiers' : 'budget')
      setBands(d.bands || {})
      setAllowances(d.allowances || {})
      setItems(d.items || [])
      setState(d.state || null)
      setTerms(d.terms || null)
    } catch { /* the rest of the page still works */ } finally { setLoading(false) }
  }, [proposalId])

  useEffect(() => { load() }, [load])

  const save = async (next: 'budget' | 'tiers', nextAllowances?: Record<string, any>) => {
    setSaving(true)
    try {
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/admin/proposals/${proposalId}/selection-mode`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selection_mode: next,
            tier_allowances: Object.fromEntries(
              Object.entries(nextAllowances ?? allowances)
                .map(([k, v]) => [k, Number(v) || 0])
                .filter(([, v]) => (v as number) > 0)),
          }),
        })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Could not save')
      setMode(next)
      toast.success(next === 'tiers'
        ? 'This one is sold by tier, so the client will not see prices'
        : 'Back to selling by budget')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save')
    } finally { setSaving(false) }
  }

  /**
   * Place a creator in a band, or say how many of it they take.
   *
   * One endpoint for both, and OMITTING a field means "leave it alone" rather than "reset
   * it". Sending `weight: 1` every time somebody changed the band would quietly undo a
   * weight another person had set deliberately.
   */
  const moveTo = async (
    row: Item,
    change: { tier?: TierKey | 'auto'; weight?: number },
  ) => {
    const body: Record<string, unknown> = {}
    if (change.tier !== undefined) body.tier = change.tier === 'auto' ? null : change.tier
    if (change.weight !== undefined) body.weight = change.weight

    try {
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/admin/proposals/${proposalId}/influencers/${row.id}/tier`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Could not save')
      const d = (await res.json()).data
      setItems(p => p.map(x => x.id === row.id ? { ...x, ...d } : x))

      if (change.weight !== undefined) {
        toast.success(change.weight > 1
          ? `@${row.username} now counts as ${change.weight} ${d.label}. The client is told before they pick.`
          : `@${row.username} counts as one ${d.label} again`)
      } else if (d.above_band) {
        toast.success(`@${row.username} counts as ${d.label}, so the client sees they are getting more`)
      }
      // The allowance maths moves with the weight, so the header counts have to be re-read
      // rather than patched from this one row.
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save that')
    }
  }

  const byTier = useMemo(() => {
    const out: Record<string, Item[]> = {}
    for (const i of items) {
      const k = i.tier || 'untiered'
      ;(out[k] ||= []).push(i)
    }
    return out
  }, [items])

  if (loading) {
    return (
      <Card><CardContent className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />Loading how this is sold…
      </CardContent></Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div>
          <CardTitle className="text-lg">How the client picks</CardTitle>
          <CardDescription>
            {mode === 'tiers'
              ? 'By tier: they choose a count from each band and never see a price.'
              : 'By budget: they see every price and pick against a number.'}
          </CardDescription>
        </div>
        <div className="flex rounded-full border p-0.5">
          {([['budget', 'By budget'], ['tiers', 'By tier']] as const).map(([k, label]) => (
            <button
              key={k}
              type="button"
              disabled={saving}
              onClick={() => save(k)}
              className={cn('rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors',
                mode === k
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'text-muted-foreground hover:text-foreground')}
            >
              {label}
            </button>
          ))}
        </div>
      </CardHeader>

      {/* The deal says one thing and the screen says another. Offer the fix rather than
          leaving somebody to work out that these two settings are related. */}
      {mode === 'budget' && !!terms?.creators_per_month && (
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3.5 dark:border-amber-900 dark:bg-amber-950/30">
            <div className="text-[13.5px]">
              <span className="font-medium">
                This deal is {terms.creators_per_month} creators a month
                {terms.months ? ` for ${terms.months} months` : ''}.
              </span>{' '}
              <span className="text-muted-foreground">
                Sold by budget, the client picks against a price instead of a count.
              </span>
            </div>
            <Button
              size="sm"
              className="rounded-xl"
              disabled={saving}
              onClick={() => save('tiers')}
            >
              Switch to picking by tier
            </Button>
          </div>
        </CardContent>
      )}

      {mode === 'tiers' && (
        <CardContent className="space-y-6">
          {!!terms?.creators_per_month && (
            <p className="text-[13px] text-muted-foreground">
              The payment structure sells {terms.creators_per_month} creators a month, so the
              bands below should add up to {terms.creators_per_month}.
            </p>
          )}

          {/* what they bought */}
          <div>
            <Label className="text-xs">How many of each, per month</Label>
            <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {ORDER.map(k => {
                const b = bands[k] || {}
                const onRoster = (byTier[k] || []).length
                return (
                  <div key={k} className="rounded-2xl border p-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[13px] font-medium">{b.label || k}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {compact(b.min)}–{b.max ? compact(b.max) : '∞'}
                      </span>
                    </div>
                    <Input
                      className="mt-2" type="number" min={0} placeholder="0"
                      value={allowances[k] ?? ''}
                      onChange={(e) => setAllowances(p => ({ ...p, [k]: e.target.value }))}
                      onBlur={() => save('tiers')}
                    />
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      {onRoster} on the roster
                    </p>
                  </div>
                )
              })}
            </div>
            {state?.tiers?.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                They have taken {state.total_picked} of {state.total_allowed}.
                {state.complete ? ' Their selection is complete.' : ' Not complete yet.'}
              </p>
            )}
          </div>

          {/* who is in each band, with the money that keeps us honest */}
          <div className="space-y-5">
            {[...ORDER, 'untiered'].map(k => {
              const rows = byTier[k] || []
              if (!rows.length) return null
              const label = k === 'untiered' ? 'No tier yet' : (bands[k]?.label || k)
              return (
                <div key={k}>
                  <div className="mb-2 flex items-center gap-2">
                    <h4 className="text-[13.5px] font-semibold">{label}</h4>
                    <Badge variant="outline">{rows.length}</Badge>
                    {allowances[k] ? (
                      <span className="text-xs text-muted-foreground">
                        client takes {Number(allowances[k])}
                        {/* Once weighting is in play, "3 picked" and "3 creators" stop being
                            the same sentence, so the band says which it means. */}
                        {(() => {
                          const t = state?.tiers?.find((x: any) => x.tier === k)
                          if (!t || !t.picked) return null
                          return t.weighted
                            ? ` · ${t.picked} filled by ${t.creators} creator${t.creators === 1 ? '' : 's'}`
                            : ` · ${t.picked} filled`
                        })()}
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    {rows.map(r => {
                      const sell = topOf(r.sell_price_snapshot)
                      const cost = topOf(r.cost_price_snapshot)
                      const margin = sell > 0 ? Math.round(((sell - cost) / sell) * 100) : null
                      return (
                        <div key={r.id}
                             className="flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={cdnAvatar(r.avatar || undefined)} alt={r.username || ''} />
                            <AvatarFallback className="text-[10px]">
                              {(r.username || '?').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate text-[13.5px] font-medium">@{r.username}</span>
                              {r.above_band && (
                                <Badge className="gap-1 border-transparent bg-[#EAF3C8] text-neutral-800 dark:bg-lime-950/60 dark:text-lime-200">
                                  <Sparkles className="h-3 w-3" />
                                  {bands[r.natural_tier || '']?.label || r.natural_tier} offered as {label}
                                </Badge>
                              )}
                              {(r.weight || 1) > 1 && (
                                <Badge className="gap-1 border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
                                  <Layers className="h-3 w-3" />
                                  counts as {r.weight} {label}
                                </Badge>
                              )}
                              {r.selected_by_user && (
                                <Badge variant="outline" className="text-emerald-700">picked</Badge>
                              )}
                            </div>
                            <p className="text-[11.5px] text-muted-foreground">
                              {compact(r.followers_count)} followers
                            </p>
                          </div>

                          {/* the numbers the client will never see */}
                          <div className="flex items-center gap-4 text-[12.5px] tabular-nums">
                            <span className="text-muted-foreground">
                              costs <span className="font-medium text-foreground"><Aed>{cost.toLocaleString()}</Aed></span>
                            </span>
                            <span className="text-muted-foreground">
                              we charge <span className="font-medium text-foreground"><Aed>{sell.toLocaleString()}</Aed></span>
                            </span>
                            {margin !== null && (
                              <span className={cn('inline-flex items-center gap-1 font-medium',
                                margin >= 25 ? 'text-emerald-600'
                                  : margin > 0 ? 'text-amber-600' : 'text-rose-600')}>
                                <TrendingUp className="h-3.5 w-3.5" />{margin}%
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Select value={r.set_by_hand ? (r.tier || 'auto') : 'auto'}
                                    onValueChange={(v: string) => moveTo(r, { tier: v as TierKey | 'auto' })}>
                              <SelectTrigger className="w-[9.5rem]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="auto">By followers</SelectItem>
                                {ORDER.map(t => (
                                  <SelectItem key={t} value={t}>Count as {bands[t]?.label || t}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {/* How many places of THIS band they take.
                                The band is named in every option rather than left to the
                                dropdown beside it: "2 places" on its own does not say two
                                places of what, and the first person to see it asked exactly
                                that. Capped at the band's allowance, because a weight larger
                                than the whole allowance makes a creator nobody could ever
                                pick, and the API refuses it. */}
                            {k !== 'untiered' && (
                              <Select value={String(r.weight || 1)}
                                      onValueChange={(v: string) => moveTo(r, { weight: Number(v) })}>
                                <SelectTrigger className="w-[11rem]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {Array.from(
                                    { length: Math.max(1, Math.min(10, Number(allowances[k]) || 10)) },
                                    (_, i) => i + 1,
                                  ).map(n => (
                                    <SelectItem key={n} value={String(n)}>
                                      {n === 1 ? `1 ${label} place` : `${n} ${label} places`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
