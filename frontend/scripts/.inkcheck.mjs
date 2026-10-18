/**
 * Where does the ink actually start on each page?
 *
 * Eyeballing a render told me the margins "looked fine" when the top margin was in fact
 * ZERO on every page but the first. This reports the real number, in millimetres, for the
 * topmost, leftmost, rightmost and bottommost mark on every page of a PDF, so a margin is
 * something measured rather than something assumed.
 *
 *   node scripts/.inkcheck.mjs <file.pdf> [...more.pdf]
 */
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { chromium } from 'playwright';

const A4_W = 210, A4_H = 297;
const WANT = { top: 18, bottom: 14, side: 18 };   // the least we will accept, in mm

const browser = await chromium.launch();
const tab = await browser.newPage();
await tab.setContent(`<!doctype html><meta charset="utf-8">
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>`,
  { waitUntil: 'networkidle' });

let worst = { top: 999, bottom: 999, side: 999 };

for (const file of process.argv.slice(2)) {
  const rows = await tab.evaluate(async (data) => {
    const lib = window.pdfjsLib;
    lib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const raw = atob(data);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    const doc = await lib.getDocument({ data: bytes }).promise;
    const out = [];

    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const vp = page.getViewport({ scale: 2 });
      const c = document.createElement('canvas');
      c.width = vp.width; c.height = vp.height;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, c.width, c.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;

      const { data: px } = ctx.getImageData(0, 0, c.width, c.height);
      let top = -1, bottom = -1, left = c.width, right = -1;
      /* "Ink" is anything clearly off-white. The threshold is generous so a pale hairline
         still counts - a rule touching the trim is as wrong as a word touching it. */
      for (let y = 0; y < c.height; y++) {
        for (let x = 0; x < c.width; x++) {
          const i = (y * c.width + x) * 4;
          if (px[i] > 243 && px[i + 1] > 243 && px[i + 2] > 243) continue;
          if (top < 0) top = y;
          bottom = y;
          if (x < left) left = x;
          if (x > right) right = x;
        }
      }
      out.push({ p, top, bottom, left, right, w: c.width, h: c.height });
    }
    return out;
  }, readFileSync(file).toString('base64'));

  console.log('\n' + basename(file));
  for (const r of rows) {
    const mm = (v, span, real) => +(v / span * real).toFixed(1);
    const top = mm(r.top, r.h, A4_H);
    const bottom = +(A4_H - mm(r.bottom, r.h, A4_H)).toFixed(1);
    const left = mm(r.left, r.w, A4_W);
    const right = +(A4_W - mm(r.right, r.w, A4_W)).toFixed(1);
    // A full-bleed page is MEANT to touch the edge, so it is reported and not judged.
    const bleed = top < 2 && bottom < 2 && left < 2;
    const bad = !bleed && (top < WANT.top || bottom < WANT.bottom
                || left < WANT.side || right < WANT.side);
    if (!bleed) {
      worst = { top: Math.min(worst.top, top), bottom: Math.min(worst.bottom, bottom),
                side: Math.min(worst.side, left, right) };
    }
    console.log(`  p${String(r.p).padStart(2)}  top ${String(top).padStart(5)}  `
      + `bottom ${String(bottom).padStart(5)}  left ${String(left).padStart(5)}  `
      + `right ${String(right).padStart(5)}   ${bleed ? 'full bleed' : bad ? '<-- TIGHT' : ''}`);
  }
}

console.log(`\nworst non-bleed page: top ${worst.top}mm, bottom ${worst.bottom}mm, `
  + `side ${worst.side}mm  (want >= ${WANT.top}/${WANT.bottom}/${WANT.side})`);
await browser.close();
