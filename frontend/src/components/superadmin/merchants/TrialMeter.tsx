'use client'

/**
 * Month x of 3 in words, this month's creators as five pills.
 *
 * Five pills because the programme is five creators a month, and "3 of 5" read as pills is a
 * glance where "60%" is a sum. Shared by the merchants table and the lead panel.
 */

import type { MerchantTrial } from '@/services/merchantAdminApi'
import { cn } from '@/lib/utils'

export function TrialMeter({ trial: t, className }: { trial: MerchantTrial; className?: string }) {
  const per = Math.max(1, t.creators_per_month || 5)
  const used = Math.min(per, Math.max(0, t.used_this_month || 0))
  const months = t.months || 3
  const line = t.status === 'pending'
    ? 'Not started'
    : t.status === 'complete'
      ? `Done, ${t.used_total} of ${t.total_creators} creators`
      : `Month ${Math.max(1, t.month)} of ${months}`
  return (
    <div className={cn('space-y-1', className)}>
      <div className="text-[12.5px]">{line}</div>
      <div className="flex items-center gap-1" aria-label={`${used} of ${per} creators used this month`}>
        {Array.from({ length: per }).map((_, i) => (
          <span key={i} className={cn(
            'h-1.5 w-4 rounded-full',
            i < used ? 'bg-[var(--tone-good-dot)]' : 'bg-black/[0.08] dark:bg-white/[0.12]',
          )} />
        ))}
        <span className="ml-1.5 text-[11.5px] tabular-nums text-muted-foreground">{used}/{per}</span>
      </div>
    </div>
  )
}
