'use client'

/**
 * The merchant's sidebar.
 *
 * Four places a merchant can go, and three they will be able to go after the
 * trial. The locked three are shown rather than hidden on purpose: the trial
 * is a free sample of a product with more rooms in it, and the doors should be
 * visible. Each locked row links to the module's own page, which sells it.
 */
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Megaphone, Users, Image as ImageIcon, Search, Link2, FileText, Lock, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { Face } from './bits'

const NAV = [
  { href: '/dashboard', label: 'Home', icon: Home, match: (p: string) => p === '/dashboard' || p === '/' },
  { href: '/merchant/campaign', label: 'Campaign', icon: Megaphone, match: (p: string) => p.startsWith('/merchant/campaign') },
  { href: '/merchant/campaign#creators', label: 'Creators', icon: Users, match: () => false },
  { href: '/merchant/campaign#content', label: 'Content', icon: ImageIcon, match: () => false },
]

const LOCKED = [
  { href: '/modules/find', label: 'Discover', icon: Search },
  { href: '/modules/run', label: 'Inflink', icon: Link2 },
  { href: '/modules/mor', label: 'Contracting', icon: FileText },
]

export function MerchantSidebar({
  name,
  logoUrl,
  subtitle,
  lockedHeading = 'After your trial',
  className,
}: {
  name: string
  logoUrl?: string | null
  subtitle: string
  lockedHeading?: string
  className?: string
}) {
  const pathname = usePathname() || ''
  const { logout } = useEnhancedAuth()

  return (
    <nav
      aria-label="Main"
      className={cn(
        'flex h-full w-[232px] shrink-0 flex-col gap-7 border-r border-border bg-background px-5 pb-6 pt-7',
        className,
      )}
    >
      <Link href="/dashboard" className="px-1.5 text-[19px] font-semibold tracking-[-0.03em] text-foreground">
        following
      </Link>

      <div className="flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname)
          return (
            <Link
              key={label}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-10 items-center gap-2.5 rounded-[10px] px-3 text-sm transition-colors',
                active ? 'bg-muted font-medium text-foreground' : 'text-foreground/75 hover:bg-muted/60 hover:text-foreground',
              )}
            >
              <Icon className="size-[18px]" strokeWidth={1.75} />
              {label}
            </Link>
          )
        })}
      </div>

      <div className="flex flex-col gap-1">
        <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {lockedHeading}
        </div>
        {LOCKED.map(({ href, label, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="flex h-[38px] items-center gap-2.5 rounded-[10px] px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/60"
          >
            <Icon className="size-[18px]" strokeWidth={1.75} />
            <span className="flex-1">{label}</span>
            <Lock className="size-3.5" strokeWidth={1.75} aria-label="Locked during the trial" />
          </Link>
        ))}
      </div>

      <div className="mt-auto flex items-center gap-2.5 rounded-xl px-2 py-2.5">
        <Face name={name} src={logoUrl} className="size-[34px] rounded-[10px]" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[13px] font-medium text-foreground">{name}</span>
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Sign out"
        >
          <LogOut className="size-4" strokeWidth={1.75} />
        </button>
      </div>
    </nav>
  )
}
