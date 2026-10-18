/**
 * Print the role manuals.
 *
 *   node scripts/make-manuals.mjs "<output folder>"
 *
 * WHAT MAKES THESE DIFFERENT FROM THE SET THEY REPLACE. The old ones were written from the
 * codebase: prose paragraphs with `/work/areas` in brackets. Nobody types a URL. They look at
 * a menu and click a word, and if the document does not use that word it is not a manual, it
 * is a map of the database.
 *
 * So: every screen name here is read out of `src/lib/destinations.ts`, which is the single
 * registry the sidebar, the command palette and every hub header take their labels from. A
 * manual therefore cannot name a screen that does not exist — and renaming a screen in the
 * product reprints the manuals rather than silently making them wrong.
 *
 * And the check is hard. If a path chip names a sidebar item or a tab that is not in the
 * product, this script FAILS rather than printing it. A manual that is confidently wrong
 * about where a button is costs more than no manual, because the reader concludes the
 * product is broken rather than the document.
 */
import { chromium } from 'playwright';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CSS, icon } from '../docs/manuals/design.mjs';
import { ADMIN, MENU, ROLES, TABS } from '../docs/manuals/roles.mjs';
import { FLOW, GLOSSARY, MASTERY } from '../docs/manuals/mastery.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FE = resolve(HERE, '..');
const OUT = resolve(process.argv[2] || join(FE, 'docs', 'manuals', 'out'));
/** Second argument, or the app's own public folder. Pass "" to skip. */
const PUBLIC = process.argv[3] === '' ? null
  : resolve(process.argv[3] || join(FE, 'public', 'guides'));

// ── The one source of names ─────────────────────────────────────────────────────────────
const destSrc = readFileSync(join(FE, 'src', 'lib', 'destinations.ts'), 'utf8');
const DEST = {};
for (const m of destSrc.matchAll(/'(\/[^']+)':\s*\{([\s\S]*?)\n\s*\},/g)) {
  const [, path, body] = m;
  const field = (k) => (body.match(new RegExp(`${k}:\\s*'([^']*)'`)) || [])[1] ?? null;
  DEST[path] = { short: field('short'), full: field('full'), hint: field('hint') };
}
if (Object.keys(DEST).length < 40) {
  throw new Error(`Only parsed ${Object.keys(DEST).length} destinations — the registry format moved.`);
}

const nameOf = (path) => {
  const d = DEST[path];
  if (!d?.short) throw new Error(`No name in destinations.ts for ${path}`);
  return d.short;
};
const hintOf = (path) => DEST[path]?.hint ?? '';

// Every label a path chip is allowed to use: the sidebar rows, the admin groups, and the
// tabs inside each destination.
const SIDEBAR = MENU.flatMap((g) => g.rows.map((r) => nameOf(r.path)));
const TAB_NAMES = new Set(Object.values(TABS).flat().map(nameOf));
const ADMIN_NAMES = new Set(Object.values(ADMIN).flat().map(nameOf));
const KNOWN = new Set([
  ...SIDEBAR,
  ...TAB_NAMES,
  ...ADMIN_NAMES,
  // The collapsed parents themselves. They are headings you expand, not destinations, so
  // they have no entry in the registry and are named here.
  'Admin', 'Company', 'Settings', 'Creator app',
  // The five tabs INSIDE one campaign. They are a route each but not a destination in the
  // registry, because they only exist under a campaign that is already open.
  'Story', 'Delivery', 'Content', 'Performance',
]);

/** Chips that are an instruction rather than a place: a button, a row, a thing to open. */
const isAction = (s) => /^(Open|Add|Ask|Raise|Share|Mint|Money|Set|Send|Create)\b/.test(s)
  || s === 'Share link' || s === 'Money';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** **bold** only. The manuals use no other inline formatting, on purpose. */
const md = (s) => esc(s).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

// ── Pieces ──────────────────────────────────────────────────────────────────────────────
function pathStrip(chips, where) {
  const out = chips.map((c, i) => {
    if (!KNOWN.has(c) && !isAction(c)) {
      throw new Error(
        `"${c}" (in ${where}) is not a sidebar item, a tab, or an action.\n` +
        `  Sidebar: ${SIDEBAR.join(', ')}\n` +
        `  Tabs:    ${[...TAB_NAMES].join(', ')}
` +
        `  Admin:   ${[...ADMIN_NAMES].join(', ')}`);
    }
    const cls = i === 0 ? 'chip start' : (KNOWN.has(c) ? 'chip' : 'chip act');
    return `<span class="${cls}">${esc(c)}</span>`;
  });
  const sep = `<span class="sep">${icon('chevron', 11)}</span>`;
  return `<div class="path"><span class="lbl">Go to</span>${out.join(sep)}</div>`;
}


/* ══ The teaching sections ══════════════════════════════════════════════════════════════
   Everything here answers a question a bullet list cannot: where am I, where does my work
   go, and what does good look like. See docs/manuals/mastery.mjs for why each exists. */

/** A numbered rule above a heading, so the document can be navigated by flicking. */
const opener = (n) => `<div class="opener"><span class="n">${esc(n)}</span>
  <span class="bar"></span></div>`;

/** The day as one sequence rather than three unrelated cards. */
const dayTimeline = (day) => `
  <div class="tl">${day.map((d) => `
    <div class="mo">
      <span class="dot">${icon(d.icon, 10)}</span>
      <div class="hd">${esc(d.head)}</div>
      <ul>${d.items.map((i) => `<li>${md(i)}</li>`).join('')}</ul>
    </div>`).join('')}
  </div>`;

/** The company's whole flow, with this role's stages filled.
    Same ribbon in all five manuals on purpose: five people reading five documents should
    be reading ONE picture of the business, not five. */
const flowRibbon = (mine) => `
  <div class="flow">${FLOW.map((f) => `
    <div class="st${mine.includes(f.key) ? ' on' : ''}">
      <div class="who">${esc(f.who)}</div>
      <div class="wt">${esc(f.what)}</div>
    </div>`).join('')}
  </div>
  <p class="flow-key"><span class="sw"></span> Your part</p>`;

/** A drawn screen with numbered pins.
    A DRAWING and not a screenshot: a screenshot of a product that ships weekly is wrong
    within a month, and nobody reprints a manual because a button moved four pixels. The
    shapes and the words are right, which is what somebody needs to recognise it. */
function drawnScreen(sc) {
  /* A key is [region, text]. The region names the part of the drawing the number is about,
     and the pin is rendered INSIDE that part, so it cannot drift away from what it
     explains and cannot be left off.

     The first version placed pins from a list of fixed coordinates and drew only the first
     two: five numbered explanations, two numbers on the picture. A pin pointing at nothing
     is worse than no pin, because it tells somebody they have missed something. */
  const n = {};              // region -> the number that belongs in it
  sc.keys.forEach(([region], idx) => { if (!(region in n)) n[region] = idx + 1; });
  const pin = (region, style) => (region in n)
    ? `<span class="pin" style="${style}">${n[region]}</span>` : '';

  return `
  <div class="shot">
    <div class="bar">
      <span class="d"></span><span class="d"></span><span class="d"></span>
      <span class="u">${esc(sc.url)}</span>
    </div>
    <div class="body">
      <div class="side">
        ${sc.side.map((it) => `
        <div class="it${it === sc.on ? ' on' : ''}">${esc(it)}${
          it === sc.on ? pin('menu', 'top:50%;right:7px;transform:translateY(-50%)') : ''
        }</div>`).join('')}
      </div>
      <div class="main">
        <div style="position:relative;display:inline-block">
          <div class="h1">${esc(sc.title)}</div>
          <div class="h2">${esc(sc.sub)}</div>
          ${pin('title', 'top:-6px;right:-22px')}
        </div>
        <div class="cards">${(sc.cards || []).map((c, ci) => `
          <div class="card" style="position:relative">
            ${pin('card' + (ci + 1), 'top:-7px;right:-7px')}
            <div class="k">${esc(c.k)}</div>
            <div class="v">${esc(c.v)}</div>
            <div class="s">${esc(c.s)}</div>
          </div>`).join('')}
        </div>
        <div class="rowz">${(sc.rows || []).map((r, ri) => `
          <div class="r" style="position:relative">
            ${pin('row' + (ri + 1), 'top:50%;left:-8px;transform:translateY(-50%)')}
            <span class="nm">${esc(r.nm)}</span>
            <span class="tag${r.hot ? ' hot' : ''}">${esc(r.tag)}</span>
          </div>`).join('')}
        </div>
      </div>
    </div>
  </div>
  <ul class="keys">${sc.keys.map(([, text], idx) => `
    <li><span class="n">${idx + 1}</span><span>${md(text)}</span></li>`).join('')}
  </ul>`;
}

/** One real job, followed the whole way, with real numbers. */
const workedExample = (st) => `
  <div class="story">
    <div class="hd">${icon('lightbulb', 15)} ${esc(st.title)}</div>
    <div class="bd">${st.beats.map(([t, x]) => `
      <div class="beat"><div class="t">${esc(t)}</div><div class="x">${md(x)}</div></div>`)
      .join('')}
    </div>
  </div>`;

/** Right and wrong, printed together, because the lesson is the difference. */
const goodAndBad = (vs) => `
  <div class="vs">
    <div class="col good">
      <div class="ttl">${icon('check', 14)} What good looks like</div>
      <ul>${vs.good.map((x) => `<li>${md(x)}</li>`).join('')}</ul>
    </div>
    <div class="col bad">
      <div class="ttl">${icon('x', 14)} What has actually gone wrong</div>
      <ul>${vs.bad.map((x) => `<li>${md(x)}</li>`).join('')}</ul>
    </div>
  </div>`;

const glossary = () => `
  <div class="gloss">${GLOSSARY.map(([w, d]) => `
    <div class="t"><div class="w">${esc(w)}</div><div class="d">${esc(d)}</div></div>`)
    .join('')}
  </div>`;

/** The last page, meant to be pinned up. If somebody reads one page, it is this one. */
const quickCard = (role, blocks) => `
  <div class="card-page">
    <div class="qr">
      <div class="hd">
        <h2>${esc(role.title)}</h2>
        <span class="r">${esc(role.person)}</span>
      </div>
      ${blocks.map(([lbl, items]) => `
        <div class="blk">
          <div class="lbl">${esc(lbl)}</div>
          <ul>${items.map((i) => `<li>${md(i)}</li>`).join('')}</ul>
        </div>`).join('')}
      <div class="foot">
        <span>Following</span>
        <span>Pin this up. The rest of the manual explains it.</span>
      </div>
    </div>
  </div>`;

const dayCards = (day) => `
  <div class="day">${day.map((d) => `
    <div class="c">
      <div class="h">${icon(d.icon, 15)}<span>${esc(d.head)}</span></div>
      <ul>${d.items.map((i) => `<li>${md(i)}</li>`).join('')}</ul>
    </div>`).join('')}
  </div>`;

/**
 * The menu as THIS role sees it.
 *
 * A row carrying `only` is drawn for those slugs alone. The picture is captioned "this is
 * all of it", so a row somebody does not have makes the whole picture a lie and sends them
 * looking down the side of their screen for something that was never there. The name still
 * lives in KNOWN, so a path chip in the manual that does have the row still validates.
 */
const menuMap = (slug) => `
  <div class="menu">${MENU.map((g) => {
    const rows = g.rows.filter((r) => !r.only || r.only.includes(slug));
    if (!rows.length) return '';
    return `
    ${g.group ? `<div class="grp">${esc(g.group)}</div>` : ''}
    ${rows.map((r) => `
      <div class="row">
        <span class="nm">${icon(r.icon, 14)}${esc(nameOf(r.path))}</span>
        <span class="ds">${esc(hintOf(r.path))}</span>
      </div>`).join('')}`;
  }).join('')}
  </div>`;

const jobCard = (job, n, role) => `
  <div class="job">
    <div class="top">
      <span class="badge">${n}</span>
      <div>
        <h3>${esc(job.title)}</h3>
        ${job.when ? `<div class="when">${esc(job.when)}</div>` : ''}
      </div>
    </div>
    ${job.path ? pathStrip(job.path, `${role} / ${job.title}`) : ''}
    <ol class="steps">${job.steps.map((s) => `<li>${md(s)}</li>`).join('')}</ol>
    ${job.next ? `<div class="next">${icon('check', 13)}<span><b>Next:</b> ${md(job.next)}</span></div>` : ''}
  </div>`;

function page(role) {
  const m = MASTERY[role.slug];
  const today = new Date().toLocaleDateString('en-GB',
    { day: 'numeric', month: 'long', year: 'numeric' });
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(role.title)}, Following</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${CSS}</style></head>
<body>

  <div class="cover">
    <div class="brand"><span class="dot"></span>Following</div>
    ${icon(role.glyph || 'target', 300, 'glyph', 0.6)}
    <div class="mid">
      <div class="kicker">${esc(role.kicker)}</div>
      <h1>${esc(role.title)}</h1>
      <div class="rule"></div>
      <p class="lede">${esc(role.lede)}</p>
    </div>
    <div class="foot">
      <div><div class="who">${esc(role.person)}</div>Following FZC</div>
      <div>${esc(today)}</div>
    </div>
  </div>

  <section>
    ${opener('01 \u00b7 Your day')}
    <h2>How a day goes</h2>
    <p class="sub">Three moments. Everything else finds you.</p>
    ${dayTimeline(role.day)}
  </section>

  ${m ? `<section>
    ${opener('02 \u00b7 The whole flow')}
    <h2>Where your work sits</h2>
    <p class="sub">${esc(m.flowNote)}</p>
    ${flowRibbon(m.flow)}
  </section>` : ''}

  ${m ? `<section class="page-break">
    ${opener('03 \u00b7 Your screen')}
    <h2>The screen you will live in</h2>
    <p class="sub">Drawn, not photographed, so it stays true when a button moves.
      The numbers are explained underneath.</p>
    ${drawnScreen(m.screen)}
  </section>` : ''}

  <section${m ? '' : ' class="page-break"'}>
    ${opener('04 \u00b7 The menu')}
    <h2>Where things live</h2>
    <p class="sub">The menu down the left of the screen. This is all of it.</p>
    ${menuMap(role.slug)}
  </section>

  <section class="page-break">
    ${opener('05 \u00b7 Your jobs')}
    <h2>What you actually do</h2>
    <p class="sub">In order. The strip on each card is what to click, as you click it.</p>
    ${role.jobs.map((j, i) => jobCard(j, i + 1, role.title)).join('')}
  </section>

  ${m ? `<section class="page-break">
    ${opener('06 \u00b7 A real one')}
    <h2>${esc(m.story.title)}</h2>
    <p class="sub">One job, followed the whole way, with the real numbers.</p>
    ${workedExample(m.story)}
  </section>` : ''}

  ${m ? `<section>
    ${opener('07 \u00b7 Right and wrong')}
    <h2>What good looks like</h2>
    <p class="sub">Everything on the right has actually happened here and cost us
      something.</p>
    ${goodAndBad(m.vs)}
  </section>` : ''}

  <section class="page-break">
    ${opener('08 \u00b7 Vocabulary')}
    <h2>Words we use</h2>
    <p class="sub">They mean something specific. A roster is not a list, and cost is not
      sell.</p>
    ${glossary()}
  </section>

  <section>
    ${opener('09 \u00b7 The hard rules')}
    <h2>Rules that cost money</h2>
    <p class="sub">Each one has already cost us something.</p>
    <div class="rules"><ul>
      ${role.rules.map((r) => `<li>${icon('ban', 14)}<span>${md(r)}</span></li>`).join('')}
    </ul></div>
  </section>

  <section>
    <p class="note">
      Every screen in the platform is explained under <strong>Guide</strong> in the menu.
      If something here does not match what you see, the product is right and this is out of
      date. Say so and it gets reprinted.
    </p>
  </section>

  ${m ? quickCard(role, m.card) : ''}

</body></html>`;
}

// ── Print ───────────────────────────────────────────────────────────────────────────────
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const tab = await browser.newPage();

for (const role of ROLES) {
  const html = page(role);
  const name = `Manual - ${role.file}`;
  await tab.setContent(html, { waitUntil: 'networkidle' });
  await tab.pdf({
    path: join(OUT, `${name}.pdf`),
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    // No footer on the cover: a page number under a cover is the clearest sign a document
    // was generated by something that did not look at it.
    footerTemplate:
      `<div style="width:100%;padding:0 16mm;font:7.5pt Manrope,Arial,sans-serif;color:#9A9A9A;
        display:flex;justify-content:space-between;">
        <span>Following &middot; ${esc(role.title)}</span>
        <span class="pageNumber"></span>
      </div>`,
    margin: { top: '15mm', bottom: '14mm', left: '0', right: '0' },
  });
  writeFileSync(join(OUT, `${name}.html`), html, 'utf8');

  // The same file, under the URL-safe name the product links to, so "Print this guide" on
  // /work/guide hands somebody the manual they already have on their desk rather than the
  // set these replace. Three places, one source: see project_role_guides_generated.
  if (role.slug && PUBLIC) {
    mkdirSync(PUBLIC, { recursive: true });
    copyFileSync(join(OUT, `${name}.pdf`), join(PUBLIC, `${role.slug}.pdf`));
  }
  console.log('printed', `${name}.pdf`);
}

await browser.close();
console.log(`\n${ROLES.length} manuals -> ${OUT}`);
