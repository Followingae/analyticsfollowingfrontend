'use client'

/**
 * The optional priced add-on offered on a quotation — e.g. "With MEFCC visit" +15%.
 *
 * Defined once per proposal, then marked eligible per deliverable: the client chooses it
 * line by line, so one quote can carry a reel with the visit and a story without.
 *
 * Turning it off removes the concept from the quote entirely rather than deleting it, so an
 * add-on can be pulled and restored without retyping its terms.
 */

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Plus, Tag } from 'lucide-react'
import { proposalApprovalApi } from '@/services/proposalApprovalApi'

const DELIVERABLE_LABEL: Record<string, string> = {
  post: 'Post', story: 'Story', reel: 'Reel', carousel: 'Carousel',
  video: 'Video', bundle: 'Bundle', monthly: 'Monthly',
}

interface Modifier {
  id: string
  label: string
  description: string | null
  kind: 'percent' | 'fixed'
  percent_value: number | null
  amount_aed: number | null
  is_enabled: boolean
}

interface CreatorRow {
  id: string
  username: string | null
  assigned_deliverables?: Array<{ type: string; quantity?: number; modifier_eligible?: boolean }>
}

export function PriceModifierCard({
  proposalId, creators, onChanged,
}: {
  proposalId: string
  creators: CreatorRow[]
  onChanged?: () => void
}) {
  const [modifier, setModifier] = useState<Modifier | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [label, setLabel] = useState('')
  const [percent, setPercent] = useState('')
  const [enabled, setEnabled] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await proposalApprovalApi.getPriceModifier(proposalId)
      const m: Modifier | null = res.data
      setModifier(m)
      setLabel(m?.label ?? '')
      setPercent(m?.percent_value != null ? String(m.percent_value) : '')
      setEnabled(m?.is_enabled ?? true)
    } catch {
      // A missing add-on is the normal case, not an error worth shouting about.
      setModifier(null)
    } finally {
      setLoading(false)
    }
  }, [proposalId])

  useEffect(() => { void load() }, [load])

  const save = async () => {
    const pct = Number(percent)
    if (!label.trim()) { toast.error('Give the add-on a label the client will understand'); return }
    if (!Number.isFinite(pct) || pct <= 0) { toast.error('Enter a percentage above zero'); return }
    setSaving(true)
    try {
      await proposalApprovalApi.savePriceModifier(proposalId, {
        label: label.trim(), kind: 'percent', percent_value: pct, is_enabled: enabled,
      })
      toast.success('Add-on saved')
      await load()
      onChanged?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save the add-on')
    } finally {
      setSaving(false)
    }
  }

  const toggleEligibility = async (creator: CreatorRow, type: string, next: boolean) => {
    // Opt-out semantics: a line is offered unless it was explicitly taken off, so the
    // list we send back has to start from everything currently offered, not only the
    // lines carrying an explicit true.
    const current = (creator.assigned_deliverables || [])
      .filter((d) => d.modifier_eligible !== false)
      .map((d) => d.type)
    const types = next
      ? Array.from(new Set([...current, type]))
      : current.filter((t) => t !== type)
    try {
      await proposalApprovalApi.setModifierEligibility(proposalId, creator.id, types)
      onChanged?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update eligibility')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />Loading add-on…
        </CardContent>
      </Card>
    )
  }

  const live = modifier?.is_enabled && modifier.percent_value != null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-4 w-4" />Priced add-on
        </CardTitle>
        <CardDescription>
          An option the client can take per deliverable on a quotation link, for example a
          visit to an event, charged at a higher rate. Leave it off if this campaign has none.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
          <div className="space-y-1.5">
            <Label htmlFor="mod-label">Label shown to the client</Label>
            <Input id="mod-label" value={label} onChange={(e) => setLabel(e.target.value)}
              placeholder="With MEFCC visit" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mod-pct">Uplift</Label>
            <div className="relative">
              <Input id="mod-pct" value={percent} onChange={(e) => setPercent(e.target.value)}
                inputMode="decimal" placeholder="15" className="pr-7" />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-md border p-3">
          <div>
            <div className="text-sm font-medium">Offer this on the quote</div>
            <p className="text-xs text-muted-foreground">
              Off means the client never sees the option, on any deliverable.
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <Button onClick={save} disabled={saving} size="sm">
          {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />}
          {modifier ? 'Save add-on' : 'Add to this quote'}
        </Button>

        {/* Defining the add-on prices nothing on its own — a deliverable has to be marked
            eligible before the client is offered it. Saying so beats an operator wondering
            why their +15% never appeared. */}
        {live && (
          <div className="rounded-md border p-3">
            <div className="text-sm font-medium">Which deliverables can offer it?</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Only ticked deliverables show the option. A creator who is not attending should
              stay unticked.
            </p>
            <div className="mt-3 space-y-2.5">
              {creators.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center gap-2">
                  <span className="w-40 shrink-0 truncate text-sm font-medium">
                    @{c.username || 'creator'}
                  </span>
                  {(c.assigned_deliverables || []).length === 0 ? (
                    <span className="text-xs text-muted-foreground">no deliverables assigned</span>
                  ) : (
                    (c.assigned_deliverables || []).map((d) => (
                      <button
                        key={d.type}
                        type="button"
                        onClick={() => toggleEligibility(c, d.type, d.modifier_eligible === false)}
                        className="focus:outline-none"
                      >
                        <Badge variant={d.modifier_eligible !== false ? 'default' : 'outline'}
                          className="cursor-pointer">
                          {DELIVERABLE_LABEL[d.type] || d.type}
                          {d.quantity && d.quantity > 1 ? ` ×${d.quantity}` : ''}
                        </Badge>
                      </button>
                    ))
                  )}
                </div>
              ))}
              {creators.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Add creators to this proposal first.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
