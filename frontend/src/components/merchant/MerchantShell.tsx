'use client'

/**
 * Sidebar on the left, one screen of content on the right.
 *
 * On a laptop the shell is exactly one viewport tall and the content inside it
 * is handed `min-h-0` so a bento can fill the height without overflowing. On a
 * phone the sidebar folds into a top bar and the page scrolls normally.
 */
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Megaphone, Users, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MerchantSidebar } from './MerchantSidebar'
import { Face } from './bits'

const TOP = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/merchant/campaign', label: 'Campaign', icon: Megaphone },
  { href: '/merchant/campaign#creators', label: 'Creators', icon: Users },
  { href: '/merchant/campaign#content', label: 'Content', icon: ImageIcon },
]

export function MerchantShell({
  name,
  logoUrl,
  subtitle,
  lockedHeading,
  children,
  className,
}: {
  name: string
  logoUrl?: string | null
  subtitle: string
  lockedHeading?: string
  children: React.ReactNode
  className?: string
}) {
  const pathname = usePathname() || ''
  return (
    <div className="flex min-h-[100dvh] bg-background text-foreground lg:h-[100dvh] lg:overflow-hidden">
      <MerchantSidebar name={name} logoUrl={logoUrl} subtitle={subtitle} lockedHeading={lockedHeading} className="hidden lg:flex" />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Phone and tablet: the sidebar folds to a bar. */}
        <header className="flex items-center gap-3 border-b border-border px-4 py-3 lg:hidden">
          <Face name={name} src={logoUrl} className="size-8 rounded-lg" />
          <span className="truncate text-sm font-medium">{name}</span>
          <nav aria-label="Main" className="ml-auto flex items-center gap-1">
            {TOP.map(({ href, label, icon: Icon }) => {
              const active = href === '/dashboard' ? pathname === '/dashboard' : href === '/merchant/campaign' && pathname.startsWith('/merchant/campaign')
              return (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className={cn(
                    'rounded-lg p-2 transition-colors',
                    active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/60',
                  )}
                >
                  <Icon className="size-[18px]" strokeWidth={1.75} />
                </Link>
              )
            })}
          </nav>
        </header>

        <main className={cn('flex min-h-0 min-w-0 flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-9 lg:py-7', className)}>
          {children}
        </main>
      </div>
    </div>
  )
}

/** The page header: a date line, a big greeting with one serif word, and whatever sits on the right. */
export function ShellHeader({
  kicker,
  lead,
  accent,
  right,
}: {
  kicker?: string
  lead: string
  accent: string
  right?: React.ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        {kicker ? <span className="text-[13px] text-muted-foreground">{kicker}</span> : null}
        <h1 className="m-0 text-[28px] font-medium leading-[1.1] tracking-[-0.025em] text-foreground sm:text-[34px]">
          {lead}{' '}
          <span className="font-serif text-[1.18em] font-normal italic">{accent}</span>
        </h1>
      </div>
      {right ? <div className="flex items-center gap-2.5">{right}</div> : null}
    </header>
  )
}
