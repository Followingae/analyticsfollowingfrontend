'use client'

/**
 * Your areas — what this person can open, as cards, with a bubble where work is waiting.
 *
 * This is the founder's ask, close to verbatim: "their dashboard should tell them via cards,
 * ok you have access to this, this, this, and the most important ones for them specifically,
 * and anything needing their attention can have those unread bubbles."
 *
 * It is also the answer to the critique's root cause. The dashboard used to be organised
 * around the system's reasoning about your day: three regions that were not three subjects
 * but three lenses on the same items (everything, the ones that are yours, the ones that are
 * not). A lens on a relation has no name, which is why every heading had to be a sentence
 * about the viewer, and why no off-the-shelf component could render one. An OBJECT has a
 * name. Clients. Quotes. Rosters. Payouts. A new joiner understands all four on day one, and
 * shadcn already has a component for a named thing with a number on it: Card.
 *
 * So the first thing on the screen is no longer an argument about your day. It is the set of
 * things you work on, named, counted, and openable, with the ones that need you marked.
 *
 * Access is not guessed at here. `can(module)` is the same gate the screens themselves use,
 * so a card can never advertise something its destination will refuse - which is the bug on
 * the brand side today, where the menu offers Campaigns to an account that does not own it
 * and the page answers with a wall.
 */
import Link from 'next/link'
import {
  Building2, FileText, Users2, Database, Megaphone, Banknote, ClipboardCheck, Map,
  Send, FileSignature, Coins, BarChart3, type LucideIcon,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminAccess, type AdminModule } from '@/hooks/useAdminAccess'
import { cn } from '@/lib/utils'

type Area = {
  /** The badge key the server already uses. Keyed by menu key, not URL, so a rename is safe. */
  badge?: string
  title: string
  hint: string
  href: string
  icon: LucideIcon
  module?: AdminModule
  /** Scopes that work on this. Leadership sees everything regardless. */
  scopes?: string[]
}

/**
 * One list for everybody. Roles change which cards are PRESENT, never what they are called
 * or what order they come in, so two colleagues can talk about the same screen using the
 * same word. The old sidebar produced four structurally different menus all labelled "Work",
 * which is most of "even our team sidebars are confusing".
 */
const AREAS: Area[] = [
  { title: 'Clients', hint: 'The brands we run', href: '/work/clients',
    icon: Building2, module: 'clients', scopes: ['leadership', 'account'] },
  { title: 'Brands', hint: 'Everyone we are talking to', href: '/work/brands',
    icon: Building2, module: 'clients', badge: 'brands',
    scopes: ['leadership', 'account', 'business_development'] },
  { title: 'Quotes', hint: 'Priced and sitting with clients', href: '/work/proposals',
    icon: FileText, module: 'proposals', badge: 'proposals' },
  { title: 'Rosters', hint: 'What each client asked us to source', href: '/work/areas',
    icon: Database, module: 'influencers', badge: 'areas' },
  { title: 'Creators', hint: 'The master database', href: '/work/influencers',
    icon: Users2, module: 'influencers' },
  { title: 'Pricing', hint: 'Creators nobody can sell yet', href: '/work/influencers/review',
    icon: Coins, module: 'influencers', badge: 'needs-price',
    scopes: ['leadership', 'talent'] },
  { title: 'Campaigns', hint: 'Live work and where it has got to', href: '/work/campaigns',
    icon: Megaphone, module: 'campaigns' },
  { title: 'Chasing', hint: 'Creators late or waiting on something', href: '/work/chasing',
    icon: ClipboardCheck, module: 'campaigns', badge: 'chasing',
    scopes: ['leadership', 'talent', 'account'] },
  { title: 'Enrolments', hint: 'Who has signed, and their bank details',
    href: '/work/enrolments', icon: FileSignature, module: 'influencers',
    badge: 'enrolments', scopes: ['leadership', 'talent'] },
  { title: 'Payouts', hint: 'What we owe creators', href: '/work/payables',
    icon: Banknote, module: 'influencers', badge: 'payables',
    scopes: ['leadership', 'talent'] },
  { title: 'Approvals', hint: 'Held until a founder says yes', href: '/work/approvals',
    icon: ClipboardCheck, badge: 'signoffs', scopes: ['leadership'] },
  { title: 'Share links', hint: 'What clients have been sent', href: '/work/share',
    icon: Send, module: 'clients', scopes: ['leadership', 'account', 'business_development'] },
  { title: 'Coverage', hint: 'Categories and cities we cannot field', href: '/work/coverage',
    icon: Map, module: 'influencers', scopes: ['leadership', 'talent'] },
  { title: 'Targets', hint: 'The numbers set for the team', href: '/work/goals',
    icon: BarChart3, scopes: ['leadership', 'talent'] },
]

export function AreaCards({ scope, badges, loading }: {
  scope: string | null
  badges: Record<string, number>
  loading: boolean
}) {
  const { can, isSuperAdmin, loading: accessLoading } = useAdminAccess()

  // Reserve the height rather than rendering three cards and then jumping to fourteen. The
  // old sidebar did exactly that on every load: keyboard focus was destroyed mid-tab.
  if (accessLoading || loading || !scope) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, n) => (
          <Skeleton key={n} className="h-[92px] rounded-xl" />
        ))}
      </div>
    )
  }

  const mine = AREAS.filter(a => {
    if (a.module && !can(a.module)) return false
    if (a.scopes && !isSuperAdmin && !a.scopes.includes(scope)) return false
    return true
  })

  if (!mine.length) return null

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      {mine.map(a => {
        const count = a.badge ? badges[a.badge] : undefined
        return (
          <Link key={a.href} href={a.href} className="group rounded-xl focus-visible:outline-none
                                                      focus-visible:ring-2 focus-visible:ring-ring
                                                      focus-visible:ring-offset-2">
            <Card className="h-full transition-colors group-hover:bg-accent/50">
              <CardContent className="flex h-full flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <a.icon className="h-[18px] w-[18px] text-muted-foreground" />
                  {/* A bubble is news. The server already drops zeros, so a number here
                      always means something is waiting. */}
                  {count ? (
                    <Badge variant="destructive" className="h-5 min-w-5 justify-center px-1.5
                                                            tabular-nums">
                      {count > 99 ? '99+' : count}
                      <span className="sr-only"> waiting</span>
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-auto">
                  <p className={cn('text-sm font-medium leading-none',
                                   count ? 'text-foreground' : 'text-foreground')}>
                    {a.title}
                  </p>
                  <p className="mt-1.5 text-xs leading-snug text-muted-foreground">{a.hint}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
