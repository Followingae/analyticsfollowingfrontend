'use client'

/**
 * How long a brand has to answer before we accept a creator for them.
 *
 * This used to be one number for every campaign — seven days, everywhere, set in code. It is
 * a good default and it stays the default. What it could not do is bend: a brand who checks
 * the platform twice a week needs longer, a brand who has told us to just fill the campaign
 * needs shorter, and a campaign we are running ourselves may not want a timer at all.
 *
 * The waiting count is on the card for a reason. A window is an abstraction until you can
 * see that four people have been sitting on it for five days.
 */
import { useCallback, useEffect, useState } from 'react'
import { Clock, Loader2, ShieldCheck, TimerOff } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { API_CONFIG } from '@/config/api'
import { fetchWithAuth } from '@/utils/apiInterceptor'
import { cn } from '@/lib/utils'

const BASE = `${API_CONFIG.BASE_URL}/api/v1/admin/fa`

type State = {
  active: boolean
  reason: string
  hours: number
  days: number
  enabled: boolean | null
  is_default: boolean
  note?: string | null
  set_at?: string | null
  campaign_type: string
  can_enable: boolean
  default_hours: number
  max_hours: number
  waiting: number
  longest_wait_hours: number | null
}

/* Days are how everyone talks about this; hours are what the worker counts in. */
const PRESETS = [
  { label: '2 days', hours: 48 },
  { label: '5 days', hours: 120 },
  { label: '7 days', hours: 168 },
  { label: '14 days', hours: 336 },
]

export function AutoApproveCard({ campaignId }: { campaignId: string }) {
  const [state, setState] = useState<State | null>(null)
  const [hours, setHours] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${BASE}/campaigns/${campaignId}/auto-approve`)
      if (!res.ok) return
      const j = await res.json()
      setState(j.data)
      setHours(j.data.enabled === false ? '' : String(j.data.hours))
    } catch { /* the card simply does not appear */ }
  }, [campaignId])

  useEffect(() => { load() }, [load])
  if (!state) return null

  const save = async (enabled: boolean | null, h: number | null) => {
    setSaving(true)
    try {
      const res = await fetchWithAuth(`${BASE}/campaigns/${campaignId}/auto-approve`, {
        method: 'PUT', body: JSON.stringify({ enabled, hours: h }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.detail || 'Could not save that')
      toast.success(j.message)
      await load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const paid = state.campaign_type !== 'barter'

  return (
    <Card className={cn(state.active && 'border-primary/40')}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
          {state.active ? <Clock className="size-4 text-primary" /> : <TimerOff className="size-4 text-muted-foreground" />}
          Accepting applications automatically
          {state.is_default && <Badge variant="outline" className="text-[10px]">Default</Badge>}
          {!state.is_default && !paid && (
            <Badge className="text-[10px]">Set for this campaign</Badge>
          )}
        </CardTitle>
        <CardDescription>{state.reason}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {state.waiting > 0 && (
          <div className={cn(
            'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
            state.active ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'bg-muted text-muted-foreground',
          )}>
            <ShieldCheck className="size-4 shrink-0" />
            {state.waiting} application{state.waiting === 1 ? '' : 's'} waiting on the brand
            {state.longest_wait_hours != null && (
              <> · longest {Math.round(state.longest_wait_hours / 24)} day
                {Math.round(state.longest_wait_hours / 24) === 1 ? '' : 's'}</>
            )}
          </div>
        )}

        {paid ? (
          /* Not a switch that is merely off — one that does not exist here. Explaining why
             is the difference between a rule and a bug. */
          <p className="text-sm text-muted-foreground">
            Paid deals are never accepted on a timer. A payment has to be agreed by a
            person, and silence is not agreement.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <Label className="text-xs">Give the brand</Label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map(p => (
                  <Button
                    key={p.hours}
                    size="sm"
                    variant={state.enabled !== false && state.hours === p.hours ? 'default' : 'outline'}
                    disabled={saving}
                    onClick={() => save(true, p.hours)}
                  >
                    {p.label}
                    {p.hours === state.default_hours && (
                      <span className="ml-1.5 text-[10px] opacity-70">default</span>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="aa-hours" className="text-xs">Or exactly, in hours</Label>
                <Input
                  id="aa-hours"
                  value={hours}
                  onChange={e => setHours(e.target.value)}
                  inputMode="numeric"
                  className="h-9 w-28 tabular-nums"
                  placeholder={String(state.default_hours)}
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={saving || !hours}
                onClick={() => save(true, Number(hours))}
              >
                {saving && <Loader2 className="mr-2 size-3.5 animate-spin" />}
                Set
              </Button>
              <div className="flex-1" />
              {state.enabled === false ? (
                <Button size="sm" variant="outline" disabled={saving} onClick={() => save(null, null)}>
                  Turn it back on
                </Button>
              ) : (
                <Button size="sm" variant="ghost" disabled={saving} onClick={() => save(false, null)}>
                  <TimerOff className="mr-1.5 size-3.5" />
                  Never auto-accept
                </Button>
              )}
              {!state.is_default && (
                <Button size="sm" variant="ghost" disabled={saving} onClick={() => save(null, null)}>
                  Back to default
                </Button>
              )}
            </div>

            <p className="text-[11.5px] leading-relaxed text-muted-foreground">
              Nothing here changes what happens when the brand answers in time. It only
              decides how long we wait before deciding for them, and the countdown the brand
              sees moves with it.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
