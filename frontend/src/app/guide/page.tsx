'use client'

/**
 * The client guide — how the platform works, for the people paying for it.
 *
 * WRITTEN FOR SOMEBODY WHO HAS NOT USED IT BEFORE and is looking at it alone, probably
 * because an account manager sent them a link and is not in the room. So it follows the
 * order a brand actually meets the product in — a quote arrives, they pick creators, a
 * campaign starts, work comes in — rather than the order the sidebar happens to be in.
 *
 * IT ANSWERS THE QUESTIONS PEOPLE ACTUALLY ASK. Every "how it works" section here exists
 * because somebody emailed to ask it: what a credit is and when one is spent, why a creator
 * they liked is not selectable, what happens to their choices after they confirm, and who
 * can see what once they add a colleague. The temptation with a page like this is to
 * describe the menu; the menu is visible, and the rules are not.
 *
 * IT NEVER MENTIONS COST. Not obliquely, not as "our margin", not as a reason a price is
 * what it is. Cost pricing is invisible to brands everywhere in the product and this page is
 * no exception, which also means nothing here can be quoted back at us in a negotiation.
 *
 * Density tier: READING. One column, prose capped, no cards. A brand reading this is reading,
 * not operating.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AuthGuard } from '@/components/AuthGuard'
import { BrandUserInterface } from '@/components/brand/BrandUserInterface'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Search, ArrowUpRight, LayoutDashboard, Compass, Users2, ListChecks, FileText,
  Megaphone, Sparkles, CreditCard, Bell, Settings, Mail,
} from 'lucide-react'

type Entry = {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  what: string
  why?: string
  also?: string[]
}

const SCREENS: Entry[] = [
  {
    title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard,
    what: 'Where everything stands: your live campaigns, anything waiting on you, and what is left of your plan this month.',
    also: ['home', 'overview'],
  },
  {
    title: 'Discover', href: '/discover', icon: Compass,
    what: 'Search the creator database by audience, category, city and size.',
    why: 'Browsing is free. Opening a creator in full is what uses a credit, and once you have opened one you keep that access for thirty days.',
    also: ['search', 'find creators', 'directory'],
  },
  {
    title: 'My Creators', href: '/creators', icon: Users2,
    what: 'Every creator you have unlocked, with their full analytics.',
    why: 'Nothing here costs anything to open again while your access is live.',
    also: ['unlocked', 'saved'],
  },
  {
    title: 'Lists', href: '/my-lists', icon: ListChecks,
    what: 'Group creators into shortlists you can come back to or share internally.',
    also: ['shortlist', 'folders'],
  },
  {
    title: 'Proposals', href: '/proposals', icon: FileText,
    what: 'The rosters we have quoted you, and where you choose who you want.',
    why: 'This is the screen that decides a campaign. What you select and confirm here is what we go and book.',
    also: ['quotes', 'roster', 'pitch'],
  },
  {
    title: 'Campaigns', href: '/campaigns', icon: Megaphone,
    what: 'Your live work: who is on it, what they owe you, and what has been delivered.',
    also: ['live', 'delivery', 'content'],
  },
  {
    title: 'Briefs', href: '/run', icon: Sparkles,
    what: 'Post a brief and let creators come to you, with how many it reached and how many replied.',
    also: ['post a brief', 'inbound', 'applications'],
  },
  {
    title: 'Billing', href: '/billing', icon: CreditCard,
    what: 'Your plan, your invoices and your credit balance.',
    also: ['invoices', 'plan', 'payment', 'subscription'],
  },
  {
    title: 'Notifications', href: '/notifications', icon: Bell,
    what: 'What has changed since you were last here.',
    also: ['alerts'],
  },
  {
    title: 'Settings', href: '/settings', icon: Settings,
    what: 'Your details, your team and who can see what.',
    also: ['team', 'colleagues', 'profile', 'password'],
  },
]

type Explainer = { q: string; a: React.ReactNode }

// The questions people actually email to ask. Each one is here because it was asked.
const EXPLAINERS: Explainer[] = [
  {
    q: 'What is a credit, and when do I spend one?',
    a: (
      <>
        Credits are how the platform meters the expensive things. Searching and browsing cost
        nothing. Opening a creator in full spends 25 and gives you thirty days of access to
        them, so opening the same creator again inside that window is free. Deeper analysis on
        a single post costs 10, and a bulk export costs 50. Your balance and what you have
        spent are both on <Link href="/billing" className="underline underline-offset-2">Billing</Link>.
      </>
    ),
  },
  {
    q: 'Why can I not select a creator I like on a proposal?',
    a: (
      <>
        Two reasons, and the screen will say which. Either they are not currently taking work
        of that kind, or the roster you are looking at was built to a set number of places per
        audience size, and the ones that fit them are already used. On those rosters a single
        creator can be worth more than one place, so picking somebody big may use up two or
        three at once. The card tells you before you commit.
      </>
    ),
  },
  {
    q: 'What happens after I confirm my choices?',
    a: (
      <>
        Confirming locks your selection so nobody can change it underneath you, and it is the
        signal for us to start booking. From that point we agree terms with each creator
        individually, they sign an agreement, and the campaign opens with your roster on it.
        You will see it appear under <Link href="/campaigns" className="underline underline-offset-2">Campaigns</Link>.
        Nothing you confirmed can quietly change afterwards; if a creator falls through, we tell
        you and replace them with your agreement.
      </>
    ),
  },
  {
    q: 'Can I add colleagues, and what will they see?',
    a: (
      <>
        Yes, from <Link href="/settings" className="underline underline-offset-2">Settings</Link>,
        up to the number of seats your plan includes. Everyone on your team shares the same
        creators, the same lists and the same campaigns, so unlocking a creator once covers all
        of you rather than each person spending credits on the same profile.
      </>
    ),
  },
  {
    q: 'Where do the numbers on a creator come from?',
    a: (
      <>
        Directly from their live account, refreshed rather than remembered, and the engagement
        figures are calculated from their actual recent posts rather than a headline rate.
        Where we could not read something reliably, the section is left out instead of being
        filled with an estimate. A blank is a blank on purpose.
      </>
    ),
  },
  {
    q: 'Somebody sent me a link and I do not have a login.',
    a: (
      <>
        Share links work without an account, so you can review a roster and make your picks
        straight away. An account gets you the rest: campaign progress, content as it lands,
        your invoices and the creator database. If you were sent a link and want the full
        thing, ask whoever sent it, or email us below.
      </>
    ),
  },
]

export default function ClientGuidePage() {
  const [q, setQ] = useState('')

  const shownScreens = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return SCREENS
    return SCREENS.filter((e) =>
      [e.title, e.what, e.why ?? '', ...(e.also ?? [])].join(' ').toLowerCase().includes(needle),
    )
  }, [q])

  const shownExplainers = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return EXPLAINERS
    return EXPLAINERS.filter((e) => e.q.toLowerCase().includes(needle))
  }, [q])

  return (
    <AuthGuard requireAuth={true}>
      <BrandUserInterface>
        <div className="space-y-8 p-6">
          <div className="space-y-2">
            <h1 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] lg:text-[34px]">
              How this works
            </h1>
            <p className="reading-width text-[15px] leading-relaxed text-muted-foreground">
              What each screen is for, and the handful of rules worth knowing before you spend
              anything. It takes about four minutes to read the whole thing.
            </p>
          </div>

          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search this guide"
              className="pl-8"
            />
          </div>

          {/* The shape of the thing, before any individual screen means much. */}
          {!q && (
            <section className="reading-width space-y-3">
              <h2 className="text-[17px] font-semibold tracking-[-0.01em]">The short version</h2>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                You find creators yourself in <strong className="text-foreground">Discover</strong>,
                or we build you a roster and send it as a{' '}
                <strong className="text-foreground">proposal</strong>. You pick who you want and
                confirm. We handle the agreements and the payments, and the work appears under{' '}
                <strong className="text-foreground">Campaigns</strong> as it is delivered.
              </p>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                The one thing worth understanding before you click anything expensive is
                credits, which is the first question below.
              </p>
            </section>
          )}

          {shownScreens.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-[17px] font-semibold tracking-[-0.01em]">The screens</h2>
              <div className="divide-y">
                {shownScreens.map((e) => (
                  <Link
                    key={e.href}
                    href={e.href}
                    className="group flex gap-4 py-4 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                  >
                    <e.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[15px] font-medium">{e.title}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <p className="reading-width text-[14px] leading-relaxed text-muted-foreground">
                        {e.what}
                      </p>
                      {e.why && (
                        <p className="reading-width text-[13.5px] leading-relaxed text-muted-foreground/80">
                          {e.why}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {shownExplainers.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-[17px] font-semibold tracking-[-0.01em]">
                Questions people ask
              </h2>
              <div className="divide-y">
                {shownExplainers.map((e) => (
                  <div key={e.q} className="space-y-1.5 py-4">
                    <h3 className="reading-width text-[15px] font-medium">{e.q}</h3>
                    <p className="reading-width text-[14px] leading-relaxed text-muted-foreground">
                      {e.a}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {shownScreens.length === 0 && shownExplainers.length === 0 && (
            <p className="py-12 text-[15px] text-muted-foreground">
              Nothing here matches that. Email us and a person will answer.
            </p>
          )}

          <section className="reading-width space-y-3 border-t pt-6">
            <h2 className="text-[17px] font-semibold tracking-[-0.01em]">Still stuck</h2>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              Your account manager knows your campaigns and is usually the fastest answer. For
              anything else, this reaches a person rather than a queue.
            </p>
            <Button variant="outline" asChild className="mt-1">
              <a href="mailto:partners@following.ae">
                <Mail className="mr-2 h-4 w-4" /> partners@following.ae
              </a>
            </Button>
          </section>
        </div>
      </BrandUserInterface>
    </AuthGuard>
  )
}
