/**
 * The look of a Following manual, fourth pass (16 Nov 2026).
 *
 * The third pass (black and lime, Playfair italic, square boxes) was rejected the day it
 * shipped: "completely terrible, text heavy, no icons, whitespace, very bad AI slop, you
 * didn't even use the Following logo". The founder pointed at the document he does like:
 * the Client Operations SOP (FOL-OPS-SOP-001): navy on white, grey rounded cards, pills for
 * roles and times, an icon on every row, a red section number, a short lime rule under each
 * heading and the "following" wordmark bottom-left of every page.
 *
 * This file is that document's stylesheet, measured off its pages:
 *   navy  #0a3d62   headings, numbers, pills, dark cards
 *   red   #e4572e   section numbers and the one warning on a page
 *   lime  #d4ff02   the rule under a heading, "your part", the one highlighted card
 *   panel #f4f6f9   every card; blue #e9f0f6 for what is right, red #fdeeea for what went wrong
 *   Manrope only, rounded 10px, landscape A4.
 *
 * Every page is one <section class="pg"> of fixed height with the wordmark drawn inside it.
 */
export const NAVY = '#0a3d62';
export const NAVY_DEEP = '#0b2f4b';
export const RED = '#e4572e';
export const LIME = '#d4ff02';
export const INK = '#15202b';
export const MUTED = '#6b7780';
export const FAINT = '#9aa4ad';
export const PANEL = '#f4f6f9';
export const PANEL_BLUE = '#e9f0f6';
export const PANEL_RED = '#fdeeea';
export const LINE = '#e1e7ed';
export const PAPER = '#ffffff';
export const PAGE_W = '257mm';
export const PAGE_H = '176mm';

export const CSS = `
@page { size: A4 landscape; margin: 18mm 20mm 16mm; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
html, body { margin: 0; padding: 0; }
body { font-family: Manrope, -apple-system, "Segoe UI", Arial, sans-serif; color: ${INK};
  background: ${PAPER}; font-size: 9.4pt; line-height: 1.5; font-variant-numeric: tabular-nums; }
b, strong { font-weight: 700; color: ${NAVY}; }
.ic { flex: none; vertical-align: -0.18em; }

.pg { position: relative; height: ${PAGE_H}; break-after: page; overflow: hidden; }
.pg:last-child { break-after: auto; }
.pg .in { height: calc(${PAGE_H} - 12mm); }
.pf { position: absolute; left: 0; right: 0; bottom: 0; height: 8mm; display: flex;
  align-items: flex-end; justify-content: space-between; }
.pf .logo svg { height: 5.2mm; width: auto; display: block; }
.pf .pn { font-size: 6.5pt; color: ${FAINT}; }

.ph { position: relative; display: flex; align-items: flex-end; justify-content: space-between;
  gap: 10mm; border-bottom: 1px solid ${LINE}; padding-bottom: 3.2mm; margin-bottom: 6mm; }
.ph::after { content: ''; position: absolute; left: 0; bottom: -1px; width: 15mm; height: 2.5px;
  background: ${LIME}; }
.ph .l { display: flex; align-items: baseline; gap: 4mm; }
.ph .n { color: ${RED}; font-weight: 800; font-size: 12pt; letter-spacing: .02em; }
.ph h2 { margin: 0; color: ${NAVY}; font-size: 21pt; font-weight: 800; letter-spacing: -.03em;
  line-height: 1.05; }
.ph .s { color: ${MUTED}; font-size: 9.6pt; text-align: right; max-width: 110mm; line-height: 1.4;
  padding-bottom: .8mm; }

.cover .logo svg { height: 9mm; width: auto; display: block; }
.cover .mid { position: absolute; left: 0; right: 0; top: 56mm; }
.cover .bar { width: 10mm; height: 2.4mm; background: ${LIME}; margin-bottom: 9mm; }
.cover .kicker { font-size: 9pt; color: ${MUTED}; margin: 0 0 2mm; }
.cover h1 { margin: 0; color: ${NAVY}; font-size: 44pt; font-weight: 800; letter-spacing: -.04em;
  line-height: .98; max-width: 150mm; }
.cover .lede { color: ${MUTED}; font-size: 12pt; margin: 6mm 0 0; max-width: 135mm; line-height: 1.45; }
.cover .meta { position: absolute; left: 0; bottom: 0; display: flex; gap: 18mm; }
.cover .meta div { display: flex; flex-direction: column; gap: .5mm; }
.cover .meta span { font-size: 8pt; color: ${MUTED}; }
.cover .meta b { font-size: 9pt; color: ${NAVY}; font-weight: 700; }

.card { background: ${PANEL}; border-radius: 10px; padding: 6mm 6.5mm; break-inside: avoid; }
.card.blue { background: ${PANEL_BLUE}; }
.card.red { background: ${PANEL_RED}; }
.card.lime { background: ${LIME}; }
.card.dark { background: ${NAVY_DEEP}; color: #fff; }
.card.dark b, .card.dark .ch { color: #fff; }
.card.dark .big { color: ${LIME}; }
.card.white { background: ${PAPER}; border: 1px solid ${LINE}; }
.ch { display: flex; align-items: center; gap: 2.6mm; color: ${NAVY}; font-weight: 700;
  font-size: 11pt; margin: 0 0 3.5mm; letter-spacing: -.01em; }
.ch .ic { color: ${NAVY}; }
.card.dark .ch .ic { color: ${LIME}; }
.big { font-size: 20pt; font-weight: 800; color: ${NAVY}; letter-spacing: -.03em; line-height: 1;
  margin-top: 4mm; }

.pill { display: inline-flex; align-items: center; gap: 1.6mm; border-radius: 999px;
  padding: .8mm 3mm; font-size: 8.3pt; font-weight: 700; color: ${NAVY}; white-space: nowrap;
  border: 1px solid rgba(10,61,98,.35); background: ${PAPER}; line-height: 1.5; }
.pill.soft { background: ${PANEL_BLUE}; border-color: transparent; }
.pill.lime { background: ${LIME}; border-color: transparent; }
.pill.red { background: ${PANEL_RED}; border-color: transparent; color: ${RED}; }
.pill.dark { background: ${NAVY}; border-color: ${NAVY}; color: #fff; }
.pills { display: flex; flex-wrap: wrap; align-items: center; gap: 1.6mm; }
.pills .arr { color: ${MUTED}; display: flex; }
.pills .lbl { font-size: 7.4pt; letter-spacing: .14em; text-transform: uppercase; font-weight: 700;
  color: ${MUTED}; margin-right: 1mm; }

.num { display: inline-flex; align-items: center; justify-content: center; width: 7mm; height: 7mm;
  border-radius: 50%; background: ${NAVY}; color: #fff; font-size: 8.4pt; font-weight: 800; flex: none; }
.num.sm { width: 5.6mm; height: 5.6mm; font-size: 7.4pt; }
.num.soft { background: ${PANEL_BLUE}; color: ${NAVY}; }
.num.lime { background: ${LIME}; color: ${NAVY}; }

.tbl { border: 1px solid ${LINE}; border-radius: 10px; overflow: hidden; break-inside: avoid; }
.tbl .hd { display: grid; background: ${PANEL_BLUE}; color: ${NAVY}; font-weight: 700;
  font-size: 8.6pt; padding: 2.6mm 5mm; }
.tbl .tr { display: grid; align-items: center; padding: 2.8mm 5mm; border-top: 1px solid ${LINE};
  background: ${PAPER}; }
.tbl .tr:nth-child(odd) { background: #fbfcfd; }
.tbl .tr:first-child { border-top: 0; }
.tbl .t { color: ${NAVY}; font-weight: 700; font-size: 9.6pt; }
.tbl .d { color: ${MUTED}; font-size: 8.6pt; margin-top: .3mm; }
.tbl .r { text-align: right; }
.tbl .ico { display: flex; align-items: center; gap: 2.6mm; }
.tbl .ico .ic { color: ${NAVY}; }

ul.ck { list-style: none; margin: 0; padding: 0; }
ul.ck li { position: relative; padding-left: 6.2mm; margin-bottom: 2.4mm; font-size: 9.2pt;
  line-height: 1.45; }
ul.ck li:last-child { margin-bottom: 0; }
ul.ck li::before { content: ''; position: absolute; left: 0; top: .32em; width: 3.4mm; height: 1.8mm;
  border-left: 1.6px solid ${NAVY}; border-bottom: 1.6px solid ${NAVY}; transform: rotate(-45deg); }
ul.ck.red li::before { border: 0; width: 2.6mm; height: 2.6mm; top: .4em; transform: none;
  background: linear-gradient(45deg, transparent 42%, ${RED} 42%, ${RED} 58%, transparent 58%),
              linear-gradient(-45deg, transparent 42%, ${RED} 42%, ${RED} 58%, transparent 58%); }
ul.ck li .sm { display: block; color: ${MUTED}; font-size: 8.2pt; line-height: 1.4; }

ol.st { list-style: none; margin: 0; padding: 0; counter-reset: s; }
ol.st li { counter-increment: s; position: relative; padding-left: 8mm; margin-bottom: 2.2mm;
  font-size: 9.2pt; line-height: 1.45; }
ol.st li:last-child { margin-bottom: 0; }
ol.st li::before { content: counter(s); position: absolute; left: 0; top: .1em; width: 5.4mm;
  height: 5.4mm; border-radius: 50%; background: ${NAVY}; color: #fff; font-size: 7pt;
  font-weight: 800; display: flex; align-items: center; justify-content: center; }

.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; align-items: start; }
.grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6mm; align-items: start; }
.grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5mm; align-items: stretch; }
.grid8 { display: grid; grid-template-columns: repeat(8, 1fr); gap: 3.5mm; }
.gap { margin-top: 6mm; }
.note { color: ${MUTED}; font-size: 9pt; margin: 5mm 0 0; }
.warn { color: ${RED}; font-weight: 700; font-size: 9pt; display: flex; align-items: center; gap: 2mm;
  margin-top: 4mm; }
.warn .ic { color: ${RED}; }

.toc .tr { grid-template-columns: 12mm 1fr; gap: 4mm; }
.toc .hd { grid-template-columns: 1fr; padding-left: 21mm; }
.day .card { min-height: 70mm; }

.flow .card { padding: 5mm 5.5mm; min-height: 56mm; position: relative; }
.flow .card .top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4mm; }
.flow .wt { color: ${NAVY}; font-weight: 700; font-size: 12pt; letter-spacing: -.02em; line-height: 1.2; }
.flow .card.on { background: ${LIME}; }
.flow .card.on .pill { background: ${PAPER}; }

.shot { border: 1px solid ${LINE}; border-radius: 10px; overflow: hidden; background: ${PANEL}; }
.shot .bar { display: flex; align-items: center; gap: 1.6mm; padding: 2.2mm 3.5mm; background: ${PAPER};
  border-bottom: 1px solid ${LINE}; }
.shot .bar .d { width: 2.2mm; height: 2.2mm; border-radius: 50%; background: ${LINE}; }
.shot .bar .u { margin-left: 2mm; font-size: 7.4pt; color: ${MUTED}; }
.shot .body { display: flex; min-height: 70mm; }
.shot .side { width: 34mm; flex: none; background: ${PAPER}; border-right: 1px solid ${LINE}; padding: 2mm 0; }
.shot .side .it { padding: 1.8mm 3.5mm; font-size: 8.4pt; color: ${MUTED}; position: relative; }
.shot .side .it.on { background: ${PANEL_BLUE}; color: ${NAVY}; font-weight: 700; }
.shot .main { flex: 1; padding: 4mm 4.5mm; }
.shot .h1 { color: ${NAVY}; font-size: 13pt; font-weight: 800; letter-spacing: -.02em; }
.shot .h2 { font-size: 8.2pt; color: ${MUTED}; margin-top: .4mm; }
.shot .cards { display: flex; gap: 2.5mm; margin-top: 4mm; }
.shot .card { flex: 1; background: ${PAPER}; border-radius: 8px; padding: 3mm 3.5mm; }
.shot .card .k { font-size: 6.8pt; letter-spacing: .1em; text-transform: uppercase; color: ${MUTED}; font-weight: 700; }
.shot .card .v { font-size: 15pt; font-weight: 800; color: ${NAVY}; letter-spacing: -.03em; line-height: 1; margin-top: 1mm; }
.shot .card .s { font-size: 7.4pt; color: ${MUTED}; margin-top: 1mm; }
.shot .rowz { margin-top: 3mm; background: ${PAPER}; border-radius: 8px; overflow: hidden; }
.shot .rowz .r { display: flex; align-items: center; gap: 2mm; padding: 2.2mm 3.5mm; border-bottom: 1px solid ${LINE}; font-size: 8.4pt; position: relative; }
.shot .rowz .r:last-child { border-bottom: 0; }
.shot .rowz .r .nm { color: ${NAVY}; font-weight: 700; flex: 1; }
.shot .rowz .r .tag { font-size: 7.2pt; background: ${PANEL_BLUE}; color: ${NAVY}; border-radius: 999px; padding: .5mm 2.4mm; font-weight: 700; }
.shot .rowz .r .tag.hot { background: ${LIME}; }
.pin { position: absolute; width: 5mm; height: 5mm; border-radius: 50%; background: ${RED}; color: #fff;
  font-size: 7pt; font-weight: 800; display: flex; align-items: center; justify-content: center; }
.keys { list-style: none; margin: 0; padding: 0; }
.keys li { display: flex; gap: 3mm; align-items: flex-start; margin-bottom: 3.4mm; font-size: 9.2pt; line-height: 1.45; }
.keys .n { width: 5.4mm; height: 5.4mm; border-radius: 50%; background: ${RED}; color: #fff; font-size: 7pt;
  font-weight: 800; display: flex; align-items: center; justify-content: center; flex: none; margin-top: .3mm; }

.jobs { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; align-items: stretch; }
.job { background: ${PANEL}; border-radius: 10px; padding: 5mm 6mm; display: flex; flex-direction: column; }
.job .top { display: flex; align-items: flex-start; gap: 3mm; margin-bottom: 3mm; }
.job h3 { margin: 0; color: ${NAVY}; font-size: 12pt; font-weight: 800; letter-spacing: -.02em; line-height: 1.15; }
.job .when { color: ${MUTED}; font-size: 8.4pt; margin-top: .6mm; }
.job .pills { margin-bottom: 3.4mm; }
.job ol.st li { font-size: 8.8pt; margin-bottom: 1.6mm; }
.job .next { margin-top: auto; padding-top: 3mm; display: flex; align-items: flex-start; gap: 2mm;
  font-size: 8.4pt; color: ${MUTED}; border-top: 1px solid rgba(10,61,98,.1); }
.job .next .ic { color: ${NAVY}; margin-top: .4mm; }

.side2 { display: grid; grid-template-columns: 1.15fr 1fr; gap: 8mm; align-items: start; }
.lanes { display: block; width: 100%; max-width: 134mm; height: auto; border: 1px solid ${LINE};
  border-radius: 8px; }
.lkey { display: flex; flex-wrap: wrap; gap: 2mm 6mm; font-size: 8.4pt; color: ${MUTED}; margin-top: 3mm; }
.lkey span { display: inline-flex; align-items: center; gap: 1.8mm; }
.lkey .sw { width: 4mm; height: 2.8mm; border-radius: 2px; display: inline-block; }
.lkey .sw.lime { background: ${LIME}; }
.lkey .sw.out { border: 1px solid ${NAVY}; background: ${PAPER}; }
.lkey .sw.dash { border: 1px dashed ${NAVY}; background: ${PAPER}; }
.rest { display: flex; flex-wrap: wrap; align-items: center; gap: 1.6mm; margin-bottom: 5mm; }
.rest .arr { color: ${FAINT}; display: flex; }
.stat { background: ${PANEL}; border-radius: 10px; padding: 3.6mm 3.6mm; }
.stat .b { font-size: 14pt; font-weight: 800; color: ${NAVY}; letter-spacing: -.03em; line-height: 1; white-space: nowrap; }
.stat .s { font-size: 7.8pt; color: ${MUTED}; margin-top: 1.4mm; line-height: 1.35; }

.beats { columns: 2; column-gap: 10mm; }
.beat { display: flex; gap: 3.5mm; align-items: flex-start; margin-bottom: 3.6mm; break-inside: avoid; }
.beat .pill { min-width: 18mm; justify-content: center; }
.beat .x { font-size: 9.2pt; line-height: 1.45; padding-top: .4mm; }

.words { columns: 3; column-gap: 8mm; }
.words .w { break-inside: avoid; margin-bottom: 3mm; padding-bottom: 3mm; border-bottom: 1px solid ${LINE}; }
.words .t { color: ${NAVY}; font-weight: 700; font-size: 9.2pt; }
.words .d { color: ${MUTED}; font-size: 8.4pt; line-height: 1.4; }

.qc .head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6mm; }
.qc .head h2 { margin: 0; color: ${NAVY}; font-size: 24pt; font-weight: 800; letter-spacing: -.03em; }
.qc .card { min-height: 52mm; }
.qc ul.ck li { font-size: 10pt; margin-bottom: 2.6mm; }
`;
