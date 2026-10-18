/**
 * One name per destination.
 *
 * THE PROBLEM THIS SOLVES. The same screen had different names depending on who was looking
 * and which surface they were looking at. `/work/goals` was "My target" to a talent manager
 * and "Daily targets" to a founder. `/work/clients` was "My clients" and "Clients".
 * `/work/chasing` was "Creators to chase" and "Late & chasing". `/work/brands` was "Brands"
 * in the sidebar and "Who has gone quiet" in the command palette. The sidebar was sentence
 * case except "Share Center", which was Title Case and American; the palette was Title Case
 * throughout.
 *
 * That is not a slang problem and renaming a list of labels would not have fixed it. Two
 * people describing the same screen by different names cannot help each other, and a
 * notification that names a place the sidebar does not have is a dead end.
 *
 * So a destination has ONE name, defined here, and the sidebar, the command palette, page
 * titles, tabs and notifications all read it from this file. Adding a screen without adding
 * it here is the mistake this file exists to make obvious.
 *
 * THE RULES, applied to every entry:
 *   - a noun, or a noun phrase. A destination is a place, not an instruction.
 *   - sentence case. Only proper nouns keep a capital.
 *   - two words where two words will do.
 *   - no first person. "My clients" and "My target" describe the viewer, not the place, and
 *     they are why the same URL had two names.
 *   - no slang, no questions, no full sentences.
 *
 * `short` is for the sidebar, where width is scarce. `full` is for page titles and anywhere
 * a name appears without the surrounding context of a menu. Most entries are the same in
 * both, and that is a good sign rather than a redundancy.
 */

export interface Destination {
  /** The sidebar label. Short, sentence case, two words where possible. */
  short: string
  /** The page title and the name used away from the menu. */
  full: string
  /** What this screen is for, one line. Used by the command palette and tooltips. */
  hint?: string
}

export const DESTINATIONS: Record<string, Destination> = {
  // ── Personal ────────────────────────────────────────────────────────────────────────
  '/work/today': {
    short: 'Today',
    full: 'Today',
    hint: 'What your day is made of',
  },
  '/work/inbox': {
    short: 'Decisions',
    full: 'Open decisions',
    // Was "My queue", and before that "Waiting on me". Both are first person and describe the
    // viewer rather than the place. A queue is also what /work/system/jobs is, so the name
    // now says what is in it: decisions that are open.
    hint: 'Everything waiting on a decision from you',
  },
  '/work/desk': {
    short: 'Desk',
    full: 'The Desk',
    // Named for the place, not the channel: "Inbox" is already what /work/inbox was called
    // before it became Decisions. The hint says WHOSE it is, because the thing people got
    // wrong about this screen was not where it is, it was whether it was work.
    hint: 'Who has contacted the company. Superadmin only',
  },
  '/work/guide': {
    short: 'Guide',
    full: 'Guide',
    // Was "The manual". A definite article buys nothing, and the deck at /work/manual was
    // also called "The team manual" in the palette, so two screens shared one name.
    hint: 'What every screen is for',
  },
  '/work/manual': {
    short: 'Walkthrough',
    full: 'Walkthrough deck',
    hint: 'One brand end to end, narrated',
  },

  // ── Work ────────────────────────────────────────────────────────────────────────────
  '/work/pipeline': {
    short: 'Pipeline',
    full: 'Pipeline',
    // The ladder across every campaign at once. Named for the thing, not for the question
    // it answers: "Who is waiting on me" is a filter on this screen, not a second screen.
    hint: 'Every creator we owe something, and what happens next',
  },
  '/work/clients': {
    short: 'Clients',
    full: 'Clients',
    // Was "My clients" for an account manager and "Clients" for a founder. Same screen.
    hint: 'The brands we run',
  },
  '/work/clients/[teamId]': {
    short: 'Client record',
    full: 'Client record',
    hint: 'One client: contacts, campaigns, credits and what they owe',
  },
  '/work/brands': {
    short: 'Brands',
    full: 'Brands',
    // The palette called this "Who has gone quiet", which is a report, not a destination.
    hint: 'Every brand we are talking to',
  },
  '/work/brands/[teamId]': {
    short: 'Brand record',
    full: 'Brand record',
    hint: 'One brand we are talking to, and where the conversation stands',
  },
  '/work/proposals': {
    short: 'Quotes',
    full: 'Quotes',
    hint: 'Rosters priced and sent to clients',
  },
  '/work/proposals/create': {
    short: 'Quote builder',
    full: 'Quote builder',
    hint: 'Pick creators, set deliverables and price a new quote',
  },
  '/work/proposals/[id]': {
    short: 'Quote',
    full: 'Quote detail',
    hint: 'One quote: roster, prices, and what the client has picked',
  },
  '/work/proposals/[id]/approval': {
    short: 'Internal approval',
    full: 'Internal approval',
    hint: 'The sign-off a quote needs before it goes to the client',
  },
  '/work/proposals/[id]/confirm': {
    short: 'Client confirmation',
    full: 'Client confirmation',
    hint: 'Lock a quote on behalf of the client and settle real costs',
  },
  '/work/proposals/[id]/mechanics': {
    short: 'Product mechanics',
    full: 'Product mechanics',
    hint: 'What each creator does with the product, and the dine-in visit terms',
  },
  '/work/share': {
    short: 'Share links',
    full: 'Share links',
    // Was "Share Center": Title Case in a sentence-case menu, and American.
    hint: 'What clients have been sent, and whether they opened it',
  },
  '/work/partners': {
    short: 'Partner leads',
    full: 'Partner leads',
    hint: 'Enquiries from the partner page on the marketing site',
  },
  '/work/campaigns': {
    short: 'Campaigns',
    full: 'Campaigns',
    hint: 'Live work and where each creator has got to',
  },
  '/work/campaigns/create': {
    short: 'Campaign setup',
    full: 'Campaign setup',
    hint: 'Open a campaign and choose its creators and deliverables',
  },
  '/work/campaigns/[campaignId]/timeline': {
    short: 'Campaign timeline',
    full: 'Campaign timeline',
    hint: 'Every date in one campaign, from brief to payout',
  },
  '/work/campaigns/[campaignId]/ladder': {
    short: 'Delivery board',
    full: 'Delivery board',
    // Matrix proposed "Delivery board"; kept. "Ladder" is the URL and internal jargon, not a name anybody outside the team would search for.
    hint: 'Each creator in one campaign, rung by rung to delivered',
  },
  // Reached from a campaign rather than the sidebar, but it is a destination: notifications
  // and the command palette both need a name for it, and a name that only exists in a button
  // is how the same screen ends up called three things.
  '/work/campaigns/content': {
    short: 'Content',
    full: 'Campaign content',
    hint: 'What creators have delivered, and what the client has approved',
  },
  '/work/creators': {
    short: 'Creators',
    full: 'Creators',
    hint: 'The master database',
  },
  '/work/influencers': {
    short: 'Creators',
    full: 'Creators and rates',
    hint: 'The master database, with cost and sell pricing',
  },
  '/work/influencers/add': {
    short: 'Creator intake',
    full: 'Creator intake',
    hint: 'Add creators to the master database, singly or in bulk',
  },
  '/work/influencers/analyzed': {
    short: 'Analysed',
    full: 'Analysed creators',
    hint: 'Creators whose analytics have run, and how they came out',
  },
  '/work/influencers/review': {
    short: 'Pending rates',
    full: 'Creators pending a rate',
    // Was "Creators needing a price". Four words, and a sentence fragment.
    hint: 'Creators nobody can sell until they are priced',
  },
  '/work/sales': {
    // ⚠️ TWO REASONS THIS IS NOT CALLED PIPELINE, AND BOTH BIT.
    //
    // The name: /work/pipeline is already the DELIVERY ladder, so both screens would have
    // read "Pipeline · ... and what happens next" in one menu. That is the collision this
    // registry exists to stop.
    //
    // The path: `pipeline` is in the /work rewrite's exclusion list, and the rule is a
    // negative lookahead on the START of the path. So /work/pipeline-deals failed the
    // lookahead, was never rewritten to its /superadmin page, and 404'd - the same trap
    // that once broke /work/brands/{id}. A new segment must not begin with an excluded
    // word.
    short: 'Sales',
    full: 'Sales pipeline',
    hint: 'Every brand we are talking to, before they are a client',
  },
  '/work/negotiations': {
    short: 'Rates',
    full: 'Rates to agree',
    hint: 'Clients said yes; nothing opens until we know what we pay',
  },
  '/work/handovers': {
    short: 'To send',
    full: 'Ready to send',
    hint: 'Client links Zain has checked, for you to send',
  },
  '/work/requests': {
    short: 'Requests',
    full: 'Waiting on us',
    hint: 'What clients and colleagues have asked for',
  },
  '/work/lists': {
    short: 'Lists',
    full: 'Standing lists',
    // Not "Segments" and not "Audiences": those are words from someone else's product. A
    // list is what the team already calls it.
    hint: 'Who our creators are, by category and country',
  },
  '/work/areas': {
    short: 'Rosters',
    full: 'Rosters',
    // Was "Brand rosters" in one place and "Sample packs" in another, for the same screen
    // with a query string.
    hint: 'What a client asked us to source, and who we found',
  },
  '/work/areas?kind=sample': {
    short: 'Sample packs',
    full: 'Sample packs',
    hint: 'Pre-built rosters to show a brand before anybody commits',
  },
  '/work/areas/[areaId]': {
    short: 'Roster',
    full: 'Roster detail',
    hint: 'One roster: the brief, the creators found and what is still open',
  },
  '/work/chasing': {
    short: 'Chasing',
    full: 'Chasing',
    // Was "Creators to chase" and "Late & chasing". Two names, one with an ampersand.
    hint: 'Who is late, who is due, who has gone quiet',
  },
  '/work/enrolments': {
    short: 'Enrolments',
    full: 'Enrolments',
    hint: 'Agreements, details and delivery addresses',
  },
  '/work/enrolments/[id]': {
    short: 'Enrolment record',
    full: 'Enrolment record',
    hint: 'One enrolment: agreement, details and instalments',
  },
  '/work/enrolments/payments': {
    short: 'Payments',
    full: 'Enrolment payments',
    hint: 'Who has signed, and whether their money has gone out',
  },
  '/work/payables': {
    short: 'Payables',
    full: 'Creator payments',
    hint: 'What we owe every creator',
  },
  /* Payables is what we owe. This is the act of paying it: approved payments gathered into
     one run, checked, turned into a single bank file, and closed once the bank has taken it.
     Six endpoints for this existed for months with no screen at all, which is why there are
     zero runs in production. */
  '/work/payouts': {
    short: 'Payout runs',
    full: 'Payout runs',
    hint: 'Checked, turned into one bank file, and closed once the bank has taken it',
  },
  /* The URL stays /work/mor. Renaming it would break every link already sent in a
     notification email, and the path is not what anybody reads. */
  '/work/mor': {
    short: 'Creator contracting',
    full: 'Creator contracting and payouts',
    hint: 'Brand orders we contract, invoice, collect and pay out',
  },
  '/work/mor/[kind]/[id]': {
    short: 'Contracting order',
    full: 'Contracting order',
    hint: 'One brand order, from contract to the last creator payout',
  },
  '/work/money': {
    short: 'Finance',
    full: 'Finance',
    // Was "Money". Accurate, but the group heading above it was "Running the company", and
    // between them they read as a category rather than a screen.
    hint: 'In, out, and committed but unpaid',
  },
  '/work/approvals': {
    short: 'Approvals',
    full: 'Approvals',
    // Was "Sign-offs", which also rendered as "Sign-offs1" to a screen reader because the
    // count span sat against the label with no separator.
    hint: 'Held until a founder says yes',
  },
  '/work/billing': {
    short: 'Client credits',
    full: 'Client credits',
    hint: 'Credit balances, top-ups and plans for every client',
  },
  '/work/report-campaigns': {
    short: 'Reports',
    full: 'Campaign reports',
    hint: 'Finished campaigns written up for clients',
  },
  '/work/report-campaigns/[id]': {
    short: 'Campaign report',
    full: 'Campaign report',
    hint: 'One finished campaign: results, content and spend',
  },
  '/superadmin/operations': {
    short: 'Operations queues',
    full: 'Operations queues',
    // The only entry keyed /superadmin/...: this page has no /work/ form, and the rewrite only goes one way.
    hint: 'Work that has piled up and needs an owner',
  },

  // ── Insight ─────────────────────────────────────────────────────────────────────────
  '/work/coverage': {
    short: 'Coverage',
    full: 'Coverage',
    // Was "Where we're thin". Slang, an apostrophe, and three words.
    hint: 'Categories and cities we cannot field a roster in',
  },
  '/work/goals': {
    short: 'Targets',
    full: 'Targets',
    // Was "My target" and "Daily targets" for the same URL.
    hint: 'What we are measured on, and progress against it',
  },
  '/work/fa/reliability': {
    short: 'Reliability',
    full: 'Creator reliability',
    // The Creators hub called this "Who actually delivers".
    hint: 'Who delivers, scored from their last ten deliverables',
  },

  // ── Creator app ─────────────────────────────────────────────────────────────────────
  '/work/fa/campaigns': {
    short: 'App campaigns',
    full: 'Creator app campaigns',
    hint: 'Barter, cashback and paid deals creators apply to',
  },
  '/work/fa/campaigns/new': {
    short: 'Campaign type',
    full: 'Campaign type',
    hint: 'Choose cashback, barter or paid deal before setting one up',
  },
  '/work/fa/campaigns/create': {
    short: 'Cashback setup',
    full: 'Cashback campaign setup',
    hint: 'Set up a cashback offer at a merchant',
  },
  '/work/fa/campaigns/create-barter': {
    short: 'Barter setup',
    full: 'Barter campaign setup',
    hint: 'Set up a product-for-content deal',
  },
  '/work/fa/campaigns/create-paid-deal': {
    short: 'Paid deal setup',
    full: 'Paid deal setup',
    hint: 'Set up a fixed fee deal for creators to apply to',
  },
  '/work/fa/campaigns/[id]': {
    short: 'Campaign funnel',
    full: 'App campaign funnel',
    hint: 'One app campaign from applicants to delivered content',
  },
  '/work/fa/merchants': {
    short: 'Merchants',
    full: 'Merchants',
    hint: 'The venues and brands behind cashback offers',
  },
  '/work/fa/members': {
    short: 'App users',
    full: 'Creator app users',
    // Was "App creators" in the sidebar and "On the app" as a hub tab.
    hint: 'Creators signed up in the app',
  },
  '/work/fa': {
    short: 'App overview',
    full: 'Creator app overview',
    hint: 'The creator app at a glance',
  },
  '/work/fa/activity': {
    short: 'App activity',
    full: 'Creator app activity',
    hint: 'What creators are doing right now',
  },
  '/work/fa/ad-banners': {
    short: 'Banners',
    full: 'App banners',
    hint: 'Promos on the app home screen',
  },
  '/work/fa/notifications': {
    short: 'App messages',
    full: 'Creator app messages',
    hint: 'Push messages to creators',
  },
  '/work/fa/deliverables': {
    short: 'Content review',
    full: 'Content review',
    hint: 'Content creators have uploaded, waiting for a yes or an edit',
  },
  '/work/fa/wallets': {
    short: 'App balances',
    full: 'Creator app balances',
    hint: 'What each creator holds in the app',
  },
  '/work/fa/withdrawals': {
    short: 'Withdrawals',
    full: 'Creator withdrawals',
    hint: 'Cash-out requests from creators',
  },
  '/work/fa/receipt-claims': {
    short: 'Receipt claims',
    full: 'Receipt claims',
    hint: 'Receipts creators submitted for cashback',
  },

  // ── Company ─────────────────────────────────────────────────────────────────────────
  '/work/team': {
    short: 'Team',
    full: 'Team',
    // Was "My team".
    hint: 'Who is on staff and what they are carrying',
  },
  '/work/system/displays': {
    short: 'Displays',
    full: 'Office displays',
    // Was "Office screens", which read as a place rather than a setting.
    hint: 'What the wall screens show',
  },
  '/work/system/jobs': {
    short: 'Job queue',
    full: 'Job queue',
    hint: 'Background work running now, and what has failed',
  },
  '/work/approvals/gate': {
    short: 'Approval gate',
    full: 'The approval gate',
    hint: 'What staff can do on their own, and what waits for you',
  },
  '/work/system/images': {
    short: 'Images',
    full: 'Image pipeline',
    // Named for the thing it looks after rather than the technology. "CDN" is what the
    // bucket is called; the question people arrive with is why a creator has no face.
    hint: 'Avatars and thumbnails on our own CDN, and the jobs that failed',
  },

  // ── Settings ────────────────────────────────────────────────────────────────────────
  '/work/users': {
    short: 'Users',
    full: 'Client accounts',
    hint: 'Brand logins, plans and passwords',
  },
  '/work/users/create': {
    short: 'Account setup',
    full: 'Account setup',
    hint: 'Create a client login with a plan and starting credits',
  },
  '/work/users/[userId]': {
    short: 'Client account',
    full: 'Client account',
    hint: 'One client login: plan, credits, team and password',
  },
  '/work/staff': {
    short: 'Staff',
    full: 'Staff accounts',
    hint: 'Internal accounts and what each role reaches',
  },
  '/work/notifications': {
    short: 'Sending',
    full: 'Sending',
    // Was "Email alerts", which named one channel out of several and left WhatsApp, proposal
    // emails, account emails and every enrolment email describing themselves elsewhere.
    hint: 'Everything the platform sends, and who receives it',
  },
  '/work/whatsapp': {
    short: 'WhatsApp',
    full: 'WhatsApp',
    hint: 'Broadcasts and templates',
  },
  '/work/whatsapp/broadcasts/[id]': {
    short: 'Broadcast delivery',
    full: 'Broadcast delivery',
    hint: 'Who a broadcast reached, and who it failed',
  },
  '/work/system': {
    short: 'System',
    full: 'System',
    hint: 'Pricing rules, plan limits, feature switches',
  },
}

/** Keys with a [param] segment are patterns: /work/proposals/[id] names every quote. Built
 *  once, and tried only after an exact match fails, so a literal key like
 *  /work/proposals/create always beats /work/proposals/[id]. */
const PATTERNS: Array<[RegExp, Destination]> = Object.entries(DESTINATIONS)
  .filter(([key]) => key.includes('['))
  .map(([key, d]): [RegExp, Destination] => [
    new RegExp('^' + key.replace(/\[[^\]]+\]/g, '[^/]+') + '$'),
    d,
  ])

function lookup(url: string): Destination | undefined {
  const path = url.split('?')[0].replace(/\/+$/, '')
  return (
    DESTINATIONS[url] ??
    DESTINATIONS[path] ??
    PATTERNS.find(([re]) => re.test(path))?.[1]
  )
}

/** The sidebar name for a URL. Falls back to the URL so a missing entry is visible, loudly,
 *  rather than rendering an empty menu row. */
export function shortName(url: string): string {
  // Try the whole URL first: a query string can make a genuinely different destination,
  // and /work/areas?kind=sample is a different thing from /work/areas. Then fall back to
  // the path, so an id or a tab does not lose the name of the screen it belongs to.
  return lookup(url)?.short ?? url
}

/** The page title for a URL. */
export function fullName(url: string): string {
  const d = lookup(url)
  return d?.full ?? d?.short ?? url
}

export function hintFor(url: string): string | undefined {
  return lookup(url)?.hint
}
