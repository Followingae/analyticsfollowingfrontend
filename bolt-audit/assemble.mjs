import fs from 'fs';

const CH = 'C:/Users/user/.claude/projects/C--Users-user-Desktop-analyticsfollowingfrontend-analyticsfollowingfrontend/c125858c-ece8-4d54-b170-3ac293a7f4de/subagents/workflows/wf_1317a5f8-810/chapters';
const OUT = 'C:/Users/user/Desktop/analyticsfollowingfrontend/analyticsfollowingfrontend/design.md';

// chapters in final reading order: title -> filename
const ORDER = [
  ['Brand Identity & Art Direction', 'ch-09-brand-identity-art-direction.md'],
  ['Color System', 'ch-00-color-system.md'],
  ['Typography', 'ch-01-typography.md'],
  ['Layout, Grid & Spacing', 'ch-03-layout-grid-spacing.md'],
  ['Component & UI Pattern Inventory', 'ch-08-component-ui-pattern-inventory.md'],
  ['Motion & Animation System', 'ch-07-motion-animation-system.md'],
  ['Imagery, Illustration & Iconography', 'ch-06-imagery-illustration-iconography.md'],
  ['Content Design, Voice & Information Architecture', 'ch-02-content-design-voice-information-archite.md'],
  ['Responsive & Mobile Design', 'ch-04-responsive-mobile-design.md'],
  ['Accessibility, Performance & Technical Signals', 'ch-05-accessibility-performance-technical-sign.md'],
];

// GitHub-style anchor slug
const anchor = (s) => s.toLowerCase().replace(/[^a-z0-9 \-]/g, '').replace(/ /g, '-');

const FRONT = `# Bolt.com — Website Design & Animation Audit

> **Subject:** \`https://www.bolt.com\` — Bolt (one-click checkout / commerce / payments for merchants, plus the consumer **Bolt SuperApp** and the **Bolt ID** identity layer).
> **Scope:** 46 pages across **both** sides of the site — the merchant **"For Businesses"** experience and the consumer **"For Users" / SuperApp** experience.
> **Method:** Each page was loaded in a real headless Chromium (Playwright), auto-scrolled to trigger reveal animations, and captured at desktop (1440px) and mobile (390px) as full-page screenshots, alongside a programmatic extraction of computed styles, design tokens, CSS custom properties, keyframes, transitions, and CMS component classes. A panel of expert agents then analyzed the captured artifacts across ten design dimensions, each documented in a chapter below. Every chapter is grounded in exact values (hex, px, easing curves, font names, component specs) and cites the pages that exemplify each pattern.
> **Audited:** 2026-06-02.

---

## Executive Summary

Bolt presents itself as a **bold, high-contrast fintech brand** with the confidence of a payments incumbent and the energy of a consumer app. The design language is built on a deliberately small kit: one electric **brand blue (\`#006CFF\`)**, a near-black **navy (\`#04091A\`, "boltBlack")**, a cool **off-white (\`#F8F6FE\`)**, and a violet accent (\`#9A4EFF\`), set in a two-typeface system — the geometric grotesque **Agrandir** for all display type and the **BOLT** wordmark, and **Inter** for body and UI. Headlines are large, tightly tracked (H1 at 70px/700 with −1.4px letter-spacing), and unapologetically declarative ("The checkout that converts. Instantly."). The whole site alternates full-bleed **dark navy** and **light off-white** bands, giving every page a confident, rhythmic cadence that always resolves into a single, oversized "BOLT" wordmark spanning the footer.

Structurally, bolt.com is **not hand-built page by page** — it is assembled from a single Next.js, CMS-driven lander system (\`/home-lander\`, \`/default-lander\`, and product-specific templates) out of a reusable block library: \`Hero\`, \`ZLayoutContent\`, \`TwoColumnChecklistSection\`, \`featureCards\`, \`mediaBlock\`, \`Ticker\`, \`postSlider\`, \`LogoScroller\`, \`CheckoutDemo\`, and more. Components are tokenized and theme-aware (a 14-variant \`.Button\` system on a 1280px "pill" radius, a context-aware header CTA that inverts on scroll, and \`fontColor--*\` / \`backgroundColor--*\` utility tokens), which is why the design stays remarkably coherent across 46 pages and two distinct audiences. The merchant side leans informational and proof-driven (stats, partner logos, case studies); the consumer SuperApp side ("For Users" → \`/pay\`) shifts to a darker, app-store aesthetic with download badges, product-UI mockups, and regulated-finance disclaimers.

Motion is **purposeful and restrained but pervasive**: IntersectionObserver scroll reveals animate translate + opacity on a signature \`cubic-bezier(0.23, 1, 0.32, 1)\` (easeOutQuint) curve at ~0.35s, hero headlines stagger upward on load, partner logos and feature categories run on infinite \`logoScroller\` marquees (30s linear), and the flagship \`CheckoutDemo\` runs a scripted simulation of a real Bolt checkout (\`showFetch\` → \`showMessage\` → \`swipe\` → \`pressButtonRipple\`). Micro-interactions are unified by a single button hover (\`scale(1.07)\` + blue fill + a diagonal \`::after\` "sheen" wipe), and the site respectfully ships a \`prefers-reduced-motion\` path. Personality flourishes — a "Soundtrack" menu linking Bolt's Spotify/Apple Music/YouTube playlists, "NEW" badges in the mega-menu, and brand voice that survives even into empty states — round out a system that is disciplined where it counts and playful where it can afford to be.

The ten chapters below document each layer in depth. Where relevant, each chapter closes with concrete, prioritized recommendations (e.g., a handful of AA color-contrast tightenings, Cloudinary delivery optimizations, and information-architecture fixes for orphaned consumer pages).

`;

const toc = ['## Table of Contents', ''];
ORDER.forEach(([t], i) => toc.push(`${i + 1}. [${t}](#${anchor(t)})`));
toc.push('');
toc.push(`> **Appendix:** [Page-by-Page Index](#appendix--page-by-page-index)`);
toc.push('');

let body = '';
for (const [title, fn] of ORDER) {
  let txt = fs.readFileSync(`${CH}/${fn}`, 'utf8').trim();
  body += '\n\n---\n\n' + txt + '\n';
}

const PAGES = {
  'Merchant / Product (Checkout & Commerce)': [
    ['/', 'Home — Shockingly Simple Checkout & Finance'],
    ['/checkout', 'Meet Bolt Checkout'],
    ['/intelligentcheckout', 'Checkout 2.0 — AI-Powered Commerce'],
    ['/checkout-everywhere', 'Checkout Everywhere'],
    ['/checkout-os', 'Checkout OS — Integrate Easily'],
    ['/checkout-demo', 'Checkout Demo'],
    ['/ecommerce', 'Ecommerce'],
    ['/enterprise', 'Enterprise'],
    ['/payments', 'Payments'],
    ['/connect', 'Connect'],
    ['/network', 'The Bolt Network'],
    ['/bolt-id', 'Bolt ID'],
    ['/fraud', 'Eliminate Fraud'],
    ['/security', 'Security'],
    ['/high-risk', 'High-Risk'],
    ['/saas', 'SaaS'],
    ['/subscriptions', 'Subscriptions'],
    ['/digital-goods', 'Digital Goods'],
    ['/stablecoins', 'Stablecoins'],
    ['/startups', 'For Startups'],
    ['/app-devs', 'For App Developers'],
  ],
  'Consumer / SuperApp ("For Users")': [
    ['/pay', 'Get the Bolt SuperApp'],
    ['/pay/rewards', 'SuperApp — Rewards'],
    ['/shopper', 'For Shoppers'],
    ['/shop', 'Browse Our Marketplace'],
    ['/refer', 'Referral Program'],
    ['/check-in', 'Check-In'],
    ['/shopper-trust-toolkit', 'Shopper Launch Toolkit'],
  ],
  'Company / Marketing / Conversion': [
    ['/our-story', 'Our Story'],
    ['/careers', 'View Open Roles'],
    ['/case-studies', 'Case Studies'],
    ['/resources', 'Resources'],
    ['/blog', 'Company News (Blog)'],
    ['/news', 'News & Press'],
    ['/faq', 'Frequently Asked Questions'],
    ['/pricing', 'Pricing'],
    ['/contact-sales', 'Contact Sales'],
    ['/contact-us', 'Contact Us'],
    ['/get-started', 'Self-Serve Checkout (Get Started)'],
    ['/activate', 'Activate'],
    ['/install', 'Installation Guides'],
    ['/media-kit', 'Media Kit'],
  ],
  'Legal / Utility': [
    ['/privacy', 'Privacy Policy'],
    ['/privacy-center', 'Privacy Center'],
    ['/terms-of-use', 'Terms of Use'],
    ['/end-user-terms', 'End User Terms'],
  ],
};

let appendix = '\n\n---\n\n## Appendix — Page-by-Page Index\n\n';
let total = 0;
for (const [group, list] of Object.entries(PAGES)) {
  appendix += `### ${group}\n\n`;
  for (const [p, t] of list) { appendix += `- \`${p}\` — ${t}\n`; total++; }
  appendix += '\n';
}
appendix += `_Total: ${total} pages audited. Full-page desktop + mobile screenshots and per-page computed-style profiles for every page are stored under \`bolt-audit/\` (\`shots/<slug>-desktop.jpeg\`, \`shots/<slug>-mobile.jpeg\`, \`profiles-<slug>.json\`)._\n`;

const doc = FRONT + toc.join('\n') + body + appendix;
fs.writeFileSync(OUT, doc);
console.log(`Wrote ${OUT}\n${doc.length} chars, ${doc.split('\n').length} lines, ${total} pages indexed`);
