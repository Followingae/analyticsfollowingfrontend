/**
 * Guided walkthroughs — the in-app curriculum.
 *
 * These are not tips. Between them they teach the platform end to end, so a new joiner can be
 * handed a login and work their way through their track without anyone sitting beside them.
 * They replaced a written guide nobody read: a page describing a screen is always one release
 * behind it, whereas a walkthrough runs on the screen itself and cannot describe what is not there.
 *
 * Rules for writing a step:
 *   - One idea. Two short sentences at most, and short words in them.
 *   - Say what to do and what will happen. No jargon: someone reading this is new here.
 *   - Say what a thing costs or blocks if getting it wrong is expensive.
 *   - Never name a person. Roles only — manuals and tours outlive staff.
 *   - If it points at something, use a real selector. If the element may be absent for a role,
 *     leave `target` off and the card centres instead of breaking the run.
 */

export type Audience = 'superadmin' | 'leadership' | 'talent' | 'account' | 'bd' | 'all'

export interface TourStep {
  target?: string
  /** Skip this step when its target is not on screen — used for role-specific shortcuts. */
  onlyIfPresent?: boolean
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
    id: 'basic-lesson', track: 'Start here', minutes: 3, audience: ['all'],
    title: 'Your home screen, button by button',
    blurb: 'Start here. What every part of Today does.',
    steps: [
      { goto: '/work/today', target: '[data-tour="today-greeting"]', place: 'bottom',
        title: 'This is your home screen',
        body: 'Open it first each morning. The line under your name says how much is waiting on you.' },
      { target: '[data-tour="today-numbers"]', place: 'bottom',
        title: 'Four numbers',
        body: 'Where the company stands right now. Click one to open the list behind it.' },
      { target: '[data-tour="today-queue"]', place: 'right',
        title: 'Your work',
        body: 'Everything waiting on you, oldest first. Click a line to open the job it belongs to.' },
      { target: '[data-tour="today-queue"]', place: 'right',
        title: 'Two tabs',
        body: 'Waiting on me needs something from you. In flight is running and needs nobody.' },
      { target: '[data-tour="today-shortcuts"]', place: 'bottom',
        title: 'Your shortcuts',
        body: 'The places you use every day. You only see the ones your job uses \u2014 here is each one.' },

      // One step per shortcut, each skipped when that person does not have it. Same lesson,
      // different length depending on the role.
      { target: '[data-tour="shortcut-areas"]', place: 'bottom', onlyIfPresent: true,
        title: 'Areas',
        body: 'Use this to open a brand\u2019s creator list and add creators to it.' },
      { target: '[data-tour="shortcut-waiting-room"]', place: 'bottom', onlyIfPresent: true,
        title: 'Waiting room',
        body: 'Use this to add what a creator charges us, and for a founder to set our price.' },
      { target: '[data-tour="shortcut-proposals"]', place: 'bottom', onlyIfPresent: true,
        title: 'Proposals',
        body: 'Use this to build the list you send a client, and to see what they picked.' },
      { target: '[data-tour="shortcut-campaigns"]', place: 'bottom', onlyIfPresent: true,
        title: 'Campaigns',
        body: 'Use this to run a booked campaign: rates, briefs, content, posting.' },
      { target: '[data-tour="shortcut-brands"]', place: 'bottom', onlyIfPresent: true,
        title: 'Brands',
        body: 'Use this to log a brand you spoke to and keep track of where it stands.' },
      { target: '[data-tour="shortcut-approvals"]', place: 'bottom', onlyIfPresent: true,
        title: 'Approvals',
        body: 'Use this to see what you asked a founder to approve, and whether they answered.' },
      { target: '[data-tour="shortcut-payables"]', place: 'bottom', onlyIfPresent: true,
        title: 'Payables',
        body: 'Use this to record what we owe a creator and to mark it paid.' },
      { target: '[data-tour="shortcut-coverage"]', place: 'bottom', onlyIfPresent: true,
        title: 'Coverage',
        body: 'Use this to see which categories and markets we are thin in, so you know who to find next.' },
      { target: '[data-tour="shortcut-screens"]', place: 'bottom', onlyIfPresent: true,
        title: 'Office screens',
        body: 'Use this to control what the office TV shows.' },

      { target: '[data-tour="today-add"]', place: 'left', onlyIfPresent: true,
        title: 'Add creators',
        body: 'Use this the moment you find someone. Adding costs nothing.' },
      { target: '[data-tour="search"]', place: 'bottom', onlyIfPresent: true,
        title: 'Search',
        body: 'Press Ctrl+K and type a name. Faster than the menu.' },
      { target: '[data-tour="help"]', place: 'bottom',
        title: 'More lessons',
        body: 'Every walkthrough lives behind this button. Take the ones in your track next.' },
    ],
  },
  {
    id: 'find-your-way', track: 'Start here', minutes: 3, audience: ['all'],
    title: 'Find your way around',
    blurb: 'Six places. That is the whole menu.',
    steps: [
      { title: 'Two minutes',
        body: 'Six short stops. Stop whenever you like and start again from the same button.' },
      { target: '[data-sidebar="sidebar"]', place: 'right',
        title: 'Six places',
        body: 'Today, Inbox, Clients, Campaigns, Creators, Money. Every screen sits inside one of them.' },
      { target: '[data-tour="search"]', place: 'bottom',
        title: 'Search instead of hunting',
        body: 'Press Ctrl+K and type what you want. Everything is in there.' },
      { title: 'You see your own work',
        body: 'The menu hides what your job does not use. If a colleague has more, that is on purpose.' },
      { title: 'A dash means not yours',
        body: 'Where a price shows a dash, that number is for another role. It never reached your screen.' },
      { target: '[data-tour="help"]', place: 'bottom',
        title: 'This button',
        body: 'All the walkthroughs live here. Done ones stay, so you can watch again.' },
    ],
  },
  {
    id: 'your-day', track: 'Start here', minutes: 2, audience: ['all'],
    title: 'Start your day',
    blurb: 'Today and Inbox. What to do, and what is waiting.',
    steps: [
      { goto: '/work/today', title: 'Today',
        body: 'Open this first. It lists what needs you, most urgent at the top.' },
      { title: 'Every line is a link',
        body: 'Click it and you land on the screen that does the job. No hunting.' },
      { goto: '/work/inbox', title: 'Inbox',
        body: 'Everything waiting on a decision from you, from every part of the platform.' },
      { title: 'Empty is good',
        body: 'Nothing shown means nothing is waiting. We never invent a task to fill the space.' },
      { title: 'Email fits the same shape',
        body: 'Urgent things email you straight away. The rest arrive together at 8:30 and 5:30.' },
    ],
  },
  {
    id: 'confidentiality', track: 'Start here', minutes: 2, audience: ['all'],
    title: 'What you can share',
    blurb: 'The pricing rules, in plain words.',
    steps: [
      { title: 'Why it matters',
        body: 'Our creator prices are the thing rivals cannot copy. The platform enforces these rules for you.' },
      { title: 'On screen: fine',
        body: 'Work with any creator you can see. That is the job.' },
      { title: 'Files: no',
        body: 'Only founders can export a spreadsheet. No Export button means it is not yours.' },
      { title: 'Client links: founders only',
        body: 'A founder makes the link. Anyone can send it once it exists.' },
      { title: 'Showing a client creators',
        body: 'Use a proposal or a shortlist link. Never a file. A file cannot be taken back.' },
      { title: 'We record who looked',
        body: 'A count only, never the data. Normal work never comes close to a limit.' },
    ],
  },

  // ───────────────────────────────────────────────────────────── Creators
  {
    id: 'add-creators', track: 'Creators', minutes: 3,
    audience: ['talent', 'superadmin', 'leadership'],
    title: 'Add creators',
    blurb: 'The job you do most. Under a minute.',
    steps: [
      { goto: '/work/influencers', title: 'The creator database',
        body: 'Everyone we can book. Add people the day you find them. Do not wait for a client to ask.' },
      { target: '[data-tour="add-creators"]', place: 'left',
        title: 'Add creators',
        body: 'Opens a small form. There is no price box on it, on purpose.' },
      { title: 'Paste a whole list',
        body: 'One handle per line, or separated by commas. Repeats are ignored, so paste freely.' },
      { title: 'Pick a category and a market',
        body: 'Food, family, beauty, travel. UAE, KSA, Kuwait. Clients ask for both, so never skip them.' },
      { title: 'Add one line about them',
        body: 'Where you found them, whether they take barter. Write it for whoever reads it next year.' },
      { title: 'Press Add',
        body: 'They are saved at once and go to the Waiting room.' },
      { title: 'Nothing is spent yet',
        body: 'We only pull their numbers after a founder approves them. Adding people costs nothing.' },
      { title: 'What happens next',
        body: 'A founder sets the price. Until then they cannot go on a proposal and no client sees them.' },
    ],
  },
  {
    id: 'record-cost', track: 'Creators', minutes: 3,
    audience: ['talent', 'superadmin', 'leadership'],
    title: 'Record what a creator charges',
    blurb: 'The work that keeps paying off.',
    steps: [
      { goto: '/work/influencers/review', title: 'Why this half matters',
        body: 'A handle on its own is a name. A handle with a rate is something we can sell.' },
      { target: '[data-tour="waiting-lanes"]', place: 'bottom',
        title: 'Two lists, two jobs',
        body: 'Needs a cost is yours. Needs a sell price is the founder\u2019s, after you.' },
      { target: '[data-tour="waiting-view"]', place: 'bottom',
        title: 'One at a time',
        body: 'Use this for a long list. One creator fills the screen and arrow keys move you along.' },
      { title: 'Add their cost',
        body: 'Type what they quoted you, in AED. Reel and post first \u2014 we quote those most.' },
      { title: 'Part-filled is fine',
        body: 'Put in what you have. You can come back and add the rest.' },
      { title: 'Add a line if it matters',
        body: 'Rate holds till month end, wants product too. Write it for whoever reads it next year.' },
      { title: 'Cost is not what we charge',
        body: 'You record what they charge us. A founder sets what the client pays, and you never see it.' },
      { title: 'Saving hands it over',
        body: 'They move to Needs a sell price and a founder is told. Nothing is spent yet.' },
      { title: 'Even dead deals pay off',
        body: 'If the brand goes quiet the rates stay. Next time that is a week you do not repeat.' },
    ],
  },
  {
    id: 'coverage', track: 'Creators', minutes: 2,
    audience: ['talent', 'superadmin', 'leadership'],
    title: 'Decide who to research next',
    blurb: 'Turns "keep looking" into a short list.',
    steps: [
      { goto: '/work/coverage', title: 'Coverage',
        body: 'Category down the side, market across the top. Darker means we are stronger there.' },
      { target: '[data-tour="stats"]',
        title: 'It counts rates, not names',
        body: 'A creator only counts once we hold a price for them. Names alone are not coverage.' },
      { title: 'Pale squares are the backlog',
        body: 'With no round open, the palest square answers "what should I do today".' },
      { title: 'The list below ranks them',
        body: 'Weakest first, so you can start at the top.' },
      { title: 'Easiest win',
        body: 'Creators with no category or market show nowhere. Filling those in takes seconds.' },
    ],
  },
  {
    id: 'price-approve', track: 'Creators', minutes: 3, audience: ['superadmin'],
    title: 'Price and approve a creator',
    blurb: 'Only you can do this.',
    steps: [
      { goto: '/work/influencers/review', title: 'The Waiting room',
        body: 'Everyone we cannot quote yet, split into the two jobs that get them out of here.' },
      { target: '[data-tour="waiting-lanes"]', place: 'bottom',
        title: 'Needs a sell price is yours',
        body: 'The talent team fills the first list. Work the second \u2014 the cost is already in.' },
      { title: 'The card shows their cost',
        body: 'What they charge us per deliverable, and who got the rate. Price against that.' },
      { target: '[data-tour="waiting-view"]', place: 'bottom',
        title: 'One at a time',
        body: 'Use this to clear a backlog without reading a wall of cards.' },
      { title: 'Margin shows as you type',
        body: 'The figure beside each price is the margin on it. Only you ever see that number.' },
      { title: 'Look before you price',
        body: 'Open their numbers if unsure. A flat 0% means the check failed, not that nobody engaged.' },
      { title: 'Set a price and approve',
        body: 'At least one price is required. Without one we cannot quote them, so it is refused.' },
      { title: 'Approving starts their analytics',
        body: 'That is when we spend money on them. Adding and researching are free.' },
      { title: 'They go live',
        body: 'Now they can go on proposals, be shown to clients, and count towards coverage.' },
      { title: 'Turning someone down',
        body: 'Keeps the row and every rate on it. You can approve them later for another brand.' },
      { title: 'We never delete anyone',
        body: 'Wrong for one brand is often right for the next.' },
    ],
  },

  // ───────────────────────────────────────────────────────────── Delivery
  {
    id: 'delivery-board', track: 'Clients & campaigns', minutes: 4,
    audience: ['talent', 'account', 'superadmin', 'leadership'],
    title: 'Running a campaign after the client says go',
    blurb: 'The eight steps every booked creator goes through.',
    steps: [
      { title: 'Open the campaign, then Delivery board',
        body: 'One column per step. Everyone sits in the column they have reached.' },
      { title: 'Record what you agreed',
        body: 'Type the rate you negotiated. It is not final yet, and it says so.' },
      { title: 'A founder confirms it',
        body: 'They get an email they can answer from their phone. No login, two buttons.' },
      { title: 'Then the agreement',
        body: 'Put the signed file on the creator. You cannot do this before the rate is confirmed.' },
      { title: 'Send the guide and set a date',
        body: 'The date is the important half: it is what the platform chases on.' },
      { title: 'It chases for you',
        body: 'Four days out, two, one, the day itself. Then it is marked missed. The team is told, not the creator.' },
      { title: 'Content in, approved, posted',
        body: 'Paste what arrives, approve it, then paste the live link when it goes up.' },
      { title: 'Paying them',
        body: 'Founders only, and the amount comes from the confirmed rate. Nobody types it twice.' },
      { title: 'Somebody drops out',
        body: 'Take them off with a reason. The record stays — it matters the next time we book them.' },
    ],
  },

  // ───────────────────────────────────────────────────────────── Sourcing
  {
    id: 'areas', track: 'Sourcing', minutes: 3,
    audience: ['talent', 'bd', 'account', 'superadmin', 'leadership'],
    title: 'Areas: one roster per brand',
    blurb: 'Where sourcing lives, from first interest to the proposal.',
    steps: [
      { goto: '/work/areas', title: 'One area per brand',
        body: 'Everything we have found for that brand sits here and keeps growing. It is not a one-off list.' },
      { title: 'Three numbers on every card',
        body: 'Found is what we have. Cleared is what the client may see. Picked is what they chose.' },
      { title: 'Sample packs',
        body: 'Standing sets like Fitness UAE. Anyone can send one the moment a prospect asks.' },
      { title: 'Keep adding while they decide',
        body: 'Nothing you add reaches a client on its own. Stock it all week without worrying.' },
      { title: 'It becomes the proposal',
        body: 'When they say go, the area goes onto a proposal in one action. Nothing is re-found.' },
    ],
  },
  {
    id: 'start-sourcing', track: 'Sourcing', minutes: 3, audience: ['superadmin', 'leadership'],
    title: 'Release a brand to the team',
    blurb: 'The decision that starts everyone else.',
    steps: [
      { goto: '/work/areas', title: 'Interest is logged all week',
        body: 'Business development records brands who showed interest. Nothing starts until you release one.' },
      { target: '[data-tour="start-sourcing"]', place: 'left', title: 'Start sourcing',
        body: 'Pick the brand, hand it to someone, and write what we are looking for.' },
      { title: 'The brief is the whole point',
        body: 'How many, which market, categories, follower range, deliverables, budget each.' },
      { title: 'Read it back before you send',
        body: 'The box shows the exact sentence the team will receive. If it reads thin, it is thin.' },
      { title: 'Then talent is told',
        body: 'The person you chose gets it at once, with the brief attached.' },
    ],
  },
  {
    id: 'clear-to-share', track: 'Sourcing', minutes: 3, audience: ['superadmin', 'leadership'],
    title: 'Clear creators for a client',
    blurb: 'Deciding who leaves the building.',
    steps: [
      { goto: '/work/areas', title: 'Open the brand area',
        body: 'Everyone in it is internal until you say otherwise.' },
      { title: 'Tick and clear',
        body: 'Tick the ones the client should see, then Clear to share. Only cleared people appear on a link.' },
      { title: 'Unpriced people are refused',
        body: 'A creator with no sell price cannot be cleared. You will be told which ones.' },
      { title: 'Take someone off the table',
        body: 'Striking keeps them and their research, and asks why. The reason stops a repeat next round.' },
      { title: 'The link is safe to leave open',
        body: 'Talent can keep adding all week. Nothing new reaches the client until you clear it.' },
      { title: 'Their answers come back here',
        body: 'What the client picked or passed on lands on the same rows. Nobody re-types anything.' },
    ],
  },

  {
    id: 'write-brief', track: 'Sourcing', minutes: 3, audience: ['superadmin', 'leadership'],
    title: 'Write a sourcing brief',
    blurb: 'What the team needs before they can start.',
    steps: [
      { goto: '/work/today', title: 'It starts on Today',
        body: 'When someone logs a new client, you get a line asking you to write the brief.' },
      { goto: '/work/sourcing', title: 'Open a round',
        body: 'One round is one client request. Opening it is how you hand the work over.' },
      { target: '[data-tour="new-round"]', place: 'left',
        title: 'Say what you want',
        body: 'How many creators, by when, what kind, which market, follower range, deliverables, budget each.' },
      { title: 'Pick who does it',
        body: 'Choose a talent manager. They are told at once and it appears on their Today.' },
      { title: 'They also get the client',
        body: 'Being given a round opens that client for them. They will not hit a locked door.' },
      { title: 'A round without a brief is stuck',
        body: 'Nobody can guess what to look for. The round says so, and you can write it there.' },
    ],
  },
  {
    id: 'sourcing-round', track: 'Sourcing', minutes: 4,
    audience: ['talent', 'account', 'bd', 'superadmin', 'leadership'],
    title: 'Fill a sourcing round',
    blurb: 'When a client wants to see creators.',
    steps: [
      { goto: '/work/sourcing', title: 'Rounds',
        body: 'One round is one client request. It has an owner, a date and a state.' },
      { target: '[data-tour="page-head"]',
        title: 'Read the brief first',
        body: 'At the top: what kind of creator, which market, follower range, deliverables, budget each.' },
      { title: 'Fill from the database first',
        body: 'Anyone already priced can go straight in. Only look for new people to fill the gaps.' },
      { title: 'New names are fine',
        body: 'Paste a handle we do not have. It is added and goes to the Waiting room to be priced.' },
      { title: 'Rejected creators are blocked',
        body: 'Add someone this client already said no to and it is refused, and tells you why.' },
      { title: 'Send it for review',
        body: 'A founder checks each creator. Anyone they strike gets a reason.' },
      { title: 'A founder makes the client link',
        body: 'You are told the moment it exists.' },
      { title: 'The client answers on that page',
        body: 'They tick who they want. Their answers come straight back here.' },
      { title: 'If they want more',
        body: 'Press More requested. A second round opens with the rejected ones already left out.' },
      { title: 'Never ask if you should keep going',
        body: 'Round open means keep going. Locked means stop.' },
    ],
  },
  {
    id: 'review-shortlist', track: 'Sourcing', minutes: 3,
    audience: ['superadmin', 'leadership'],
    title: 'Check a shortlist before it goes out',
    blurb: 'The last look before a client sees anyone.',
    steps: [
      { goto: '/work/sourcing', title: 'Open the round',
        body: 'Anything marked for review is waiting on you.' },
      { target: '[data-tour="page-head"]',
        title: 'The brief sits above them',
        body: 'Including what the client turned down last time, so you judge against the real ask.' },
      { title: 'Approve or strike each one',
        body: 'Approve is one click. Strike asks why, and will not go through without it.' },
      { title: 'The reason matters most',
        body: 'It stays on the creator, blocks them for this brand, and teaches whoever looks next time.' },
      { title: 'Send when you are happy',
        body: 'Only approved creators reach the client. Struck ones never leave the building.' },
      { title: 'Two rejected rounds means the brief is wrong',
        body: 'Not the sourcing. Go back to the client before more time goes in.' },
    ],
  },

  // ─────────────────────────────────────────────── Clients & campaigns
  {
    id: 'log-opportunity', track: 'Clients & campaigns', minutes: 2,
    audience: ['bd', 'account', 'superadmin', 'leadership'],
    title: 'Log a new client on day one',
    blurb: 'Thirty seconds that buys the team months.',
    steps: [
      { goto: '/work/brands', title: 'Why so early',
        body: 'A new client takes two to four months to close. Logged now, we can research the whole time.' },
      { title: 'What to put in',
        body: 'Name, category, market, and roughly what they might want. No budget needed.' },
      { title: 'It is not a promise',
        body: 'Nobody holds you to it. Clients that go nowhere still leave us with better data.' },
      { title: 'A founder writes the brief',
        body: 'They turn it into a sourcing round: what kind of creator, how many, budget each.' },
      { title: 'Then the team starts',
        body: 'The talent manager gets the round and the brief together, so nobody has to guess.' },
      { title: 'The payoff',
        body: 'On the day it signs, the shortlist already exists, priced and ready.' },
    ],
  },
  {
    id: 'brand-heartbeat', track: 'Clients & campaigns', minutes: 2,
    audience: ['account', 'bd', 'superadmin', 'leadership'],
    title: 'Keep your clients warm',
    blurb: 'Silence is what kills deals.',
    steps: [
      { goto: '/work/brands', title: 'Your clients',
        body: 'Every client, longest silence first.' },
      { title: 'Colour tells you when to act',
        body: 'Green under a week, amber up to two, red past that. Trust the colour, not your memory.' },
      { title: 'Whose turn is it',
        body: 'Ours or theirs. Most stuck deals are not a no. Nobody has the ball.' },
      { title: 'What they last said',
        body: 'Their own words, with a date, so nobody digs through email to find them.' },
      { title: 'What is open',
        body: 'Shortlist waiting, agreement out, invoice unpaid, content in review. All in one line.' },
    ],
  },
  {
    id: 'campaign-timeline', track: 'Clients & campaigns', minutes: 3,
    audience: ['account', 'talent', 'bd', 'superadmin', 'leadership'],
    title: 'Read a campaign end to end',
    blurb: 'One page answers "where are we".',
    steps: [
      { goto: '/work/campaigns', title: 'Pick a campaign',
        body: 'Open any campaign to see it from start to finish.' },
      { title: 'In the order it happened',
        body: 'Proposal, sourcing, agreement, invoice, creators, content, report, payments.' },
      { title: 'Green is done, blue is moving',
        body: 'So you can see where it actually is in a second.' },
      { title: 'The creators on it',
        body: 'Who is booked and confirmed. Prices show only for the roles allowed to see them.' },
      { title: 'Everyone reads the same page',
        body: 'What changes between roles is the columns, not the story.' },
    ],
  },
  {
    id: 'chase-content', track: 'Clients & campaigns', minutes: 3,
    audience: ['talent', 'account', 'superadmin', 'leadership'],
    title: 'Chase content and clear the queue',
    blurb: 'Getting work in, and reviewed fast.',
    steps: [
      { goto: '/work/inbox', title: 'What is waiting',
        body: 'Content to check sits in your Inbox with everything else needing a decision.' },
      { goto: '/ops/campaigns', title: 'The stages',
        body: 'Idea, drafting, waiting for approval, approved, filming, in review, ready, posted.' },
      { title: 'Stuck for days is your warning',
        body: 'A creator who has not started two days before the deadline will miss it. Call, do not message.' },
      { title: 'Approve, reject, or ask for a change',
        body: 'A change request tells them what to fix. They only get a few tries, so be clear.' },
      { title: 'If they cannot upload',
        body: 'Flag it and someone can attach the file for them. Never keep content in a chat app.' },
    ],
  },
  {
    id: 'build-proposal', track: 'Clients & campaigns', minutes: 4,
    audience: ['bd', 'account', 'superadmin', 'leadership'],
    title: 'Build and send a proposal',
    blurb: 'What the client judges us on.',
    steps: [
      { goto: '/work/proposals', title: 'Proposals',
        body: 'Everything sent, and where each one stands.' },
      { title: 'Start one',
        body: 'Pick the client, the type, the budget and the deadline.' },
      { title: 'Payment steps',
        body: 'Usually an advance and a balance. These become the invoices later, so get them right now.' },
      { title: 'Add creators',
        body: 'Search the database or paste a handle. Only creators with a price show up.' },
      { title: 'If someone is missing',
        body: 'They have no price yet. Ask a founder to price them. Never make up a number.' },
      { title: 'Say what each one delivers',
        body: 'Reels, stories, posts, and how many. This is what makes the total.' },
      { title: 'Send it for approval',
        body: 'It only reaches the client once a founder has approved it.' },
      { title: 'Three kinds of link',
        body: 'A quote while they choose, a sample with paperwork, the full one once signed and paid.' },
    ],
  },
  {
    id: 'paperwork', track: 'Clients & campaigns', minutes: 3,
    audience: ['bd', 'superadmin', 'leadership'],
    title: 'Agreements, invoices and access',
    blurb: 'From yes to a start date.',
    steps: [
      { goto: '/work/clients', title: 'Open the client, then Commercial',
        body: 'Agreements and invoices both live on that tab.' },
      { title: 'Upload the agreement, then send it',
        body: 'A new upload replaces the old one. Nothing is deleted.' },
      { title: 'Mark it signed',
        body: 'Attach their signed copy. That is half the gate.' },
      { title: 'Raise the advance invoice',
        body: 'Amount, terms, and a payment link if you have one. Attach the PDF.' },
      { title: 'Mark it paid',
        body: 'The gate opens and the client sees the full list of creators.' },
      { title: 'Do not promise a start date first',
        body: 'Until the advance lands the list stays locked and the campaign cannot start.' },
      { title: 'Then give them a login',
        body: 'Client, then Access. It emails them their details and explains what happens next.' },
    ],
  },

  // ───────────────────────────────────────────────────────────── Money
  {
    id: 'payables', track: 'Money', minutes: 3,
    audience: ['talent', 'account', 'superadmin', 'leadership'],
    title: 'Record and track creator payments',
    blurb: 'This replaces the monthly spreadsheet.',
    steps: [
      { goto: '/work/payables', title: 'Creator payments',
        body: 'What we owe, what is approved, what is paid. Anyone here can record one.' },
      { title: 'Record a payment',
        body: 'Who, what for, and how much was agreed. That is it.' },
      { title: 'Agreed is not the list price',
        body: 'Rates get negotiated. Put in what was actually agreed. The screen shows both.' },
      { title: 'Owed, approved, paid',
        body: 'Recording is not paying. Only founders mark something paid, because that is money going out.' },
      { title: 'You can see the status',
        body: 'So when a creator asks if they were paid, the answer is on screen. Never guess.' },
      { title: 'Need a sheet?',
        body: 'One button gives you a file of exactly what you are looking at.' },
    ],
  },
  {
    id: 'money-leadership', track: 'Money', minutes: 3, audience: ['superadmin', 'leadership'],
    title: 'Invoices, late money and margin',
    blurb: 'What is out, what landed, what is late.',
    steps: [
      { goto: '/work/billing', title: 'Money in',
        body: 'Invoiced against collected, month by month.' },
      { title: 'Late money is the number to watch',
        body: 'Anything past its date is money we earned and have not been paid.' },
      { title: 'Margin needs both halves',
        body: 'Cost and price together, which is why only founders see it.' },
      { title: 'Deleting a paid invoice is serious',
        body: 'It destroys the payment record and can lock a client out. Usually you just want to remove the PDF.' },
      { title: 'Money out sits beside it',
        body: 'Creator payments are the other half of the same question.' },
    ],
  },

  // ─────────────────────────────────────────── Running the company
  {
    id: 'capabilities-leadership', track: 'Running the company', minutes: 4,
    audience: ['superadmin', 'leadership'],
    title: 'Everything you can do',
    blurb: 'Your powers, and the ones only you have.',
    steps: [
      { title: 'You see everything',
        body: 'Every client, campaign, creator, price and person. Nothing is hidden from you.' },
      { goto: '/work/today', title: 'Today',
        body: 'Your first screen: decisions with your name on them, then everything else moving.' },
      { goto: '/work/team', title: 'Your team',
        body: 'What each person has on, what is waiting on you, and what is late.' },
      { goto: '/work/goals', title: 'Goals',
        body: 'Set two numbers a month. Daily targets work themselves out from the open rounds.' },
      { title: 'Only you price creators',
        body: 'Nobody else can set a price or release someone into the database.' },
      { title: 'Only you write sourcing briefs',
        body: 'A logged client comes to you first. You say what to look for, then the team starts.' },
      { title: 'Only you make client links',
        body: 'Business development sends it, and is told the moment it exists.' },
      { title: 'Only you mark money paid',
        body: 'Anyone can record a payment. Only you say it has gone out.' },
      { title: 'Only you export',
        body: 'Spreadsheets of the creator database stop with the founders.' },
      { title: 'Only the superadmin deletes',
        body: 'Campaigns, proposals, creators, clients. Staff never get near it.' },
    ],
  },
  {
    id: 'inbox-approvals', track: 'Running the company', minutes: 3,
    audience: ['superadmin', 'leadership'],
    title: 'Your email alerts',
    blurb: 'What emails you, when, and how to change it.',
    steps: [
      { title: 'Urgent things email you at once',
        body: 'Money, a client waiting, something overdue, or an approval blocking someone.' },
      { title: 'Everything else waits',
        body: 'The rest arrive together at 8:30 and 5:30, as one email with one line each.' },
      { title: 'Why not send them all',
        body: 'Some days bring thirty. Nobody reads the ninth email, and then the alerts get muted.' },
      { title: 'Quiet day, no email',
        body: 'If nothing happened, nothing is sent. There is no "nothing to report" email.' },
      { goto: '/work/notifications', title: 'You decide',
        body: 'Every event here can be set to email you now, wait for the digest, or stay in the app.' },
      { title: 'Try it',
        body: 'Send me one now emails you the current digest, so you can see it before the team does.' },
    ],
  },
  {
    id: 'team-and-alerts', track: 'Running the company', minutes: 3,
    audience: ['superadmin', 'leadership'],
    title: 'Read the team',
    blurb: 'Who is moving, who is stuck.',
    steps: [
      { goto: '/work/team', title: 'Your people',
        body: 'A card each: this month, what is queued, what is late.' },
      { title: 'Pace is measured against the date',
        body: '40% on the 12th is fine. Behind only shows after several days off track.' },
      { title: 'Round due, nothing submitted',
        body: 'Usually an unclear brief or a thin category. Ask which before assuming effort.' },
      { title: 'Nobody added a creator in a week',
        body: 'Something else is eating the time. Find out what.' },
      { title: 'A client said no twice',
        body: 'That is the brief, not the sourcing. Go back to the client.' },
      { title: 'Security alerts stay private',
        body: 'Unusual reading and export attempts reach you and the co-founder only.' },
    ],
  },
  {
    id: 'staff-and-access', track: 'Running the company', minutes: 3, audience: ['superadmin'],
    title: 'Add someone and set their access',
    blurb: 'Roles, screens, and which clients they see.',
    steps: [
      { goto: '/work/users', title: 'Create the account',
        body: 'Three kinds: client, staff, admin. Staff is anyone who works here.' },
      { title: 'Pick their job',
        body: 'Talent manager, account manager, business development, co-founder. The job sets their screens.' },
      { goto: '/work/staff', title: 'Then set access',
        body: 'Which screens they open, and which clients they can see.' },
      { title: 'What nobody gets',
        body: 'Deleting things, and moving money. Those stay with the founders whatever else is ticked.' },
      { title: 'Some clients or all',
        body: 'An account manager sees their own. A co-founder sees everyone. Set here.' },
      { title: 'Work opens doors by itself',
        body: 'Give someone a sourcing round and that client opens for them automatically.' },
    ],
  },
  {
    id: 'office-wall', track: 'Running the company', minutes: 2, audience: ['superadmin', 'leadership'],
    title: 'Put the wall on the office TV',
    blurb: 'A screen anyone can watch.',
    steps: [
      { title: 'Make a display',
        body: 'Name it so you know which TV it is. You get a link back.' },
      { title: 'Open that link on the TV',
        body: 'No login needed. It changes slides and refreshes itself.' },
      { title: 'It never shows money',
        body: 'Deal values are not hidden from it, they are never sent to it. They cannot appear.' },
      { title: 'What it shows',
        body: 'Live campaigns, what is due, sourcing progress, and how the database is growing.' },
      { title: 'Turn it off any time',
        body: 'That kills the screen at once.' },
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
