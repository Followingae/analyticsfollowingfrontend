/**
 * What each person here actually does, in the order they do it.
 *
 * Written from a scan of the company's own mailbox rather than from the screen list, which
 * is why the jobs are things like "turn a brief into creators who have said yes" rather than
 * "use the rosters screen". The screens are where a job is done; they are not the job.
 *
 * TWO RULES FOR EDITING THIS FILE.
 *
 * `path` IS WHAT YOU CLICK, IN ORDER. Never a URL. The first chip is the sidebar item, then
 * the tab, then the button. The generator checks every sidebar and tab name against
 * `src/lib/destinations.ts`, so a wrong one fails the build instead of printing.
 *
 * KEEP STEPS SHORT. One line each, ideally under twelve words. The previous manuals were
 * rejected for being a wall of text; anything that needs a paragraph is either a rule (put it
 * in `rules`) or it is two steps.
 */

/** Who hears about it next. Omit where the job genuinely ends with this person. */
export const ROLES = [
  // ═══════════════════════════════════════════════════════════════════════════════════
  {
    file: 'Talent',
    slug: 'talent-manager',
    glyph: 'search',
    title: 'Talent',
    promise: 'Names, prices and paperwork',
    kicker: 'Role manual',
    lede: 'You turn a brand’s request into real creators who have said yes, at a price we can sell, with signed paperwork and content that lands on time.',
    day: [
      { icon: 'sunrise', head: 'First thing', items: [
        'Open **Requests**. Everything anybody is waiting on from you.',
        'Open **Today**. The rest of what is yours.',
        'Open **Pipeline**. Every creator we owe something.',
      ]},
      { icon: 'clock', head: 'Through the day', items: [
        'Work from **Pipeline**, not from memory or WhatsApp.',
        'Each row tells you the verb. Do that one thing.',
        'If it only happened in chat, nobody else can see it.',
      ]},
      { icon: 'moon', head: 'Before you log off', items: [
        'Nothing red in **Pipeline** without a reason written down.',
        'Move it, note it, or nudge whoever is blocking it.',
      ]},
    ],
    jobs: [
      {
        icon: 'search',
        title: 'Find creators for a brand',
        when: 'Starts when a brief arrives. Ends when the client has a list to choose from.',
        path: ['Creators', 'Rosters'],
        steps: [
          'A founder releases the brand. It reaches you on **Today** with the brief.',
          'The brand’s roster is already open. It replaces the campaign sheet.',
          'Search the master database first with **Add creators**.',
          'Anyone new: **Paste a list**, rows from a sheet or one handle per line.',
          'Nobody tells you how many to find. A client signing fifteen may need to see hundreds.',
        ],
        next: 'You price each one on the same roster, then send the good ones for review.',
      },
      {
        icon: 'tag',
        title: 'Price them and send them up',
        when: 'As you find them. A creator with no price cannot be sold.',
        path: ['Creators', 'Rosters', 'Open the brand’s roster'],
        steps: [
          'Press **Price** on a row. Record what they asked and what you agreed.',
          'Their currency, and what it buys: reel, reel also on TikTok, full scope.',
          'Read **Last time** first. Amber means over budget or well above last time.',
          'Tick the good ones and press **Send for review**.',
          'The rest: **Not this time**, with a reason. They stay in the database.',
        ],
        next: 'A founder sets sell prices and clears them, or sends some back with a note.',
      },
      {
        icon: 'message',
        title: 'Work an open call',
        when: 'When a superadmin has put an open call live on the roster.',
        path: ['Creators', 'Rosters', 'Open the brand’s roster'],
        steps: [
          'Press **Copy a DM with my link** and send it to creators on Instagram.',
          'Our WhatsApp agent asks their price, dates and email for you.',
          'Whoever answers lands on the roster with a quote, credited to you.',
          '**Yours now** means a person should talk to them. Open **Conversations**.',
          'Reply, then press **Hand back to the agent** when you are done.',
        ],
        next: 'They go up for review like any creator you priced yourself.',
      },
      {
        icon: 'handshake',
        title: 'Sign a creator',
        when: 'Once the client has picked them and the campaign is confirmed.',
        path: ['Finance', 'Enrolments'],
        steps: [
          'Create the enrolment. The creator gets their own signing link.',
          'They fill in their details and bank information themselves.',
          'Never type a creator’s bank details for them.',
          'Chase anyone who has not signed. The screen shows who.',
        ],
        next: 'A founder approves the payment once the work is delivered.',
      },
      {
        icon: 'camera',
        title: 'Get the content in',
        when: 'From the agreed date until the post is live.',
        path: ['Campaigns', 'Chasing'],
        steps: [
          'This screen is who is late, who is due, who has gone quiet.',
          'Collect the content and the creator’s own insights screenshots.',
          'Put the posted link on the creator’s row when it goes live.',
        ],
        next: 'Account management reports it to the client.',
      },
      {
        icon: 'link',
        title: 'Give each creator their link',
        when: 'On a campaign that sells, once its retailers are set up.',
        path: ['Campaigns', 'Open a campaign', 'Links'],
        steps: [
          'Every creator on the roster has their own short link per retailer.',
          'Press **Copy all links** and send each creator only their own.',
          'Their clicks, carts and sales are counted against that link.',
        ],
        next: 'A superadmin decides when the brand sees the numbers.',
      },
    ],
    rules: [
      'A creator with no price cannot be sold. Record it on the roster or they do not exist to us.',
      'Not this time is not a no. Give the reason; it follows them to the next brief.',
      'Never guess a creator’s country code. We once sent a Saudi creator’s signing link to a stranger.',
      'The agreed rate is the one we use, not their published rate.',
      'A creator signs their own paperwork and enters their own bank details.',
      'Nothing is real until it is on the screen. WhatsApp is not a record.',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════════════
  {
    file: 'Account Manager',
    slug: 'account-manager',
    glyph: 'building',
    title: 'Account Management',
    promise: 'The client’s whole experience of us',
    kicker: 'Role manual',
    lede: 'You own the client. You know what they bought, what they are owed, and what they have been told, and you tell them before they have to ask.',
    day: [
      { icon: 'sunrise', head: 'First thing', items: [
        'Open **Requests**. What clients are waiting on, and who owes it.',
        'Open **Today**. The rest of what is yours.',
        'Open **Clients**. Anyone gone quiet is flagged.',
      ]},
      { icon: 'clock', head: 'Through the day', items: [
        'Answer the client wherever they wrote to you. WhatsApp and email do not change.',
        'Then raise it as a **Request** so somebody owns it and a date exists.',
        'Every promise you make goes on the client’s record the same day.',
        'A client should never be the one chasing us.',
      ]},
      { icon: 'moon', head: 'Before you log off', items: [
        'No client waiting on an answer from you overnight.',
        'Anything you promised today is written down.',
      ]},
    ],
    jobs: [
      {
        icon: 'inbox',
        title: 'Turn a client ask into something that happens',
        when: 'Every time a client asks for anything.',
        path: ['Requests', 'Raise one'],
        steps: [
          'Write what they asked for in their words, not a summary.',
          'Tick "a client asked for this" so it carries the weight it should.',
          'Give it a date. Leave the owner blank if you do not know who should do it.',
          'It shows on their day until it is done, and they are told when it is.',
        ],
        next: 'You stop being the only person who remembers it.',
      },
      {
        icon: 'chart',
        title: 'Send a client their results',
        when: 'Once their creators have posted.',
        path: ['Campaigns', 'Open a campaign', 'Performance'],
        steps: [
          'Paste the link to each post that went live.',
          'We read the numbers off Instagram within a minute or so.',
          'Leadership releases each one. Nothing reaches the client until they do.',
          'Once released the client sees it on their own Results screen.',
        ],
        next: 'They get the roll-up across every post without you building a deck.',
      },

      {
        icon: 'building',
        title: 'Take the handover',
        when: 'When business development closes a brand and hands it to you.',
        path: ['Clients', 'Brands'],
        steps: [
          'Read what was agreed: rate card, deliverables, dates, who signs.',
          'If any of it is only in an email, put it on the client record.',
          'Introduce yourself to the client in writing on day one.',
        ],
        next: 'You now own this brand. Everything about them comes to you.',
      },
      {
        icon: 'camera',
        title: 'Review the content',
        when: 'When a creator’s row on Delivery reads "Content in".',
        path: ['Campaigns', 'Open a campaign', 'Content'],
        steps: [
          'Check it against the brief before the client sees anything.',
          'With Frame.io, press **Send for review**. The client answers inside our platform.',
          'Changes asked for go back to the creator through talent, with the note.',
        ],
        next: 'Approved content moves the creator to "get the post link".',
      },
      {
        icon: 'send',
        title: 'Send the proposal and get an answer',
        when: 'Once a founder has marked it internally approved and ready to send.',
        path: ['Clients', 'To send'],
        steps: [
          'It appears here and you are told. You never mint the link yourself.',
          'Send it from your own inbox. The platform never emails a client.',
          'Press "I have sent it" so it is on their record.',
          'The client picks in the proposal. If they tell you instead, a founder uses **Confirm for the client**.',
        ],
        next: 'Confirming locks the creators they took. More later means Reopen, not a new proposal.',
      },
      {
        icon: 'megaphone',
        title: 'Report on the campaign',
        when: 'During delivery, and again at the end.',
        path: ['Campaigns', 'Reports'],
        steps: [
          'Share what is live as it happens, not only at the end.',
          'Send the write-up when the campaign finishes.',
          'Nothing goes to a client automatically. You press send.',
        ],
      },
    ],
    rules: [
      'You never see what a creator costs us. You sell. That is deliberate.',
      'No automated email ever reaches your client. Every one is sent by a person.',
      'A promise made in email belongs on the client record the same day.',
      'If a brand has gone quiet for a fortnight you will be told. Act on it.',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════════════
  {
    file: 'Business Development',
    slug: 'business-development',
    glyph: 'handshake',
    title: 'Business Development',
    promise: 'Every deal, first call to won',
    kicker: 'Role manual',
    lede: 'You bring the work in. You qualify it, agree what we charge, get it signed, and hand it over in writing so nothing is lost between you and delivery.',
    day: [
      { icon: 'sunrise', head: 'First thing', items: [
        'Open **Sales**. Your whole board, by stage.',
        'Open **To send**. Anything leadership has checked and cleared for a client.',
        'Open **Partner leads**. Enquiries off the website land here.',
      ]},
      { icon: 'clock', head: 'Through the day', items: [
        'Move deals as they move. The board is the record now, not the sheet.',
        'The moment a deal looks real, tell a founder so they press **Ask talent**. Do not wait for the yes.',
        'Every deal carries a next step and a date, or it is not being worked.',
      ]},
      { icon: 'moon', head: 'Before you log off', items: [
        'Every enquiry today is a brand on the board with a next step.',
      ]},
    ],
    jobs: [
      {
        icon: 'inbox',
        title: 'Take the enquiry',
        when: 'The moment it arrives.',
        path: ['Clients', 'Partner leads'],
        steps: [
          'Everybody who filled in the form on the website is here, newest first.',
          'Open the one you are taking and write down what they asked for.',
          'Put your name on it so nobody answers it twice.',
        ],
      },
      {
        icon: 'clipboard',
        title: 'Qualify it',
        when: 'Before you quote anything.',
        path: ['Clients', 'Sales', 'Add a brand'],
        steps: [
          'Budget, market, category, timing, who signs.',
          'Without a budget there is no brief, and no brief wastes everyone.',
          'Add the brand on the board and write what you learned on the deal.',
        ],
        next: 'A founder decides whether we chase it and writes what to look for.',
      },
      {
        icon: 'users',
        title: 'Get talent started early',
        when: 'The moment the deal looks real. NOT when it closes.',
        path: ['Clients', 'Sales'],
        steps: [
          'This is the one that used to cost us weeks. Talent heard when a campaign locked.',
          'Write on the deal what the brand is looking for: market, category, size, budget.',
          'Tell a founder it is real. **Ask talent** is theirs to press.',
          'Say WHAT, never how many. A client signing fifteen may need to see hundreds.',
          'Talent get it on Today, with the brand’s roster open and the brief on it.',
        ],
        next: 'Sourcing runs while you are still negotiating, so names exist when they ask.',
      },
      {
        icon: 'banknote',
        title: 'Send the quotation',
        when: 'Once leadership has checked it.',
        path: ['Clients', 'To send'],
        steps: [
          'You do not mint the link and you do not build the numbers. Leadership does both.',
          'When it is checked it appears here and you are told.',
          'Copy the link into your OWN email. The client hears from you, as always.',
          'Then press "I have sent it" so it is on their record and not just your sent folder.',
        ],
        next: 'The client opens it and picks. You see what they chose without asking.',
      },
      {
        icon: 'handshake',
        title: 'Sign and hand over',
        when: 'When they say yes.',
        path: ['Clients', 'Brands', 'Open the brand'],
        steps: [
          'Get the agreement signed and uploaded against the brand.',
          'Hand over in writing: what was sold, at what price, by when.',
          'Introduce the account manager to the client yourself.',
        ],
        next: 'Account management owns the client from here. You go and find the next one.',
      },
    ],
    rules: [
      'Never quote a price that is not on the rate card without a founder saying so.',
      'You never see cost. Only what we sell for.',
      'A handover said out loud is not a handover. Write it down.',
      'An enquiry nobody has answered by tomorrow is a lost enquiry.',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════════════
  {
    file: 'Co-Founder',
    slug: 'co-founder',
    glyph: 'shield',
    title: 'Co-Founder',
    promise: 'What it costs, and what leaves',
    kicker: 'Role manual',
    lede: 'You are the quality gate and the budget gate. Nothing reaches a client that you have not seen, and no money leaves without you.',
    day: [
      { icon: 'sunrise', head: 'First thing', items: [
        'Open **Rates**. Clients have said yes; these campaigns cannot open until you price them.',
        'Open **Decisions**. Everything held for you, oldest first.',
      ]},
      { icon: 'clock', head: 'Through the day', items: [
        'Clear rosters quickly. Talent cannot move until you do.',
        'Strike with a reason. The reason stops the repeat next month.',
        'Check the talent board on **Rates**: who is holding what, and what is late.',
      ]},
      { icon: 'moon', head: 'Before you log off', items: [
        'Nothing has waited on you for more than a day.',
      ]},
    ],
    jobs: [
      {
        icon: 'shield',
        title: 'Clear a roster',
        // There is no target. A client who signs fifteen may need to see five hundred
        // first, so nobody is told how many names to find; a roster is handed up when the
        // person sourcing judges the client has a real choice.
        when: 'When talent sends creators for review. Today says "Price N shortlisted creators".',
        path: ['Creators', 'Rosters', 'Open the brand’s roster'],
        steps: [
          'Check each against the brief’s budget, real market, engagement and recent use.',
          'Press **Price and clear**. Enter each sell price; the margin shows as you type.',
          'They become sellable and cleared in one step. Nobody else sets sell.',
          'The ones that miss: tick them, **Send back** with a note ("find options at 3.5k").',
        ],
        next: 'Cleared creators go onto a proposal with Add to a proposal.',
      },
      {
        icon: 'chart',
        title: 'Release what the client sees',
        when: 'When posts are measured, or a campaign’s links have numbers.',
        path: ['Campaigns', 'Open a campaign', 'Performance'],
        steps: [
          'Each pasted post waits for you. Release it and it reaches their Results.',
          'On the **Links** tab, **Show the brand** releases clicks and sales (superadmin).',
          'Nothing a client sees goes out by itself.',
        ],
      },
      {
        icon: 'banknote',
        title: 'Release money',
        when: 'When work is delivered and a payment is requested.',
        path: ['Finance', 'Approvals'],
        steps: [
          'Check the work actually landed before approving.',
          'Check the creator has signed and given their own bank details.',
          'Approve. Nothing pays out that the client has not funded.',
        ],
        next: 'The payment joins the next payout run.',
      },
      {
        icon: 'target',
        title: 'Watch the shape of the week',
        when: 'Once a week is enough.',
        path: ['Admin', 'Company', 'Targets'],
        steps: [
          'Targets and progress for the whole team.',
          'Quiet brands and overdue rosters reach you without looking.',
        ],
      },
    ],
    rules: [
      'A creator the client should not see is your catch, not theirs.',
      'Always strike with a reason. No reason means it happens again next month.',
      'No payment goes out on work you have not confirmed landed.',
      'Working capital is an amount you approve in writing, never a general permission.',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════════════
  {
    file: 'Founder & CEO',
    slug: 'founder-ceo',
    glyph: 'target',
    title: 'Founder & CEO',
    promise: 'What we chase, and when money moves',
    kicker: 'Role manual',
    lede: 'You decide what we chase, what things cost, and when money moves. Everything else should reach you without you going to look for it.',
    day: [
      { icon: 'sunrise', head: 'First thing', items: [
        'Open **Today**. The whole company on one screen.',
        'Open **Decisions**. Only what is held for you.',
      ]},
      { icon: 'clock', head: 'Through the day', items: [
        'Release what you want chased. Talent cannot start until you do.',
        'Everything else is a notification, not a screen you have to visit.',
      ]},
      { icon: 'moon', head: 'Weekly', items: [
        'Margin per campaign and what each client is really worth.',
        'Quiet brands, overdue rosters and late payments find you.',
      ]},
    ],
    jobs: [
      {
        icon: 'target',
        title: 'Decide what we chase',
        when: 'When a deal in Sales looks real.',
        path: ['Clients', 'Sales', 'Ask talent'],
        steps: [
          'A logged brand is not work until you say so.',
          'Press **Ask talent** on the deal, or **Start sourcing** on Rosters.',
          'Write the brief: market, categories, follower range, paid or barter.',
          'Give the budget per creator as a range, for example AED 3,500 to 4,000.',
        ],
        next: 'Talent are alerted at once and the brand’s roster opens.',
      },
      {
        icon: 'message',
        title: 'Put an open call live',
        when: 'When a roster needs more creators than talent can DM one by one.',
        path: ['Creators', 'Rosters', 'Open the brand’s roster'],
        steps: [
          '**Create an open call**. Describe the brand; never name it.',
          'Target and ceiling are for the agent only. Creators never see them.',
          '**Make it live**. Talent then send their own links.',
          'Invite app creators or invite on WhatsApp to reach more.',
          'When the client has chosen, press **Tell creators how it went**.',
        ],
        next: 'Answers land on the roster as quotes, ready for Price and clear.',
      },
      {
        icon: 'link',
        title: 'Set up Following Track',
        when: 'On a campaign where the brand wants clicks and sales per creator.',
        path: ['Campaigns', 'Open a campaign', 'Links'],
        steps: [
          'Add the **Retailers** the links send people to. Every creator gets a link.',
          'Send the brand the **Store pixel** for carts, checkouts and orders.',
          'Sales from a retailer’s report: **Add one** or **Import a spreadsheet**.',
          'Turn on **Show the brand** when the numbers are ready to be seen.',
        ],
        next: 'Affiliate links in the sidebar shows every campaign’s links on one screen.',
      },
      {
        icon: 'banknote',
        title: 'Agree what we pay each creator',
        when: 'As soon as a client confirms. Nothing opens until this is done.',
        path: ['Finance', 'Rates'],
        steps: [
          'Every proposal a client has confirmed is here, longest wait first.',
          'Open one and put the real negotiated cost against each creator.',
          'The margin moves as you type, before you commit anything.',
          'What we quoted and what we pay are rarely the same. The second one is the truth.',
          'When every creator has a rate, the campaign can be opened.',
        ],
        next: 'The campaign opens with a real margin instead of acquiring one later.',
      },
      {
        icon: 'users',
        title: 'See who is holding what',
        when: 'Whenever you are allocating, and before you hire.',
        path: ['Finance', 'Rates'],
        steps: [
          'The talent board is underneath the rates.',
          'Open requests, how many are late, rosters held, sourced and priced this month.',
          'Counts, never scores. It tells you where the load is, not who is better.',
          'Anything nobody has taken is called out at the top.',
        ],
      },
      {
        icon: 'wallet',
        title: 'See what a campaign is worth',
        when: 'Before you invoice, and whenever it matters.',
        path: ['Campaigns', 'Open a campaign', 'Money'],
        steps: [
          'Cost, sell, margin and what the client has actually paid.',
          'How much is left to draw before we are funding it ourselves.',
          'Approve working capital here if creators must be paid first.',
        ],
      },
      {
        icon: 'receipt',
        title: 'Invoice and collect',
        when: 'On the agreed schedule.',
        path: ['Clients', 'Brands', 'Open the brand'],
        steps: [
          'Raise the advance, then the balance on the agreed terms.',
          'Record the invoice and attach the file.',
          'Mark it paid when the transfer lands.',
        ],
      },
      {
        icon: 'inbox',
        title: 'See who has contacted the company',
        when: 'Whenever you want to know, not as a queue.',
        path: ['Desk'],
        steps: [
          'Everything sent to our catch-all address or the marketing number lands here.',
          'Each one says who we think it is from, and says so plainly when we do not know.',
          'Nobody replies from here and nothing changes because of it. Only you see it.',
        ],
      },
      {
        icon: 'mail',
        title: 'Control what the platform sends',
        when: 'Whenever the noise is wrong.',
        path: ['Admin', 'Settings', 'Sending'],
        steps: [
          'Every automated email in the platform is listed here.',
          'Per event: switch it off, or move it into the twice-daily digest.',
          'Choose which roles hear it, including whether you do.',
        ],
      },
    ],
    rules: [
      'No automated email ever reaches a client. Every client email is sent by a person.',
      'A campaign is never quietly repriced. Terms are stamped when it is awarded.',
      'Nothing pays out beyond what the client has funded, unless you approve it in writing.',
      'Cost is never visible to a brand. Only what we sell for.',
    ],
  },
];

/**
 * The sidebar, as it actually renders.
 *
 * Drawn in every manual so "where do I find it" is answered once, with a picture, instead of
 * being re-explained in every step. The names are filled in by the generator from
 * `destinations.ts` — this file only says which rows exist and in what order.
 */
export const MENU = [
  { group: null, rows: [
    { path: '/work/today', icon: 'list' },
    { path: '/work/inbox', icon: 'inbox' },
    // Everything anybody has asked us for, whoever asked.
    { path: '/work/requests', icon: 'hand' },
    // The marketing number and the catch-all address land here. Visibility of who has
    // contacted the company, not work for anybody, so only the founder has the row.
    { path: '/work/desk', icon: 'mail', only: ['founder-ceo'] },
    { path: '/work/guide', icon: 'book' },
  ]},
  { group: 'Work', rows: [
    { path: '/work/pipeline', icon: 'clipboard' },
    { path: '/work/clients', icon: 'building' },
    { path: '/work/influencers', icon: 'users' },
    { path: '/work/campaigns', icon: 'megaphone' },
    { path: '/work/affiliate-links', icon: 'link' },
    { path: '/work/money', icon: 'wallet' },
  ]},
];

/**
 * The three collapsed groups under "Admin" at the bottom of the menu, and what is in each.
 *
 * Separate from TABS because they behave differently: these are parents you expand, not tabs
 * across the top of a screen. A path through one of them reads Admin > Settings > Sending.
 */
export const ADMIN = {
  Company: ['/work/goals', '/work/team', '/work/system/displays'],
  Settings: ['/work/users', '/work/staff', '/work/notifications', '/work/whatsapp',
             '/work/system', '/work/system/images'],
};

/** The tabs inside each destination, so a path chip can be checked against something real. */
export const TABS = {
  Clients: ['/work/sales', '/work/clients', '/work/brands', '/work/proposals',
            '/work/share', '/work/handovers', '/work/partners'],
  Creators: ['/work/influencers', '/work/influencers/review', '/work/influencers/analyzed',
             '/work/lists', '/work/areas', '/work/coverage', '/work/fa/members',
             '/work/fa/reliability'],
  Campaigns: ['/work/campaigns', '/work/fa/campaigns', '/work/report-campaigns', '/work/chasing'],
  Finance: ['/work/billing', '/work/mor', '/work/payables', '/work/fa/wallets',
            '/work/enrolments', '/work/negotiations', '/work/approvals'],
};
