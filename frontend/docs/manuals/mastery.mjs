/**
 * The part of a manual that teaches rather than lists.
 *
 * WHY THIS IS A SEPARATE FILE FROM `roles.mjs`. That one answers "what are this person's
 * jobs and where are the screens" and it is a reference: you look something up in it. This
 * one answers "how does the work actually go", and it is read once, properly, in week one.
 * Keeping them apart means the reference can be regenerated when a screen is renamed
 * without anybody having to re-read the teaching, and the teaching can be rewritten when
 * the way we work changes without touching the screen names.
 *
 * FOUR THINGS PER ROLE, and each one earns its space by answering a question a bullet list
 * cannot:
 *
 *   flow     where their work sits in the company's, so they can see who hands to them and
 *            who they are holding up. New people ask this in week one and nobody writes it
 *            down, so they learn it by getting it wrong.
 *   screen   a drawing of the screen they will live in, with the parts numbered. A drawing
 *            and not a screenshot: a screenshot of a product that ships weekly is wrong in
 *            a month, and nobody reprints a manual because a button moved.
 *   story    one real job followed the whole way, with the real numbers. The steps say
 *            what to do; this says what it looks like when it is done properly.
 *   vs       what good looks like beside what has actually gone wrong. Paired, because the
 *            lesson is the difference.
 *
 * Every mistake in a `bad` list is a real one. They are the specific things that have cost
 * this company money or trust, which is why they are worth a page.
 */

/* The company's work, start to finish. Each role's manual prints this same ribbon with
   their own stages lit, so five people reading five manuals are reading one picture. */
export const FLOW = [
  { key: 'find',     who: 'Business dev', what: 'Find the brand' },
  { key: 'agree',    who: 'Business dev', what: 'Agree the deal' },
  { key: 'source',   who: 'Talent',       what: 'Find creators' },
  { key: 'price',    who: 'Founders',     what: 'Agree what we pay' },
  { key: 'book',     who: 'Talent',       what: 'Book and paper them' },
  { key: 'deliver',  who: 'Account mgmt', what: 'Content and approvals' },
  { key: 'report',   who: 'Account mgmt', what: 'Results to the client' },
  { key: 'collect',  who: 'Founders',     what: 'Invoice and pay' },
];

export const MASTERY = {
  /* ─────────────────────────────────────────────────────────────────────────────── */
  'talent-manager': {
    flow: ['source', 'book'],
    flowNote: 'A founder releases a brief to you before the deal closes. You hand a '
            + 'priced, booked roster to account management.',
    screen: {
      title: 'Waiting on us',
      sub: 'Everything anybody has asked you for, oldest first',
      url: 'platform.following.ae/work/requests',
      side: ['Today', 'Waiting on me', 'Requests', 'Pipeline', 'Clients', 'Creators'],
      on: 'Requests',
      cards: [
        { k: 'Waiting', v: '6', s: '2 nobody has taken' },
        { k: 'Late', v: '1', s: 'Lago, due Thursday' },
        { k: 'Mine', v: '4', s: 'you have these' },
      ],
      rows: [
        { nm: 'Source creators for Minimalist', tag: 'A client asked', hot: true },
        { nm: 'Sports creators for the Geant event', tag: 'Due tomorrow' },
        { nm: '3 more KSA creators for Lago', tag: 'Nobody has this' },
      ],
      keys: [
        ['card2', 'The count that matters. Not how much work exists, how much is LATE.'],
        ['card1', 'Anything with no owner. Take one and it becomes yours, and everyone can see that.'],
        ['row1', '"A client asked" means a brand is waiting on a human answer. These go first.'],
        ['row2', 'Click the row to open it. The brief is inside, with a roster already waiting.'],
        ['menu', 'Your name on a row is the only thing that stops two people doing it twice.'],
      ],
    },
    story: {
      title: 'A brief on Tuesday, a roster on Thursday',
      beats: [
        ['Tue 9am', 'Today shows a new brief: **Minimalist**. Skincare and derm, UAE, 50k to '
                  + '300k, AED 3,500 to 4,000 a creator. A founder released it, and the deal '
                  + 'is not even signed yet.'],
        ['Tue 9am', 'The brand’s roster is already open. It is the sheet now. You never make one.'],
        ['Tue', 'Search the master database with **Add creators**. Thirty fit. Anyone '
              + 'genuinely new, **Paste a list** straight from your notes.'],
        ['Tue', 'ScoutOutreach is running on the roster too. By lunch it has DMed forty '
              + 'skincare creators; ScoutAI is asking their rates on WhatsApp while you keep sourcing.'],
        ['Wed', 'Nobody told you to find twenty. You find enough that the client has a real '
              + 'choice, which on skincare is usually sixty before they pick fifteen.'],
        ['Wed', '**Add rate** on each of yours: what they asked, what they agreed. One asks 6,000; '
                + '**Last time** says 3,500, and the row turns amber. You agree 3,800.'],
        ['Wed', 'Eleven rows now read **Rate in, send for review**: ScoutAI brought those '
              + 'rates in by itself.'],
        ['Thu', 'Tick the good ones, **Send for review**. The rest get **Skip** '
              + 'with a reason. A founder presses **Price** the same day; they come back **Ready**.'],
        ['After', 'The client confirms. A founder settles the real cost and creates each enrolment '
                + 'link. The bell and an email tell you, and you send each one on WhatsApp that day.'],
      ],
    },
    vs: {
      good: [
        'Everything you find goes on the roster, the same hour you find it.',
        'A price is recorded as two numbers: what they ask, what they agreed.',
        'A creator you cannot place in a country is still worth adding; say so in the note.',
        'When a brief is missing market, category or budget, you ask before you start.',
        'An enrolment link reaches the creator the same day the bell tells you.',
        'You take a request the moment you start it, so nobody duplicates your work.',
      ],
      bad: [
        'Sourcing into a spreadsheet and uploading at the end. Nobody can see progress, and '
        + 'the half you have done looks like nothing. The roster is the sheet.',
        'Recording only the published rate. We then sell at a margin that does not exist.',
        'Guessing a country code on a phone number. We once sent a Saudi creator’s '
        + 'signing link to a stranger in the UAE.',
        'Agreeing a fee in WhatsApp and typing it in later. The number drifts, every time.',
        'Leaving a request unclaimed while you work on it. Somebody else starts it too.',
      ],
    },
    card: [
      ['Open first', ['Today, then the brand’s roster.',
                      'Anything late, before anything new.']],
      ['The one rule', ['If it is not on the screen it did not happen. '
                      + 'WhatsApp is not a record.']],
      ['Two numbers, always', ['What they charge. What they agreed. Never just one.']],
      ['Never', ['Never guess a country code.',
                 'Never promise a creator a fee before leadership has agreed it.']],
      ['Stuck?', ['A brief with no market, category or budget is not a brief. Ask.']],
    ],
  },

  /* ─────────────────────────────────────────────────────────────────────────────── */
  'account-manager': {
    flow: ['deliver', 'report'],
    flowNote: 'Talent hands you a booked roster. You hand the client their content, their '
            + 'answers and their results.',
    screen: {
      title: 'Lago Italian Wafers',
      sub: 'Barakat Fresh · Running',
      url: 'platform.following.ae/work/campaigns',
      side: ['Today', 'Waiting on me', 'Requests', 'Clients', 'Campaigns', 'Finance'],
      on: 'Campaigns',
      cards: [
        { k: 'Booked', v: '12', s: 'of 12 confirmed' },
        { k: 'Delivered', v: '8', s: '2 waiting on the client' },
        { k: 'Live', v: '5', s: '3 released to them' },
      ],
      rows: [
        { nm: 'Story   Delivery   Content   Performance', tag: 'the five tabs', hot: true },
        { nm: '@tasha.tries.it  ·  content delivered', tag: 'send to client' },
        { nm: '@firaskazma  ·  posted', tag: 'paste the link' },
      ],
      keys: [
        ['title', 'One campaign, five tabs. The campaign stays open while you move between them.'],
        ['row1', 'Story is the whole history. Open it when somebody asks how we got here.'],
        ['card1', 'Delivery is every creator and the rung they are on. This is your chasing list.'],
        ['row2', 'Content is what they have filmed. You send it; the client approves it here.'],
        ['row3', 'Performance is where you paste a live post. Leadership releases it to the client.'],
        ['menu', 'Money is only there if you are allowed to see it. It is not part of your job.'],
      ],
    },
    story: {
      title: 'A client asks for something on WhatsApp',
      beats: [
        ['Mon 7pm', 'Barakat messages you: they want three more creators for KSA, and they '
                  + 'need to know by Thursday.'],
        ['Mon 7pm', 'Answer them. On WhatsApp, as a person, the way you always have. '
                  + 'Nothing about that changes.'],
        ['Mon 7pm', 'Then raise it in **Requests**, in their words, ticked as '
                  + '**a client asked for this**, due Thursday.'],
        ['Mon', 'Leave the owner blank if you are not sure who should do it. Unclaimed is '
              + 'visible, and that is the point.'],
        ['Tue', 'Talent takes it. You can see that without asking.'],
        ['Thu', 'It is marked done and you are told. You tell the client they were right to '
              + 'expect it today.'],
        ['After', 'It is on the client’s record forever. In six months, when they ask '
                + 'what we did for them, it is still there.'],
      ],
    },
    vs: {
      good: [
        'The client hears from you on WhatsApp within the hour, as always.',
        'Then it is raised as a request, with a date, so it is not only in your head.',
        'Every promise you make goes on the client record the same day.',
        'You chase from the Delivery tab, which shows who is actually late.',
        'Results reach the client as a grid they can read, not a deck you built at midnight.',
      ],
      bad: [
        'Answering on WhatsApp and nothing else. You become the only person who knows, and '
        + 'the only person who can be ill.',
        'Chasing from memory. The one you forget is always the one the client remembers.',
        'Telling a client a date that talent has not agreed to.',
        'Sending content to a client before it has been checked internally.',
        'Building results by hand in a spreadsheet when the platform has already counted them.',
      ],
    },
    card: [
      ['Open first', ['Requests. What clients are waiting on.',
                      'Then Today for the rest.']],
      ['The one rule', ['A client should never be the one chasing us.']],
      ['Comms do not change', ['WhatsApp and email, from you, as a person. '
                             + 'Then write it down here.']],
      ['Never', ['Never send a client content nobody has checked.',
                 'Never quote a date talent has not agreed.']],
      ['Results', ['Paste the live post on Performance. Leadership releases it. '
                 + 'The client sees the roll-up themselves.']],
    ],
  },

  /* ─────────────────────────────────────────────────────────────────────────────── */
  'business-development': {
    flow: ['find', 'agree'],
    flowNote: 'You start everything. The earlier a founder presses Ask talent, the less of the '
            + 'client’s patience is spent waiting for names. Tell them early.',
    screen: {
      title: 'Sales',
      sub: 'Every brand we are talking to, and what happens next',
      url: 'platform.following.ae/work/sales',
      side: ['Today', 'Waiting on me', 'Requests', 'Clients', 'Creators', 'Campaigns'],
      on: 'Clients',
      cards: [
        { k: 'Live deals', v: '19', s: 'across 17 brands' },
        { k: 'Worth', v: '519k', s: '8 carry no budget yet' },
        { k: 'Sourcing', v: '4', s: 'talent already started' },
      ],
      rows: [
        { nm: 'Minimalist  ·  Proposal sent  ·  AED 57,000', tag: 'Ask talent', hot: true },
        { nm: 'Samsung  ·  Met them', tag: 'no budget yet' },
        { nm: 'Britannia  ·  Agreement sent  ·  AED 90,000', tag: 'Talent sourcing' },
      ],
      keys: [
        ['title', 'Columns are stages. Move a deal by changing its stage on the card.'],
        ['card1', 'A brand can hold several deals. Barakat has run eighteen campaigns under one name.'],
        ['card2', '"Worth" only counts deals carrying a figure, and says how many do not.'],
        ['row1', 'Ask talent. A founder presses it when the deal looks real, NOT when it closes.'],
        ['row3', '"Talent sourcing" means they are already finding names for this one.'],
        ['menu', 'A deal with no next step and no date is not being worked.'],
      ],
    },
    story: {
      title: 'From a first meeting to names on the table',
      beats: [
        ['Week 1', 'Meeting with Minimalist. Skincare, UAE, wants to launch in six weeks. '
                 + 'Add the brand, add the deal, stage **Met them**.'],
        ['Week 1', 'You get a budget out of them: AED 57,000. Put it on the deal. A deal '
                 + 'with no budget is not a deal yet and the board shows that honestly.'],
        ['Week 2', 'It feels real. Do not wait. Write on the deal what they are looking for: '
                 + 'skincare and derm, UAE, 50k to 300k, studio capable. Tell a founder.'],
        ['Week 2', 'The founder presses **Ask talent** and sets the budget per creator: '
                 + 'AED 3,500 to 4,000.'],
        ['Week 2', 'Say WHAT, never how many. They may need to show sixty before the client '
                 + 'picks fifteen, and a number from you reads as a target.'],
        ['Week 2', 'Talent starts the same day. Two weeks ago she would have started after '
                 + 'signature, and the client would have waited.'],
        ['Week 3', 'Leadership checks the quotation and it appears in **To send**. You copy the '
                 + 'link into your own email. The client hears from you, as always.'],
        ['Week 3', 'Press **I have sent it**. Now it is on their record, not only in your '
                 + 'sent folder.'],
        ['Week 4', 'They pick. The deal moves to Won and account management takes the client.'],
      ],
    },
    vs: {
      good: [
        'Tell a founder the moment a deal looks real, so talent start weeks before it closes.',
        'Every deal has a next step and a date, or it is not being worked.',
        'The budget goes on the deal as soon as you hear it, even if it is a range.',
        'A lost deal keeps its reason. "They went with two brands only" is worth more than '
        + 'the deal was.',
        'You send the client link yourself and then say you have sent it.',
      ],
      bad: [
        'Waiting for signature before telling talent. This is the one that has cost us weeks '
        + 'on every campaign so far.',
        'Telling talent how many creators to find. It reads as a target and they stop short.',
        'Quoting a price that is not on the rate card without a founder saying so.',
        'A board full of deals with no next step. It looks busy and tells you nothing.',
        'Handing a client over in a conversation. If it is not written down, it did not happen.',
      ],
    },
    card: [
      ['Open first', ['Sales. Your whole board.',
                      'To send. Anything leadership has cleared.']],
      ['The one rule', ['Get talent started when it looks real, not when it closes.']],
      ['Say what, not how many', ['A client signing fifteen may need to see hundreds.']],
      ['Never', ['Never quote off the rate card without a founder.',
                 'You see sell. You never see cost.']],
      ['Every deal', ['A next step and a date. Otherwise it is not being worked.']],
    ],
  },

  /* ─────────────────────────────────────────────────────────────────────────────── */
  'co-founder': {
    flow: ['price', 'collect'],
    flowNote: 'Nothing opens until you have priced it, and nothing leaves until you have '
            + 'cleared it. You are also the second pair of hands when the founder is away.',
    screen: {
      title: 'Rates to agree',
      sub: 'Clients said yes. Nothing opens until we know what we pay',
      url: 'platform.following.ae/work/negotiations',
      side: ['Today', 'Waiting on me', 'Clients', 'Creators', 'Campaigns', 'Finance'],
      on: 'Finance',
      cards: [
        { k: 'Creators to price', v: '26', s: 'across 5 proposals' },
        { k: 'Campaigns held up', v: '5', s: 'none can open' },
        { k: 'Ready to open', v: '0', s: 'priced, waiting on you' },
      ],
      rows: [
        { nm: 'Minimalist  ·  13 confirmed  ·  13 with no rate', tag: '21 days', hot: true },
        { nm: 'Brands For Less  ·  Oman  ·  4 with no rate', tag: '14 days' },
        { nm: 'Talent board: who holds what, and what is late', tag: 'below' },
      ],
      keys: [
        ['card2', 'Longest wait first. The top row is the campaign that has been stuck longest.'],
        ['card1', 'Every one of these is a client who has already said yes and cannot start.'],
        ['row1', 'Open one and put the real negotiated cost against each creator.'],
        ['title', 'The margin moves as you type, before you commit anything.'],
        ['row2', 'When every creator has a rate, the campaign can be opened.'],
        ['menu', 'The talent board underneath: counts, never scores. Where the load is, not who is better.'],
      ],
    },
    story: {
      title: 'Thirteen creators, one afternoon',
      beats: [
        ['Open', 'Minimalist confirmed three weeks ago. Thirteen creators, not one priced, '
               + 'and the campaign cannot open.'],
        ['Why', 'Nobody was chasing it because it lived inside one proposal’s page. '
              + 'That is what this screen exists to stop.'],
        ['Price', 'What we quoted is what we assumed. What we pay is what you negotiate. On '
                + 'the live Lago campaign one creator quoted 6,000 settled at 3,500.'],
        ['Watch', 'The margin updates as you type. You see the consequence of a number '
                + 'before you commit it.'],
        ['Done', 'Thirteen rates agreed, the campaign opens with a real margin instead of '
               + 'acquiring one later.'],
        ['Then', 'The superadmin creates the enrolment links and talent sends them. Each creator '
               + 'signs their own agreement and enters their own bank details. Nobody types a fee.'],
      ],
    },
    vs: {
      good: [
        'Price what clients have already agreed to, before anything else in your day.',
        'Clear rosters fast. Talent genuinely cannot move until you do.',
        'Strike a creator with a reason written down. The reason stops the repeat next month.',
        'Check the talent board when you are allocating, not only when something has gone wrong.',
        'Use the quoted cost as a starting point, never as the answer.',
      ],
      bad: [
        'Leaving a confirmed proposal unpriced. The client has said yes and is waiting on us.',
        'Opening a campaign and agreeing rates afterwards. You are then negotiating with '
        + 'somebody who has already started working.',
        'Approving a creator with no sell price. They cannot be sold, so they are not real.',
        'Letting a payment go out that the client has not funded.',
        'Reading the talent board as a scoreboard. It shows load, not quality.',
      ],
    },
    card: [
      ['Open first', ['Rates. Clients who said yes and cannot start.',
                      'Then Decisions.']],
      ['The one rule', ['Nothing opens until every creator has a real rate.']],
      ['Quoted is not agreed', ['The quote is what we assumed. The rate is what you got.']],
      ['Never', ['Never pay out beyond what the client has funded.',
                 'Never release a creator with no sell price.']],
      ['When the founder is away', ['You are the second pair of hands. Everything of his '
                           + 'comes to you.']],
    ],
  },

  /* ─────────────────────────────────────────────────────────────────────────────── */
  'founder-ceo': {
    flow: ['price', 'collect'],
    flowNote: 'You sit at both ends: what we chase at the start, what leaves the building '
            + 'at the end. Everything a client sees passes you.',
    screen: {
      title: 'Waiting on you',
      sub: 'Nothing here has happened yet',
      url: 'platform.following.ae/work/approvals',
      side: ['Today', 'Waiting on me', 'Requests', 'Desk', 'Clients', 'Finance'],
      on: 'Waiting on me',
      cards: [
        { k: 'Held', v: '3', s: 'oldest 2 days' },
        { k: 'Posts to release', v: '7', s: 'measured, not sent' },
        { k: 'Links to check', v: '2', s: 'quotations' },
      ],
      rows: [
        { nm: 'Account management  ·  send content to Barakat', tag: 'client', hot: true },
        { nm: 'Talent  ·  delete a standing list', tag: 'delete' },
        { nm: '@firaskazma  ·  1.3M views  ·  release to the client', tag: 'results' },
      ],
      keys: [
        ['row1', 'Approving runs the request exactly as it was submitted, on your authority.'],
        ['title', 'Every permission check runs again. You cannot approve somebody into something you '
        + 'could not do yourself.'],
        ['row2', 'A refusal needs a reason. An unexplained no comes back next week as the same request.'],
        ['card1', 'Oldest first. The longest wait is the one somebody has worked around.'],
        ['menu', 'The gate is OFF by default. Deletes and client-facing actions already need you '
        + 'whether it is on or not.'],
      ],
    },
    story: {
      title: 'A post goes live, and a client sees it',
      beats: [
        ['Day 1', 'A creator posts. Account management pastes the link on the campaign’s '
                + '**Performance** tab.'],
        ['Day 1', 'We read it from Instagram within a minute. Plays, likes, comments, '
                + 'engagement, measured and not estimated.'],
        ['Day 1', 'It sits in **Waiting on you**. The client cannot see it.'],
        ['Day 1', 'You release it. Only then does it appear on their Results screen, with '
                + 'the roll-up across every released post.'],
        ['Weekly', 'We re-count it every seven days for a month, then stop. The clock is '
                 + 'stamped once from the first post so it cannot run forever.'],
        ['Never', 'Nothing with a hidden like count is reported as zero. It shows a dash, '
                + 'and the totals say how many could not be read.'],
      ],
    },
    vs: {
      good: [
        'Answer the queue daily. Everything in it is somebody stopped mid-task.',
        'Turn something down with a reason. It stops the same request next week.',
        'Release results as they come, so a client sees the campaign working.',
        'Check the talent board before hiring, not after.',
        'Let the team work in their own lane without asking you.',
      ],
      bad: [
        'Letting the queue sit. The gate turns into a reason people work around the platform.',
        'Approving without reading. The 202 means nothing has happened yet, and it will '
        + 'happen exactly as submitted.',
        'Switching the gate on the day before you travel.',
        'Sending a client anything automatically. No automated email ever reaches a client.',
      ],
    },
    card: [
      ['Open first', ['Waiting on me. Everybody you are blocking.']],
      ['The one rule', ['Nothing reaches a client that you have not seen.']],
      ['Releasing results', ['Campaign, Performance, release. '
                           + 'Re-counted weekly for a month, then it stops.']],
      ['Never', ['No automated email ever reaches a client.',
                 'Cost is never visible to a brand.']],
      ['Downloads', ['Exports are the two founders only, everywhere in the platform.']],
    ],
  },
};

/* ════════════════════════════════════════════════════════════════════════════════════
   TWO CHAPTERS FOR THREE SEATS: ScoutOutreach with ScoutAI, and enrolments.

   Printed in the talent, co-founder and founder manuals only (`for`). Account management
   and business development never see them, in print or in the product, because neither
   tool is theirs to work. The in-product guide carries the same chapters in
   `src/components/console/GuideTalentSections.tsx`; change both.

   `lanes` and `steps` draw a swimlane: each step sits in the lane of whoever does it, so
   "whose turn is it" is answered by where a box is, before anybody reads it. A lane marked
   `machine` is drawn on lime: that work happens without a person.
   ════════════════════════════════════════════════════════════════════════════════════ */
export const SCOUT_SEATS = ['talent-manager', 'co-founder', 'founder-ceo'];

export const SCOUT = {
  for: SCOUT_SEATS,
  title: 'ScoutOutreach and ScoutAI',
  sub: 'ScoutOutreach finds creators who fit a brief and reaches them. ScoutAI talks to the '
     + 'ones who answer and puts their rate on the roster. Talent keeps sourcing beside them.',
  lanes: [
    { name: 'ScoutOutreach', machine: true },
    { name: 'ScoutAI', machine: true },
    { name: 'Talent' },
    { name: 'A founder' },
  ],
  // [lane, row, title, caption lines, span]
  steps: [
    { id: 'find', lane: 0, row: 0, t: 'Find', c: ['AI plans searches: words,', 'places, hashtags'] },
    { id: 'own', extra: true, lane: 2, row: 0, t: 'Your own creators', c: ['By handle, or paste', 'a sheet. Same roster'] },
    { id: 'screen', lane: 0, row: 1, t: 'Screen', c: ['Range, recent posts,', 'real creator, the brief'] },
    { id: 'dm', lane: 0, row: 2, t: 'DM or WhatsApp', c: ['Instagram DM with a', 'tracked link, or alert'] },
    { id: 'chat', lane: 1, row: 3, t: 'ScoutAI chat', c: ['Brief, questions,', 'their rate, a counter'] },
    { id: 'rate', lane: 1, row: 4, span: 2, t: 'Rate on the roster', c: ['ScoutAI files it, or talent adds it.', 'Then Send for review'] },
    { id: 'price', lane: 3, row: 5, t: 'Founder prices', c: ['Price on the row.', 'Margin as they type'] },
    { id: 'ready', lane: 2, row: 6, t: 'Ready', c: ['Back on its roster,', 'ready to sell'] },
    { id: 'prop', lane: 2, row: 7, t: 'Proposal', c: ['Add to proposal.', 'Client picked: Book'] },
  ],
  links: [['find', 'screen'], ['screen', 'dm'], ['dm', 'chat'], ['chat', 'rate'], ['own', 'rate'],
          ['rate', 'price'], ['price', 'ready'], ['ready', 'prop']],
  outreach: [
    'One roster, one brief: location, follower range, language.',
    'Lives at **ScoutOutreach** in the menu, with a live bar: ScoutAI, DMs today, the job it is on. Each roster shows its own strip too.',
    'Screens on follower range, a post in the last 60 days, a real creator and not a business, not clearly based elsewhere.',
    'Then an AI reads each one against the brief, following the team’s own yes and no on that campaign. Every pass has a written reason.',
    'A hashtag search reads the 40 most recent posts from up to 4 hashtags. Light analytics on each creator costs about $0.008.',
    'The DM bot sends from the company’s Instagram, in Chrome on an office PC. The tracked link opens WhatsApp straight into that campaign’s ScoutAI chat.',
    'WhatsApp alerts go to creators in our network, on Meta-approved templates: barter or paid. A paid campaign is never called barter.',
  ],
  ai: [
    'A campaign can run an open call with a code, like **OC-D7F4E**.',
    'ScoutAI answers on WhatsApp, in English. It explains the brief and asks the screening questions set for the campaign.',
    'For paid work it asks their rate, and can counter within that campaign’s negotiation rules.',
    'Creators answer with tap buttons or in their own words.',
    'It adds them to the roster with their rate. A decline or a poor fit is recorded with the reason.',
    'Its chats are kept on the Desk and never ring the team’s bell.',
  ],
  pace: [
    ['10 min', 'It checks every campaign, but never searches while every DM account rests'],
    ['Under 60', 'In a campaign’s DM queue before it searches for more'],
    ['3 hours', 'At least, between two searches on one campaign'],
    ['6 a day', 'Searches at most, across all campaigns'],
    ['12', 'Searches per campaign in total, then it stops and says so'],
    ['40 a day', 'DMs to start, rising by 15 a day to the cap'],
    ['60 to 120 s', 'Between one DM and the next. Campaigns take turns'],
    ['14 days', 'Before anybody is DMed again'],
  ],
  rests: ['20 minutes', '1 hour', '3 hours', '10am tomorrow'],
  roster: [
    ['Needs a rate', 'Add rate', 'Talent'],
    ['ScoutOutreach asked for their rate', 'Nothing', 'It lands by itself'],
    ['ScoutAI is getting their rate', 'Nothing', 'It lands by itself'],
    ['Rate in, send for review', 'Send for review', 'Talent'],
    ['Waiting for a founder to price', 'Price', 'A founder'],
    ['Ready', 'Add to proposal', 'Talent'],
    ['On the proposal’s name', 'Open', 'The client'],
    ['Client picked', 'Book', 'Talent'],
  ],
  sources: [['ScoutOutreach', 'found by ScoutOutreach'], ['ScoutAI (WhatsApp)', 'arrived in a chat'],
            ['Your sheet', 'pasted in by the team'], ['Database', 'from the master database']],
  yours: {
    'talent-manager': [
      'Keep adding your own creators, by handle or by pasting a sheet.',
      'Glance at the live bar on **ScoutOutreach** during the day.',
      'Work each row from its next step. Rows ScoutOutreach or ScoutAI are working need nothing from you.',
      'Say yes or no on what it finds. That teaches the screening.',
      'Bot stopped and needs a person: sign in on the bot PC, then **Resume**.',
    ],
    'co-founder': [
      'Set **Who fits** on each campaign: location, follower range, language.',
      'Say yes or no on what it finds. The screening learns from it.',
      'Price what talent sends for review. It goes back to the roster as **Ready**.',
      'Bot stopped and needs a person: somebody signs in on the bot PC, then **Resume**.',
    ],
    'founder-ceo': [
      'Set **Who fits** on each campaign: location, follower range, language.',
      'Say yes or no on what it finds. The screening learns from it.',
      'Price what talent sends for review. It goes back to the roster as **Ready**.',
      'Bot stopped and needs a person: somebody signs in on the bot PC, then **Resume**.',
    ],
  },
};

export const ENROL = {
  for: SCOUT_SEATS,
  title: 'Enrolments, start to finish',
  sub: 'The paperwork that lets us pay a booked creator: agreement, details, address, passport '
     + 'and bank. Only the superadmin sets one up. Talent sends it and sees it through.',
  lanes: [
    { name: 'Client' },
    { name: 'A founder' },
    { name: 'Platform', machine: true },
    { name: 'Talent' },
    { name: 'Creator' },
  ],
  steps: [
    { id: 'yes', lane: 0, row: 0, t: 'Confirms', c: ['Picks creators', 'on the proposal'] },
    { id: 'cost', lane: 1, row: 1, t: 'Settles cost', c: ['What we really', 'pay each one'] },
    { id: 'link', lane: 1, row: 2, t: 'Creates link', c: ['Send link on the', 'proposal panel'] },
    { id: 'tell', lane: 2, row: 3, t: 'Tells talent', c: ['On the bell', 'and by email'] },
    { id: 'send', lane: 3, row: 4, t: 'Sends it', c: ['On WhatsApp,', 'the same day'] },
    { id: 'fill', lane: 4, row: 5, t: 'Fills it in', c: ['Code, details,', 'sign, passport, bank'] },
    { id: 'check', lane: 2, row: 6, t: 'Payee check', c: ['Own name, passport,', 'not a company'] },
    { id: 'pay', lane: 1, row: 7, t: 'Releases pay', c: ['Payables, then', 'Payout runs'] },
  ],
  links: [['yes', 'cost'], ['cost', 'link'], ['link', 'tell'], ['tell', 'send'], ['send', 'fill'],
          ['fill', 'check'], ['check', 'pay']],
  creator: [
    ['Email', 'Verifies their email with a code.'],
    ['Details', 'Name, contact and address. New links ask **Home** or **Office**. A home is a villa or an apartment: number, floor, building or community. An office has the company name.'],
    ['Agreement', 'Reads and signs it.'],
    ['Passport', 'Uploads it. The system reads the name and the expiry.'],
    ['Bank', 'Gives an IBAN, or for an exchange-house payout, the city they collect in.'],
  ],
  payee: [
    'The bank account is in the creator’s own signed name. A shortened surname still counts.',
    'A passport is uploaded.',
    'It is not a company account.',
    'Anything else comes to a person, with the reason shown.',
  ],
  passport: [
    'The system checks the name and the expiry date.',
    'A mismatch comes to a person, on the enrolment record.',
    '**Looks right** accepts it. **Send back** reopens the creator’s passport step.',
    'After a send back, talent tells the creator. They will not know otherwise.',
  ],
  where: [
    ['Campaigns, then Enrolments', 'Every enrolment. Each record links to its brand, campaign and proposal.'],
    ['The proposal panel', '**Send link** for each creator, and **See its enrolments** for just that proposal.'],
    ['Finance: Payables, Payout runs', 'Where the money goes next. Only founders release it.'],
  ],
  yours: {
    'talent-manager': [
      'The bell and an email say **Send @creator their enrolment link**. The link is inside.',
      'Send it on WhatsApp the same day. Never post a link anywhere public.',
      'Chase anyone who has not finished. Campaigns, then Enrolments, shows who is where.',
      'Answer their questions about the form. Money questions go to a founder.',
    ],
    'co-founder': [
      'You do not create links; the superadmin does. You keep them moving.',
      'Check passports that did not match: **Looks right** or **Send back**.',
      'Confirm a payee that did not confirm itself, reading the reason first.',
      'Release payments in Payables and Payout runs.',
    ],
    'founder-ceo': [
      'Settle each confirmed creator’s real cost on the proposal first.',
      'Create the link: **Send link** on the proposal panel, or from Enrolments.',
      'Check passports that did not match, and payees that did not confirm themselves.',
      'Release payments in Payables and Payout runs.',
    ],
  },
};

/* The words that mean something specific here. Printed in every manual, because the
   confusion is the same for everybody and it is always vocabulary. */
export const GLOSSARY = [
  ['Brand', 'A company we are talking to. Becomes a client when a deal is won.'],
  ['Client', 'A brand that has bought something. They have an account and can log in.'],
  ['Deal', 'One conversation about money. A brand can have many, over years.'],
  ['Campaign', 'A deal that was won and opened. Real creators, real money.'],
  ['Roster', 'The creators sourced for one brand, for its whole life. It replaced the sheet.'],
  ['Skip', 'Not for this campaign. Still in the database; the reason follows them.'],
  ['Open call', 'A campaign card creators answer on WhatsApp. The agent collects their price.'],
  ['ScoutOutreach', 'Finds creators for a brief, screens them, and DMs them on Instagram.', SCOUT_SEATS],
  ['ScoutAI', 'Talks to creators on WhatsApp and puts their rate on the roster.', SCOUT_SEATS],
  ['Following Track', 'Short links per creator. Clicks, carts and sales, shown to the brand once released.'],
  ['List', 'A standing question: "fashion, UAE". Answers itself. Never client-specific.'],
  ['Cost', 'What we pay a creator. Founders and talent only. Never shown to a brand.'],
  ['Sell', 'What we charge a client. A creator with no sell price cannot be sold.'],
  ['Quoted cost', 'What we assumed when pricing. Rarely what we end up paying.'],
  ['Agreed rate', 'What a creator actually accepted. The only number that is real.'],
  ['Request', 'Something somebody is waiting on, with an owner and a date.'],
  ['Proposal', 'A priced roster sent to a client to choose from.'],
  ['Share link', 'A /p/ link a client opens without logging in. Mint it, then send it.'],
  ['Enrolment link', 'A founder creates it, talent sends it, the creator signs and gives their own bank.'],
  ['The ladder', 'The rungs a booked creator climbs: briefed, content in, posted, paid.'],
  ['Held', 'Stopped until a founder answers. Nothing has happened yet.'],
];
