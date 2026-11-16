/**
 * Print the role manuals.
 *
 *   node scripts/make-manuals.mjs "<output folder>"
 *
 * Every screen name is read out of `src/lib/destinations.ts`, the one registry the sidebar,
 * the command palette and every hub header take their labels from, so a manual cannot name
 * a screen that does not exist, and renaming a screen reprints the manuals. A path chip that
 * is not a sidebar item, a tab or an action FAILS the build rather than printing.
 *
 * The look is docs/manuals/theme.mjs: the Client Operations SOP's own stylesheet (navy, grey
 * rounded cards, pills, an icon on every row, the wordmark on every page). Each page is one
 * <section class="pg"> of fixed height, measured before printing.
 */
import { chromium } from 'playwright';
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { icon } from '../docs/manuals/design.mjs';
import { CSS, LIME, LINE, MUTED, NAVY, PANEL, PAPER } from '../docs/manuals/theme.mjs';
import { ADMIN, MENU, ROLES, TABS } from '../docs/manuals/roles.mjs';
import { ENROL, FLOW, GLOSSARY, MASTERY, SCOUT } from '../docs/manuals/mastery.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FE = resolve(HERE, '..');
const OUT = resolve(process.argv[2] || join(FE, 'docs', 'manuals', 'out'));
const PUBLIC = process.argv[3] === '' ? null
  : resolve(process.argv[3] || join(FE, 'public', 'guides'));
const DESKTOP = [
  join(homedir(), 'Desktop', 'Following App', 'Following Manuals'),
  join(homedir(), 'Desktop', 'Following Manuals'),
  join(homedir(), 'OneDrive', 'Desktop', 'Following Manuals'),
].find((d) => existsSync(d)) || null;

/* The wordmark, inline so the PDF carries it. The deck asset is the brand's own file. */
const LOGO = readFileSync(join(FE, 'docs', 'manuals', 'following-logo.svg'), 'utf8')
  .replace(/<\?xml[^>]*>/, '').replace(/<!--[\s\S]*?-->/g, '')
  .replace(/fill:\s*#161616/g, `fill: ${NAVY}`);

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
const arr = () => `<span class="arr">${icon('chevron', 10)}</span>`;

/** The route as pills, in the order you click: sidebar dark, tab outlined, action lime. */
function pathStrip(chips, where) {
  const out = chips.map((c, i) => {
    if (!KNOWN.has(c) && !isAction(c)) {
      throw new Error(`"${c}" (in ${where}) is not a sidebar item, a tab, or an action.\n`
        + `  Sidebar: ${SIDEBAR.join(', ')}\n  Tabs: ${[...TAB_NAMES].join(', ')}\n`
        + `  Admin: ${[...ADMIN_NAMES].join(', ')}`);
    }
    const cls = i === 0 ? 'pill dark' : (KNOWN.has(c) ? 'pill' : 'pill lime');
    return `<span class="${cls}">${esc(c)}</span>`;
  });
  return `<div class="pills"><span class="lbl">Go to</span>${out.join(arr())}</div>`;
}

const ck = (items, cls = '') => `<ul class="ck ${cls}">${items.map((i) => `<li>${md(i)}</li>`).join('')}</ul>`;
const steps = (items) => `<ol class="st">${items.map((i) => `<li>${md(i)}</li>`).join('')}</ol>`;
const card = (head, body, cls = '', ic = 'check') =>
  `<div class="card ${cls}"><div class="ch">${icon(ic, 15)}<span>${esc(head)}</span></div>${body}</div>`;

/** One page: header, content, wordmark footer. Page numbers are assigned at assembly. */
const page = (n, title, sub, body, cls = '') => ({
  html: (pn) => `<section class="pg ${cls}"><div class="in">
    ${n ? `<div class="ph"><div class="l"><span class="n">${esc(n)}</span><h2>${esc(title)}</h2></div>
      <div class="s">${esc(sub || '')}</div></div>` : ''}
    ${body}
  </div><div class="pf"><span class="logo">${LOGO}</span><span class="pn">${pn}</span></div></section>`,
});

// ── Pages ───────────────────────────────────────────────────────────────────────────────
const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

const cover = (role) => ({
  html: () => `<section class="pg cover"><div class="in">
    <div class="logo">${LOGO}</div>
    <div class="mid">
      <div class="bar"></div>
      <p class="kicker">Role manual</p>
      <h1>${esc(role.title)}</h1>
      <p class="lede">${esc(role.lede)}</p>
    </div>
    <div class="meta">
      <div><span>Document</span><b>FOL-MAN-${esc(role.slug.toUpperCase().slice(0, 3))}</b></div>
      <div><span>Version</span><b>2.0</b></div>
      <div><span>Effective</span><b>${esc(today)}</b></div>
      <div><span>For</span><b>${esc(role.title)}, Following team</b></div>
    </div>
  </div></section>`,
});

const contents = (toc) => {
  const half = Math.ceil(toc.length / 2);
  const tbl = (rows, head) => `<div class="tbl toc"><div class="hd">${head}</div>${rows.map(([n, t]) =>
    `<div class="tr"><span class="pill soft">${n}</span><span class="t">${esc(t)}</span></div>`).join('')}</div>`;
  return page(null, '', '', `
    <div class="ph"><div class="l"><h2>Contents</h2></div>
      <div class="s">Every page is one job or one picture. The quick card at the back can be pinned up.</div></div>
    <div class="grid2">${tbl(toc.slice(0, half), 'This manual')}${tbl(toc.slice(half), 'This manual, continued')}</div>`);
};

const dayPage = (n, role) => page(n, 'How a day goes', 'Three moments. Everything else finds you.', `
  <div class="grid3 day">${role.day.map((d) => card(d.head, ck(d.items), '', d.icon)).join('')}</div>`);

const flowPage = (n, m) => page(n, 'Where your work sits',
  'The same eight stages in every manual. Lime is your part.', `
  <div class="grid4 flow">${FLOW.map((f, i) => `
    <div class="card${m.flow.includes(f.key) ? ' on' : ''}">
      <div class="top"><span class="num">${i + 1}</span><span class="pill">${esc(f.who)}</span></div>
      <div class="wt">${esc(f.what)}</div>
    </div>`).join('')}</div>
  <p class="note">${esc(m.flowNote)}</p>`);

function screenPage(n, sc) {
  const num = {};
  sc.keys.forEach(([region], idx) => { if (!(region in num)) num[region] = idx + 1; });
  const pin = (region, style) => (region in num) ? `<span class="pin" style="${style}">${num[region]}</span>` : '';
  return page(n, 'The screen you will live in',
    'Drawn, not photographed, so it stays true when a button moves. The numbers are explained on the right.', `
  <div class="grid2">
    <div class="shot">
      <div class="bar"><span class="d"></span><span class="d"></span><span class="d"></span><span class="u">${esc(sc.url)}</span></div>
      <div class="body">
        <div class="side">${sc.side.map((it) => `<div class="it${it === sc.on ? ' on' : ''}">${esc(it)}${
          it === sc.on ? pin('menu', 'top:50%;right:2.5mm;transform:translateY(-50%)') : ''}</div>`).join('')}</div>
        <div class="main">
          <div style="position:relative;display:inline-block"><div class="h1">${esc(sc.title)}</div>
            <div class="h2">${esc(sc.sub)}</div>${pin('title', 'top:-2mm;right:-7mm')}</div>
          <div class="cards">${(sc.cards || []).map((c, ci) => `<div class="card" style="position:relative">
            ${pin('card' + (ci + 1), 'top:-2mm;right:-2mm')}<div class="k">${esc(c.k)}</div>
            <div class="v">${esc(c.v)}</div><div class="s">${esc(c.s)}</div></div>`).join('')}</div>
          <div class="rowz">${(sc.rows || []).map((r, ri) => `<div class="r">${pin('row' + (ri + 1), 'top:50%;left:-2.5mm;transform:translateY(-50%)')}
            <span class="nm">${esc(r.nm)}</span><span class="tag${r.hot ? ' hot' : ''}">${esc(r.tag)}</span></div>`).join('')}</div>
        </div>
      </div>
    </div>
    <ul class="keys">${sc.keys.map(([, text], idx) => `<li><span class="n">${idx + 1}</span><span>${md(text)}</span></li>`).join('')}</ul>
  </div>`);
}

const menuPage = (n, slug) => {
  const groups = MENU.map((g) => ({ ...g, rows: g.rows.filter((r) => !r.only || r.only.includes(slug)) }))
    .filter((g) => g.rows.length);
  const tbl = (g) => `<div class="tbl"><div class="hd">${esc(g.group || 'Every day')}</div>${g.rows.map((r) =>
    `<div class="tr" style="grid-template-columns: 42mm 1fr; gap: 4mm"><span class="ico">${icon(r.icon, 14)}<span class="t">${esc(nameOf(r.path))}</span></span><span class="d">${esc(hintOf(r.path))}</span></div>`).join('')}</div>`;
  return page(n, 'Where things live', 'The menu down the left of the screen. This is all of it, for your login.', `
    <div class="grid2">${groups.map(tbl).join('')}</div>
    <div class="grid3 gap">
      ${card('Admin, Company', ck(ADMIN.Company.map(nameOf)), '', 'building')}
      ${card('Admin, Settings', `<p class="d" style="margin:0;color:${MUTED};font-size:8.8pt">Founders only. ${esc(ADMIN.Settings.map(nameOf).join(', '))}.</p>`, '', 'shield')}
      ${card('Inside a campaign', ck(['Story, Delivery, Content, Performance, Links.', 'Money only for those allowed to see it.']), '', 'megaphone')}
    </div>`);
};

const wallPage = (n, role) => {
  const leader = role.slug === 'co-founder' || role.slug === 'founder-ceo';
  return page(n, 'The wall in the office',
    'The TV shows what the platform knows, about a second after it knows it. Nobody writes on it.', `
  <div class="grid3">
    ${card('What it shows', ck([
      'Every live campaign as a row: who is briefed, who has content in, who has posted.',
      'Whose move it is, with the faces. Yours is lit when it is you.',
      'A celebration when a client confirms, a post goes live or a deal is won.',
      'Everything else floats up for ten seconds and is gone.']), '', 'tv')}
    ${card('What puts it there', ck([
      'You do. A rung moved, a link pasted, a request closed, a rate agreed.',
      'Nothing is typed onto the wall and nobody can push to it. There is no button.',
      'A thing that happened in WhatsApp and nowhere else does not exist to the wall.',
      'If the room should see it, record it. The wall moves the same second.']), 'blue', 'hand')}
    ${card('Never money', ck([
      'No fee, cost, margin or invoice on a team display.',
      'Business development and the founders’ own work stay off it.',
      leader ? 'A display that carries money exists; only leadership can pair a TV to it.'
             : 'The wall is for the people delivering campaigns.'], 'red'), 'red', 'ban')}
  </div>
  <div class="tbl gap">
    <div class="tr" style="grid-template-columns: 50mm 1fr; gap: 6mm"><span class="ico">${icon('tv', 14)}<span class="t">Pairing a TV</span></span><span class="d">The TV opens following.ae/tv and shows a six-digit code. A staff phone enters it and picks the display. The TV remembers it through power off and on.</span></div>
    <div class="tr" style="grid-template-columns: 50mm 1fr; gap: 6mm"><span class="ico">${icon('list', 14)}<span class="t">Choosing what a screen shows</span></span><span class="d">Admin, Company, Office displays. Each display is a scope: the team, or leadership.</span></div>
    <div class="tr" style="grid-template-columns: 50mm 1fr; gap: 6mm"><span class="ico">${icon('send', 14)}<span class="t">Playing a preview</span></span><span class="d">Office displays can play one on the paired TV so you see what the room sees.</span></div>
  </div>`);
};

const jobCard = (job, i, role) => `<div class="job">
  <div class="top"><span class="num">${i}</span><div><h3>${esc(job.title)}</h3>${job.when ? `<div class="when">${esc(job.when)}</div>` : ''}</div></div>
  ${job.path ? pathStrip(job.path, `${role.title} / ${job.title}`) : ''}
  ${steps(job.steps)}
  ${job.next ? `<div class="next">${icon('check', 12)}<span><strong>Next:</strong> ${md(job.next)}</span></div>` : ''}
</div>`;

/* Two cards a row; rows are packed onto a page by their likely height (in text lines), so a
   page holds two short rows or one long one and no card is ever clipped. */
const jobPages = (n, role) => {
  const weight = (j) => 5 + j.steps.length * 1.8 + (j.next ? 2.2 : 0) + (j.path ? 1.6 : 0);
  const rows = [];
  for (let i = 0; i < role.jobs.length; i += 2) rows.push(role.jobs.slice(i, i + 2).map((j, k) => [j, i + k + 1]));
  const pages = []; let cur = [], h = 0;
  for (const r of rows) {
    const rh = Math.max(...r.map(([j]) => weight(j)));
    if (cur.length && h + rh > 24) { pages.push(cur); cur = []; h = 0; }
    cur.push(r); h += rh;
  }
  if (cur.length) pages.push(cur);
  return pages.map((rs, pi) => page(n, 'What you actually do',
    pi ? 'Continued. The pills on each card are what to click, in order.' : 'In order. The pills on each card are what to click, in order.', `
    <div class="jobs">${rs.flat().map(([j, k]) => jobCard(j, k, role)).join('')}</div>`));
};

const storyPage = (n, m) => page(n, m.story.title, 'One job, followed the whole way, with the real numbers.', `
  <div class="beats">${m.story.beats.map(([t, x]) => `<div class="beat"><span class="pill soft">${esc(t)}</span><div class="x">${md(x)}</div></div>`).join('')}</div>`);

const vsPage = (n, m) => page(n, 'What good looks like', 'Everything on the right has actually happened here and cost us something.', `
  <div class="grid2">
    ${card('What good looks like', ck(m.vs.good), 'blue', 'check')}
    ${card('What has actually gone wrong', ck(m.vs.bad, 'red'), 'red', 'x')}
  </div>`);

const wordsPage = (n, slug) => page(n, 'Words we use', 'They mean something specific. A roster is not a list, and cost is not sell.', `
  <div class="words">${GLOSSARY.filter(([, , only]) => !only || only.includes(slug)).map(([w, d]) =>
    `<div class="w"><div class="t">${esc(w)}</div><div class="d">${esc(d)}</div></div>`).join('')}</div>`);

const rulesPage = (n, role) => page(n, 'Rules that cost money', 'Each one has already cost us something.', `
  <div class="tbl">${role.rules.map((r) => `<div class="tr" style="grid-template-columns: 8mm 1fr; gap: 3mm">
    <span style="color:#e4572e;display:flex">${icon('ban', 15)}</span><span style="font-size:10pt">${md(r)}</span></div>`).join('')}</div>
  <p class="note">Every screen in the platform is explained under <strong>Guide</strong> in the menu. If something here does not match what you see, the product is right and this is out of date. Say so and it gets reprinted.</p>`);

const quickCard = (role, blocks) => page(null, '', '', `
  <div class="qc">
    <div class="head"><h2>${esc(role.title)}</h2><span class="pill dark">Quick card. Pin this up.</span></div>
    <div class="grid3">${blocks.map(([lbl, items], i) => card(lbl, ck(items), i === 1 ? 'lime' : '', ['sunrise', 'target', 'tag', 'ban', 'lightbulb'][i] || 'check')).join('')}</div>
  </div>`);

// ── Swimlane, drawn in millimetres ──────────────────────────────────────────────────────
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
    <rect x="${i * LW}" y="0" width="${LW}" height="${H}" fill="${i % 2 ? PAPER : PANEL}"/>
    ${l.machine ? `<rect x="${i * LW + 2.4}" y="3.6" width="3.6" height="2.6" rx=".6" fill="${LIME}"/>` : ''}
    <text x="${i * LW + (l.machine ? 7.4 : 2.4)}" y="6.1" font-size="2.35" font-weight="700" letter-spacing=".3" fill="${NAVY}">${esc(l.name.toUpperCase())}</text>
    ${i ? `<line x1="${i * LW}" y1="0" x2="${i * LW}" y2="${H}" stroke="${LINE}" stroke-width=".25"/>` : ''}`).join('');
  const links = ch.links.map(([a, b]) => {
    const A = box[a], B = box[b];
    const sx = A.x + A.w / 2, sy = A.y + A.h, tx = B.x + B.w / 2, ty = B.y - 0.6;
    const dashed = A.s.extra ? ' stroke-dasharray="1.2 1"' : '';
    let d;
    if (sx > B.x + 2 && sx < B.x + B.w - 2) d = `M${sx} ${sy} V${ty}`;
    else if (tx > A.x + 2 && tx < A.x + A.w - 2) d = `M${tx} ${sy} V${ty}`;
    else { const my = sy + (B.y - sy) / 2; d = `M${sx} ${sy} V${my} H${tx} V${ty}`; }
    return `<path d="${d}" fill="none" stroke="${NAVY}" stroke-width=".3"${dashed} marker-end="url(#ah)"/>`;
  }).join('');
  const boxes = Object.values(box).map((b) => `
    <g><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="1.4" fill="${b.machine ? LIME : PAPER}"
        stroke="${b.machine ? 'none' : NAVY}" stroke-width=".3"${b.s.extra ? ' stroke-dasharray="1.2 1"' : ''}/>
      ${b.mixed ? `<rect x="${b.x}" y="${b.y}" width="1.8" height="${b.h}" rx=".6" fill="${LIME}"/>` : ''}
      <text x="${b.x + 2.6}" y="${b.y + 4.1}" font-size="2.25" font-weight="800" fill="${b.machine ? NAVY : MUTED}">${b.n ? String(b.n).padStart(2, '0') : '+'}</text>
      <text x="${b.x + 7}" y="${b.y + 4.2}" font-size="3.15" font-weight="700" fill="${NAVY}">${esc(b.s.t)}</text>
      ${b.s.c.map((line, i) => `<text x="${b.x + 2.6}" y="${b.y + 7.3 + i * 2.65}" font-size="2.45" fill="${b.machine ? NAVY : MUTED}">${esc(line)}</text>`).join('')}
    </g>`).join('');
  return `<svg class="lanes" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="Manrope, Arial, sans-serif">
    <defs><marker id="ah" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="2.2" markerHeight="2.2" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0 6 3 0 6Z" fill="${NAVY}"/></marker></defs>
    ${lanes}<line x1="0" y1="${H0}" x2="${W}" y2="${H0}" stroke="${NAVY}" stroke-width=".35"/>${links}${boxes}</svg>`;
}
const laneKey = (machineLabel, extra) => `<div class="lkey">
  <span><i class="sw lime"></i>${esc(machineLabel)}</span><span><i class="sw out"></i>A person does this</span>
  ${extra ? `<span><i class="sw dash"></i>${esc(extra)}</span>` : ''}</div>`;

const yoursCard = (items, strip) => `<div class="card blue"><div class="ch">${icon('check', 15)}<span>Your part</span></div>
  <div style="margin-bottom:3.5mm">${strip}</div>${steps(items)}</div>`;

function scoutPages(n, role) {
  const S = SCOUT;
  return [
    page(n, S.title, S.sub, `
      <div class="side2">
        <div>${swimlane(S)}${laneKey('Runs itself', 'Your own outreach, beside it')}</div>
        <div>
          <div class="ch">${icon('moon', 15)}<span>When Instagram slows it down, it rests by itself</span></div>
          <div class="rest">${S.rests.map((r) => `<span class="pill">${esc(r)}</span>`).join(arr())}${arr()}<span class="pill lime">Carries on</span></div>
          ${card('The one time it needs a person', `<p style="margin:0;font-size:9.2pt;line-height:1.5">If Instagram logs the account out or asks for a check, the bot stops and says so on ScoutOutreach. Somebody signs in to Instagram on that office PC, then presses <b>Resume</b>.</p>`, 'dark', 'hand')}
        </div>
      </div>`),
    page(n, 'How each one works', `${S.title}, continued.`, `
      <div class="grid2">
        ${card('ScoutOutreach finds them', ck(S.outreach), '', 'radar')}
        ${card('ScoutAI talks to them', ck(S.ai), '', 'message')}
      </div>
`),
    page(n, 'What the roster tells you', 'Every row says its next step and carries one button for it, plus Skip and a menu.', `
      <div class="side2">
        <div>
          <div class="tbl">
            <div class="hd" style="grid-template-columns: 1fr 34mm 30mm">
              <span>The row says</span><span>Button</span><span>Who moves it</span></div>
            ${S.roster.map(([says, btn, who]) => `<div class="tr" style="grid-template-columns: 1fr 34mm 30mm">
              <span class="t">${esc(says)}</span>
              <span>${btn === 'Nothing' ? `<span class="d">Nothing to press</span>` : `<span class="pill">${esc(btn)}</span>`}</span>
              <span class="d">${esc(who)}</span></div>`).join('')}
          </div>
          <div class="pills gap"><span class="lbl">Source tabs</span>${S.sources.map(([a, w]) => `<span class="pill soft">${esc(a)}: ${esc(w)}</span>`).join('')}</div>
        </div>
        <div>${yoursCard(S.yours[role.slug], pathStrip(['ScoutOutreach'], `${role.title} / Scout`))}
          <div class="ch gap">${icon('clock', 15)}<span>Its pace, so the account stays safe</span></div>
          <div class="grid4" style="gap:3mm">${S.pace.map(([b, t]) => `<div class="stat"><div class="b">${esc(b)}</div><div class="s">${esc(t)}</div></div>`).join('')}</div>
        </div>
      </div>`),
  ];
}

function enrolPages(n, role) {
  const E = ENROL;
  return [
    page(n, E.title, E.sub, `
      <div class="side2">
        <div>${swimlane(E)}${laneKey('The platform does this')}</div>
        <div>
          <div class="tbl">${E.where.map(([w, t]) => `<div class="tr" style="grid-template-columns: 44mm 1fr; gap: 5mm"><span class="t">${esc(w)}</span><span class="d">${md(t)}</span></div>`).join('')}</div>
          <div class="warn">${icon('ban', 14)} A link is personal. Never post one in a group, a story or anywhere public.</div>
        </div>
      </div>`),
    page(n, 'What the creator does', `${E.title}, continued.`, `
      <div class="side2" style="grid-template-columns: 1fr 1fr">
        <div class="tbl">${E.creator.map(([k, t], i) => `<div class="tr" style="grid-template-columns: 30mm 1fr; gap: 4mm">
          <span class="ico"><span class="num sm">${i + 1}</span><span class="t">${esc(k)}</span></span><span class="d">${md(t)}</span></div>`).join('')}</div>
        <div>
          <div class="grid2">
            ${card('The payee confirms itself when', ck(E.payee), '', 'banknote')}
            ${card('Passports', ck(E.passport), '', 'shield')}
          </div>
          <div class="gap">${yoursCard(E.yours[role.slug], pathStrip(['Campaigns', 'Enrolments'], `${role.title} / Enrolments`))}</div>
        </div>
      </div>`),
  ];
}

// ── Assembly ────────────────────────────────────────────────────────────────────────────
function manual(role) {
  const m = MASTERY[role.slug];
  const scoutOn = SCOUT.for.includes(role.slug);
  const enrolOn = ENROL.for.includes(role.slug);
  const chapters = [
    ['How a day goes', (n) => [dayPage(n, role)]],
    m && ['Where your work sits', (n) => [flowPage(n, m)]],
    m && ['The screen you will live in', (n) => [screenPage(n, m.screen)]],
    ['Where things live', (n) => [menuPage(n, role.slug)]],
    ['The wall in the office', (n) => [wallPage(n, role)]],
    ['What you actually do', (n) => jobPages(n, role)],
    scoutOn && ['ScoutOutreach and ScoutAI', (n) => scoutPages(n, role)],
    enrolOn && ['Enrolments', (n) => enrolPages(n, role)],
    m && ['A real one, start to finish', (n) => [storyPage(n, m)]],
    m && ['Right and wrong', (n) => [vsPage(n, m)]],
    ['Words we use', (n) => [wordsPage(n, role.slug)]],
    ['Rules that cost money', (n) => [rulesPage(n, role)]],
  ].filter(Boolean);
  const toc = chapters.map(([t], i) => [String(i + 1).padStart(2, '0'), t]);
  const pages = [cover(role), contents(toc)];
  chapters.forEach(([, make], i) => pages.push(...make(String(i + 1).padStart(2, '0'))));
  if (m) pages.push(quickCard(role, m.card));
  const body = pages.map((p, i) => p.html(i ? String(i) : '')).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(role.title)}, Following</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body>${body}</body></html>`;
}

// ── Print ───────────────────────────────────────────────────────────────────────────────
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const tab = await browser.newPage();
const PDF = { format: 'A4', landscape: true, printBackground: true,
  margin: { top: '18mm', bottom: '16mm', left: '20mm', right: '20mm' } };

for (const role of ROLES) {
  const html = manual(role);
  const name = `Manual - ${role.file}`;
  await tab.setContent(html, { waitUntil: 'networkidle' });
  /* A page whose content is taller than its box is clipped, not spilled. Say so. */
  const tall = await tab.evaluate(() => {
    const mm = (px) => Math.round(px / 96 * 25.4);
    return [...document.querySelectorAll('.pg .in')].map((el, i) => ({ i: i + 1,
      h: mm(el.scrollHeight), box: mm(el.clientHeight),
      t: (el.querySelector('h2, h1')?.textContent || '').trim().slice(0, 40) }))
      .filter((x) => x.h > x.box + 1);
  });
  for (const t of tall) console.warn(`  ! ${name}: page ${t.i} "${t.t}" needs ${t.h}mm, box is ${t.box}mm`);
  await tab.pdf({ path: join(OUT, `${name}.pdf`), ...PDF });
  writeHtml(join(OUT, `${name}.html`), html);
  if (PUBLIC) { mkdirSync(PUBLIC, { recursive: true }); copyFileSync(join(OUT, `${name}.pdf`), join(PUBLIC, `${role.slug}.pdf`)); }
  if (DESKTOP) { copyFileSync(join(OUT, `${name}.pdf`), join(DESKTOP, `${name}.pdf`)); }
  console.log(`printed ${name}.pdf`);
}

{
  const name = 'How work moves at Following';
  await tab.goto('file:///' + join(FE, 'docs', 'manuals', 'how-work-moves.html').replace(/\\/g, '/'), { waitUntil: 'networkidle' });
  await tab.pdf({ path: join(OUT, `${name}.pdf`), ...PDF, displayHeaderFooter: true, headerTemplate: '<div></div>',
    footerTemplate: `<div style="width:100%;padding:0 20mm 9mm;font:7pt Manrope,Arial,sans-serif;color:#9aa4ad;display:flex;justify-content:space-between"><span>Following</span><span class="pageNumber"></span></div>` });
  if (PUBLIC) copyFileSync(join(OUT, `${name}.pdf`), join(PUBLIC, 'how-work-moves.pdf'));
  if (DESKTOP) copyFileSync(join(OUT, `${name}.pdf`), join(DESKTOP, `${name}.pdf`));
  console.log(`printed ${name}.pdf`);
}
await browser.close();
console.log(`\n${ROLES.length} manuals -> ${OUT}${DESKTOP ? `\n  also refreshed -> ${DESKTOP}` : ''}`);

function writeHtml(path, html) { import('node:fs').then(({ writeFileSync }) => writeFileSync(path, html)); }
