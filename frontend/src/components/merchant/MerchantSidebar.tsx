'use client'

/**
 * The merchant's sidebar.
 *
 * Four places a merchant can go, and three they will be able to go after the
 * trial. The locked three are shown rather than hidden on purpose: the trial
 * is a free sample of a product with more rooms in it, and the doors should be
 * visible. A locked door does not open: it explains itself in a small dialog
 * and stays inside the merchant's own shell.
 */
import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Home, Megaphone, Users, Image as ImageIcon, Search, Link2, FileText, Lock, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEnhancedAuth } from '@/contexts/EnhancedAuthContext'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Face, EmptyMark } from './bits'

const NAV = [
  { href: '/dashboard', label: 'Home', icon: Home, match: (p: string) => p === '/dashboard' || p === '/' },
  { href: '/merchant/campaign', label: 'Campaign', icon: Megaphone, match: (p: string) => p.startsWith('/merchant/campaign') },
  { href: '/merchant/campaign#creators', label: 'Creators', icon: Users, match: () => false },
  { href: '/merchant/campaign#content', label: 'Content', icon: ImageIcon, match: () => false },
]

type Locked = { key: string; label: string; icon: typeof Search; line: string }

const LOCKED: Locked[] = [
  { key: 'find', label: 'Discover', icon: Search, line: 'Search every creator in the UAE by audience, engagement and category, and shortlist the ones you want.' },
  { key: 'run', label: 'Inflink', icon: Link2, line: 'Brief and hire creators for paid campaigns, with payments and usage rights handled for you.' },
  { key: 'mor', label: 'Contracting', icon: FileText, line: 'One contract and one invoice for every creator you work with, wherever they are.' },
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
  const [open, setOpen] = useState<Locked | null>(null)

  return (
    <nav
      aria-label="Main"
      className={cn(
        'flex h-full w-[232px] shrink-0 flex-col gap-7 border-r border-border bg-background px-5 pb-6 pt-7',
        className,
      )}
    >
      <Link href="/dashboard" className="px-1.5" aria-label="Following, home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/followinglogo.svg" alt="Following" className="h-5 w-auto dark:hidden" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/Following Logo Dark Mode.svg" alt="Following" className="hidden h-5 w-auto dark:block" />
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
        {LOCKED.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setOpen(m)}
            className="flex h-[38px] items-center gap-2.5 rounded-[10px] px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <m.icon className="size-[18px]" strokeWidth={1.75} />
            <span className="flex-1">{m.label}</span>
            <Lock className="size-3.5" strokeWidth={1.75} aria-label="Locked during the trial" />
          </button>
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

      <Dialog open={!!open} onOpenChange={(v: boolean) => !v && setOpen(null)}>
        <DialogContent className="max-w-sm rounded-[24px] p-7 text-center sm:rounded-[24px]">
          {open ? (
            <>
              <div className="flex justify-center pb-1">
                <EmptyMark icon={open.icon} />
              </div>
              <DialogHeader className="items-center text-center sm:text-center">
                <DialogTitle className="text-[20px] font-semibold tracking-[-0.02em]">{open.label} opens after your trial</DialogTitle>
                <DialogDescription className="max-w-[34ch] text-sm leading-relaxed">{open.line}</DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-2 flex-col gap-2 sm:flex-col sm:space-x-0">
                <Button className="h-10 w-full rounded-full" onClick={() => setOpen(null)}>
                  Got it
                </Button>
                <Button asChild variant="ghost" className="h-10 w-full rounded-full text-muted-foreground">
                  <a href={`mailto:partners@following.ae?subject=${encodeURIComponent(`${open.label} for ${name}`)}`}>Ask us about it</a>
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </nav>
  )
}
