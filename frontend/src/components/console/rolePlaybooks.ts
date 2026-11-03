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

/*
 * ONE RULE THAT CROSSES EVERY PLAYBOOK. The BRAND writes and sends the brief: on a first
 * campaign to business development, after that to business development or the account
 * manager. Whoever receives it forwards it to the Founder & CEO (the superadmin), who sets it
 * up on the platform, and only the Founder & CEO sends a proposal or a quote to a client.
 * Account management, business development, talent and the co-founder never set a brief up
 * and never send a proposal or a quote.
 */
export type RoleKey = 'talent' | 'account' | 'bd' | 'leadership'

export interface Job {
  title: string
  /** One line on when this job starts. */
  when?: string
  steps: string[]
  /** Who it goes to when you are done. */
  handover?: string
  /**
   * Talent and leadership only (ScoutOutreach, ScoutAI, enrolments). Hidden from account
   * management and business development even inside the other-roles accordion, because
   * those tools are not theirs to work. See `seesTalentChapters`.
   */
  restricted?: boolean
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
          'Work on the brand’s roster. It is your sheet: handle, price, last time, state, notes. Do not start a new spreadsheet, and do not email one.',
          'Search the master database before you open Instagram. We already know hundreds of creators with prices on them, and the old master sheet now lives there too, every price kept with its date.',
          'Paste a list straight from a sheet, or one handle per line. Prices are read as you wrote them, "Standard: 2000 QAR Negotiated: 1000 QAR" included. Anyone new goes to the waiting room without running analytics.',
          'Every row says its next step and carries one button for it: "Needs a rate" (Add rate), "Rate in, send for review" (Send for review), "Ready" (Add to proposal), "Client picked" (Book). Skip means not for this campaign, and the "…" menu holds everything else.',
          'Record both numbers on the row: what they asked and what you agreed, in their currency, and what it buys (a reel, a reel also on TikTok, full scope). The platform works out the AED.',
          'Check "Last time" before you agree. If they are asking well above what they agreed with us before, the row tells you.',
          'Keep inside the budget per creator on the brief. A price above it turns amber as you type it.',
          'Send the good ones for review. That tells the founders "these are good, please price them" and it appears on their Today. Do not email the list.',
          'Skip the rest, with a reason if you have one. They stay in the database, and the reason follows them to the next brief.',
        ],
        handover: 'A founder presses Price on the ones you sent, or sends some back with a note that shows on your row and on your Today. A priced creator comes back onto the roster as Ready, and goes onto the proposal from there. Only the Founder & CEO sends the proposal to the client.',
      },
      {
        title: 'Work alongside ScoutOutreach and ScoutAI',
        when: 'Every roster with outreach running. It is explained in full in its own chapter below.',
        restricted: true,
        steps: [
          'Keep sourcing your own creators. ScoutOutreach adds to your roster, it does not replace you.',
          'Glance at the live bar on ScoutOutreach: DMs sent today and the job it is on now.',
          '"ScoutOutreach asked for their rate" and "ScoutAI is getting their rate" need nothing from you. The rate lands on the row by itself.',
          'Say yes or no on the creators it finds. Your decisions teach its screening on that campaign.',
          'If ScoutOutreach says the bot is stopped and needs a person, sign in to Instagram on the bot PC and press Resume.',
        ],
        handover: 'Creators with a rate are sent for review like any other. A founder prices them.',
      },
      {
        title: 'Work an open call on WhatsApp',
        when: 'A superadmin has put an open call live on the brand’s roster.',
        restricted: true,
        steps: [
          'Press "Copy a DM with my link" and send it to creators on Instagram. Everyone who answers through your link is credited to you.',
          'ScoutAI, on the marketing number, explains the brief, asks the screening questions and their rate, and can counter within the rules set for that campaign. You do not chase them for it.',
          'Whoever answers lands on the roster with a quote, shown as "ScoutAI (WhatsApp)". Send the good ones for review as usual.',
          '"Yours now" means ScoutAI stepped back: the price is above the ceiling, or the creator is big enough that a person should talk to them. Open Conversations, reply, then "Hand back to the agent".',
          'You can only reply within 24 hours of the creator’s last message. That is WhatsApp’s rule, not ours.',
        ],
      },
      {
        title: 'Send the enrolment link',
        when: 'A founder has created an enrolment for a booked creator. You are told on the bell and by email.',
        restricted: true,
        steps: [
          'The bell and the email both say "Send @creator their enrolment link", with the link inside.',
          'Send it to the creator on WhatsApp the same day. A link is personal: never post it anywhere public.',
          'The creator verifies their email, gives their details and address, signs, uploads their passport and gives their bank details.',
          'Chase anybody who has not finished. Campaigns, then Enrolments, shows who is where.',
          'If a passport is sent back, tell the creator. Their passport step is open again and they will not know otherwise.',
        ],
        handover: 'Once signed, payments move to Payables and Payout runs. Only founders release money.',
      },
      {
        title: 'Give creators their links',
        when: 'A campaign tracks clicks and sales, and its retailers are set up.',
        steps: [
          'Open the campaign, then Links. Every creator on the roster has a short link per retailer.',
          'Press "Copy all links" and send each creator only their own. A shared link credits nobody.',
        ],
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
        title: 'Receive the brand’s brief and forward it',
        when: 'The brand writes and sends the brief. After their first campaign it may come to you.',
        steps: [
          'Receive the brand’s brief and forward it to the Founder & CEO, who sets it up on the platform.',
          'Chase the brand for anything missing. A complete brief covers: name and client, timeline and the last date a post may go live, objective and main message, exact deliverables per creator, what the creator receives, market, budget per creator and how many, content rules including tags and whether the client approves before posting, and whether it covers paid, barter, or both.',
          'Never rewrite it or set it up yourself. The brand’s words go to the Founder & CEO as they were sent.',
          'Once the brief is on the campaign, answer the team’s questions there. A question answered in a private message gets asked again.',
        ],
        handover: 'The Founder & CEO sets the brief up on the platform. Talent see it on their Today.',
      },
      {
        title: 'Get the client to choose creators',
        steps: [
          'Talent source onto the brand’s roster, and leadership reviews the list before the client sees it.',
          'Only the Founder & CEO sends the proposal, quote or share link. You never send one, from the platform or from your own inbox, and never a spreadsheet.',
          'The client picks inside it and their picks come straight back. You see them without asking.',
          'If the client tells you their choice instead of picking, pass it to the Founder & CEO, who confirms it for them.',
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
          'Log the brand. A logged brand is not a client yet, and that is fine. It becomes a client when an account is created, they pay, or the Founder & CEO sends them a quote.',
          'Qualify on the call, and get six things while you can: what they sell and who they want to reach, budget or a range, paid or barter or both, markets, timing and what is driving it, and who signs and who pays.',
          'Write the call up the same day on the brand record. Three lines is enough. A meeting nobody wrote up did not happen.',
        ],
      },
      {
        title: 'Turn interest into a signed deal',
        steps: [
          'Agree the commercial shape in your own words before you send any document, so nothing in the contract is a surprise.',
          'If the brand wants to see creators first, ask them for their brief: market, category, budget per creator, deliverables, paid or barter. Receive it and forward it to the Founder & CEO, who sets it up and releases it to talent. A vague ask comes back as a vague list.',
          'Sample packs and priced quotes go to the client from the Founder & CEO only. Never send one yourself, and never a spreadsheet you built, because the platform’s version hides our costs and yours does not.',
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
        title: 'Receive the brand’s brief and forward it',
        when: 'The brand writes and sends the brief. On a first campaign it always comes to you.',
        steps: [
          'Receive the brand’s brief and forward it to the Founder & CEO, who sets it up on the platform.',
          'Chase the brand for anything missing: timeline and the last live date, objective and main message, exact deliverables, what the creator receives, market, content rules and tags, whether the client approves before posting, and whether it covers paid, barter or both.',
          'Never fill a gap with a guess. Guessing on a client’s behalf is how a campaign gets re-shot.',
          'Tell the account manager you have forwarded it.',
        ],
        handover: 'The Founder & CEO sets the brief up on the platform.',
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
          'Do it on the roster, not by email: rows "Waiting for a founder to price" carry a Price button. Select the rows and "Send back" with your note, or price the ones that pass. Each sell price is for what that creator’s quote covers, and the margin shows as you type.',
          'A priced creator goes back onto their roster as Ready, and the confirmation says so with an Open roster button.',
          'Every brief carries a budget per creator before sourcing starts. It is what stops a list being built at the wrong price.',
        ],
        handover: 'Cleared creators go onto a proposal from the roster, with anyone who cannot go on named and the reason shown before you press add.',
      },
      {
        title: 'Set up the brief and send the proposal',
        when: 'Only the Founder & CEO, the superadmin, does this. The co-founder, account management, business development and talent never do.',
        steps: [
          'The brand writes the brief. Business development or the account manager receives it and forwards it to you.',
          'Set it up on the platform: market, category, budget per creator, deliverables, paid or barter, dates and content rules. Anything missing goes back to whoever forwarded it, to chase the brand.',
          'Press Ask talent with the brief on it. Talent see it on their Today with the roster open.',
          'Send every proposal, quote, sample pack and share link to the client yourself. Nobody else sends one, from the platform or from their own inbox.',
          'If a client gives their choice to somebody else, use Confirm for the client.',
        ],
        handover: 'The client picks inside the proposal, and their picks come back to the roster.',
      },
      {
        title: 'Put an open call live',
        when: 'A roster needs more creators than talent can message one by one.',
        steps: [
          'On the brand’s roster, "Create an open call". Describe the brand and never name it. The target per creator and the ceiling are for the agent only and are never shown to a creator.',
          '"Make it live". Talent then send their own links; you can also copy the story link, invite app creators, or invite on WhatsApp.',
          'When the client has chosen, press "Tell creators how it went", so nobody is left waiting.',
          'Invites and outcomes start a WhatsApp conversation, so they only go out once Meta has approved the message.',
        ],
      },
      {
        title: 'Point ScoutOutreach at a brief',
        when: 'A roster is open and the client needs more creators than talent can reach by hand.',
        restricted: true,
        steps: [
          'ScoutOutreach works per roster. Open the campaign on ScoutOutreach and set "Who fits": location, follower range and language. The brief does the rest.',
          'It checks every 10 minutes and plans its own searches when a campaign’s DM queue is under 60: at most once every 3 hours per campaign, 6 a day across all campaigns, and 12 per campaign in total, then it stops and says so. It does not search while every DM account is resting.',
          'Say yes or no on what it finds. The screening follows the team’s decisions on that campaign.',
          'Creators it reaches land on the roster with a rate. Price them like any other.',
          'If the bot is stopped because Instagram logged it out or asked for a check, somebody signs in on the bot PC and presses Resume.',
        ],
      },
      {
        title: 'Set up an enrolment',
        when: 'A client has confirmed creators on a proposal. Only the superadmin can do this.',
        restricted: true,
        steps: [
          'Settle each confirmed creator’s real cost on the proposal. That is the only thing a link waits for.',
          'Create the link: "Send link" on the proposal’s panel, or from Campaigns, then Enrolments.',
          'Talent is told on the bell and by email, with the link, and sends it to the creator on WhatsApp.',
          'A payee confirms itself when the bank account is in the creator’s own signed name, a passport is uploaded and it is not a company account. Otherwise you confirm it, with the reason shown.',
          'A passport the system could not match comes to you: "Looks right", or "Send back" to reopen the creator’s passport step.',
        ],
        handover: 'Signed creators flow into Payables and Payout runs, where you release the money.',
      },
      {
        title: 'Run Following Track on a campaign',
        when: 'The brand wants clicks and sales per creator.',
        steps: [
          'Open the campaign, then Links. Add the retailers the links send people to; every creator gets a link for each.',
          'Send the brand the store pixel (Shopify custom pixel, or the pixel for any website). Carts, checkouts and orders then arrive by themselves.',
          'Sales from a retailer’s own report: add one, or import a spreadsheet. Brand discount codes go under Brand’s codes so each sale is credited to the right creator.',
          'Nothing reaches the brand until you turn on "Show the brand". Affiliate links in the sidebar shows every campaign’s links at once.',
        ],
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
          '"Price N shortlisted creators" on Today is every creator talent sent for review that nobody can sell yet. If it is growing, sourcing is running ahead of pricing and the sales team has nothing to sell.',
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
