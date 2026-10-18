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
          'The ask arrives in **Requests** with a brief. Press "I have this".',
          'A roster is already open for that brand. Everything you find goes there.',
          'Start in **Lists**: Food UAE, Beauty UAE and the rest are always up to date.',
          'Then the master database. Add anyone new by handle and we pull their numbers.',
          'Nobody tells you how many to find. A client signing fifteen may need to see hundreds.',
          'Record what they charge and what they agreed. Those are two different numbers.',
          'Hand the list up for review when it is ready to be seen.',
        ],
        next: 'Leadership reviews for quality and budget. Expect removals. That is the point of the review.',
      },
      {
        icon: 'tag',
        title: 'Keep the pricing queue empty',
        when: 'Every day. It is the shortest job here and the most expensive to skip.',
        path: ['Creators', 'Pending rates'],
        steps: [
          'This queue is literally the creators nobody can sell yet.',
          'A creator with no sell price cannot go on a quote at all.',
          'Add the cost you agreed. Leadership sets what we sell them for.',
        ],
        next: 'A founder prices them and releases them into the master database.',
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
    ],
    rules: [
      'A creator with no sell price cannot be sold. Price them or they do not exist to us.',
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
        icon: 'file',
        title: 'Write the internal brief',
        when: 'Before anybody sources a single creator.',
        path: ['Clients', 'Brands', 'Open the brand'],
        steps: [
          'Market, category, budget per creator, deliverables, dates.',
          'Say what the brand will refuse. That saves a week of sourcing.',
          'Release it so talent can start.',
        ],
        next: 'Talent sources against your brief. A vague brief is a wasted week.',
      },
      {
        icon: 'send',
        title: 'Send the roster and get an answer',
        when: 'Once leadership has cleared the list.',
        path: ['Creators', 'Rosters', 'Share link'],
        steps: [
          'Mint the link and send it. The client picks on the page itself.',
          'You are told when they answer. You do not have to check.',
          'If the link is about to expire you are warned first.',
        ],
        next: 'Their picks come back onto the roster and become a quote.',
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
        'The moment a deal looks real, press **Ask talent**. Do not wait for the yes.',
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
        title: 'Ask talent to start',
        when: 'The moment the deal looks real. NOT when it closes.',
        path: ['Clients', 'Sales', 'Ask talent'],
        steps: [
          'This is the one that used to cost us weeks. Talent heard when a campaign locked.',
          'Press it on the deal and write what you are looking for: market, category, size.',
          'Say WHAT, never how many. A client signing fifteen may need to see hundreds.',
          'Talent get it on their day, with a roster already open and your brief on it.',
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
        when: 'When talent hands it up for review.',
        path: ['Creators', 'Rosters'],
        steps: [
          'Check each creator against the brief’s budget.',
          'Check they really live in the market the brief asked for.',
          'Check engagement against follower count.',
          'Check we have not used them for this brand recently.',
          'Clear the ones that pass. Strike the rest with the reason.',
        ],
        next: 'Account management sends the cleared list to the client.',
      },
      {
        icon: 'tag',
        title: 'Price what talent has found',
        when: 'As soon as a cost is recorded.',
        path: ['Creators', 'Pending rates'],
        steps: [
          'Talent records what a creator charges us.',
          'You set what we sell them for. Nobody else can.',
          'Until you do, that creator cannot go on a quote.',
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
        when: 'When a brand is logged as worth pursuing.',
        path: ['Clients', 'Brands'],
        steps: [
          'A logged brand is not work until you say so.',
          'Write what we are looking for, then release it.',
          'That release is what starts talent researching.',
        ],
        next: 'Talent begins sourcing against what you wrote.',
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
