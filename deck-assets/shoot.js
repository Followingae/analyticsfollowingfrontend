// Render the three pitch mockups to full-resolution PNGs (2x DPI, full page, no crop).
const { chromium } = require('playwright');
const path = require('path');

const DIR = __dirname;
const shots = [
  { file: '01-discovery.html',           out: 'png/01-discovery-dashboard.png' },
  { file: '02-creator-analytics.html',   out: 'png/02-creator-analytics.png' },
  { file: '03-campaign-management.html', out: 'png/03-campaign-management.png' },
];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  for (const s of shots) {
    const url = 'file:///' + path.join(DIR, s.file).replace(/\\/g, '/');
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(DIR, s.out), fullPage: true });
    console.log('saved', s.out);
  }
  await browser.close();
})();
