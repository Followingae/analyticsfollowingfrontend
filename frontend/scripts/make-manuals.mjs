/**
 * Print the team manual.
 *
 *   node scripts/make-manuals.mjs "<output folder>"
 *
 * ONE BOOK. Part one is the Client Operations SOP (who talks to the client, handoffs,
 * urgent or not, hours and cover, how a campaign runs, our turnaround times, the client's,
 * the month, store visits, approvals, barter and paid, escalation, how we write) with the
 * screen each rule lands on. Part two is a desk per role: the day, the screen, the menu,
 * the jobs with what to click in order, a real one, right and wrong, the hard rules, a
 * quick card. "Following Team Manual.pdf" carries every desk; "Manual - <role>.pdf" carries
 * part one and that desk only.
 *
 * Every screen name is read out of `src/lib/destinations.ts`, the one registry the sidebar,
 * the command palette and every hub header take their labels from. A path chip that is not
 * a sidebar item, a tab or an action FAILS the build rather than printing.
 *
 * The look is docs/manuals/design.mjs: the one settled on 19 October 2026 and asked for
 * again on 16 November ("we built beautiful team manuals, enhance those").
 */
import { chromium } from 'playwright';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CSS, CREAM, FAINT, INK, LIME, LINE, MUTED, PAPER, WASH, icon } from '../docs/manuals/design.mjs';
import { ADMIN, MENU, ROLES, TABS } from '../docs/manuals/roles.mjs';
import { ENROL, FLOW, GLOSSARY, MASTERY, SCOUT } from '../docs/manuals/mastery.mjs';
import { APPROVALS, BARTER, CALENDAR, CHECKLIST, COVER, ESCALATION, HANDOFFS, HOURS, REVIEWS,
  SEATS, SOP, STAGES, TAT, URGENT, VISITS, WALL, WRITING } from '../docs/manuals/sop.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FE = resolve(HERE, '..');
const OUT = resolve(process.argv[2] || join(FE, 'docs', 'manuals', 'out'));
const PUBLIC = process.argv[3] === '' ? null
  : resolve(process.argv[3] || join(FE, 'public', 'guides'));
/* The folder they are READ from. The 19 October set lived here and this is where the
   founder pointed when he asked for that set back. */
const DESKTOP = [
  join(homedir(), 'Desktop', 'Following', 'Following Manuals'),
  join(homedir(), 'Desktop', 'Following Manuals'),
  join(homedir(), 'OneDrive', 'Desktop', 'Following Manuals'),
].find((d) => existsSync(d)) || null;
/* The navy set of 16 November was printed here. It is removed on every run so nobody
   opens it by mistake. */
const STALE = join(homedir(), 'Desktop', 'Following App', 'Following Manuals');

// ── The one source of names ─────────────────────────────────────────────────────────────
const destSrc = readFileSync(join(FE, 'src', 'lib', 'destinations.ts'), 'utf8');
const DEST = {};
for (const m of destSrc.matchAll(/'(\/[^']+)':\s*\{([\s\S]*?)\n\s*\},/g)) {
  const [, path, body] = m;
  const field = (k) => {
    const v = (body.match(new RegExp(`${k}:\\s*'((?:[^'\\\\]|\\\\.)*)'`)) || [])[1];
    return v == null ? null : v.replace(/\\(.)/g, '$1');
  };
  DEST[path] = { short: field('short'), full: field('full'), hint: field('hint') };
}
if (Object.keys(DEST).length < 40) {
  throw new Error(`Only parsed ${Object.keys(DEST).length} destinations: the registry format moved.`);
}
/* The sidebar hard-codes two labels that differ from the registry. The manual says what the
   screen says. */
const SIDEBAR_LABELS = { '/work/today': 'Today', '/work/inbox': 'Waiting on me' };
const nameOf = (path) => {
  if (SIDEBAR_LABELS[path]) return SIDEBAR_LABELS[path];
  const d = DEST[path];
  if (!d?.short) throw new Error(`No name in destinations.ts for ${path}`);
  return d.short;
};
const hintOf = (path) => DEST[path]?.hint ?? '';

const SIDEBAR = MENU.flatMap((g) => g.rows.map((r) => nameOf(r.path)));
const TAB_NAMES = new Set(Object.values(TABS).flat().map(nameOf));
const ADMIN_NAMES = new Set(Object.values(ADMIN).flat().map(nameOf));
const KNOWN = new Set([
  ...SIDEBAR, ...TAB_NAMES, ...ADMIN_NAMES,
  'Admin', 'Company', 'Settings', 'Creator app',
  'Story', 'Delivery', 'Content', 'Performance', 'Links',
]);
const isAction = (s) => /^(Open|Add|Ask|Raise|Share|Mint|Money|Set|Send|Create)\b/.test(s)
  || s === 'Share link' || s === 'Money';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const md = (s) => esc(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
const sep = () => `<span class="sep">${icon('chevron', 11)}</span>`;

/** The route as chips, in the order you click: sidebar dark, tab outlined, action lime. */
function pathStrip(chips, where, lbl = 'Go to') {
  const out = chips.map((c, i) => {
    if (!KNOWN.has(c) && !isAction(c)) {
      throw new Error(`"${c}" (in ${where}) is not a sidebar item, a tab, or an action.\n`
        + `  Sidebar: ${SIDEBAR.join(', ')}\n  Tabs: ${[...TAB_NAMES].join(', ')}\n`
        + `  Admin: ${[...ADMIN_NAMES].join(', ')}`);
    }
    const cls = i === 0 ? 'chip start' : (KNOWN.has(c) ? 'chip' : 'chip act');
    return `<span class="${cls}">${esc(c)}</span>`;
  });
  return `<div class="path"><span class="lbl">${esc(lbl)}</span>${out.join(sep())}</div>`;
}

/** The brand's signature: the LAST word of a heading in Playfair italic against Manrope. */
function serifLast(text) {
  const words = String(text).trim().split(/\s+/);
  if (words.length < 2) return esc(text);
  const last = words.pop();
  return `${esc(words.join(' '))} <em>${esc(last)}</em>`;
}
const opener = (n) => `<div class="opener"><span class="n">${esc(n)}</span><span class="bar"></span></div>`;
const head = (n, title, sub) => `${opener(n)}<h2>${serifLast(title)}</h2>${sub ? `<p class="sub">${md(sub)}</p>` : ''}`;
const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

// ── Covers ──────────────────────────────────────────────────────────────────────────────
const tocList = (lbl, items) => `<div><div class="lbl">${esc(lbl)}</div><ol>${
  items.map((t) => `<li>${esc(t)}</li>`).join('')}</ol></div>`;

/** The front of the book. `desks` is the list of role titles inside. */
const bookCover = (title, ser, lede, partA, desks) => `
  <div class="cover">
    <div class="brand"><span class="dot"></span>Following</div>
    <div class="contents"><div class="two">
      ${tocList('How we work', partA)}
      ${tocList('Your desk', desks)}
    </div></div>
    <div class="mid">
      <div class="kicker">Team manual · ${esc(SOP.doc)} v${esc(SOP.version)}</div>
      <h1>${esc(title)}</h1>
      <p class="for"><span class="ser">${esc(ser)}</span></p>
      <p class="lede">${esc(lede)}</p>
    </div>
    <div class="foot">
      <div><div class="who">Following FZC</div>Internal, not for clients</div>
      <div>${esc(today)}</div>
    </div>
  </div>`;

/** A role's own opener, inside the book. */
const roleCover = (role) => `
  <div class="cover role">
    <div class="brand"><span class="dot"></span>Following</div>
    <div class="mid">
      <div class="kicker">${esc(role.kicker)}</div>
      <h1>${esc(role.title)}</h1>
      <p class="for"><span class="ser">${esc(role.promise || 'What this desk owns')}</span></p>
      <p class="lede">${esc(role.lede)}</p>
    </div>
    <div class="foot">
      <div><div class="who">Your desk</div>What you open, what you do, what to click</div>
      <div>${esc(today)}</div>
    </div>
  </div>`;

// ── The desk pieces (19 October 2026) ───────────────────────────────────────────────────
const dayTimeline = (day) => `
  <div class="tl">${day.map((d) => `
    <div class="mo">
      <span class="dot">${icon(d.icon, 10)}</span>
      <div class="hd">${esc(d.head)}</div>
      <ul>${d.items.map((i) => `<li>${md(i)}</li>`).join('')}</ul>
    </div>`).join('')}
  </div>`;

const flowRibbon = (mine) => `
  <div class="flow">${FLOW.map((f) => `
    <div class="st${mine.includes(f.key) ? ' on' : ''}">
      <div class="who">${esc(f.who)}</div>
      <div class="wt">${esc(f.what)}</div>
    </div>`).join('')}
  </div>
  <p class="flow-key"><span class="sw"></span> Your part</p>`;

function drawnScreen(sc) {
  const n = {};
  sc.keys.forEach(([region], idx) => { if (!(region in n)) n[region] = idx + 1; });
  const pin = (region, style) => (region in n) ? `<span class="pin" style="${style}">${n[region]}</span>` : '';
  return `
  <div class="shot">
    <div class="bar"><span class="d"></span><span class="d"></span><span class="d"></span><span class="u">${esc(sc.url)}</span></div>
    <div class="body">
      <div class="side">${sc.side.map((it) => `
        <div class="it${it === sc.on ? ' on' : ''}">${esc(it)}${it === sc.on ? pin('menu', 'top:50%;right:7px;transform:translateY(-50%)') : ''}</div>`).join('')}
      </div>
      <div class="main">
        <div style="position:relative;display:inline-block">
          <div class="h1">${esc(sc.title)}</div><div class="h2">${esc(sc.sub)}</div>
          ${pin('title', 'top:-6px;right:-22px')}
        </div>
        <div class="cards">${(sc.cards || []).map((c, ci) => `
          <div class="card" style="position:relative">${pin('card' + (ci + 1), 'top:-7px;right:-7px')}
            <div class="k">${esc(c.k)}</div><div class="v">${esc(c.v)}</div><div class="s">${esc(c.s)}</div></div>`).join('')}
        </div>
        <div class="rowz">${(sc.rows || []).map((r, ri) => `
          <div class="r" style="position:relative">${pin('row' + (ri + 1), 'top:50%;left:-8px;transform:translateY(-50%)')}
            <span class="nm">${esc(r.nm)}</span><span class="tag${r.hot ? ' hot' : ''}">${esc(r.tag)}</span></div>`).join('')}
        </div>
      </div>
    </div>
  </div>
  <ul class="keys">${sc.keys.map(([, text], idx) => `<li><span class="n">${idx + 1}</span><span>${md(text)}</span></li>`).join('')}</ul>`;
}

const menuMap = (slug) => `
  <div class="menu">${MENU.map((g) => {
    const rows = g.rows.filter((r) => !r.only || r.only.includes(slug));
    if (!rows.length) return '';
    return `${g.group ? `<div class="grp">${esc(g.group)}</div>` : ''}${rows.map((r) => `
      <div class="row"><span class="nm">${icon(r.icon, 14)}${esc(nameOf(r.path))}</span><span class="ds">${esc(hintOf(r.path))}</span></div>`).join('')}`;
  }).join('')}
  </div>`;

const menuExtras = () => `
  <div class="grid3 gap">
    <div class="yours"><div class="ttl">${icon('building', 14)} Admin, Company</div><ul class="plain">${ADMIN.Company.map((p) => `<li>${esc(nameOf(p))}</li>`).join('')}</ul></div>
    <div class="yours"><div class="ttl">${icon('shield', 14)} Admin, Settings</div><p class="note" style="margin:0">Founders only. ${esc(ADMIN.Settings.map(nameOf).join(', '))}.</p></div>
    <div class="yours"><div class="ttl">${icon('megaphone', 14)} Inside a campaign</div><p class="note" style="margin:0">Story, Delivery, Content, Performance, Links. Money only for those allowed to see it.</p></div>
  </div>`;

const jobCard = (job, n, role) => `
  <div class="job">
    <div class="top"><span class="badge">${n}</span><div><h3>${esc(job.title)}</h3>${job.when ? `<div class="when">${esc(job.when)}</div>` : ''}</div></div>
    ${job.path ? pathStrip(job.path, `${role} / ${job.title}`) : ''}
    <ol class="steps">${job.steps.map((s) => `<li>${md(s)}</li>`).join('')}</ol>
    ${job.next ? `<div class="next">${icon('check', 13)}<span><b>Next:</b> ${md(job.next)}</span></div>` : ''}
  </div>`;

const workedExample = (st) => `
  <div class="story">
    <div class="hd">${icon('lightbulb', 15)} <span>Start to finish</span></div>
    <div class="bd">${st.beats.map(([t, x]) => `<div class="beat"><div class="t">${esc(t)}</div><div class="x">${md(x)}</div></div>`).join('')}</div>
  </div>`;

const goodAndBad = (vs) => `
  <div class="vs">
    <div class="col good"><div class="ttl">${icon('check', 14)} What good looks like</div><ul>${vs.good.map((x) => `<li>${md(x)}</li>`).join('')}</ul></div>
    <div class="col bad"><div class="ttl">${icon('x', 14)} What has actually gone wrong</div><ul>${vs.bad.map((x) => `<li>${md(x)}</li>`).join('')}</ul></div>
  </div>`;

const glossary = () => `
  <div class="gloss">${GLOSSARY.map(([w, d]) => `<div class="t"><div class="w">${esc(w)}</div><div class="d">${esc(d)}</div></div>`).join('')}</div>`;

const quickCard = (role, blocks) => `
  <div class="card-page"><div class="qr">
    <div class="hd"><h2>${esc(role.title)}</h2><span class="r">Quick card</span></div>
    ${blocks.map(([lbl, items]) => `<div class="blk"><div class="lbl">${esc(lbl)}</div><ul>${items.map((i) => `<li>${md(i)}</li>`).join('')}</ul></div>`).join('')}
    <div class="foot"><span>Following</span><span>Pin this up. The rest of the manual explains it.</span></div>
  </div></div>`;

// ── Part one: how we work ───────────────────────────────────────────────────────────────
const tb = (cols, headRow, rows, cls = '') => `
  <div class="tb ${cls}" style="--c: ${cols}">
    ${headRow ? `<div class="h">${headRow.map((h) => `<span>${esc(h)}</span>`).join('')}</div>` : ''}
    ${rows.map((r) => `<div class="r">${r.join('')}</div>`).join('')}
  </div>`;
const k = (t, small) => `<span class="k">${md(t)}${small ? `<small>${md(small)}</small>` : ''}</span>`;
const t = (x, out) => `<span><span class="t${out ? ' out' : ''}">${esc(x)}</span></span>`;
const who = (x) => `<span class="who">${esc(x)}</span>`;
const m = (x) => `<span class="m">${md(x)}</span>`;

const sopPages = [
  // 01 ─────────────────────────────────────────────────────────────────────────────────
  `<section>
    ${head('01 · The team', 'Who does what, and who talks to the client',
      'Every client has one Account Manager, one Talent Manager and one BDM. Only the AM talks to the client. Everyone else talks to the AM.')}
    <div class="seats">${SEATS.map((s) => `
      <div class="seat${s.client ? ' client' : ''}"><span class="ab">${esc(s.ab)}</span>
        <div class="nm">${esc(s.nm)}</div><div class="man">${esc(s.man)}</div><div class="own">${md(s.own)}</div></div>`).join('')}
    </div>
    <p class="note gap">Solid lines in the SOP show reporting and escalation; the arrows show daily coordination in the internal ops group. The AM and the TM go through open items at 09:30 every day. The BDM joins on Mondays.</p>
  </section>`,

  // 02 ─────────────────────────────────────────────────────────────────────────────────
  `<section>
    ${head('02 · Handoffs', 'What moves between us, and where it lands',
      'Done in the internal ops group, never in the client group. Each handoff has a screen. If it is not on that screen, the next person cannot see it.')}
    ${tb('1.3fr .6fr 19mm 1.2fr', ['What', 'From, to', 'When', 'Where it lands'], HANDOFFS.map(([w, s, from, to, when, path]) => [
      k(w, s), `<span class="who"><b>${esc(from)}</b> → ${esc(to)}</span>`, t(when), `<span>${pathStrip(path, 'Handoffs / ' + w, '')}</span>`]))}
  </section>`,

  // 03 ─────────────────────────────────────────────────────────────────────────────────
  `<section>
    ${head('03 · Urgent or not', 'Clients will call many things urgent',
      'Ask one question. The answer sets the reply time, and nothing else does.')}
    <div class="ask">
      <div class="q"><div class="lbl">The one question</div><div class="big">${esc(URGENT.question)}</div>
        <div class="s">A new request arrives in the client group. Whoever reads it answers it, then asks this.</div></div>
      <div class="a yes"><div class="ans">Yes</div><div class="hd">${esc(URGENT.yes.hd)}</div><div class="do">${esc(URGENT.yes.do)}</div>
        <ul>${URGENT.yes.eg.map((e) => `<li>${esc(e)}</li>`).join('')}</ul></div>
      <div class="a no"><div class="ans">No</div><div class="hd">${esc(URGENT.no.hd)}</div><div class="do">${esc(URGENT.no.do)}</div>
        <ul>${URGENT.no.eg.map((e) => `<li>${esc(e)}</li>`).join('')}</ul></div>
    </div>
    <div class="yours gap2"><div class="ttl">${icon('hand', 14)} Then log it, the same day</div>
      <p style="margin:0 0 3mm;font-size:9.6pt;line-height:1.6">${md(URGENT.log)}</p>
      ${pathStrip(['Requests', 'Raise one'], 'Urgent / log')}</div>
  </section>`,

  // 04 ─────────────────────────────────────────────────────────────────────────────────
  `<section>
    ${head('04 · Hours', 'What gets answered after 17:00, and how fast',
      'Office hours are 09:00 to 17:00, Monday to Friday. One Account Manager is on call until 23:00 and at weekends. Everyone else is off.')}
    <div class="clock"><div>Off</div><div></div><div class="office">Office 09:00 to 17:00</div><div class="call">On call to 23:00</div><div></div></div>
    <div class="clock-key"><span>00:00</span><span>08:00</span><span>09:00</span><span>17:00</span><span>23:00</span></div>
    ${tb('20mm 1fr 20mm 26mm 30mm', ['Type', 'What it is', 'Office hours', 'On call, to 23:00', '23:00 to 08:00'], HOURS.map(([ty, what, a, b, c]) => [
      k(ty), m(what), t(a), t(b), `<span class="m">${esc(c)}</span>`]), 'tight')}
    <p class="note">Planned items seen after hours get a reply with a time. The work is delivered the next working day by 12:00.</p>
  </section>`,
  `<section>
    ${head('05 · Cover', 'Evenings and weekends', 'One Account Manager is on call. Everyone else is off. The rota is posted on Thursday; Friday 16:00 is the handover.')}
    <h3 class="lbl">The week</h3>
    <div class="week">${COVER.days.map(([d, blocks, note]) => `
      <div class="d"><div class="n">${esc(d)}</div>${blocks.map((b) => b === 'office' ? `<div class="blk office">Office<br>09 to 17</div>`
        : b === 'call' ? `<div class="blk call">On call<br>to 23:00</div>` : `<div class="blk call">On call<br>08 to 23</div><div class="blk off">Everyone else off</div>`).join('')}
        ${note ? `<div class="note">${esc(note)}</div>` : ''}</div>`).join('')}
    </div>
    <div class="cols gap">
      <div class="col on"><div class="ttl">${icon('phone', 14)} The on-call AM</div><ul>${COVER.oncall.map((x) => `<li>${md(x)}</li>`).join('')}</ul></div>
      <div class="col"><div class="ttl">${icon('calendar', 14)} Friday 16:00 handover</div><ul>${COVER.friday.map((x) => `<li>${md(x)}</li>`).join('')}</ul></div>
      <div class="col"><div class="ttl">${icon('moon', 14)} Everyone else</div><ul>${COVER.everyone.map((x) => `<li>${md(x)}</li>`).join('')}</ul></div>
    </div>
  </section>`,

  // 05 ─────────────────────────────────────────────────────────────────────────────────
  `<section>
    ${head('06 · The campaign', 'How a campaign runs',
      'Eight stages, four checks. Outlined times are the client’s. A check must be done before the next stage starts. Under each stage, the screen it runs on.')}
    <div class="stages">${STAGES.map((s) => `
      <div class="st"><div class="top"><span class="n">${s.n}</span><span class="t${s.client ? ' client' : ''}">${esc(s.t)}</span></div>
        <div class="wt">${esc(s.wt)}</div><div class="who">${esc(s.who)}</div><div class="x">${esc(s.x)}</div>
        ${s.chk ? `<div class="chk">${icon('check', 12)}<span>${esc(s.chk)}</span></div>` : ''}
        <div style="margin-top:2.5mm">${pathStrip(s.path, 'Stage ' + s.n, '')}</div></div>`).join('')}
    </div>
    <p class="note gap">If a step on the client’s side runs late, posting dates move by the same amount, confirmed in writing by the AM.</p>
  </section>`,
];

sopPages.push(
  // 06 ─────────────────────────────────────────────────────────────────────────────────
  `<section>
    ${head('07 · Our times', 'Our turnaround times',
      'Office hours unless live. Same day means by 17:00. These are promises to the client, so they are also what Chasing and Requests count against.')}
    <div class="grid2">
      <div><h3 class="lbl">Replies and setup</h3>${tb('1fr 15mm 20mm', null, TAT.setup.map(([w, o, x]) => [k(w), who(o), t(x)]), 'tight')}</div>
      <div><h3 class="lbl">Content and results</h3>${tb('1fr 15mm 20mm', null, TAT.content.map(([w, o, x]) => [k(w), who(o), t(x)]), 'tight')}</div>
    </div>
  </section>`,

  // 07 ─────────────────────────────────────────────────────────────────────────────────
  `<section>
    ${head('08 · The client’s times', 'What we need from the client, and when',
      'Agreed at kickoff. If the client is late, our dates move by the same amount, confirmed in writing.')}
    <div class="grid2">
      <div>${tb('1fr 28mm', ['From the client', 'Time'], TAT.client.map(([w, x]) => [k(w), t(x, true)]), 'tight')}</div>
      <div>
        <h3 class="lbl">Fastest brief to first post</h3>
        <div class="bars">${TAT.fastest.map(([lab, d]) => `<div class="row"><span class="lab">${esc(lab)}</span><span class="bar"><i style="width:${d * 10}%"></i></span><span class="v">${d} days</span></div>`).join('')}
          <div class="axis"><span></span><span class="ticks"><span>0</span><span>2</span><span>4</span><span>6</span><span>8</span><span>10</span></span><span>working days</span></div></div>
        <div class="yours gap"><div class="ttl">${icon('clock', 14)} Less notice than this?</div>
          <p style="margin:0;font-size:9.4pt;line-height:1.55">The AM replies within 15 minutes with what is possible, and raises it as a Request so the new date is on the record.</p></div>
      </div>
    </div>
  </section>`,

  // 08 ─────────────────────────────────────────────────────────────────────────────────
  `<section>
    ${head('09 · The month', 'Monthly campaign calendar',
      'For monthly and ongoing clients. Next month is locked by the 20th, so promotions do not arrive days before they start.')}
    <div class="cal">${Array.from({ length: 32 }, (_, i) => i + 1).map((d) => {
      const lab = d === 32 ? '1' : String(d); const cls = d === 32 ? 'live' : (CALENDAR.marks[d] ? 'on' : '');
      return `<div class="c ${cls}">${lab}</div>`; }).join('')}</div>
    <div class="cal-key">
      <div class="k"><b>15th</b>Reminder to the client.</div><div class="k"><b>20th</b>Calendar due from the client.</div>
      <div class="k"><b>22nd</b>Month plan sent by the AM.</div><div class="k"><b>1st</b>Live.</div>
    </div>
    <div class="grid2">
      <div class="cols" style="grid-template-columns:1fr"><div class="col on"><div class="ttl">${icon('calendar', 14)} The client sends, by the 20th</div><ul>${CALENDAR.sends.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div></div>
      <div>${tb('1fr 34mm', ['Request outside the calendar', 'What happens'], CALENDAR.outside.map(([a, b]) => [k(a), t(b, true)]), 'tight')}</div>
    </div>
  </section>`,

  // 09 ─────────────────────────────────────────────────────────────────────────────────
  `<section>
    ${head('10 · Store visits', 'Each step has an owner',
      'Most live-day problems are branch, voucher or timing gaps. The visit plan goes out 48 hours ahead; the creator is on their rung on the campaign.')}
    ${tb('1fr 24mm', ['Must be in the brief', 'Who'], VISITS.must.map(([a, b]) => [k(a), who(b)]), 'tight')}
    <div class="gap"></div>
    ${tb('22mm 1fr 1fr', ['When', 'Following', 'Client'], VISITS.steps.map(([w, [fo, fx], [co, cx]]) => [
      k(w), `<span>${fo ? `<span class="who">${esc(fo)}</span><br>` : ''}${esc(fx)}</span>`,
      `<span class="m">${co ? `<span class="who">${esc(co)}</span><br>` : ''}${esc(cx)}</span>`]))}
    <div style="margin-top:5mm">${pathStrip(['Campaigns', 'Open a campaign', 'Delivery'], 'Visits', 'Recorded on')}</div>
  </section>`,

  // 10 ─────────────────────────────────────────────────────────────────────────────────
  `<section>
    ${head('11 · Approvals', 'One round of feedback, from one person',
      'Nothing goes live without a written go-ahead. The client answers inside the platform, and their yes moves the creator by itself.')}
    <div class="rest" style="margin:0 0 7mm">${APPROVALS.chain.map(([a, b], i) => `<span class="chip${i === 3 ? ' act' : ''}">${esc(a)} · ${esc(b)}</span>`).join(sep())}</div>
    <div class="cols">
      <div class="col on"><div class="ttl">${icon('check', 14)} Approval rules</div><ul>${APPROVALS.rules.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div class="col off"><div class="ttl">${icon('hand', 14)} Counts as a new request</div><ul>${APPROVALS.newRequest.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div class="yours"><div class="ttl">${icon('camera', 14)} Where it happens</div><p style="margin:0 0 3mm;font-size:9.2pt;line-height:1.55">${md(APPROVALS.where)}</p>${pathStrip(['Campaigns', 'Open a campaign', 'Content', 'Send for review'], 'Approvals')}</div>
    </div>
  </section>`,
  `<section>
    ${head('12 · Barter and paid', 'Two ways a creator is paid', 'The client should know which one they bought.')}
    <p class="note" style="margin:0 0 6mm">The BDM explains the difference at kickoff, so the client knows what they bought. If a barter client needs specific profiles by a fixed date, the BDM offers paid creators for that part.</p>
    ${tb('1fr 1fr 1fr', ['', 'Barter', 'Paid'], BARTER.map(([a, b, c]) => [k(a), m(b), m(c)]), 'tight')}
  </section>`,

  // 11 ─────────────────────────────────────────────────────────────────────────────────
  `<section>
    ${head('13 · Escalation', 'Each level has a trigger and a time',
      'It follows the reporting lines on page 01. The quiet-creator ladder underneath is what Chasing counts.')}
    <div class="levels">${ESCALATION.levels.map((l) => `
      <div class="lv"><div class="n">${esc(l.n)}</div><div class="w">${esc(l.w)}</div><div class="x">${esc(l.x)}</div><div class="t">Responds in <b>${esc(l.t)}</b></div></div>`).join('')}
    </div>
    <h3 class="lbl gap2">When a creator goes quiet</h3>
    <div class="ladder">${ESCALATION.quiet.map(([h, u, w, x]) => `<div class="s"><div class="h">${esc(h)}<small>${esc(u)}</small></div><div class="w">${esc(w)}</div><div class="x">${esc(x)}</div></div>`).join('')}</div>
    <div style="margin-top:5mm">${pathStrip(['Campaigns', 'Chasing'], 'Quiet creators', 'Counted on')}</div>
  </section>`,

  // 12 ─────────────────────────────────────────────────────────────────────────────────
  `<section>
    ${head('14 · Writing to clients', 'Eight rules for every message',
      'And when we review as a team.')}
    <div class="eight">${WRITING.map(([w, x], i) => `<div class="e"><div class="n">${String(i + 1).padStart(2, '0')}</div><div class="w">${esc(w)}</div><div class="x">${esc(x)}</div></div>`).join('')}</div>
    <h3 class="lbl gap2">Reviews</h3>
    ${tb('26mm 48mm 1fr', ['Review', 'Who', 'What'], REVIEWS.map(([a, b, c]) => [k(a), who(b), m(c)]), 'tight')}
  </section>`,

  // 13 ─────────────────────────────────────────────────────────────────────────────────
  `<section>
    ${head('15 · The wall', 'The TV in the office',
      'It shows what the platform knows, about a second after it knows it. Nobody writes on it.')}
    <div class="cols">
      <div class="col on"><div class="ttl">${icon('tv', 14)} What it shows</div><ul>${WALL.shows.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div class="col"><div class="ttl">${icon('hand', 14)} What puts it there</div><ul>${WALL.puts.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div class="col off"><div class="ttl">${icon('ban', 14)} Never money</div><ul>${WALL.never.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
    </div>
    <div class="gap2">${tb('42mm 1fr', null, WALL.how.map(([a, b]) => [k(a), m(b)]))}</div>
  </section>`,

  // 14 ─────────────────────────────────────────────────────────────────────────────────
  `<section>
    ${head('16 · Vocabulary', 'Words we use',
      'They mean something specific. A roster is not a list, and cost is not sell.')}
    ${glossary()}
  </section>`,
);
const PART_A = ['The team', 'Handoffs', 'Urgent or not', 'Hours', 'Evenings and weekends', 'How a campaign runs',
  'Our turnaround times', 'The client’s times', 'The month', 'Store visits', 'Approvals', 'Barter and paid',
  'Escalation', 'Writing to clients', 'The wall', 'Words we use'];

// ── Swimlane, drawn in millimetres, square ───────────────────────────────────────────────
function swimlane(ch) {
  const W = 162, H0 = 10, TOP = 3.2, RH = 12.7, BH = 10.9, PX = 1.5;
  const L = ch.lanes.length, LW = W / L;
  const rows = Math.max(...ch.steps.map((s) => s.row)) + 1;
  const H = H0 + TOP + rows * RH;
  const box = {}; let n = 0;
  for (const s of ch.steps) {
    const span = s.span || 1;
    const lanesOf = ch.lanes.slice(s.lane, s.lane + span);
    box[s.id] = { x: s.lane * LW + PX, y: H0 + TOP + s.row * RH, w: span * LW - 2 * PX, h: BH, s,
      n: s.extra ? null : ++n, machine: lanesOf.every((l) => l.machine),
      mixed: span > 1 && lanesOf.some((l) => l.machine) && !lanesOf.every((l) => l.machine) };
  }
  const lanes = ch.lanes.map((l, i) => `
    <rect x="${i * LW}" y="0" width="${LW}" height="${H}" fill="${i % 2 ? PAPER : WASH}"/>
    ${l.machine ? `<rect x="${i * LW + 2.4}" y="3.6" width="3.6" height="2.6" fill="${LIME}"/>` : ''}
    <text x="${i * LW + (l.machine ? 7.4 : 2.4)}" y="6.1" font-size="2.35" font-weight="700" letter-spacing=".3" fill="${INK}">${esc(l.name.toUpperCase())}</text>
    ${i ? `<line x1="${i * LW}" y1="0" x2="${i * LW}" y2="${H}" stroke="${LINE}" stroke-width=".25"/>` : ''}`).join('');
  const links = ch.links.map(([a, b]) => {
    const A = box[a], B = box[b];
    const sx = A.x + A.w / 2, sy = A.y + A.h, tx = B.x + B.w / 2, ty = B.y - 0.6;
    const dashed = A.s.extra ? ' stroke-dasharray="1.2 1"' : '';
    let d;
    if (sx > B.x + 2 && sx < B.x + B.w - 2) d = `M${sx} ${sy} V${ty}`;
    else if (tx > A.x + 2 && tx < A.x + A.w - 2) d = `M${tx} ${sy} V${ty}`;
    else { const my = sy + (B.y - sy) / 2; d = `M${sx} ${sy} V${my} H${tx} V${ty}`; }
    return `<path d="${d}" fill="none" stroke="${INK}" stroke-width=".3"${dashed} marker-end="url(#ah)"/>`;
  }).join('');
  const boxes = Object.values(box).map((b) => `
    <g><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${b.machine ? LIME : PAPER}"
        stroke="${b.machine ? 'none' : INK}" stroke-width=".3"${b.s.extra ? ' stroke-dasharray="1.2 1"' : ''}/>
      ${b.mixed ? `<rect x="${b.x}" y="${b.y}" width="1.8" height="${b.h}" fill="${LIME}"/>` : ''}
      <text x="${b.x + 2.6}" y="${b.y + 4.1}" font-size="2.25" font-weight="800" fill="${b.machine ? INK : MUTED}">${b.n ? String(b.n).padStart(2, '0') : '+'}</text>
      <text x="${b.x + 7}" y="${b.y + 4.2}" font-size="3.15" font-weight="700" fill="${INK}">${esc(b.s.t)}</text>
      ${b.s.c.map((line, i) => `<text x="${b.x + 2.6}" y="${b.y + 7.3 + i * 2.65}" font-size="2.45" fill="${b.machine ? INK : MUTED}">${esc(line)}</text>`).join('')}
    </g>`).join('');
  return `<svg class="lanes" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="Manrope, Arial, sans-serif">
    <defs><marker id="ah" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="2.2" markerHeight="2.2" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0 6 3 0 6Z" fill="${INK}"/></marker></defs>
    ${lanes}<line x1="0" y1="${H0}" x2="${W}" y2="${H0}" stroke="${INK}" stroke-width=".35"/>${links}${boxes}</svg>`;
}
const laneKey = (machineLabel, extra) => `<div class="lkey">
  <span><i class="lime"></i>${esc(machineLabel)}</span><span><i class="out"></i>A person does this</span>
  ${extra ? `<span><i class="dash"></i>${esc(extra)}</span>` : ''}</div>`;
const yours = (items, strip) => `<div class="yours"><div class="ttl">${icon('check', 14)} Your part</div>
  <div style="margin-bottom:3mm">${strip}</div><ol class="steps">${items.map((i) => `<li>${md(i)}</li>`).join('')}</ol></div>`;

function scoutSections(n, role) {
  const S = SCOUT;
  return `
  <section>
    ${head(`${n} · Scout`, S.title, S.sub)}
    ${swimlane(S)}${laneKey('Runs itself', 'Your own outreach, beside it')}
    <div class="grid2">
      <div class="yours"><div class="ttl">${icon('moon', 14)} When Instagram slows it down, it rests</div>
        <div class="rest">${S.rests.map((r) => `<span class="chip">${esc(r)}</span>`).join(sep())}${sep()}<span class="chip act">Carries on</span></div></div>
      <div class="yours"><div class="ttl">${icon('hand', 14)} The one time it needs a person</div>
        <p style="margin:0;font-size:9.2pt;line-height:1.5">If Instagram logs the account out or asks for a check, the bot stops and says so on ScoutOutreach. Somebody signs in to Instagram on that office PC, then presses <b>Resume</b>.</p></div>
    </div>
  </section>
  <section>
    ${head(`${n} · Scout, continued`, 'How each one works', '')}
    <div class="cols" style="grid-template-columns:1fr 1fr">
      <div class="col on"><div class="ttl">${icon('radar', 14)} ScoutOutreach finds them</div><ul>${S.outreach.map((x) => `<li>${md(x)}</li>`).join('')}</ul></div>
      <div class="col"><div class="ttl">${icon('message', 14)} ScoutAI talks to them</div><ul>${S.ai.map((x) => `<li>${md(x)}</li>`).join('')}</ul></div>
    </div>
  </section>
  <section>
    ${head(`${n} · Scout, continued`, 'What the roster tells you', 'Every row says its next step and carries one button for it. Its pace keeps the account safe.')}
    <div class="tb tight" style="--c: 1fr 34mm 30mm"><div class="h"><span>The row says</span><span>Button</span><span>Who moves it</span></div>
      ${S.roster.map(([says, btn, w]) => `<div class="r"><span class="k">${esc(says)}</span><span>${btn === 'Nothing' ? '<span class="m">Nothing to press</span>' : `<span class="path" style="margin:0"><span class="chip${/Price|Open/.test(btn) ? '' : ' act'}">${esc(btn)}</span></span>`}</span><span class="m">${esc(w)}</span></div>`).join('')}
    </div>
    <div class="grid2" style="margin-top:5mm">
      <div class="stats" style="grid-template-columns:1fr 1fr">${S.pace.map(([b, x]) => `<div class="s"><div class="b">${esc(b)}</div><div class="x">${esc(x)}</div></div>`).join('')}</div>
      ${yours(S.yours[role.slug], pathStrip(['ScoutOutreach'], `${role.title} / Scout`))}
    </div>
  </section>`;
}

function enrolSections(n, role) {
  const E = ENROL;
  return `
  <section>
    ${head(`${n} · Enrolments`, E.title, E.sub)}
    ${swimlane(E)}${laneKey('The platform does this')}
    ${tb('52mm 1fr', null, E.where.map(([w, x]) => [k(w), m(x)]), 'tight')}
    <div class="warn">${icon('ban', 14)} A link is personal. Never post one in a group, a story or anywhere public.</div>
  </section>
  <section>
    ${head(`${n} · Enrolments, continued`, 'What the creator does', '')}
    ${tb('30mm 1fr', null, E.creator.map(([a, b], i) => [`<span class="k"><span class="badge" style="display:inline-flex;width:18px;height:18px;background:${LIME};align-items:center;justify-content:center;font-size:8pt;margin-right:6px;vertical-align:middle">${i + 1}</span>${esc(a)}</span>`, m(b)]))}
    <div class="grid2 gap">
      <div class="yours"><div class="ttl">${icon('banknote', 14)} The payee confirms itself when</div><ul class="plain">${E.payee.map((x) => `<li>${md(x)}</li>`).join('')}</ul></div>
      <div class="yours"><div class="ttl">${icon('shield', 14)} Passports</div><ul class="plain" style="margin:0;padding-left:16px;font-size:9.2pt;line-height:1.55">${E.passport.map((x) => `<li>${md(x)}</li>`).join('')}</ul></div>
    </div>
    <div class="gap">${yours(E.yours[role.slug], pathStrip(['Campaigns', 'Enrolments'], `${role.title} / Enrolments`))}</div>
  </section>`;
}

const checklistSection = () => `
  <section>
    ${head('Appendix · Training', 'The training checklist', 'One page for whoever runs the room. Tick as you go.')}
    <div class="chk">${CHECKLIST.map(([lbl, items]) => `<div class="blk"><div class="lbl">${esc(lbl)}</div><ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>`).join('')}</div>
  </section>`;

// ── A desk ──────────────────────────────────────────────────────────────────────────────
function desk(role) {
  const mm = MASTERY[role.slug];
  const toc = [];
  let i = 0; const nx = () => String(++i).padStart(2, '0');
  const out = [roleCover(role)];
  let n = nx(); toc.push('How a day goes, and where your work sits');
  out.push(`<section class="two">
    ${head(`${n} · Your day`, 'How a day goes', 'Three moments. Everything else finds you.')}
    ${dayTimeline(role.day)}
    ${mm ? `<h3 class="sub2">Where your work sits</h3><p class="sub" style="margin-bottom:6mm">${esc(mm.flowNote)}</p>${flowRibbon(mm.flow)}` : ''}
  </section>`);
  if (mm) { n = nx(); toc.push('The screen you will live in');
    out.push(`<section>${head(`${n} · Your screen`, 'The screen you will live in', 'Drawn, not photographed, so it stays true when a button moves. The numbers are explained underneath.')}${drawnScreen(mm.screen)}</section>`); }
  n = nx(); toc.push('Where things live');
  out.push(`<section>${head(`${n} · The menu`, 'Where things live', 'The menu down the left of the screen. This is all of it, for your login.')}${menuMap(role.slug)}${menuExtras()}</section>`);
  n = nx(); toc.push('What you actually do');
  out.push(`<section>${head(`${n} · Your jobs`, 'What you actually do', 'In order. The strip on each card is what to click, as you click it.')}${role.jobs.map((j, idx) => jobCard(j, idx + 1, role.title)).join('')}</section>`);
  if (SCOUT.for.includes(role.slug)) { n = nx(); toc.push('ScoutOutreach and ScoutAI'); out.push(scoutSections(n, role)); }
  if (ENROL.for.includes(role.slug)) { n = nx(); toc.push('Enrolments'); out.push(enrolSections(n, role)); }
  if (mm) { n = nx(); toc.push('A real one, start to finish');
    out.push(`<section>${head(`${n} · A real one`, mm.story.title, 'One job, followed the whole way, with the real numbers.')}${workedExample(mm.story)}</section>`);
    n = nx(); toc.push('Right and wrong');
    out.push(`<section class="fill">${head(`${n} · Right and wrong`, 'What good looks like', 'Everything on the right has actually happened here and cost us something.')}${goodAndBad(mm.vs)}</section>`); }
  n = nx(); toc.push('Rules that cost money');
  out.push(`<section class="fill">${head(`${n} · The hard rules`, 'Rules that cost money', 'Each one has already cost us something.')}
    <div class="rules"><ul>${role.rules.map((r) => `<li>${icon('ban', 14)}<span>${md(r)}</span></li>`).join('')}</ul></div>
    <div class="tail"><p class="note">Every screen in the platform is explained under <strong>Guide</strong> in the menu. If something here does not match what you see, the product is right and this is out of date. Say so and it gets reprinted.</p></div>
  </section>`);
  if (mm) { toc.push('Quick card'); out.push(quickCard(role, mm.card)); }
  return { html: out.join(''), toc: toc.map((x) => `${role.title}: ${x}`) };
}

function book(roles, title, ser, lede) {
  const desks = roles.map(desk);
  const deskToc = roles.length > 1
    ? roles.map((r) => `${r.title}: your day, screen, menu, jobs, a real one, the rules, quick card`)
    : desks[0].toc.map((x) => x.replace(/^[^:]+: /, ''));
  const body = bookCover(title, ser, lede, PART_A, deskToc)
    + sopPages.join('') + desks.map((d) => d.html).join('') + checklistSection();
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}, Following</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300..800&family=Playfair+Display:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body>${body}</body></html>`;
}

// ── Print ───────────────────────────────────────────────────────────────────────────────
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const tab = await browser.newPage();
async function print(html, name, footer) {
  await tab.setContent(html, { waitUntil: 'networkidle' });
  await tab.pdf({ path: join(OUT, `${name}.pdf`), format: 'A4', printBackground: true, displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `<div style="width:100%;padding:0 24mm;font:7.5pt Manrope,Arial,sans-serif;color:#9A9A9A;display:flex;justify-content:space-between;padding-bottom:10mm;"><span>Following &middot; ${esc(footer)}</span><span class="pageNumber"></span></div>`,
    margin: { top: '22mm', bottom: '20mm', left: '24mm', right: '24mm' } });
  writeFileSync(join(OUT, `${name}.html`), html, 'utf8');
  console.log('printed', `${name}.pdf`);
}
const LEDE = 'How we work, in one book: who talks to the client, what moves between us and when, the turnaround times we promise, and then every desk with what to open, what to do and what to click.';
await print(book(ROLES, 'How we work', 'The SOP, the times and every desk', LEDE), 'Following Team Manual', 'Team manual');
for (const role of ROLES) {
  await print(book([role], role.title, role.promise, `${LEDE.split(', and then')[0]}, and then your desk: ${role.lede.charAt(0).toLowerCase()}${role.lede.slice(1)}`), `Manual - ${role.file}`, role.title);
}
await browser.close();

/* Three places, one source. */
const copies = [['Following Team Manual', 'team-manual'], ...ROLES.map((r) => [`Manual - ${r.file}`, r.slug])];
for (const [name, slug] of copies) {
  if (PUBLIC) { mkdirSync(PUBLIC, { recursive: true }); copyFileSync(join(OUT, `${name}.pdf`), join(PUBLIC, `${slug}.pdf`)); }
  if (DESKTOP) copyFileSync(join(OUT, `${name}.pdf`), join(DESKTOP, `${name}.pdf`));
}
for (const stale of ['how-work-moves.pdf', 'training-checklist.pdf']) if (PUBLIC && existsSync(join(PUBLIC, stale))) rmSync(join(PUBLIC, stale));
if (existsSync(STALE)) for (const f of ['Manual - Talent.pdf', 'Manual - Account Manager.pdf', 'Manual - Business Development.pdf',
  'Manual - Co-Founder.pdf', 'Manual - Founder & CEO.pdf', 'How work moves at Following.pdf', 'How work moves at Following.html', 'Team training checklist.pdf']) {
  if (existsSync(join(STALE, f))) rmSync(join(STALE, f));
}
console.log(`\n${copies.length} PDFs -> ${OUT}${DESKTOP ? `\n  also refreshed -> ${DESKTOP}` : ''}`);
