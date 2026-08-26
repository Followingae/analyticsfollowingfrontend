'use client'

/**
 * Did the client take the add-on?
 *
 * A proposal can carry one priced extra — "With Ad Boosting Rights +20%", "With MEFCC visit"
 * — offered per line, so a reel with the uplift and a reel without can sit on the same quote
 * at different prices. The client's answer was recorded per deliverable and shown nowhere:
 * the operator screen never even received the offer, so the only way to know whether a
 * confirmed proposal included the uplift was to read the database.
 *
 * One card, one sentence: what was offered, on how many creators, and who took it.
 */
import { BadgePercent, Check, Minus } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { AdminProposalDetail } from '@/services/adminProposalMasterApi'

type Modifier = NonNullable<AdminProposalDetail['proposal']['price_modifier']>

export function AddOnUptake({ modifier }: { modifier?: Modifier | null }) {
  // No add-on on this proposal means the concept does not exist here — not an empty state.
  if (!modifier) return null

  const price = modifier.kind === 'percent'
    ? `+${modifier.percent_value}%`
    : `+AED ${Math.round(modifier.amount_aed || 0).toLocaleString('en-US')}`

  const { taken_by: taken, offered_on: offered } = modifier

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
          <BadgePercent className="size-4 text-muted-foreground" />
          {modifier.label}
          <Badge variant="outline" className="font-mono text-xs">{price}</Badge>
        </CardTitle>
        <CardDescription>
          {taken.length > 0
            ? `Taken on ${taken.length} of the ${offered.length} creators it was offered on.`
            : `Offered on ${offered.length} creator${offered.length === 1 ? '' : 's'}. Not taken.`}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {taken.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {taken.map(u => (
              <Badge key={u} variant="default" className="gap-1 bg-emerald-600 hover:bg-emerald-600">
                <Check className="size-3" />{u}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Minus className="size-3.5" />
            The client priced without it — the totals on this page carry no uplift.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
