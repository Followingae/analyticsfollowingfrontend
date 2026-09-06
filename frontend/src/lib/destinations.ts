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
    short: 'My queue',
    full: 'My queue',
    // Was "Waiting on me". First person, and it described the viewer rather than the place.
    hint: 'Everything waiting on a decision from you',
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
  '/work/clients': {
    short: 'Clients',
    full: 'Clients',
    // Was "My clients" for an account manager and "Clients" for a founder. Same screen.
    hint: 'The brands we run',
  },
  '/work/brands': {
    short: 'Brands',
    full: 'Brands',
    // The palette called this "Who has gone quiet", which is a report, not a destination.
    hint: 'Every brand we are talking to',
  },
  '/work/proposals': {
    short: 'Quotes',
    full: 'Quotes',
    hint: 'Rosters priced and sent to clients',
  },
  '/work/share': {
    short: 'Share links',
    full: 'Share links',
    // Was "Share Center": Title Case in a sentence-case menu, and American.
    hint: 'What clients have been sent, and whether they opened it',
  },
  '/work/campaigns': {
    short: 'Campaigns',
    full: 'Campaigns',
    hint: 'Live work and where each creator has got to',
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
  '/work/influencers/review': {
    short: 'Pending rates',
    full: 'Creators pending a rate',
    // Was "Creators needing a price". Four words, and a sentence fragment.
    hint: 'Creators nobody can sell until they are priced',
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

  // ── Settings ────────────────────────────────────────────────────────────────────────
  '/work/users': {
    short: 'Users',
    full: 'Client accounts',
    hint: 'Brand logins, plans and passwords',
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
  '/work/system': {
    short: 'System',
    full: 'System',
    hint: 'Pricing rules, plan limits, feature switches',
  },
}

/** The sidebar name for a URL. Falls back to the URL so a missing entry is visible, loudly,
 *  rather than rendering an empty menu row. */
export function shortName(url: string): string {
  // Try the whole URL first: a query string can make a genuinely different destination,
  // and /work/areas?kind=sample is a different thing from /work/areas. Then fall back to
  // the path, so an id or a tab does not lose the name of the screen it belongs to.
  return DESTINATIONS[url]?.short ?? DESTINATIONS[url.split('?')[0]]?.short ?? url
}

/** The page title for a URL. */
export function fullName(url: string): string {
  const d = DESTINATIONS[url] ?? DESTINATIONS[url.split('?')[0]]
  return d?.full ?? d?.short ?? url
}

export function hintFor(url: string): string | undefined {
  return (DESTINATIONS[url] ?? DESTINATIONS[url.split('?')[0]])?.hint
}
