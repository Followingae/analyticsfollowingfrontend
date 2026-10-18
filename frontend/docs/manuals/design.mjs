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
`;
