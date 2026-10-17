/**
 * The role playbooks: what each person's job actually is, in business steps.
 *
 * WHY THIS EXISTS BESIDE THE SCREEN MANUAL. `/work/guide` answers "what is this screen for",
 * which is the question somebody has while looking at a screen. It does not answer "what am I
 * supposed to do all day", which is the question somebody has in their first week and again
 * every time the work changes. That answer was living in people's heads, in email threads and
 * in a set of PDFs that went stale the day they were exported.
 *
 * RULES FOR WRITING ONE
 *   - A step is a business step, not a click. "Agree the rate and write both numbers down" is
 *     a step. "Press Save" is not.
 *   - Plain words. Someone reading this started on Monday.
 *   - Name the screen in `where`, never inside the sentence, so a rename cannot make the
 *     sentence wrong.
 *   - `handover` says who picks the work up next. Most arguments here are about that line
 *     being unwritten, not about the steps.
 *   - Never name a person. Roles outlive staff.
 *   - `never` is for the rules that cost money or trust when broken. Keep it short enough to
 *     be read.
 */

export type RoleKey = 'talent' | 'account' | 'bd' | 'leadership'

export interface Job {
  title: string
  /** One line on when this job starts. */
  when?: string
  steps: string[]
  /** Who it goes to when you are done. */
  handover?: string
}

export interface Playbook {
  key: RoleKey
  /** What the role is called out loud. */
  label: string
  /** The job in one sentence. */
  oneLine: string
  /** The first three things, in order, every morning. */
  morning: { what: string; href: string; why: string }[]
  jobs: Job[]
  never: string[]
  /** The printable version, for a new joiner's first day. */
  pdf: string
  /**
   * A second printable version of the same playbook. Leadership is one job with two seats:
   * the co-founder's guide and the founder's guide cover the same work, and the founder's
   * also covers the things only a superadmin can do. One playbook, two handouts.
   */
  pdfAlt?: { label: string; href: string }
}

/** Which playbook a staff role reads. Leadership covers the co-founder and the CEO. */
export const PLAYBOOK_FOR: Record<string, RoleKey> = {
  talent_manager: 'talent',
  account_manager: 'account',
  business_development: 'bd',
  cofounder: 'leadership',
  ceo: 'leadership',
}

const MORNING_LEADERSHIP = [
  { what: 'Today', href: '/work/today',
    why: 'The four numbers, then what is waiting on you and what is running without you.' },
  { what: 'Decisions', href: '/work/inbox',
    why: 'Every approval anywhere in the platform, oldest first. A long list here means work has stopped, and this screen says where.' },
  { what: 'Pipeline', href: '/work/pipeline',
    why: 'Every creator across every brand with the next action on each. Red means late and nothing else.' },
]

export const PLAYBOOKS: Playbook[] = [
  {
    key: 'talent',
    label: 'Talent',
    oneLine:
      'You turn a brand’s request into real creators who have said yes, at a price we can sell, with signed paperwork and content that lands on time.',
    pdf: '/guides/talent-manager.pdf',
    morning: [
      { what: 'Today', href: '/work/today', why: 'Work waiting on you, oldest first.' },
      { what: 'Decisions', href: '/work/inbox', why: 'Anything needing an answer or a chase from you, pulled from every queue at once.' },
      { what: 'Pipeline', href: '/work/pipeline', why: 'Every creator you owe something, with the verb for each one. Work from this, not from memory.' },
    ],
    jobs: [
      {
        title: 'Source creators for a brand',
        when: 'A brief has arrived and the client needs a list to choose from.',
        steps: [
          'Read the brief and check it answers five things: market, category, budget per creator, deliverables, and paid or barter. If one is missing, ask before you source. Sourcing against a guess wastes a week.',
          'Work on the brand’s roster, not in a new spreadsheet. The roster is what the brand asked for, who we found, who they turned down, and which round we are on.',
          'Search the master database before you open Instagram. We already know hundreds of creators with prices on them.',
          'Add anyone new by handle. The platform pulls their followers, engagement and audience itself, so you never type those numbers in.',
          'Agree a price, and write down both numbers: their standard rate and what they actually agreed to. The agreed number is the one we use.',
          'Put the price on the creator. A creator with no sell price cannot be put on a quote at all, which is why the pending rates queue is the list of creators nobody can sell yet.',
          'Check your own list for the five things that get a list sent back: over budget, already used by this brand, weak engagement for the follower count, not actually in the market, or the same faces as last month.',
        ],
        handover: 'Leadership reviews the list for quality and budget before any client sees it. Expect removals. That is the point of the review.',
      },
      {
        title: 'Book the creators the client picked',
        steps: [
          'For an app campaign, share the application link. Creators apply in the app, so their details, address and bank details arrive without you collecting them by message.',
          'Approve or decline applicants on the campaign funnel. Spots are counted on approved creators, not applicants.',
          'For a paid campaign, move each creator along the delivery board: rate agreed, agreement on file, briefed, content in, approved, posted, paid.',
          'Give every row an owner. A list nobody owns is everybody’s, which means nobody’s.',
        ],
        handover: 'The account manager reads the same board, so you do not need to report progress separately.',
      },
      {
        title: 'Paperwork, products and vouchers',
        steps: [
          'Send agreements through the platform so the signed copy is stored against the creator. Do not keep signed PDFs in a mail folder.',
          'Never send a voucher or a product before the brand has confirmed in writing that you may. If you are not sure, you may not.',
          'If a creator pulls out after receiving the product, say so the same day and arrange collection, so the brand can pick a replacement.',
        ],
      },
      {
        title: 'Content and insights',
        steps: [
          'Chase the post on the day it was due, not a week later.',
          'Always write the edit note. "An edit is needed" with no note means the creator does not know what to change, and you will do the round twice.',
          'Collect each creator’s own insights screenshots and attach them to that creator. Brands open them from the creator in any quote.',
        ],
      },
      {
        title: 'Prepare a creator payment',
        steps: [
          'Keep every amount we owe a creator in payables, not in a spreadsheet.',
          'Leadership approves it. You raise it.',
          'Approved payables are paid in a payout run, which is where the bank file comes from. A line with no bank details on file cannot go into a run, and the screen says so per line.',
          'If a payment is sitting undecided, nudge it. It emails the person who decides, they can answer without logging in, and it tells you how many times they have already been asked.',
        ],
        handover: 'Leadership releases it. Never tell a creator a payment is approved before it is.',
      },
    ],
    never: [
      'Never show a brand our cost. You can see what we pay. The brand sees only what we charge.',
      'Never paste an internal rate sheet into a client email.',
      'Never promise a payment date you have not been given.',
      'Treat an export as a last resort: a spreadsheet takes phone numbers, addresses and bank details with it, and none of the platform’s rules travel with it.',
    ],
  },

  {
    key: 'account',
    label: 'Account management',
    oneLine:
      'The client should never have to ask what is happening, and the team should never have to ask what the client wants.',
    pdf: '/guides/account-manager.pdf',
    morning: [
      { what: 'Today', href: '/work/today', why: 'Work waiting on you, oldest first.' },
      { what: 'Decisions', href: '/work/inbox', why: 'Anything needing an answer from you, from anywhere in the platform.' },
      { what: 'Clients', href: '/work/clients', why: 'Open the ones with live campaigns and see where they are, before they email you.' },
    ],
    jobs: [
      {
        title: 'Take over a signed client',
        when: 'Business development has closed them.',
        steps: [
          'Get the handover in writing: what was sold, the budget, how many creators, deliverables per creator, markets, dates, payment terms, and the client’s contact. If one is missing, ask before you promise a date.',
          'Check the client exists in the platform. A client who is only in your inbox is a client nobody else can help with.',
          'Introduce yourself to the client as their point of contact, with what happens next and when.',
          'Open one campaign per thing the client bought. Do not run two pieces of work on one campaign because it is already open.',
        ],
      },
      {
        title: 'Brief the team',
        when: 'The campaign is open and the client has told you what they want.',
        steps: [
          'A brief is not complete until it answers nine things: name and client, timeline and the last date a post may go live, objective and main message, exact deliverables per creator, what the creator receives, market, budget per creator and how many, content rules including tags and whether the client approves before posting, and whether it covers paid, barter, or both.',
          'Write the brief into the campaign, not only into an email. The brief then travels with the campaign and everyone reads the same words.',
          'Answer the team’s questions in the same place. A question answered in a private message gets asked again.',
        ],
        handover: 'Talent see it on their Today. You do not need to forward it.',
      },
      {
        title: 'Get the client to choose creators',
        steps: [
          'Talent source onto the brand’s roster, and leadership reviews the list before the client sees it.',
          'Send a quote or a share link, never a spreadsheet. The client picks inside it and their picks come straight back to you.',
          'Check anything client-facing for internal information. Costs, margins and internal notes are never on something a client can open. The platform hides them. A spreadsheet does not.',
          'When the client confirms, lock it. That is what opens the campaign properly and stops the list drifting.',
        ],
      },
      {
        title: 'Run the campaign',
        steps: [
          'Read the delivery board daily. It shows each creator and the one step they are on.',
          'If the client approves content before posting, send it through the platform and record their answer there. An approval that lives in an email thread is an approval nobody can find.',
          'When a creator drops out, tell the client the same day, with what you are doing about it. Clients forgive a replacement. They do not forgive finding out late.',
          'Use chasing instead of remembering who owes us something.',
          'If something is stuck on somebody else’s decision, nudge it rather than waiting.',
        ],
      },
      {
        title: 'Report to the client',
        steps: [
          'Generate the report from the campaign. Do not rebuild it by hand.',
          'Report per creator what they posted, when, and their own insights where we have them.',
          'Never invent a number. A dash means we do not know. A zero means measured and nothing happened, so a zero in place of a dash is a lie.',
          'Send a status update on the schedule the client agreed to, not only when they chase.',
        ],
      },
      {
        title: 'Money, your half',
        steps: [
          'Tell leadership when a stage is complete so the invoice can go out.',
          'Chase the purchase order early. It is the most common reason a signed deal cannot be invoiced.',
          'Chase payment before it is overdue. A note two days before the due date collects more than three after it.',
          'Creator payments are not yours to approve or promise. Point creators at talent, or say it is with leadership.',
        ],
      },
    ],
    never: [
      'Never show a client our cost. You see sell prices, and that is deliberate.',
      'Never send a client a sheet nobody has read.',
      'Never give a date without opening the board first. A date you give a client is a promise from the whole company.',
    ],
  },

  {
    key: 'bd',
    label: 'Business development',
    oneLine:
      'You turn an enquiry into a signed brand with clear terms, and you hand it over so cleanly that nobody has to ask you what was promised.',
    pdf: '/guides/business-development.pdf',
    morning: [
      { what: 'Today', href: '/work/today', why: 'What is waiting on you.' },
      { what: 'Partner leads', href: '/work/partners', why: 'Every enquiry from the website or the brief form. Nothing should sit here unanswered overnight.' },
      { what: 'Brands', href: '/work/brands', why: 'Every brand you are talking to that is not a client yet.' },
    ],
    jobs: [
      {
        title: 'Handle a new enquiry',
        steps: [
          'Reply the same day, with one specific next step: a fifteen minute introduction call, and offer two times.',
          'Log the brand. A logged brand is not a client yet, and that is fine. It becomes a client when an account is created, they pay, or they are sent a quote.',
          'Qualify on the call, and get six things while you can: what they sell and who they want to reach, budget or a range, paid or barter or both, markets, timing and what is driving it, and who signs and who pays.',
          'Write the call up the same day on the brand record. Three lines is enough. A meeting nobody wrote up did not happen.',
        ],
      },
      {
        title: 'Turn interest into a signed deal',
        steps: [
          'Agree the commercial shape in your own words before you send any document, so nothing in the contract is a surprise.',
          'Ask talent for a sample list if the brand wants to see creators first, and brief them properly: market, category, budget per creator, deliverables, paid or barter. A vague ask comes back as a vague list.',
          'Send a sample pack or a priced quote from the platform. Never a spreadsheet you built yourself, because the platform’s version hides our costs and yours does not.',
          'Get the agreement signed, and chase the purchase order early if the client needs one before they can pay.',
          'Confirm payment terms in writing: how much up front, how much on completion, and in how many days.',
        ],
      },
      {
        title: 'Hand the client over',
        when: 'The moment it is signed. This is the step that matters most.',
        steps: [
          'Introduce the account manager to the client by email and say plainly that they are now the day to day contact. Stay on the thread, do not run it.',
          'Hand over in writing: what was sold in deliverables and creator numbers, the money and the terms, what is invoiced and what is received, markets and dates, the client’s contacts and who approves what.',
          'List anything you promised that is not in the contract. All of it. This is the part that burns people.',
          'Make sure the client exists in the platform, so the account manager has somewhere to run it.',
          'After handover, bring new requests to the account manager. Do not accept new scope directly.',
        ],
        handover: 'The account manager owns the client from here.',
      },
      {
        title: 'Pass on a client brief',
        steps: [
          'Check it answers eight things before you forward it: timeline and the last live date, objective and main message, exact deliverables, what the creator receives, market, content rules and tags, whether the client approves before posting, and whether it covers paid, barter or both.',
          'Go back to the client for anything missing. Guessing on a client’s behalf is how a campaign gets re-shot.',
          'Put it into the campaign in the platform, then tell the account manager it is there.',
        ],
      },
      {
        title: 'Products, vouchers and samples',
        steps: [
          'When a client sends vouchers or products, confirm in writing that we may distribute them before anybody sends one. If the agreement is still being signed, the answer is wait.',
          'Record what was received and for which campaign. A box of vouchers nobody logged is a box nobody can account for.',
        ],
      },
    ],
    never: [
      'Never show a brand our cost. Not in a sheet, not in a screenshot, not to show them the maths.',
      'Never promise creator numbers or dates the team has not confirmed.',
      'Never discount on the spot. Any change to agreed pricing goes to leadership first.',
      'Never leave a lead without a next step. Either a date, or a written reason it was dropped.',
    ],
  },

  {
    key: 'leadership',
    label: 'Leadership',
    oneLine:
      'Nothing weak reaches a client, nothing overpriced gets agreed, and nothing leaves the bank without you.',
    pdf: '/guides/co-founder.pdf',
    pdfAlt: { label: 'Founder and CEO', href: '/guides/founder-ceo.pdf' },
    morning: MORNING_LEADERSHIP,
    jobs: [
      {
        title: 'Approve a creator list',
        when: 'Talent have sourced, and before any client sees it. This is the biggest lever you have.',
        steps: [
          'Check budget first. A creator who charges twenty thousand on a five thousand brief does not belong on the list however good they are.',
          'Check the market. Where the creator actually lives, not what the bio says. This has gone wrong before.',
          'Check quality: engagement against follower count. A large account with weak engagement is worse than a small one with strong engagement.',
          'Check repetition. Has this brand used this creator recently, or has this creator appeared on three other campaigns this month? Clients notice.',
          'Check fit, and check depth per market, so one market is not carrying three names.',
          'Remove what fails and say which one failed and why, in one line each. "Based in Florida, not UAE" teaches. "Not suitable" does not.',
          'Where a rate is too high, say the number you will pay. "Offer max 1,000" ends it in one message.',
          'If the list is thin, say how many more and by when. A review without a deadline is read as optional.',
        ],
        handover: 'Approving is what releases the list to the client.',
      },
      {
        title: 'Release money',
        when: 'Talent have raised it. Only leadership can release it.',
        steps: [
          'Check three things before approving: the amount matches what was agreed, the work was actually delivered, and we hold bank details. The screen tells you the third.',
          'Above AED 25,000 the platform asks you to type the amount. That is deliberate, not a glitch.',
          'Read a payout run before you act on it. Reading creates nothing; acting raises the invoices behind it.',
          'Refuse an amount that does not match the agreed rate with no explanation, a payment for content never posted or since deleted, and a creator we hold no bank details for. Approving that one only moves the problem.',
          'Confirm the receipts went back to the creators after payment.',
        ],
      },
      {
        title: 'Answer from your email',
        steps: [
          'A money decision or a rate confirmation arrives as an email with the amount, the creator and the campaign, and two buttons. You can decide without logging in.',
          'The link lasts seven days and works once. A nudge sends a fresh link and stops the old one working.',
        ],
      },
      {
        title: 'Hold the team to output',
        steps: [
          'Pipeline shows anything late in red, and who owns it. A row with no owner is the real problem, not the delay.',
          'Pending rates is every creator nobody can sell yet. If it is growing, sourcing is running ahead of pricing and the sales team has nothing to sell.',
          'Coverage shows clients with nothing moving. A quiet client is a client about to leave.',
          'When you ask for something, put a date on it and a number in it. "More influencers" gets you two. "Seven more in Bahrain by Thursday" gets you seven.',
        ],
      },
      {
        title: 'Watch the commercials',
        steps: [
          'Quotes show what we charge, what it costs us and the margin. You and talent are the only people who see the cost side.',
          'A quote with a margin that looks wrong usually means a creator’s cost is wrong in the database, not that the quote is broken. Check the creator.',
          'A quote freezes its prices on purpose, so a client never sees a price change. That also means a rate card can drift from what was last negotiated.',
          'Any discount or change to agreed pricing comes to you. Nobody else gives one.',
        ],
      },
    ],
    never: [
      'Cost never reaches a client. The platform hides it; an export does not, which is why a roster export now asks you to confirm.',
      'No money moves without leadership.',
      'No voucher or product goes to a creator before the client has confirmed in writing.',
      'A screen that failed to load is not an all clear. "Nothing is late" and "we could not read your queue" are different sentences, and the platform says which one it means.',
    ],
  },
]

export function playbookFor(staffRole: string | null, isSuperAdmin: boolean): Playbook | null {
  if (isSuperAdmin) return PLAYBOOKS.find(p => p.key === 'leadership') ?? null
  const key = staffRole ? PLAYBOOK_FOR[staffRole] : undefined
  return key ? PLAYBOOKS.find(p => p.key === key) ?? null : null
}
