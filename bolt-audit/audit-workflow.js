export const meta = {
  name: 'bolt-design-audit',
  description: 'Analyze captured bolt.com pages across design dimensions and synthesize a design.md',
  phases: [
    { title: 'Page analysis', detail: 'one analyst per page reads its profile + desktop/mobile screenshots' },
    { title: 'Dimension synthesis', detail: 'one expert per design dimension aggregates across all pages' },
    { title: 'Assemble', detail: 'lead writer composes the final design.md' },
  ],
}

const pages = (args && args.pages) || []
const G = (args && args.global) || {}

const PAGE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    path: { type: 'string' },
    purpose: { type: 'string', description: 'What this page is for / who it targets' },
    archetype: { type: 'string', description: 'e.g. product lander, hub, legal, form, editorial/blog' },
    layoutSummary: { type: 'string' },
    sections: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: { name: { type: 'string' }, description: { type: 'string' } },
        required: ['name', 'description'],
      },
    },
    palette: { type: 'array', items: { type: 'string' }, description: 'hex/rgb values actually used + their role' },
    typography: { type: 'string' },
    components: { type: 'array', items: { type: 'string' } },
    motion: { type: 'array', items: { type: 'string' }, description: 'animations/transitions/reveals observed or implied' },
    imagery: { type: 'string', description: 'photography, illustration, icon, 3D, video style' },
    mobile: { type: 'string', description: 'how the layout adapts on the 390px capture' },
    standout: { type: 'array', items: { type: 'string' }, description: 'distinctive / memorable design details' },
    inconsistencies: { type: 'array', items: { type: 'string' } },
  },
  required: ['path', 'purpose', 'archetype', 'layoutSummary', 'sections', 'palette', 'typography', 'components', 'motion', 'imagery', 'mobile', 'standout'],
}

phase('Page analysis')
log(`Analyzing ${pages.length} captured pages`)
const DIR = G.dir
const pageReports = (await parallel(pages.map((p) => () => {
  const profilePath = `${DIR}/profiles-${p.slug}.json`
  const desktopShot = `${DIR}/shots/${p.slug}-desktop.jpeg`
  const mobileShot = `${DIR}/shots/${p.slug}-mobile.jpeg`
  return agent(
    `You are a senior product & brand designer writing an evidence-based design record for ONE page of bolt.com. ` +
    `Bolt is a one-click checkout / commerce + payments platform (it also markets a consumer "SuperApp" and "Bolt ID" identity layer).\n\n` +
    `PAGE: ${p.path}   (title: ${p.title || ''})\n\n` +
    `Read ALL THREE artifacts with the Read tool before writing:\n` +
    `1. Design profile JSON (exact tokens, section classes, colors, keyframes): ${profilePath}\n` +
    `2. Desktop full-page screenshot (1440px): ${desktopShot}\n` +
    `3. Mobile full-page screenshot (390px): ${mobileShot}\n\n` +
    `Then document the page top-to-bottom from what you actually SEE, cross-referenced with the profile data. ` +
    `For every section give its layout, background color (exact hex/rgb), headline, imagery/illustration, and UI components. ` +
    `Infer motion from the profile's keyframes/animations/transitions (e.g. cubic-bezier(0.23,1,0.32,1) scroll reveals, logoScroller marquee, Lottie). ` +
    `Note the mobile adaptation, standout details, and any inconsistencies. Be concrete: use real hex values, px sizes, font names, easing curves. ` +
    `If a screenshot is extremely tall (legal/text page), focus on layout & visual impression — you do NOT need to transcribe body text. No generic filler.`,
    { label: `page:${p.slug}`, phase: 'Page analysis', schema: PAGE_SCHEMA }
  )
}))).filter(Boolean)

phase('Dimension synthesis')
const DIMENSIONS = [
  { key: 'brand', title: 'Brand Identity & Art Direction', focus: 'the overall design language and brand expression: the BOLT wordmark/logo and its giant typographic footer treatment, art-direction mood (fintech-confident, bold, high-contrast dark hero + bright accents), personality, how the identity stays coherent across product/marketing/legal pages, and the "for Users vs for Businesses" dual-audience framing.' },
  { key: 'color', title: 'Color System', focus: 'the full palette with exact values and semantic roles — brand blue #006CFF, near-black navy #04091A, off-white #F8F6FE, purple #9A4EFF, success green #00C42E, neutrals/greys — light vs dark section theming (darkTheme/light html classes), gradients (indigo/purple hero), accent usage, and contrast pairings. Provide a tokens table.' },
  { key: 'type', title: 'Typography', focus: 'the typeface pairing (agrandir-bolt / agrandir-variable display vs Inter body), the full type scale (H1 70/700 -1.4px tracking down through body 20/500 -0.4px), weights, negative letter-spacing system, line-heights, responsive scaling, and hierarchy patterns. Provide a type-scale table.' },
  { key: 'layout', title: 'Layout, Grid & Spacing', focus: 'container widths, section rhythm and the margin/padding scale (marginTop--custom/lg/sm/xs naming), the CMS block system (Hero, ZLayoutContent, TwoColumnChecklistSection, featureCards, mediaBlock, Divider, postSlider, Ticker, ImageBanner), alignment, vertical pacing, and how full-bleed dark bands alternate with light content.' },
  { key: 'components', title: 'Component & UI Pattern Inventory', focus: 'every reusable component: the top utility tab bar (For Users/For Businesses), header nav + mega-menu, primary/secondary/ghost buttons (pill radius 1280px), feature cards, illustrated cards, stat/ticker blocks, testimonial slider, news/post cards, checkout-demo simulator widget, logo marquee, forms (HubSpot), modals/video, footer with email capture. Give each a spec.' },
  { key: 'motion', title: 'Motion & Animation System', focus: 'the complete motion vocabulary: IntersectionObserver scroll reveals using cubic-bezier(0.23,1,0.32,1) at 0.35s on translate/opacity; staggerTextUp hero text; keyframes (slideInFromLeft/Right, zoomInFrom*, animTextTop/Bottom, swipe 2.7s, logoScroller 30s linear, pressButtonRipple, showMessage/showFetch checkout-demo sequence, spinner, scrollDown); hover micro-interactions (all 0.2s ease, color/fill transitions); Lottie usage; and overall motion principles (easing, duration, restraint).' },
  { key: 'imagery', title: 'Imagery, Illustration & Iconography', focus: 'the photography style (lifestyle/people with phones, brand-tinted duotones), the distinctive colorful abstract vector illustrations (blue/purple/pink blobs of people/devices), product UI mockups (phone checkout frames), icon style (thin-line SVG, 150+ per page), Cloudinary asset pipeline, and partner/press logo treatments.' },
  { key: 'content', title: 'Content Design, Voice & Information Architecture', focus: 'the voice/tone (punchy, benefit-led, confident: "The checkout that converts. Instantly.", "Smarter by design. Faster by default."), messaging architecture, headline/subhead patterns, stat-driven persuasion ($1.972T lost, 77% abandoned, 80M shoppers), CTA language ("Get started", "Contact Sales", "Launch demo"), and the sitemap / nav information architecture across the ~44 pages.' },
  { key: 'responsive', title: 'Responsive & Mobile Design', focus: 'how layouts reflow from 1440px to 390px across page archetypes — nav collapse, hero stacking, card grids to single column, type scaling, touch targets, and any mobile-specific patterns observed in the mobile screenshots.' },
  { key: 'a11y', title: 'Accessibility, Performance & Technical Signals', focus: 'contrast of the key color pairings, motion/reduced-motion considerations, semantic structure, font loading (Inter variable + Agrandir), the Next.js CMS lander architecture (/default-lander, /home-lander), Cloudinary/Wistia/HubSpot/Sentry/GTM third parties, and any technical design observations.' },
]

const dossier = JSON.stringify(pageReports).slice(0, 240000)
const chapters = (await parallel(DIMENSIONS.map((d) => () =>
  agent(
    `You are a world-class expert writing the "${d.title}" chapter of a rigorous, publication-quality design audit ("design.md") of the bolt.com website. ` +
    `Write in Markdown. Be exhaustive, specific and concrete — exact hex values, px sizes, easing curves, font names, component specs, and cite which pages exemplify each pattern. Use tables where they add clarity. Avoid generic filler and avoid repeating the same point.\n\n` +
    `=== GROUND-TRUTH DESIGN TOKENS (extracted from the live site) ===\n${JSON.stringify(G)}\n\n` +
    `=== PER-PAGE DESIGN REPORTS (analysts who read each page's screenshots + profile) ===\n${dossier}\n\n` +
    `=== YOUR CHAPTER FOCUS ===\n${d.focus}\n\n` +
    `Produce ONLY the Markdown for this chapter, starting at a level-2 heading (## ${d.title}).`,
    { label: `dim:${d.key}`, phase: 'Dimension synthesis' }
  )
))).filter(Boolean)

phase('Assemble')
const pageIndex = pages.map((p) => `- ${p.path}${p.title ? ' — ' + p.title : ''}`).join('\n')
const final = await agent(
  `You are the lead design writer assembling the final, cohesive, publication-quality \`design.md\` for the bolt.com website design audit. ` +
  `You are given pre-written expert chapters. Assemble them into one polished document:\n` +
  `- Open with an H1 title, a 2-3 paragraph executive summary capturing Bolt's design language in a sentence-worthy way, then a Markdown table of contents.\n` +
  `- Include every chapter in a sensible order (Brand, Color, Typography, Layout, Components, Motion, Imagery, Content/IA, Responsive, Accessibility/Technical).\n` +
  `- Keep ALL concrete specifics (hex, px, easings, component specs, page citations). Do not summarize away detail.\n` +
  `- Fix heading hierarchy so each chapter sits at ## with #### sub-parts as needed; ensure smooth transitions and no duplicate headings.\n` +
  `- End with a "Page-by-Page Index" appendix listing every audited page.\n` +
  `Return ONLY the final Markdown document.\n\n` +
  `=== CHAPTERS ===\n${chapters.map((c, i) => `\n\n<<<<< CHAPTER ${i + 1} >>>>>\n${c}`).join('')}\n\n` +
  `=== PAGE INDEX (${pages.length} pages) ===\n${pageIndex}\n`,
  { label: 'assemble', phase: 'Assemble' }
)

return { markdown: final, pageReports, chapters }
