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
]);

/** Chips that are an instruction rather than a place: a button, a row, a thing to open. */
const isAction = (s) => /^(Open|Add|Share|Mint|Money|Set|Send|Create)\b/.test(s)
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
    <h2>Your day</h2>
    <p class="sub">Three habits. Everything else comes to you.</p>
    ${dayCards(role.day)}
  </section>

  <section>
    <h2>Where things live</h2>
    <p class="sub">The menu down the left of the screen. This is all of it.</p>
    ${menuMap(role.slug)}
  </section>

  <section class="page-break">
    <h2>Your jobs</h2>
    <p class="sub">In order. The strip on each card is what to click.</p>
    ${role.jobs.map((j, i) => jobCard(j, i + 1, role.title)).join('')}
  </section>

  <section>
    <h2>Rules that cost money</h2>
    <p class="sub">Each one has cost us something.</p>
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
