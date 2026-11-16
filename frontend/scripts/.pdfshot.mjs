import { readFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
const [file, pagesArg, outDir] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const pages = pagesArg.split(',').map(Number);
const b = await chromium.launch(); const t = await b.newPage();
await t.setContent(`<!doctype html><meta charset="utf-8"><script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>`, { waitUntil: 'networkidle' });
const pngs = await t.evaluate(async ({ data, pages }) => {
  const lib = window.pdfjsLib; lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const raw = atob(data); const bytes = new Uint8Array(raw.length); for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  const doc = await lib.getDocument({ data: bytes }).promise; const out = {};
  for (const p of pages) { if (p > doc.numPages) continue; const page = await doc.getPage(p); const vp = page.getViewport({ scale: 1.3 });
    const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height; const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); await page.render({ canvasContext: ctx, viewport: vp }).promise; out[p] = c.toDataURL('image/png'); }
  out.n = doc.numPages; return out;
}, { data: readFileSync(file).toString('base64'), pages });
const { writeFileSync } = await import('node:fs');
for (const p of pages) if (pngs[p]) writeFileSync(`${outDir}/p${String(p).padStart(2, '0')}.png`, Buffer.from(pngs[p].split(',')[1], 'base64'));
console.log('pages', pngs.n); await b.close();
