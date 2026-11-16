import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
const [file] = process.argv.slice(2);
const b = await chromium.launch(); const t = await b.newPage();
await t.setContent(`<!doctype html><meta charset="utf-8"><script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>`, { waitUntil: 'networkidle' });
const txt = await t.evaluate(async ({ data }) => {
  const lib = window.pdfjsLib; lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const raw = atob(data); const bytes = new Uint8Array(raw.length); for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  const doc = await lib.getDocument({ data: bytes }).promise; let out = '';
  for (let p = 1; p <= doc.numPages; p++) { const page = await doc.getPage(p); const tc = await page.getTextContent();
    let lastY = null, line = '';
    const lines = [];
    for (const it of tc.items) { const y = Math.round(it.transform[5]); if (lastY !== null && Math.abs(y - lastY) > 2) { lines.push(line); line = ''; } line += (line && !line.endsWith(' ') && !it.str.startsWith(' ') ? ' ' : '') + it.str; lastY = y; }
    lines.push(line); out += `\n\n===== PAGE ${p} =====\n` + lines.join('\n'); }
  return out;
}, { data: readFileSync(file).toString('base64') });
console.log(txt); await b.close();
