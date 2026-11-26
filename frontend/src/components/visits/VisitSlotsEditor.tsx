'use client'

/**
 * The times a place can host creators: a month to tap, a window to add on the tapped
 * day, and the windows so far grouped by day.
 *
 * Used by the merchant wizard and by the staff brief editor (`compact`). It edits the
 * slot list only; the mode and the note belong to whoever holds the schedule.
 */
import * as React from 'react'
import { createContext, useContext, useMemo, useState } from 'react'
import { Plus, X, Sun, Moon, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Calendar, CalendarDayButton } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  newSlotId,
  slotIsPast,
  slotTimeLabel,
  sortSlots,
  timeLabel,
  visitDayLabel,
  type VisitSlot,
} from '@/services/merchantApi'

const pad = (n: number) => String(n).padStart(2, '0')
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const fromYmd = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Half-hour steps, 6am to 11:30pm. */
const TIMES = Array.from({ length: 36 }, (_, i) => {
  const mins = 6 * 60 + i * 30
  return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`
})

const PRESETS = [
  { label: 'Lunch 12 to 3', start: '12:00', end: '15:00', icon: Sun },
  { label: 'Evening 7 to 10', start: '19:00', end: '22:00', icon: Moon },
]

/** How many slots each day holds, read by the day buttons without remounting the grid. */
const Counts = createContext<Record<string, number>>({})

function DayWithSlots(props: React.ComponentProps<typeof CalendarDayButton>) {
  const counts = useContext(Counts)
  const n = counts[ymd(props.day.date)] || 0
  return (
    <CalendarDayButton {...props}>
      {props.children}
      {n > 0 ? (
        <span aria-label={`${n} ${n === 1 ? 'time' : 'times'}`} className="flex h-1 items-center gap-0.5 !opacity-100">
          {Array.from({ length: Math.min(n, 3) }).map((_, i) => (
            <span key={i} className="size-1 rounded-full bg-current" />
          ))}
        </span>
      ) : null}
    </CalendarDayButton>
  )
}

export function VisitSlotsEditor({
  slots,
  onChange,
  compact = false,
}: {
  slots: VisitSlot[]
  onChange: (slots: VisitSlot[]) => void
  compact?: boolean
}) {
  const sorted = useMemo(() => sortSlots(slots), [slots])
  const [day, setDay] = useState<Date | undefined>(undefined)
  const [from, setFrom] = useState('19:00')
  const [to, setTo] = useState('21:00')
  const [cap, setCap] = useState('')
  const [problem, setProblem] = useState<string | null>(null)

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const counts = useMemo(() => {
    const out: Record<string, number> = {}
    for (const s of slots) out[s.date] = (out[s.date] || 0) + 1
    return out
  }, [slots])
  const byDay = useMemo(() => {
    const groups: { date: string; slots: VisitSlot[] }[] = []
    for (const s of sorted) {
      const last = groups[groups.length - 1]
      if (last && last.date === s.date) last.slots.push(s)
      else groups.push({ date: s.date, slots: [s] })
    }
    return groups
  }, [sorted])

  const add = (start: string, end: string) => {
    if (!day) return
    if (end <= start) return setProblem('The end time has to be after the start')
    const slot: VisitSlot = { id: newSlotId(), date: ymd(day), start, end, capacity: cap.trim() ? Math.max(1, Math.round(Number(cap))) || null : null }
    if (slotIsPast(slot)) return setProblem('That time has already passed')
    if (slots.some((s) => s.date === slot.date && s.start === start && s.end === end)) return setProblem('That time is already added')
    setProblem(null)
    onChange([...slots, slot])
  }
  const remove = (id: string) => onChange(slots.filter((s) => s.id !== id))
  const anyPast = sorted.some((s) => slotIsPast(s))

  const trigger = compact ? 'h-9 rounded-md' : 'h-11 rounded-xl bg-background'

  return (
    <div className={cn('flex flex-col', compact ? 'gap-3' : 'gap-4')}>
      <div className={cn('flex flex-col items-center rounded-2xl border border-border bg-card', compact ? 'p-2' : 'p-3')}>
        <Counts.Provider value={counts}>
          <Calendar
            mode="single"
            selected={day}
            onSelect={(d) => {
              setDay(d)
              setProblem(null)
            }}
            defaultMonth={sorted[0] ? fromYmd(sorted[0].date) : today}
            disabled={{ before: today }}
            showOutsideDays={false}
            weekStartsOn={1}
            components={{ DayButton: DayWithSlots }}
            className={cn('bg-transparent p-0', compact ? '[--cell-size:2.25rem]' : '[--cell-size:2.5rem] sm:[--cell-size:2.75rem]')}
          />
        </Counts.Provider>

        {day ? (
          <div className={cn('mt-3 flex w-full flex-col gap-3 rounded-xl bg-muted/60', compact ? 'p-2.5' : 'p-3.5')}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium">{visitDayLabel(ymd(day))}</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => add(p.start, p.end)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-xs transition-colors hover:bg-muted"
                  >
                    <p.icon className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_110px_auto]">
              <Select value={from} onValueChange={(v: string) => { setFrom(v); if (to <= v) setTo(TIMES[Math.min(TIMES.indexOf(v) + 4, TIMES.length - 1)]) }}>
                <SelectTrigger className={cn('w-full', trigger)} aria-label="From">
                  <span className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">From</span>
                    <SelectValue />
                  </span>
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {TIMES.slice(0, -1).map((t) => (
                    <SelectItem key={t} value={t}>
                      {timeLabel(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger className={cn('w-full', trigger)} aria-label="To">
                  <span className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">To</span>
                    <SelectValue />
                  </span>
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {TIMES.filter((t) => t > from).map((t) => (
                    <SelectItem key={t} value={t}>
                      {timeLabel(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={cap}
                onChange={(e) => setCap(e.target.value)}
                placeholder="Max creators"
                aria-label="Max creators, optional"
                className={cn(
                  'w-full border border-input bg-background px-3 text-sm placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
                  trigger,
                )}
              />
              <button
                type="button"
                onClick={() => add(from, to)}
                className={cn(
                  'inline-flex items-center justify-center gap-1.5 bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90',
                  trigger,
                )}
              >
                <Plus className="size-4" /> Add
              </button>
            </div>
            {problem ? (
              <span className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="size-3.5" />
                {problem}
              </span>
            ) : null}
          </div>
        ) : (
          <p className="m-0 mt-2 text-xs text-muted-foreground">Tap a day to add a time.</p>
        )}
      </div>

      {byDay.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {byDay.map((g) => (
            <div key={g.date} className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
              <button
                type="button"
                onClick={() => setDay(fromYmd(g.date))}
                className="w-[92px] shrink-0 pt-1.5 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                {visitDayLabel(g.date)}
              </button>
              <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                {g.slots.map((s) => {
                  const past = slotIsPast(s)
                  return (
                    <li
                      key={s.id}
                      className={cn(
                        'inline-flex h-8 items-center gap-1 rounded-full pl-3 pr-1 text-[13px]',
                        past ? 'bg-destructive/10 text-destructive' : 'bg-muted',
                      )}
                    >
                      {slotTimeLabel(s)}
                      {s.capacity ? <span className="text-muted-foreground"> · up to {s.capacity}</span> : null}
                      {past ? <span> · passed</span> : null}
                      <button
                        type="button"
                        onClick={() => remove(s.id)}
                        aria-label={`Remove ${visitDayLabel(s.date)} ${slotTimeLabel(s)}`}
                        className="ml-0.5 rounded-full p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                      >
                        <X className="size-3.5" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
          {anyPast ? <span className="text-xs text-destructive">Remove the times that have passed.</span> : null}
        </div>
      ) : null}
    </div>
  )
}
