# DESIGN.md — Salvatore Cirone Portfolio
> Author: Salvatore Cirone — Senior Backend Engineer & AWS Architect  
> Built with: Astro v6 (static, no SSR)

---

## 1. Overview & Aesthetic Direction

A **dark, tech-forward portfolio** with a purple/night palette punctuated by gold accents and fluid motion. The tone balances:

- **Editorial clarity** — structured sections with clear hierarchy, monospaced labels, alphanumeric counters
- **Industrial tech** — uppercase functional labels, credential/badge material language, monospaced figures in spec panels
- **Warm minimalism** — dark purple background, generous whitespace, accent-driven contrast

Single-page scroll: hero → services → work → contact → footer, plus `/work/[slug]` project detail pages.

---

## 2. Colour Palette

| Role | Value |
|---|---|
| Background (`--bg-primary`) | `#15102f` — deep purple-night |
| Surface (`--bg-surface`) | `#3e2c60` — lifted purple |
| Accent BG (`--bg-accent`) | `#85409D` — vibrant purple |
| Primary Text | `#ffffff` — white |
| Secondary Text | `#d4d4d4` — light grey |
| Muted / Gold Accent | `#EEA727` — warm gold |
| Border | `#ffffff` (default), `#cccccc` (light) |

The palette is **deep purple dominant with gold accents**. Contrast is driven by luminance jumps (white on purple) rather than pure dark/light extremes.

---

## 3. Typography

Three faces, three jobs, **no overlap**. All self-hosted variable fonts in `public/fonts/` — there is no third-party font request. Every size on the site comes from the `type` block in `src/design.config.ts`; no component declares a raw `font-size`.

| Role | Face | Notes |
|---|---|---|
| Display (hero, section labels, chapter titles) | **Archivo** | Variable weight 100–900 **and width 62–125%**. The width axis is a live design instrument, not decoration. |
| Body & UI | **Inter** | Retained deliberately as the workhorse. Never used as the display voice. |
| Data & measurement | **JetBrains Mono** | Tabular figures in spec panels, counters, and labels **only**. Not a "technical" costume. |

### The scale

Ratio ~1.25, exposed as CSS custom properties (`--size-*`):

| Token | Value | Use |
|---|---|---|
| `min` | 11px | Hard floor for functional text. Nothing goes below it. |
| `xs` | 12px | Mono labels, role tags |
| `sm` | 14px | Secondary body, captions, spec values |
| `base` | 17px | Body copy |
| `md` | 21px | Lede (lower) |
| `lede` | 28px | Lede (upper) |
| `xl` | 36px | Chapter titles |
| `2xl` | 48px | — |
| `section` | clamp 36 → 56px | Section labels |
| `display` | clamp 44 → 96px | Hero and chapter detail titles. Capped at 6rem. |

**The 28–36px band (`lede`/`xl`) is the tier the old scale lacked entirely**, which is why the positioning statement previously had nowhere to sit above body copy and was set at helper-text size.

Tokenised leading (`--leading-tight: 1.05`, `--leading-snug: 1.25`, `--leading-body: 1.65`) and a single mono tracking value (`--tracking-label: 0.1em`) replace the previous three leadings and four tracking values for one label role. Measure is capped at `--measure: 66ch`.

## 4. Layout & Grid

### Global Layout
- Full-width, single-column scroll
- Anchored sections with `id` hooks (`#services`, `#work`, `#contact`)
- Fixed navigation bar at top (`--nav-height: 64px`)
- Max inner width: **`1280px`** (was `2000px`, which meant no container at any real viewport and therefore no shared vertical rail). The `.rail` utility applies it; headings, cards, and carousel all align to it.

### Navigation
```
[Logo SVG]   [Services]  [Work]  [Contact]   [LinkedIn] [GitHub]   [Let's meet ▸]   [☰]
```
- Logo: Inline SVG (abstract geometric rect composition) — left-aligned, links to `/`
- 3 nav links (Services, Work, Contact) — right-aligned before socials. **White (`--text-primary`), not gold**: gold on the purple nav ground measures 3.17:1, below the 4.5:1 floor for 12px text. Gold is the hover/active state.
- Social icons (LinkedIn, GitHub SVG) — muted opacity, hover to full
- CTA button: "Let's meet" with secondary label "Book now" (CSS flip on hover). Links to a Google Calendar booking page (appointment schedule) in a new tab — URL is the `BOOKING_URL` constant in Nav.astro
- **Mobile (≤768px)**: desktop links/socials/CTA hidden; burger icon appears. Clicking opens a sidebar that slides in from the left with the same items. Overlay backdrop + GSAP stagger on links. Escape/overlay/link-click closes. GSAP nav-link hover code lives in Nav.astro's own `<script>`.
- **Breakpoint transition**: GSAP animates the swap — desktop items fade up/out, burger fades in (mobile) and vice‑versa (desktop). Stagger on desktop items re‑entry. Sidebar auto‑closes on resize to desktop via `clearProps`.

### Hero Section
Full-viewport (`min-height: 100svh`), type-led. The composition is a left type column on the page ground with the portrait absolutely positioned bottom-right, bleeding off the edge. **The glass card is gone** — the type sits directly on `--bg-primary`, which is both bolder and removes a decorative backdrop-filter panel.

**The headline is the claim, at display scale:**

> Architecture that holds. / AI that ships. / **From wherever I am.**

Three explicit `<span>` lines, Archivo, `clamp(2.5rem, 5vw, 4.75rem)`. The third line carries `--accent` because it carries the differentiation — replacing the decorative 3px gold divider that used to do that job.

This inverts the previous hierarchy, where 104px of display type was spent on the greeting "Ciao!" while the positioning statement sat at 16px grey — the same size and colour as form helper text.

**"Ciao!" now opens the lede**, below the headline: *"Ciao! I'm Salvatore — I turn complex cloud and AI challenges into elegant realities."* at 28px. The personality is preserved and more prominent than before; it is deliberately **not** a kicker above the heading (a banned pattern — the heading carries its own weight).

Below that: the mono base line (`Based in Italy; living around the world`) and a single quiet `See the work ↓` anchor. No booking button here — the close belongs to the contact section; this surface is Experience mode and the artifact leads.

**Mobile (≤900px)**: portrait becomes a centred, bounded square above the type. The old `min-height: 60vh` floor on the text block — which produced ~250px of empty space on the highest-value screen — is gone; height is content-driven. Headline lines drop `white-space: nowrap` and are allowed to wrap.

### Services Section (`#services`)
- Header: "Services" section label (the decorative `04` counter is gone; the deck indicator carries position)
- Description from `sections.ts`, then the hint: *"Drag the badges, or tap one to turn it over"* — which now names both affordances instead of only the drag
- **Deck controls**: 44×44 prev/next arrows that disable at the ends, plus an `01/04` tabular indicator with `aria-live="polite"`
- **Right-edge falloff**: a gradient overlay (not a `mask-image`, which would create a containing block and break the badges' 3D flip) fades the not-yet-reached badges so the clip reads as depth rather than broken layout. It bleeds to the viewport edge, and is hidden below 768px where only one badge is visible.

#### The badge
Each service is a **work badge** — a physical credential you can pick up and turn over.

- Width `min(340px, calc(100vw - 48px))`, height 290px. The old fixed 360px clipped at the right edge of a 390px viewport, hiding three of four services from mobile visitors.
- **Lanyard slot** punched through the top: a real affordance of the object. This replaced the **randomised 32-bit barcode** (`Math.random() > 0.5`), which was decoration cosplaying as encoded information on a page whose job is credibility.
- Front: avatar (44px, supporting — the four source illustrations are near-identical at this size, so the *title* carries identification), `nn/04` index, title, a mono domain tag (`NODE.JS · PYTHON · AWS`), description, and a `How I help` hint
- **Reverse**: `How I help` plus 3–4 concrete capability points from `services.help`

#### Three transform layers, deliberately separated
They would otherwise overwrite each other, since the deck writes transforms every frame:

| Layer | Owns | Driver |
|---|---|---|
| `.service-card` | deck layout — `x`, `y`, `rotation`, `zIndex` | GSAP, per frame |
| `.badge-lift` | the pick-up — `scale`, lift, velocity tilt | GSAP, on gesture |
| `.badge-inner` | the flip — `rotateY(180deg)` | CSS, off `aria-expanded` |

#### Interaction
- **Pick-up**: on *drag intent* (8px threshold, so a tap never triggers it) the held badge tweens to `scale 1.045`, `y -12`, and a deepened shadow. `rotation` follows pointer velocity so the badge lags the hand. Release settles on `back.out(1.7)` — an overshoot, not a dead snap. A flick projects its throw.
- **Tap to flip**, drag to move. Pointer capture is taken *only* once the drag threshold is crossed: taking it on `pointerdown` retargets the following click to the capturing element and silently swallowed every flip.
- **A badge behind the front one comes forward first**; turning it over is the second gesture. Snapping on pointer-focus previously slid the badge out from under the cursor before its click could land.
- **Keyboard**: the deck is a focusable `role="group"` — `←`/`→` step, `Escape` closes a flipped badge. Each badge is a real `<button>` with `aria-expanded`, so `Enter`/`Space` flips it, and the hidden face is `aria-hidden` so a screen reader is not read both sides at once. Tab-focus scrolls a badge into view; pointer focus deliberately does not.
- **Geometry is measured, never assumed** (`offsetWidth` + gap, stack target from the live wrapper rect) and re-measured on resize. The previous implementation computed its stack target once at init, so it was stale after any window resize.
- Logic lives in `Services.astro`, not `BaseLayout.astro` — 114 lines moved to the component whose geometry it depends on.

### Work Section (`#work`)
- Header: "Work Chapters" section label (the decorative `02` counter is gone — the carousel indicator already carries position)
- Description text below header (driven from `sections.ts`)
- **Horizontal carousel** with arrow navigation and a `01/02` tabular indicator. Viewport carries an edge mask so the neighbouring card fades rather than showing a strip of clipped sentences. Arrows are 44×44 (tap-target floor). Step distance is read from live layout (`offsetWidth` + computed `columnGap`), not a hardcoded multiplier.

**A chapter is an arena, not a job.** Each card is a two-column split:
  - **Left**: arena line, chapter title (Archivo), lede (the new 21px tier), "What I held" (responsibilities), "What it taught me" (the versatility payload), then role tags
  - **Right**: the **spec panel** — a `<dl>` of Client / Years / Domain / Cloud / Core stack / Scale, set in JetBrains Mono with `tabular-nums` and hairline rules. This is where mono finally does real work.

The spec panel **replaced a stock photograph** of an anonymous person at a laptop. For a visitor evaluating architectural judgement, a stock photo is anti-evidence; a specification is the artifact an architect actually produces. `public/images/work/consultant.jpg` is now unused.

> ⚠️ Spec values are currently **placeholder** (`specPlaceholder: true` in `src/data/work.ts`). `pnpm build` warns per chapter, and the markup carries `data-spec-placeholder`. They must be replaced with real figures before deploy.

- **Certifications sub-section** below carousel:
  - Subdued header: "Certifications" in mono uppercase (count removed)
  - **Seamless auto-scroll track**: GSAP loops cards via cloned content + modulus `x` translation
  - Animation starts paused; `ScrollTrigger.onToggle` resumes when work section is in view
  - Issuer text raised from **8px to 11px** — that string authenticates the certification, so it is evidence, not fine print
  - Entire card links externally; edge-gradient mask on the viewport
  - Respects `prefers-reduced-motion` — static layout without GSAP

### Chapter detail route (`/work/[slug]`)
Previously a dead end: no nav, no footer, and a dashed "PROJECT DETAIL COMING SOON" box behind the site's most inviting interaction.

- Now renders `<Nav />` and `<Footer />` — the page is never a trap
- Display-tier title (Archivo, up to 96px), arena line, 28px lede
- Two-column body: main content plus a **sticky spec panel** rail with role tags
- When `detail.projects` exists it renders projects with name / summary / outcome
- When it does not, an **honest holding state**: says the write-up is still being written, and offers a booking link ("Ask me about it on a call") instead of a dashed rectangle

### Contact Section (`#contact`)
The section whose job is to close. Previously it offered exactly one action — a `mailto:` in the right-hand column — while the booking link lived only in the fixed nav.

- Headline: "Let's Build Together" (Archivo display, `--leading-tight`; it previously inherited body leading of 1.6 and rendered with 64px of leading on mobile)
- Lede at 21px carrying the voice, emoji accent preserved (`🤜🤛`)
- **Action hierarchy, in the order a visitor should reach for them:**
  1. **Book a call** — primary, gold ground, 28px title, animated arrow. The highest-intent action on the site, now on the page where the decision happens.
  2. **Message on LinkedIn** — secondary
  3. **Email** — tertiary
- **Facts rail** beside the actions (using width that was previously empty):
  - **Availability** — the honest claim from PRODUCT.md: at xFarm full-time, open to select projects and advisory work. This appeared nowhere on the site before.
  - **Based** — Italy · CET/UTC+1, which turns the nomad claim into a practical booking fact
- All channels and the availability copy live in `src/data/site.ts`, a single source of truth

### Footer
- Inline logo SVG (same as nav) + "© 2026 Salvatore Cirone" in monospaced

---

## 5. Iconography & Image Assets

| File | Usage |
|---|---|
| `public/images/Hero.png` | Hero section portrait |
| `public/images/services/backend.png` | Backend service card avatar |
| `public/images/services/solution-architect.png` | Solution Architect avatar |
| `public/images/services/ai-prompt-engineer.png` | AI Prompt Engineer avatar |
| `public/images/services/digital-nomad.png` | Digital Nomad avatar |
| `public/images/social/linkedin.svg` | LinkedIn nav icon |
| `public/images/social/github.svg` | GitHub nav icon |
| `public/images/og/v1.png` | Open Graph share image |
| `public/favicon.svg` | Favicon (SVG) |
| `public/favicon.ico` | Favicon (fallback) |
| `public/fonts/archivo-latin[-ext].woff2` | Archivo variable (display) — self-hosted |
| `public/fonts/inter-latin[-ext].woff2` | Inter variable (body/UI) — self-hosted |
| `public/fonts/jetbrainsmono-latin[-ext].woff2` | JetBrains Mono variable (data) — self-hosted |
| `public/images/work/consultant.jpg` | **Unused** — the stock photo the spec panel replaced |
| `public/images/certifications/aws-saa.png` | AWS Solutions Architect logo |
| `public/images/certifications/gcp-pca.png` | Google Cloud Architect logo |
| `public/images/certifications/cka.png` | CKA logo |

No external icon libraries — all icons are inline SVGs or static image files matching the industrial-tech aesthetic.

---

## 6. Motion & Animation

Powered by **GSAP** (plugins: ScrollTrigger, Draggable).

**Retired:** the 7-wave animated soundwave background. It was audio-waveform iconography on a page about cloud architecture — a borrowed motif from the wrong domain — and a second continuous background animation would have competed with the headline for the role of "the authored moment". The scroll-velocity machinery it pioneered was kept and repointed at the type.

| Pattern | Implementation |
|---|---|
| **Loading screen** | Logo rectangles animate in/out on loop, then whole screen fades out on `window.load` |
| **Hero fade-in** | Portrait fades in (`power2.out`, 1s). Lede, base line and jump link stagger from below (`y: 30`, 0.12s) |
| **Headline width axis** | *The page's one authored moment.* Archivo's variable `wdth` axis (62–125) on each headline line. Entrance expands each line from `wdth 68` → `100` with a 0.13s stagger — type **arriving** rather than sliding. Then scroll energy pushes it `100 → 108`, each line lagging the one above so the response ripples down the headline. Exponential decay (`energy *= 0.88`), lerped, and the DOM is only written when the axis moves >0.12 (the property reflows the line, so a no-op write is not free). Measured at a locked 60fps: median 16.7ms, worst 17.7ms, zero frames over 32ms during a hard scroll. Static at `wdth 100` under `prefers-reduced-motion`. |
| **Section reveal** | ScrollTrigger on `data-animate="section"` — children stagger in from `y: 30` when section enters 85% viewport |
| **Services scroll-trigger** | Header + hint text stagger in on scroll |
| **Badge pick-up** | On drag intent: `scale 1.045`, `y -12`, deepened shadow, and `rotation` driven by pointer velocity so the badge lags the hand. Release settles on `back.out(1.7)`. Applied to `.badge-lift`, a layer the per-frame deck layout never touches. |
| **Badge flip** | `rotateY(180deg)` on `.badge-inner` with `preserve-3d` and `backface-visibility: hidden`, 0.62s. Toggled by `aria-expanded`; transition removed under `prefers-reduced-motion` while the flip itself still works. |
| **Nav link hover** | Text translates up `-4px`, font-weight bolds to 700 |
| **Nav breakpoint transition** | Desktop ↔ mobile swap at 768px: desktop items fade up/out (or down/in with stagger on re‑entry), burger cross‑fades. Sidebar closes via `clearProps` |
| **CTA hover** | "Let's meet" fades up out, "Book now" fades in from below |
| **Work carousel** | CSS transform slide + GSAP text stagger on each card entry |
| **Work card text entry** | Counter, title, description, roles stagger in from `y: 24` on first view |
| **Certifications auto-scroll** | Seamless GSAP loop (cloned cards, modulus `x`). `ScrollTrigger.onToggle` pauses/resumes with work section visibility. Edge-gradient mask for smooth fade. |

---

## 7. Navigation Interaction Pattern

- Nav links use a simple **Y-translate + fontWeight** GSAP hover (no split-text duplication)
- CTA button uses a **dual-label flip**: `[data-cta-label]` (visible) transitions out, `[data-cta-alt]` (hidden) transitions in on hover
- Social icons are standalone `img` tags with CSS opacity transitions

---

## 8. Content Strategy & Voice

- **Tone**: Professional but approachable. "Ciao!" greeting, "tech nomad" self-description, playful emoji in CTA (`🤜🤛`)
- **Bio hook**: "turns complex cloud and AI challenges into elegant realities"
- **CTA**: "Let's Build Together" — collaborative, forward-looking
- **Work carousel**: "Work Chapters" frames each project as a distinct narrative chapter
- **Social proof posture**: Senior levels mentioned in service titles (Senior Backend Engineer, AWS Solutions Architect)

---

## 9. Technical Stack

| Technology | Role |
|---|---|
| **Astro v6** | Static site framework |
| **GSAP** | Animation library (ScrollTrigger, Draggable) |
| **pnpm** | Package manager |
| **Node >=22.12.0** | Runtime |
| **Figma** | Design tool |
| **CSS (custom properties)** | Styling via design tokens |

---

## 10. Responsive & Accessibility Notes

- `viewport-fit=cover` — mobile notch safe areas
- `<a href="#main-content">Skip to main content</a>` — keyboard accessibility
- Full OpenGraph + Twitter Card meta + JSON-LD structured data (Person + WebSite)
- Scroll-triggered animations respect `prefers-reduced-motion: reduce` — skipped entirely
- `scroll-margin-top: var(--nav-height)` on each section for anchored nav
- `::selection` styling for branded highlight
- Hero collapses to single-column stacked layout below 768px
- Work card switches to single-column grid below 768px
- Nav collapses to burger + sidebar below 768px (sidebar slides from left, GSAP-animated); crossfade transition between desktop/mobile nav states
- **`:focus-visible` authored globally** on the dark palette (2px gold ring, 3px offset). There were previously no focus styles anywhere in the codebase — keyboard users got UA defaults over a custom dark ground.
- **Browser surfaces themed**: scrollbar (both `scrollbar-color` and the WebKit pseudo-elements), caret colour, `::selection`, and tabular figures via the `.tabular` utility
- `scroll-behavior: smooth` is now gated behind `prefers-reduced-motion`
- Spec rows stack (label above value, left-aligned) below 560px; right-aligned values in a narrow column wrapped badly
- Minimum functional text size is 11px (`--size-min`); the 8px certification issuer is gone
- Tap targets: carousel arrows, sidebar links, CTAs and the back link all at ≥44px

---

## 11. Key Design Principles

1. **Depth through colour** — a purple/night palette creates a moody, premium feel; gold accents provide focal anchors
2. **Motion as interaction** — the headline's width axis responds to the reader's own scrolling; the draggable deck and carousel invite tactile exploration. Motion responds to input rather than looping at the visitor.
3. **Typography as hierarchy** — a single tokenised scale, with the display tier reserved for what actually differentiates. Three faces with three non-overlapping jobs; mono earns its place on figures, never as costume.
4. **Real data over decorative data** — chapter spec panels carry actual figures in tabular mono; the service badges carry a real domain tag. Nothing on the page pretends to encode information it does not have.
5. **Restrained palette, expressive motion** — only 2 accent colours (gold, purple) but rich animation vocabulary
6. **Human details** — "Ciao!" greeting, playful emoji, "tech nomad" framing — personality within a professional container
7. **Single-page rhythm** — sections flow hero → services → work → contact → footer, each with distinct layout but unified visual language
