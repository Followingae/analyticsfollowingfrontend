/**
 * Role guides: markdown in, a printable PDF out.
 *
 * Deliberately no markdown library: the guides use a small, known subset (headings, lists,
 * tables, bold, inline code, links, rules) and a 60-line renderer is easier to trust than a
 * dependency added to a production app's tree for a one-off document build.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, basename } from 'node:path'
import { chromium } from 'playwright'

const SRC = process.argv[2]
const OUT = process.argv[3]

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
}

function render(md) {
  const lines = md.split(/\r?\n/)
  const out = []
  let i = 0
  const close = []
  const shut = () => { while (close.length) out.push(close.pop()) }

  while (i < lines.length) {
    const l = lines[i]

    // Table: a header row, a separator row, then body rows.
    if (/^\|/.test(l) && /^\|[\s:|-]+\|$/.test(lines[i + 1] || '')) {
      shut()
      const cells = r => r.split('|').slice(1, -1).map(c => c.trim())
      out.push('<table><thead><tr>' +
        cells(l).map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>')
      i += 2
      while (i < lines.length && /^\|/.test(lines[i])) {
        out.push('<tr>' + cells(lines[i]).map(c => `<td>${inline(c)}</td>`).join('') + '</tr>')
        i++
      }
      out.push('</tbody></table>')
      continue
    }

    const h = l.match(/^(#{1,4})\s+(.*)$/)
    if (h) { shut(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); i++; continue }

    if (/^---+$/.test(l)) { shut(); out.push('<hr/>'); i++; continue }

    const ol = l.match(/^(\s*)(\d+)\.\s+(.*)$/)
    const ul = l.match(/^(\s*)[-*]\s+(.*)$/)
    if (ol || ul) {
      const want = ol ? 'ol' : 'ul'
      const depth = Math.floor(((ol || ul)[1] || '').length / 2)
      // Lists here never nest beyond one level, so one open tag per kind is enough.
      if (close[close.length - 1] !== `</${want}>` || depth !== (close.length - 1)) {
        shut(); out.push(`<${want}>`); close.push(`</${want}>`)
      }
      let body = (ol ? ol[3] : ul[2])
      // A wrapped list item continues on the following indented line.
      while (/^ {3,}\S/.test(lines[i + 1] || '') && !/^\s*([-*]|\d+\.)\s/.test(lines[i + 1])) {
        body += ' ' + lines[i + 1].trim(); i++
      }
      out.push(`<li>${inline(body)}</li>`)
      i++
      continue
    }

    if (!l.trim()) { shut(); i++; continue }

    let p = l
    while ((lines[i + 1] || '').trim() && !/^(#{1,4}\s|\s*([-*]|\d+\.)\s|\||---+$)/.test(lines[i + 1])) {
      p += ' ' + lines[i + 1].trim(); i++
    }
    shut()
    out.push(`<p>${inline(p)}</p>`)
    i++
  }
  shut()
  return out.join('\n')
}

const shell = (title, body) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  @page { size: A4; margin: 20mm 18mm 18mm; }
  :root { --ink:#1a1a1a; --mute:#5c5c5c; --line:#e6e6e6; --lime:#A6C520; }
  * { box-sizing: border-box; }
  body { margin:0; color:var(--ink); background:#fff;
         font: 10.5pt/1.62 "Manrope","Segoe UI",-apple-system,Helvetica,Arial,sans-serif;
         -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  h1 { font-size: 26pt; line-height:1.12; letter-spacing:-.02em; margin:0 0 6pt; }
  h2 { font-size: 14pt; line-height:1.2; letter-spacing:-.01em; margin:22pt 0 7pt;
       padding-top:9pt; border-top:1.5px solid var(--ink); break-after:avoid; }
  h3 { font-size: 11pt; margin:14pt 0 4pt; break-after:avoid; }
  h4 { font-size: 10.5pt; margin:12pt 0 3pt; color:var(--mute); break-after:avoid; }
  p { margin:0 0 7pt; max-width: 34em; }
  ul,ol { margin:0 0 9pt; padding-left:18pt; max-width: 34em; }
  li { margin:0 0 4pt; }
  li::marker { color:var(--mute); }
  strong { font-weight:700; }
  code { font: 9.2pt/1.4 "SFMono-Regular",Consolas,monospace; background:#f4f5f2;
         border:1px solid var(--line); border-radius:3px; padding:0 3px; }
  a { color:inherit; text-decoration:none; border-bottom:1px solid var(--lime); }
  hr { border:0; border-top:1px solid var(--line); margin:16pt 0; }
  table { border-collapse:collapse; width:100%; margin:4pt 0 12pt; font-size:9.6pt;
          break-inside:avoid; }
  th { text-align:left; font-size:8pt; text-transform:uppercase; letter-spacing:.06em;
       color:var(--mute); font-weight:700; padding:0 8pt 4pt 0;
       border-bottom:1px solid var(--ink); }
  td { padding:5pt 8pt 5pt 0; border-bottom:1px solid var(--line); vertical-align:top; }
  .mast { display:flex; align-items:baseline; justify-content:space-between;
          border-bottom:2px solid var(--ink); padding-bottom:7pt; margin-bottom:16pt; }
  .mast b { font-size:10pt; letter-spacing:.14em; text-transform:uppercase; }
  .mast span { font-size:8.5pt; color:var(--mute); letter-spacing:.04em; }
  h1 + p { font-size:11pt; color:var(--mute); max-width:32em; }
</style></head><body>
<div class="mast"><b>Following</b><span>Team guide &middot; 17 October 2026</span></div>
${body}
</body></html>`

const files = readdirSync(SRC).filter(f => f.endsWith('.md'))
const browser = await chromium.launch()
const page = await browser.newPage()
for (const f of files) {
  const md = readFileSync(join(SRC, f), 'utf8')
  const title = (md.match(/^#\s+(.*)$/m) || [, basename(f, '.md')])[1]
  const html = shell(title, render(md))
  const htmlPath = join(OUT, basename(f, '.md') + '.html')
  writeFileSync(htmlPath, html, 'utf8')
  await page.setContent(html, { waitUntil: 'load' })
  await page.pdf({
    path: join(OUT, basename(f, '.md') + '.pdf'),
    format: 'A4', printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate:
      '<div style="width:100%;padding:0 18mm;font:8pt Manrope,Arial,sans-serif;color:#8a8a8a;'
      + 'display:flex;justify-content:space-between;"><span>' + title.replace(/&/g, '&amp;')
      + '</span><span class="pageNumber"></span></div>',
    margin: { top: '16mm', bottom: '14mm', left: '0', right: '0' },
  })
  console.log('built', basename(f, '.md') + '.pdf')
}
await browser.close()
