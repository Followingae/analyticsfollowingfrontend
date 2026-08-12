/**
 * Guided walkthroughs — "let me show you how".
 *
 * Each walkthrough is a short sequence of steps. A step points at a real element on a real
 * screen (by CSS selector) and says one thing about it. Steps can navigate first, so a
 * walkthrough can carry someone across several screens.
 *
 * Rules for writing these:
 *   - One idea per step. Two short sentences at most.
 *   - Say what to do, not what the feature "enables".
 *   - Never name a person. Roles only.
 *   - If a step has no `target`, it renders centred — use that for openers and closers.
 */

export type Audience = 'superadmin' | 'leadership' | 'talent' | 'account' | 'all'

export interface TourStep {
  /** CSS selector for the element to spotlight. Omit for a centred card. */
  target?: string
  title: string
  body: string
  /** Navigate here before showing the step. */
  goto?: string
  /** Where the card sits relative to the target. Defaults to auto. */
  place?: 'top' | 'bottom' | 'left' | 'right'
}

export interface Walkthrough {
  id: string
  title: string
  blurb: string
  minutes: number
  audience: Audience[]
  steps: TourStep[]
}

export const WALKTHROUGHS: Walkthrough[] = [
  {
    id: 'find-your-way',
    title: 'Find your way around',
    blurb: 'The sidebar, search, and where work lives.',
    minutes: 1,
    audience: ['all'],
    steps: [
      { title: 'A quick tour', body: 'Four stops. You can leave at any point and re-run this later from the same button.' },
      { target: '[data-sidebar="sidebar"]', place: 'right',
        title: 'The sidebar', body: 'Everything you can open. You only see the sections your role has.' },
      { target: '[data-tour="search"]', place: 'bottom',
        title: 'Search anything', body: 'Press ⌘K from anywhere and type a screen name. Fastest way to move.' },
      { target: '[data-tour="help"]', place: 'bottom',
        title: 'This button', body: 'Every walkthrough lives here. Nothing you start is ever lost — re-run it whenever.' },
    ],
  },
  {
    id: 'add-creators',
    title: 'Add creators to the platform',
    blurb: 'Paste handles, tag them, done. Under a minute.',
    minutes: 2,
    audience: ['talent', 'superadmin', 'leadership'],
    steps: [
      { goto: '/superadmin/influencers', title: 'Adding creators',
        body: 'Do this the moment you find someone — not when a client asks.' },
      { target: '[data-tour="add-creators"]', place: 'left',
        title: 'Start here', body: 'Opens a panel where you paste handles. There is no price box on it.' },
      { title: 'Paste a whole block',
        body: 'One handle per line, or comma separated. Duplicates are ignored automatically.' },
      { title: 'Tag them',
        body: 'Pick a category and a market. This is what makes them findable later.' },
      { title: 'What happens next',
        body: 'They land in the waiting room, analytics start, and no client can see them until they are priced.' },
    ],
  },
  {
    id: 'price-and-approve',
    title: 'Price and approve a creator',
    blurb: 'Release someone into the master database.',
    minutes: 2,
    audience: ['superadmin'],
    steps: [
      { goto: '/superadmin/influencers/review', title: 'The waiting room',
        body: 'Everyone the team has found, oldest first. Nothing here can be sold yet.' },
      { title: 'What each card tells you',
        body: 'Who found them, how long they have waited, what they cost us so far, and whether analytics landed.' },
      { title: 'Price and approve',
        body: 'Set at least one sell price. Approving without one is refused — an unpriced creator cannot be quoted.' },
      { title: 'Turning someone down',
        body: 'Keeps the row and every rate researched on it. They can be approved later for a different brand.' },
    ],
  },
  {
    id: 'sourcing-round',
    title: 'Run a sourcing round',
    blurb: 'When a client asks to see some creators.',
    minutes: 3,
    audience: ['talent', 'account', 'superadmin', 'leadership'],
    steps: [
      { goto: '/superadmin/sourcing', title: 'Sourcing rounds',
        body: 'One round is one client request. It has an owner, a due date and a state.' },
      { target: '[data-tour="new-round"]', place: 'left',
        title: 'Open a round', body: 'Give it a title, how many creators are wanted, and when they are due.' },
      { title: 'Fill it',
        body: 'Add creators from the database first. Anyone missing can be pasted in and saved as usual.' },
      { title: 'Internal review',
        body: 'Each creator is approved or struck. A strike always needs a reason.' },
      { title: 'Why the reason matters',
        body: 'It is kept on the creator and blocks them coming back for this client. It also teaches the next round.' },
      { title: 'If they want more',
        body: 'Press "More requested". Round two opens with every rejection already excluded.' },
    ],
  },
  {
    id: 'keep-brands-warm',
    title: 'Keep your brands warm',
    blurb: 'Reading the heartbeat and spotting silence.',
    minutes: 2,
    audience: ['account', 'superadmin', 'leadership'],
    steps: [
      { goto: '/superadmin/clients', title: 'Your brands',
        body: 'Every client you own, with how long since anyone spoke to them.' },
      { title: 'Whose move is it',
        body: 'Most stalled deals are not a decision — they are nobody’s turn. This column says which.' },
      { title: 'What they last said',
        body: 'The client’s own words, dated, so nobody has to dig through an email thread.' },
      { title: 'Silence is the alarm',
        body: 'A brand quiet for over a week turns amber, over two weeks red. Act on colour, not memory.' },
    ],
  },
  {
    id: 'confidentiality',
    title: 'What you may share',
    blurb: 'Exports, links, and the rules around pricing.',
    minutes: 1,
    audience: ['all'],
    steps: [
      { title: 'Our pricing is the company’s edge',
        body: 'These rules are short, and they are enforced by the platform rather than by trust.' },
      { title: 'On screen: yes',
        body: 'Work with any creator on screen, within what your role can see.' },
      { title: 'Files and links: no',
        body: 'Spreadsheet exports and client links are leadership only. The buttons are simply not there for others.' },
      { title: 'To show a client creators',
        body: 'Send a proposal. Never a file — a file cannot enforce any rule once it has been emailed.' },
      { title: 'Everything is logged',
        body: 'Who opened which creator, when, and how many. Unusual volume raises an alert.' },
    ],
  },
]

/** Which walkthroughs to offer, given the caller's role. */
export function tourFor(role: string | null, staffRole: string | null): Walkthrough[] {
  const isSuper = role === 'super_admin' || role === 'superadmin'
  const audience: Audience =
    isSuper ? 'superadmin'
    : staffRole === 'ceo' || staffRole === 'cofounder' ? 'leadership'
    : staffRole === 'talent_manager' ? 'talent'
    : staffRole === 'account_manager' ? 'account'
    : 'all'
  return WALKTHROUGHS.filter(w => w.audience.includes('all') || w.audience.includes(audience))
}

const KEY = 'following.tours.done'

export function markDone(id: string) {
  if (typeof window === 'undefined') return
  const done = new Set(completed())
  done.add(id)
  localStorage.setItem(KEY, JSON.stringify([...done]))
}

export function completed(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
