/**
 * The Client Operations SOP (FOL-OPS-SOP-001, v1.5, 16 November 2026), as data.
 *
 * This is the founder's own document, carried into the team manual so the way we work and
 * the screens we work on are ONE book. Times and rules are his words. What this file adds is
 * the WHERE: the screen each handoff lands on, so a rule is never just a rule.
 *
 * Seat names are the SOP's own: CEO, Head of Talent, BDM, AM, TM. The role manuals that
 * follow use the same desk names, so "AM" here is "Account Management" there.
 */

export const SOP = {
  doc: 'FOL-OPS-SOP-001', version: '1.5', effective: '16 November 2026',
};

export const SEATS = [
  { ab: 'CEO', nm: 'CEO', man: 'The Founder & CEO manual', own: '**Client, quality, money.** Sends every proposal and quote. Raises and records invoices. Level 2 for clients.' },
  { ab: 'HT', nm: 'Head of Talent', man: 'The Co-Founder manual', own: '**Creator escalations.** Prices rosters, gives each campaign to a talent manager, releases money. Level 2 for creators.' },
  { ab: 'BDM', nm: 'Business Development', man: 'The Business Development manual', own: '**Agreements and scope changes.** Brings the brand in, hands over in writing, explains barter against paid at kickoff.' },
  { ab: 'AM', nm: 'Account Manager', man: 'The Account Management manual', own: '**Timelines, quality, reports.** The only person who talks to the client. One per client. Logs every ask as a Request.' },
  { ab: 'TM', nm: 'Talent Manager', man: 'The Talent manual', own: '**Creators, contracts, drafts.** Sources and prices, sends enrolment links, chases content, prepares payments.' },
  { ab: 'C', nm: 'Client', man: 'Pages C1 and C2 of the SOP', own: '**One named approver.** Confirms the list once, inside the proposal. One round of feedback per draft.', client: true },
];

/* What moves between seats, when, and the screen it lands on. */
export const HANDOFFS = [
  ['Handover note', 'Scope, budget, dates, payment terms, brand rules, handles.', 'BDM', 'AM, TM', 'Day of signing', ['Clients', 'Brands', 'Open the brand']],
  ['Full brief', 'With the creator requirements. The brand writes it; the CEO sets it up and presses Ask talent.', 'AM', 'CEO, then TM', '2 hours', ['Clients', 'Sales', 'Ask talent']],
  ['Shortlist ready', 'Priced on the roster and sent up. The CEO sends it to the client as a proposal.', 'TM', 'CEO', 'Page 07', ['Creators', 'Rosters', 'Send for review']],
  ['Client confirmed the list', 'The client confirms inside the proposal. The platform tells everyone; nobody forwards an email.', 'Platform', 'AM, TM, BDM', '1 hour', ['Clients', 'Quotes']],
  ['Creator details, drafts, risks', 'Every creator on their rung, every draft on the campaign.', 'TM', 'AM', '1 hour', ['Campaigns', 'Open a campaign', 'Delivery']],
  ['Scope, rate or deliverable change', 'Asked for by the client. Raised as a Request the same day, whoever heard it.', 'AM', 'BDM', 'Same day', ['Requests', 'Raise one']],
  ['Payment status', 'Post, or hold. Only the CEO raises and records invoices.', 'CEO', 'AM', 'Every Monday', ['Campaigns', 'Open a campaign', 'Money']],
];

export const URGENT = {
  question: 'Will a visit or a post suffer if this waits until 09:00 tomorrow?',
  yes: { hd: 'Urgent', do: 'Drop planned work. Reply in 15 to 30 minutes.', eg: [
    'A creator is at the store and something is wrong',
    'A mistake on a post that is live',
    'Tomorrow’s post or visit is blocked',
    'A creator is unreachable on a live day',
    'Wrong claim, wrong product, bad comments',
  ]},
  no: { hd: 'Not urgent', do: 'Reply in 15 minutes with a time. Deliver within our times.', eg: [
    'A new shortlist or more options',
    'Scripts, changes, new ideas',
    'Reports, insights, screenshots',
    'Changes to next week’s plan',
    'Invoices and payments, by email',
  ]},
  log: 'Every client request is raised on the platform as a **Request** the same day, whoever answers it. Answer the client first, as a person. Then log it, so somebody owns it and a date exists.',
};

export const HOURS = [
  ['Live', 'A creator at the store, a post going live, an error on a live post', '30 min', '30 min', 'Agreed launches only'],
  ['Urgent', 'Tomorrow’s visit or post is blocked', '15 min', '1 hour', 'By 09:00'],
  ['Planned', 'Shortlists, scripts, reports', '15 min', 'Next day, 12:00', 'Next working day'],
  ['Money', 'Invoices, payments, rates, agreements', 'Same day', 'Next working day', 'Next working day'],
];

export const COVER = {
  days: [
    ['Mon', ['office', 'call'], ''], ['Tue', ['office', 'call'], ''], ['Wed', ['office', 'call'], ''],
    ['Thu', ['office', 'call'], 'Rota posted'], ['Fri', ['office', 'call'], '16:00 handover'],
    ['Sat', ['weekend'], ''], ['Sun', ['weekend'], ''],
  ],
  oncall: [
    'Covers every client. Checks all groups: weekdays 19:00 and 21:30; weekends 10:00, 14:00, 18:00, 21:30.',
    'Handles live and urgent. Planned work gets a time, and is delivered the next working day by 12:00.',
    'Logs after-hours work on the platform the next morning: the rung moved, the Request raised.',
  ],
  friday: [
    'Weekend visits and posts, with contacts.',
    'Approvals in hand and pending, read off each campaign’s Content tab.',
    'Vouchers confirmed at branches.',
    'Creators at risk, with backups, read off Chasing.',
  ],
  everyone: [
    'No replies expected after 17:00 or at weekends.',
    'A talent manager takes calls only for their own creators’ visits.',
    'After-hours work is logged the next morning.',
  ],
};

/* Eight stages. `client` marks a time that is the client's, drawn outlined. */
export const STAGES = [
  { n: 1, t: '2 hours', wt: 'Brief', who: 'AM', x: 'The client sends the brief. The AM checks it is complete, then forwards it to the CEO.', chk: 'Check 1: brief complete before outreach.', path: ['Clients', 'Sales'] },
  { n: 2, t: '24 hours', wt: 'Shortlist', who: 'TM, CEO', x: 'The TM sources and prices creators on the roster. The CEO sends the proposal.', path: ['Creators', 'Rosters'] },
  { n: 3, t: '24 hours', client: true, wt: 'Selection', who: 'Client', x: 'The client confirms the full list once, inside the proposal.', chk: 'Check 2: list confirmed and agreement signed.', path: ['Clients', 'Quotes'] },
  { n: 4, t: 'Same day', wt: 'Contracts', who: 'TM, CEO', x: 'The TM sends each creator their enrolment link. The CEO sends the invoice.', path: ['Campaigns', 'Enrolments'] },
  { n: 5, t: '24 hours', client: true, wt: 'Logistics', who: 'Client, TM', x: 'The client ships products or confirms visits. The TM gets creator details.', path: ['Campaigns', 'Open a campaign', 'Delivery'] },
  { n: 6, t: '3 days', wt: 'Production', who: 'TM, AM', x: 'Scripts and shoot. The AM checks quality before the client sees anything.', chk: 'Check 3: our quality check before the client sees it.', path: ['Campaigns', 'Open a campaign', 'Content'] },
  { n: 7, t: '24 hours', client: true, wt: 'Approval', who: 'Client', x: 'One round of feedback from one named person, inside the platform.', chk: 'Check 4: written go-ahead and posting date.', path: ['Campaigns', 'Open a campaign', 'Content'] },
  { n: 8, t: 'Client date', wt: 'Live', who: 'AM', x: 'The link goes on the creator’s row and in the group within 1 hour. Results at 48 hours.', path: ['Campaigns', 'Open a campaign', 'Performance'] },
];

export const TAT = {
  setup: [
    ['Reply with a time', 'AM', '15 min'],
    ['Live issue', 'AM', '30 min'],
    ['Profile, insights, address', 'AM, TM', '2 hours'],
    ['Express shortlist, 6 creators', 'TM', '4 hours'],
    ['Shortlist, 10 creators', 'TM', '24 hours'],
    ['Bigger or multi-market', 'TM', '48 hours'],
    ['Contracts and invoice', 'TM, CEO', 'Same day'],
    ['Creator details', 'TM', '24 hours'],
    ['Month plan', 'AM', '48 hours'],
  ],
  content: [
    ['Drop-out: tell the client', 'AM', '2 hours'],
    ['New options or replacements', 'TM', 'Same day'],
    ['Script or revision', 'TM', '24 hours'],
    ['First video', 'TM', '3 days'],
    ['Store-visit stories', 'TM', '2 hours'],
    ['Fix a live post', 'AM', '2 hours'],
    ['Post link, on the platform and in the group', 'AM', '1 hour'],
    ['48-hour results', 'AM', 'Same day'],
    ['Weekly update', 'AM', 'Mon 12:00'],
  ],
  client: [
    ['Complete brief, as on page C1', 'Before we start'],
    ['Brief changed after we start', 'Dates restart'],
    ['Next month’s calendar', 'By the 20th'],
    ['Choose creators', '24 hours'],
    ['Confirm the full list', 'Once'],
    ['Confirm visit branch and time', 'Same day'],
    ['Ship products, with tracking', '24 hours'],
    ['Approve scripts', 'Same day'],
    ['Approve videos', '24 hours'],
    ['Agreement, PO and documents', '48 hours'],
  ],
  fastest: [['Barter stories', 4], ['Store-visit videos', 7], ['Shipped videos', 10]],
};

export const CALENDAR = {
  marks: { 15: 'Reminder', 20: 'Calendar due', 22: 'Month plan sent', 32: 'Live' },
  sends: [
    'Each campaign, offer and goal',
    'Start, end and posting dates',
    'Branches, with allowed days and hours',
    'Products, vouchers or menu items',
    'Barter or paid, and the number of creators',
    'Deliverables, key messages, handles',
  ],
  outside: [
    ['Enough notice, as on page 08', 'Accepted'],
    ['Less notice', 'Options in 15 minutes'],
    ['Date or offer change, 3 or more working days out', 'Accepted'],
    ['Change inside 3 working days', 'Dates may move'],
  ],
};

export const VISITS = {
  must: [
    ['Allowed branches, days and hours, and any blackout times', 'Client'],
    ['Branch inside the allowed area before the plan goes out', 'AM'],
    ['On the evening of the visit, a short summary of the day', 'On-call AM'],
  ],
  // [when, Following, Client]
  steps: [
    ['48 hrs before', ['AM', 'Visit plan: creator, branch, time.'], ['Same day', 'Confirms. No reply means the plan stands.']],
    ['24 hrs before', ['TM, AM', 'Creator on track, recorded on the campaign.'], ['', 'Branch ready: staff told, vouchers or products in place.']],
    ['Visit day', ['TM', 'Issues raised within 30 minutes.'], ['', '']],
    ['2 hrs', ['TM', 'Stories to the client.'], ['', 'Approves stories.']],
    ['3 days', ['TM, AM', 'Video draft, quality-checked on the Content tab.'], ['24 hrs', 'Approves the video.']],
    ['Posting', ['AM', 'Link in 1 hour, on the creator’s row. Results at 48 hours.'], ['', '']],
  ],
};

export const APPROVALS = {
  chain: [['Draft', 'TM, 3 days'], ['Quality check', 'AM, before the client'], ['Client review', '24 hours'],
          ['Approved', 'In writing'], ['Go-ahead', 'Date and time set'], ['Live', 'Link in 1 hour']],
  rules: [
    'Scripts approved the same day, videos within 24 hours.',
    'One message of feedback per draft, from one named person.',
    'Posting time shared with the client a day ahead.',
    'Mistakes on a live post fixed within 2 hours, any day.',
    'Changes: paid gets 2 rounds, barter gets small edits.',
  ],
  newRequest: [
    'New shots, products or messages after script approval.',
    'Feedback after a draft is approved.',
    'A second person’s comments after sign-off.',
    'Each gets a new time, and may cost a creator fee.',
  ],
  where: 'The draft lives on the campaign’s **Content** tab. **Send for review** puts it in front of the client, who answers inside the platform. Their yes moves the creator’s rung on **Delivery** by itself.',
};

export const BARTER = [
  ['Creators are paid in', 'Products or vouchers', 'A fee, at a blended rate'],
  ['How creators are found', 'They apply', 'Hand-picked by talent, priced and sent by the CEO'],
  ['Nationality, language, niche', 'Natural mix, not guaranteed', 'Can be specified'],
  ['Followers', 'As per the package', 'As per the package'],
  ['Changes to content', 'Small edits only', '2 rounds'],
  ['Analytics', 'Light', 'Detailed'],
  ['Proof of creator payment', 'Not applicable', 'On request'],
];

export const ESCALATION = {
  levels: [
    { n: 'Level 1', w: 'Account team', x: 'Led by the AM. Every request.', t: 'Our times' },
    { n: 'Level 2', w: 'CEO or Head of Talent', x: 'A time will be missed, the client has chased twice, or a quality complaint. CEO for clients, Head of Talent for creators.', t: '1 hour' },
    { n: 'Level 3', w: 'CEO and Head of Talent', x: 'Cancellation, contract or payment dispute.', t: '4 hours' },
  ],
  quiet: [
    ['0', 'hours', 'Task due', 'Brief and deadline sent. The row on Chasing starts counting.'],
    ['4', 'hours', 'TM calls', 'Call and message, logged on the creator’s row.'],
    ['24', 'hours', 'Head of Talent', 'Contacts the creator. The AM tells the client.'],
    ['48', 'hours', 'Replace', 'Two options to the client the same day, from the roster.'],
  ],
};

export const WRITING = [
  ['Give a time, not “shortly”', '“Six profiles by 15:00 today.”'],
  ['Late? Say so before the time passes', 'New time, one line on why.'],
  ['“Noted” is not a reply', 'Say what happens next, and when.'],
  ['Money and contracts by email', 'Never in the client group.'],
  ['Tight deadline? Reply in 15 minutes', 'The fastest option and what it needs.'],
  ['Creators talk to us, not the client', 'Ask clients to send them back to us.'],
  ['Calls on Google Meet, with an invite', 'Recap with actions the same day.'],
  ['Log it before you leave', 'Anything a client asks for in the group is a Request on the platform the same day.'],
];

export const REVIEWS = [
  ['Daily 09:30', 'AM, TM', 'Open requests on the platform, quiet creators on Chasing.'],
  ['Thursday', 'AMs', 'Next week’s on-call rota.'],
  ['Friday 16:00', 'CEO, Head of Talent, AMs, BDM', 'Missed times, fixes, weekend handover.'],
  ['Monthly', 'AM, BDM, Client', 'Both sides’ times.'],
  ['Quarterly', 'CEO', 'Review this document.'],
];

export const WALL = {
  shows: [
    'Every live campaign as a row: who is briefed, who has content in, who has posted.',
    'Whose move it is, with the faces. Yours is lit when it is you.',
    'A celebration when a client confirms, a post goes live or a deal is won.',
    'Everything else floats up for ten seconds and is gone.',
  ],
  puts: [
    'You do. A rung moved, a link pasted, a request closed, a rate agreed.',
    'Nothing is typed onto the wall and nobody can push to it. There is no button.',
    'A thing that happened in WhatsApp and nowhere else does not exist to the wall.',
    'If the room should see it, record it. The wall moves the same second.',
  ],
  never: [
    'No fee, cost, margin or invoice on a team display.',
    'Business development and the founders’ own work stay off it.',
    'The wall is for the people delivering campaigns.',
  ],
  how: [
    ['Pairing a TV', 'The TV opens following.ae/tv and shows a six-digit code. A staff phone enters it and picks the display. The TV remembers it through power off and on.'],
    ['Choosing what a screen shows', 'Admin, Company, Office displays. Each display is a scope: the team, or leadership.'],
    ['Playing a preview', 'Office displays can play one on the paired TV so you see what the room sees.'],
  ],
};

export const CHECKLIST = [
  ['Before the room', ['Everyone’s login works; the Talent Executive’s account is new.', 'The office TV is paired and showing the team wall.', 'This document is printed, one per desk, their own role.']],
  ['Open', ['One question: will a visit or a post suffer if it waits until 09:00? That is “urgent”.', 'Only the AM talks to the client. Everyone else talks to the AM.', 'If it is not on the platform it did not happen. WhatsApp is not a record.']],
  ['Everyone', ['Today, then Waiting on me, then Requests. Show each one.', 'Raise a Request in the client’s words. Give it a date.', 'Put your name on a row. That is what stops two people doing it twice.', 'The wall: what puts a thing there is you recording it.']],
  ['Talent', ['The roster is the sheet. Add creators, Add rate, Send for review.', 'An enrolment link is personal. Send it on WhatsApp the same day.', 'Chasing: who is late, who is quiet. The 0, 4, 24, 48 hour ladder.', 'Prepare a payment in Payables. Cash on barter is ours, the client never sees it.']],
  ['Account management', ['Move the rung the day it happens. The status sheet is retired.', 'Content tab: Send for review. The client answers inside the platform.', 'Performance: paste the live link. Leadership releases it to the client.', 'You never send a proposal or a quote. The CEO does.']],
  ['Business development', ['Partner leads, then Sales. A deal with no next step is not being worked.', 'The brief goes to the CEO the day it arrives. Ask talent before the deal closes.', 'Hand over in writing, on the brand record.']],
  ['Leadership', ['Rates: price what clients have said yes to, first thing.', 'Pipeline: give each campaign one talent manager.', 'Waiting on me: nothing waits more than a day.', 'Money never blocks a payout. It informs the call.']],
  ['Close', ['Each person opens their own Today and names their next action.', 'Ask: what did you do this week that is not on the platform? Log it now.', 'Friday 16:00 review is in everyone’s calendar.']],
  ['Do not say in the room', ['Cost or margin, with account management or business development present.', 'A creator’s fee in front of the client.', 'Names of investors, suppliers or the client’s competitors.']],
];
