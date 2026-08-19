import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'https://www.bolt.com';
const PATHS = [
  '/pay/rewards', '/shopper',
];

const slug = (p) => p === '/' ? 'home' : p.replace(/^\//, '').replace(/\//g, '-');
const OUT = 'bolt-audit';
fs.mkdirSync(`${OUT}/shots`, { recursive: true });

const PROFILER = () => {
  const uniq = (a) => Array.from(new Set(a));
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const out = {};
  out.url = location.href;
  out.title = document.title;
  out.metaDesc = (document.querySelector('meta[name=description]') || {}).content || null;
  out.ogImage = (document.querySelector('meta[property="og:image"]') || {}).content || null;
  out.nextPage = window.__NEXT_DATA__ ? window.__NEXT_DATA__.page : null;
  out.htmlClass = document.documentElement.className;

  // headings
  out.h1 = norm((document.querySelector('h1') || {}).textContent).slice(0, 200);
  out.headings = Array.from(document.querySelectorAll('h2,h3')).slice(0, 40).map(h => `${h.tagName}: ${norm(h.textContent).slice(0, 120)}`);

  // CTAs
  out.ctas = uniq(Array.from(document.querySelectorAll('a,button')).map(b => norm(b.textContent)).filter(t => t && t.length < 40 && /get started|contact|demo|sign|book|talk|try|start|learn more|explore|join|apply|read|view|download|see /i.test(t))).slice(0, 30);

  // media counts
  out.media = {
    images: document.querySelectorAll('img').length,
    videos: document.querySelectorAll('video').length,
    wistia: document.querySelectorAll('[class*=wistia],[id*=wistia]').length,
    lottie: document.querySelectorAll('lottie-player,[data-animation-type=lottie],[class*=lottie]').length,
    canvas: document.querySelectorAll('canvas').length,
    svg: document.querySelectorAll('svg').length,
  };

  // sections: top-level structural blocks with bg + heading
  const main = document.querySelector('main') || document.body;
  const sections = Array.from(main.querySelectorAll(':scope > section, :scope > div'))
    .filter(el => el.offsetHeight > 120)
    .slice(0, 30)
    .map((el, i) => {
      const c = getComputedStyle(el);
      const h = el.querySelector('h1,h2,h3');
      return {
        i, tag: el.tagName.toLowerCase(),
        h: el.offsetHeight,
        bg: c.backgroundColor,
        bgImage: c.backgroundImage !== 'none' ? c.backgroundImage.slice(0, 80) : null,
        heading: h ? norm(h.textContent).slice(0, 100) : null,
        cls: (el.className || '').toString().slice(0, 80),
      };
    });
  out.sections = sections;

  // type scale
  const typeFor = (sel) => { const el = document.querySelector(sel); if (!el) return null; const c = getComputedStyle(el); return { size: c.fontSize, lh: c.lineHeight, w: c.fontWeight, ls: c.letterSpacing, fam: c.fontFamily.split(',')[0].replace(/"/g,''), color: c.color }; };
  out.type = {};
  ['h1','h2','h3','h4','p'].forEach(s => { const t = typeFor(s); if (t) out.type[s] = t; });

  // colors
  const colorTally = {}, bgTally = {};
  const els = Array.from(document.querySelectorAll('body *')).slice(0, 5000);
  els.forEach(el => { const c = getComputedStyle(el); const add = (t,v)=>{ if(v&&v!=='rgba(0, 0, 0, 0)'&&v!=='transparent') t[v]=(t[v]||0)+1; }; add(colorTally,c.color); add(bgTally,c.backgroundColor); });
  const top = (t,n=15) => Object.entries(t).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k,v])=>`${k} x${v}`);
  out.colorsText = top(colorTally);
  out.colorsBg = top(bgTally);

  // animation: keyframes referenced + transitions
  const kf = new Set();
  for (const ss of Array.from(document.styleSheets)) { let rules; try { rules = ss.cssRules; } catch { continue; } if (!rules) continue; for (const r of Array.from(rules)) { if (r.constructor && r.constructor.name === 'CSSKeyframesRule') kf.add(r.name); } }
  out.keyframes = Array.from(kf).slice(0, 60);
  const animEls = els.filter(el => { const c = getComputedStyle(el); return c.animationName && c.animationName !== 'none'; });
  const animTally = {};
  animEls.forEach(el => { const c = getComputedStyle(el); const k = `${c.animationName} ${c.animationDuration} ${c.animationTimingFunction}`; animTally[k]=(animTally[k]||0)+1; });
  out.animations = Object.entries(animTally).sort((a,b)=>b[1]-a[1]).slice(0,15).map(([k,v])=>`${k} x${v}`);
  const tset = {};
  els.forEach(el => { const c = getComputedStyle(el); if (c.transitionDuration && c.transitionDuration !== '0s') { const k=`${c.transitionProperty} ${c.transitionDuration} ${c.transitionTimingFunction}`; tset[k]=(tset[k]||0)+1; } });
  out.transitions = Object.entries(tset).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([k,v])=>`${k} x${v}`);

  // primary button look
  const btn = Array.from(document.querySelectorAll('a,button')).find(b => /get started/i.test(b.textContent||'') && getComputedStyle(b).backgroundColor !== 'rgba(0, 0, 0, 0)');
  if (btn) { const c = getComputedStyle(btn); out.primaryButton = { text: norm(btn.textContent), bg: c.backgroundColor, color: c.color, radius: c.borderRadius, padding: c.padding, fontWeight: c.fontWeight, shadow: c.boxShadow, fontSize: c.fontSize }; }

  out.scrollHeight = document.body.scrollHeight;
  return out;
};

const autoScroll = async (page) => {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let y = 0; const step = 600;
      const timer = setInterval(() => { window.scrollBy(0, step); y += step; if (y >= document.body.scrollHeight) { clearInterval(timer); resolve(); } }, 120);
    });
  });
  await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
};

const run = async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  const results = [];
  for (const p of PATHS) {
    const s = slug(p);
    const rec = { path: p, slug: s };
    try {
      const resp = await page.goto(BASE + p, { waitUntil: 'domcontentloaded', timeout: 45000 });
      rec.status = resp ? resp.status() : null;
      rec.finalUrl = page.url();
      try { await page.waitForLoadState('networkidle', { timeout: 12000 }); } catch {}
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.waitForTimeout(1200);
      await autoScroll(page);
      await page.screenshot({ path: `${OUT}/shots/${s}-desktop.jpeg`, fullPage: true, type: 'jpeg', quality: 78 });
      const profile = await page.evaluate(PROFILER);
      rec.profile = profile;
      // mobile
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(800);
      await autoScroll(page);
      await page.screenshot({ path: `${OUT}/shots/${s}-mobile.jpeg`, fullPage: true, type: 'jpeg', quality: 78 });
      fs.writeFileSync(`${OUT}/profiles-${s}.json`, JSON.stringify(profile, null, 2));
      console.log(`OK ${rec.status} ${p} -> ${s} (h=${profile.scrollHeight})`);
    } catch (e) {
      rec.error = String(e).slice(0, 200);
      console.log(`ERR ${p}: ${rec.error}`);
    }
    results.push(rec);
  }
  fs.writeFileSync(`${OUT}/crawl-summary.json`, JSON.stringify(results, null, 2));
  await browser.close();
  console.log(`DONE ${results.length} pages`);
};
run();
