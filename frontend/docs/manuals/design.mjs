/**
 * The look of a Following manual.
 *
 * WHY THIS IS A FILE AND NOT CSS PASTED INTO THE GENERATOR. The manuals are the first thing
 * a new person here reads, and the last set were judged "very very bad": a wall of prose
 * with URL slugs in brackets. Slugs are the giveaway that a document was written from the
 * code rather than from the screen — nobody types a URL, they click a thing that has a name.
 *
 * So this file holds two commitments.
 *
 * ONE: EVERY NAME COMES FROM THE PRODUCT. `destinations.ts` is the single registry the
 * sidebar, the command palette and every hub header take their labels from. The generator
 * reads it, so a screen called "Pending rates" is called that here, and renaming a screen
 * reprints the manuals rather than making them wrong.
 *
 * TWO: A ROUTE IS DRAWN, NOT SPELLED. Anywhere a person has to go, the page shows the actual
 * path as chips — sidebar item, then tab, then the button — in the order you click them.
 *
 * The restraint is deliberate. Lime is an accent and never a background for text; the ink is
 * near-black rather than black so large headings do not vibrate on coated paper; and there is
 * one accent per page at most. A document that shouts on every page has no emphasis left.
 */

export const INK = '#141414';
export const MUTED = '#6E6E6E';
export const FAINT = '#9A9A9A';
export const LINE = '#E7E7E3';
export const WASH = '#F7F7F4';
export const LIME = '#C8E034';
export const LIME_DEEP = '#8DA81A';

/**
 * Lucide paths, inlined.
 *
 * Inline rather than a font or an <img>: an icon font prints as a missing glyph box when the
 * font fails to embed, and an external image is a network request a PDF renderer may skip.
 * A path always prints. `stroke="currentColor"` so an icon inherits whatever ink it sits in.
 */
const PATHS = {
  sunrise: 'M12 2v8M4.93 10.93 6.34 12.34M2 18h2M20 18h2M19.07 10.93l-1.41 1.41M22 22H2M16 6l-4-4-4 4M16 18a4 4 0 0 0-8 0',
  clock: 'M12 6v6l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z',
  moon: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z',
  mail: 'M22 7 13.03 12.7a2 2 0 0 1-2.06 0L2 7M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  book: 'M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20',
  clipboard: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1ZM9 14l2 2 4-4',
  building: 'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18ZM6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2M10 6h4M10 10h4M10 14h4M10 18h4',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  megaphone: 'm3 11 18-5v12L3 14v-3ZM11.6 16.8a3 3 0 1 1-5.8-1.6',
  wallet: 'M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4',
  search: 'm21 21-4.34-4.34M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z',
  tag: 'M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42ZM7 7h.01',
  send: 'M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11zM21.854 2.147l-10.94 10.939',
  check: 'M20 6 9 17l-5-5',
  ban: 'M4.9 4.9l14.2 14.2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z',
  alert: 'M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z',
  banknote: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 6h20v12H2zM6 12h.01M18 12h.01',
  file: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7ZM14 2v4a2 2 0 0 0 2 2h4M9 15l2 2 4-4',
  handshake: 'm11 17 2 2a1 1 0 1 0 3-3M14 14l2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4M2 14l6 6M3 4l4.5 4.5',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  shield: 'm12 22 7-4V6l-7-3-7 3v12zM9 12l2 2 4-4',
  chevron: 'm9 18 6-6-6-6',
  camera: 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3ZM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  receipt: 'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1ZM16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 17.5v-11',
  phone: 'M13 2a9 9 0 0 1 9 9M13 6a5 5 0 0 1 5 5M10.1 13.9a14 14 0 0 0 6 6l1.3-1.8a1 1 0 0 1 1.1-.4c1.2.4 2.4.6 3.5.6a1 1 0 0 1 1 1V22a1 1 0 0 1-1 1A18 18 0 0 1 1 5a1 1 0 0 1 1-1h3.1a1 1 0 0 1 1 1c0 1.2.2 2.4.6 3.5a1 1 0 0 1-.3 1z',
  hand: 'M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8'
        + 'M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6'
        + 'a2 2 0 0 1 2.83-2.82L7 15',
  sparkle: 'm12 3-1.9 5.8L4 10.7l6.1 1.9L12 18.4l1.9-5.8L20 10.7l-6.1-1.9Z',
  arrow: 'M5 12h14M12 5l7 7-7 7',
  x: 'M18 6 6 18M6 6l12 12',
  lightbulb: 'M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z',
  quote: 'M10 11H6a1 1 0 0 1-1-1V8a3 3 0 0 1 3-3M19 11h-4a1 1 0 0 1-1-1V8a3 3 0 0 1 3-3',
  layers: 'm12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5',
};

/**
 * `cls` is appended to the base class rather than passed through `extra`.
 *
 * It used to be a free-form attribute string, and passing `class="ic glyph"` through it
 * emitted TWO class attributes on one element. The parser keeps the first and silently drops
 * the second, so the cover glyph rendered as a 300px black icon in the top left instead of a
 * pale lime one bled off the bottom corner.
 */
export function icon(name, size = 16, cls = '', stroke = 1.6) {
  const d = PATHS[name] || PATHS.check;
  return `<svg class="ic${cls ? ' ' + cls : ''}" width="${size}" height="${size}"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}"
    stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
}

export const CSS = `
@page { size: A4; margin: 17mm 16mm 20mm; }
@page :first { margin: 0; }

* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body {
  margin: 0; color: ${INK}; background: #fff;
  font: 10.2pt/1.62 Manrope, "Segoe UI", -apple-system, Helvetica, Arial, sans-serif;
  font-variant-numeric: tabular-nums;
}
.ic { flex: none; vertical-align: -0.18em; }

/* ── Cover ───────────────────────────────────────────────────────────────────────────
   A composition, not a title floating in white. The first draft put the brand at the top
   and then let two margin-top:auto rules fight over the space, which parked the title in
   the middle of an empty page and read as unfinished rather than restrained.
   Now: a lime band anchors the top edge, the role name sits on the optical third, and an
   oversized role glyph fills the lower right at low opacity so the page has a subject. */
.cover {
  height: 297mm; padding: 24mm 20mm 20mm; display: flex; flex-direction: column;
  break-after: page; position: relative; background: #fff; overflow: hidden;
}
.cover::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 9mm;
  background: ${LIME}; }
.cover .brand { display: flex; align-items: center; gap: 9px; position: relative;
  font-size: 9.5pt; letter-spacing: .16em; text-transform: uppercase; font-weight: 800;
  margin-top: 4mm; }
.cover .dot { width: 9px; height: 9px; background: ${INK}; border-radius: 2px; }
/* The glyph. Large, pale, and cropped by the page edge so it reads as a graphic device
   rather than a very big icon somebody forgot to resize. */
.cover .glyph { position: absolute; right: -26mm; bottom: -26mm; color: ${LIME};
  opacity: .22; }
.cover .mid { margin-top: 30mm; position: relative; }
.cover .kicker { font-size: 8.5pt; letter-spacing: .18em; text-transform: uppercase;
  color: ${MUTED}; font-weight: 800; }
.cover h1 { font-size: 52pt; line-height: .98; letter-spacing: -.04em; margin: 12px 0 0;
  font-weight: 800; max-width: 13ch; }
.cover .rule { width: 84px; height: 6px; background: ${LIME}; margin: 22px 0 20px;
  border-radius: 3px; }
.cover .lede { font-size: 12.5pt; line-height: 1.55; color: ${INK}; max-width: 33ch;
  font-weight: 500; }
.cover .foot { margin-top: auto; display: flex; justify-content: space-between;
  align-items: flex-end; font-size: 9pt; color: ${FAINT}; position: relative;
  border-top: 1px solid ${LINE}; padding-top: 7mm; }
.cover .who { font-size: 11pt; color: ${INK}; font-weight: 700; letter-spacing: -.01em; }

/* ── Sections ───────────────────────────────────────────────────────────────────────── */
h2 { font-size: 17pt; letter-spacing: -.02em; font-weight: 800; margin: 0 0 3px;
  break-after: avoid; }
.sub { color: ${MUTED}; font-size: 10pt; margin: 0 0 16px; max-width: 46ch; }
section { break-inside: auto; margin-bottom: 20pt; }
section + section { padding-top: 4pt; }
.page-break { break-before: page; }

/* ── The day: three cards ───────────────────────────────────────────────────────────── */
.day { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.day .c { border: 1px solid ${LINE}; border-radius: 10px; padding: 13px 13px 14px;
  break-inside: avoid; }
.day .h { display: flex; align-items: center; gap: 7px; font-weight: 700; font-size: 10pt;
  margin-bottom: 9px; }
.day .h .ic { color: ${LIME_DEEP}; }
.day ul { margin: 0; padding-left: 15px; }
.day li { margin: 0 0 5px; font-size: 9.4pt; line-height: 1.5; color: ${INK}; }
.day li::marker { color: ${FAINT}; }

/* ── Where things live ──────────────────────────────────────────────────────────────── */
.menu { border: 1px solid ${LINE}; border-radius: 10px; overflow: hidden; break-inside: avoid; }
.menu .grp { background: ${WASH}; font-size: 8pt; letter-spacing: .14em; font-weight: 700;
  text-transform: uppercase; color: ${MUTED}; padding: 7px 13px; border-bottom: 1px solid ${LINE}; }
.menu .row { display: flex; align-items: baseline; gap: 10px; padding: 8px 13px;
  border-bottom: 1px solid ${LINE}; }
.menu .row:last-child { border-bottom: 0; }
.menu .nm { font-weight: 700; width: 128px; flex: none; display: flex; align-items: center;
  gap: 7px; font-size: 9.8pt; }
.menu .nm .ic { color: ${MUTED}; }
.menu .ds { color: ${MUTED}; font-size: 9.4pt; }

/* ── A job ──────────────────────────────────────────────────────────────────────────── */
.job { border: 1px solid ${LINE}; border-radius: 10px; padding: 15px 16px 16px;
  margin-bottom: 11px; break-inside: avoid; }
.job .top { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 11px; }
.job .badge { width: 27px; height: 27px; border-radius: 7px; background: ${LIME};
  color: ${INK}; display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 10.5pt; flex: none; }
.job h3 { margin: 2px 0 0; font-size: 12.5pt; letter-spacing: -.015em; font-weight: 800; }
.job .when { color: ${MUTED}; font-size: 9.2pt; margin-top: 2px; }
ol.steps { margin: 0; padding: 0; list-style: none; counter-reset: s; }
ol.steps > li { counter-increment: s; position: relative; padding-left: 23px;
  margin-bottom: 7px; font-size: 9.9pt; line-height: 1.55; }
ol.steps > li::before { content: counter(s); position: absolute; left: 0; top: .08em;
  width: 15px; height: 15px; border-radius: 50%; background: ${WASH}; color: ${MUTED};
  font-size: 7.4pt; font-weight: 800; display: flex; align-items: center;
  justify-content: center; }
.job .next { display: flex; gap: 7px; margin-top: 11px; padding-top: 10px;
  border-top: 1px solid ${LINE}; font-size: 9.3pt; color: ${MUTED}; }
.job .next .ic { color: ${LIME_DEEP}; margin-top: .15em; }
.job .next b { color: ${INK}; font-weight: 700; }

/* ── The path strip: what to click, in order ────────────────────────────────────────── */
.path { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; margin: 0 0 11px; }
.path .chip { display: inline-flex; align-items: center; gap: 5px; border: 1px solid ${LINE};
  background: #fff; border-radius: 6px; padding: 3px 8px; font-size: 8.8pt; font-weight: 600;
  white-space: nowrap; }
.path .chip.start { background: ${INK}; color: #fff; border-color: ${INK}; }
.path .chip.act { border-color: ${LIME_DEEP}; color: ${LIME_DEEP}; }
.path .sep { color: ${FAINT}; display: flex; }
.path .lbl { font-size: 8pt; letter-spacing: .1em; text-transform: uppercase; color: ${FAINT};
  font-weight: 700; margin-right: 2px; }

/* ── Rules ──────────────────────────────────────────────────────────────────────────── */
.rules { border: 1px solid ${LINE}; border-left: 4px solid ${LIME}; border-radius: 10px;
  padding: 14px 16px; break-inside: avoid; background: ${WASH}; }
.rules ul { margin: 0; padding: 0; list-style: none; }
.rules li { display: flex; gap: 9px; margin-bottom: 8px; font-size: 9.8pt; line-height: 1.55; }
.rules li:last-child { margin-bottom: 0; }
.rules .ic { color: ${INK}; margin-top: .2em; }

/* ── Small print ────────────────────────────────────────────────────────────────────── */
.note { font-size: 9.2pt; color: ${MUTED}; max-width: 52ch; }
b, strong { font-weight: 700; }

/* ════════════════════════════════════════════════════════════════════════════════════
   THE SECOND PASS (2026-10-18)

   The first set was judged "shitty still, won't help them master the platform". That is a
   fair read of a document made of boxes and bullet lists: it told somebody the name of a
   screen and left them to work out the rest.

   Mastery needs three things a bullet list cannot give:

     WHERE AM I          a picture of the actual screen with the parts numbered, so the
                         first time they open it is the second time they have seen it.
     WHERE DOES THIS GO  the company's whole flow on one line with their lane lit, so they
                         can see who hands to them and who they are holding up.
     WHAT DOES GOOD LOOK LIKE
                         one real job followed the whole way, and the mistakes that have
                         actually cost us money, printed beside the right answer.

   Everything below exists for one of those three. The restraint from the first pass
   stands: lime is structure and emphasis, never decoration, one loud thing per spread.
   ════════════════════════════════════════════════════════════════════════════════════ */

.opener { display: flex; align-items: baseline; gap: 10px; margin: 0 0 4px; }
.opener .n { font-size: 9pt; font-weight: 800; letter-spacing: .14em; color: ${LIME_DEEP}; }
.opener .bar { flex: 1; height: 2px; background: ${LINE}; border-radius: 1px; }

/* ── The day, as a timeline ─────────────────────────────────────────────────────────
   Was three cards in a row, which reads as three unrelated lists. A day is a sequence,
   so it is drawn as one: a spine down the left and three moments on it. */
.tl { position: relative; padding-left: 26px; }
.tl::before { content: ''; position: absolute; left: 8px; top: 10px; bottom: 10px;
  width: 2px; background: ${LINE}; }
.tl .mo { position: relative; margin-bottom: 14px; break-inside: avoid; }
.tl .mo:last-child { margin-bottom: 0; }
.tl .dot { position: absolute; left: -26px; top: 1px; width: 18px; height: 18px;
  border-radius: 50%; background: #fff; border: 2px solid ${LIME}; display: flex;
  align-items: center; justify-content: center; color: ${LIME_DEEP}; }
.tl .hd { font-weight: 800; font-size: 10.5pt; margin-bottom: 5px; letter-spacing: -.01em; }
.tl ul { margin: 0; padding-left: 14px; }
.tl li { font-size: 9.6pt; line-height: 1.55; margin-bottom: 3px; }
.tl li::marker { color: ${FAINT}; }

/* ── The flow ribbon ────────────────────────────────────────────────────────────────
   The whole company on one line with this role's stages filled. It answers the question
   every new person asks in week one and nobody ever writes down: who gives me work, and
   who am I holding up. */
.flow { display: flex; gap: 0; break-inside: avoid; margin: 2px 0 10px; }
.flow .st { flex: 1; position: relative; padding: 11px 10px 12px; border: 1px solid ${LINE};
  border-right: 0; background: #fff; }
.flow .st:first-child { border-radius: 9px 0 0 9px; }
.flow .st:last-child { border-right: 1px solid ${LINE}; border-radius: 0 9px 9px 0; }
.flow .st.on { background: ${LIME}; border-color: ${LIME}; }
.flow .who { font-size: 7.4pt; letter-spacing: .12em; text-transform: uppercase;
  font-weight: 800; color: ${MUTED}; margin-bottom: 3px; }
.flow .st.on .who { color: ${INK}; opacity: .62; }
.flow .wt { font-size: 9.4pt; font-weight: 700; line-height: 1.3; letter-spacing: -.01em; }
.flow-key { font-size: 8.6pt; color: ${MUTED}; display: flex; align-items: center; gap: 7px; }
.flow-key .sw { width: 13px; height: 9px; background: ${LIME}; border-radius: 2px; flex: none; }

/* ── A drawn screen, with the parts numbered ────────────────────────────────────────
   The most useful thing in the document and the only one that takes real space. It is a
   DRAWING, not a screenshot: a screenshot of a product that ships weekly is wrong within
   a month, and nobody reprints a manual because a button moved four pixels. The shapes
   are right, the words are right, and the numbers hang off the parts that matter. */
.shot { border: 1px solid ${LINE}; border-radius: 11px; overflow: hidden;
  break-inside: avoid; background: ${WASH}; }
.shot .bar { display: flex; align-items: center; gap: 6px; padding: 7px 11px;
  background: #fff; border-bottom: 1px solid ${LINE}; }
.shot .bar .d { width: 7px; height: 7px; border-radius: 50%; background: ${LINE}; }
.shot .bar .u { margin-left: 6px; font-size: 8pt; color: ${FAINT};
  font-family: ui-monospace, Menlo, monospace; }
.shot .body { display: flex; min-height: 50mm; }
.shot .side { width: 34mm; flex: none; background: #fff; border-right: 1px solid ${LINE};
  padding: 9px 0; }
.shot .side .it { display: flex; align-items: center; gap: 7px; padding: 5px 11px;
  font-size: 8.6pt; color: ${MUTED}; }
.shot .side .it.on { background: ${WASH}; color: ${INK}; font-weight: 700;
  box-shadow: inset 2px 0 0 ${LIME}; position: relative; }
.shot .main { flex: 1; padding: 12px 13px; position: relative; }
.shot .h1 { font-size: 12.5pt; font-weight: 800; letter-spacing: -.02em; }
.shot .h2 { font-size: 8.6pt; color: ${MUTED}; margin-top: 2px; }
.shot .cards { display: flex; gap: 7px; margin-top: 10px; }
.shot .card { flex: 1 1 0; min-width: 0; background: #fff; border: 1px solid ${LINE};
  border-radius: 7px; padding: 8px 9px; }
.shot .card .k { font-size: 7pt; letter-spacing: .1em; text-transform: uppercase;
  color: ${FAINT}; font-weight: 800; }
.shot .card .v { font-size: 13pt; font-weight: 800; letter-spacing: -.02em; margin-top: 2px; }
.shot .card .s { font-size: 7.6pt; color: ${MUTED}; margin-top: 1px; }
/* overflow is VISIBLE on purpose: a numbered pin hangs off the left edge of a row, and
   clipping sliced it in half. The rows are white on white so nothing else escapes. */
.shot .rowz { margin-top: 9px; background: #fff; border: 1px solid ${LINE};
  border-radius: 7px; }
.shot .rowz .r { display: flex; align-items: center; gap: 8px; padding: 7px 10px;
  border-bottom: 1px solid ${LINE}; font-size: 8.6pt; }
.shot .rowz .r:last-child { border-bottom: 0; }
.shot .rowz .r .nm { font-weight: 700; flex: 1; }
.shot .rowz .r .tag { font-size: 7.2pt; border: 1px solid ${LINE}; border-radius: 20px;
  padding: 1px 7px; color: ${MUTED}; }
.shot .rowz .r .tag.hot { background: ${LIME}; border-color: ${LIME}; color: ${INK};
  font-weight: 700; }
.shot .btn { display: inline-flex; align-items: center; gap: 5px; background: ${INK};
  color: #fff; border-radius: 6px; padding: 4px 10px; font-size: 8.2pt; font-weight: 700; }

/* The pin. Placed absolutely by the caller, so a number can sit on any part. */
.pin { position: absolute; width: 16px; height: 16px; border-radius: 50%; background: ${INK};
  color: #fff; font-size: 7.6pt; font-weight: 800; display: flex; align-items: center;
  justify-content: center; box-shadow: 0 0 0 2.5px #fff; }
.keys { margin: 10px 0 0; padding: 0; list-style: none; display: grid;
  grid-template-columns: 1fr 1fr; gap: 6px 16px; }
.keys li { display: flex; gap: 8px; font-size: 9.2pt; line-height: 1.5; break-inside: avoid; }
.keys .n { width: 16px; height: 16px; border-radius: 50%; background: ${INK}; color: #fff;
  font-size: 7.6pt; font-weight: 800; display: flex; align-items: center;
  justify-content: center; flex: none; margin-top: .14em; }

/* ── Worked example ─────────────────────────────────────────────────────────────────
   One real thing followed the whole way. The steps say what to do; this says what it
   looks like when it is done properly, which is a different lesson. */
.story { border: 1px solid ${LINE}; border-radius: 11px; overflow: hidden; break-inside: avoid; }
.story .hd { background: ${INK}; color: #fff; padding: 10px 14px; display: flex;
  align-items: center; gap: 8px; font-weight: 800; font-size: 10.5pt; }
.story .hd .ic { color: ${LIME}; }
.story .bd { padding: 13px 15px; }
.story .beat { display: flex; gap: 11px; margin-bottom: 10px; break-inside: avoid; }
.story .beat:last-child { margin-bottom: 0; }
.story .t { width: 56px; flex: none; font-size: 8pt; font-weight: 800; color: ${LIME_DEEP};
  letter-spacing: .06em; text-transform: uppercase; padding-top: .18em; }
.story .x { font-size: 9.6pt; line-height: 1.55; }

/* ── Good and bad, side by side ─────────────────────────────────────────────────────
   Paired, because the lesson is the DIFFERENCE. Printed apart they read as two lists of
   advice and the contrast, which is the whole point, is lost. */
.vs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; break-inside: avoid; }
.vs .col { border: 1px solid ${LINE}; border-radius: 10px; padding: 12px 13px 13px; }
.vs .col.good { border-color: ${LIME_DEEP}; }
.vs .ttl { display: flex; align-items: center; gap: 7px; font-weight: 800; font-size: 9.6pt;
  margin-bottom: 9px; }
.vs .col.good .ttl .ic { color: ${LIME_DEEP}; }
.vs .col.bad .ttl .ic { color: ${MUTED}; }
.vs ul { margin: 0; padding: 0; list-style: none; }
.vs li { font-size: 9.2pt; line-height: 1.5; margin-bottom: 7px; padding-left: 13px;
  position: relative; }
.vs li:last-child { margin-bottom: 0; }
.vs li::before { content: ''; position: absolute; left: 0; top: .55em; width: 5px;
  height: 5px; border-radius: 50%; background: ${LINE}; }
.vs .col.good li::before { background: ${LIME}; }

/* ── Words we use ───────────────────────────────────────────────────────────────────
   Half the confusion in a new product is vocabulary, and ours has words that mean
   something specific: a roster is not a list, a deal is not a campaign, cost is not
   sell. Two columns so it stays on one page. */
.gloss { columns: 2; column-gap: 18px; }
.gloss .t { break-inside: avoid; margin-bottom: 9px; }
.gloss .w { font-weight: 800; font-size: 9.6pt; }
.gloss .d { font-size: 9pt; color: ${MUTED}; line-height: 1.5; }

/* ── The card on the back ───────────────────────────────────────────────────────────
   One page, the whole job, meant to be pinned up. If somebody only ever reads one page
   of this document it will be this one, so it carries the five things that matter and
   nothing else. */
.card-page { break-before: page; height: 297mm; padding: 20mm; display: flex;
  flex-direction: column; }
.qr { border: 2px solid ${INK}; border-radius: 14px; padding: 16px 18px; flex: 1;
  display: flex; flex-direction: column; }
.qr .hd { display: flex; align-items: baseline; justify-content: space-between;
  border-bottom: 2px solid ${INK}; padding-bottom: 10px; margin-bottom: 14px; }
.qr .hd h2 { font-size: 30pt; margin: 0; letter-spacing: -.03em; }
.qr .hd .r { font-size: 10pt; letter-spacing: .16em; text-transform: uppercase;
  font-weight: 800; color: ${MUTED}; }
/* Each block takes an equal share of the height. Without this the card was a third of an
   A4 page of text with two thirds of white underneath it, which reads as unfinished
   rather than spacious - and this is the page most likely to end up on a wall. */
.qr .blk { flex: 1; display: flex; flex-direction: column; justify-content: center;
  padding: 4px 0; border-bottom: 1px solid ${LINE}; }
.qr .blk:last-of-type { border-bottom: 0; }
.qr .blk .lbl { font-size: 9pt; letter-spacing: .16em; text-transform: uppercase;
  font-weight: 800; color: ${LIME_DEEP}; margin-bottom: 7px; }
.qr ul { margin: 0; padding-left: 18px; }
.qr li { font-size: 13pt; line-height: 1.45; margin-bottom: 5px; font-weight: 500; }
.qr .foot { margin-top: auto; border-top: 1px solid ${LINE}; padding-top: 10px;
  font-size: 8.6pt; color: ${FAINT}; display: flex; justify-content: space-between; }
`;
