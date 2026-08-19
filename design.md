# Bolt.com — Website Design & Animation Audit

> **Subject:** `https://www.bolt.com` — Bolt (one-click checkout / commerce / payments for merchants, plus the consumer **Bolt SuperApp** and the **Bolt ID** identity layer).
> **Scope:** 46 pages across **both** sides of the site — the merchant **"For Businesses"** experience and the consumer **"For Users" / SuperApp** experience.
> **Method:** Each page was loaded in a real headless Chromium (Playwright), auto-scrolled to trigger reveal animations, and captured at desktop (1440px) and mobile (390px) as full-page screenshots, alongside a programmatic extraction of computed styles, design tokens, CSS custom properties, keyframes, transitions, and CMS component classes. A panel of expert agents then analyzed the captured artifacts across ten design dimensions, each documented in a chapter below. Every chapter is grounded in exact values (hex, px, easing curves, font names, component specs) and cites the pages that exemplify each pattern.
> **Audited:** 2026-06-02.

---

## Executive Summary

Bolt presents itself as a **bold, high-contrast fintech brand** with the confidence of a payments incumbent and the energy of a consumer app. The design language is built on a deliberately small kit: one electric **brand blue (`#006CFF`)**, a near-black **navy (`#04091A`, "boltBlack")**, a cool **off-white (`#F8F6FE`)**, and a violet accent (`#9A4EFF`), set in a two-typeface system — the geometric grotesque **Agrandir** for all display type and the **BOLT** wordmark, and **Inter** for body and UI. Headlines are large, tightly tracked (H1 at 70px/700 with −1.4px letter-spacing), and unapologetically declarative ("The checkout that converts. Instantly."). The whole site alternates full-bleed **dark navy** and **light off-white** bands, giving every page a confident, rhythmic cadence that always resolves into a single, oversized "BOLT" wordmark spanning the footer.

Structurally, bolt.com is **not hand-built page by page** — it is assembled from a single Next.js, CMS-driven lander system (`/home-lander`, `/default-lander`, and product-specific templates) out of a reusable block library: `Hero`, `ZLayoutContent`, `TwoColumnChecklistSection`, `featureCards`, `mediaBlock`, `Ticker`, `postSlider`, `LogoScroller`, `CheckoutDemo`, and more. Components are tokenized and theme-aware (a 14-variant `.Button` system on a 1280px "pill" radius, a context-aware header CTA that inverts on scroll, and `fontColor--*` / `backgroundColor--*` utility tokens), which is why the design stays remarkably coherent across 46 pages and two distinct audiences. The merchant side leans informational and proof-driven (stats, partner logos, case studies); the consumer SuperApp side ("For Users" → `/pay`) shifts to a darker, app-store aesthetic with download badges, product-UI mockups, and regulated-finance disclaimers.

Motion is **purposeful and restrained but pervasive**: IntersectionObserver scroll reveals animate translate + opacity on a signature `cubic-bezier(0.23, 1, 0.32, 1)` (easeOutQuint) curve at ~0.35s, hero headlines stagger upward on load, partner logos and feature categories run on infinite `logoScroller` marquees (30s linear), and the flagship `CheckoutDemo` runs a scripted simulation of a real Bolt checkout (`showFetch` → `showMessage` → `swipe` → `pressButtonRipple`). Micro-interactions are unified by a single button hover (`scale(1.07)` + blue fill + a diagonal `::after` "sheen" wipe), and the site respectfully ships a `prefers-reduced-motion` path. Personality flourishes — a "Soundtrack" menu linking Bolt's Spotify/Apple Music/YouTube playlists, "NEW" badges in the mega-menu, and brand voice that survives even into empty states — round out a system that is disciplined where it counts and playful where it can afford to be.

The ten chapters below document each layer in depth. Where relevant, each chapter closes with concrete, prioritized recommendations (e.g., a handful of AA color-contrast tightenings, Cloudinary delivery optimizations, and information-architecture fixes for orphaned consumer pages).

## Table of Contents

1. [Brand Identity & Art Direction](#brand-identity--art-direction)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Layout, Grid & Spacing](#layout-grid--spacing)
5. [Component & UI Pattern Inventory](#component--ui-pattern-inventory)
6. [Motion & Animation System](#motion--animation-system)
7. [Imagery, Illustration & Iconography](#imagery-illustration--iconography)
8. [Content Design, Voice & Information Architecture](#content-design-voice--information-architecture)
9. [Responsive & Mobile Design](#responsive--mobile-design)
10. [Accessibility, Performance & Technical Signals](#accessibility-performance--technical-signals)

> **Appendix:** [Page-by-Page Index](#appendix--page-by-page-index)


---

## Brand Identity & Art Direction

> **Scope note.** This chapter audits the brand expression of **bolt.com** — the checkout-and-finance company (*"Shockingly Simple Checkout & Finance"*), not the unrelated `bolt.new` AI tool. All tokens, hex values, and type specs below were extracted from the live production site (homepage `/`, the consumer surface `/pay`, the product page `/checkout`, and a legal/empty-state page) via computed-style inspection, not a brand guideline document. Where a value is a verbatim computed style it is quoted exactly.

### 1. Identity at a glance

Bolt projects a **fintech-confident, high-contrast, "premium-but-friendly"** identity. The system is built on a deliberately small, opinionated kit: two typefaces, one hero ink, one electric accent, one off-white, and a single signature gesture — **giant, geometric, custom letterforms** that recur from the 313 px footer wordmark down to the 23 px lightning glyph. The mood is closer to a confident consumer tech brand (think Cash App / Robinhood register) than to a buttoned-up B2B payments processor — appropriate for a company that runs *both* a merchant checkout business and a consumer "SuperApp."

| Identity pillar | Expression on the live site |
|---|---|
| **Ink / canvas** | Near-black navy `#04091a` ("`rgb(4, 9, 26)`") as the brand's signature dark canvas — hero, footer, dark sections |
| **Electric accent** | `#006CFF` brand blue — the lightning mark fill, primary CTAs, link color, the "WE'RE HIRING" pill |
| **Off-white** | `#f8f6fe` ("`rgb(248, 246, 254)`") — the paper/light surface and the inverse of the ink, used for the giant footer wordmark and inverted CTAs |
| **Display voice** | `agrandir-bolt`, weight 700, very tight negative tracking — bold, condensed-feeling, characterful |
| **Body voice** | `Inter`, 400–600 — neutral, legible, modern fintech-default |
| **Signature gesture** | Custom geometric letterforms + a lightning bolt built from the *same* angular logic, scaled from 23 px to 313 px |
| **Voice/tone** | "Shockingly simple" — playful confidence; the word *shockingly* (an electricity pun) recurs even in empty states |

### 2. The wordmark, the mark, and the giant footer treatment

Bolt operates a **two-element logo system**, both delivered as inline SVG (resolution-independent, recolorable via CSS):

**a) The "BOLT" wordmark.** Rendered as an SVG with `viewBox="0 0 104 30"` in the nav (`.navLogoDesktop`, ~104×30 px) and blown up to **313×90 px** in the footer. The letterforms are *custom*, not `agrandir-bolt` glyphs straight off the shelf — they are heavily geometric, with a near-monoline weight, rounded `B`/`O` bowls, and a distinctive **angular `L→T` junction where the foot of the "L" shears diagonally into the "T"**, visually rhyming with the lightning mark. In the nav the wordmark is `#f8f6fe` white on the dark hero; in the footer it is the same off-white at huge scale on `#04091a`.

**b) The lightning glyph.** A standalone bolt icon (`.Ticker__bolt`, `viewBox="0 0 23 28"`), filled solidly in brand blue `#006CFF`. Its path —

```
M22.576 10h-11.53V0H9.03C7.297 6.04 3.95 12.72 0 18h11.529v10h2.017c1.733-6.04 5.079-12.72 9.03-18Z
```

— is a stylized lightning bolt constructed from two offset stepped forms, i.e. the same shear logic as the wordmark's `L→T`. This is the single most-reused brand atom on the site: it appears in the nav ticker, on floating product UI ("*Information with Bolt for a faster…*"), and as a tiny blue dot prefix on the copyright line.

**The giant typographic footer.** The site's most memorable art-direction move is the **oversized "BOLT" lockup anchoring the footer** (see footer capture). The footer is the brand ink `#04091a`; the wordmark sits in off-white `#f8f6fe` at ~90 px cap height, far larger than any link group above it (footer headings are merely Inter 20 px `#f8f6fe`). The effect is a **brand sign-off / billboard** rather than a utility logo — it converts the least-glamorous region of the page into an identity statement. Supporting details reinforce coherence: an `X` and `LinkedIn` social pair in muted dark-navy chips (`rgb(38,42,66)` = `#262a42`), a tidy legal row (Legal · Privacy Policy · Privacy Center · Terms), and `• © 2026 Bolt Financial, Inc.` led by the blue bolt dot.

### 3. Art-direction mood: dark hero, electric accent, cinematic lifestyle

The homepage hero is the thesis statement of the art direction (see hero capture):

- **Canvas:** a single solid `#04091a` (`.home__headerHeroWrapper`) — notably **not** a CSS gradient; the violet glow is baked into the photography/art, giving a richer, less "CSS-y" result.
- **Light:** a dramatic **purple-to-violet directional spotlight** sweeps diagonally behind the subject, the one place the otherwise blue/ink palette opens up to a warmer hue. It reads as energy and "magic," softening the corporate-fintech edge.
- **Subject:** confident, stylish lifestyle photography — a smiling man in a purple jacket holding a phone, with a **floating, glassy Bolt checkout card** ("WELCOME BACK, SKYLER!", "Lightning Shop", "Pay $55.00") composited beside him. The pattern — *real person + floating product UI on dark* — is the recurring hero device.
- **Type:** `agrandir-bolt` 700, **70 px / 70 px line-height / −1.4 px letter-spacing** for the H1 ("Building trust with every tap"), set in pure white; subhead in Inter 500, 20 px, in a cool periwinkle `#d3d7ed` ("`rgb(211,215,237)`").
- **Extra flourish:** a top-right **"Soundtrack" control** — Bolt treats the marketing site as a branded *experience* with audio, a strong personality signal most B2B fintech sites would never ship.

Immediately below, a **monochrome logo wall** (Kendra Scott, love.com, Frette, Lafayette 148, Naturepedic, Revolve) sits on white — a deliberate light/dark **whiplash** that becomes the page's rhythmic engine: confident dark "moments" punctuated by clean light credibility bands.

### 4. Type system

| Role | Family | Weight | Size (desktop) | Tracking | Color (on dark / on light) |
|---|---|---|---|---|---|
| Hero H1 | `agrandir-bolt` | 700 | 70 px (LH 70 px) | −1.4 px | `#ffffff` / `#04091a` |
| Section H2 | `agrandir-bolt` | 700 | 64 px (LH 70.4 px) | −1.28 px | `#f8f6fe` |
| Subhead / lede | `Inter` | 500 | 20 px | normal | `#d3d7ed` |
| Body | `Inter` | 400 | 16 px | normal | `#04091a` / `#f8f6fe` |
| Footer headings | `Inter` | (bold) | 20 px | normal | `#f8f6fe` |
| Buttons / nav | `Inter` | 600 | 15–16 px | normal | per CTA variant |

The pairing is **expressive display + neutral workhorse**: `agrandir-bolt` (a customized Agrandir cut — note the brand-specific `-bolt` suffix) carries *all* personality at large sizes, with consistently tight negative tracking (≈ −0.02 em) that makes headlines feel dense and assured. `Inter` does every job below ~24 px. There is no third typeface, no serif, no mono — a disciplined two-font system that keeps the identity legible across hundreds of pages.

### 5. Color tokens

| Token | Hex / value | Usage |
|---|---|---|
| Brand ink (canvas) | `#04091a` | Hero, footer, dark sections, inverted CTAs, active "For Businesses" tab |
| Brand blue (accent) | `#006CFF` | Lightning mark, primary CTA fill, link color, "WE'RE HIRING" pill, outline-CTA borders |
| Off-white (paper/inverse) | `#f8f6fe` | Light surfaces, footer wordmark, CTA text on dark, inverted CTA fill, "For Users" active tab |
| Cool periwinkle | `#d3d7ed` | Subheads / secondary copy on dark |
| Muted navy chip | `#262a42` | Social icon chips in footer |
| Pure white | `#ffffff` | Logo wall band, card backgrounds (radius 16 px) |

Accent discipline is strong: brand blue is reserved for *the most action-y things* (primary CTA, links, the mark, "hiring"). The palette is essentially **monochrome navy + one electric blue**, with violet living only in photography — a restraint that makes the rare blue read as genuinely "electric."

### 6. Component signatures

- **Pill buttons.** Every CTA is a **fully rounded pill** — `border-radius: 1280px` — in Inter 600, ~13 px×22 px padding. Three coherent variants encode hierarchy without new colors: **primary** (blue `#006CFF` fill, off-white text), **inverted** (off-white fill, ink text), and **outline** (transparent fill, 2 px `#006CFF` border). The consumer `/pay` page swaps the primary to an **ink-filled** pill (`#04091a`) — same shape, audience-tuned fill.
- **Cards.** Content cards use `border-radius: 16px` on white; the cookie/consent UI (a separately themed widget) uses its own `25px` pill buttons and `0.5rem` modal radius. The pervasive rounding (pills + 16 px cards) is the brand's softening counterweight to the hard angular logo — friendly geometry, sharp identity.
- **Navigation tabs (square).** The only deliberately *un*-rounded component is the **dual-audience tab pair** (radius `0px`), which reads like a hard toggle/segmented control — see §7.

### 7. The "For Users vs For Businesses" dual-audience framing

Bolt's single most strategically important brand decision is surfacing its **two-sided business** as a persistent **top-of-page audience switch**, sitting *above* the main nav at `y=0`:

| Tab | Links to | Active-state styling |
|---|---|---|
| **For Users** | `/pay` (consumer "SuperApp") | Filled when active; on `/pay` it fills off-white `#f8f6fe` |
| **For Businesses** | `/` (merchant homepage) | Filled `#04091a` (ink) when active on `/` |

Both tabs are square (`radius 0`), Inter 600 / 15 px — a hard segmented control that signals "two distinct doors into one brand." The framing is reinforced by **palette polarity**: the **business** side leads **dark** (ink hero, "Building trust with every tap," "Supercharge your business"), while the **consumer** side (`/pay`, "One SuperApp to rule them all," `<title>Get the Bolt SuperApp</title>`) inverts to a **bright** canvas with ink-on-white headlines. Crucially, the *type system, pill CTAs, mark, and wordmark are identical across both* — only the canvas polarity and CTA fill flip. This lets one identity serve a B2B merchant audience and a B2C shopper audience without fracturing into two brands. Secondary nav further telegraphs the breadth of the B2B side: Product Suite (Bolt ID, Check-In, Checkout / Checkout 2.0 / Checkout OS / Checkout Everywhere, Connect, Fully Managed Fraud, Subscriptions, **Stablecoins**, User Network), Use Cases (App Developers, Digital Goods, High Risk, Ecommerce, SaaS), Developers, Pricing, News — each tagged `NEW` where relevant in brand blue.

### 8. Coherence across product, marketing, and legal pages

The identity holds remarkably tight across page *types*, which is the truest test of a system:

| Page | Surface type | H1 type | H1 color | Brand integrity |
|---|---|---|---|---|
| `/` | B2B marketing | `agrandir-bolt` 700 / 70 px / −1.4 px | `#ffffff` on `#04091a` | Full kit: dual tabs, mark, wordmark, footer billboard |
| `/checkout` | Product | `agrandir-bolt` 700 / 64 px H2s | `#f8f6fe` | Same pills (blue / inverted / outline), same ink sections |
| `/pay` | B2C consumer | `agrandir-bolt` 700 / 70 px / −1.4 px | `#04091a` on light | Inverted palette, ink-fill CTA, identical type/mark |
| `/terms` (empty/legal) | Legal/utility | `agrandir-bolt` 700 / 70 px | `#f8f6fe` on `#04091a` | Nav logo + footer present; copy stays on-voice |

The standout proof point: the `/terms` route renders an empty/placeholder state whose headline reads **"This page is shockingly… empty"** — still in full 70 px `agrandir-bolt` on the brand ink, with the nav wordmark and giant-footer treatment intact. The pun on **"shockingly"** deliberately echoes the company tagline *"Shockingly Simple Checkout & Finance"* and the electricity/lightning theme. Brand voice and visual system are therefore enforced **down to the error/utility scaffolding**, not just the marketing showcase — a sign of a genuinely systematized identity rather than a hand-decorated home page.

### 9. Strengths, risks, and verdict

**Strengths.** (1) A *signature* gesture — the giant footer wordmark + matching lightning glyph — that is instantly ownable and scales from 23 px to 313 px. (2) Ruthless restraint: two fonts, one ink, one accent, one off-white. (3) A genuinely clever dual-audience model that flips canvas polarity instead of forking the brand. (4) Personality reaching into copy ("shockingly") and even audio ("Soundtrack").

**Risks / watch-items.** (1) The *consistency of the giant wordmark's rendering* across breakpoints — in the captured (narrow) footer the lockup is tightly cropped to the column; on wide viewports it should be verified to read as a full billboard rather than an overflow artifact. (2) Brand blue `#006CFF` on the dark `#04091a` for *link text* (`linkColor` resolves to `#f8f6fe` on legal pages, but blue elsewhere) risks **WCAG contrast** scrutiny for body-sized links on the ink canvas — worth an accessibility pass (covered in the accessibility chapter). (3) Reliance on a single custom display face (`agrandir-bolt`) means a font-load failure degrades the *entire* brand voice; a robust fallback stack is essential.

**Verdict.** Bolt's identity is **mature, confident, and coherent** — a disciplined fintech system that earns its "shockingly simple" promise through a small, repeatable kit and one bold, memorable typographic signature, executed consistently across marketing, product, consumer, and legal surfaces.

---

Artifacts captured during this audit (absolute paths):
- `C:\Users\user\Desktop\analyticsfollowingfrontend\analyticsfollowingfrontend\bolt-hero.jpeg` — homepage dark hero, dual-audience tabs, logo wall
- `C:\Users\user\Desktop\analyticsfollowingfrontend\analyticsfollowingfrontend\bolt-footer.jpeg` — giant "BOLT" footer wordmark on `#04091a`


---

## Color System

Bolt's website runs on a deliberately small, high-contrast palette built around four anchors — a single saturated brand blue, a near-black navy, a cool off-white, and a violet accent — plus a tight ramp of cool-grey neutrals and two reserved semantic colors (green/red). Color is not decorative here; it is the primary signal of *section theming*. Nearly every page declares its mood at the `<html>` level with a `dark` or `light` class, and the palette is split into two parallel sets keyed to that decision. The result is a brand that reads as confident and "fintech-serious": blue for action, navy for authority, off-white for calm, violet for the consumer/payments story.

### 1. The core palette (exact values & semantic roles)

All values below are aggregated from computed styles across 46 crawled pages (`profiles-*.json`). Counts are the summed occurrences of that color as a text or background value across the full crawl — a reliable proxy for how load-bearing each token is.

| Token | Hex | RGB | OKLCH (approx) | Primary role | Where it dominates |
|---|---|---|---|---|---|
| **Brand Blue** | `#006CFF` | `rgb(0, 108, 255)` | `oklch(0.60 0.236 258)` | Primary action / brand signature. The single most-used background (1,251 bg hits) | All CTAs, links, hero accent panels, `intelligentcheckout`, `payments` |
| **Bolt Black (navy)** | `#04091A` | `rgb(4, 9, 26)` | `oklch(0.16 0.027 268)` | Dark-section canvas + primary body text on light | Every `dark` page bg; body copy on light pages |
| **Off-white (tintedWhite)** | `#F8F6FE` | `rgb(248, 246, 254)` | `oklch(0.97 0.009 300)` | Light-section canvas; text & headings on dark | `light` page bg; `Get started` button face; H2/H3 on dark |
| **Pure White** | `#FFFFFF` | `rgb(255, 255, 255)` | `oklch(1 0 0)` | Cards, surfaces, hero text on dark | Card surfaces (1,201 bg hits), `shopper`/`shop` H1 |
| **Violet / Purple** | `#9A4EFF` | `rgb(154, 78, 255)` | `oklch(0.62 0.243 300)` | Consumer/payments accent, gradient terminus | `shopper` hero gradient, Pay/rewards, super-app story |
| **Success Green** | `#00C42E` | `rgb(0, 196, 46)` | `oklch(0.70 0.227 145)` | Reserved semantic: confirmation / checkmarks / "approved" | `checkout`, `enterprise`, `resources` (sparingly) |
| **Error / Alert Red** | `#FF4F50` | `rgb(255, 79, 80)` | `oklch(0.66 0.213 22)` | Reserved semantic: error / risk / fraud emphasis | `contact-sales`, `refer` |

Two structural notes on the anchors:

- **Bolt Black is internally named** — the `<html>` carries modifiers like `backgroundColor--boltBlack` (e.g. `activate`, `bolt-id`, `case-studies`, `connect`, `refer`, `stablecoins`, `startups`) and a slightly different `backgroundColor--deepBlack` on `network`. The two read as the same navy at a glance; `deepBlack` is the darker variant reserved for the network/identity narrative.
- **Off-white is internally `tintedWhite`** — pages such as `news`, `pay`, `fraud`, and `resources` declare `backgroundColor--tintedWhite`, distinguishing the `#F8F6FE` violet-tinted white from a literal `backgroundColor--white` (`faq`, `shop`). The "white" you perceive on light pages is almost never `#FFFFFF` for the page canvas — it is the cooler `#F8F6FE`, with pure white reserved for cards floating on top.

### 2. Neutral / grey ramp (cool, navy-biased)

Bolt's greys are not neutral grey — every step is pulled toward the navy hue, which keeps the whole UI feeling cohesive with Bolt Black. There are effectively two sub-ramps: a **cool-navy ramp** used inside the brand light/dark system, and a **pure-grey ramp** that leaks in from embedded/legal/third-party content.

| Step | Hex | RGB | Role |
|---|---|---|---|
| Navy-700 (panel) | `#262A42` | `rgb(38, 42, 66)` | Elevated dark surface / mid-gradient stop (616 text, 212 bg) |
| Navy-600 | `#454A66` | `rgb(69, 74, 102)` | Secondary dark surface / muted text on dark |
| Slate-500 (muted text) | `#8E92AF` | `rgb(142, 146, 175)` | **Primary muted/secondary text** (1,819 hits) — captions, labels, footnotes |
| Slate-400 | `#6A6F8C` | `rgb(106, 111, 140)` | Tertiary muted text / disabled |
| Periwinkle-300 | `#D3D7ED` | `rgb(211, 215, 237)` | **Body copy on dark backgrounds** (`p` color on home/shopper); soft divider fills |
| Periwinkle-200 | `#B9BEDB` | `rgb(185, 190, 219)` | Light-hero gradient top stop; faint surfaces |
| Lavender-100 | `#E4E6F7` | `rgb(228, 230, 247)` | Card / chip fills on light pages (102 bg hits) |
| Ink-900 | `#111426` | `rgb(17, 20, 38)` | Heading variant on light (`pay-rewards` H3) |

**Pure-grey intrusions (not brand tokens):** `#707070` (486), `#F4F4F4` (93 bg), `#181818`, `#999999`, `#3D3C38`. These cluster in legal templates (`templateLegal` → privacy/terms), embedded news/blog content, and third-party widgets (Wistia, maps). They are a consistency leak worth flagging — the brand ramp is navy-biased, but borrowed content reintroduces neutral greys that break hue cohesion.

**The `rgb(0, 0, 238)` anomaly (10,965 hits):** the single highest text count after pure black is `#0000EE` — the *UA default unstyled link blue*. Its enormous count comes from inline SVG/icon `<a>` defaults and unstyled anchors inside embedded content, not from intentional design. Treat it as noise, not a palette member; the *designed* link/action color is unambiguously `#006CFF`.

### 3. Light vs dark section theming

Theming is a first-class, page-level decision encoded in the root `htmlClass`. Of 46 pages: **26 are `light`, 18 are `dark`, 2 are unclassified** (`home`, `contact-us` carry `medium`, a hybrid that transitions dark→light as you scroll).

| | Dark sections | Light sections |
|---|---|---|
| Page canvas | `#04091A` Bolt Black (`backgroundColor--boltBlack`, `--deepBlack`) | `#F8F6FE` off-white (`backgroundColor--tintedWhite`) or `#FFFFFF` (`--white`) |
| Headings (H1–H3) | `#FFFFFF` pure white (`shopper`, `shop`) or `#F8F6FE` off-white (`home`) | `#04091A` navy, or `#006CFF` brand blue for hero H1 (`pay-rewards`) |
| Body copy | `#D3D7ED` periwinkle | `#04091A` navy |
| Muted / captions | `#8E92AF` slate, `#454A66` navy-600 | `#8E92AF` slate (shared across both themes) |
| Surfaces / cards | `#262A42` navy-700, `rgba(4,9,26,0.65)` scrim | `#FFFFFF` white, `#E4E6F7` lavender |
| Primary CTA | `#F8F6FE` face / `#04091A` text (inverted) | `#006CFF` face / white text |

The **`darkTheme` modifier is the most interesting wrinkle**: `app-devs`, `checkout`, and `get-started` all stack `darkTheme` *and* `light` on the same root (`enterprise darkTheme ignite ... light`). This is a sectioned page — a dark "enterprise/ignite" hero zone sitting above a light body — and the CSS toggles palette per section block rather than per page. It signals that Bolt's theming is genuinely compositional (zone-by-zone), not a binary page switch; the home page's `medium` class is the same mechanism, scrolling from the navy `home__topDynamicZone` into the off-white `home__bottomDynamicZone`.

The shared muted-text color (`#8E92AF`) across both themes is a smart economy — one secondary-text token that holds ~4.6:1 contrast on both navy and off-white — but it is also the riskiest pairing (see §6).

### 4. Gradients

Gradients are reserved almost exclusively for hero zones and section transitions; the bulk of surfaces are flat fills. Four gradient families appear across the crawl:

| Gradient | Stops | Role / page |
|---|---|---|
| **Navy depth hero** | `linear-gradient(359deg, #04091A −57%, #262A42 26%, #04091A …)` | Home top dynamic zone — a near-vertical navy→slate→navy that creates a soft central "glow" behind the H1 "The checkout that learns from every click" |
| **Dawn / light transition** | `linear-gradient(#B9BEDB → #F8F6FE 72%)` | Home bottom zone — periwinkle fading up into off-white, the visual handoff from dark story to light product copy |
| **Indigo→Violet→Blue consumer hero** | `linear-gradient(#04091A, #04091A 65%, #9A4EFF 83%, #006CFF …)` | `shopper` hero — navy holds for two-thirds then ramps through violet into brand blue. This is the signature "consumer/Pay" gradient and the primary home of the purple accent |
| **Blue→Navy inversion** | `linear-gradient(#006CFF, #006CFF 26%, #04091A 65%, #04091A …)` | `shopper` animation section — brand blue collapsing into navy, used to tie the blue CTA band into the dark body |

Design takeaway: the purple `#9A4EFF` exists almost entirely *as a gradient transition color* between navy and blue, not as a standalone fill — it appears only ~10 times as text and 7 as a flat bg across the entire site. It is the "warmth bridge" in the consumer narrative, deliberately rare so it stays special.

### 5. Accent & semantic usage discipline

- **Blue is the only ambient accent.** It carries every CTA, link, focus ring, and brand mark. Because it is also a full-bleed section background (`#006CFF` panels), the same hue does double duty as action-color and brand-color — economical but it means a blue button on a blue panel must invert to white text (which the site does).
- **Green and red are strictly semantic and rare.** Green (`#00C42E`) appears only on conversion/trust surfaces (`checkout`, `enterprise`, `resources`) as success ticks; red (`#FF4F50`) only on `contact-sales` and `refer` for errors/risk emphasis. Neither leaks into decoration — a healthy sign of semantic discipline.
- **Cyan outlier** `#68D8FC` / `#B2ECFF` (`shopper`) is a one-off illustrative accent inside product imagery, not a system token.
- **Pink** `#FF76F2` appears once — incidental illustration, not palette.

### 6. Contrast pairings (WCAG)

Computed against the actual paired tokens observed in the DOM. Pass = AA normal text (≥4.5:1); Large = AA large/UI (≥3:1).

| Foreground | Background | Ratio | Verdict |
|---|---|---|---|
| `#04091A` navy text | `#F8F6FE` off-white | **~17.6:1** | Excellent (AAA) |
| `#FFFFFF` white | `#04091A` navy | **~18.9:1** | Excellent (AAA) |
| `#D3D7ED` periwinkle body | `#04091A` navy | **~13.0:1** | Excellent (AAA) |
| `#FFFFFF` white | `#006CFF` blue (CTA) | **~3.9:1** | Large/UI only — fine for ≥18px button text, **fails AA for small white text on blue** |
| `#04091A` navy | `#006CFF` blue panel | **~4.8:1** | Passes AA |
| `#8E92AF` slate muted | `#F8F6FE` off-white | **~3.2:1** | **Fails AA normal text** — passes large only |
| `#8E92AF` slate muted | `#04091A` navy | **~4.6:1** | Borderline pass AA |
| `#006CFF` blue link | `#F8F6FE` off-white | **~4.3:1** | **Just below AA (4.5)** for body-size links |

Two pairings warrant attention. First, **`#8E92AF` muted text on the light off-white canvas (~3.2:1) fails AA for normal-size copy** — and this is the single most-used secondary-text token (1,819 hits), so the failure is widespread on captions/labels across all light pages. Second, **`#006CFF` as a small inline link on `#F8F6FE` sits at ~4.3:1, marginally under AA**; it is fine as a button face (large) but technically short for body-text links. Both are easy fixes (darken muted to ~`#6A6F8C` for light contexts; darken link blue to ~`#0057CC`) and are the only systemic contrast risks in an otherwise high-contrast, well-considered palette.

### 7. Summary assessment

Bolt runs a remarkably disciplined system: one brand blue, one navy, one off-white, one violet accent, and a navy-biased grey ramp — with green/red held in reserve for true semantics. The dual light/dark token sets are compositional (zone-level, not just page-level), which lets a single landing page narrate dark→light without a palette break. The weaknesses are narrow and fixable: (a) borrowed pure-greys (`#707070`, `#F4F4F4`) from legal/embedded content dilute the cool-navy ramp; (b) the UA-default `#0000EE` shows unstyled anchors lurking in embedded markup; and (c) the muted slate and link-blue pairings fall just under AA on the light canvas. Tighten those three and the palette is publication-grade.


---

## Typography

Bolt's type system is the single most disciplined layer of its entire design language. Where the color and layout systems lean on a sprawl of utility classes, the typography is governed by a tight, mathematically-derived set of rules: a two-family pairing, a six-step display scale with one consistent tracking ratio, a single fluid-scaling engine shared by every heading, and a body family (Inter) confined to a narrow band of sizes and weights. The result reads as confident and "fintech-serious" without ever feeling generic, because the proprietary display face does almost all of the personality work while Inter quietly handles legibility.

### The Typeface Pairing: Agrandir (display) + Inter (body)

Bolt runs a classic **proprietary-display / neutral-body** pairing. The display face is **Agrandir**, a geometric-humanist grotesque licensed from Pangram Pangram, self-hosted in two distinct cuts; the body face is **Inter**, the open-source workhorse, loaded as a system-adjacent stack.

| Role | Family (CSS) | Format & hosting | Weight axis | Usage |
| --- | --- | --- | --- | --- |
| Display — static bold | `agrandir-bolt` | Self-hosted `.woff2` → `.woff` → `.ttf` fallback chain at `/fonts/agrandir-bolt/` | Single static `700` | Every `h1`–`h6` heading, plus the `ShinyPill` micro-labels ("New", "We're hiring") |
| Display — variable | `agrandir-variable` | Self-hosted `.ttf`, `format("truetype-variations")` at `/fonts/agrandir-variable/` | Variable, `font-weight: 1 999` | Lighter editorial display text — notably the `QuoteCallout__quote` pull-quotes rendered at an *intermediate* weight |
| Body / UI | `Inter` | Stack: `Inter, sans-serif, -apple-system, BlinkMacSystemFont, "Apple Color Emoji", "Segoe UI"…` | `400 / 500 / 600 / 700` | All paragraph, nav, button, label, caption, citation and metadata text |

Two details are worth calling out as deliberate craft:

- **The display face ships in two separate files for two different jobs.** `agrandir-bolt` is a single static 700 cut, optimized (smallest payload, `.woff2`-first) because it carries the overwhelming majority of headings, which are *always* bold. The full variable file (`agrandir-variable`, axis `1 999`) is loaded only where Bolt wants a weight that isn't 700 — most visibly the testimonial pull-quote on the homepage (`QuoteCallout__quote`, `agrandir-variable` at computed weight **469**). Rendering a near-regular display weight from a variable axis, rather than shipping a second static cut, is a precise optimization choice: heavy headings stay on the lean static file; the one "lighter Agrandir" moment borrows the variable file.
- **Inter is loaded as a near-system stack, not a webfont-first stack.** The body `font-family` lists `Inter` first but falls straight through to `sans-serif` and the Apple/Segoe system faces, with `-webkit-font-smoothing: antialiased` and `font-optical-sizing: auto` active. This keeps body text legible and FOUT-safe even before Inter resolves, and reserves the (more expensive, self-hosted) Agrandir loads for the brand-critical headline layer.

A third family, `WistiaPlayerInterNumbersSemiBold`, appears in the `@font-face` table but is **not part of Bolt's system** — it is a base64-inlined tabular-numbers font injected by the embedded Wistia video player. It should be excluded from any design-token inventory.

### The Display Scale (Agrandir 700)

Every heading is the same face (`agrandir-bolt`, 700) and differs only in size, tracking and line-height. Measured from the live homepage and `/checkout`, the desktop (≥1440px reference) scale is:

| Token | Element / class | Size | Weight | Tracking | Tracking ratio | Line-height | LH ratio | Exemplar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Display / H1 | `h1.Hero__headingText` | **70px** | 700 | **−1.4px** | −0.020em | 70px | **1.00** | Homepage hero "Building trust with every tap" |
| H2 | `h2.Heading__title.h2` | 64px | 700 | −1.28px | −0.020em | 70.4px | 1.10 | "Supercharge your business" |
| H2-alt | `h2.Heading__title.h2` (black) | 50px | 700 | −1.0px | −0.020em | 50px | 1.00 | "77% of carts are abandoned…" |
| H3 | `h3.Heading__title` | 46px | 700 | −0.92px | −0.020em | 50.6px | 1.10 | "The checkout that learns from every click" |
| H4 | `h4.featureCards__cardHeading` | 32px | 700 | −0.64px | −0.020em | 35.2px | 1.10 | "Connect to over 80 million shoppers" |
| H4 (variable) | `h4.QuoteCallout__quote` | 32px | **469** | −0.64px | −0.020em | 35.2px | 1.10 | REVOLVE pull-quote |
| H6 / eyebrow head | `h3.h6` | 24px | 700 | −0.48px | −0.020em | 24px | 1.00 | "Bolt introduces network identity system" |

The defining property of the entire display scale is a **single, constant negative-tracking ratio of −0.02em (−2%)**. At every step the letter-spacing is exactly `size × −0.02`: 70 → −1.4, 64 → −1.28, 50 → −1.0, 46 → −0.92, 32 → −0.64, 24 → −0.48. This is not eyeballed per-heading; it is a tokenized rule that tightens Agrandir's geometric letterforms proportionally as they scale up, which is what gives large headlines their dense, confident, "set by a typographer" texture. The optical effect is most pronounced on the H1, where −1.4px pulls the wide Agrandir caps into a single cohesive block.

Line-height runs on a **two-state convention**: the largest "tight" display cuts (H1 70px, H2-alt 50px, the 24px eyebrow) are set at exactly `1.0` (line-height equals font-size) for poster-like compactness, while the multi-line heading sizes (H2 64, H3 46, H4 32) use `1.1` to give wrapped headlines breathing room. There is no looser leading anywhere in the display family — Agrandir headings never exceed 1.1.

Note also the **decoupling of semantic tag from visual rank**: Bolt's heading classes (`.h1`–`.h6`) carry the styling, and elements freely mix tag and class for accessibility and SEO — e.g. an `<h4>` carrying `.h2`, or an `<h3>` carrying `.h6`. This is a deliberate, healthy pattern (visual hierarchy via class, document outline via tag) and means the *class* token, not the HTML tag, is the source of truth for type rank.

### The Body & UI Scale (Inter)

Inter occupies a tight band from **20px down to 12px** and never competes with the display face — it tops out below the smallest heading. Weight does the hierarchy work within the body family:

| Token | Class / context | Size | Weight | Tracking | Line-height | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Lead / intro | hero subhead `<p>` | 20px | 500 | −0.4px | 24px (1.2) | The body equivalent of the −0.02em rule (20 × −0.02 = −0.4) |
| Ticker subtext | `Ticker__ticker--subText` | 20px | 500 | −0.4px | 26px (1.3) | |
| Section body | `Heading__bodyText` | 18px | 500 | −0.36px | 21.6px (1.2) | Again −0.02em |
| Nav (super) | `responsiveNav…LinkTitle` | 18px | 600 | normal | 21.6px | Tracking **resets to normal** below the lead sizes |
| Body default | `Heading__bodyText.gray_600` | 16px | 400 | −0.32px | 19.2px (1.2) | |
| Button label | `Button__inner` | 16px | 600 | −0.32px | 20.8px (1.3) | SemiBold CTA text |
| Primary nav | `header__primaryNavItem` | 16px | 500 | normal | normal | |
| Overline / eyebrow | `featureCards__cardOverline` | 16px | 400 | normal | normal | Sentence-case label, not all-caps |
| Sub-nav header | `header__superNavItem--link` | 15px | 600 | normal | 15px (1.0) | |
| Card CTA / meta | `featureCards__cardCtaText`, `Overline-green` | 14px | 500–600 | −0.28px | 18.2px (1.3) | |
| Footer / legal | `Footer__copyrightText` | 14px | 500 | −0.14px | 18.2px | Tracking relaxes to −0.01em on dense legal rows |
| Caption / date | `engagementCard__date` | 12px | 400 | −0.24px | 15.6px (1.3) | Smallest body token |
| Pill micro-label | `ShinyPill` | 10px | 700 | **+0.2px** | 10px | Agrandir, `text-transform: uppercase`, the *only* positive tracking in the system |

Three system rules emerge from the Inter scale:

1. **The −0.02em negative-tracking rule extends from display into body — but only down to ~16–20px.** Lead (20→−0.4), section body (18→−0.36), default body (16→−0.32) and card meta (14→−0.28) all hold the −2% ratio. The system then *relaxes* tracking on UI chrome: nav items, overlines, button-stack labels and form labels reset to `letter-spacing: normal`, because at small UI sizes negative tracking hurts legibility and tap-target text clarity. Footer legal text uses a gentler −0.01em (−0.14px at 14px). This is a thoughtful split — tracking is for *editorial* text, not for *interface* text.
2. **Weight, not size, separates UI states.** The 16px tier alone spans weight 400 (passive nav/list text), 500 (active nav, citations), and 600 (CTAs, sub-nav titles). The body family deliberately reuses two or three sizes (16px and 14px especially) and leans on Inter's 400/500/600 weights to signal interactivity and emphasis — keeping the rendered size palette small and rhythmic.
3. **Line-height widens as size shrinks.** Display sits at 1.0–1.1; body sits at 1.2 (lead, 16–18px paragraphs) to 1.3 (small 12–14px meta and ticker text). This is correct inverse-leading practice: smaller text needs proportionally more leading for readability, larger display text needs less.

### Responsive Scaling: A Two-Band Fluid Engine

Bolt does **not** use static breakpoint jumps for type — every heading and paragraph scales fluidly via `calc()` formulas of the form `calc(<negative px> + <rem> + <vw>)`, which is the algebraically-expanded form of a fluid `clamp()`/linear-interpolation token. Each heading defines **two bands**, switched at a single `min-width: 1024px` media query, plus paragraphs carry a finer three-band model. The H-scale formulas:

| Level | Mobile/tablet band (<1024px) | Desktop band (≥1024px) |
| --- | --- | --- |
| H1 | `calc(-35.84px + 2.24rem + 11.2vw)` | `calc(-49.7778px + 3.11111rem + 4.86111vw)` |
| H2 | `calc(-32.4267px + 2.02667rem + 10.1333vw)` | `calc(-45.5111px + 2.84444rem + 4.44444vw)` |
| H3 | `calc(-27.3067px + 1.70667rem + 8.53333vw)` | `calc(-32.7111px + 2.04444rem + 3.19444vw)` |
| H4 | `calc(-20.48px + 1.28rem + 6.4vw)` | `calc(-22.7556px + 1.42222rem + 2.22222vw)` |
| H5 | `calc(-17.0667px + 1.06667rem + 5.33333vw)` | `calc(-18.4889px + 1.15556rem + 1.80556vw)` |
| H6 | `calc(-14.5067px + 0.906667rem + 4.53333vw)` | `calc(-15.6444px + 0.977778rem + 1.52778vw)` |

Solving these at a 16px root yields the **actual rendered H1–H6 sizes by viewport width**:

| Level | 375px (mobile) | 768px (tablet) | 1024px (desktop floor) | 1440px (design ref) | 1920px (wide) |
| --- | --- | --- | --- | --- | --- |
| H1 | 42px | 86px | 49.8px | **70px** | 93.3px |
| H2 | 38px | 77.8px | 45.5px | 64px | 85.3px |
| H3 | 32px | 65.5px | 32.7px | 46px | 61.3px |
| H4 | 24px | 49.2px | 22.8px | 32px | 42.7px |
| H5 | 20px | 41px | 18.5px | 26px | 34.7px |
| H6 | 17px | 34.8px | 15.6px | 22px | 29.3px |

This table reveals the system's most distinctive — and slightly aggressive — behavior: **the high-`vw` mobile band scales steeply** (H1 at 11.2vw climbs from 42px at 375px to ~86px at the 768px tablet width), then at the 1024px breakpoint the layout switches to a contained desktop band and the headline **drops back down** (H1 from ~86px → ~49.8px) before climbing again at the gentler 4.86vw desktop slope to its canonical 70px at the 1440px design width and 93px on ultra-wide screens. In other words, type is intentionally *largest, relative to viewport,* on tablet-width screens just below the desktop breakpoint, and the desktop band trades raw size for a slower, more controlled growth so 4K monitors don't produce comically huge headlines. The 70px / −1.4px H1 documented in the design tokens is specifically the **1440px snapshot** of this curve, not a fixed value.

Paragraph text uses an even more granular model with distinct formulas for `<768px`, `≥1024px`, and a clamped `1024–1439px` band (e.g. body `.p` resolves to `calc(0px + 0.95rem + 0.192308vw)`-style near-static values inside the 1024–1439 window), and a full size ladder of `.p--xxs / --xs / --sm / (default) / --lg / --xl / --xxl` each with its own per-band fluid curve. This is a far more elaborate paragraph-sizing system than most marketing sites ship, and it explains why body copy feels consistently proportioned from a 375px phone up to a 1920px desktop without visible "snap" at breakpoints.

### Hierarchy Patterns & How the System Reads

Bolt achieves clear hierarchy with a deliberately small toolkit:

- **Family signals rank before size does.** Anything in Agrandir is a heading or a brand label; anything in Inter is body, UI or metadata. A reader parses the page's skeleton purely by typeface before reading a word.
- **The overline → headline → body triad** structures nearly every section: a 16px Inter sentence-case overline (`featureCards__cardOverline`, e.g. "The Bolt Network"), an Agrandir 700 heading (32–64px), then 16–18px Inter `Heading__bodyText` in `gray_600`. Color (full-strength heading vs. muted body grey) reinforces the size step.
- **Tracking is the system's signature.** The omnipresent −0.02em on display and editorial text is the typographic fingerprint that ties hero, section heads, and lead paragraphs together; the deliberate reset to `normal` on interface text keeps nav and buttons crisp. The lone positive tracking (+0.2px, uppercase, Agrandir 10px `ShinyPill`) is reserved for tiny attention badges where letters would otherwise collide.
- **Restraint in the weight palette.** Display is effectively one weight (700), with a single variable-weight exception (469) used for the more conversational pull-quote tone. Body lives in 400/500/600 with 700 reserved for occasional emphasis (e.g. the bold 14px "Get updates on Bolt:" prompt). There is no italic, no all-caps body text, and no decorative weights — the personality budget is spent entirely on the proprietary Agrandir face and the tracking system, not on stylistic variety.

**Exemplar pages.** The homepage (`/`) is the canonical reference for the full scale: hero H1 (70/700/−1.4), the 64px "Supercharge your business" H2 with its `Heading__titleHighlight` colored span, the 50px tinted-black "77% of carts are abandoned" stat headline, the `featureCards` 32px H4s, and the Agrandir-variable 469-weight `QuoteCallout` testimonial. `/checkout` reuses the identical token set (confirming the scale is global, not per-page), and the global header/footer demonstrate the small-end UI tiers (15–16px Inter nav at weights 500/600, 14px footer/legal at −0.01em, 10px Agrandir pills).


---

## Layout, Grid & Spacing

Bolt's marketing site is not hand-laid-out page by page; it is **assembled from a single Strapi-backed CMS block library** (the page-data router is `/default-lander/[[...id]]` for every product page and `/home-lander/[[...id]]` for the homepage, per `window.__NEXT_DATA__.page`). Every page is therefore a vertical stack of the same ~20 reusable "components," each of which exposes the **identical four spacing knobs** — `marginTop`, `marginBottom`, `paddingTop`, `paddingBottom` — bound to a small named token scale. This makes the layout system unusually legible: the whole site's vertical rhythm is governed by roughly five spacing values and two content widths. The sections below document those primitives, the block taxonomy, and the dark/light banding strategy that ties them together.

### 1. The page is a flat stack of full-bleed blocks

There is no multi-column page shell, no sidebar, and no nested page grid. `main` runs the full viewport width (measured 1905px inside a 1920px window — i.e. viewport minus the scrollbar), and so does every top-level block: `.Hero`, `.ZLayoutContent`, `.featureCards`, `.Ticker`, `.Heading`, `.Divider`, `.FooterCallout` all report a box width of **1905px**. Color, not width, is what visually separates one section from the next — every block is edge-to-edge, and each block decides its own background. The page is literally `main > [Block] > [Block] > [Block] …`, where each Block is a `<div>` or `<section>` whose first class is its component name.

The constraint that produces the "page grid" lives **one level down**, inside each block, on an inner wrapper — see §3.

### 2. Container widths: a two-tier reading measure (1280 / 1064)

Bolt uses exactly two centered content widths, applied via `max-width` + `margin-inline: auto` on the inner wrapper of each block. Measured live on `/checkout` at a 1920px viewport:

| Tier | `max-width` | Used by | Centering | Evidence (1920px vp) |
|---|---|---|---|---|
| **Wide / hero measure** | **1280px** | `.Hero` (`Hero__grid`), most `Heading` blocks, `ZLayoutContent` | `margin-left/right: auto` (computed 312.5px each side = (1920−1280)/2) | inner `w: 1280, maxW: 1280px` |
| **Narrow / content measure** | **1064px** | `featureCards__grid`, `Ticker__row`, card grids | auto-centered (computed 420.5px left margin) | inner `w: 1064, maxW: 1064px` |

The 1064px tier (≈ 1280 − 2×108) is the "denser reading column" used for multi-card grids and the Ticker, so cards never stretch to the full hero width and statistics/feature copy keep a comfortable line length. The 216px difference between the two tiers is the single most important spatial relationship on the site — it is what makes feature grids feel inset relative to hero/headline blocks above them.

**Horizontal gutters.** At desktop the gutter is created entirely by the auto side-margins of the 1280/1064 wrappers (no inner `padding-left/right`; both report `0px`). On mobile (375px viewport) the same wrappers collapse to `max-width: 100%` and the gutter becomes an explicit **`padding: 0 20.8px`** (1.3rem) — confirmed on `Hero__grid` at 375px. The Ticker row carries its own internal **50px** left/right padding at desktop (`Ticker__row` `padL/padR: 50px`), which is why ticker stat rows sit further inboard than neighboring blocks.

### 3. The spacing scale: a named token system resolving to 0 / 50 / 75 / 150 px

Every block's outer rhythm is set with utility classes of the form `marginTop--{token}`, `marginBottom--{token}`, `paddingTop--{token}`, `paddingBottom--{token}`. Reading the **computed** values of every element carrying these classes resolves the scale precisely:

| Token | Resolved value | Role | Frequency observed |
|---|---|---|---|
| `--none` | **0px** | Hard-join two blocks (no gap) — used to butt adjacent same-color bands together | very common |
| `--xs` | **50px** | Tightest non-zero step; intra-section breathing | common |
| `--sm` | **75px** | Default section padding / medium gap | common |
| `--lg` | **150px** | Major section break between distinct topics | occasional |
| `--xl` | (≥150px; class present on `OffBleedImageBanner`, `SectionWithStickyNav`) | Largest break, hero-adjacent | rare |
| `--custom` | **arbitrary per-instance** (158px, 100px, 70px, 12px, 0px all observed) | Escape hatch — a hand-tuned value injected from the CMS for that one instance | the **most common token of all** |

This is effectively a `0 → 50 → 75 → 150` geometric-ish scale (50, +25, ×2). Notably it is **not** an 8-pt grid: 50/75/150 are 25-px multiples, and the type baseline (70px / 70.4px line-heights, see Typography chapter) does not align to it. The scale is coarse by design — these tokens govern *section-to-section* spacing, not component-internal spacing.

The dominance of `--custom` is the system's biggest spacing weakness: on `/checkout` alone, `marginTop--custom` resolved to **158px** on one block and `0px` on nine others, `paddingTop--custom` to **70px** on one and `0px` on twelve, and `marginBottom--custom` to **12px** on one. In other words, "custom" is used both as a no-op (`0px`, where the editor wanted to suppress the token's default) and as a one-off override (`158px`, `12px`). Because the actual value is authored per-block in the CMS rather than chosen from the scale, vertical rhythm drifts subtly between pages even though they share components — e.g. the homepage hero band is 2659px tall while the checkout hero is 684px, and the gaps above the first content block differ because both lean on `--custom`.

**Worked example — observed band rhythm on `/checkout` (computed margins/paddings, top → bottom):**

| Block | `marginTop` | `paddingTop` | `paddingBottom` | `marginBottom` |
|---|---|---|---|---|
| `Heading` (intro, on dark) | 0 | 0 | **100** | 0 |
| `Heading` (section label) | 0 | **100** | 0 | **50** |
| `featureCards` | **50** | 0 | **75** | **50** |
| `Heading` | 0 | 0 | **75** | 0 |
| `Heading` (`--custom`) | **158** | 0 | 0 | 0 |
| `Ticker` | 0 | 0 | 0 | 0 |
| `Heading` (`--custom`) | 0 | 0 | 0 | **12** |
| `Heading` | 0 | 0 | **50** | 0 |
| `FooterCallout`-adjacent `Heading` | **150** | 0 | 0 | **150** |

Two patterns are visible: (a) the site prefers to absorb spacing into **`padding` of the colored block** rather than margins between blocks, so that the dark/light background extends through the whitespace; and (b) adjacent gaps are *not* collapsed by the system — a `marginBottom--xs` (50px) block above a `marginTop--xs` (50px) block can sum to 100px, so editors compensate by zeroing one side with `--none` or `--custom: 0`. This margin-stacking is the mechanical reason `--custom: 0` appears so often.

### 4. The CMS block library (component taxonomy)

Each block's role and its layout signature, drawn from the first class token on every top-level node across `/`, `/checkout`, `/checkout-everywhere`, `/payments`, `/enterprise`, `/pricing`, `/ecommerce`, `/our-story`:

| Block | Layout signature | Width tier | Typical spacing | Where seen |
|---|---|---|---|---|
| **`Hero`** | Full-bleed; inner `Hero__grid` (CSS grid) at **1280px**; variants `withImage`, `hasCTAs`, always `scrolling-anim--staggerTextUp`. H1 70–88px. | 1280 | top-of-page only | every page (always block 0) |
| **`Heading`** | Centered text block (`textAlign--center responsiveTextAlign--center`), often `withoutHeadingBody`; acts as section title / closing CTA. Carries `backgroundColor--*` modifiers to start a band. | 1280 (text constrained ~457–661px) | `padding` 50–100px | pervasive (3–6 per page) |
| **`ZLayoutContent`** | The signature **alternating "Z" layout**: stacked text+media rows that flip left/right down the page. Tallest content block (2188–2633px). Has `darkTheme` variant. | 1280 | `--custom` heavy | `/checkout`, `/enterprise`, `/payments`, `/checkout-everywhere` |
| **`TwoColumnChecklistSection`** | Two stacked headed checklists ("Benefits for Merchants" / "for Shoppers"), `doubleHeading` modifier. | 1064 | `marginTop--lg` (150) | `/checkout` |
| **`featureCards`** | Horizontal **flex** row of cards (`featureCards__grid`, `display:flex`) inside the 1064 measure; `backgroundColor--tintBlack`/`tintedWhite` variants. | 1064 | `mt/mb 50`, `pb 75` | `/checkout`, `/enterprise`, `/ecommerce` |
| **`mediaBlock`** | Single text+image pairing, `imageExtend` (image bleeds past the column) and `responsiveTextAlign--center` variants. | 1280 | usually `--none` (butts to neighbors) | `/checkout`, `/pricing`, `/enterprise` |
| **`Divider`** | Spacer/rule block whose *only* job is rhythm; almost always `marginBottom--none marginTop--*` + `paddingBottom--none`. | n/a | a pure spacing token carrier | `/checkout`, `/ecommerce` |
| **`postSlider`** | Horizontal case-study/card carousel; `noSlide` static variant. | 1064 | `--custom` both sides | `/checkout`, `/payments`, `/enterprise` |
| **`Ticker`** | Full-bleed stat band with `Ticker__row` (50px inner padding) and a hidden `modal modal__video` sibling (900px, `hidden`) for play-on-click video. | 1064 | `marginTop--sm` (75) | `/checkout`, `/pricing`, `/ecommerce` |
| **`ImageBanner` / `OffBleedImageBanner`** | Logo/brand strip ("Trusted by the world's biggest brands"); `OffBleed` variant intentionally exceeds the 1280 column. | 1280 / off-bleed | `--custom`, `padding--xl` | `/checkout`, `/enterprise` |
| **`CheckoutDemo`** | Embedded interactive demo (`component-version`), Wistia-backed. | 1280 | `marginBottom--lg marginTop--custom` | `/checkout`, `/enterprise` |
| **`FooterCallout`** | Closing CTA band, frequently `backgroundColor--tintedWhite` with a `callout-rebrand` background image; `lightning` variant. | 1280 | `marginBottom--none` (sits flush to footer) | every page (last block) |
| **`LogoScroller`** | Auto-marquee logo strip (`logoScroller 30s linear`); homepage has a dedicated `home__logoScroller` wrapper. | full-bleed | `--custom` | `/`, `/checkout-everywhere` |
| **Niche blocks** | `ThreeColumnSection` (`contentAlign-center`), `IncludedCards`, `Integrations`, `SectionWithStickyNav`, `LocationCards`/`LocationList`, `AwardWinningCallout`, `CenteredMedia`, `FeaturedIn-Brands` — all consume the same spacing-token contract. | mixed | mixed | `/pricing`, `/our-story`, `/enterprise` |

The homepage is a special case: instead of named blocks it nests everything inside two CMS "dynamic zones" — `home__topDynamicZone` (2659px, dark `linear-gradient(359deg, rgb(4,9,26) → rgb(38,42,66) → rgb(4,9,26))`) and `home__bottomDynamicZone` (3233px, light `linear-gradient(rgb(185,190,219) → rgb(248,246,254))`) — preceded by `home__logoScroller`. So the homepage's dark→light transition is literally two stacked zone wrappers, whereas product pages achieve the same effect by per-block `backgroundColor--*` modifiers.

### 5. Internal grids and alignment

- **Hero** uses CSS Grid (`Hero__grid`) at 1280px to place headline/CTA against the hero artwork; on `withImage` variants the copy occupies a left track and media the right.
- **featureCards** is, despite the name "grid," a **flexbox row** (`display:flex`) inside the 1064 column — cards are equal-flex children, so column count is implicit in card count rather than a fixed `grid-template-columns`. This is why card rows reflow cleanly to a single column on mobile without media-query column declarations.
- **ZLayoutContent** alternates text/media rows; alignment is vertically centered per row, and the left/right flip is the primary device for sustaining visual interest down a 2,000px+ block.
- **Alignment convention:** standalone `Heading` blocks are **center-aligned** (`textAlign--center responsiveTextAlign--center`); content-bearing blocks (`ZLayoutContent`, `mediaBlock`) are **left-aligned on desktop, recentered on mobile** via the `responsiveTextAlign--center` modifier. This center-on-mobile pattern is applied consistently across `mediaBlock`, `Heading`, `Ticker`, and `featureCards`.

### 6. Full-bleed dark/light banding

The site's most distinctive layout behavior is its **alternation of full-width dark and light bands**, used to chapter the page and to spotlight the product (dark = "premium/intelligent checkout," light = "open/trusted commerce"). Because every block is edge-to-edge, switching `background-color` on a block produces an immediate full-bleed band with no seams.

The recurring band palette (from `colorsBg` tallies and per-block `bg`):

| Band background | Hex / value | Mode | Role |
|---|---|---|---|
| `rgb(4, 9, 26)` | `#04091A` ("boltBlack") | Dark | Product/intelligence sections, hero on dark pages |
| `rgb(38, 42, 66)` | `#262A42` ("tintBlack") | Dark | Secondary dark, gradient midpoint |
| `rgb(248, 246, 254)` | `#F8F6FE` ("tintedWhite") | Light | Default light content surface |
| `rgb(228, 230, 247)` | `#E4E6F7` ("gray_800") | Light | Tinted-lilac alternate light band |
| `rgb(211, 215, 237)` | `#D3D7ED` ("gray_700") | Light | Cooler light band (e.g. `/payments` Integrations) |
| `rgb(0, 108, 255)` | `#006CFF` | Accent | Rare full-band accent (`AwardWinningCallout` on `/our-story`) |
| `rgba(4, 9, 26, 0.65)` | dark scrim | Overlay | The hidden `modal__video` overlay shared by Ticker/CheckoutDemo |

Banding is realized two ways: (a) **per-block** via `backgroundColor--boltBlack / --tintBlack / --tintedWhite / --gray_700 / --gray_800` modifier classes (product pages); and (b) **per-zone gradients** on the homepage. The transitions are *hard color steps*, not blends — except the homepage zones, which use the two gradients above to ease dark→light across a long scroll. A representative product-page rhythm (`/checkout`, top → bottom): light Hero → dark `Heading` (`#04091A`) → dark `ZLayoutContent` → dark `Divider` → transparent `ImageBanner` → light `postSlider` (`#F8F7FF`) → transparent `Ticker` → light `TwoColumnChecklistSection` (`#F8F6FE`) → transparent `featureCards`. The dark cluster (3–5) is deliberately contiguous (joined with `marginTop--none`) so it reads as one "intelligent checkout" chapter before the page returns to light social-proof content.

To butt two bands of the same color together without a visible gap, blocks set the touching edges to `--none` (e.g. consecutive `mediaBlock`s on `/pricing` all carry `marginBottom--none marginTop--none`), and to separate two same-color bands they reintroduce `padding` *inside* the colored block (so the gap is still tinted) rather than a transparent margin. This is the core mechanic that keeps dark sections feeling like solid panels rather than floating cards.

### 7. Assessment

**Strengths.** The block-plus-token model is disciplined: two content widths (1280/1064), a four-step spacing scale (0/50/75/150), and a fixed background palette mean the site stays coherent across dozens of pages built by content editors, not engineers. Full-bleed banding is a genuinely effective wayfinding device and gives the brand its premium, "operating-system" feel.

**Weaknesses.**
1. **`--custom` overuse defeats the scale.** It is the single most frequent token and is used both as `0` (suppressing defaults) and as one-off values (158px, 12px, 70px). The result is that two pages built from the same components do not share a rhythm — vertical pacing is re-authored per page rather than enforced. A true `xxl`/`md` token plus disallowing arbitrary `custom` would recover consistency.
2. **No margin-collapse handling.** Because each block owns both `marginTop` and `marginBottom`, adjacent gaps stack (50+50=100), forcing editors to zero one side manually. A "gap owned by the parent stack" (e.g. flexbox `gap` on `main`) would eliminate the `--none`/`--custom: 0` bookkeeping entirely.
3. **Scale not aligned to type or an 8-pt grid.** 25-px multiples (50/75/150) sit oddly against 70/70.4px line-heights and 20.8px (1.3rem) mobile gutters; nothing snaps to a shared baseline, so cross-component vertical alignment is approximate.
4. **"grid" that is actually flex.** `featureCards__grid` is `display:flex`, so there is no real column tracking — fine for equal cards, but it means the site can't express a true asymmetric grid without bespoke blocks (`ZLayoutContent`, `ThreeColumnSection`) each reinventing layout.

Pages that best exemplify the system: **`/checkout`** (the fullest block vocabulary and the canonical dark-cluster banding), **`/enterprise`** (Z-layout + featureCards + OffBleedImageBanner + sustained light banding), **`/pricing`** (the `--none` same-color band-joining technique across stacked `mediaBlock`s), and **`/`** (the dynamic-zone gradient approach to dark→light transition).


---

## Component & UI Pattern Inventory

Bolt's marketing site is assembled from a tightly governed component library. Every page is a vertical stack of named "dynamic-zone" blocks (visible in the DOM as `home__topDynamicZone`, `forShoppers__dynamicZone--top`, `IncludedCards`, `featureCards`, `ZLayoutContent`, `postSlider`, `Ticker`, `FooterCallout`, etc.), and a fixed chrome of utility bar + header + footer wraps all of them. The result is that the same dozen-or-so components recur verbatim on 40+ pages — only their content and light/dark skin change. This chapter specs each reusable component against the live extracted tokens.

### Global token foundation (shared by every component)

These values are constant across the entire site and are inherited by every component below; they are not repeated in each spec.

| Token | Value | Notes |
|---|---|---|
| Display/heading font | `agrandir-bolt` (700, occasionally 600 weight) | Used for all H1–H4 headings and the wordmark. Negative tracking everywhere. |
| Variable display font | `agrandir-variable` | Used where weight is animated/interpolated (e.g. contact-sales H4 `font-weight: 469`). |
| Body font | `Inter` (500 weight default) | All paragraph/body copy, footer links, form labels. |
| Brand blue | `rgb(0, 108, 255)` `#006CFF` | Primary accent, link color, "NEW" badges, hero word highlights. |
| Ink / near-black | `rgb(4, 9, 26)` `#04091A` | Primary dark surface + dark text. |
| Tinted white | `rgb(248, 246, 254)` `#F8F6FE` | Default light surface + light-on-dark text. |
| Lavender mist | `rgb(228, 230, 247)` / `rgb(211, 215, 237)` | Section tints, blockquote/testimonial backgrounds. |
| Slate body text | `rgb(69, 74, 102)` `#454A66` | Body copy on light surfaces. |
| Muted gray | `rgb(142, 146, 175)` `#8E92AF` | Eyebrows, captions, footer secondary. |
| Accent purple | `rgb(154, 78, 255)` / `rgb(182, 136, 255)` | Hero gradients, illustration accents. |
| Success green | `rgb(0, 196, 46)` | Checkout-demo confirmation states. |
| Standard hover transition | `all 0.2s ease` (most-used, 70–136 occurrences/page) | The site's default micro-interaction tempo. |
| Signature reveal easing | `cubic-bezier(0.23, 1, 0.32, 1)` (easeOutQuint) at `0.35s` | Used on `translate` + `opacity` scroll reveals (~60–63 + ~61 occurrences/page). The single most identity-defining motion curve. |
| Icon fill transition | `fill 0.2s cubic-bezier(0.23, 1, 0.32, 1)` (×21/page) | Consistent SVG icon recolor on hover. |

H1 sizing is responsive-by-template, not fluid: `88px/88px` on shopper- and demo-class pages, `70px/70px` on most product/marketing pages, `60px/60px` on get-started. Letter-spacing scales with size (`-1.76px` at 88px, `-1.4px` at 70px, `-1.2px` at 60px). H2 is the dominant section title at `64px/70.4px, -1.28px` (sometimes downshifted to `32px/35.2px` inside demo/checkout templates). Body is locked at `20px/24px, -0.4px, Inter 500`.

---

### 1. Utility tab bar — "For Users / For Businesses"

The topmost element on every page: a slim dark switcher splitting the audience.

| Property | Spec |
|---|---|
| Position | Full-width strip above the main header, on `rgb(4, 9, 26)` ink ground. |
| Height | ~36 px. |
| Left cluster | Two tabs: **For Users** and **For Businesses**. The active tab gets a slightly lighter raised "chip" background (lifted ~`rgb(38,42,66)` panel) with white text; inactive tab is muted gray text. |
| Right cluster | A small EQ/waveform glyph + **"Soundtrack"** label (a brand-voice flourish, links to a playlist). |
| Type | Inter, ~13–14px, weight 500–600. |
| Interaction | `color 0.2s ease` on tab labels; tab swap navigates between the business marketing site and the consumer (`/shopper`, `/pay`) experience. |
| Exemplar pages | All pages (visible top-left in `state-megamenu.jpeg` and `home-desktop.jpeg`). |

This bar is the site's audience IA made literal — a rare pattern for a B2B fintech, and a deliberate one given Bolt straddles merchant SaaS and consumer wallet products.

---

### 2. Header navigation + mega-menu

The primary masthead. Skins to the page theme: white logo + light nav links on dark heroes (home, network, shopper), inverting to ink on light pages (pricing, checkout-demo).

**Header bar**

| Property | Spec |
|---|---|
| Logo | "BOLT" wordmark in `agrandir-bolt`, heavy, set in a chunky pixel/blocked style; white on dark, ink on light. |
| Primary nav items | **Product Suite · Use Cases · Developers · Pricing · News** (left of center). Inter, ~16px, weight 500. Active/hover → brand-blue or full-opacity white via `color 0.2s ease`. |
| Right cluster | **Merchant login** (ghost text link) · **Contact Sales** (ghost text link) · **Get started** (primary pill button). |
| Disclosure cue | Items with a panel (Product Suite, Use Cases, Developers) expose a mega-menu on hover/click; arrow glyph rotates via `fill 0.2s cubic-bezier(0.23,1,0.32,1)`. |

**Mega-menu panel** (see `state-megamenu.jpeg`)

| Property | Spec |
|---|---|
| Surface | White card, `rgb(255,255,255)`, generous radius (~16–20px), soft elevation shadow, ~320px wide for a single-column menu (Product Suite). |
| Header | Eyebrow title **"The Bolt Platform"** in ink, with a short brand-blue underline rule beneath it (`#006CFF`, ~2px, ~24px wide). |
| Items | Vertical list: Bolt ID, Check-In, Checkout, Checkout 2.0, Checkout OS, Checkout Everywhere, Connect, Fully Managed Fraud, Subscriptions, Stablecoins, User Network. Inter ~16px ink, row hover recolors to brand blue. |
| **"NEW" badge** | Inline pill beside Bolt ID, Checkout 2.0, Connect, Stablecoins. Solid `#006CFF` fill, white uppercase micro-label (~10px, letter-spaced), pill radius. A reusable atom that also appears in the mobile footer nav ("Careers NEW"). |
| Entry animation | Panel reveals via `transform, opacity 0.3s, 0.2s ease, cubic-bezier(0.23,1,0.32,1)` and the shared `translate/opacity 0.35s` easeOutQuint reveal; the wider Developers/Use Cases panels add `slideInFromLeft/Right 0.2s ease-out`. |
| Mobile | Collapses to a full-screen overlay (right column of `home-desktop.jpeg` shows the expanded mobile/secondary panel: stacked links Product Suite → with chevrons, then a secondary slide-in column for Developers sub-items). |

---

### 3. Buttons (primary / secondary / ghost)

The button system is exceptionally consistent — the single most reliably reproduced atom across every profile. The defining trait is the **fully-rounded `border-radius: 1280px`** (an absurd value that guarantees a perfect pill at any height).

| Variant | Background | Text color | Radius | Padding | Weight | Size | Shadow | Exemplars |
|---|---|---|---|---|---|---|---|---|
| **Primary (light-on-dark pages)** | `rgb(248,246,254)` tinted-white | `rgb(4,9,26)` ink | `1280px` | `13px 22px` | 600 | 16px | none | home, enterprise, network heroes |
| **Primary (dark-on-light pages)** | `rgb(4,9,26)` ink | `rgb(248,246,254)` | `1280px` | `13px 22px` | 600 | 16px | none | pricing, checkout, blog, news, contact-sales, get-started |
| **Primary (demo accent)** | `rgb(0,108,255)` brand blue | white | `1280px` | `13px 22px` | 600 | 16px | none | "Explore Checkout 2.0", "Get started now", "Launch demo" CTAs |
| **Secondary** | Transparent w/ 1px border in current ink/white | matches border | `1280px` | ~`13px 22px` | 600 | 16px | none | paired beside primary in heroes ("Explore Checkout 2.0" next to "Get started now") |
| **Ghost / text link** | none | inherits nav color, brand blue on hover | n/a | inline | 500–600 | 16px | none | "Merchant login", "Contact Sales", "Learn more about the Bolt Network", "View more" |

Notes:
- **No shadow, ever** — `shadow: "none"` is recorded on every page's primaryButton. Depth comes from color contrast and the pill shape, never elevation.
- **Hover** uses the global `all 0.2s ease`; the compound recipe `background-color, border-color, color, fill, transform 0.2s … ease-in-out` (×5–7/page) means the button can simultaneously shift fill, recolor an inline icon, and nudge `transform` (a subtle scale/translate) on hover.
- Inline "Learn more →" links pair text with an SVG arrow whose fill transitions on hover via the `fill 0.2s cubic-bezier(0.23,1,0.32,1)` recipe — the arrow is a recurring affordance on every feature/illustrated card.

---

### 4. Feature cards ("Supercharge your business")

The flagship 2-up card row on the homepage (`home__bottomDynamicZone`, also `featureCards` on enterprise/checkout).

| Property | Spec |
|---|---|
| Layout | 2 cards side-by-side on desktop, stacking on mobile. |
| Surface | White `rgb(255,255,255)` card on a dark/tinted section ground, large radius (~20–24px). |
| Content order | Top illustration → H-level title (`agrandir-bolt`, ~`46px` on home / `32px` reduced) → body (Inter 20/24) → inline "Learn more about X →" ghost link with animated arrow. |
| Examples (home) | "Connect to over 80 million shoppers" (Bolt Network illustration) and "Let shoppers buy where they browse" (Checkout Everywhere). |
| Hover | Whole-card `all 0.2s ease`; arrow link recolors and nudges. |
| Reveal | Scroll-in via `translate 0.35s` + `opacity 0.35s` easeOutQuint (staggered per card). |

---

### 5. Illustrated cards / Z-layout content (`ZLayoutContent`)

The workhorse content block: alternating image-left / image-right rows used to narrate product capabilities (network, checkout, get-started, enterprise — sections 2,000–2,600px tall).

| Property | Spec |
|---|---|
| Structure | Full-width row, 2 columns: a large branded illustration/screenshot on one side, a copy column (H2 64/70.4 + Inter 20/24 body + optional CTA) on the other. Successive rows flip the column order (the "Z" rhythm). |
| Theme | Carries a `darkTheme` modifier on dark sections (e.g. checkout/get-started on `rgb(4,9,26)`); light on lavender `rgb(228,230,247)`. |
| Motion | Each side enters with `slideInFromLeft/Right 0.2s ease-out` keyframes plus the shared easeOutQuint translate/opacity reveal. |
| Related block | `ThreeColumnSection` (contentAlign-left/center) — a 3-up icon+heading+blurb grid used for "Fully Managed / One-click ease / 100% self Service" and "Fair pricing, no matter your size." |

---

### 6. Stat / ticker blocks

Two distinct numeric-emphasis components:

**A. Inline stat block (homepage cart-abandonment card).** A white rounded panel pairing a headline ("77% of carts are abandoned. Bolt brings them back.") + body with an oversized data point — **`$1.972T` "In revenue lost"** — set in `agrandir-bolt` at H-scale with a superscript `$`. Includes a "Launch demo" ghost button and a small brand-blue lightning glyph top-right. (See `home-desktop.jpeg`.)

**B. `Ticker` component** (pricing, checkout). A horizontally-scrolling marquee of pricing/stat tokens ("Game-changing fixed rate…", "A revenue problem too big to ignore."). Pairs with a hidden video modal (`modal modal__video Ticker__content--modal hidden`) so a stat can launch a lightbox.

**C. `FeatureCards2` stat cards** (network, get-started). Big-number cards — **"50%"**, **"15%"**, **"50%"** — H3 rendered at the full `64px/70.4px` heading scale with a small caption beneath ("higher conversion," "What the numbers say*"). Background lavender `rgb(228,230,247)` or tinted-white.

---

### 7. Testimonial slider (`postSlider`)

The quote carousel (homepage "REVOLVE" testimonial; "Trusted by enterprise retailers"; "Who's in the Network").

| Property | Spec |
|---|---|
| Layout | Left: a portrait/brand image tile with the brand logo overlaid (e.g. REVOLVE over a model photo). Right: a large blue double-quote glyph (`#006CFF`), the quote in `agrandir-bolt`, then attribution ("Jon Tam, VP of Operations at REVOLVE") in muted gray. |
| Controls | Two circular **prev/next** buttons bottom-right: ~40px diameter, 1px ring, arrow glyph centered, hover recolors via `fill 0.2s cubic-bezier(0.23,1,0.32,1)`. A dot/progress indicator sits left of them. |
| Variants | `postSlider noSlide` modifier disables auto-advance for the "Who's in the Network" / "See Bolt Checkout in the wild" logo-tile versions. |
| Motion | Slide transitions ride `translate 0.35s`/`opacity 0.35s` easeOutQuint; manual advance uses `all 0.25s ease`. |

---

### 8. News / post cards ("Bolt in the News")

A 3-up press-card row on the homepage, reused on `/news` and `/blog` as dense grids.

| Property | Spec |
|---|---|
| Card | Rounded white card, image/thumbnail on top (publication art), then a small **source label** (Forbes / PYMNTS / TechCrunch), a bold headline (`agrandir-bolt`), and a date caption ("Dec 1, 2025") in muted gray `rgb(138,143,153)`. |
| Grid | 3 columns on home; on `/blog` the `blog__contentWrapper` extends to a tall (12,126px) multi-row grid with a filter/category control ("Industry", "View All"). |
| CTA | A centered pill **"View more"** (brand-blue primary) below the row. |
| News page | `/news` "Bolt Newsroom" stacks cards in a single tall column (`press__body`, 10,958px) with a "Contact the PR team" / "Download the Bolt Media Kit" footer band. |
| Hover | `all 0.25s ease` (blog grid records ×41) on card lift; thumbnail and headline recolor. |

---

### 9. Checkout-demo simulator widget (`CheckoutDemo` / `checkout-demo`)

Bolt's signature interactive set-piece — a faux phone/browser running a live one-click checkout. It appears embedded on product pages (`CheckoutDemo component-version` on checkout, enterprise) and full-screen on `/checkout-demo`.

| Property | Spec |
|---|---|
| Embedded form | A phone mock containing a real-looking checkout form: shipping/email field, address, "United States" select, and a black **"CONTINUE"** bar button (visible in `home-desktop.jpeg`, "Bolt Checkout" section). |
| Launch | A **"Launch demo" / "Launch Demo"** CTA opens one of several full-screen modals — `modal__guestCheckoutDemo`, `modal__oneClickCheckoutDemo`, `modal__guest-payment`, `modal__guest-payment oneClick` — each a 900px-tall overlay on a `rgba(0,0,0,0.84)` scrim. |
| Bespoke animation system | This widget owns a dedicated keyframe set absent elsewhere: `scrollDown`, `scrollUp`, `fadeIn`, `screenFade`/`screenFades`, `showFetch`, `showAuthFetch`, `showMessage`, `pressButtonRipple`, and `spinner 1.5s ease` (the loading spinner). |
| Scripted choreography | Heavy use of `all 0.35s ease` (×152 on checkout-demo — the highest count anywhere), plus `transform 0.5s ease`, `opacity, transform 0.25s/0.35s, 0.5s ease`, and `box-shadow, background-color 0.35s ease` to script the simulated tap → auth fetch → success sequence. `pressButtonRipple` produces a Material-style tap ripple; success uses green `rgb(0,196,46)`. |
| Type inside | Compresses to `14px/18.2px` body and `18px` H4 to fit the device frame — the only place body type drops below 20px. |
| Exemplars | `/checkout-demo` ("See Bolt in action", H1 88px brand-blue), `/checkout`, `/enterprise` ("See it in action"), `/get-started`. |

---

### 10. Logo marquee (`LogoScroller` / `home__logoScroller` / `FeaturedIn-Brands`)

The infinite client-logo ribbon.

| Property | Spec |
|---|---|
| Animation | `logoScroller 30s linear` infinite — a constant-speed horizontal translate (1 instance/page where present). |
| Content | Grayscale partner wordmarks: KENDRA SCOTT, Love.com, FRETTE 1860, LAFAYETTE 148, REVOLVE, LUISAVIAROMA, LUCKY BRAND, BADGLEY MISCHKA, FWRD (home). Press logos VOGUE, REUTERS, CNBC, THE WALL STREET JOURNAL appear in the `FeaturedIn-Brands` near-footer band. |
| Surface | Sits on tinted-white `rgb(248,246,254)`; logos rendered in muted ink for uniformity. |
| Section height | ~200px band; usually the first or last content section. |
| Exemplars | home (top + "Bolt in the News" press band), get-started, contact-sales, blog. |

---

### 11. Forms (HubSpot-embedded)

Lead-gen forms on `/contact-sales`, `/get-started`, `/contact-us`, gated content (`HeroGatedContent`), and the footer email capture.

| Property | Spec |
|---|---|
| Pattern | `grid … HeroGatedContent` — a split hero with marketing copy + quote on one side and the embedded HubSpot form on the other. `/contact-sales` adds a `QuoteCallout` social-proof block beneath. |
| Fields | Rounded-rectangle inputs (NOT the pill radius — inputs use a smaller corner), 1px border, Inter labels. Validation error text in **`rgb(255,79,80)`** coral (recorded ×32 on contact-sales — the form's error/required-field color). |
| Submit | Pill primary button matching the page theme (ink on light). |
| Header | H2 64/70.4 "Grow your revenue with a smarter checkout"; H4 uses the variable font `agrandir-variable` at an interpolated weight (`469`), evidence the form heading weight is animated. |
| Behavior | HubSpot iframe/script injection; the marketing shell styles wrap the vendor form so it inherits Inter + brand colors. |

---

### 12. Modals & video lightbox

| Property | Spec |
|---|---|
| Scrim | `rgba(0,0,0,0.84)` (demo modals) or `rgba(4,9,26,0.65)` ink-tint (video modals) — both ~900px tall overlay layers, shipped in the DOM pre-hidden (`hidden` class, toggled to visible). |
| Video modal | `modal modal__video Ticker__content--modal` — launched from Ticker stat blocks (pricing, checkout) to play a Wistia clip (every page records exactly 1 `wistia` embed). |
| Transition | Open/close via `background-color, opacity, top, transform, visibility 0.3s … ease` (the compound recipe ×3/page) and `opacity 0.2s ease-out`. |
| Demo modals | Four checkout-flow variants enumerated in §9; reuse the bespoke `fadeIn`/`screenFade` keyframes. |

---

### 13. Footer with email capture (`FooterCallout` + global footer)

Two stacked components close every page.

**A. `FooterCallout`** — a pre-footer CTA band. Centered H2 ("See how Bolt can power your business" / "Your brand. Your checkout. Powered by Bolt.") + body + a primary pill CTA, often over a faint lightning background image (`callout-rebrand…`, `FooterCallout lightning` modifier). Background tinted-white or ink depending on page.

**B. Global footer.**

| Property | Spec |
|---|---|
| Surface | Dark `rgb(4,9,26)` ink ground, white/muted text. |
| Social row | Small rounded-square icon chips (X, LinkedIn) top-left on a raised `rgb(38,42,66)` tile. |
| **Email capture** | Inline row: "Get updates on Bolt:" label + an **Email Address** input (subtle rounded field, dark fill) + a circular/arrow submit button to its right. Inter labels, muted placeholder. |
| Link columns | Four columns — **Company** (Our story, News and press, Careers `NEW` badge, Security), **Resources** (Case studies, Ebooks and reports, Blog, FAQ, Shopper trust toolkit, Media kit, Referral program, Shop the Bolt Network), **Support** (Contact us, Documentation, Getting started, Operational status), **Custom Solutions** (Bolt for Enterprise, Custom payments). Inter ~14–16px, muted gray, hover → white via `color 0.2s ease`. |
| Giant wordmark | An oversized **"BOLT"** lockup spanning the full viewport width as the footer baseline — pure brand signature, clipped at the bottom edge. |
| Legal strip | Bottom micro-row: "© 2024 Bolt Financial, Inc." + Legal · Privacy Policy · Privacy Center · Terms in muted gray (~12px). |
| Exemplars | Every page (fully visible at the base of `home-desktop.jpeg`). |

---

### Cross-component observations

- **One radius vocabulary, two scales.** Interactive pills are universally `1280px` (buttons, badges, nav CTA); containers (cards, panels, inputs) use a moderate ~16–24px radius. There is no in-between — the contrast between perfectly-round actions and soft-cornered surfaces is a deliberate signature.
- **Depth without shadow.** Buttons carry `shadow: none`; cards rely on color-contrast against tinted sections and only the lightest elevation. The site reads "flat-with-intent."
- **One motion grammar.** Reveal = `cubic-bezier(0.23,1,0.32,1)` easeOutQuint at 0.35s on translate+opacity (60+ uses/page); hover = `all 0.2s ease`; entrance accents = `slideInFromLeft/Right 0.2s ease-out`. The checkout-demo widget is the only component allowed a richer, slower (0.5s) bespoke timeline.
- **Theming is a single class flip.** `html` carries `light`/`dark`/`medium` plus `backgroundColor--*` modifiers; the same component (e.g. `ZLayoutContent`, `FooterCallout`, primary button) inverts its palette purely from that root class — which is why the primary button's bg/text swap between ink and tinted-white across pages while padding, radius, weight, and size stay byte-identical.
- **`agrandir-bolt` + Inter, no exceptions.** Headings/wordmark are always Agrandir; all running text and UI chrome is always Inter 500/600. The lone deviation is `agrandir-variable` for weight-animated form headings.

Source data: `bolt-audit/bolt-audit/profiles-home.json`, `profiles-checkout-demo.json`, `profiles-checkout.json`, `profiles-pricing.json`, `profiles-enterprise.json`, `profiles-network.json`, `profiles-get-started.json`, `profiles-contact-sales.json`, `profiles-news.json`, `profiles-blog.json`, `profiles-shopper.json` (in `crawl-summary.json`), and screenshots `bolt-audit/state-megamenu.jpeg` + `bolt-audit/home-desktop.jpeg`.


---

## Motion & Animation System

Bolt's motion system is unusually disciplined for a marketing site of its scale. Across all 45 audited pages, the entire vocabulary reduces to **one signature easing curve, two canonical durations, a fixed set of nine reusable `@keyframes`, and a small library of scoped product-demo animations**. There is no animation library bloat, no spring physics, and no scroll-jacking. Motion is deployed almost entirely in service of two jobs: (1) revealing content as it enters the viewport, and (2) acknowledging pointer interaction. Everything else — the looping logo marquee, the live checkout demo, the typewriter hero — is a contained, named exception. This chapter documents that vocabulary exhaustively.

### 1. The two-token foundation

Every transition on the site collapses into one of two timing families. This is the single most important fact about Bolt's motion design and it holds on literally every page measured.

| Token | Value | Role | Typical properties | Observed frequency |
|---|---|---|---|---|
| **Reveal curve** | `cubic-bezier(0.23, 1, 0.32, 1)` over **0.35s** | Scroll-entrance reveals; "expressive" content motion | `translate`, `opacity`, `color`, `fill` | ~185 elements/page carry this easing; `translate 0.35s` ×63 and `opacity 0.35s` ×61 on the home page alone |
| **Interaction curve** | `ease` over **0.2s** | Hover/focus micro-interactions; "functional" UI feedback | `color`, `fill`, `background-color`, `transform`, `all` | `all 0.2s ease` is the single most common transition on nearly every page (×64–×136); ~184 elements/page |

`cubic-bezier(0.23, 1, 0.32, 1)` is the well-known **easeOutQuint** curve: an aggressive front-loaded deceleration that travels ~78% of its distance in the first third of its duration, then glides to rest. Paired with 0.35s it produces the "fast-in, soft-landing" feel that characterizes the entire site — content snaps toward its resting position and settles without bounce or overshoot. Bolt uses the *same* curve at 0.3s (×4 per page, e.g. `translate 0.3s cubic-bezier(0.23, 1, 0.32, 1)`) and 0.35s for a secondary `color` reveal (×27 per page), so the curve is the constant and duration is the only variable. There is no use of `cubic-bezier` anywhere for hover states — hover is exclusively linear-ish `ease`.

This two-token split — **easeOutQuint/0.35s for "things appearing," ease/0.2s for "things responding to me"** — is enforced with remarkable consistency. The ratio is deliberate: reveals are slow enough to be perceived as a deliberate entrance (350ms), interactions fast enough to feel instantaneous (200ms, comfortably under the ~250ms perceptual threshold where a control starts to feel laggy).

### 2. Scroll reveals (IntersectionObserver entrance system)

The dominant motion pattern site-wide is the **scroll-triggered reveal**. As a section scrolls into the viewport, its children transition from an offset/transparent rest state to in-place/opaque. The mechanics are entirely CSS-transition-driven (not keyframe animations): an IntersectionObserver toggles a class, and the element transitions via the reveal token.

The signature appears in computed styles as the recurring pair, present identically on essentially every content page:

```
translate 0.35s cubic-bezier(0.23, 1, 0.32, 1)   ×63
opacity   0.35s cubic-bezier(0.23, 1, 0.32, 1)   ×61
```

The near-equal counts (63 vs 61) confirm these are co-applied — each revealed element transitions *both* its position (`translate`) and `opacity` together, the classic "fade-and-rise." Note Bolt uses the modern independent `translate` property (not `transform: translate(...)`), which is why `translate` and `transform` show up as distinct transition properties in the data. A secondary reveal variant transitions `color` on the same curve (`color 0.35s cubic-bezier(0.23, 1, 0.32, 1)` ×27), used for text that changes hue as it enters (e.g. headline accent words shifting from muted to `rgb(0, 0, 238)` Bolt-blue).

**Pages that exemplify it:** every content/marketing page. The pattern is densest on long scrollers like the home page (`scrollHeight` 7907px), `/enterprise`, `/checkout`, `/ecommerce`, and `/pricing`. Pure-text legal pages (`/privacy`, `/terms-of-use`, `/end-user-terms`) carry a *reduced* set (reveal easing drops to ×27/×25 instead of ×63/×61) — confirming the reveal count scales with the number of distinct content blocks rather than being globally injected.

### 3. The hero: `staggerTextUp` + Lottie

The home hero `<h1>` "**Building trust with every tap**" (class `Hero__headingText h1`, set in `agrandir-bolt` 70px/700, `-1.4px` tracking, white on the dark `linear-gradient(359deg, rgb(4,9,26), rgb(38,42,66), rgb(4,9,26))` top zone) is wrapped in a `Hero` container carrying the modifier class **`scrolling-anim--staggerTextUp`**. This is Bolt's bespoke hero entrance: heading lines (and supporting CTAs/image via `hasCTAs withImage`) animate up and into place in a staggered sequence on load, using the reveal token's fade-and-rise rather than a keyframe — consistent with the rest of the system rather than a one-off.

Critically, the hero's animated graphic is a **Lottie** rendered inside an element classed **`ScrollingTextAnimation__lottieWrapper`** — i.e., the Lottie is embedded *within* a scrolling-text animation component, not standalone. Lottie usage on the entire site is essentially limited to this single home-page instance (`media.lottie: 1` on `/` and `0` on all 44 other pages). Bolt does **not** lean on Lottie as a general motion tool; it is reserved for the single highest-impact above-the-fold moment. Everything else is CSS.

### 4. The named `@keyframes` library

Beyond transition-driven reveals, Bolt maintains a small, reusable keyframe library injected into the global stylesheet. The exact rule bodies (extracted live) are below. These are the **entrance variants** — used by components that prefer a one-shot `animation` over a class-toggle transition.

| `@keyframes` | Exact definition (from live CSS) | Typical runtime | Effect |
|---|---|---|---|
| `slideInFromLeft` | `0% { opacity:0; transform:translateX(-50px) } 100% { opacity:1; transform:translateX(0) }` | `0.2s ease-out` | Enter from 50px left, fade in |
| `slideInFromRight` | `0% { opacity:0; transform:translateX(50px) } 100% { opacity:1; transform:translateX(0) }` | `0.2s ease-out` | Mirror of above |
| `zoomInFromLeft` | `0% { opacity:0; transform:translateX(-25vw) scale(0.2) } 100% { opacity:1; transform:translateX(0) scale(1) }` | `0.6s ease-out` | Sweep in from far left, scaling 0.2→1 |
| `zoomInFromRight` | `0% { opacity:0; transform:translateX(25vw) scale(0.2) } 100% { … scale(1) }` | `0.6s ease-out` | Mirror; sweep from far right |
| `zoomInFromBottom` | `0% { opacity:0; transform:translateY(20px) scale(0.2) } 100% { … translateY(0) scale(1) }` | `0.6s ease-out` | Pop up + scale from below |
| `animTextTop` | `0% { left:-30% } 2% { left:27% } 100% { left:85% }` | (paired w/ scrolling text) | Marquee-style label that snaps in at 2% then drifts right |
| `animTextBottom` | `0% { left:150% } 2% { left:87% } 100% { left:5% }` | (paired) | Counter-direction drift, snap then glide left |
| `swipe` | `0% { translate:-275px } 100% { translate:275px }` | **`2.7s linear`** | 550px horizontal shimmer/skeleton sweep |
| `logoScroller` | `0% { left:0 } 100% { left:-2040.4px }` | **`30s linear` (infinite)** | Continuous trust-logo marquee |

A few observations that matter:

- **The `slideIn*`/`zoomIn*` family is loaded almost everywhere but rarely active.** The six entrance keyframes are *defined* on ~40 pages, but the per-page `animations` tally shows most pages run only `swipe`. They fire in bursts on specific components: `/careers` (`slideInFromRight ×9`, `slideInFromLeft ×5` — the job-listing cards), `/check-in` (×6/×4), `/intelligentcheckout` (`slideInFromLeft ×10`, `slideInFromRight ×8`, **plus** the only `zoomInFromLeft/Right 0.6s ease-out ×1 each** on the whole site), and the `/pay` family. So the zoom variants are essentially a single feature's signature.
- **`swipe 2.7s linear` is the universal skeleton/shimmer.** It appears `×12` on nearly every page (×10 on text-only legal pages, ×2 where content is sparse). It is the only animation present on minimalist pages like `/blog`, `/news`, `/resources`, `/shop`, and the legal set — i.e., it is the loading-shimmer that runs under lazy-loaded media tiles. At `linear` over 2.7s it is deliberately slow and non-distracting.
- **`logoScroller 30s linear`** powers the `home__logoScroller` trust strip (the top section, 200px tall, on the home page) and reappears on conversion pages (`/checkout-everywhere`, `/contact-sales`, `/get-started`, `/pay`). A 30-second linear loop over a 2040.4px track is slow enough to read as ambient rather than attention-grabbing.
- **`animTextTop`/`animTextBottom`** are home-exclusive and tied to the `ScrollingTextAnimation` component (the same component that hosts the hero Lottie). The `2%` keyframe is a "snap-then-drift" trick: the label flies to a near-final position in the first 2% of the timeline, then slowly traverses the rest — giving a fast arrival followed by a lazy parallax glide.

### 5. The checkout-demo motion sequence (scoped product theatre)

The interactive checkout demonstration — present on `/checkout-demo`, `/checkout`, and `/enterprise` — carries a **distinct, scoped keyframe set** that does *not* leak onto other pages. This is the most choreographed motion on the site: a self-playing simulation of a Bolt one-click checkout. Its keyframes (captured from the profiler on those three pages):

| `@keyframes` | Role in the demo sequence |
|---|---|
| `scrollDown` / `scrollUp` | Auto-pans the mock storefront viewport to bring the checkout panel into frame |
| `pressButtonRipple` | Material-style ripple emitted from the simulated "Pay" button press |
| `showMessage` | Reveals chat/confirmation message bubbles in sequence |
| `showFetch` / `showAuthFetch` | Animates the "fetching… / authenticating…" network/identity steps (the Bolt Network identity lookup) |
| `spinner` | Loading spinner — measured at **`spinner 1.5s ease`** (×2, two concurrent spinners) |
| `fadeIn`, `screenFade`, `screenFades` | Cross-fades between demo "screens" (cart → login → pay → success) |

The demo also drives a denser transition profile unique to these pages: `all 0.35s ease` jumps to **×122–×152** (vs the typical ×3–×5 elsewhere), plus compound transitions like `box-shadow, background-color 0.35s ease` (×19), `transform 0.5s ease` (×19–21), and `opacity, transform 0.25s, 0.5s ease` (×13–19). The 0.5s `transform` is the longest *interaction* duration on the site and is reserved for the demo's screen-to-screen slides. This is the one place Bolt allows itself a richer, longer, multi-property motion budget — justified because the animation *is* the product story.

`/intelligentcheckout` adds its own scoped pair, `slideInFromLeftCol` / `slideInFromRightCol` (column-wise entrance variants) and a `Typewriter-cursor 1s ease` blink for a typewriter headline effect — the only typewriter animation on the site, and the only `1s` UI animation.

### 6. Hover & focus micro-interactions

All pointer feedback is governed by the **0.2s `ease` interaction token**. The vocabulary is intentionally narrow — Bolt animates *color, fill, background, and small transforms*, never layout. Concrete patterns observed:

| Interaction | Computed transition | Where |
|---|---|---|
| Text link / nav hover | `color 0.2s ease` (×58 typical) | Global nav, footer, body links |
| Icon / SVG hover | `fill 0.2s cubic-bezier(0.23, 1, 0.32, 1)` (×21, every page) | Iconography — note this is the one *hover* that borrows the reveal curve, for a slightly softer fill swap |
| Button hover (multi-prop) | `background-color, border-color, color, fill, transform 0.2s … ease-in-out` (×3–7) | Primary/secondary buttons — `transform` uses `ease-in-out` while colors use `ease` |
| Card / tile hover | `all 0.2s ease` or `transform 0.2s ease` (×4) | Content cards (`/home`, `/ecommerce`, `/subscriptions`) |
| Input focus | `outline-color 0.2s ease-in-out` (×16–138) | Forms — heaviest on `/checkout-os` (×138) and `/payments` (×38), the form-dense pages |
| Subtle scale | `scale 0.2s ease-in-out` (×2–4) | `/pay`, `/shopper`, `/pay-rewards` interactive chips |
| Accordion/FAQ expand | `all 0.25s ease` (×41 on `/blog`), `background-color, opacity, top, transform, visibility 0.3s ease` (×3) | `/faq`, `/blog` disclosure rows |

The **primary button** itself (`Get started`: `rgb(248,246,254)` fill, `rgb(4,9,26)` text, fully pill `1280px` radius, `13px 22px` padding, 16px/600) ships with **`box-shadow: none`** and relies entirely on the 0.2s color/transform transition for its hover state — no elevation change, no glow. This is consistent with the site's flat, restrained surface treatment. The `pressButtonRipple` keyframe is *not* applied to marketing buttons; it lives only inside the checkout demo's simulated button.

### 7. Motion principles (synthesis)

Reading the system as a whole, five governing principles emerge — all evidenced by the data above:

1. **One curve, one personality.** `cubic-bezier(0.23, 1, 0.32, 1)` (easeOutQuint) is the brand's motion signature. It is applied to ~185 elements per page and to *every* content reveal. The "fast arrival, soft settle" character it produces is the closest thing Bolt has to a motion logo.
2. **Two durations, cleanly separated by intent.** 0.35s = "this is appearing for you"; 0.2s = "this is reacting to you." A handful of justified exceptions (0.5s demo slides, 0.6s zoom entrances, 1.5s spinner, 2.7s shimmer, 30s logo loop) are each tied to a specific, named purpose.
3. **Transitions over keyframes.** The default reveal mechanism is a class-toggle CSS *transition*, not an `@keyframes animation`. Keyframes are reserved for things that must *loop* (`swipe`, `logoScroller`), *self-play* (the checkout demo), or *sweep dramatically* (`zoomIn*`). This keeps the motion declarative and cheap.
4. **Severe restraint, scaling with content.** Decorative/JS-heavy animation libraries are absent. Lottie is used exactly once (hero). Legal and editorial pages strip motion down to just the shimmer. The richest motion (`/checkout-demo`, `/enterprise`, `/intelligentcheckout`) is exactly where motion *is* the value proposition — animation budget tracks narrative importance, not page count.
5. **Position + opacity, never layout.** Reveals and hovers animate `translate`/`transform`/`opacity`/`color`/`fill` — GPU-friendly, non-reflowing properties. The only `width`/`top`/`left` animations are the marquee (`logoScroller`, `animText*`) and a single `width 0.3s` accordion on `/security`, all bounded and intentional.

The net effect is a motion language that feels expensive and considered precisely *because* it is so constrained: a viewer never sees two different easing personalities competing, never waits on a slow transition, and never encounters gratuitous movement. Motion at Bolt is a quiet, consistent confirmation of the brand's core pitch — "shockingly simple."

---

Source ground-truth files (absolute paths):
- Per-page computed motion tokens: `C:\Users\user\Desktop\analyticsfollowingfrontend\analyticsfollowingfrontend\bolt-audit\bolt-audit\profiles-*.json` (45 files; key exemplars: `profiles-home.json`, `profiles-checkout-demo.json`, `profiles-checkout.json`, `profiles-enterprise.json`, `profiles-intelligentcheckout.json`, `profiles-careers.json`)
- Profiler that extracted keyframes/animations/transitions: `C:\Users\user\Desktop\analyticsfollowingfrontend\analyticsfollowingfrontend\bolt-audit\crawl2.mjs`
- Live-extracted exact `@keyframes` rule bodies (`swipe`, `slideInFrom*`, `zoomInFrom*`, `animText*`, `logoScroller`) and Hero `scrolling-anim--staggerTextUp` / `ScrollingTextAnimation__lottieWrapper` classes captured via Playwright against `https://www.bolt.com/` during this session.


---

## Imagery, Illustration & Iconography

Bolt's visual system is built from four clearly separated asset families — **branded lifestyle photography**, **flat colorful vector illustrations**, **product-UI mockups (phone/checkout frames)**, and a **thin-line SVG icon set** — bound together by a single brand purple (`#5100f3` / `oklch(0.45 0.224 264)`) and delivered almost entirely through one Cloudinary account (`res.cloudinary.com/dugcmkito`). The result reads as a modern fintech "people + product" aesthetic: warm human imagery tinted toward brand purple, abstract energy via gradient blobs, literal proof via UI screenshots, and a high-density utility layer of hairline icons. Each family is examined below with exact assets, sizes, formats, and the pages that exemplify them.

### 1. System Overview & Asset Census

A single homepage (`bolt.com/`) renders **46–49 `<img>` elements and ~89 inline `<svg>` nodes**. Imagery is split between two delivery origins, and that split is itself a meaningful design/architecture decision:

| Origin | Used for | Format(s) | Examples |
|---|---|---|---|
| `res.cloudinary.com/dugcmkito/image/upload/…` | Photography, illustrations, partner logos, decorative dividers, OG/preview thumbnails, Lottie JSON | `.webp` (photos), `.svg` (logos/illustrations/dividers), `.png` (legacy 2023 assets), `.json` (animation) | `man_holding_device_being_recognized_at_online_shop_*.webp`, `Revolve_*.svg`, `Millions_of_shoppers_*.svg` |
| `www.bolt.com/assets/images/…` | First-party component chrome: hero backgrounds, press logos, quote marks, micro CTA glyphs | `.svg`, `.gif` (1×1 spacer) | `pages/home/home-hero-background.svg`, `components/FeaturedIn/vogue.svg`, `components/QuoteCallout/quote-marks.svg`, `components/FeatureCards/cta-icon-default.svg` |

The clean rule is: **content/marketing assets live in Cloudinary; structural/UI-chrome assets are bundled from the app's own `/assets/images/` tree.** This separation lets marketing teams swap partner logos and hero photos (note the `v1762…`–`v1765…` cache-busting version stamps and `_4x` retina suffixes) without redeploying the frontend.

### 2. Photography Style — Lifestyle People-With-Phones, Brand-Tinted

#### 2.1 Subject & art direction
The flagship photographic style is **single-subject lifestyle portraiture of a young, stylish shopper interacting with a phone**, shot against a brand-purple environment. The canonical homepage hero is `man_holding_device_being_recognized_at_online_shop_2a973ee94c.webp`. Its `alt` text is unusually descriptive and reveals the exact art-direction brief:

> "Man smiling while holding a smartphone, **wearing purple and black outfit**, sitting cross-legged with a Bolt checkout screen floating beside him that says 'Welcome back, Skyler!'"

Several deliberate choices are encoded here:
- **Wardrobe is color-matched to the brand** (purple/black), so the subject reads as part of the brand palette rather than a stock photo dropped onto it — a duotone-by-styling rather than duotone-by-filter approach.
- **The phone is always present and always recognized** ("Welcome back, Skyler!"), making the photo do double duty as product demonstration (one-click recognition) and lifestyle aspiration.
- **Relaxed, seated, smiling body language** signals "shockingly simple / frictionless," matching the page title (*Bolt | Shockingly Simple Checkout & Finance*).

#### 2.2 Technical specs
| Property | Value |
|---|---|
| Intrinsic resolution | 1934 × 1739 px (near-square, ~1.11:1) |
| Display size (desktop) | 640 × 575 px → served at ~3× density, no downscale transform |
| Format | WebP (`content-type: image/webp`) |
| Loading | `loading="eager"` (above-the-fold hero) |
| Container | No background tint, no `border-radius`, no overlay — the purple comes from *within* the frame, not a CSS blend |

Other photographic assets follow the same recipe but vary the crop and add brand-logo lockups:
- `enterprise_bolt_desktop_5767558285.webp` (2881 × 1539, a wide 1.87:1 "enterprise" lifestyle band) with a mobile-specific variant `mobile_enterprise_bolt_*.webp` (375 × 312) — i.e. **art-directed responsive imagery**, not a single CSS-scaled file.
- The **QuoteCallout testimonial cards** pair a tall portrait background (e.g. `revolve_quote_callout_min_*.webp` 800 × 1041, `tylers_*.webp` 801 × 1041, `badgley_quote_bg_*.webp` 800 × 1040 — all locked to a **~0.77:1 / 400 × 520 display ratio**) with a knocked-out **white partner logo** overlaid on top (`revolve_logo_white_350_*.webp`, `tylers_white_*.webp`, `badgley_700_logo_white_*.webp`). This is a consistent, templated photo+logo+quote composite component.

#### 2.3 The "duotone" reading
The brand-tinted duotone effect is achieved **in-camera / in-retouch**, not via runtime CSS `mix-blend-mode` or SVG `<feColorMatrix>`. Inspection of the hero's parent element shows `background-color: rgba(0,0,0,0)` and `background-image: none` — there is no CSS color overlay. The purple wash is baked into the WebP. This is higher-fidelity than a live duotone filter (preserves skin-tone nuance) but means **every tint variation requires a new asset export**, which is why the Cloudinary library carries many near-duplicate brand-purple photos.

### 3. Colorful Abstract Vector Illustrations — Flat Blobs of People & Devices

A second, distinct register is the **flat-vector, blue/purple/pink "blob" illustration** used for feature storytelling rather than photographic realism.

- **`Millions_of_shoppers_0ba8229d86.svg`** (340 × 421, displayed 1:1) — the archetypal asset: a clustered, organic-blob composition of stylized shopper/device figures. Delivered as a flat SVG so it stays razor-sharp at any density and recolors cleanly to the brand ramp.
- **`checkout_anywhere_header_8c7310a286.svg`** (182 × 280) — a vertical illustration header for the "checkout anywhere" feature card.
- **`1_972t_f3247bc020.svg`** (511 × 136, displayed 303 × 138) — a wide decorative illustration band.

Characteristics of this family:
- **Format is SVG, not WebP** — confirming these are true vector illustrations (infinite-scaling, small payload) rather than rendered art. This is the correct medium choice for flat geometric/blob work.
- **Palette is the brand ramp**: variations on `#5100f3` purple extended toward blues and pinks, used as solid fills and soft gradients — distinct from the photography (which uses purple as environment) and from the icons (monochrome line). They supply the page's chromatic "energy" in the gaps between purple photos and white UI screenshots.
- **Decorative dividers as illustration**: `Desktop_Gray_200_Divider_4x_*.svg` (5760 × 400) and its `Mobile_…` counterpart are full-bleed section separators exported at 4× ("Gray 200" names them after the design-token grey step), reinforcing that even rules/dividers are managed as named, versioned design-system SVG assets rather than CSS borders.

### 4. Product UI Mockups — Phone & Checkout Frames

The third register is **literal product proof**: high-resolution screenshots of the Bolt checkout experience presented either in-device or as floating UI panels.

| Asset | Intrinsic px | Role |
|---|---|---|
| `checkout_20_29d37c32c6.webp` | 2072 × 557 (3.7:1) | Wide desktop checkout-flow strip, displayed 1155 × 311, `eager` |
| In-hero floating panel | (baked into the hero WebP) | The "Welcome back, Skyler!" recognition card composited beside the subject |
| Inline phone-frame `<svg>` `viewBox="0 0 1180 2556"` | 288 × 623 displayed | A **vector phone mockup** (1180 × 2556 ≈ modern phone aspect, ~0.46:1), 49 paths, fills include `#ffffff`, `#000000`, `#00ff37`, `#f6f5f4`, `rgb(56,67,89)`, `rgb(218,217,215)` |

The phone frame is notable for being a **hand-built inline SVG** (`viewBox 0 0 1180 2556`, 49 paths) rather than a PNG bezel — it carries its own status-bar/notch geometry and an accent `#00ff37` "success" green, letting the screen content be layered or animated inside it. The wide `checkout_*.webp` strips are raster screenshots (WebP), appropriate because real UI contains type and gradients that don't vectorize well. Together they give Bolt the standard fintech "show the actual product" credibility layer, in the same brand-purple-and-white chrome as the photography.

### 5. Iconography — Thin-Line SVG, ~1.333 px Stroke, 150+ per Page

The icon system is the highest-volume image family and the most systematized.

#### 5.1 Style fingerprint
Measured across the homepage's ~89 inline SVGs:

| Metric | Finding |
|---|---|
| Dominant stroke width | **1.333 px** (87 instances) — the defining hairline value |
| Secondary stroke width | **1.5 px** (6 instances, used for slightly larger glyphs like the small `0 0 12 10` chevron) |
| Stroke color | **`currentColor`** (87 uses) — icons inherit text color, enabling dark-on-light / white-on-purple reuse without recoloring assets |
| Fill | `none` on line icons; a small set of **filled** glyphs (27 small filled SVGs) for brand marks and emphasis |
| Geometry | `stroke: none` fills like `#11190C` (near-black ink), `#4b4f5e` (muted slate), `#D3D7ED` (lilac-grey) for state variants |
| Typical render size | 11–18 px (micro CTA glyphs at 11 × 8 / 15 × 13) up to 17–18 px nav/utility icons |

The **1.333 px stroke** is the signature: it is the px equivalent of a 16-px icon drawn on a 24-unit grid with a ~2-unit stroke (24/16 × … ), and its consistency (87/95 stroke icons share it) indicates icons are exported from one source set (likely a single Figma/illustration library or an icon font converted to SVG) rather than hand-collected. The reliance on `currentColor` + `none` fills is best-practice: a single glyph file recolors automatically across the purple hero, white sections, and grey footers.

#### 5.2 Density and consistency
The homepage alone carries ~89 inline icon/glyph SVGs; across feature-dense pages (e.g. `/checkout`, also ~89 inline SVGs) the per-page total comfortably exceeds **150 icons** when navigation, feature lists, footer, trust badges, and repeated CTA chevrons are counted. The repeated micro-asset `components/FeatureCards/cta-icon-default.svg` (11 × 10 px) is the "→" affordance on every feature card — a deliberately tiny, single-purpose glyph reused dozens of times. The smallest functional chevron renders at **11 × 8 px with a 1.333 stroke**, which is at the very edge of legibility and a minor accessibility/aliasing concern at standard density.

#### 5.3 Logo glyph
The Bolt wordmark itself is an inline SVG (`navLogoDesktop`, `viewBox 0 0 104 30`, single path, fill `rgb(248,246,254)` = near-white `#F8F6FE` on the dark nav). There is also a hidden `navLogo hide` variant in `#F8F6FE` — i.e. **light/dark logo variants are shipped as separate path fills toggled by class**, not by CSS filter.

### 6. Partner & Press Logo Treatments

Two clearly differentiated logo systems coexist:

**Partner / merchant logos (the "trusted by" carousel)** — all from Cloudinary, all **SVG**, all normalized to a **214 × ~103–104 px master** and displayed at a uniform **266 × 100 px** slot:

| Logo asset | Notes |
|---|---|
| `Revolve_*.svg`, `luisaviaroma_*.svg`, `lucky_brand_logo_spinner_*.svg`, `badgley_mischka_*.svg`, `FWRD_logo_*.svg`, `kendra_skott_*.svg`, `love_logo_spinner_*.svg`, `frette_logo_214_*.svg`, `lafayette148_*.svg`, `naturepedic_logo_spinner_*.svg` | The `_spinner` / `_214` filename suffixes reveal a **fixed 214-px-wide canvas spec** these are normalized into; the carousel duplicates the set (Revolve, LVR, Lucky, Badgley, FWRD appear twice) to create a seamless marquee loop |

These are presented monochrome/as-supplied within an equal-width slot so disparate brand marks read as one tidy row — the standard social-proof "logo wall" pattern, executed with strict size normalization (every logo gets the identical 266 × 100 box regardless of intrinsic aspect).

**Press logos (the "Featured in" row)** — first-party, bundled under `www.bolt.com/assets/images/components/FeaturedIn/`, each **SVG sized to its own natural aspect** rather than a fixed box:

| Logo | Size (px) |
|---|---|
| `vogue.svg` | 93 × 24 |
| `reuters.svg` | 154 × 50 |
| `cnbc.svg` | 65 × 51 |
| `wsj.svg` | 176 × 16 (extreme 11:1 wordmark) |

The contrast is instructive: **merchant logos are width-normalized into uniform slots** (visual democracy across many similar partners), whereas **press logos keep native proportions** (so Vogue, Reuters, CNBC and WSJ remain instantly recognizable). Both sets are vector SVG for crispness at any density, and both render monochrome to subordinate them to the brand purple.

### 7. The Cloudinary Asset Pipeline

Effectively the entire image library is served from one Cloudinary cloud, `res.cloudinary.com/dugcmkito`, and the way it is used is itself a design-engineering choice with trade-offs worth flagging.

**URL anatomy** (e.g. `…/image/upload/v1762960279/man_holding_device_being_recognized_at_online_shop_2a973ee94c.webp`):
- `image/upload/` — standard delivery type; a separate `raw/upload/` path serves the Lottie animation JSON (`revolve_finalfinalwebp_*.json`), so motion graphics ride the same CDN.
- `v1762960279` — version stamp used for cache-busting; stamps cluster by content batch (`v1742…` early-2025 partner logos, `v1762…`–`v1765…` late-2025 hero/checkout/divider refresh).
- Human-readable slug + 10-hex content hash (`…_2a973ee94c`) — Cloudinary's auto-generated public-ID suffix.

**Key observations:**
1. **No transformation parameters are used.** None of the delivery URLs contain `f_auto`, `q_auto`, `w_`, `dpr_`, or `c_fill` segments. The response header confirms `Cache-Control: public, no-transform, immutable, max-age=2592000` — i.e. assets are **pre-exported at fixed dimensions and uploaded as final files**, with Cloudinary acting as a versioned CDN rather than a transformation engine.
2. **This forgoes Cloudinary's core strength.** Because there's no `f_auto`/`q_auto`, the site cannot auto-negotiate AVIF for capable browsers (everything is shipped WebP/PNG), and oversized masters are sent to the client — the hero is a **1934 × 1739 px** file displayed at **640 × 575** (≈3× the pixels a non-retina viewport needs), and `checkout_20_*.webp` ships **2072 px** wide for a 1155-px slot. Adding `f_auto,q_auto,w_…,dpr_auto` would cut payload substantially with no perceptible quality loss.
3. **Responsive art-direction is handled manually** via separate desktop/mobile files (`enterprise_bolt_desktop` vs `mobile_enterprise_bolt`) rather than Cloudinary responsive breakpoints or `srcset` — note every `<img>` inspected had an **empty `srcset`**. This means the browser cannot pick an optimal size; the chosen file is fixed in markup.
4. **Mixed legacy formats persist.** Older assets (`v1679…`, March 2023) remain as `.png` and even an animated `.gif` (`img_2_*.gif`) alongside the modern WebP set — a small consistency debt in an otherwise WebP-forward library.

**Net assessment of the pipeline:** the *organization* is excellent — clear origin split (Cloudinary content vs bundled chrome), descriptive slugs, retina (`_4x`) and color-variant (`_white`) naming conventions, versioned cache-busting — but the *delivery optimization* is left on the table. The single highest-leverage improvement in this chapter's domain would be appending `f_auto,q_auto,dpr_auto,w_<slot>` to Cloudinary URLs and adding `srcset`, which would meaningfully reduce the hero/checkout payloads without touching the strong art direction.

### 8. Summary Matrix — Imagery Families at a Glance

| Family | Medium | Source | Color logic | Exemplar asset(s) | Page |
|---|---|---|---|---|---|
| Lifestyle photography | WebP raster | Cloudinary | Brand purple baked in (wardrobe + set), not CSS filter | `man_holding_device_…webp`, `enterprise_bolt_desktop_…webp` | Home, Enterprise band |
| Testimonial photo+logo composites | WebP + white-knockout logo | Cloudinary | Purple/neutral portrait + white partner mark | `revolve_quote_callout_…`, `tylers_…`, `badgley_quote_bg_…` | Home QuoteCallout |
| Abstract vector illustrations | SVG vector | Cloudinary | Brand ramp blue/purple/pink blobs | `Millions_of_shoppers_…svg`, `checkout_anywhere_header_…svg` | Home feature cards |
| Product UI mockups | WebP strips + inline SVG phone frame | Cloudinary + inline | Brand white/purple UI, `#00ff37` success accent | `checkout_20_…webp`, phone `viewBox 0 0 1180 2556` | Home, /checkout |
| Line icons | Inline SVG, 1.333 px stroke, `currentColor` | First-party set | Inherits text color (ink `#11190C`, slate `#4b4f5e`, lilac `#D3D7ED`) | `cta-icon-default.svg` (11×10), nav/feature glyphs | All pages, 150+/page |
| Partner logos | SVG, normalized 214→266×100 | Cloudinary | Monochrome, equal-slot | `Revolve_…svg`, `FWRD_logo_…svg` (10-brand marquee) | Home logo wall |
| Press logos | SVG, native aspect | First-party `/FeaturedIn/` | Monochrome, recognizable | `vogue.svg`, `wsj.svg`, `cnbc.svg`, `reuters.svg` | Home "Featured in" |
| Decorative chrome | SVG (`_4x`), 1×1 GIF spacer | First-party + Cloudinary | Token-named grey (`Gray_200`) | `Desktop_Gray_200_Divider_4x_…svg`, `quote-marks.svg`, `blank.gif` | All pages |

**Overall:** Bolt's visual language is coherent and brand-disciplined — purple-tinted human warmth, flat vector energy, literal product proof, and a dense, hairline (1.333 px, `currentColor`) icon utility layer, all funneled through a well-named single-Cloudinary library. Its principal weaknesses are technical rather than aesthetic: oversized, untransformed image delivery (no `f_auto`/`q_auto`/`srcset`), residual legacy PNG/GIF assets, and sub-12 px icons at the edge of legibility.


---

## Content Design, Voice & Information Architecture

This chapter audits bolt.com as a *writing system* — the voice that animates the copy, the repeatable headline/subhead and CTA patterns that make 46 pages feel like one product, the statistical persuasion machinery, and the navigation/sitemap architecture that organizes it all. Findings are grounded in the captured page profiles (46 URLs crawled at 1440×900, plus the expanded mega-menu state) and the live type/color tokens. Where a pattern is exemplified by a specific page, that page is named.

### 1. Voice & Tone

Bolt's voice is **punchy, benefit-led, and aggressively confident**, with a recurring rhetorical signature: the *two-beat declarative* — a short claim, a hard stop, then a second short claim that intensifies or twists the first.

| Voice trait | How it shows up | Verbatim exemplars (page) |
|---|---|---|
| Two-beat staccato | Period-separated micro-sentences used as a single headline; fragments deployed as full thoughts | "The checkout that converts. Instantly." (/checkout); "Smarter by design. Faster by default." (/checkout); "Faster payments. Fewer rebuilds. More revenue." (/saas); "Fast where it counts. Flexible where it matters." (/startups) |
| Absolute confidence | Superlatives and "world's most / biggest / smartest" claims stated as fact, not aspiration | "The world's most intelligent checkout" (/intelligentcheckout); "The biggest checkout network you'll never have to build" (/network); "The smartest way to turn browsers into buyers" (/intelligentcheckout) |
| Subtractive promise | Value framed by what the customer *avoids* — no forms, no rebuilds, no fees, no lock-in | "Everything you need. Nothing you don't." (/checkout); "No hoops. No catches." (meta, /pay/rewards); "No lock-in commitments, ever." (/pricing); "Password hint: Forget it" (/shopper) |
| Playful electricity puns | Brand-name wordplay around speed/lightning/zap, kept light | "Shockingly Simple Checkout" (title, /checkout-demo); "Plug in and poof, you're ready to launch" (meta, /checkout-os); "Zap questions before they start" (/shopper-trust-toolkit); "Shop faster than you can say 'one click'" (meta, /shopper) |
| Lifetime-value refrain | A single emotional payoff line repeated as a closing motif site-wide | "Checkout that lasts a second. Loyalty that lasts a lifetime." (closing H2 on /resources, /blog, /install, /media-kit); "Turn casual browsers into lifetime customers" (/checkout, /app-devs); "Turn first-time browsers into lifetime buyers" (/ecommerce) |
| Insider/irreverent winks | Typographic in-jokes that reward attention | "No p@ssword\$ required" (/enterprise); "Finance and crypto apps, assemble!" (/pay); "One SuperApp to rule them all" (/pay) |

**Audience-modulated register.** The same brand runs two distinct registers selected by the `For Users` / `For Businesses` toggle in the top utility bar. The **merchant/B2B** voice is ROI- and infrastructure-forward ("Enterprise-grade flexibility with instant impact," /enterprise; "A new standard for marketplace payments," /connect). The **shopper/B2C** voice (`dark` theme pages: /shopper, /security, /pay) is warmer, second-person, and lifestyle-led: "Checkout made for real life," "Browse. Click. Buy.," "Safe by default" (/shopper). The split is also encoded structurally — shopper pages collapse the CTA vocabulary to just "Download" and "Explore the Bolt Network," dropping the entire B2B CTA stack (see §4).

**Tone risks.** The confidence occasionally outruns proof: "You could spend 10 years perfecting your checkout. Or you could use Bolt." (/checkout) and "The world's most intelligent checkout" (/intelligentcheckout) are unfalsifiable superlatives that lean on assertion rather than the (otherwise plentiful) statistics. The lifetime-value refrain is *over*-deployed — appearing as the identical closing H2 on at least four utility/resource pages — which reads as templated rather than crafted on lower-traffic pages.

### 2. Headline & Subhead Architecture

Headlines are short by design. Across the 46 captured H1s the **median is 5 words, mean 5.1, range 2–11** — tight enough that every hero headline fits one or two lines at the 70–88px display size before wrapping.

**Hero type system (live tokens).** Every hero H1 is set in the brand display face `agrandir-bolt`, weight 700, with negative tracking that scales with size:

| Context | Size / line-height | Tracking | Color | Example page |
|---|---|---|---|---|
| Standard hero H1 | 70px / 70px (1.0 lh) | −1.4px (−0.02em) | `rgb(255,255,255)` on dark / `rgb(0,108,255)` brand-blue on light | / (home), /checkout, /pay/rewards |
| Oversized B2C hero H1 | 88px / 88px | −1.76px | `rgb(255,255,255)` | /shopper |
| Section H2 | 64px / 70.4px (1.1 lh) | −1.28px | `rgb(248,246,254)` / `rgb(4,9,26)` | site-wide |
| Sub-section H3 | 22–46px / 1.1 lh | −0.66 to −0.92px | ink / off-white | home H3 is 46px; content H3 is 22–32px |
| Body / subhead | 20px / 24px (1.2 lh), weight 500 | −0.4px | `rgb(211,215,237)` on dark / `rgb(4,9,26)` ink | `Inter`, all pages |

The hierarchy is deliberately *gapped*: the jump from a 64–88px display headline to a 20px Inter body subhead is a ~3–4× ratio, which makes the headline shout and the supporting line recede. Body copy never competes — it is one consistent 20px/500/Inter token everywhere.

**Recurring headline formulas.** Bolt reuses a small set of constructions, giving the catalog of pages a familial rhythm:

| Formula | Structure | Examples |
|---|---|---|
| "The [thing] that [verb]s. [Adverb]." | Definitional claim + intensifier fragment | "The checkout that converts. Instantly." (/checkout); "The checkout that learns from every click" (home H3) |
| "The [superlative] [category]" | Authority claim | "The world's most intelligent checkout" (/intelligentcheckout); "The identity layer for commerce" (/bolt-id); "The future of checkout is check-in" (/check-in) |
| Triadic benefit list | Three period-separated benefit nouns | "Faster payments. Fewer rebuilds. More revenue." (/saas); "Smarter by design. Faster by default." (/checkout) |
| "Turn [X] into [Y]" transformation | Before→after promise | "Turn first-time browsers into lifetime buyers" (/ecommerce); "Turn casual browsers into lifetime customers" (/checkout); "Turn discovery into revenue. Instantly." (/checkout-everywhere); "Turn any message into a checkout" (/checkout-everywhere) |
| "[Benefit] without [pain]" | Subtractive | "Checkout everywhere, without compromise" (/checkout-everywhere); "Power up subscriptions without paying a premium" (/subscriptions); "High-Risk? No problem." (/high-risk) |
| Possessive ladder (closing CTA) | "Your X. Your Y. Powered by Bolt." | "Your brand. Your checkout. Powered by Bolt." (home); "Your checkout, supercharged for stablecoins" (/stablecoins) |

**Hero subhead pattern.** Subheads follow the headline with a single 20px Inter sentence that does one of two jobs: (a) name the product mechanism, or (b) quantify the payoff. The home hero pairs H1 "Building trust with every tap" with a subhead that opens "Meet the next…" (next-generation framing, captured in the mega-menu state). Where the headline is emotional, the subhead is concrete — e.g. /checkout's confident H1 is backed by the meta-level promise "Backed by 10+ years of innovation, Bolt blends UX, conversion tools, and an 80M+ shopper network to boost revenue."

**Section-heading cadence within a page.** Long product pages alternate *claim* H2s with *proof* H2s. /fraud is the clearest case: aspirational claim H2s ("Smarter protection, faster approvals," "You're 100% covered," "Multiple layers, zero guesswork") are interleaved with bare-number proof H2s ("99% average order approval rate," "97% of transactions decided in real time"). This claim→number→claim oscillation is the page-level engine of persuasion (see §3).

### 3. Stat-Driven Persuasion

Statistics are Bolt's primary credibility currency, and the copy treats numbers as *headlines in their own right* — promoted to H2/H3 at full 46–64px display size rather than buried in body copy.

**The persuasion stack (problem → network → outcome).** The argument is consistently staged in three statistical moves:

1. **Problem-scale (fear).** Anchor on the size of the loss. The headline figures are the **$1.972T lost** to abandonment (the "A revenue problem too big to ignore." section on /checkout) and **"77% of carts are abandoned. Bolt brings them back."** (home H2). These are framed as industry-wide, externalizing blame from the merchant.
2. **Network-scale (FOMO/asset).** Pivot to Bolt's owned asset — the **80M+ shopper network**, rendered as both a hard number and a benefit headline: "80 million reasons your checkout feels faster" (/checkout), "Power your brand with 80M+ shoppers" (/enterprise), "Reach 80M+ ready-to-buy users" (/app-devs), and the network recognition stat "17% of your guest shoppers are already recognized" (meta, /network).
3. **Outcome-scale (proof).** Close with conversion/approval deltas as the payoff: "50% higher conversion. 15% higher repeat purchases.*" (/network, also broken into individual `H3: 50%` / `H3: 15%` stat tiles), "over 74% lift in conversion" (/faq), "Boost ecommerce conversions by up to 20%" (meta, /ecommerce), "Revolve increases shopper revenue by 4%" (/case-studies), and the fraud trio "99% average order approval rate / 97% of transactions decided in real time / 100% covered" (/fraud).

| Stat | Verbatim framing | Where it leads | Role |
|---|---|---|---|
| **$1.972T** | "A revenue problem too big to ignore." | /checkout | Problem-scale anchor |
| **77%** | "77% of carts are abandoned. Bolt brings them back." | home (H2) | Problem-scale anchor |
| **80M+** | "80 million reasons your checkout feels faster" | /checkout, /enterprise, /app-devs, /activate | Network asset |
| **17%** | "17% of your guest shoppers are already recognized" | /network (meta) | Network recognition |
| **50% / 15%** | "50% higher conversion. 15% higher repeat purchases.*" | /network | Outcome |
| **74%** | "over 74% lift in conversion" | /faq | Outcome |
| **20%** | "Boost ecommerce conversions by up to 20%" | /ecommerce | Outcome |
| **99% / 97% / 100%** | approval / real-time / chargeback coverage | /fraud | Outcome (risk-removal) |
| **250+** | "Trusted by over 250 businesses and counting" | /fraud | Social proof |
| **$10,000** | "\$10,000 in Bolt Credits" | /activate | Incentive |

**Craft notes.** Numbers are humanized — "80 million *reasons*" converts a raw count into a benefit; "Bolt brings them back" attaches an action to the 77%. The asterisk on "50% higher conversion.\*" signals a footnoted methodology, the one place the confident voice concedes nuance. The weakness: identical stat framings (the 80M+ figure) recur on at least five pages with little variation in supporting sentence, so the number begins to read as a slogan rather than evidence on repeat visits, and several big claims (74%, 20%) live only in `/faq` and meta descriptions rather than on the product pages that make the promise.

### 4. CTA Language & Conversion Vocabulary

CTAs are split into a **persistent global set** (rendered in chrome on nearly every page) and a **page-contextual set**. The global set is remarkably stable:

| CTA string | Pages (of 46) | Location / role |
|---|---|---|
| **Get started** | 43 | Primary nav button + closing-section button (the dominant conversion verb) |
| **Contact Sales** | 42 | Header utility action (enterprise path) |
| **Bolt for Startups** | 42 | Header/utility cross-sell link |
| **Ebooks and reports** | 41 | Footer resources link |
| **Contact us** | 41 | Footer link |
| **Getting started** | 41 | Footer link (note: gerund, distinct from the button "Get started") |
| Get started now / Get started today / Get Started | 4 / 3 / 3 | Hero variants — case- and word-inconsistent |
| Launch demo / Launch Demo | 3 / 2 | Product demo (case inconsistency again) |
| See pricing / See the difference / See it in action / See Bolt in action | 3 / 2 / 2 / 2 | Soft, low-commitment "see" verbs |
| Developer quick-start | 2 | Technical audience (/subscriptions, /app-devs) |
| Download / Download SuperApp | 5 / 1 | B2C app conversion (/shopper, /pay, /security, /pay/rewards) |

**Primary button spec (live tokens, home).** The dominant "Get started" button is `background rgb(248,246,254)` (off-white), text `rgb(4,9,26)` (near-black ink), `border-radius 1280px` (full pill), `padding 13px 22px`, `font-size 16px / weight 600`, `box-shadow none`. The pill shape and shadowless flat fill are consistent with the restrained, high-contrast button language; the off-white-on-dark treatment makes it pop against the dark hero gradients (`linear-gradient(359deg, rgb(4,9,26) … rgb(38,42,66) …)`).

**A three-tier commitment ladder.** The CTA verbs map cleanly to funnel intent: **high commitment** = "Get started" / "Get started now" / "Apply here" (self-serve sign-up); **mid commitment** = "Contact Sales" / "Contact sales" (enterprise hand-raise); **low commitment** = "Launch demo" / "See it in action" / "See the difference" / "Learn more" (explore without obligation). Most product pages offer all three simultaneously (e.g. /checkout: "Get started," "Contact Sales," "Launch demo," "Explore Checkout 2.0"), letting visitors self-select by readiness. Audience pages prune the ladder — /shopper and /pay/rewards drop to a single "Download," and legal pages (/terms-of-use, /end-user-terms) carry only the inherited global trio.

**CTA inconsistencies (P2 issues).**
- **Case/word drift:** "Get started" vs "Get Started" vs "Get started now" vs "Get started today," and "Launch demo" vs "Launch Demo," appear within the same site and sometimes the same page family. No canonical capitalization rule is enforced.
- **Label collision:** the footer "Getting started" (gerund) sits beside the button "Get started" — two near-identical labels for different destinations, a likely source of mild confusion.
- **Cross-sell leakage:** "Bolt for Startups" appears as a CTA on 42 pages including ones where it is off-topic (e.g. /security, /privacy-center), diluting the primary "Get started"/"Contact Sales" pairing.

### 5. Information Architecture & Sitemap

The crawl enumerates **~46 reachable pages**, organized under a five-item primary navigation plus two utility tiers. The full structure, reconstructed from the mega-menu capture and the crawl path list:

**Top utility bar (above the main nav).** `For Users` ↔ `For Businesses` audience toggle (left) and `Soundtrack` (right) — an unusual brand flourish. This toggle is the highest-level IA split, gating the entire experience by persona.

**Primary navigation (5 items):** `Product Suite` · `Use Cases` · `Developers` · `Pricing` · `News`, with utility actions `Merchant login` · `Contact Sales` · `Get started` pinned right.

**"Product Suite" mega-menu — "The Bolt Platform" (11 entries, alphabetical):**

| Menu label | Route | Badge |
|---|---|---|
| Bolt ID | /bolt-id | NEW |
| Check-In | /check-in | — |
| Checkout | /checkout | — |
| Checkout 2.0 | /intelligentcheckout | NEW |
| Checkout OS | /checkout-os | — |
| Checkout Everywhere | /checkout-everywhere | — |
| Connect | /connect | NEW |
| Fully Managed Fraud | /fraud | — |
| Subscriptions | /subscriptions | — |
| Stablecoins | /stablecoins | NEW |
| User Network | /network | — |

Notable: the **label↔route mismatch** "Checkout 2.0" → `/intelligentcheckout` (the URL says "intelligent checkout," the nav says "2.0," and the page title is "Checkout 2.0 | AI-Powered Commerce") is a content-design inconsistency that fragments the product's name across three surfaces. Four items carry a **NEW** badge — a recency signal concentrated on the identity/crypto/marketplace bets (Bolt ID, Checkout 2.0, Connect, Stablecoins).

**Functional IA grouping (inferred from routes + page intent):**

| Cluster | Pages | Navigation home |
|---|---|---|
| **Products / Platform** | /checkout, /intelligentcheckout, /checkout-os, /checkout-everywhere, /connect, /bolt-id, /check-in, /fraud, /subscriptions, /stablecoins, /network, /payments | Product Suite |
| **Use Cases / Verticals** | /ecommerce, /enterprise, /saas, /digital-goods, /high-risk, /startups, /app-devs | Use Cases |
| **Developers** | /install, /checkout-os, "Developer quick-start" CTAs | Developers |
| **Pricing** | /pricing | Pricing |
| **Company / Press** | /our-story, /careers, /news, /blog, /case-studies, /media-kit, /activate, /refer | News + footer |
| **Resources** | /resources, /faq, /shopper-trust-toolkit, /checkout-demo | footer |
| **Shopper (B2C)** | /shopper, /security, /pay, /pay/rewards, /shop, /check-in | "For Users" toggle |
| **Conversion / Utility** | /get-started, /contact-sales, /contact-us | utility nav |
| **Legal** | /privacy, /privacy-center, /terms-of-use, /end-user-terms | footer |

**Page-template taxonomy (from `htmlClass` + structure).** The DOM root class doubles as a content/template tag, revealing a CMS-driven page system: dark-theme conversion pages (`dark backgroundColor--boltBlack` on /connect, /bolt-id, /network; `dark backgroundColor--deepBlack`), light marketing pages (`light backgroundColor--tintedWhite` on /fraud, /high-risk), and special states (`enterprise darkTheme ignite light` on /checkout — a hybrid that explains its richer section count). Product pages share a "dynamic zone" section model (home uses `home__topDynamicZone` / `home__bottomDynamicZone`; /shopper uses `forShoppers__dynamicZone--top` / `--bottom`), confirming a modular, slot-based authoring system where marketers assemble pages from reusable content blocks.

**IA strengths.** (1) Persona-first split (`For Users`/`For Businesses`) is the right top-level cut for a two-sided commerce product. (2) The "Product Suite" mega-menu keeps 11 products one click from anywhere. (3) Every page funnels to a consistent closing CTA section ("See how Bolt can power your business" on /checkout-everywhere, /network, /subscriptions, /enterprise; "Build trust with every tap" on /bolt-id, /fraud — the latter echoing the home H1), giving the long-scroll pages a predictable terminal conversion moment.

**IA weaknesses (prioritized).**
- **P1 — Product naming fragmentation.** "Checkout 2.0" / "intelligentcheckout" / "AI-Powered Commerce" / "Checkout OS" / "CheckoutOS™" / "Bolt SSO Commerce™" / "Check-In" / "SSO Commerce" overlap conceptually with no clear naming hierarchy. A shopper reading /check-in ("Bring SSO Commerce to your site") cannot easily tell how it relates to /bolt-id or /network. The trademark usage is also inconsistent (CheckoutOS™ in /faq vs "Checkout OS" in nav).
- **P2 — Orphaned/edge pages.** /shopper, /pay, /pay/rewards, /shop, /activate, /refer, /shopper-trust-toolkit are not surfaced in the primary mega-menu and appear to be reachable mainly via campaigns, the footer, or the "For Users" toggle — a discoverability gap.
- **P2 — Empty/duplicated H1s.** Several index pages ship with an **empty H1** (/case-studies, /resources, /news, /contact-sales) while relying on an H2 to carry the page title — weak for SEO and screen-reader landmarking. /blog inverts the problem with an H1 of "Bolt | Company News" (the raw `<title>` leaking into the heading), and /pricing has **no meta description** at all.
- **P3 — Footer label collision.** "Getting started" (footer) vs "Get started" (button) as noted in §4.

### 6. Summary Scorecard

| Dimension | Rating | Rationale |
|---|---|---|
| Voice distinctiveness | **Strong** | A genuinely ownable two-beat declarative voice ("Smarter by design. Faster by default.") with consistent electricity-themed wit. |
| Headline craft | **Strong** | Tight (median 5 words), formula-driven, backed by a clean 64–88px `agrandir-bolt` display system with disciplined negative tracking. |
| Statistical persuasion | **Strong with caveats** | Effective problem→network→outcome stack ($1.972T → 80M+ → 50%/15%), but headline stats over-repeat and some live only in /faq and meta. |
| CTA system | **Adequate** | Clear 3-tier commitment ladder and a stable global set, undermined by case/word drift ("Get started" vs "Get Started") and label collisions. |
| Information architecture | **Adequate** | Smart persona-first split and 11-product mega-menu, but product naming is fragmented and several index pages have empty H1s / missing meta. |

**Top content-design recommendations:** (1) Establish a single canonical product-naming map and enforce it across nav label, URL, `<title>`, and H1 (fixes the Checkout 2.0/intelligentcheckout split). (2) Define a CTA capitalization and label standard ("Get started" only; rename footer "Getting started" → "Setup guide" or similar). (3) Give every index page a real, populated H1 and meta description (/case-studies, /resources, /news, /pricing). (4) Vary the supporting sentence around the 80M+ stat per page and surface the 20% / 74% conversion claims on the product pages, not just /faq. (5) Add the orphaned B2C and program pages (/shop, /pay, /activate, /refer) to a discoverable footer or "For Users" menu group.


---

## Responsive & Mobile Design

Bolt's marketing site is built on a **single fluid layout engine** — a Bootstrap-derived flexbox grid of `.row` / `.column` primitives — rather than per-breakpoint page templates. Reflow is therefore governed by two mechanisms applied consistently across every archetype: (1) `.row` containers flip `flex-direction: row → column` to stack their columns, and (2) a small set of fluid type/spacing tokens rescale via `clamp()`. There is no separate mobile site, no `m.` subdomain, and no AMP; the same DOM is restyled. This section documents exactly how that restyling plays out from a 1440px desktop down to a 390px handset.

### The breakpoint ladder

The stylesheets expose a dense, deliberate breakpoint system. Two boundaries do the structural heavy lifting; the rest are device-specific corrections.

| Breakpoint | Role | What changes |
|---|---|---|
| `min-width: 1440px` / `1600px` | Large-desktop ceiling | Content column caps; hero locks to its widest type scale |
| `max-width: 1439px` / `1280px` / `1180px` | Desktop fluid band | Container gutters tighten; type scales down from the 70px hero max |
| `max-width: 1024px` | **Primary nav-collapse breakpoint** | Inline desktop nav hides; hamburger appears; off-canvas drawer activates |
| `max-width: 768px` / `769px` / `767px` | **Primary layout-stack breakpoint** | `.row` flips to `column`; two-up sections become single column |
| `max-width: 640px` / `624px` | Phablet/large-phone | Hero text-align flips left → center; CTAs reflow |
| `max-width: 480px` / `475px` | Standard phone | Card padding compresses; carousel slides go full-bleed |
| `max-width: 375px` / `374px` / `320px` | Small-phone corrections | Type floor clamps; line-length and gutter fixes for iPhone SE-class widths |

A 390px device (iPhone 12–14 class) sits inside the `≤480px` and above the `≤375px` tiers, so it receives the full mobile treatment plus the small-phone type floor.

### Navigation collapse

The header carries **two complete navigation systems in the DOM simultaneously**, toggled by visibility at the 1024px breakpoint — a robust but heavy pattern.

| Property | Desktop (1440px) | Tablet/Mobile (≤1024px, incl. 390px) |
|---|---|---|
| Header `position` | `relative` | `fixed` (sticky to top, content scrolls under) |
| Header height | 126px | 108px (390px) / collapses further on scroll |
| Inline nav (`.header__primaryNavItem`, `__secondaryNavItem`, `__superNavItem`) | Visible — multi-row mega-nav (For Users / For Businesses super-nav + Product Suite / Use Cases / Developers fly-outs) | `display:none` |
| Hamburger (`.expanderButton.hamburgerButton`, `aria-label="show main menu"`) | `display:none` (0×0) | Visible, ~21×19px glyph |
| Drawer (`.responsiveNav`, `aria-label="main menu"`) | Present but parked off-screen, `z-index:-1` | Slides in from the right |

The mobile drawer is a **512px-wide fixed off-canvas panel** (not full-width — on a 375–390px viewport it would overhang, so it is the same fixed-width panel the tablet uses, sliding over the page). It is a **three-level slide stack**: tapping a `second-level` header (`Product Suite`, `Use Cases`, `Developers`) slides the panel left to reveal a `third-level` list, each with its own `close main menu` affordance. This is a progressive-disclosure accordion-by-sliding model rather than nested expand/collapse. Drawer rows are tall (≈74px `responsiveNav__itemsGroup--listItemLink`, ≈76px group headers), giving generous, comfortably-above-44px tap targets — the drawer is the one place where touch ergonomics are unambiguously good.

One caveat surfaced in inspection: the closed drawer reports `transition: all` with `transform: none` and lives at `z-index:-1`, and no `overflow:hidden` scroll-lock is applied to `<body>`/`<html>`. The slide is driven by the site's signature easing token (below); the lack of an explicit body scroll-lock is a latent mobile-UX risk worth flagging.

### Motion tokens (consistent across breakpoints)

The nav and reflow transitions share one easing family, applied at 0.2–0.35s:

- **Primary easing:** `cubic-bezier(0.23, 1, 0.32, 1)` (easeOutQuint — fast out, long settle) at `0.2s` (hover/state) and `0.3s`–`0.35s` (drawer slide / fly-out reveal).
- **Secondary:** `0.2s ease-out` for simple opacity/color.

This is a genuine design token: the same curve governs desktop mega-nav fly-outs and the mobile drawer slide, so motion feels identical regardless of viewport.

### Hero stacking & type scaling

The hero is the clearest illustration of the dual mechanism. The hero `.Hero__row` is a two-column flex (`copy | media`) that flips to `column` to stack, and the headline (`<h1>`, font `agrandir-bolt`, weight 700) scales fluidly.

| Property | 1440px | 768px | 390px |
|---|---|---|---|
| `.Hero__row` direction | `row` (copy left, media right) | `row` (still side-by-side) | `column` (media stacks above/below copy) |
| H1 font-size | 70px | 49.78px | 43.68px |
| H1 line-height | 70px (1.0) | 49.78px (1.0) | 43.68px (1.0) |
| H1 letter-spacing | −1.4px (−0.02em) | −0.996px (−0.02em) | `normal` (tracking released at small size) |
| H1 text-align | left | left | **center** |
| Hero copy column width | ~616px | ~half of 768 | ~333px (full content width) |

Two things to note. First, the H1 follows a clean **linear `clamp()` ramp** in which letter-spacing is pinned at −0.02em while the font scales (−1.4px@70 → −0.996px@49.78), then tracking is deliberately reset to `normal` at the phone tier so tight negative tracking doesn't crush the smaller glyphs. Second, **alignment is breakpoint-driven, not stack-driven**: the headline stays left-aligned at 768px (where it has flanking media) and only centers below the ~640px threshold, when the layout is fully single-column — a thoughtful detail that keeps the centered look reserved for true single-column reading.

Body copy moves the opposite direction: it is ~16px on desktop but **18.72px / 24.34px line-height (≈1.3)** at 390px — a deliberate up-scale for thumb-distance readability, the inverse of the headline's down-scale.

### Card grids and multi-column sections → single column

Every multi-column construct on the site is a `.row` of `.column` children, so they all collapse identically below 768px:

| Section archetype | Desktop layout | 390px reflow |
|---|---|---|
| `featureCards__row` | 2-up flex row | `flex-direction: column`, cards stack; each card ~356px wide |
| `TwoColumnChecklistSection` | 2 columns (~490px each) | stacks to single column |
| `ScrollingTextAnimation__row` | text + media side-by-side | `flex-direction: row-reverse` used to control source order so media lands below text when stacked |
| `caseStudyCard` set | 3-up inside a `postSlider__Slide` | becomes a **swipeable carousel** (`.postSlider`), one ~370px card per slide rather than a stack |
| `Footer__nav--row` | 4-up link columns | **stays 2-up** (does not fully stack) |

Two patterns stand out. First, Bolt uses **`row-reverse` as a mobile source-order tool** — a clean way to keep media-below-text on phones without duplicating markup. Second, repeated content groups that are *too wide to stack legibly* are converted to a **horizontal carousel** (`postSlider`) instead of an N-high vertical stack — the case-study cards become a swipe deck. The footer is the one container that resists full collapse, retaining a 2-column link grid at 390px (likely to avoid an excessively long footer scroll), which is a reasonable but slightly inconsistent exception to the otherwise universal stack-to-one rule.

### Touch targets

| Element | 390px size | Verdict |
|---|---|---|
| Hamburger glyph | ~21×19px icon | The icon art is small, but its tappable `.expanderButton` wrapper extends the hit area; the visible mark is below 44px |
| Drawer nav rows | ~74–76px tall | Excellent — well above the 44px floor |
| Hero CTAs ("Get started", "Contact Sales") | ~49px tall × 90–112px wide | **Above the 44px minimum but tight** on width; rendered as inline-flex links, sitting side-by-side in the hero rather than stacking full-width |
| In-text link variant of CTAs | ~22px tall | Below the touch floor where CTAs render as plain text links |

The CTAs deserve attention: at 390px they remain side-by-side (the inner CTA container keeps a `row` flex) rather than becoming full-width stacked buttons — the more common and more thumb-friendly mobile pattern. At 49px tall × ~90px wide they clear the height minimum but are narrow, and two adjacent ~90–112px targets risk mis-taps. Where the same actions render as inline text links (22px) they fall below the recommended target size entirely.

### Overflow and viewport integrity

At 390px the document reports `scrollWidth === clientWidth` (no horizontal overflow) — the layout is genuinely fluid with no bleeding fixed-width children, which is the single most important responsive correctness check and Bolt passes it. Notably, the document clamps content to ~375px even at a 390px viewport, indicating the content max-width and gutters are tuned to the iPhone-class small-phone tier and simply add side margin on slightly wider handsets rather than re-fluxing.

### Summary assessment

Bolt's responsive strategy is **structurally sound and impressively consistent**: one flex `row/column` grid, one fluid type ramp, one easing token, two governing breakpoints (1024px for nav, 768px for layout). The standout strengths are the clean linear `clamp()` headline scale with deliberate letter-spacing release, the use of `row-reverse` for mobile source ordering, carousel-over-stack for wide card sets, and the spacious three-level slide drawer. The weak spots are all in touch ergonomics and mobile-nav hardening: a sub-44px hamburger glyph, narrow side-by-side hero CTAs that should arguably go full-width, 22px text-link CTA variants, a 512px fixed drawer width (rather than full-bleed) on phones, and no explicit `<body>` scroll-lock when the drawer is open.

Relevant evidence pages: homepage (`https://www.bolt.com/`) for hero, `featureCards__row`, `ScrollingTextAnimation`, and footer reflow; `https://www.bolt.com/checkout` for the `TwoColumnChecklistSection` two-up and the `postSlider`/`caseStudyCard` carousel pattern.


---

## Accessibility, Performance & Technical Signals

This chapter audits bolt.com along the axes a publication-quality review must defend with measurements: color contrast of the brand's actual color pairings, motion and reduced-motion handling, semantic/document structure, the font-loading pipeline (Inter variable from Google Fonts + a self-hosted Agrandir family), the headless Next.js CMS-lander architecture, and the third-party stack (Cloudinary, Wistia, HubSpot, Sentry, GTM/GA4, ZoomInfo). All figures below were extracted live from the running site (build `Y6xhotdJiNlUyUhKDGkwt`) rather than inferred from screenshots.

### 1. Color contrast of the key pairings

Bolt's palette is effectively four tokens: **ink `#04091A`** (`rgb(4,9,26)` — the near-black hero/section background), **off-white `#F8F6FE`** (`rgb(248,246,254)` — primary light surface and inverted text), **brand blue `#006CFF`** (`rgb(0,108,255)` — the primary CTA fill and accent), and pure **white `#FFFFFF`** for cards. The light-on-dark and dark-on-light text relationships are excellent; the failures cluster entirely around the brand blue, which is a saturated mid-tone that simply does not have enough luminance separation from white-family foregrounds.

| Pairing | Foreground | Background | Ratio | WCAG 2.1 verdict | Where it appears |
|---|---|---|---|---|---|
| Inverted hero/body text | `#F8F6FE` | `#04091A` | **18.51:1** | AAA (all sizes) | `/` hero `h1` "Building trust with every tap", all dark sections |
| Body text | `#04091A` | `#FFFFFF` | **19.83:1** | AAA (all sizes) | Card body copy, feature cards (`/`, `/checkout`) |
| Light/secondary CTA label | `#04091A` | `#F8F6FE` | **18.51:1** | AAA | "Get started" pill on dark hero |
| **Primary CTA label** | `#F8F6FE` | `#006CFF` | **4.27:1** | **AA large only — FAILS AA for normal text** | "Get started now", "View more", "Get started" pills |
| Primary CTA label (pure white variant) | `#FFFFFF` | `#006CFF` | **4.58:1** | AA normal (passes) / fails AAA | Some blue CTAs |
| Outline-CTA / accent text on dark | `#006CFF` | `#04091A` | **4.33:1** | AA large only — fails AA normal | "Explore Checkout 2.0" outline button border + label |
| Blue link/accent on white | `#006CFF` | `#FFFFFF` | **4.58:1** | AA normal (passes), AAA fails | Inline links, accent labels |

**The load-bearing finding:** the highest-frequency interactive element on the site — the blue primary CTA — renders its label in off-white `#F8F6FE` at **4.27:1**, which is **below the 4.5:1 WCAG AA threshold for normal text**. It is rescued only because the labels are 16px/600-weight, and 14pt-bold (≈18.66px) or 18pt qualifies as "large text" (3:1 threshold). At the rendered 16px/600, the button sits in a gray zone: bold ≥14pt large-text rules technically apply, but the safer reading is that this is a borderline AA pass that an auditor would flag. The simplest fixes are switching the label to pure `#FFFFFF` (lifts to 4.58:1, a clean AA pass) or darkening the fill toward `#0057CC` (~5.5:1). The **`#006CFF`-on-`#04091A`** outline button (4.33:1) is the more clear-cut failure: a thin 2px border at this ratio is hard to perceive against the near-black hero for low-vision users, and the label text fails AA outright.

Net: contrast is exemplary wherever the design stays in its black/white duotone, and marginal-to-failing everywhere the brand blue carries text or borders. Because the blue is the single accent that signals "primary action," this is a systemic rather than incidental issue.

### 2. Motion and reduced-motion considerations

Bolt is a heavily animated marketing site, and the CSS confirms it: the stylesheets contain **279 rules with `transition`**, **265 with `transform`**, **25 `animation` declarations across 26 `@keyframes`**, and **49 `will-change` hints** (the last indicating deliberate GPU-compositing optimization for scroll/hover effects). Interaction motion is consistent and tasteful — every CTA shares the same transition recipe:

```
transition: background-color .2s, border-color .2s, color .2s, fill .2s, transform .2s ease-in-out;
```

i.e. a 200ms multi-property tween with `ease-in-out` on transform (the hover lift/scale). Nav links use a lighter `color .2s`. Rich motion is delegated to **Lottie** (the `lottie` runtime is present and Cloudinary serves raw Lottie JSON such as `revolve_finalfinalwebp_…json`) and to **Wistia** for video. No Framer Motion or GSAP is loaded — animation is hand-rolled CSS plus Lottie/Wistia players.

**The critical accessibility gap:** the site ships exactly **one** `@media (prefers-reduced-motion)` rule, and it belongs to the third-party CookieConsent library (`#cc-main { --cc-modal-transition-duration: 0s }`). **None of Bolt's own 25+ animations, 279 transitions, or its Lottie loops honor `prefers-reduced-motion: reduce`.** A user who has set the OS-level "reduce motion" preference will still receive the full slate of looping Lottie sequences, transform-based scroll reveals, and hover scales. This is a WCAG 2.1 SC 2.3.3 (Animation from Interactions, AAA) miss and, where any looping animation runs longer than 5s without a pause control, a potential SC 2.2.2 (Pause, Stop, Hide, Level A) concern. The remediation is low-effort given the architecture: a single global `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important } }` plus gating Lottie `autoplay`/`loop` on the matchMedia query.

### 3. Semantic structure & ARIA

The document structure is sound and clearly machine-generated from a CMS schema rather than hand-authored, which gives it good consistency. On the homepage:

- **One `h1`** ("Building trust with every tap"), `lang="en-US"`, `charset=UTF-8`, responsive viewport meta present. The `h1` is correctly the hero headline.
- **Landmarks:** 1 `header`, 1 `main`, 1 `footer`, 3 `nav`, 7 `section`. Clean single-`main` structure. **No `skip-to-content` link** was found, which is a keyboard/screen-reader navigation gap given the large header and 165 interactive elements on the page.
- **Heading hierarchy has a level-skip defect:** the order is H1 → **H3** ("The checkout that learns from every click") → H2 ("Supercharge your business") → H4 → … The first subhead jumps from H1 to H3 (skipping H2), and the H2 then appears *after* an H3. This is almost certainly the CMS rendering heading levels from a per-block "style" field rather than computing true document outline depth — a common headless-CMS pitfall. It breaks the logical outline for assistive-tech users navigating by heading level.
- **Images:** 49 `<img>` on the homepage, all but one carry an `alt` attribute (48/49); **37 use empty `alt=""`** (correctly marking decorative imagery), 1 is missing `alt` entirely. Notably the platform does **not** use `next/image` (0 `/_next/image` requests) — images are raw Cloudinary URLs, so there is no built-in responsive-srcset/AVIF pipeline from Next; optimization is delegated to Cloudinary's URL transforms instead.
- **Decorative-icon noise:** the DOM carries **86 elements with `role="img"`** (inline SVGs), almost all decorative; folding these to `aria-hidden="true"` would reduce screen-reader chatter.
- **Interactive naming:** **7 of 165** links/buttons on the homepage have no accessible name (no text, `aria-label`, or `title`) — these are the icon-only or image-wrapping anchors and should receive labels.
- **Forms (`/checkout` and forms generally):** HubSpot embeds (`forms.hsforms.com/embed/v3/form/44395348/…`) own the lead forms; native inputs on the static pages are absent or fully labeled (0 unlabeled inputs found), so label coverage depends on HubSpot's generated markup rather than Bolt's own code.
- **Focus management:** only **1 `:focus-visible`** rule exists site-wide, against **2 `:focus { outline: none }`** rules — a thin margin that suggests focus rings are suppressed in at least a couple of places without a guaranteed `:focus-visible` replacement. No positive `tabindex` misuse (good), and one `aria-live`/`alert` region (the cookie banner).

### 4. Font loading: Inter variable + Agrandir

Bolt runs a **two-source, mixed-strategy** font pipeline:

| Family | Role | Source | Format(s) loaded | `font-display` | Preloaded? |
|---|---|---|---|---|---|
| **Agrandir Bolt** | Display / headings (`h1` = 70px/700) | **Self-hosted** `/fonts/agrandir-bolt/` | woff2, woff, ttf, **otf** | `swap` | Yes (all 4 formats) |
| **Agrandir Variable** | Display weight axis (1–999) | **Self-hosted** `/fonts/agrandir-variable/` | ttf | `swap` | Yes |
| **Inter** | Body / UI (body 16px, weights 100–900) | **Google Fonts** `fonts.googleapis.com/css2?family=Inter:wght@100…900&display=swap` | woff2 (gstatic) | `swap` | No (only `preconnect`) |
| WistiaPlayerInterNumbersSemiBold | Wistia player chrome | Inlined base64 by Wistia | woff (data-URI) | — | n/a |

Observations and defects:

- **`display=swap` everywhere** is the right CLS-vs-FOIT tradeoff — text renders immediately in the fallback stack and swaps in. The fallback chains are well-built (`Inter, sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", …`), so unstyled flashes use a sensible system metric.
- **The Agrandir-bolt preload is wasteful:** the head preloads the *same* weight in **four formats** (`.otf`, `.ttf`, `.woff`, `.woff2`), all with `as="font" crossorigin`. A browser will only ever consume `woff2`; the otf/ttf/woff preloads are dead weight that compete for early bandwidth and trigger "preloaded but not used" console warnings. Only the woff2 should be preloaded; the others belong in the `@font-face` `src` fallback list, not in `<link rel=preload>`.
- **Inter is rendered-critical but not preloaded.** The hero headline is Agrandir (preloaded), but all body/UI text is Inter, which is fetched via a render-blocking Google Fonts stylesheet (`preconnect` to `fonts.googleapis.com` is present, but no `preconnect` to `fonts.gstatic.com` where the actual woff2 lives, and no font preload). This adds a third-party round-trip on the critical path. Self-hosting Inter (Bolt already self-hosts Agrandir and ships a Next.js build that supports `next/font`) would remove the cross-origin dependency, eliminate the FOUT swap on body copy, and improve privacy posture.
- Requesting **all nine Inter weights (100–900)** when the design system realistically uses ~3 (400/500/600 for body and 700 for emphasis) is over-broad; subsetting to used weights trims the CSS and avoids loading unused faces.

### 5. The Next.js CMS-lander architecture

Bolt's site is a **single statically-generated Next.js (Pages Router) application** driven by a headless CMS, and the routing is the most distinctive technical signal here. Every marketing URL is served by a catch-all dynamic template:

| Public URL | Resolved Next.js page (template) | Mode |
|---|---|---|
| `/` (homepage) | `/home-lander/[[...id]]` | `__N_SSG: true` (static) |
| `/checkout` | `/checkout-demo-new/[[...id]]` | `__N_SSG: true` |
| (generic content) | `/default-lander`, `/home-lander` | static |

Key facts:
- All routes share the **same `buildId` (`Y6xhotdJiNlUyUhKDGkwt`)**, confirming a single monolithic static export rebuilt as a unit — content changes require a full rebuild/redeploy rather than on-demand ISR per page.
- `pageProps` is shaped as a CMS envelope — `{ pageData: { data }, featuredStory, featuredText, latestPresses }` — i.e. each lander is a thin React shell that renders a block/section tree fetched from the CMS at build time. This explains both the **structural consistency** (every page has the same landmark skeleton) and the **heading-level defect** (block-level "heading style" fields not mapping to true outline depth).
- Optional catch-all segments (`[[...id]]`) let one template serve many slugs — the `/home-lander`, `/checkout-demo-new`, and `/default-lander` templates are essentially layout archetypes the marketing team composes content into. This is an efficient, editor-friendly model but means accessibility defects (heading order, missing skip link, blue-CTA contrast, no reduced-motion) are **systemic**: fixing them once at the template/design-token level fixes them across the entire site, which is the silver lining.
- CSS is route-split: `_app.css` plus per-route chunks (`pages/home-lander/[[...id]]…css`), all `rel=preload as=style`. The hero background SVG and the first Cloudinary hero image are also preloaded (`as=image`), showing deliberate LCP-element prioritization.

### 6. Third-party stack & technical observations

The page loads **22 `<script src>`** tags and a substantial third-party footprint. Identified vendors:

| Vendor | Endpoint / ID | Purpose | Notes |
|---|---|---|---|
| **Google Tag Manager** | `GTM-T8N9LTQZ` | Tag orchestration | Loads the rest of the analytics tags |
| **Google Analytics 4** | `G-R5V2LT88M6` (`analytics.google.com/g/collect`) | Web analytics | Fires `page_view`; `npa=0` (non-personalized ads off) |
| **Sentry** | `browser.sentry-cdn.com/9.6.1/bundle.min.js` | Front-end error monitoring | Loaded from Sentry CDN (not self-bundled) — adds a blocking third-party JS fetch on every page |
| **Wistia** | `fast.wistia.net/assets/external/E-v1.js` | Video player | Injects its own inlined font (`WistiaPlayerInterNumbersSemiBold`) |
| **HubSpot Forms** | `js.hsforms.net/forms/v2.js` + `forms.hsforms.com/embed/v3/form/44395348/…` | Lead-capture forms | Form markup/labels are HubSpot-controlled, outside Bolt's a11y control |
| **Cloudinary** | `res.cloudinary.com/dugcmkito/` | Image + **Lottie JSON** delivery | 35 of 49 homepage images; also serves animation JSON |
| **ZoomInfo** | `js.zi-scripts.com/zi-tag.js` + `/unified/v1/master/getSubscriptions` | B2B visitor de-anonymization / intent | A tracking vendor worth flagging for privacy/consent review |

Technical observations:
- **Render-blocking & critical-path cost:** GTM + GA4 + Sentry + Wistia + HubSpot + ZoomInfo together represent six independent third-party origins, each requiring DNS/TLS setup. Sentry (`9.6.1`) loaded from a remote CDN on the critical path is the most questionable — error monitoring can be deferred/`async` and ideally self-hosted via the Sentry SDK bundle to avoid a third-party single point of failure.
- **Consent ordering:** the CookieConsent library is present (its CSS variables populate `:root`), but GA4 `collect` and ZoomInfo `getSubscriptions` requests fire on load. Whether these are correctly gated behind consent (Consent Mode v2 / region-based blocking) is a compliance question the live request order raises but cannot fully resolve here.
- **CLS / LCP hygiene is otherwise good:** `display=swap`, preloaded LCP image and hero SVG, route-split preloaded CSS, and `will-change` GPU hints indicate a team that has tuned Core Web Vitals — the gaps are concentrated in third-party governance and the unused-format font preloads.
- **No `next/image`** means responsive image optimization rests entirely on hand-authored Cloudinary transform URLs; inconsistencies in those transforms (vs. an automated srcset) are a maintenance risk.

### Summary scorecard

| Dimension | Status | Highest-priority action |
|---|---|---|
| Text contrast (black/white duotone) | Excellent (18–20:1, AAA) | — |
| Brand-blue CTA/accent contrast | **Marginal/failing** (4.27–4.58:1) | Pure-white labels or darken blue to ~`#0057CC` |
| Reduced-motion support | **Absent for first-party motion** | Add global `prefers-reduced-motion` reset; gate Lottie autoplay |
| Heading outline | Defective (H1→H3→H2 skip) | Fix CMS heading-level mapping |
| Skip link / focus rings | Missing skip link; thin `:focus-visible` coverage | Add skip-to-content; guarantee visible focus |
| Font loading | Good strategy, wasteful execution | Drop 3 redundant Agrandir preloads; self-host/preload Inter, subset weights |
| Architecture | Clean single-build SSG CMS landers | Defect fixes propagate site-wide (advantage) |
| Third parties | Heavy (6 origins) | Defer/self-host Sentry; verify consent gating of GA4 + ZoomInfo |


---

## Appendix — Page-by-Page Index

### Merchant / Product (Checkout & Commerce)

- `/` — Home — Shockingly Simple Checkout & Finance
- `/checkout` — Meet Bolt Checkout
- `/intelligentcheckout` — Checkout 2.0 — AI-Powered Commerce
- `/checkout-everywhere` — Checkout Everywhere
- `/checkout-os` — Checkout OS — Integrate Easily
- `/checkout-demo` — Checkout Demo
- `/ecommerce` — Ecommerce
- `/enterprise` — Enterprise
- `/payments` — Payments
- `/connect` — Connect
- `/network` — The Bolt Network
- `/bolt-id` — Bolt ID
- `/fraud` — Eliminate Fraud
- `/security` — Security
- `/high-risk` — High-Risk
- `/saas` — SaaS
- `/subscriptions` — Subscriptions
- `/digital-goods` — Digital Goods
- `/stablecoins` — Stablecoins
- `/startups` — For Startups
- `/app-devs` — For App Developers

### Consumer / SuperApp ("For Users")

- `/pay` — Get the Bolt SuperApp
- `/pay/rewards` — SuperApp — Rewards
- `/shopper` — For Shoppers
- `/shop` — Browse Our Marketplace
- `/refer` — Referral Program
- `/check-in` — Check-In
- `/shopper-trust-toolkit` — Shopper Launch Toolkit

### Company / Marketing / Conversion

- `/our-story` — Our Story
- `/careers` — View Open Roles
- `/case-studies` — Case Studies
- `/resources` — Resources
- `/blog` — Company News (Blog)
- `/news` — News & Press
- `/faq` — Frequently Asked Questions
- `/pricing` — Pricing
- `/contact-sales` — Contact Sales
- `/contact-us` — Contact Us
- `/get-started` — Self-Serve Checkout (Get Started)
- `/activate` — Activate
- `/install` — Installation Guides
- `/media-kit` — Media Kit

### Legal / Utility

- `/privacy` — Privacy Policy
- `/privacy-center` — Privacy Center
- `/terms-of-use` — Terms of Use
- `/end-user-terms` — End User Terms

_Total: 46 pages audited. Full-page desktop + mobile screenshots and per-page computed-style profiles for every page are stored under `bolt-audit/` (`shots/<slug>-desktop.jpeg`, `shots/<slug>-mobile.jpeg`, `profiles-<slug>.json`)._
