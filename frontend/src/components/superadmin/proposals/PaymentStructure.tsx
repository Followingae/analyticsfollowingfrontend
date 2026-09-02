'use client'

/**
 * How this deal gets paid for.
 *
 * The old block was a list of percentages — fine for "50% up front, 50% on completion" and
 * useless for a retainer, which is most of what we actually sign now: a monthly fee, a term,
 * a commitment, a number of creators the month buys, and a split within each month.
 *
 * So the form asks for the shape of the deal and the server works out the instalments. The
 * table underneath is that answer, live — the same calculation the proposal stores, the
 * client is shown, and the invoices are raised from, so nobody has to trust that three
 * separate places agree.
 */
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, CalendarClock } from 'lucide-react'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { Aed } from '@/components/console/primitives'
import { cn } from '@/lib/utils'

export type Split = { label: string; pct: number | string; when: 'start' | 'end' | 'day'; day?: number }
export type Milestone = { label: string; pct: number | string; days_after_start?: number | string | null }

export type PaymentTerms = {
  mode: 'one_off' | 'retainer'
  starts_on?: string | null
  notes?: string | null
  // retainer
  months?: number | string
  lock_months?: number | string
  monthly_amount?: number | string
  creators_per_month?: number | string
  splits?: Split[]
  // one-off
  milestones?: Milestone[]
}

type Instalment = {
  seq: number; label: string; period_label?: string | null
  due_date?: string | null; amount_aed: number; pct?: number; locked?: boolean
}

export const DEFAULT_TERMS: PaymentTerms = {
  mode: 'one_off',
  milestones: [
    { label: 'Advance', pct: 50, days_after_start: 0 },
    { label: 'On completion', pct: 50, days_after_start: null },
  ],
}

/** What a retainer looks like when you pick it — the shape we sign most often. */
const RETAINER_DEFAULT: PaymentTerms = {
  mode: 'retainer',
  months: 3,
  lock_months: 3,
  monthly_amount: 12000,
  creators_per_month: 4,
  splits: [
    { label: 'Month start', pct: 50, when: 'start' },
    { label: 'Month end', pct: 50, when: 'end' },
  ],
}

const when = (d?: string | null) =>
  !d ? 'no date yet'
  : new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export function PaymentStructure({
  terms, onChange, total,
}: {
  terms: PaymentTerms
  onChange: (t: PaymentTerms) => void
  /** The roster total — what a one-off is worth. A retainer is worth its own fee × term. */
  total?: number
}) {
  const [rows, setRows] = useState<Instalment[]>([])
  const [value, setValue] = useState<number>(0)
  const [summary, setSummary] = useState<string>('')

  const set = (patch: Partial<PaymentTerms>) => onChange({ ...terms, ...patch })

  // The preview is the server's own calculation, not a second one written in the browser
  // that could round differently or disagree about which day a month ends.
  const preview = useCallback(async () => {
    try {
      const res = await fetchWithAuth(
        `${API_CONFIG.BASE_URL}/api/v1/admin/proposals/payment-terms/preview`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_terms: terms, total: total || 0 }),
        })
      if (!res.ok) return
      const d = (await res.json()).data
      setRows(d?.instalments || [])
      setValue(d?.contract_value_aed || 0)
      setSummary(d?.summary || '')
    } catch { /* the form still works without its preview */ }
  }, [terms, total])

  useEffect(() => {
    const t = setTimeout(preview, 250)
    return () => clearTimeout(t)
  }, [preview])

  const isRetainer = terms.mode === 'retainer'
  const pctTotal = isRetainer
    ? (terms.splits || []).reduce((s, x) => s + (Number(x.pct) || 0), 0)
    : (terms.milestones || []).reduce((s, x) => s + (Number(x.pct) || 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Label>How this is paid for</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            A one-off campaign billed in stages, or a retainer that repeats every month.
          </p>
        </div>
        <div className="flex rounded-full border p-0.5">
          {([['one_off', 'One-off'], ['retainer', 'Monthly retainer']] as const).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => onChange(k === 'retainer'
                ? { ...RETAINER_DEFAULT, starts_on: terms.starts_on }
                : { ...DEFAULT_TERMS, starts_on: terms.starts_on })}
              className={cn('rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors',
                terms.mode === k
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'text-muted-foreground hover:text-foreground')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label className="text-xs">Starts</Label>
          <Input className="mt-1.5" type="date" value={terms.starts_on || ''}
                 onChange={(e) => set({ starts_on: e.target.value || null })} />
        </div>

        {isRetainer && (
          <>
            <div>
              <Label className="text-xs">Every month, we charge</Label>
              <Input className="mt-1.5" type="number" inputMode="decimal" placeholder="12000"
                     value={terms.monthly_amount ?? ''}
                     onChange={(e) => set({ monthly_amount: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">For how many months</Label>
              <Input className="mt-1.5" type="number" min={1} value={terms.months ?? ''}
                     onChange={(e) => set({ months: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Committed for</Label>
              <Input className="mt-1.5" type="number" min={0} value={terms.lock_months ?? ''}
                     onChange={(e) => set({ lock_months: e.target.value })} />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Months they cannot walk away from.
              </p>
            </div>
            <div>
              <Label className="text-xs">Creators a month</Label>
              <Input className="mt-1.5" type="number" min={0} value={terms.creators_per_month ?? ''}
                     onChange={(e) => set({ creators_per_month: e.target.value })} />
            </div>
          </>
        )}
      </div>

      {/* how each month, or the whole job, is split */}
      <div>
        <Label className="text-xs">
          {isRetainer ? 'How each month is split' : 'What they pay against'}
        </Label>
        <div className="mt-2 space-y-2">
          {isRetainer
            ? (terms.splits || []).map((s, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <Input className="min-w-[9rem] flex-1" placeholder="e.g. Month start"
                         value={s.label}
                         onChange={(e) => set({ splits: (terms.splits || []).map((x, j) => j === i ? { ...x, label: e.target.value } : x) })} />
                  <div className="relative w-24">
                    <Input type="number" className="pr-7" value={s.pct}
                           onChange={(e) => set({ splits: (terms.splits || []).map((x, j) => j === i ? { ...x, pct: e.target.value } : x) })} />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  </div>
                  <Select value={s.when}
                          onValueChange={(v) => set({ splits: (terms.splits || []).map((x, j) => j === i ? { ...x, when: v as Split['when'] } : x) })}>
                    <SelectTrigger className="w-[10.5rem]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="start">on the 1st</SelectItem>
                      <SelectItem value="end">on the last day</SelectItem>
                      <SelectItem value="day">on a set day</SelectItem>
                    </SelectContent>
                  </Select>
                  {s.when === 'day' && (
                    <Input className="w-20" type="number" min={1} max={31} value={s.day ?? 15}
                           onChange={(e) => set({ splits: (terms.splits || []).map((x, j) => j === i ? { ...x, day: Number(e.target.value) } : x) })} />
                  )}
                  <Button type="button" size="icon" variant="ghost"
                          onClick={() => set({ splits: (terms.splits || []).filter((_, j) => j !== i) })}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            : (terms.milestones || []).map((m, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <Input className="min-w-[9rem] flex-1" placeholder="e.g. Advance" value={m.label}
                         onChange={(e) => set({ milestones: (terms.milestones || []).map((x, j) => j === i ? { ...x, label: e.target.value } : x) })} />
                  <div className="relative w-24">
                    <Input type="number" className="pr-7" value={m.pct}
                           onChange={(e) => set({ milestones: (terms.milestones || []).map((x, j) => j === i ? { ...x, pct: e.target.value } : x) })} />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input className="w-24" type="number" placeholder="days"
                           value={m.days_after_start ?? ''}
                           onChange={(e) => set({ milestones: (terms.milestones || []).map((x, j) => j === i ? { ...x, days_after_start: e.target.value === '' ? null : e.target.value } : x) })} />
                    <span className="text-xs text-muted-foreground">days after the start</span>
                  </div>
                  <Button type="button" size="icon" variant="ghost"
                          onClick={() => set({ milestones: (terms.milestones || []).filter((_, j) => j !== i) })}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Button
            type="button" size="sm" variant="outline"
            onClick={() => isRetainer
              ? set({ splits: [...(terms.splits || []), { label: '', pct: '', when: 'start' }] })
              : set({ milestones: [...(terms.milestones || []), { label: '', pct: '', days_after_start: null }] })}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            {isRetainer ? 'Another split' : 'Another stage'}
          </Button>
          <span className={cn('text-xs', pctTotal === 100 ? 'text-emerald-600' : 'text-amber-600')}>
            {pctTotal}%{pctTotal !== 100 ? ', should add up to 100%' : ''}
          </span>
        </div>
      </div>

      {/* what it actually bills */}
      {rows.length > 0 && (
        <div className="rounded-2xl border bg-muted/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
              <span className="text-[13px] font-medium">
                {rows.length} payment{rows.length === 1 ? '' : 's'}
              </span>
            </div>
            <span className="text-[15px] font-semibold tabular-nums">
              <Aed>{value.toLocaleString('en-AE', { minimumFractionDigits: 0 })}</Aed>
            </span>
          </div>
          {summary && <p className="mt-1.5 text-xs text-muted-foreground">{summary}</p>}

          <div className="mt-3 max-h-64 space-y-1 overflow-y-auto">
            {rows.map(r => (
              <div key={r.seq}
                   className="flex items-center gap-3 rounded-xl bg-background px-3 py-2 text-[13px]">
                <span className="w-6 shrink-0 text-muted-foreground tabular-nums">{r.seq}</span>
                <span className="min-w-0 flex-1 truncate">
                  {r.period_label ? `${r.period_label} · ` : ''}{r.label}
                  {r.locked && (
                    <Badge variant="outline" className="ml-2 h-5 px-1.5 text-[10.5px]">committed</Badge>
                  )}
                </span>
                <span className="shrink-0 text-muted-foreground">{when(r.due_date)}</span>
                <span className="w-28 shrink-0 text-right font-medium tabular-nums">
                  <Aed>{r.amount_aed.toLocaleString('en-AE', { minimumFractionDigits: 2 })}</Aed>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
