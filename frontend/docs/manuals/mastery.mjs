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
    flowNote: 'Business development hands you a brief before the deal closes. You hand a '
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
        ['Tue 9am', 'A request appears: **Source creators for Minimalist**. Skincare and '
                  + 'derm, UAE, 50k to 300k, must film in studio. Aisha raised it, and the '
                  + 'deal is not even signed yet. Press **I have this**.'],
        ['Tue 9am', 'The roster is already open under the request. You never make one.'],
        ['Tue', 'Start in **Lists**. Beauty UAE is 53 people and it is current, because '
              + 'it answers itself every time you open it. Thirty of them fit.'],
        ['Tue', 'Then the master database for the rest. Anyone genuinely new, add by handle '
              + 'and we pull their numbers ourselves.'],
        ['Wed', 'Nobody told you to find twenty. You find enough that the client has a real '
              + 'choice, which on skincare is usually sixty before they pick fifteen.'],
        ['Wed', 'Record what each one charges and what they would accept. Those are two '
              + 'different numbers and only the second one is real.'],
        ['Thu', 'Hand the roster up. Hajar clears it and the client sees it the same day.'],
        ['After', 'Hajar negotiates the final rate. You raise the enrolment links, and each '
                + 'creator signs their own agreement and enters their own bank details.'],
      ],
    },
    vs: {
      good: [
        'Everything you find goes on the roster, the same hour you find it.',
        'A price is recorded as two numbers: what they ask, what they agreed.',
        'A creator you cannot place in a country is still worth adding; say so in the note.',
        'When a brief is missing market, category or budget, you ask before you start.',
        'You take a request the moment you start it, so nobody duplicates your work.',
      ],
      bad: [
        'Sourcing into a spreadsheet and uploading at the end. Nobody can see progress, and '
        + 'the half you have done looks like nothing.',
        'Recording only the published rate. We then sell at a margin that does not exist.',
        'Guessing a country code on a phone number. We once sent a Saudi creator’s '
        + 'signing link to a stranger in the UAE.',
        'Agreeing a fee in WhatsApp and typing it in later. The number drifts, every time.',
        'Leaving a request unclaimed while you work on it. Somebody else starts it too.',
      ],
    },
    card: [
      ['Open first', ['Requests. Take what is yours.',
                      'Anything late, before anything new.']],
      ['The one rule', ['If it is not on the screen it did not happen. '
                      + 'WhatsApp is not a record.']],
      ['Two numbers, always', ['What they charge. What they agreed. Never just one.']],
      ['Never', ['Never guess a country code.',
                 'Never promise a creator a fee before Hajar has agreed it.']],
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
        ['row3', 'Performance is where you paste a live post. Zain releases it to the client.'],
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
        ['Tue', 'Aqsa takes it. You can see that without asking her.'],
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
      ['Results', ['Paste the live post on Performance. Zain releases it. '
                 + 'The client sees the roll-up themselves.']],
    ],
  },

  /* ─────────────────────────────────────────────────────────────────────────────── */
  'business-development': {
    flow: ['find', 'agree'],
    flowNote: 'You start everything. The earlier you press Ask talent, the less of the '
            + 'client’s patience is spent waiting for names.',
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
        ['row1', 'Ask talent. Press it when the deal looks real, NOT when it closes.'],
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
        ['Week 2', 'It feels real. Do not wait. Press **Ask talent** and write what you '
                 + 'are looking for: skincare and derm, UAE, 50k to 300k, studio capable.'],
        ['Week 2', 'Say WHAT, never how many. They may need to show sixty before the client '
                 + 'picks fifteen, and a number from you reads as a target.'],
        ['Week 2', 'Aqsa starts the same day. Two weeks ago she would have started after '
                 + 'signature, and the client would have waited.'],
        ['Week 3', 'Zain checks the quotation and it appears in **To send**. You copy the '
                 + 'link into your own email. The client hears from you, as always.'],
        ['Week 3', 'Press **I have sent it**. Now it is on their record, not only in your '
                 + 'sent folder.'],
        ['Week 4', 'They pick. The deal moves to Won and account management takes the client.'],
      ],
    },
    vs: {
      good: [
        'Ask talent the moment a deal looks real, weeks before it closes.',
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
                      'To send. Anything Zain has cleared.']],
      ['The one rule', ['Ask talent when it looks real, not when it closes.']],
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
            + 'cleared it. You are also the second pair of hands when Zain is away.',
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
        ['Then', 'Aqsa raises the enrolment links. Each creator signs their own agreement '
               + 'and enters their own bank details. Nobody types a fee.'],
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
      ['When Zain is away', ['You are the second pair of hands. Everything of his '
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
        { nm: 'Sana  ·  send content to Barakat', tag: 'client', hot: true },
        { nm: 'Aqsa  ·  delete a standing list', tag: 'delete' },
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
        ['Day 1', 'A creator posts. Sana pastes the link on the campaign’s '
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
      ['Downloads', ['Exports are you and Hajar only, everywhere in the platform.']],
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
  ['Roster', 'The creators sourced for one client. Has rounds, a brief and an owner.'],
  ['List', 'A standing question: "fashion, UAE". Answers itself. Never client-specific.'],
  ['Cost', 'What we pay a creator. Founders and talent only. Never shown to a brand.'],
  ['Sell', 'What we charge a client. A creator with no sell price cannot be sold.'],
  ['Quoted cost', 'What we assumed when pricing. Rarely what we end up paying.'],
  ['Agreed rate', 'What a creator actually accepted. The only number that is real.'],
  ['Request', 'Something somebody is waiting on, with an owner and a date.'],
  ['Proposal', 'A priced roster sent to a client to choose from.'],
  ['Share link', 'A /p/ link a client opens without logging in. Mint it, then send it.'],
  ['Enrolment link', 'How a creator signs. They enter their own bank details; nobody types a fee.'],
  ['The ladder', 'The rungs a booked creator climbs: briefed, content in, posted, paid.'],
  ['Held', 'Stopped until a founder answers. Nothing has happened yet.'],
];
