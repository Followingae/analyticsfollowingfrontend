'use client'

/**
 * The manual — what every screen in here is for, in the order your day uses them.
 *
 * NOT A DECK AND NOT A TOUR. `/work/manual` is the deck: one brand end to end, narrated to a
 * room, arrow keys. The walkthroughs are the tour: they point at the thing while you stand
 * on it. Neither answers "what does Sign-offs actually do", which is the question somebody
 * has at 4pm on their own, and answering it was falling to whoever happened to be free.
 *
 * ORGANISED BY ROLE, BECAUSE THE PRODUCT IS. The sidebar already gives a talent manager five
 * entries and leadership twenty, so a single flat list of every screen would describe a
 * console nobody has. You read your own role and can open anyone else's, which matters when
 * you are covering for them.
 *
 * IT SAYS WHAT THINGS DO, NOT WHAT YOU MAY NOT PRESS. Permissions are real and enforced in
 * the code; listing them here would turn a floor plan into an argument. Where a rule changes
 * how somebody plans their day — only leadership approves a payment, so talent should not
 * wait on themselves — it is stated as the shape of the work, once.
 *
 * Density tier: READING. Prose is capped by `.reading-width`, the page is one column, and
 * nothing here is a card just because everything else in the console is: these are entries,
 * and a border around each one would make a filing cabinet out of a book.
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { SuperadminLayout } from '@/components/layouts/SuperadminLayout'
import { PageHead } from '@/components/console/primitives'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Search, ArrowUpRight, Users2, Coins, Database, Map, Megaphone, ClipboardCheck,
  FileSignature, Banknote, BarChart3, Building2, FileText, Send, Inbox, ListChecks,
  ShieldCheck, Store, Activity, Bell, Wrench, MailCheck, MessageCircle, Users,
} from 'lucide-react'

type Entry = {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  /** One line: what the screen is. */
  what: string
  /** Why it exists, or the thing about it people get wrong. Two sentences at most. */
  why?: string
  /** Words somebody might search for that are not in the title. */
  also?: string[]
}

type Section = {
  role: string
  blurb: string
  entries: Entry[]
}

// ─────────────────────────────────────────────────────────────────────────────────────────
// The book
//
// Written from the sidebar, so it describes the console that exists rather than the one that
// existed when somebody last remembered to edit a guide. When a screen moves, its entry
// moves; when a screen is added without an entry, the omission is visible because the roles
// are short enough to read in one go.
// ─────────────────────────────────────────────────────────────────────────────────────────
const SECTIONS: Section[] = [
  {
    role: 'Everyone',
    blurb: 'Two screens that mean the same thing whoever you are.',
    entries: [
      {
        title: 'Today', href: '/work/today', icon: ListChecks,
        what: 'Your home screen, and it is different for each role.',
        why: 'It shows the work your job is actually made of rather than a company-wide feed. If it is empty, you genuinely have nothing waiting.',
        also: ['home', 'dashboard'],
      },
      {
        title: 'Waiting on me', href: '/work/inbox', icon: Inbox,
        what: 'Everything anywhere in the platform that needs a decision from you.',
        why: 'It pulls from every queue at once, so you do not have to remember which screen a thing was waiting on. It only lists queues your role can act on.',
        also: ['queue', 'approvals', 'to do'],
      },
    ],
  },

  {
    role: 'Talent',
    blurb: 'Finding creators, pricing them, signing them and getting the work in.',
    entries: [
      {
        title: 'Creators & rates', href: '/work/influencers', icon: Users2,
        what: 'The master database: every creator we know, with our cost and our sell price per deliverable.',
        why: 'This is where a creator becomes sellable. One with no sell price is held inactive and cannot be put on a quote at all.',
        also: ['imd', 'master database', 'pricing', 'cost'],
      },
      {
        title: 'Creators needing a price', href: '/work/influencers/review', icon: Coins,
        what: 'The queue of creators sitting in the database with no price on them.',
        why: 'Every name here is one nobody can sell yet, which is why it carries a count in the sidebar.',
        also: ['waiting room', 'unpriced'],
      },
      {
        title: 'Brand rosters', href: '/work/areas', icon: Database,
        what: 'What a client asked us to source, who we found, who they turned down, and which round we are on.',
        why: 'This is the whole supply job in one place. It replaced sourcing rounds, which no longer exist.',
        also: ['areas', 'sourcing', 'rounds', 'lists'],
      },
      {
        title: "Where we're thin", href: '/work/coverage', icon: Map,
        what: 'The categories and cities we cannot currently field a roster in.',
        why: 'It is a shopping list, not a report: each gap is a reason to go and sign somebody.',
        also: ['gaps', 'coverage'],
      },
      {
        title: 'Campaigns', href: '/work/campaigns', icon: Megaphone,
        what: 'Live campaigns and what stage each creator on them has reached.',
        also: ['timeline', 'delivery'],
      },
      {
        title: 'Creators to chase', href: '/work/chasing', icon: ClipboardCheck,
        what: 'Who is late, who is due, and who has gone quiet.',
        why: 'Ordered by how overdue rather than by campaign, because the thing you do next is a phone call, not a review.',
        also: ['late', 'overdue', 'deliverables'],
      },
      {
        title: 'Enrolments', href: '/work/enrolments', icon: FileSignature,
        what: 'The paperwork after a client confirms a creator: the link they sign, the details they give us, and where their product goes.',
        why: 'A creator only appears here once leadership has settled their cost. Raising the link, sending it and chasing it is yours.',
        also: ['agreement', 'sign', 'bank details', 'contract', 'inflink'],
      },
      {
        title: 'My target', href: '/work/goals', icon: BarChart3,
        what: 'What you are being measured on this month and where you are against it.',
        also: ['goals', 'kpi'],
      },
    ],
  },

  {
    role: 'Business development',
    blurb: 'Getting brands in the door and turning interest into a signed quote.',
    entries: [
      {
        title: 'Brands', href: '/work/brands', icon: Building2,
        what: 'Every brand we are talking to, and how warm each one is.',
        also: ['leads', 'pipeline', 'prospects'],
      },
      {
        title: 'Quotes', href: '/work/proposals', icon: FileText,
        what: 'Build a roster for a brand, price it, and send it.',
        why: 'A quote can be priced by budget or by tier. On a tier deal a creator can be marked as counting for more than one place, so somebody expensive can still be taken rather than dropped.',
        also: ['proposals', 'pitch', 'roster'],
      },
      {
        title: 'Share Center', href: '/work/share', icon: Send,
        what: 'The links you send clients, and whether they have been opened.',
        why: 'A share link is the only way a client sees a quote. There is no other client-facing route into one.',
        also: ['share link', 'p/', 'token'],
      },
      {
        title: 'Sample packs', href: '/work/areas?kind=sample', icon: Database,
        what: 'Pre-built rosters to show a brand what we can field, before anybody commits.',
        also: ['samples', 'teaser'],
      },
    ],
  },

  {
    role: 'Account management',
    blurb: 'Running the clients we already have, and the campaigns they are paying for.',
    entries: [
      {
        title: 'My clients', href: '/work/clients', icon: Building2,
        what: 'The brands you own, with their spend, their campaigns and their history.',
        also: ['accounts', 'teams'],
      },
      {
        title: 'Quotes', href: '/work/proposals', icon: FileText,
        what: 'The same quote builder, for repeat work on a client you already run.',
        also: ['proposals'],
      },
      {
        title: 'Campaigns', href: '/work/campaigns', icon: Megaphone,
        what: 'Every live campaign, its roster and its delivery state.',
        also: ['timeline'],
      },
      {
        title: 'Late & chasing', href: '/work/chasing', icon: ClipboardCheck,
        what: 'The delivery problems on your clients, before the client finds them.',
        also: ['overdue', 'deliverables'],
      },
      {
        title: 'App creators', href: '/work/fa/members', icon: Users2,
        what: 'Creators signed up on the Inflink app, which is where barter and cashback campaigns are staffed from.',
        also: ['fa', 'members', 'inflink'],
      },
    ],
  },

  {
    role: 'Leadership',
    blurb: 'Money, sign-offs and the shape of the company. Everything above, plus these.',
    entries: [
      {
        title: 'Creator payments', href: '/work/payables', icon: Banknote,
        what: 'The payment book: what we owe every creator and whether it has gone out.',
        why: 'Anyone internal can record what was agreed. Only the founders approve one, and only the founders mark it paid — and nothing pays out that the client has not funded.',
        also: ['payables', 'owed', 'transfer', 'money out'],
      },
      {
        title: 'Enrolment payments', href: '/work/enrolments/payments', icon: Banknote,
        what: 'The same book, filtered to creators who signed an enrolment agreement, with their instalment schedule.',
        why: 'It carries the payout file, which is the only place in the product the full IBAN appears. Pulling it is logged against every creator in it.',
        also: ['iban', 'payout file', 'instalments', 'bank transfer'],
      },
      {
        title: 'Money', href: '/work/money', icon: Banknote,
        what: 'What came in, what went out, and what is committed but unpaid.',
        also: ['revenue', 'margin', 'cash'],
      },
      {
        title: 'Sign-offs', href: '/work/approvals', icon: ClipboardCheck,
        what: 'Everything held until one of the founders says yes.',
        also: ['approvals', 'authorise'],
      },
      {
        title: 'Daily targets', href: '/work/goals', icon: BarChart3,
        what: 'Targets for the whole team, and progress against them.',
        also: ['goals', 'kpi'],
      },
      {
        title: 'My team', href: '/work/team', icon: Users,
        what: 'Who is on staff, what they own and what they are carrying.',
        also: ['staff', 'workload'],
      },
      {
        title: 'Users', href: '/work/users', icon: Users,
        what: 'Brand accounts: create them, set their plan, reset a password.',
        also: ['accounts', 'clients', 'login'],
      },
      {
        title: 'Staff', href: '/work/staff', icon: ShieldCheck,
        what: 'Internal accounts and what each role can reach.',
        also: ['roles', 'permissions'],
      },
      {
        title: 'Office screens', href: '/work/system/displays', icon: Activity,
        what: 'What the wall screens show, and how often they change.',
        also: ['tv', 'wall', 'display'],
      },
    ],
  },

  {
    role: 'The creator app',
    blurb: 'Inflink: barter, cashback and paid deals that creators apply to themselves.',
    entries: [
      {
        title: 'App campaigns', href: '/work/fa/campaigns', icon: Megaphone,
        what: 'Campaigns creators can see and apply to in the app.',
        why: 'Closing one leaves it on their board greyed out and marked Completed, because they worked on it. Delete takes it off the app entirely and is refused while anybody is still working on it.',
        also: ['fa', 'barter', 'cashback', 'paid deal', 'close', 'delete'],
      },
      {
        title: 'Merchants', href: '/work/fa/merchants', icon: Store,
        what: 'The venues and brands behind cashback and barter offers.',
        also: ['venues', 'restaurants'],
      },
      {
        title: 'Creator reliability', href: '/work/fa/reliability', icon: ShieldCheck,
        what: 'Who delivers and who does not, scored from their last ten deliverables.',
        why: 'A low score gates re-applying until they clear what is overdue, and it clears itself the moment they do.',
        also: ['score', 'defaults', 'late'],
      },
      {
        title: 'App activity', href: '/work/fa/activity', icon: Activity,
        what: 'What creators are doing in the app right now.',
        also: ['feed', 'live'],
      },
      {
        title: 'Ad banners', href: '/work/fa/ad-banners', icon: Bell,
        what: 'The promos that appear on the app home screen.',
        also: ['promo', 'banner'],
      },
      {
        title: 'App notifications', href: '/work/fa/notifications', icon: Bell,
        what: 'Push messages to creators.',
        also: ['push'],
      },
    ],
  },

  {
    role: 'System',
    blurb: 'Settings that change what the platform sends and how it behaves.',
    entries: [
      {
        title: 'Email alerts', href: '/work/notifications', icon: MailCheck,
        what: 'Which events send an email, and to whom.',
        why: 'Creators are never on these lists. Every internal email in the product passes through one place, so switching an event off here switches it off everywhere.',
        also: ['emails', 'resend'],
      },
      {
        title: 'WhatsApp', href: '/work/whatsapp', icon: MessageCircle,
        what: 'Broadcasts and templates for messaging creators.',
        also: ['twilio', 'broadcast', 'sms'],
      },
      {
        title: 'System', href: '/work/system', icon: Wrench,
        what: 'Platform configuration: pricing rules, plan limits, feature switches.',
        also: ['config', 'settings', 'admin'],
      },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────────────────

export default function GuidePage() {
  const [q, setQ] = useState('')

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return SECTIONS
    return SECTIONS
      .map((s) => ({
        ...s,
        entries: s.entries.filter((e) =>
          [e.title, e.what, e.why ?? '', ...(e.also ?? [])]
            .join(' ')
            .toLowerCase()
            .includes(needle),
        ),
      }))
      .filter((s) => s.entries.length > 0)
  }, [q])

  return (
    <SuperadminLayout>
      <div className="space-y-8">
        <PageHead
          title="The manual"
          sub="What every screen in here is for, grouped by whose day it belongs to. Read your own role, and open somebody else's when you are covering for them."
        />

        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the manual"
            className="pl-8"
          />
        </div>

        {/* The two things a new person needs before any single screen makes sense. */}
        {!q && (
          <section className="reading-width space-y-3">
            <h2 className="text-[17px] font-semibold tracking-[-0.01em]">Two things first</h2>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Cost is what we pay a creator, sell is what
              the client pays us.</strong> Brands never see cost, anywhere, on any screen or
              export. That is not a display preference, it is enforced on the server, which is
              why some numbers vanish when you look at a client-facing view.
            </p>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              <strong className="text-foreground">A quote becomes a campaign only once the
              client confirms and somebody settles the real costs.</strong> Between those two
              moments a creator is agreed but not yet enrolled, which is why half a confirmed
              roster can have no campaign row and no enrolment link yet.
            </p>
          </section>
        )}

        {shown.length === 0 ? (
          <p className="py-12 text-[15px] text-muted-foreground">
            Nothing in the manual matches that. Try the name of the screen, or what you are
            trying to do.
          </p>
        ) : (
          <div className="space-y-10">
            {shown.map((section) => (
              <section key={section.role} className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-[17px] font-semibold tracking-[-0.01em]">{section.role}</h2>
                  <p className="reading-width text-[14px] leading-relaxed text-muted-foreground">
                    {section.blurb}
                  </p>
                </div>

                <div className="divide-y">
                  {section.entries.map((e) => (
                    <Link
                      key={`${section.role}-${e.href}-${e.title}`}
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
            ))}
          </div>
        )}

        <section className="reading-width space-y-3 border-t pt-6">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em]">If this is wrong</h2>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            A manual that has drifted is worse than none, because people stop checking it and
            start asking each other again. If a screen here does not match what you see, say
            so rather than working around it.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="outline" size="sm" asChild>
              <Link href="/work/manual">The walkthrough deck</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/work/inbox">Waiting on me</Link>
            </Button>
          </div>
        </section>
      </div>
    </SuperadminLayout>
  )
}
