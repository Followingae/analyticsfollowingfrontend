'use client'

/**
 * The handful of places this person actually goes, as buttons.
 *
 * WHY THIS IS NOT THE SIDEBAR AGAIN
 * ---------------------------------
 * An earlier version of this screen carried fourteen "areas you can open" cards plus a strip
 * of chips, both of them a second and third copy of the sidebar, and they were deleted for
 * good reason: navigation belongs in the nav. This is a different thing and it has to stay a
 * different thing. The sidebar lists everywhere you MAY go, in a fixed order, forever. These
 * are the four to six places where work is waiting for THIS person RIGHT NOW, carrying the
 * count that makes them worth pressing, and they reorder as the day does: anything with a
 * number on it sorts above anything without.
 *
 * The rule that keeps it honest: a shortcut with nothing behind it does not earn a count
 * chip, and a route this role cannot open is never listed at all.
 *
 * Names come from `destinations.ts`, never from here. One screen, one name, everywhere.
 */
import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Banknote, BarChart3, Building2, ClipboardCheck, Coins, Database, FileSignature,
  FileText, Map, Megaphone, Send, Users2, Wallet, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { shortName, hintFor } from '@/lib/destinations'

type Shortcut = { href: string; icon: LucideIcon; badge?: string }

/**
 * Per role, in the order the work reaches them. Every href here is already in the sidebar
 * for that role, so a shortcut can never be a door to a room they are not allowed in.
 */
const BY_SCOPE: Record<string, Shortcut[]> = {
  talent: [
    { href: '/work/influencers/review', icon: Coins, badge: 'needs-price' },
    { href: '/work/chasing', icon: ClipboardCheck, badge: 'chasing' },
    { href: '/work/areas', icon: Database, badge: 'areas' },
    { href: '/work/influencers', icon: Users2 },
    { href: '/work/coverage', icon: Map },
    { href: '/work/enrolments', icon: FileSignature, badge: 'enrolments' },
  ],
  leadership: [
    { href: '/work/approvals', icon: ClipboardCheck, badge: 'signoffs' },
    { href: '/work/proposals', icon: FileText, badge: 'proposals' },
    { href: '/work/influencers/review', icon: Coins, badge: 'needs-price' },
    { href: '/work/payables', icon: Banknote, badge: 'payables' },
    { href: '/work/money', icon: Wallet },
    { href: '/work/goals', icon: BarChart3 },
  ],
  account: [
    { href: '/work/clients', icon: Building2 },
    { href: '/work/proposals', icon: FileText, badge: 'proposals' },
    { href: '/work/share', icon: Send },
    { href: '/work/brands', icon: Building2, badge: 'brands' },
    { href: '/work/campaigns', icon: Megaphone },
    { href: '/work/chasing', icon: ClipboardCheck, badge: 'chasing' },
  ],
  business_development: [
    { href: '/work/brands', icon: Building2, badge: 'brands' },
    { href: '/work/share', icon: Send },
    { href: '/work/proposals', icon: FileText, badge: 'proposals' },
    { href: '/work/clients', icon: Building2 },
  ],
}

export function Shortcuts({
  scope, badges, primary,
}: {
  scope?: string | null
  badges?: Record<string, number> | null
  primary?: { label: string; href: string } | null
}) {
  const router = useRouter()

  const items = useMemo(() => {
    const list = BY_SCOPE[scope || ''] ?? BY_SCOPE.leadership
    const n = (s: Shortcut) => (s.badge ? Number(badges?.[s.badge] ?? 0) : 0)
    // Anything waiting sorts first, biggest pile leading. Ties keep the written order, which
    // is the order the work actually reaches this role.
    return [...list].sort((a, b) => n(b) - n(a))
  }, [scope, badges])

  return (
    <div data-tour="today-shortcuts" className="flex flex-wrap items-center gap-2">
      {primary && (
        <button
          type="button"
          onClick={() => router.push(primary.href)}
          className={cn(
            'inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-[13.5px] font-semibold',
            'text-primary-foreground transition-[transform,box-shadow] duration-150',
            'shadow-[0_1px_2px_rgba(16,20,12,0.16)] hover:shadow-[0_4px_14px_-4px_rgba(16,20,12,0.4)]',
            'active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2',
          )}
        >
          {primary.label}
        </button>
      )}

      {items.map(({ href, icon: Icon, badge }) => {
        const count = badge ? Number(badges?.[badge] ?? 0) : 0
        return (
          <button
            key={href}
            type="button"
            title={hintFor(href)}
            onClick={() => router.push(href)}
            className={cn(
              'group inline-flex h-11 items-center gap-2.5 rounded-full border bg-card pl-4 text-[13.5px]',
              count > 0 ? 'pr-2' : 'pr-4',
              'border-black/[0.07] dark:border-white/[0.08]',
              'transition-colors duration-150 hover:border-black/20 dark:hover:border-white/25',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2',
            )}
          >
            <Icon className="h-4 w-4 text-muted-foreground transition-colors duration-150 group-hover:text-foreground" />
            <span className="font-medium">{shortName(href)}</span>
            {count > 0 && (
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--console-lime)] px-1.5 text-[12px] font-semibold tabular-nums text-[oklch(0.22_0.012_140)]">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
