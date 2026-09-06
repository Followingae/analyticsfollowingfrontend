'use client'

/**
 * The header and footer this page never had.
 *
 * /pricing is a PUBLIC page: it is the first Following screen most buyers ever load, arriving
 * cold from the marketing site. It was rendering as a bare `min-h-screen` with no logo, no
 * navigation and no way back, which reads as a broken fragment rather than a company. That
 * predates the module rewrite, and it is the first thing to fix.
 *
 * WHY IT IS NOT THE APP SHELL. A signed out visitor has no sidebar, no team and no account
 * menu, so the product chrome cannot render for them. This is the smallest honest header: who
 * we are, the way back to the site they came from, and the way in for somebody who already
 * has an account. Signed in visitors get the same header with the destination changed, so the
 * page never shows a stranger a "Sign in" button they do not need.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/mode-toggle'

export function PublicChrome({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  useEffect(() => {
    setMounted(true)
    setSignedIn(Boolean(localStorage.getItem('access_token') || localStorage.getItem('auth_tokens')))
  }, [])

  // Resolved after mount, because the theme is not known on the server and a logo that
  // flips on hydration is worse than one that waits a frame.
  const logo = mounted && resolvedTheme === 'dark'
    ? '/Following Logo Dark Mode.svg'
    : '/followinglogo.svg'

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur
                         supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
          <a href="https://following.ae" className="flex items-center gap-2.5"
             aria-label="Following">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt="Following" className="h-5 w-auto" />
          </a>

          <nav className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <a href="https://following.ae/platform">Platform</a>
            </Button>
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <a href="https://following.ae/insights">Insights</a>
            </Button>
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <a href="https://following.ae/contact">Talk to us</a>
            </Button>
            <ModeToggle />
            {signedIn ? (
              <Button size="sm" asChild>
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link href="/auth/login">Sign in</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4
                        px-6 py-8 text-sm text-muted-foreground">
          <p>Following FZC, Dubai. Prices in dirhams, VAT shown at checkout.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a href="https://following.ae/privacy" className="hover:text-foreground">Privacy</a>
            <a href="mailto:support@following.ae" className="hover:text-foreground">
              support@following.ae
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
