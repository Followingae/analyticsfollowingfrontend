/**
 * Render the campaign-state icons to PNG for the emails.
 *
 * Mail clients strip SVG and inline styling on icon fonts, so the only icon that reliably
 * arrives is an image. These are the same lucide glyphs the app draws, rasterised at 3x on
 * a transparent ground so they stay crisp on a retina phone.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const S = 'stroke="CLR" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"';

const ICONS = {
  'user-check': `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" ${S}/><circle cx="9" cy="7" r="4" ${S}/><path d="m16 11 2 2 4-4" ${S}/>`,
  'file-text': `<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" ${S}/><path d="M14 2v4a2 2 0 0 0 2 2h4" ${S}/><path d="M10 9H8" ${S}/><path d="M16 13H8" ${S}/><path d="M16 17H8" ${S}/>`,
  'package-check': `<path d="m16 16 2 2 4-4" ${S}/><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0" ${S}/><path d="m3.3 7 8.7 5 8.7-5" ${S}/><path d="M12 22V12" ${S}/>`,
  'truck': `<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" ${S}/><path d="M15 18H9" ${S}/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14" ${S}/><circle cx="17" cy="18" r="2" ${S}/><circle cx="7" cy="18" r="2" ${S}/>`,
  'camera': `<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" ${S}/><circle cx="12" cy="13" r="3" ${S}/>`,
  'eye': `<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" ${S}/><circle cx="12" cy="12" r="3" ${S}/>`,
  'sparkles': `<path d="M9.94 4.66a1 1 0 0 1 1.9 0l1.2 3.35a2 2 0 0 0 1.2 1.2l3.35 1.2a1 1 0 0 1 0 1.9l-3.35 1.2a2 2 0 0 0-1.2 1.2l-1.2 3.35a1 1 0 0 1-1.9 0l-1.2-3.35a2 2 0 0 0-1.2-1.2l-3.35-1.2a1 1 0 0 1 0-1.9l3.35-1.2a2 2 0 0 0 1.2-1.2Z" ${S}/><path d="M18 5h2" ${S}/><path d="M19 4v2" ${S}/>`,
  'party-popper': `<path d="M5.8 11.3 2 22l10.7-3.79" ${S}/><path d="M4 3h.01" ${S}/><path d="M22 8h.01" ${S}/><path d="M15 2h.01" ${S}/><path d="M22 20h.01" ${S}/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 12" ${S}/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H14" ${S}/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7" ${S}/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z" ${S}/>`,
};

const COLOURS = { ink: '#12171C', green: '#1D3E1F', faint: '#B4B8BC', white: '#FFFFFF' };

(async () => {
  const out = path.resolve(process.cwd(), 'public/email-icons');
  fs.mkdirSync(out, { recursive: true });

  const cells = [];
  for (const [name, body] of Object.entries(ICONS)) {
    for (const [cname, hex] of Object.entries(COLOURS)) {
      cells.push(`<div class="cell" id="${name}__${cname}">
        <svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 24 24">
          ${body.replaceAll('CLR', hex)}
        </svg></div>`);
    }
  }

  const html = `<html><head><style>
    body { margin:0; background:transparent; }
    .cell { width:72px; height:72px; display:flex; align-items:center; justify-content:center; }
  </style></head><body>${cells.join('')}</body></html>`;

  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage({ viewport: { width: 300, height: 300 }, deviceScaleFactor: 3 });
  await p.setContent(html);
  await p.waitForTimeout(400);

  for (const name of Object.keys(ICONS)) {
    for (const cname of Object.keys(COLOURS)) {
      const el = await p.$('#' + name + '__' + cname);
      await el.screenshot({ path: path.join(out, `${name}-${cname}.png`), omitBackground: true });
    }
  }
  await b.close();
  console.log('icons written to public/email-icons');
})();
