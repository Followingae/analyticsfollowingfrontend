/**
 * Guided walkthroughs — the in-app curriculum.
 *
 * These are not tips. Between them they teach the platform end to end, so a new joiner can be
 * handed a login and work their way through their track without anyone sitting beside them.
 * They replaced a written guide nobody read: a page describing a screen is always one release
 * behind it, whereas a walkthrough runs on the screen itself and cannot describe what is not there.
 *
 * Rules for writing a step:
 *   - One idea. Two short sentences at most.
 *   - Say what to do and what will happen, not what the feature "enables".
 *   - Never name a person. Roles only — manuals and tours outlive staff.
 *   - If it points at something, use a real selector. If the element may be absent for a role,
 *     leave `target` off and the card centres instead of breaking the run.
 */

export type Audience = 'superadmin' | 'leadership' | 'talent' | 'account' | 'bd' | 'all'

export interface TourStep {
  target?: string
  title: string
  body: string
  goto?: string
  place?: 'top' | 'bottom' | 'left' | 'right'
}

export interface Walkthrough {
  id: string
  title: string
  blurb: string
  minutes: number
  track: string
  audience: Audience[]
  steps: TourStep[]
}

/** Ordered — this is the order the panel lists them in, and the order to learn them. */
export const TRACKS = [
  'Start here',
  'Creators',
  'Sourcing',
  'Clients & campaigns',
  'Money',
  'Running the company',
] as const

export const WALKTHROUGHS: Walkthrough[] = [

  // ───────────────────────────────────────────────────────────── Start here
  {
    id: 'find-your-way', track: 'Start here', minutes: 3, audience: ['all'],
    title: 'Find your way around',
    blurb: 'The six places work lives, and how to jump anywhere.',
    steps: [
      { title: 'Welcome',
        body: 'Six stops, about three minutes. You can stop any time and re-run this from the same button.' },
      { target: '[data-sidebar="sidebar"]', place: 'right',
        title: 'Six surfaces, not thirty', body: 'Today, Pipeline, Clients, Creators, Queues, Money. Everything else lives inside one of them.' },
      { target: '[data-tour="search"]', place: 'bottom',
        title: 'Search beats hunting', body: 'Press ⌘K (Ctrl+K on Windows) and type a screen name. Every screen in the platform is in there.' },
      { title: 'You only see your own tools',
        body: 'The sidebar hides what your role does not use. If a colleague has an item you do not, that is deliberate.' },
      { title: 'A dash is not a bug',
        body: 'Where a price shows “—”, that number is outside your role and was never sent to your browser.' },
      { target: '[data-tour="help"]', place: 'bottom',
        title: 'This button', body: 'Every walkthrough is here, grouped by topic. Finished ones stay — re-run them whenever.' },
    ],
  },
  {
    id: 'confidentiality', track: 'Start here', minutes: 3, audience: ['all'],
    title: 'What you may share, and what you may not',
    blurb: 'The rules around pricing, in plain terms.',
    steps: [
      { title: 'Why this matters',
        body: 'Our creator pricing is the thing competitors cannot copy. These rules are short and they are enforced by the platform, not by trust.' },
      { title: 'On screen: yes',
        body: 'Work with any creator on screen, within what your role can see. That is the job.' },
      { title: 'Files: no',
        body: 'Spreadsheet exports are limited to the founders. If you cannot see an Export button, that is why.' },
      { title: 'Links to clients: founders only',
        body: 'Only the founders create a link a client can open. Anyone can send one once it exists.' },
      { title: 'To show a client creators, use a proposal or a shortlist link',
        body: 'Never a file. A file cannot enforce any rule the moment it has been forwarded.' },
      { title: 'Access is recorded',
        body: 'Who opened which creators, and how many. It is a count, never the data. Normal work never gets near the limits.' },
    ],
  },

  // ───────────────────────────────────────────────────────────── Creators
  {
    id: 'add-creators', track: 'Creators', minutes: 4,
    audience: ['talent', 'superadmin', 'leadership'],
    title: 'Add creators to the database',
    blurb: 'The single most repeated job. Under a minute once you know it.',
    steps: [
      { goto: '/superadmin/influencers', title: 'The master database',
        body: 'Everyone we can book. Add to it the moment you find someone — never wait for a client to ask.' },
      { target: '[data-tour="add-creators"]', place: 'left',
        title: 'Start here', body: 'Opens a panel. There is no price box on it, on purpose.' },
      { title: 'Paste a whole block',
        body: 'One handle per line, or comma separated. Duplicates are ignored, so paste freely.' },
      { title: 'Pick a category',
        body: 'Food, family, beauty, lifestyle, travel, fashion. This decides which searches and rounds they appear in.' },
      { title: 'Pick a market',
        body: 'UAE, KSA, Kuwait. This is the first thing a client asks about, so never skip it.' },
      { title: 'Add a one-line note',
        body: 'Where you found them, whether they take barter. Write it for whoever reads it in six months.' },
      { title: 'Press Add',
        body: 'They are saved instantly and their analytics begin pulling in the background.' },
      { title: 'What happens next',
        body: 'They sit in the Waiting room: invisible to clients, unusable in a proposal, until a founder prices them.' },
    ],
  },
  {
    id: 'record-cost', track: 'Creators', minutes: 4,
    audience: ['talent', 'superadmin', 'leadership'],
    title: 'Record what a creator costs',
    blurb: 'The work that compounds — every rate outlives the deal.',
    steps: [
      { goto: '/superadmin/influencers', title: 'Why this is the important half',
        body: 'A handle with no rate is a name. A handle with a rate is something we can sell.' },
      { title: 'Open the creator',
        body: 'Click their row. A panel opens on the right with five tabs.' },
      { title: 'Go to Pricing',
        body: 'Enter the reel and post cost first — those are the two we quote most. The rest sit behind More.' },
      { title: 'Record who quoted it and when',
        body: 'A rate older than six months should be re-checked before it goes near a proposal.' },
      { title: 'Add the agency or manager',
        body: 'So nobody has to rediscover who to email next quarter.' },
      { title: 'Cost is not what we charge',
        body: 'You record what the creator charges us. What the client pays is set by a founder, and you will not see it.' },
      { title: 'Dead deals still pay off',
        body: 'If the brand goes quiet, the rates stay. Next quarter that is a week of work you do not repeat.' },
    ],
  },
  {
    id: 'coverage', track: 'Creators', minutes: 3,
    audience: ['talent', 'superadmin', 'leadership'],
    title: 'Decide what to research next',
    blurb: 'Coverage turns “keep looking” into a finite list.',
    steps: [
      { goto: '/work/coverage', title: 'Coverage',
        body: 'Category down the side, market across the top. Darker means stronger.' },
      { title: 'It counts rates, not names',
        body: 'A cell only counts creators we hold a usable cost for. A category full of names with no rate is not coverage.' },
      { title: 'Pale cells are your backlog',
        body: 'On a day with no open round, the palest cell is the answer to “what should I do”.' },
      { title: 'Research next',
        body: 'The panel below the grid ranks the thinnest cells for you, weakest first.' },
      { title: 'Data to tidy',
        body: 'Creators with no category or market cannot appear in any cell. Fixing those is the cheapest win here.' },
    ],
  },
  {
    id: 'price-approve', track: 'Creators', minutes: 4, audience: ['superadmin'],
    title: 'Price and approve a creator',
    blurb: 'The gate. Only you can open it.',
    steps: [
      { goto: '/superadmin/influencers/review', title: 'The Waiting room',
        body: 'Everything the team has found, oldest first. None of it can be sold yet.' },
      { title: 'What each card tells you',
        body: 'Who found them, how long they have waited, what they cost us so far, and whether analytics landed.' },
      { title: 'Judge before you price',
        body: 'Open their analytics if you are unsure. A clean 0% engagement means the measurement failed, not that nobody engaged.' },
      { title: 'Price and approve',
        body: 'Set at least one sell price. Approving without one is refused — an unpriced creator cannot be quoted.' },
      { title: 'What approval does',
        body: 'They become live: selectable in proposals, visible to clients, and included in coverage.' },
      { title: 'Turning someone down',
        body: 'Keeps the row and every rate researched on it. They can be approved later for a different brand.' },
      { title: 'Nothing is ever deleted',
        body: 'That is the rule across the whole database. Wrong for one brand is often right for the next.' },
    ],
  },

  // ───────────────────────────────────────────────────────────── Sourcing
  {
    id: 'sourcing-round', track: 'Sourcing', minutes: 5,
    audience: ['talent', 'account', 'bd', 'superadmin', 'leadership'],
    title: 'Work a sourcing round',
    blurb: 'When a client asks to see creators. This replaces the email loop.',
    steps: [
      { goto: '/work/sourcing', title: 'Rounds',
        body: 'One round is one client request. It has an owner, a due date and a state.' },
      { target: '[data-tour="new-round"]', place: 'left',
        title: 'Open a round', body: 'Give it a title, how many creators are wanted, and when they are due.' },
      { title: 'Read the criteria first',
        body: 'Market, category, follower range, and anything excluded. They are fields, not a paragraph to re-read.' },
      { title: 'Fill from the database first',
        body: 'Anyone already priced can go straight in. Only add new names for the gaps.' },
      { title: 'Rejected creators are blocked',
        body: 'Paste someone this client already turned down and it is refused, telling you who and why.' },
      { title: 'Submit for internal review',
        body: 'A founder approves or strikes each creator. A strike always carries a reason.' },
      { title: 'The link is minted by a founder',
        body: 'Only they can create a link a client opens. You will be told the moment it exists.' },
      { title: 'The client answers on that page',
        body: 'They tick who they want and say why not for the rest. Their answers land here automatically.' },
      { title: 'If they want more',
        body: 'Press More requested. Round two opens with every rejection already excluded.' },
      { title: 'Never ask “should I keep looking”',
        body: 'Round open means keep going. Locked means stop. That is the whole point of rounds.' },
    ],
  },
  {
    id: 'review-shortlist', track: 'Sourcing', minutes: 4,
    audience: ['superadmin', 'leadership'],
    title: 'Review a shortlist before it goes out',
    blurb: 'Your judgement is the last gate before a client sees anyone.',
    steps: [
      { goto: '/work/sourcing', title: 'Open the round',
        body: 'Anything in internal review is waiting on you.' },
      { title: 'The criteria sit above the creators',
        body: 'Including what the client rejected last round, so you are judging against the real brief.' },
      { title: 'Approve or strike each one',
        body: 'Approve is one click. Strike asks for a reason and will not proceed without it.' },
      { title: 'Why the reason matters most',
        body: 'It is kept on the creator, blocks them returning for this brand, and teaches whoever sources next time.' },
      { title: 'Send when you are happy',
        body: 'Only approved creators go on the client link. Struck ones never leave the building.' },
      { title: 'Two rejected rounds means the brief is wrong',
        body: 'Not the sourcing. Re-read it with the client before more work goes in.' },
    ],
  },

  // ─────────────────────────────────────────────── Clients & campaigns
  {
    id: 'brand-heartbeat', track: 'Clients & campaigns', minutes: 3,
    audience: ['account', 'bd', 'superadmin', 'leadership'],
    title: 'Keep your brands warm',
    blurb: 'Silence is the thing that kills deals, so it is the headline.',
    steps: [
      { goto: '/work/brands', title: 'Brand heartbeat',
        body: 'Every client, sorted by how long since anything moved.' },
      { title: 'Silent',
        body: 'Green under a week, amber to a fortnight, red beyond. Act on the colour, not on memory.' },
      { title: 'Whose move',
        body: 'Us or them. Most stalled deals are not a decision — they are nobody’s turn.' },
      { title: 'What they last said',
        body: 'The client’s own words, dated, so nobody has to dig through a thread to find them.' },
      { title: 'Open items',
        body: 'Shortlist awaiting a verdict, agreement out, invoice unpaid, content in review — at a glance.' },
    ],
  },
  {
    id: 'campaign-timeline', track: 'Clients & campaigns', minutes: 4,
    audience: ['account', 'talent', 'bd', 'superadmin', 'leadership'],
    title: 'Read a campaign end to end',
    blurb: 'One page answers “where are we with this client”.',
    steps: [
      { goto: '/superadmin/campaigns', title: 'Pick a campaign',
        body: 'Open any campaign, then its timeline.' },
      { title: 'The spine',
        body: 'Proposal, sourcing rounds, agreement, invoice, roster, content, report, payments — in the order they happened.' },
      { title: 'Green is done, blue is moving',
        body: 'So you can see instantly where the campaign actually is.' },
      { title: 'The roster',
        body: 'Who is booked and confirmed. Cost and sell each appear only for the roles entitled to see them.' },
      { title: 'Everyone reads the same page',
        body: 'Talent, account and founders. What differs is the columns, not the story.' },
    ],
  },
  {
    id: 'chase-content', track: 'Clients & campaigns', minutes: 4,
    audience: ['talent', 'account', 'superadmin', 'leadership'],
    title: 'Chase content and clear the queue',
    blurb: 'Getting the work in, and reviewing it fast.',
    steps: [
      { goto: '/superadmin/operations', title: 'Queues',
        body: 'Everything waiting on a human decision, in one place.' },
      { title: 'The eight stages',
        body: 'Idea, drafting, awaiting approval, approved, in production, in review, ready to post, posted.' },
      { title: 'Anything stuck for days is your warning',
        body: 'A creator who has not started two days out will not make the deadline. Call, do not message.' },
      { title: 'Approve, reject, or request an edit',
        body: 'An edit request asks the creator to resubmit and says what to change. Retries are limited, so be specific.' },
      { title: 'If a creator cannot upload',
        body: 'Flag it. An operator can attach the file for them. Never hold content in a chat app.' },
    ],
  },
  {
    id: 'log-opportunity', track: 'Clients & campaigns', minutes: 3,
    audience: ['bd', 'account', 'superadmin', 'leadership'],
    title: 'Log a new brand on day one',
    blurb: 'Thirty seconds that buys the talent team three months.',
    steps: [
      { goto: '/work/brands', title: 'Why day one',
        body: 'A new client takes two to four months to close. Logged early, the talent team can research the whole time.' },
      { title: 'What to enter',
        body: 'Name, category, market, and roughly what they might want. No budget needed.' },
      { title: 'It is not a forecast',
        body: 'Nobody will hold you to it. Brands that go nowhere still leave the database richer.' },
      { title: 'What the team sees',
        body: 'Not your deal and not your numbers — just “we may need family and food creators in UAE and KSA”.' },
      { title: 'The payoff',
        body: 'On the day it signs, the shortlist already exists, priced and approved. No three-week scramble.' },
    ],
  },
  {
    id: 'build-proposal', track: 'Clients & campaigns', minutes: 5,
    audience: ['bd', 'account', 'superadmin', 'leadership'],
    title: 'Build and send a proposal',
    blurb: 'The commercial document the client judges us on.',
    steps: [
      { goto: '/superadmin/proposals', title: 'Proposals',
        body: 'Everything sent, and where each one stands.' },
      { title: 'Start one',
        body: 'Pick the brand, the campaign type, the budget and the deadline. The budget frames every later decision.' },
      { title: 'Payment schedule',
        body: 'Milestones — normally an advance and a balance. These become the invoices later, so get them right here.' },
      { title: 'Add creators',
        body: 'Search the database, search app members, or paste a handle. Only priced creators appear.' },
      { title: 'If someone you need is missing',
        body: 'They are in the Waiting room without a price. Ask for them to be priced — never quote a number yourself.' },
      { title: 'Deliverables per creator',
        body: 'What each one produces and how many. This drives the totals the client sees.' },
      { title: 'Submit for internal approval',
        body: 'It reaches the client only after the approval chain clears.' },
      { title: 'Three kinds of link',
        body: 'Quotation for a prospect choosing, sample when paperwork is attached, full once signed and paid.' },
    ],
  },
  {
    id: 'paperwork', track: 'Clients & campaigns', minutes: 4,
    audience: ['bd', 'superadmin', 'leadership'],
    title: 'Agreements, invoices and onboarding',
    blurb: 'Getting from “yes” to a start date.',
    steps: [
      { goto: '/superadmin/clients', title: 'Open the client, then Commercial',
        body: 'Agreements and invoices both live on that tab.' },
      { title: 'Upload the agreement, then Send',
        body: 'A new upload supersedes the previous version automatically. Nothing is deleted.' },
      { title: 'Mark it signed',
        body: 'Attach their signed copy. That ticks half of the client’s gate.' },
      { title: 'Raise the advance invoice',
        body: 'Amount, terms, and a payment link if there is one. Attach the PDF.' },
      { title: 'Mark it paid',
        body: 'The gate opens and the full roster unlocks for the client automatically.' },
      { title: 'Never promise a start date before the advance lands',
        body: 'The roster stays locked and the campaign cannot begin.' },
      { title: 'Then create their account',
        body: 'Client → Access sends the credentials, and the campaign briefing explains what happens next.' },
    ],
  },

  // ───────────────────────────────────────────────────────────── Money
  {
    id: 'payables', track: 'Money', minutes: 4,
    audience: ['talent', 'account', 'superadmin', 'leadership'],
    title: 'Record and track creator payments',
    blurb: 'The book that replaces the monthly spreadsheet.',
    steps: [
      { goto: '/work/payables', title: 'Creator payments',
        body: 'What we owe, what is approved, what is paid. Anyone internal can record one.' },
      { title: 'Record a payment',
        body: 'Title, creator, what for, and the amount agreed. That is all it takes.' },
      { title: 'Agreed is not the same as the catalogue rate',
        body: 'Rates get negotiated down campaign by campaign. Enter what was actually agreed; the screen shows both.' },
      { title: 'Owed → approved → paid',
        body: 'Recording is not paying. Only the founders mark something paid, because that is money leaving.' },
      { title: 'Talent can see the status',
        body: 'So when a creator asks whether they were paid, the answer is on screen. Never guess a date.' },
      { title: 'Export when you need a sheet',
        body: 'One button gives you a CSV of exactly what is on screen.' },
    ],
  },
  {
    id: 'money-leadership', track: 'Money', minutes: 4, audience: ['superadmin', 'leadership'],
    title: 'Money: invoices, ageing and margin',
    blurb: 'What is invoiced, what has landed, and what is late.',
    steps: [
      { goto: '/superadmin/billing', title: 'Billing and revenue',
        body: 'Invoiced against collected, MRR, transactions and subscriptions.' },
      { title: 'Ageing is the number that matters',
        body: 'Anything past its due date is money we have earned and not received.' },
      { title: 'Margin is cost and sell together',
        body: 'Which is why only the founders see it. Nobody else is shown both halves.' },
      { title: 'Deleting a paid invoice is serious',
        body: 'It destroys the payment record and can re-close a client’s access. Removing just the PDF is usually what you want.' },
      { title: 'Creator payables sit beside it',
        body: 'Money out as well as money in — the two halves of the same question.' },
    ],
  },

  // ─────────────────────────────────────────── Running the company
  {
    id: 'capabilities-leadership', track: 'Running the company', minutes: 6,
    audience: ['superadmin', 'leadership'],
    title: 'Everything you can do',
    blurb: 'The full set of founder powers, and the few that are yours alone.',
    steps: [
      { title: 'You see the whole company',
        body: 'Every client, campaign, creator, price, margin and person. No screen is hidden from you.' },
      { goto: '/work/today', title: 'Today',
        body: 'Your landing screen: decisions with your name on them, then everything in flight.' },
      { goto: '/work/team', title: 'The creator team console',
        body: 'Approvals waiting on you, each person’s month, and alerts that fire on patterns rather than single events.' },
      { goto: '/work/goals', title: 'Goals',
        body: 'Set two numbers a month. Daily targets compute themselves from how many rounds are open.' },
      { title: 'Pricing creators is yours alone',
        body: 'Nobody else can set a sell price or release a creator into the master database.' },
      { title: 'Client links are yours alone',
        body: 'Only founders mint a link a client can open. Business development sends it and is told when it exists.' },
      { title: 'Marking money paid is yours alone',
        body: 'Anyone can record a creator payment; only founders mark it paid.' },
      { title: 'Exports are yours alone',
        body: 'Spreadsheet exports of the creator database, and list CSVs, stop with the founders.' },
      { title: 'Deleting is the superadmin’s alone',
        body: 'Campaigns, proposals, creators, clients, members — destructive actions never reach staff.' },
      { title: 'And you can approve from your inbox',
        body: 'The decisions above can arrive as an email with Approve and Reject in it.' },
    ],
  },
  {
    id: 'inbox-approvals', track: 'Running the company', minutes: 3,
    audience: ['superadmin', 'leadership'],
    title: 'Approve from your inbox',
    blurb: 'Decide from a phone, without logging in.',
    steps: [
      { title: 'What arrives',
        body: 'An email naming exactly what is being approved, with Approve and Reject in it.' },
      { title: 'One tap, no login',
        body: 'The link works once and expires after seven days. The platform updates immediately.' },
      { title: 'Which decisions come this way',
        body: 'Pricing a creator, sending a proposal or agreement, issuing an invoice, releasing a payment run.' },
      { title: 'The record is the same either way',
        body: 'Answering from the email or from a button here produces an identical audit row.' },
      { goto: '/superadmin/notifications', title: 'You choose what emails you get',
        body: 'Settings → Email alerts lists every event with a switch and a Test button.' },
    ],
  },
  {
    id: 'team-and-alerts', track: 'Running the company', minutes: 4,
    audience: ['superadmin', 'leadership'],
    title: 'Read the team, and the alerts',
    blurb: 'Who is moving, who is stuck, and what to do about it.',
    steps: [
      { goto: '/work/team', title: 'Your people',
        body: 'A card each: this month, what is in their queue, and what is late.' },
      { title: 'Pace is measured against time, not raw percentage',
        body: '40% on the 12th is on track. Behind only appears after several days off the curve.' },
      { title: 'Round due with nothing submitted',
        body: 'Usually an unclear brief or a thin category. Ask which before assuming it is effort.' },
      { title: 'Nobody added a creator in a week',
        body: 'Sourcing has stalled behind something else. Find out what.' },
      { title: 'A client rejected two shortlists running',
        body: 'That is a brief problem, not a sourcing problem. Re-read it with the client.' },
      { title: 'Security alerts are private',
        body: 'Unusual read volume and export attempts reach only you and the co-founder — never the team, never the wall.' },
    ],
  },
  {
    id: 'staff-and-access', track: 'Running the company', minutes: 4, audience: ['superadmin'],
    title: 'Add a person and set their access',
    blurb: 'Roles, modules, and which clients they can see.',
    steps: [
      { goto: '/superadmin/users/create', title: 'Create the account',
        body: 'Three kinds: brand user, staff, admin. Staff is anyone internal.' },
      { title: 'Pick the staff role',
        body: 'Talent manager, account manager, co-founder or CEO. The role decides the default modules.' },
      { goto: '/superadmin/staff', title: 'Then set their access',
        body: 'Manage access controls which modules they open and which clients they may see.' },
      { title: 'What every role is refused',
        body: 'Deleting anything, and moving money. Those never leave the founders whatever modules are ticked.' },
      { title: 'Scoped versus full access',
        body: 'An account manager sees their own clients. A co-founder sees all of them. That is set here.' },
    ],
  },
  {
    id: 'office-wall', track: 'Running the company', minutes: 3, audience: ['superadmin', 'leadership'],
    title: 'Put the wall on the office TV',
    blurb: 'A screen anyone can watch, safely.',
    steps: [
      { title: 'Create a display',
        body: 'Give the screen a label so you know which TV it is. You get a link back.' },
      { title: 'Open that link on the TV',
        body: 'No login. It cycles delivery slides and refreshes itself in the background.' },
      { title: 'A team display never receives money',
        body: 'Not hidden — the figures are never sent to it. Deal values cannot appear on the office screen.' },
      { title: 'What it shows',
        body: 'Live campaigns, what is due, sourcing progress, creators, and database growth.' },
      { title: 'Revoke any time',
        body: 'Kills that screen instantly. A dead display shows in “last seen”.' },
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
    : staffRole === 'business_development' ? 'bd'
    : 'all'
  return WALKTHROUGHS.filter(w => w.audience.includes('all') || w.audience.includes(audience))
}

/** Grouped for the panel, in learning order, empty tracks dropped. */
export function tracksFor(role: string | null, staffRole: string | null) {
  const mine = tourFor(role, staffRole)
  return TRACKS
    .map(t => ({ track: t, tours: mine.filter(w => w.track === t) }))
    .filter(g => g.tours.length > 0)
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
