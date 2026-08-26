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
Full-viewport (`min-height: 100svh`), type-led. Left type column, portrait absolutely positioned bottom-right bleeding off the edge, and a **faceted light field** behind both. No glass card — the type sits on the page ground.

**The headline is the claim, at display scale:**

> Architecture that holds. / AI that ships. / **From wherever I am.**

Three `<span>` lines, Archivo, `clamp(2.5rem, 5vw, 4.75rem)`. Third line carries `--accent` because it carries the differentiation.

**Lede:** *"Ciao! I am Salvatore, a digital nomad and creative software engineer"* at 28px. "Ciao!" opens the lede rather than sitting as a kicker above the heading (a banned pattern). The site standardises on **"digital nomad"** — not "tech nomad".

Then the mono base line and a single quiet `See the work ↓` anchor. No booking button: the close belongs to the contact section, and this surface is Experience mode.

#### Faceted light field
The background is the **same low-poly material as the portrait**, lit by a source that follows the pointer. Portrait and ground share one light, so the illustration reads as native to the page rather than placed on it. This is the hero's authored moment.

- Canvas 2D, a deterministically-jittered triangular lattice (~118px cells, seeded so it never reshuffles on resize), each facet carrying its own orientation vector
- Shading is `max(0, dot(lightDir, facetNormal))` with distance falloff; facet fills stay close to `--bg-primary` so the field reads as material, not as a pattern laid on top
- Gold appears **only as a hairline stroke on the brightest facet edges**, never as a fill — a gold fill behind the type would wreck its contrast
- The light eases toward the pointer (0.075 lerp) and **redraws only when it actually moved**, so a resting page costs nothing
- On pointer-leave or window blur the light returns home rather than freezing where the cursor exited

#### Portrait
**The figure's geometry never moves.** It carried a 6° two-axis tilt plus a parallax translate, and that read cheap: a solid object does not swivel because a light moved, so the tilt announced itself as an effect applied to a picture rather than as light falling on a form. The 3D stage (`perspective`, `preserve-3d`, `will-change: transform`) went with it, and no inline transform is ever written to the figure.

What the light still changes is where it lands:
- A **gold rake** masked by the portrait's own alpha tracks the same light that shades the ground, `soft-light` at 0.34 opacity, so it catches the existing facets rather than repainting them. A directional rake, deliberately not a symmetric halo. This is now the whole of the portrait's response to the pointer, which is also the only response a fixed object should have.
- Asset is `Hero.webp` — **76 KB, down from a 2.84 MB PNG** at 2048px. `Hero.png` remains in `public/` as the master and is no longer referenced.

#### Scrim
A directional gradient between the canvas and the type keeps the type column on near-solid ground, so the field can never erode text contrast while staying fully visible to the right. Measured worst case, with the light parked inside the text column: **16.8:1** headline, **11.3:1** lede, **8.5:1** mono base line. The gradient turns vertical below 900px, where the layout stacks.

#### Where there is no cursor
On touch and under `prefers-reduced-motion` the field renders **once** at a hand-picked light position (68% / 30%, so it rakes across the face) and no loop ever starts. The rake is placed from that same home light, so the still is lit consistently with the ground beneath it (it previously defaulted to the rake's midpoint instead, a light the lattice was not using). This is the composed still, not a degraded version.

**Mobile (≤900px)**: portrait becomes a centred bounded square above the type; no `min-height` floor on the text block; headline lines drop `nowrap` and may wrap.

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
The section whose job is to close. Three real channels, ranked, and nothing else.

**The hierarchy is geometric, not typographic.** Head above, full rail beneath it: one gold block, then the secondary pair side by side. The block is measured in secondary doors rather than in pixels: `--door: 110px`, `--door-gap: 16px` and `--door-span: 1.6` live on `.contact-actions` and are the only numbers the composition is built on. The pair is a `grid-auto-rows: minmax(var(--door), auto)` track, so the email address can push a door taller instead of overflowing it, and the block's `min-height` is `calc(var(--door) * var(--door-span) + var(--door-gap))` = **192px against a 110px door**.

`--door-span` was a flat `2` first, an exact `236 = 110 × 2 + 16`. The arithmetic was clean and the block read as an empty gold field rather than a lead action, so the span came down to 1.6. It is still plainly the largest element in the section; it is no longer the section's whole weight.

- Headline: "Let's Build Together" (Archivo display, `--size-section`, `--leading-tight`, `max-width: 22ch`)
- Lede at 21px carrying the voice, emoji accent preserved (`🤜🤛`). **Drops to 17px / `--leading-body` below 768px**, where 21px over a 342px column ran six lines and read as heavy as the heading above it.
- **The gold block is set like a ticket.** Its content spans the height rather than floating at the midpoint: `Book a call` in Archivo black at `--size-2xl` on the top line, the practical detail at the foot, and a 64px circular arrow affordance bottom-right on the note's line. `align-content: stretch` is declared alongside `align-items: stretch` because inheriting `align-content: center` from `.action` collapsed the row to its content height and the distribution silently did nothing.
- Arrow affordance inverts on hover and `:focus-visible` — dark fill, gold glyph, 3px glyph travel. It is an authored SVG, not a glyph.
- **Action order:** Book a call (gold block) → Message on LinkedIn → Email.
- **The facts rail was removed.** Availability and Based/timezone are no longer stated here; the availability claim lives in PRODUCT.md as a constraint on copy, not as page content. `availability` and `timezone` are gone from `src/data/site.ts` with it. `base` stays, read by the hero base line.
- **Below 768px** the pair stacks, so the door ratio has no pair left to measure against. The block keeps its lead by scale alone at `min-height: 152px` with the title at `--size-xl` and a 48px arrow.
- All channels live in `src/data/site.ts`, a single source of truth

### Footer
- Inline logo SVG (same as nav) + "© 2026 Salvatore Cirone" in monospaced

---

## 5. Iconography & Image Assets

| File | Usage |
|---|---|
| `public/images/Hero.webp` | Hero portrait — 76 KB, 1440px, alpha preserved |
| `public/images/Hero.png` | Master source of the above (2.84 MB, unreferenced) |
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
| **Headline load-in** | Archivo's variable `wdth` axis expands each line from `68` → `100` with a 0.13s stagger — type **arriving** rather than sliding. Runs once, on load, then settles permanently. Static at `wdth 100` under `prefers-reduced-motion`.<br><br>**The scroll-driven width response was removed.** Below 768px the lines are allowed to wrap, so a width change mid-scroll could re-wrap the headline and shift everything beneath it — a layout-stability bug on exactly the small screens it was least wanted on. |
| **Faceted light** | The hero's authored moment. Pointer-driven light over a seeded triangular lattice, with the portrait's gold rake reading from the same light. The figure itself is fixed; only the shading moves. Redraws only on light movement. Measured at a locked 60fps during a continuous pointer sweep: median 16.7ms, p95 17.7ms, worst 19.2ms, zero frames over 32ms. Renders once and never loops on touch or reduced-motion. |
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

- **Tone**: Professional but approachable. "Ciao!" greeting, "digital nomad and creative software engineer" self-description, playful emoji in CTA (`🤜🤛`)
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
6. **Human details** — "Ciao!" greeting, playful emoji, "digital nomad" framing — personality within a professional container
7. **Single-page rhythm** — sections flow hero → services → work → contact → footer, each with distinct layout but unified visual language
