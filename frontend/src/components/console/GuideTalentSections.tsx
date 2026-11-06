'use client'

/**
 * Two chapters of the guide that only talent and leadership read: ScoutOutreach with ScoutAI,
 * and enrolments.
 *
 * WHO SEES THEM. Superadmin, the co-founder (role 'user', staff_role 'cofounder') and the
 * talent team, which is the same audience the sidebar gives the ScoutOutreach row to (scopes
 * 'leadership' and 'talent'). Account management and business development never see either,
 * because neither tool is theirs to work and a chapter about a screen they cannot open reads
 * as a missing grant. The gate is `seesTalentChapters()` below, and the guide page also uses
 * it to hide the matching playbook jobs inside the other-roles accordion.
 *
 * WHY THEY ARE DRAWN RATHER THAN LISTED. Both are a chain of hand-offs between a machine, a
 * person on the team, a founder and a creator, and the thing people get wrong is whose turn it
 * is. A flow with the owner on every step answers that before anybody reads a sentence.
 *
 * WRITING RULES (same as the playbooks): plain words, short sentences, no em dashes, roles not
 * people, every step says where it happens and who is next. The printed manuals carry the
 * same chapters, written separately in `docs/manuals/mastery.mjs` (SCOUT, ENROL). Change both.
 *
 * Screen names come from `destinations.ts` through `shortName`, so a renamed screen reprints
 * here instead of leaving the guide teaching the old name.
 */

import Link from 'next/link'
import {
  ArrowRight, Ban, BellRing, Clock3, FileSignature, Hourglass, Landmark, MessageCircle,
  Radar, RotateCcw, ScanSearch, Send, ShieldCheck, UserRoundCheck,
} from 'lucide-react'
import { ScoutAvatar } from '@/components/roster/ScoutAvatar'
import { CARD } from '@/components/console/primitives'
import { shortName } from '@/lib/destinations'

/** Superadmin, the co-founder or CEO, and talent. Nobody else reads these chapters. */
export function seesTalentChapters(a: {
  isSuperAdmin: boolean; isFullAccessStaff?: boolean; staffRole: string | null
}): boolean {
  return a.isSuperAdmin || !!a.isFullAccessStaff
    || a.staffRole === 'cofounder' || a.staffRole === 'ceo' || a.staffRole === 'talent_manager'
}

// ── Shared pieces ───────────────────────────────────────────────────────────────────────

type Who = 'machine' | 'talent' | 'founder' | 'creator' | 'client'

const WHO_LABEL: Record<Who, string> = {
  machine: 'Runs itself',
  talent: 'Talent',
  founder: 'A founder',
  creator: 'The creator',
  client: 'The client',
}

type Step = { title: string; who: Who; whoText?: string; body: string }

/**
 * A flow of hand-offs. Machine steps sit on the brand lime as a solid surface with ink text
 * (lime is never text and never a tint); steps a person owns sit on the card. The owner is
 * printed on every tile, so "whose turn is it" is answered by looking.
 */
function Flow({ steps, cols }: { steps: Step[]; cols: string }) {
  return (
    <ol className={`grid gap-2 ${cols}`}>
      {steps.map((s, i) => {
        const machine = s.who === 'machine'
        return (
          <li
            key={s.title}
            className={`relative flex flex-col gap-1.5 rounded-ds-xl border p-3.5 ${
              machine
                ? 'border-transparent bg-[var(--console-lime)] text-[#111]'
                : 'border-black/[0.08] bg-card dark:border-white/[0.08]'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[11px] font-semibold tabular-nums ${machine ? 'text-[#111]/60' : 'text-muted-foreground'}`}>
                {String(i + 1).padStart(2, '0')}
              </span>
              {i < steps.length - 1 && (
                <ArrowRight className={`h-3.5 w-3.5 ${machine ? 'text-[#111]/50' : 'text-muted-foreground/60'}`} aria-hidden />
              )}
            </div>
            <span className="text-[14px] font-semibold leading-snug tracking-[-0.01em]">{s.title}</span>
            <span className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${machine ? 'text-[#111]/65' : 'text-muted-foreground'}`}>
              {s.whoText ?? WHO_LABEL[s.who]}
            </span>
            <span className={`text-[13px] leading-relaxed ${machine ? 'text-[#111]/80' : 'text-muted-foreground'}`}>
              {s.body}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function FlowKey({ machineLabel }: { machineLabel: string }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-[12.5px] text-muted-foreground">
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-4 rounded-[3px] bg-[var(--console-lime)]" aria-hidden />
        {machineLabel}
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-2.5 w-4 rounded-[3px] border border-black/15 bg-card dark:border-white/20" aria-hidden />
        A person does this
      </span>
    </div>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((t) => (
        <li key={t} className="flex gap-2.5">
          <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-[2px] bg-[var(--console-lime)]" aria-hidden />
          <span className="text-[14px] leading-relaxed">{t}</span>
        </li>
      ))}
    </ul>
  )
}

function Numbered({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2.5">
      {items.map((t, i) => (
        <li key={t} className="flex gap-3">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] bg-[var(--console-lime)] text-[11px] font-bold tabular-nums text-[#111]">
            {i + 1}
          </span>
          <span className="reading-width text-[14px] leading-relaxed">{t}</span>
        </li>
      ))}
    </ol>
  )
}

function Panel({ icon: Icon, title, children }: {
  icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode
}) {
  return (
    <div className={`${CARD} space-y-3 bg-card p-5`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h4>
      </div>
      {children}
    </div>
  )
}

function ChapterHead({ eyebrow, title, lede, art }: {
  eyebrow: string; title: string; lede: string; art: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="shrink-0">{art}</div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <span className="h-2 w-5 rounded-[2px] bg-[var(--console-lime)]" aria-hidden />
          {eyebrow}
        </div>
        <h2 className="text-[24px] font-semibold leading-tight tracking-[-0.03em]">{title}</h2>
        <p className="reading-width text-[15px] leading-relaxed text-muted-foreground">{lede}</p>
      </div>
    </div>
  )
}

// ── ScoutOutreach and ScoutAI ───────────────────────────────────────────────────────────

const SCOUT_FLOW: Step[] = [
  { title: 'Find', who: 'machine', whoText: 'ScoutOutreach',
    body: 'Plans searches with AI from the brief: keywords, Instagram places, hashtags.' },
  { title: 'Screen', who: 'machine', whoText: 'ScoutOutreach',
    body: 'Follower range, posted lately, a real creator, then an AI read against the brief.' },
  { title: 'DM, email or WhatsApp', who: 'machine', whoText: 'ScoutOutreach',
    body: 'An Instagram DM: "Interested? Just reply here". An email with a WhatsApp button. A WhatsApp alert to creators we know.' },
  { title: 'ScoutAI chat', who: 'machine', whoText: 'ScoutAI',
    body: 'In the Instagram chat where they replied, or on WhatsApp: explains the brief, asks the screening questions and their rate.' },
  { title: 'Rate on the roster', who: 'machine', whoText: 'ScoutAI, or talent',
    body: 'The creator lands on the campaign roster with their rate. You send them for review.' },
  { title: 'Founder prices', who: 'founder',
    body: 'Sets the sell price on the roster with Price. The margin shows as they type.' },
  { title: 'Ready', who: 'talent',
    body: 'Back on the roster as Ready. The confirmation has an Open roster button.' },
  { title: 'Proposal', who: 'talent',
    body: 'Add to proposal. When the client picks them, the row says Client picked: Book.' },
]

const PACE: { big: string; small: string }[] = [
  { big: 'Every 10 min', small: 'it checks every campaign by itself' },
  { big: 'Under 60', small: 'creators in a campaign’s DM queue before it searches for more' },
  { big: '3 hours', small: 'at least, between two searches on the same campaign' },
  { big: '6 a day', small: 'searches at most, across all campaigns together' },
  { big: '12', small: 'searches per campaign in total, then it stops and says so' },
  { big: 'Your cap', small: 'DMs a day, set on the ScoutOutreach page; Instagram’s own limits pause it below that' },
  { big: '4 to 7 min', small: 'between one DM and the next' },
  { big: '24 h, 48 h', small: 'two follow-ups in the same chat if nobody answers, cancelled the moment they do' },
  { big: '14 days', small: 'before anybody is DMed again' },
]

const RESTS = ['20 minutes', '1 hour', '3 hours', 'Until 10am tomorrow']

const ROSTER_ROWS: { says: string; means: string; button: string; who: string }[] = [
  { says: 'Needs a rate', means: 'Nobody has their price yet.', button: 'Add rate', who: 'You' },
  { says: 'ScoutOutreach asked for their rate', means: 'It DMed them for this campaign. The rate lands by itself.', button: 'None', who: 'Nobody' },
  { says: 'ScoutAI is getting their rate', means: 'They are talking to ScoutAI on Instagram or WhatsApp right now.', button: 'None', who: 'Nobody' },
  { says: 'Rate in, send for review', means: 'The price is in. A founder needs to see it.', button: 'Send for review', who: 'You' },
  { says: 'Waiting for a founder to price', means: 'Sent up. A founder sets the sell price.', button: 'Price', who: 'A founder' },
  { says: 'Ready', means: 'Priced and cleared. Sellable.', button: 'Add to proposal', who: 'You' },
  { says: 'On a proposal', means: 'Shown as "On" and the proposal’s name. With the client.', button: 'Open', who: 'The client' },
  { says: 'Client picked', means: 'The client chose them. Time to book.', button: 'Book', who: 'You' },
]

const SOURCES: { name: string; what: string }[] = [
  { name: 'ScoutOutreach', what: 'Found and DMed by ScoutOutreach.' },
  { name: 'ScoutAI (WhatsApp)', what: 'Arrived through a ScoutAI chat.' },
  { name: 'Your sheet', what: 'Pasted in by the team.' },
  { name: 'Database', what: 'Added from the master database.' },
]

export function ScoutGuide() {
  const scout = shortName('/work/scout')
  const rosters = shortName('/work/areas')
  const creators = shortName('/work/influencers')
  return (
    <section className="space-y-6" id="scout">
      <ChapterHead
        eyebrow="Talent and leadership"
        title="ScoutOutreach and ScoutAI"
        lede="Two teammates that never sleep. ScoutOutreach finds creators who fit a brief and reaches them on Instagram, by email and on WhatsApp. ScoutAI talks to the ones who answer and puts their rate on the roster. You keep sourcing your own creators beside them, on the same roster."
        art={<ScoutAvatar size={72} />}
      />

      <div className={`${CARD} space-y-4 bg-card p-5`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-[15px] font-medium">From a brief to a proposal</h3>
          <FlowKey machineLabel="ScoutOutreach or ScoutAI does this" />
        </div>
        <Flow steps={SCOUT_FLOW} cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel icon={Radar} title="ScoutOutreach finds them and reaches them">
          <Bullets items={[
            `It works per roster, which is one client brief. Its criteria are location, follower range, language and the brief itself.`,
            `It lives at ${scout} in the sidebar, with a live bar: ScoutAI’s face, DMs sent today, and the job it is on now. Each roster page shows its own outreach strip too.`,
            'Screening: the follower range, a post in the last 60 days, a real creator and not a business, not clearly based somewhere else. Then an AI reads each creator against the brief, following the yes and no decisions the team has already made on that campaign. Every pass carries a written reason.',
            'A hashtag search reads the 40 most recent posts from up to 4 hashtags.',
            'Every creator who passes gets light analytics, at about $0.008 each.',
            'The DM bot sends from the company’s Instagram account, in Chrome on an office PC. Chrome is open only while it is sending, answering or reading the inbox; the rest of the time it is closed. The DM carries no link. It says "Interested? Just reply here", and ScoutAI holds the conversation in that Instagram chat.',
            'When Instagram stops it (a chat that will not open, a warning), it pauses itself for an hour and says so on the ScoutOutreach page, then tries one DM to see if the rest is over. A pause that needs a person (a login, a checkpoint) stays until someone presses Resume there.',
            'Creators who list an email are also emailed, automatically, from hello@following.ae. The email carries a WhatsApp button into ScoutAI.',
            'It also sends WhatsApp alerts to creators in our network whose numbers we hold, using Meta-approved templates: a barter alert and a paid alert. A paid campaign is never called barter.',
          ]} />
        </Panel>

        <Panel icon={MessageCircle} title="ScoutAI talks to them, on Instagram and WhatsApp">
          <Bullets items={[
            'When a creator replies to the DM, ScoutAI carries on in that same Instagram chat, in English.',
            'On WhatsApp, a campaign can run an open call with a code, like OC-D7F4E, and ScoutAI answers there too.',
            'It explains the brief and asks the screening questions set for that campaign: where they live, their audience, nationality where it is asked.',
            'For paid work it asks their rate, and can counter within the negotiation rules set for that campaign.',
            'Creators answer with tap buttons or in their own words.',
            'It adds the creator to the campaign’s roster with their rate. Anybody who declines or does not fit is recorded with the reason.',
            'Its WhatsApp chats are kept on the Desk but do not ring the team’s notifications. A creator talking to ScoutAI is not a job for you.',
          ]} />
        </Panel>
      </div>

      <div className={`${CARD} space-y-4 bg-card p-5`}>
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-[15px] font-medium">Its pace, so the account stays safe</h3>
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-ds-xl border border-black/[0.08] bg-black/[0.08] dark:border-white/[0.08] dark:bg-white/[0.08] sm:grid-cols-4">
          {PACE.map((p) => (
            <div key={p.big} className="space-y-1 bg-card p-4">
              <div className="text-[20px] font-semibold tabular-nums tracking-[-0.03em]">{p.big}</div>
              <div className="text-[12.5px] leading-snug text-muted-foreground">{p.small}</div>
            </div>
          ))}
        </div>
        <p className="reading-width text-[14px] leading-relaxed text-muted-foreground">
          It does not search while every Instagram DM account is resting: a search then
          would only fill a queue nobody can send. Campaigns take turns: the one with the
          fewest DMs sent today goes next. Several Instagram accounts can share the queue.
        </p>
      </div>

      <div className={`${CARD} space-y-4 bg-card p-5`}>
        <div className="flex items-center gap-2">
          <Hourglass className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-[15px] font-medium">When Instagram slows it down, it rests by itself</h3>
        </div>
        <ol className="flex flex-wrap items-center gap-2">
          {RESTS.map((r, i) => (
            <li key={r} className="flex items-center gap-2">
              <span className="rounded-full border border-black/[0.1] px-3 py-1 text-[13px] font-medium dark:border-white/[0.12]">
                {r}
              </span>
              {i < RESTS.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden />}
            </li>
          ))}
          <li className="flex items-center gap-2">
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden />
            <span className="rounded-full bg-[var(--console-lime)] px-3 py-1 text-[13px] font-semibold text-[#111]">
              Carries on
            </span>
          </li>
        </ol>
        <div className="flex gap-3 rounded-ds-xl border border-black/[0.08] p-4 dark:border-white/[0.08]">
          <RotateCcw className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="reading-width text-[14px] leading-relaxed">
            <strong className="font-semibold">The one time it needs a person.</strong> If
            Instagram logs the account out or asks for a check, the bot stops and says so on
            the {scout} screen. Somebody signs in to Instagram on that office PC, then presses
            Resume on the {scout} screen.
          </p>
        </div>
      </div>

      <div className={`${CARD} space-y-3 bg-card p-5`}>
        <div className="space-y-1">
          <h3 className="text-[15px] font-medium">What a roster row tells you</h3>
          <p className="reading-width text-[13.5px] leading-relaxed text-muted-foreground">
            Every row on a roster says its next step and carries one button for it, plus Skip
            and a &ldquo;&hellip;&rdquo; menu for everything else. Skip means not for this
            campaign; the creator stays in the database.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[13.5px]">
            <thead>
              <tr className="border-b text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <th className="py-2 pr-4 font-semibold">The row says</th>
                <th className="py-2 pr-4 font-semibold">What it means</th>
                <th className="py-2 pr-4 font-semibold">Button</th>
                <th className="py-2 font-semibold">Who moves it</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ROSTER_ROWS.map((r) => (
                <tr key={r.says} className="align-top">
                  <td className="py-2.5 pr-4 font-medium">{r.says}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{r.means}</td>
                  <td className="py-2.5 pr-4">
                    {r.button === 'None'
                      ? <span className="text-muted-foreground">Nothing to press</span>
                      : <span className="inline-flex rounded-full border border-black/[0.12] px-2.5 py-0.5 text-[12.5px] font-medium dark:border-white/[0.15]">{r.button}</span>}
                  </td>
                  <td className="py-2.5 text-muted-foreground">{r.who}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-2 border-t pt-3">
          <p className="text-[13.5px] text-muted-foreground">
            Where each creator came from. The source tabs on a roster filter by these.
          </p>
          <div className="flex flex-wrap gap-2">
            {SOURCES.map((s) => (
              <span key={s.name} className="inline-flex items-center gap-2 rounded-full border border-black/[0.1] px-3 py-1 text-[13px] dark:border-white/[0.12]">
                <span className="font-medium">{s.name}</span>
                <span className="text-muted-foreground">{s.what}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <Panel icon={ScanSearch} title="Your part, alongside your own outreach">
        <Numbered items={[
          `Keep adding your own creators on the roster, by handle or by pasting a sheet. ScoutOutreach adds to your work; it does not replace it. Rosters are under ${creators}, then ${rosters}.`,
          `Glance at the live bar on ${scout} during the day: DMs today and the job it is on.`,
          'Work the roster from the next step on each row. "Needs a rate" and "Rate in, send for review" are yours. "ScoutOutreach asked for their rate" and "ScoutAI is getting their rate" are not: the rate lands by itself.',
          'Say yes or no on the creators it finds. Each decision teaches the screening on that campaign, so the next batch fits better.',
          'Skip anybody who is not right for this campaign.',
          `If ${scout} shows the bot is stopped and needs a person, sign in on the bot PC and press Resume.`,
        ]} />
        <p className="reading-width flex gap-2 border-t pt-3 text-[13.5px] leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <strong className="font-medium text-foreground">Next:</strong> a founder prices the
            ones you sent for review. Each priced creator goes back onto their roster as Ready,
            and the confirmation says so with an Open roster button.
          </span>
        </p>
      </Panel>

      <div className="flex flex-wrap gap-2">
        <Link href="/work/scout" className="inline-flex items-center gap-1.5 rounded-full bg-[var(--console-lime)] px-4 py-1.5 text-[13.5px] font-semibold text-[#111]">
          Open {scout} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link href="/work/areas" className="inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[13.5px] font-medium">
          Open {rosters}
        </Link>
      </div>
    </section>
  )
}

// ── Enrolments ──────────────────────────────────────────────────────────────────────────

const ENROL_FLOW: Step[] = [
  { title: 'Client confirms', who: 'client',
    body: 'The client confirms creators on a proposal.' },
  { title: 'Real cost settled', who: 'founder',
    body: 'A founder settles what we actually pay each confirmed creator, on the proposal.' },
  { title: 'Link created', who: 'founder', whoText: 'The superadmin',
    body: 'Send link on the proposal panel, or from Enrolments. Only the superadmin sets one up.' },
  { title: 'Talent is told', who: 'machine', whoText: 'The platform',
    body: 'On the bell and by email: "Send @creator their enrolment link", with the link inside.' },
  { title: 'Sent on WhatsApp', who: 'talent',
    body: 'You send the link to the creator the same day, from your own WhatsApp.' },
  { title: 'Creator completes it', who: 'creator',
    body: 'Email code, details, address, agreement, passport, bank.' },
  { title: 'Payee confirmed', who: 'machine', whoText: 'The platform, or a person',
    body: 'Confirms itself when everything matches. Otherwise a person decides, with the reason shown.' },
  { title: 'Paid', who: 'founder',
    body: 'Payments flow to Payables and Payout runs. Only founders release money.' },
]

const CREATOR_STEPS = [
  'Verifies their email with a code.',
  'Gives their details and address. New links ask Home or Office. A home is a villa or an apartment, with number, floor, and building or community. An office has the company name.',
  'Signs the agreement.',
  'Uploads their passport.',
  'Gives bank details (IBAN), or for an exchange-house payout, the city they will collect in.',
]

export function EnrolmentGuide() {
  const campaigns = shortName('/work/campaigns')
  const enrolments = shortName('/work/enrolments')
  const money = shortName('/work/money')
  const payables = shortName('/work/payables')
  const payouts = shortName('/work/payouts')
  return (
    <section className="space-y-6" id="enrolments">
      <ChapterHead
        eyebrow="Talent and leadership"
        title="Enrolments"
        lede="An enrolment is the paperwork that lets us pay a booked creator: the agreement, their details, their address, their passport and their bank. Only the superadmin sets one up. Talent sends it, chases it, and answers the creator’s questions."
        art={
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-ds-2xl bg-[var(--console-lime)] text-[#111]">
            <FileSignature className="h-8 w-8" />
          </div>
        }
      />

      <div className={`${CARD} space-y-4 bg-card p-5`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-[15px] font-medium">From a client’s yes to a creator’s payment</h3>
          <FlowKey machineLabel="The platform does this" />
        </div>
        <Flow steps={ENROL_FLOW} cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel icon={BellRing} title="Talent: your part">
          <Numbered items={[
            'You are told on the bell and by email: "Send @creator their enrolment link". The link is inside both.',
            'Send it to the creator on WhatsApp the same day.',
            `Chase anybody who has not finished. ${campaigns}, then ${enrolments}, shows who is where.`,
            'Answer the creator’s questions about the form. Money questions go to a founder.',
            'If a passport is sent back, tell the creator: their passport step is open again.',
          ]} />
          <p className="reading-width flex gap-2 border-t pt-3 text-[13.5px] leading-relaxed">
            <Ban className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span>Links are personal. Never post one in a group, a story or anywhere public.</span>
          </p>
        </Panel>

        <Panel icon={UserRoundCheck} title="What the creator does">
          <Numbered items={CREATOR_STEPS} />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel icon={Landmark} title="When the payee confirms itself">
          <Bullets items={[
            'The bank account is in the creator’s own signed name. A shortened surname still counts.',
            'A passport has been uploaded.',
            'It is not a company account.',
            'If any of these fails, a person confirms it instead, and the reason is shown on the record.',
          ]} />
        </Panel>
        <Panel icon={ShieldCheck} title="Passports">
          <Bullets items={[
            'The system reads the passport and checks the name and the expiry date.',
            'A mismatch comes to a person.',
            'The enrolment record has two buttons: Looks right, and Send back.',
            'Send back reopens the creator’s passport step. Tell the creator, because they will not know otherwise.',
          ]} />
        </Panel>
      </div>

      <Panel icon={Send} title="Where it all lives">
        <Bullets items={[
          `${campaigns}, then the ${enrolments} tab: the list of every enrolment.`,
          'Each record shows everything the creator gave us, and links to its brand, its campaign and its proposal.',
          'On a proposal, the panel where a founder sends the link also has See its enrolments, for just that proposal’s creators.',
          `Once signed, payments flow to ${money}: ${payables}, then ${payouts}. Only founders release money.`,
        ]} />
      </Panel>
    </section>
  )
}
