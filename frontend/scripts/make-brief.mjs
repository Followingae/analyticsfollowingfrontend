/**
 * Print a markdown brief as a PDF in the manuals' house style.
 *
 * WHY THIS EXISTS. The "Following Manuals" folder had five beautifully set manuals and two
 * plain markdown files sitting beside them, which makes the markdown read as a draft even
 * when it is the most current thing in the folder. Anything handed to the team should look
 * like it came from the same place.
 *
 * Deliberately a SMALL markdown subset: headings, paragraphs, bullets, bold, horizontal
 * rules. Not a renderer, and it should not become one. The day this needs tables or images
 * is the day the document wants to be a manual instead.
 *
 *   node scripts/make-brief.mjs <input.md> [output.pdf]
 */
import { readFileSync, existsSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

import { CSS, INK, LIME, LIME_DEEP, LINE, MUTED, FAINT, WASH, icon } from '../docs/manuals/design.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const IN = resolve(process.argv[2]);
const OUT = resolve(process.argv[3] || IN.replace(/\.md$/i, '.pdf'));

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** **bold** and `code` only. The brief uses no other inline formatting, on purpose. */
const inline = (s) => esc(s)
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/`([^`]+)`/g, '<code>$1</code>');

function render(md) {
  const out = [];
  let list = null;                       // open <ul>, so consecutive bullets group
  let para = [];                         // lines of the paragraph being gathered

  const closeList = () => { if (list) { out.push('</ul>'); list = null; } };
  /* ⚠️ A PARAGRAPH IS NOT A LINE. The source is hard-wrapped at about 95 characters,
     which is how markdown should be written. Emitting one <p> per source line printed a
     four-line paragraph as four paragraphs with a gap between each, and the whole page
     read as a ragged list of fragments. A paragraph ends at a blank line, a heading, a
     bullet or a rule, and nowhere else. */
  const closePara = () => {
    if (para.length) { out.push(`<p class="bp">${inline(para.join(' '))}</p>`); para = []; }
  };
  const close = () => { closePara(); closeList(); };

  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trim();

    if (!line) { close(); continue; }
    if (/^---+$/.test(line)) { close(); out.push('<hr>'); continue; }

    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      close();
      const n = h[1].length;
      out.push(n === 1 ? `<h1 class="bh">${inline(h[2])}</h1>`
             : n === 2 ? `<h2 class="bh2">${inline(h[2])}</h2>`
                       : `<h3 class="bh3">${inline(h[2])}</h3>`);
      continue;
    }

    const b = line.match(/^[-*]\s+(.*)$/);
    if (b) {
      closePara();
      if (!list) { out.push('<ul class="bl">'); list = true; }
      out.push(`<li>${inline(b[1])}</li>`);
      continue;
    }

    // A continuation of a bullet, indented under it, joins that bullet rather than
    // starting a paragraph in the middle of a list.
    if (list && /^\s/.test(raw)) {
      const last = out.length - 1;
      out[last] = out[last].replace(/<\/li>$/, ' ' + inline(line) + '</li>');
      continue;
    }

    closeList();
    para.push(line);
  }
  close();
  return out.join('\n');
}

const md = readFileSync(IN, 'utf8');
const title = (md.match(/^#\s+(.*)$/m) || [, basename(IN, '.md')])[1];
const today = new Date().toLocaleDateString('en-GB',
  { day: 'numeric', month: 'long', year: 'numeric' });

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
${CSS}
/* The brief's own type. Looser than a manual: this is read once, straight through, rather
   than looked things up in. */
.bh { font-size: 34pt; line-height: 1.02; letter-spacing: -.035em; font-weight: 800;
  margin: 0 0 6mm; max-width: 20ch; }
.bh2 { font-size: 17pt; letter-spacing: -.02em; font-weight: 800; margin: 11mm 0 3mm;
  break-after: avoid; }
.bh3 { font-size: 12.5pt; letter-spacing: -.015em; font-weight: 800; margin: 7mm 0 2mm;
  break-after: avoid; color: ${INK}; }
.bh3::before { content: ''; display: block; width: 26px; height: 3px; background: ${LIME};
  border-radius: 2px; margin-bottom: 7px; }
.bp { font-size: 10.4pt; line-height: 1.62; margin: 0 0 3.5mm; max-width: 68ch; }
ul.bl { margin: 0 0 4mm; padding-left: 17px; max-width: 66ch; }
ul.bl li { font-size: 10.2pt; line-height: 1.58; margin-bottom: 2mm; }
ul.bl li::marker { color: ${LIME_DEEP}; }
hr { border: 0; border-top: 1px solid ${LINE}; margin: 9mm 0; }
code { font-family: ui-monospace, Menlo, monospace; font-size: 9.4pt;
  background: ${WASH}; padding: 1px 5px; border-radius: 4px; }
.brief-head { display: flex; align-items: center; gap: 9px; font-size: 9.5pt;
  letter-spacing: .16em; text-transform: uppercase; font-weight: 800; margin-bottom: 14mm; }
.brief-head .dot { width: 9px; height: 9px; background: ${INK}; border-radius: 2px; }
.brief-head .when { margin-left: auto; letter-spacing: .02em; text-transform: none;
  font-weight: 600; color: ${FAINT}; }
</style></head>
<body>
<div class="brief-head">
  <span class="dot"></span><span>Following</span>
  <span class="when">${esc(today)}</span>
</div>
${render(md)}
</body></html>`;

// The HTML is kept beside the PDF for the same reason the manuals keep theirs: it is how
// the design gets looked at before anybody prints it.
import { writeFileSync } from 'node:fs';
writeFileSync(OUT.replace(/\.pdf$/i, '.html'), html, 'utf8');

const browser = await chromium.launch();
const tab = await browser.newPage();
await tab.setContent(html, { waitUntil: 'networkidle' });
await tab.pdf({
  path: OUT, format: 'A4', printBackground: true,
  margin: { top: '18mm', right: '18mm', bottom: '18mm', left: '18mm' },
});
await browser.close();
console.log('printed', OUT);
