/**
 * The look of a Following manual.
 *
 * ⚠️ THIRD PASS (2026-10-18). The second was rejected outright: "extremely poor design,
 * overflowing, extremely extremely dull and non-agency reflective at all."
 *
 * The "non-agency" part was the real fault, and it was a fault of research rather than
 * taste. Following has a brand and it is in `NEWFOLLOWINGWEBSITE/src/app/globals.css`.
 * Everything here now comes from there instead of from my own idea of a tidy document:
 *
 *     --accent  #d3ff02    electric lime. I had invented #C8E034, a muted olive.
 *     --radius  0px        SQUARE. I had rounded every box to 10-14px.
 *     --text    #111111    on #ffffff, with #0b0b0d for dark ground
 *     fonts     Manrope 300..800 + PLAYFAIR DISPLAY, used italic
 *
 * That serif italic is the signature. The marketing site sets one emphasised word of each
 * headline in Playfair italic against Manrope, and it is the single thing that makes the
 * brand read as an agency rather than as software. It was missing entirely.
 *
 * The other three rules, read off the same stylesheet:
 *
 *   TYPE IS BIG AND TIGHT. Display runs to 140px at -0.045em with line-height 1.0. A 52pt
 *   cover heading with comfortable leading is a consultancy report, which is what the last
 *   set looked like.
 *
 *   LABELS ARE TINY AND WIDE. 11px uppercase at 0.15em to 0.3em tracking. The contrast
 *   between those two is the whole typographic idea; the last set had one mild size for
 *   everything and therefore no voice.
 *
 *   LIME IS A BLOCK, NEVER A TINT. On the site it is a solid field or nothing. The last
 *   set used it at 22% opacity behind a glyph and as a 4px border, which is decoration.
 *
 * WHAT CARRIES OVER unchanged, because both were right: every name comes from
 * `destinations.ts` so a renamed screen reprints rather than lies, and a route is DRAWN as
 * chips in the order you click them rather than spelled as a URL.
 */

export const INK = '#111111';
export const DARK = '#0b0b0d';
export const PAPER = '#ffffff';
export const CREAM = '#f6f3ef';
export const MUTED = '#666666';
export const FAINT = '#9c9ca4';
export const LINE = 'rgba(0,0,0,0.10)';
export const WASH = '#f5f5f5';
export const LIME = '#d3ff02';
/* Lime is unreadable as a text colour on white, so anything that must be READ in the
   accent uses this instead. It is the only derived value in the file. */
export const LIME_DEEP = '#6f8600';

/**
 * Lucide paths, inlined.
 *
 * Inline rather than a font or an <img>: an icon font prints as a missing glyph box when
 * the font fails to embed, and an external image is a network request a PDF renderer may
 * skip. A path always prints. `stroke="currentColor"` so an icon inherits its ink.
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
  send: 'M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11ZM21.854 2.147l-10.94 10.939',
  check: 'M20 6 9 17l-5-5',
  ban: 'M4.9 4.9l14.2 14.2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z',
  banknote: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 6h20v12H2zM6 12h.01M18 12h.01',
  file: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7ZM14 2v4a2 2 0 0 0 2 2h4',
  handshake: 'm11 17 2 2a1 1 0 1 0 3-3M14 14l2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4M2 7h3M2 11h4',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  shield: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z',
  chevron: 'm9 18 6-6-6-6',
  camera: 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3ZM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  receipt: 'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1ZM8 7h8M8 11h8M8 15h5',
  phone: 'M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384',
  hand: 'M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15',
  sparkle: 'm12 3-1.9 5.8L4 10.7l6.1 1.9L12 18.4l1.9-5.8L20 10.7l-6.1-1.9Z',
  arrow: 'M5 12h14M12 5l7 7-7 7',
  x: 'M18 6 6 18M6 6l12 12',
  lightbulb: 'M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z',
  quote: 'M10 11H6a1 1 0 0 1-1-1V8a3 3 0 0 1 3-3M19 11h-4a1 1 0 0 1-1-1V8a3 3 0 0 1 3-3',
  layers: 'm12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5',
};

export function icon(name, size = 16, cls = '', stroke = 1.6) {
  const d = PATHS[name] || PATHS.check;
  return `<svg class="ic${cls ? ' ' + cls : ''}" width="${size}" height="${size}"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}"
    stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
}

export const CSS = `
@page { size: A4; margin: 0; }

/* ⚠️ EVERY SECTION AVOIDS BREAKING ACROSS A PAGE unless it genuinely cannot fit. The last
   set let a drawn screen split down the middle of a page, which is what "overflowing"
   looked like from the other side of the document. */
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

html, body { margin: 0; padding: 0; }
body {
  font-family: Manrope, -apple-system, BlinkMacSystemFont, sans-serif;
  color: ${INK}; background: ${PAPER};
  font-size: 10.2pt; line-height: 1.6; font-weight: 400;
  font-variant-numeric: tabular-nums;
  padding: 0 18mm 20mm;
}
.ic { flex: none; vertical-align: -0.18em; }
b, strong { font-weight: 700; }

/* The serif italic. One emphasised phrase per heading, as on the site. It is the single
   element that makes this read as an agency rather than as software. */
em, .ser { font-family: "Playfair Display", Georgia, serif; font-style: italic;
  font-weight: 400; letter-spacing: -.01em; }

/* ── Cover ───────────────────────────────────────────────────────────────────────────
   Black ground, one lime block, type at the size the brand actually uses. The previous
   cover was white with a 52pt heading and a pale glyph, which is a report. */
.cover {
  height: 297mm; margin: 0 -18mm; padding: 22mm 18mm 18mm; display: flex;
  flex-direction: column; break-after: page; position: relative;
  background: ${DARK}; color: ${CREAM}; overflow: hidden;
}
.cover .brand { display: flex; align-items: center; gap: 10px; position: relative;
  font-size: 10pt; letter-spacing: .3em; text-transform: uppercase; font-weight: 700; }
.cover .dot { width: 10px; height: 10px; background: ${LIME}; }
.cover .mid { margin-top: auto; position: relative; }
/* The contents, in the space the title was leaving empty. Useful rather than decorative:
   a nine-section document deserves to say what is in it. */
.cover .contents { margin-top: 16mm; position: relative; }
.cover .contents .lbl { font-size: 8.6pt; letter-spacing: .24em; text-transform: uppercase;
  font-weight: 700; color: rgba(246,243,239,.42); margin-bottom: 5mm; }
.cover .contents ol { margin: 0; padding: 0; list-style: none; counter-reset: c;
  columns: 2; column-gap: 12mm; max-width: 112mm; }
.cover .contents li { counter-increment: c; font-size: 10pt; line-height: 1.9;
  color: rgba(246,243,239,.62); display: flex; gap: 10px; break-inside: avoid; }
.cover .contents li::before { content: counter(c, decimal-leading-zero);
  color: ${LIME}; font-weight: 700; font-size: 8.4pt; letter-spacing: .08em;
  padding-top: .28em; }
/* The one human line on the page, and the only place the serif earns its keep here. */
.cover .for { font-size: 24pt; line-height: 1; margin: 5mm 0 0; color: ${LIME};
  letter-spacing: -.02em; }
.cover .kicker { font-size: 10pt; letter-spacing: .24em; text-transform: uppercase;
  color: ${LIME}; font-weight: 700; margin-bottom: 10mm; }
.cover h1 { font-size: 86pt; line-height: .92; letter-spacing: -.05em; margin: 0;
  font-weight: 700; max-width: 11ch; }
.cover h1 em { color: ${LIME}; }
.cover .lede { font-size: 13pt; line-height: 1.5; max-width: 36ch; margin-top: 9mm;
  color: rgba(246,243,239,.76); font-weight: 400; }
.cover .foot { margin-top: 14mm; display: flex; justify-content: space-between;
  align-items: flex-end; font-size: 9.5pt; position: relative;
  border-top: 1px solid rgba(246,243,239,.18); padding-top: 6mm;
  color: rgba(246,243,239,.5); letter-spacing: .04em; }
.cover .who { font-size: 12pt; color: ${CREAM}; font-weight: 700; letter-spacing: -.02em; }
/* A lime rule down the left edge, full bleed. A block, never a tint. */
.cover::after { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 7mm;
  background: ${LIME}; }

/* ── Sections ───────────────────────────────────────────────────────────────────────── */
section { break-inside: avoid; margin-bottom: 14mm; }
.page-break { break-before: page; }
.opener { display: flex; align-items: center; gap: 12px; margin: 0 0 5mm; }
.opener .n { font-size: 9.5pt; font-weight: 700; letter-spacing: .24em;
  text-transform: uppercase; color: ${INK}; background: ${LIME}; padding: 3px 9px; }
.opener .bar { flex: 1; height: 1px; background: ${LINE}; }
h2 { font-size: 30pt; line-height: 1.04; letter-spacing: -.04em; font-weight: 700;
  margin: 0 0 3mm; break-after: avoid; max-width: 20ch; }
h2 em { color: ${LIME_DEEP}; }
.sub { color: ${MUTED}; font-size: 10.6pt; margin: 0 0 7mm; max-width: 54ch;
  line-height: 1.55; }

/* ── The day ─────────────────────────────────────────────────────────────────────────
   A spine with three moments. Square markers, not circles. */
.tl { position: relative; padding-left: 30px; }
.tl::before { content: ''; position: absolute; left: 7px; top: 8px; bottom: 8px;
  width: 1px; background: ${LINE}; }
.tl .mo { position: relative; margin-bottom: 7mm; break-inside: avoid; }
.tl .mo:last-child { margin-bottom: 0; }
.tl .dot { position: absolute; left: -30px; top: 2px; width: 15px; height: 15px;
  background: ${LIME}; display: flex; align-items: center; justify-content: center;
  color: ${INK}; }
.tl .hd { font-weight: 700; font-size: 12pt; margin-bottom: 4px; letter-spacing: -.02em; }
.tl ul { margin: 0; padding-left: 15px; }
.tl li { font-size: 10.2pt; line-height: 1.6; margin-bottom: 2px; }
.tl li::marker { color: ${FAINT}; }

/* ── The flow ribbon ─────────────────────────────────────────────────────────────────
   Square, hard-edged, lime as a solid field. */
.flow { display: flex; break-inside: avoid; margin: 0 0 4mm; border: 1px solid ${INK}; }
.flow .st { flex: 1; padding: 4mm 3mm; border-right: 1px solid ${LINE}; background: ${PAPER}; }
.flow .st:last-child { border-right: 0; }
.flow .st.on { background: ${LIME}; }
.flow .who { font-size: 7.2pt; letter-spacing: .16em; text-transform: uppercase;
  font-weight: 700; color: ${MUTED}; margin-bottom: 3px; }
.flow .st.on .who { color: rgba(17,17,17,.6); }
.flow .wt { font-size: 9.6pt; font-weight: 700; line-height: 1.25; letter-spacing: -.02em; }
.flow-key { font-size: 9pt; color: ${MUTED}; display: flex; align-items: center; gap: 8px;
  letter-spacing: .02em; }
.flow-key .sw { width: 14px; height: 10px; background: ${LIME}; flex: none; }

/* ── A drawn screen ──────────────────────────────────────────────────────────────────
   A DRAWING, not a screenshot: a screenshot of a product that ships weekly is wrong in a
   month and nobody reprints a manual because a button moved. Square, like the product. */
.shot { border: 1px solid ${INK}; break-inside: avoid; background: ${WASH}; }
.shot .bar { display: flex; align-items: center; gap: 6px; padding: 6px 10px;
  background: ${INK}; }
.shot .bar .d { width: 6px; height: 6px; background: rgba(246,243,239,.35); }
.shot .bar .u { margin-left: 6px; font-size: 7.6pt; color: rgba(246,243,239,.62);
  font-family: ui-monospace, Menlo, monospace; letter-spacing: .02em; }
.shot .body { display: flex; min-height: 46mm; }
.shot .side { width: 33mm; flex: none; background: ${PAPER};
  border-right: 1px solid ${LINE}; padding: 7px 0; }
.shot .side .it { display: flex; align-items: center; gap: 7px; padding: 4px 10px;
  font-size: 8.4pt; color: ${MUTED}; }
.shot .side .it.on { background: ${LIME}; color: ${INK}; font-weight: 700;
  position: relative; }
.shot .main { flex: 1; padding: 10px 12px; }
.shot .h1 { font-size: 13pt; font-weight: 700; letter-spacing: -.03em; }
.shot .h2 { font-size: 8.4pt; color: ${MUTED}; margin-top: 1px; }
.shot .cards { display: flex; gap: 6px; margin-top: 9px; }
.shot .card { flex: 1 1 0; min-width: 0; background: ${PAPER};
  border: 1px solid ${LINE}; padding: 7px 8px; }
.shot .card .k { font-size: 6.8pt; letter-spacing: .16em; text-transform: uppercase;
  color: ${MUTED}; font-weight: 700; }
.shot .card .v { font-size: 15pt; font-weight: 700; letter-spacing: -.035em;
  margin-top: 2px; line-height: 1; }
.shot .card .s { font-size: 7.4pt; color: ${MUTED}; margin-top: 3px; }
.shot .rowz { margin-top: 8px; background: ${PAPER}; border: 1px solid ${LINE}; }
.shot .rowz .r { display: flex; align-items: center; gap: 8px; padding: 6px 9px;
  border-bottom: 1px solid ${LINE}; font-size: 8.4pt; }
.shot .rowz .r:last-child { border-bottom: 0; }
.shot .rowz .r .nm { font-weight: 700; flex: 1; }
.shot .rowz .r .tag { font-size: 7pt; border: 1px solid ${LINE}; padding: 1px 6px;
  color: ${MUTED}; letter-spacing: .04em; }
.shot .rowz .r .tag.hot { background: ${LIME}; border-color: ${LIME}; color: ${INK};
  font-weight: 700; }

/* Square pins, because everything else is. */
.pin { position: absolute; width: 15px; height: 15px; background: ${INK}; color: ${LIME};
  font-size: 7.4pt; font-weight: 700; display: flex; align-items: center;
  justify-content: center; }
.keys { margin: 5mm 0 0; padding: 0; list-style: none; display: grid;
  grid-template-columns: 1fr 1fr; gap: 4mm 8mm; }
.keys li { display: flex; gap: 9px; font-size: 9.6pt; line-height: 1.55;
  break-inside: avoid; }
.keys .n { width: 15px; height: 15px; background: ${INK}; color: ${LIME}; font-size: 7.4pt;
  font-weight: 700; display: flex; align-items: center; justify-content: center;
  flex: none; margin-top: .2em; }

/* ── Where things live ──────────────────────────────────────────────────────────────── */
.menu { border: 1px solid ${INK}; break-inside: avoid; }
.menu .grp { background: ${INK}; color: ${CREAM}; font-size: 7.6pt; letter-spacing: .2em;
  font-weight: 700; text-transform: uppercase; padding: 5px 12px; }
.menu .row { display: flex; align-items: baseline; gap: 12px; padding: 7px 12px;
  border-bottom: 1px solid ${LINE}; }
.menu .row:last-child { border-bottom: 0; }
.menu .nm { font-weight: 700; width: 120px; flex: none; display: flex; align-items: center;
  gap: 8px; font-size: 9.8pt; letter-spacing: -.01em; }
.menu .nm .ic { color: ${MUTED}; }
.menu .ds { color: ${MUTED}; font-size: 9.4pt; }

/* ── A job ──────────────────────────────────────────────────────────────────────────── */
.job { border: 1px solid ${LINE}; border-left: 3px solid ${LIME}; padding: 5mm 6mm;
  margin-bottom: 4mm; break-inside: avoid; }
.job .top { display: flex; align-items: flex-start; gap: 11px; margin-bottom: 4mm; }
.job .badge { width: 26px; height: 26px; background: ${INK}; color: ${LIME};
  display: flex; align-items: center; justify-content: center; font-weight: 700;
  font-size: 11pt; flex: none; }
.job h3 { margin: 0; font-size: 14pt; letter-spacing: -.03em; font-weight: 700;
  line-height: 1.15; }
.job .when { color: ${MUTED}; font-size: 9.2pt; margin-top: 2px; }
ol.steps { margin: 0; padding: 0; list-style: none; counter-reset: s; }
ol.steps > li { counter-increment: s; position: relative; padding-left: 24px;
  margin-bottom: 2mm; font-size: 10pt; line-height: 1.6; }
ol.steps > li::before { content: counter(s); position: absolute; left: 0; top: .22em;
  width: 15px; height: 15px; background: ${WASH}; color: ${MUTED}; font-size: 7.4pt;
  font-weight: 700; display: flex; align-items: center; justify-content: center; }
.job .next { display: flex; gap: 8px; margin-top: 4mm; padding-top: 3mm;
  border-top: 1px solid ${LINE}; font-size: 9.4pt; color: ${MUTED}; }
.job .next .ic { color: ${LIME_DEEP}; margin-top: .2em; }
.job .next b { color: ${INK}; font-weight: 700; }

/* ── The path strip ─────────────────────────────────────────────────────────────────── */
.path { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; margin: 0 0 4mm; }
.path .chip { display: inline-flex; align-items: center; gap: 5px; border: 1px solid ${LINE};
  background: ${PAPER}; padding: 3px 8px; font-size: 8.6pt; font-weight: 700;
  white-space: nowrap; letter-spacing: -.01em; }
.path .chip.start { background: ${INK}; color: ${CREAM}; border-color: ${INK}; }
.path .chip.act { background: ${LIME}; border-color: ${LIME}; color: ${INK}; }
.path .sep { color: ${FAINT}; display: flex; }
.path .lbl { font-size: 7.6pt; letter-spacing: .2em; text-transform: uppercase;
  color: ${MUTED}; font-weight: 700; margin-right: 3px; }

/* ── Worked example ─────────────────────────────────────────────────────────────────── */
.story { border: 1px solid ${INK}; break-inside: avoid; }
.story .hd { background: ${INK}; color: ${CREAM}; padding: 4mm 5mm; display: flex;
  align-items: center; gap: 9px; font-weight: 700; font-size: 12pt; letter-spacing: -.025em; }
.story .hd .ic { color: ${LIME}; }
.story .bd { padding: 5mm 6mm; }
.story .beat { display: flex; gap: 12px; margin-bottom: 3.5mm; break-inside: avoid; }
.story .beat:last-child { margin-bottom: 0; }
.story .t { width: 58px; flex: none; font-size: 7.8pt; font-weight: 700; color: ${INK};
  letter-spacing: .1em; text-transform: uppercase; padding-top: .3em; }
.story .x { font-size: 10pt; line-height: 1.6; }

/* ── Good and bad ───────────────────────────────────────────────────────────────────── */
.vs { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; break-inside: avoid; }
.vs .col { border: 1px solid ${LINE}; padding: 5mm; }
.vs .col.good { border-color: ${INK}; border-top: 4px solid ${LIME}; }
.vs .col.bad { border-top: 4px solid ${LINE}; }
.vs .ttl { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 10pt;
  margin-bottom: 4mm; letter-spacing: -.02em; }
.vs .col.good .ttl .ic { color: ${LIME_DEEP}; }
.vs .col.bad .ttl .ic { color: ${MUTED}; }
.vs ul { margin: 0; padding: 0; list-style: none; }
.vs li { font-size: 9.4pt; line-height: 1.55; margin-bottom: 3mm; padding-left: 14px;
  position: relative; }
.vs li:last-child { margin-bottom: 0; }
.vs li::before { content: ''; position: absolute; left: 0; top: .6em; width: 6px;
  height: 6px; background: ${LINE}; }
.vs .col.good li::before { background: ${LIME}; }

/* ── Words we use ───────────────────────────────────────────────────────────────────── */
.gloss { columns: 2; column-gap: 9mm; }
.gloss .t { break-inside: avoid; margin-bottom: 4mm; }
.gloss .w { font-weight: 700; font-size: 9.8pt; letter-spacing: -.01em; }
.gloss .d { font-size: 9.2pt; color: ${MUTED}; line-height: 1.5; }

/* ── Rules ──────────────────────────────────────────────────────────────────────────── */
.rules { border: 1px solid ${INK}; border-left: 7mm solid ${LIME}; padding: 5mm 6mm;
  break-inside: avoid; }
.rules ul { margin: 0; padding: 0; list-style: none; }
.rules li { display: flex; gap: 10px; margin-bottom: 3mm; font-size: 10pt; line-height: 1.55; }
.rules li:last-child { margin-bottom: 0; }
.rules .ic { color: ${INK}; margin-top: .25em; }

/* ── The card on the back ───────────────────────────────────────────────────────────── */
.card-page { break-before: page; height: 297mm; margin: 0 -18mm; padding: 16mm 18mm;
  display: flex; flex-direction: column; background: ${DARK}; color: ${CREAM}; }
.qr { border: 1px solid rgba(246,243,239,.2); padding: 9mm 10mm; flex: 1; display: flex;
  flex-direction: column; }
.qr .hd { display: flex; align-items: baseline; justify-content: space-between;
  border-bottom: 1px solid ${LIME}; padding-bottom: 5mm; margin-bottom: 7mm; }
.qr .hd h2 { font-size: 34pt; margin: 0; letter-spacing: -.045em; color: ${CREAM};
  max-width: none; }
.qr .hd .r { font-size: 10pt; letter-spacing: .24em; text-transform: uppercase;
  font-weight: 700; color: ${LIME}; }
.qr .blk { flex: 1; display: flex; flex-direction: column; justify-content: center;
  padding: 3mm 0; border-bottom: 1px solid rgba(246,243,239,.12); }
.qr .blk:last-of-type { border-bottom: 0; }
.qr .blk .lbl { font-size: 8.6pt; letter-spacing: .24em; text-transform: uppercase;
  font-weight: 700; color: ${LIME}; margin-bottom: 4mm; }
.qr ul { margin: 0; padding-left: 16px; }
.qr li { font-size: 13pt; line-height: 1.45; margin-bottom: 2mm; font-weight: 500;
  letter-spacing: -.015em; }
.qr li::marker { color: ${LIME}; }
.qr .foot { margin-top: auto; border-top: 1px solid rgba(246,243,239,.2); padding-top: 5mm;
  font-size: 9pt; color: rgba(246,243,239,.45); display: flex;
  justify-content: space-between; letter-spacing: .04em; }

/* ── Small print ────────────────────────────────────────────────────────────────────── */
.note { font-size: 9.4pt; color: ${MUTED}; max-width: 56ch; }
`;
