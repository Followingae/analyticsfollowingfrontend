'use client'

/**
 * Public creator analytics — /c/{token}.
 *
 * No login, no account, no credits. A superadmin mints the link; anyone holding the URL
 * sees the creator's real analytics page.
 *
 * It renders <CreatorAnalyticsV2 shareToken=… />, the SAME component the internal page
 * uses, rather than a public copy of it. A lookalike built from the same tokens is not the
 * product — it drifts from the real page one fix at a time, and the entire reason to send
 * this link is that the recipient sees exactly what we see.
 *
 * No AuthGuard and no app chrome: the viewer has no session, and a sidebar full of links
 * they cannot open is worse than none.
 */

import { useParams } from 'next/navigation'
import { CreatorAnalyticsV2 } from '@/components/analytics/v2/CreatorAnalyticsV2'

function Logo({ className = 'h-6 w-auto' }: { className?: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/followinglogo.svg" alt="Following" className={`${className} block dark:hidden`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/Following Logo Dark Mode.svg" alt="Following" className={`${className} hidden dark:block`} />
    </>
  )
}

export default function PublicCreatorAnalyticsPage() {
  const token = useParams().token as string

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-6">
          <Logo />
          <span className="text-xs text-muted-foreground">Creator analytics</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
        {/* `username` is unused in share mode — the token resolves it server-side, and
            accepting it from the URL would let anyone swap the handle on a valid token. */}
        <CreatorAnalyticsV2 username="" shareToken={token} />
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-10 pt-4 text-center md:px-6">
        <p className="text-xs text-muted-foreground">
          Measured by Following · <a href="https://following.ae" className="underline underline-offset-2">following.ae</a>
        </p>
      </footer>
    </div>
  )
}
