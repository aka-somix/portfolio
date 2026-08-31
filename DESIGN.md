# DESIGN.md — Salvatore Cirone Portfolio
> Author: Salvatore Cirone — Senior Backend Engineer & AWS Architect  
> Built with: Astro v6 (static, no SSR)

This document describes markup, layout, palette, typography and motion only.
No copy lives here or in any component, every string comes from `src/content/en/**`
via `src/lib/content.ts`. See `CONTENT.md` for where words live and `AGENTS.md`
for the rule that enforces it.

---

## 1. Overview & Aesthetic Direction

A **dark, tech-forward portfolio** with a purple/night palette punctuated by gold accents and fluid motion. The tone balances:

- **Editorial clarity** — structured sections with clear hierarchy, monospaced labels, alphanumeric counters
- **Industrial tech** — uppercase functional labels, credential/badge material language, monospaced figures in spec panels
- **Warm minimalism** — dark purple background, generous whitespace, accent-driven contrast

Single-page scroll: hero → services → work → tinyverse → contact → footer, plus `/work/[slug]` project detail pages and the `/404` route.

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
[Logo SVG]   [Services]  [Work]  [Tinyverse ⊙]  [Contact]   [LinkedIn] [GitHub]   [Let's meet ▸]   [☰]
```
- Logo: Inline SVG (abstract geometric rect composition) — left-aligned, links to `/`
- 4 nav links (Services, Work, Tinyverse, Contact) — right-aligned before socials. **White (`--text-primary`), not gold**: gold on the purple nav ground measures 3.17:1, below the 4.5:1 floor for 12px text. Gold is the hover/active state.
- **The Tinyverse link carries an orbit mark**, and it is the only marked link
  in the row: that section is the only one whose subject is a drawn system, so
  it is the only one that gets drawn. A 22×14 squashed ellipse rotated -14°,
  matching the tilt of the real orbits, with a 4px body on it. On hover or
  `:focus-visible` the ring goes to full opacity and the body travels the ellipse
  on a CSS `offset-path`, 2.6s linear.
  - The animation is declared **running-but-paused** rather than applied on
    hover, so leaving the link freezes the planet where it is instead of
    snapping it back to the start. The orbit keeps its place between visits.
  - The body turns gold only while hovered. Gold measures 3.17:1 on this purple,
    which fails the 4.5:1 text floor the nav labels are held to but clears the
    3:1 floor for a graphic.
  - Declared inside `prefers-reduced-motion: no-preference`, and behind
    `@supports (offset-path: ...)`. Without either, the body rests at the right
    of the ring, which is exactly where the path begins.
  - **The hover clip moved from `.nav-link` to a new `.nav-link-text` wrapper.**
    `overflow: hidden` with `height: 1.2em` on the link is what masks the text
    lift, and it cropped the mark to 1.2em and dragged it upward with the text.
    Same box, one level in; the GSAP hover still targets `[data-nav-text]`
    inside it and behaves identically.
- Social icons (LinkedIn, GitHub SVG) — muted opacity, hover to full
- CTA button: "Let's meet" with secondary label "Book now" (CSS flip on hover). Links to a Google Calendar booking page (appointment schedule) in a new tab — URL is the `BOOKING_URL` constant in Nav.astro
- **Mobile (≤768px)**: desktop links/socials/CTA hidden; burger icon appears. Clicking opens a sidebar that slides in from the left with the same items. Overlay backdrop + GSAP stagger on links. Escape/overlay/link-click closes. GSAP nav-link hover code lives in Nav.astro's own `<script>`.
- **Breakpoint transition**: GSAP animates the swap — desktop items fade up/out, burger fades in (mobile) and vice‑versa (desktop). Stagger on desktop items re‑entry. Sidebar auto‑closes on resize to desktop via `clearProps`.

### Hero Section
Full-viewport (`min-height: 100svh`), type-led. Left type column, portrait absolutely positioned bottom-right bleeding off the edge, and a **faceted light field** behind both. No glass card — the type sits on the page ground.

**The headline is the claim, at display scale:**

> Architecture that holds. / AI that ships. / **From wherever I am.**

Three `<span>` lines, Archivo, `clamp(2.5rem, 5vw, 4.75rem)`. Third line carries `--accent` because it carries the differentiation.

**Heading structure: the display headline is an `<h2>`, not the `<h1>`.** The
page's `<h1>` is a visually hidden heading naming the person and the role
(`hero.srHeadline`), placed as the first child of `<section class="hero">`. This
is a semantics-only arrangement: the site competes for a personal-name query
against several other people with the same name, and the display headline is a
claim rather than an identity.

It is **pixel-neutral by construction**, and the two reasons are worth keeping
written down because both are easy to break:

- The hidden `<h1>` sits in `.hero`, **not** in `.hero-type`. `.hero-type` is a
  flex column with `gap: 28px`, so any in-flow child added there widens the
  stack by 28px. `.hero` is `position: relative; overflow: hidden`, which makes
  it a clean containing block and rules out any scroll side-effect.
- `.sr-only` is `position: absolute`, so the node takes part in no flex or block
  layout at all and contributes zero height. See §10 for why it must not become
  `display: none`.

Verified: outside the animated nav band, all four full-page screenshots (home
and chapter × desktop 1440 and mobile 390) are pixel-identical to the build
before the change, and every measured bounding box and scroll extent is
unchanged.

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
- Asset is `Hero.webp` — **76 KB, down from a 2.84 MB PNG** at 2048px. The PNG master no longer lives in the repo.

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

The spec panel **replaced a stock photograph** of an anonymous person at a laptop. For a visitor evaluating architectural judgement, a stock photo is anti-evidence; a specification is the artifact an architect actually produces. The photograph has been removed from the repo.

> ⚠️ Spec values are currently **placeholder** (`specPlaceholder: true` in the frontmatter of `src/content/en/work/consultant.md` and `src/content/en/work/startup.md`). `pnpm check:content` warns per chapter, and this check runs as part of `pnpm build`, and the markup carries `data-spec-placeholder`. They must be replaced with real figures before deploy.

#### Below 900px the card is the chapter's *cover*

Stacked, a chapter card was nine information blocks in one column: roughly
1250px of rectangle whose only action sat at the bottom. Four things were wrong
at once, and one of them was a plain bug: the 90px edge mask fades 46% of a
390px viewport, taking the card's own first and last words with it.

| Wide | Narrow (≤900px) |
|---|---|
| Card `75vw`, edge mask on the viewport | Card **100%**, **mask removed**: no neighbour is in view to soften |
| Arrows and `01/02` below the carousel | Controls **above** the card (`order: -1`), so paging is visible before the scroll |
| Track paged by `translateX` | Viewport is a real **`scroll-snap`** scroller: a full-width card that only answers to a 44px arrow reads as broken on touch |
| Cards stretched to equal height | `align-items: flex-start`: equalising heights only injects dead air above the shorter chapter's CTA |
| Spec `<dl>` of eight rows | Six placeholder rows collapsed; **Client and Years promoted** to one mono line, gold at 5.9:1 on the surface |
| Blocks always open | "What I held", "What it taught me" and the spec behind **one disclosure** |

The card that remains is arena, title, lede, credential line, roles, one
disclosure and the CTA: ~500px, with both actions inside the first screenful.
Nothing is deleted and nothing is deferred to `/work/[slug]`, which is still a
placeholder.

Mechanics worth keeping straight:

- **One button, two panels.** The copy blocks and the spec sit in different
  columns on desktop and cannot be wrapped in a shared element, so the state
  lives on the article (`data-fold`) and CSS opens both. `aria-controls` names
  both ids.
- **The wrappers dissolve above 900px.** `.card-fold`, `.fold-panel` and
  `.fold-inner` are `display: contents`, so the wide card lays out exactly as it
  did before the disclosure existed.
- **`grid-template-rows: 0fr → 1fr`** animates a real auto height, so the panel
  opens to whatever the copy needs. The panel's own `padding` would survive a
  zero-height row (`overflow: hidden` clips children, not the padding box), so
  the spacing is margins on the clipped children instead.
- **`visibility: hidden` when closed**, delayed on the way out. A zero-height
  panel is still read aloud, which would contradict `aria-expanded="false"`.
- The mobile entrance stagger targets the visible elements only; animating
  blocks inside a collapsed panel spends the stagger on nothing.
- `cards` is read as `.work-card`, not `track.children`: Astro injects a
  component's hoisted script at the component's own position, which for
  WorkCard is inside the track, and that stray element was being counted as a
  chapter (`01/03` for two chapters).

- **Certifications sub-section** below carousel:
  - Subdued header: "Certifications" in mono uppercase (count removed)
  - **Seamless auto-scroll track**: GSAP loops cards via cloned content + modulus `x` translation
  - Animation starts paused; `ScrollTrigger.onToggle` resumes when work section is in view
  - Issuer text raised from **8px to 11px** — that string authenticates the certification, so it is evidence, not fine print
  - Entire card links externally; edge-gradient mask on the viewport
  - Respects `prefers-reduced-motion` — static layout without GSAP

### Tinyverse Section (`#tinyverse`)

Standalone apps and proofs of concept, drawn as a **solar system**. The sun is
the site's own logo mark, the same inline SVG used in nav, footer and loading
screen: identity as the centre of gravity rather than as a caption. It links to
`/`, so the centre of the Tinyverse is always this page.

Header (section label, description, mono hint) on the rail, then a two-column
body: the stage left, and right a quiet thesis paragraph above the detail panel.
Below 1024px the body stacks and the stage is capped at 620px, which stops the
system dwarfing the panel beneath it.

#### Geometry is derived, never authored

Every number comes from `items.length` in `src/content/en/sections/tinyverse.yaml`.
**Adding an app is adding one YAML entry.**

| Value | Rule |
|---|---|
| Orbit radius | evenly spaced across a 195–420 band; a lone app sits mid-band at 330, so the one-planet system is composed rather than sparse |
| Angular phase | `index × (2π / N)`, so planets never bunch on one side of the sun |
| Orbital speed | `√(330 / r)` — inner orbits run faster, because a real system is not a rigid wheel |
| Stage box | `aspect-ratio: 1000 / 520`, locked to the SVG viewBox |

The viewBox and the stage share one aspect ratio, so a viewBox unit is a fixed
fraction of the stage at every width. That is what lets the **first paint place
the planets in percentages** (correct before GSAP loads, and correct with no JS
at all) while the script switches to transforms afterwards, so no frame of the
orbit ever triggers layout.

`TILT` is `0.46` at every width: the orbits are a system seen at an angle, not a
top-down diagram. A per-breakpoint tilt was tried and dropped, because it forces
a second stage aspect ratio and the ellipse is already legible on a 342px column.

#### Material

- Orbit rings are **SVG hairlines** at 13% border colour, `non-scaling-stroke`
- The selected ring lifts to 20% **gold**, and the selected planet drags a short
  **lit wake** along its own path: a sampled arc under a `userSpaceOnUse`
  gradient whose endpoints are repointed every frame. Gold is edge light here,
  never fill, exactly as in the hero
- The sun carries the section's only light, in **two layers**: a small warm
  `--accent` core that ties to the gold in the logo mark, and a wide
  `--bg-accent` falloff reaching most of the way to the innermost orbit, with a
  tighter bloom over it so the mark stays legible against its own light. A
  single narrow purple wash was tried first and read as a smudge behind the
  mark rather than as a star lighting a system. The innermost ring is
  deliberately washed out by it: that planet is close to the star
- Each planet is a sphere whose **terminator faces the sun**: `--lit-x` /
  `--lit-y` are repointed every frame from the planet's own angle
- Depth is real, not decorative: planets on the near half of the orbit scale to
  1.0 and go fully opaque; the far half falls to 0.84 and 0.74, and `z-index`
  flips so they pass behind the sun
#### Bodies differ, and the difference means nothing

Each planet gets its own diameter (13–19px), one of six tones, and its own
terminator softness (36–48%), all **seeded from the app's `id`**: a planet looks
the same on every build and every reload. Nothing here uses `Math.random()`,
which is the trap this codebase already fell into once with the randomised
service-badge barcode.

**Tones and sizes are dealt without replacement**, not hashed independently.
Straight per-id hashing was tried twice and dropped both times: FNV-1a
avalanches poorly over short similar ids, and even with a murmur3 finalizer
three distinct ids landed on one tone, which reads as a bug rather than as a
coincidence. Each planet still chooses by its own hash, but only from the values
not yet taken, and the bag refills when it empties. The cost is that inserting
an app can shift the tone of the ones after it. That is a fair trade: what
mattered was never that a tone is immutable, only that it does not reroll on
refresh.

Tones are dealt in bags, in order, so **the four greens and browns go out
first**: a system of four apps is all bodies and no grey, silver and lilac join
once there are more than four, and the sequence refills past six.

| Tone | Value | Source |
|---|---|---|
| sage | `#9aa88f` | component-scoped |
| moss | `#78896f` | component-scoped |
| clay | `#ab8168` | component-scoped |
| umber | `#8a6a55` | component-scoped |
| silver | `--text-secondary` toward `--bg-accent` | site palette |
| lilac | `--bg-accent` toward `--text-primary` | site palette |

**The four hex values are a deliberate palette extension scoped to this
component**, declared on `.tinyverse` and used nowhere else. The site palette is
purple, gold and greys, and six tones mixed out of it gave six grey-to-lilac
bodies, because planetary bodies are not lilac. They are held at low chroma so
the system stays in the site's night, and the two token-derived tones are kept
alongside them so the planets still read as belonging to this page. If they ever
earn a place site-wide they belong in `src/design.config.ts`, not here. Gold
itself is excluded, being both the selection ring and the section's light. Every
body's limb derives from its own tone at 30% toward black.

**The specular carries a quarter of the body colour** rather than being pure
white, which is what a rough surface actually does, and the terminator band came
down from 46–58% to 36–48%. Both exist for the same reason: at pure white and
the higher band, the highlight covered most of a 15px body and every planet read
as grey whatever tone it carried.

**The variation encodes nothing, and is built so it cannot appear to.** The size
range is narrow, nothing is ordered by index, and there is no status, domain or
recency dimension behind any of it: bodies differ because bodies differ. A wide
size range or a red-to-green tone ramp would read as a ranking the data does not
support, which is what principle 4 forbids. `--dot-scale` shrinks every body by
one factor on mobile, so the dealt spread survives the breakpoint.

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

The spec panel **replaced a stock photograph** of an anonymous person at a laptop. For a visitor evaluating architectural judgement, a stock photo is anti-evidence; a specification is the artifact an architect actually produces. The photograph has been removed from the repo.

> ⚠️ Spec values are currently **placeholder** (`specPlaceholder: true` in the frontmatter of `src/content/en/work/consultant.md` and `src/content/en/work/startup.md`). `pnpm check:content` warns per chapter, and this check runs as part of `pnpm build`, and the markup carries `data-spec-placeholder`. They must be replaced with real figures before deploy.

#### Below 900px the card is the chapter's *cover*

Stacked, a chapter card was nine information blocks in one column: roughly
1250px of rectangle whose only action sat at the bottom. Four things were wrong
at once, and one of them was a plain bug: the 90px edge mask fades 46% of a
390px viewport, taking the card's own first and last words with it.

| Wide | Narrow (≤900px) |
|---|---|
| Card `75vw`, edge mask on the viewport | Card **100%**, **mask removed**: no neighbour is in view to soften |
| Arrows and `01/02` below the carousel | Controls **above** the card (`order: -1`), so paging is visible before the scroll |
| Track paged by `translateX` | Viewport is a real **`scroll-snap`** scroller: a full-width card that only answers to a 44px arrow reads as broken on touch |
| Cards stretched to equal height | `align-items: flex-start`: equalising heights only injects dead air above the shorter chapter's CTA |
| Spec `<dl>` of eight rows | Six placeholder rows collapsed; **Client and Years promoted** to one mono line, gold at 5.9:1 on the surface |
| Blocks always open | "What I held", "What it taught me" and the spec behind **one disclosure** |

The card that remains is arena, title, lede, credential line, roles, one
disclosure and the CTA: ~500px, with both actions inside the first screenful.
Nothing is deleted and nothing is deferred to `/work/[slug]`, which is still a
placeholder.

Mechanics worth keeping straight:

- **One button, two panels.** The copy blocks and the spec sit in different
  columns on desktop and cannot be wrapped in a shared element, so the state
  lives on the article (`data-fold`) and CSS opens both. `aria-controls` names
  both ids.
- **The wrappers dissolve above 900px.** `.card-fold`, `.fold-panel` and
  `.fold-inner` are `display: contents`, so the wide card lays out exactly as it
  did before the disclosure existed.
- **`grid-template-rows: 0fr → 1fr`** animates a real auto height, so the panel
  opens to whatever the copy needs. The panel's own `padding` would survive a
  zero-height row (`overflow: hidden` clips children, not the padding box), so
  the spacing is margins on the clipped children instead.
- **`visibility: hidden` when closed**, delayed on the way out. A zero-height
  panel is still read aloud, which would contradict `aria-expanded="false"`.
- The mobile entrance stagger targets the visible elements only; animating
  blocks inside a collapsed panel spends the stagger on nothing.
- `cards` is read as `.work-card`, not `track.children`: Astro injects a
  component's hoisted script at the component's own position, which for
  WorkCard is inside the track, and that stray element was being counted as a
  chapter (`01/03` for two chapters).

- **Certifications sub-section** below carousel:
  - Subdued header: "Certifications" in mono uppercase (count removed)
  - **Seamless auto-scroll track**: GSAP loops cards via cloned content + modulus `x` translation
  - Animation starts paused; `ScrollTrigger.onToggle` resumes when work section is in view
  - Issuer text raised from **8px to 11px** — that string authenticates the certification, so it is evidence, not fine print
  - Entire card links externally; edge-gradient mask on the viewport
  - Respects `prefers-reduced-motion` — static layout without GSAP

### Tinyverse Section (`#tinyverse`)

Standalone apps and proofs of concept, drawn as a **solar system**. The sun is
the site's own logo mark, the same inline SVG used in nav, footer and loading
screen: identity as the centre of gravity rather than as a caption. It links to
`/`, so the centre of the Tinyverse is always this page.

Header (section label, description, mono hint) on the rail, then a two-column
body: the stage left, and right a quiet thesis paragraph above the detail panel.
Below 1024px the body stacks and the stage is capped at 620px, which stops the
system dwarfing the panel beneath it.

#### Geometry is derived, never authored

Every number comes from `items.length` in `src/content/en/sections/tinyverse.yaml`.
**Adding an app is adding one YAML entry.**

| Value | Rule |
|---|---|
| Orbit radius | evenly spaced across a 195–420 band; a lone app sits mid-band at 330, so the one-planet system is composed rather than sparse |
| Angular phase | `index × (2π / N)`, so planets never bunch on one side of the sun |
| Orbital speed | `√(330 / r)` — inner orbits run faster, because a real system is not a rigid wheel |
| Stage box | `aspect-ratio: 1000 / 520`, locked to the SVG viewBox |

The viewBox and the stage share one aspect ratio, so a viewBox unit is a fixed
fraction of the stage at every width. That is what lets the **first paint place
the planets in percentages** (correct before GSAP loads, and correct with no JS
at all) while the script switches to transforms afterwards, so no frame of the
orbit ever triggers layout.

`TILT` is `0.46` at every width: the orbits are a system seen at an angle, not a
top-down diagram. A per-breakpoint tilt was tried and dropped, because it forces
a second stage aspect ratio and the ellipse is already legible on a 342px column.

#### Material

- Orbit rings are **SVG hairlines** at 13% border colour, `non-scaling-stroke`
- The selected ring lifts to 20% **gold**, and the selected planet drags a short
  **lit wake** along its own path: a sampled arc under a `userSpaceOnUse`
  gradient whose endpoints are repointed every frame. Gold is edge light here,
  never fill, exactly as in the hero
- The sun carries the section's only light, in **two layers**: a small warm
  `--accent` core that ties to the gold in the logo mark, and a wide
  `--bg-accent` falloff reaching most of the way to the innermost orbit, with a
  tighter bloom over it so the mark stays legible against its own light. A
  single narrow purple wash was tried first and read as a smudge behind the
  mark rather than as a star lighting a system. The innermost ring is
  deliberately washed out by it: that planet is close to the star
- Each planet is a sphere whose **terminator faces the sun**: `--lit-x` /
  `--lit-y` are repointed every frame from the planet's own angle
- Depth is real, not decorative: planets on the near half of the orbit scale to
  1.0 and go fully opaque; the far half falls to 0.84 and 0.74, and `z-index`
  flips so they pass behind the sun
#### Bodies differ, and the difference means nothing

Each planet gets its own diameter (13–19px), one of four tones, and its own
terminator softness (46–58%), all **seeded from the app's `id`**: an app's planet
looks the same on every build and every reload. Nothing here uses
`Math.random()`, which is the trap this codebase already fell into once with the
randomised service-badge barcode. Two ids sharing a prefix originally collided
onto one tone and one size, so the FNV-1a seed now runs through a murmur3
finalizer with a distinct salt per channel.

The four tones are **mixed from existing tokens**, never from new hex, so the
bodies cannot drift off-palette: silver (`--text-secondary` toward
`--bg-accent`), light and deep lilac (`--bg-accent` toward `--text-primary`),
and a warm ivory (`--text-secondary` with a trace of `--accent`). Gold itself is
excluded, being both the selection ring and the section's light. The limb of
every body derives from its own tone at 30% toward black.

**The variation encodes nothing, and is built so it cannot appear to.** The
range is narrow, nothing is ordered by index, and there is no status, domain or
recency dimension behind any of it: bodies differ because bodies differ. A wide
size range or a red-to-green tone ramp would read as a ranking the data does not
support, which is what principle 4 forbids. `--dot-scale` shrinks every body by
one factor on mobile, so the seeded spread survives the breakpoint.

#### Interaction

- **Scroll** through the section drives the orbital angle (`ScrollTrigger`,
  `top bottom` → `bottom top`), and a slow drift adds about one revolution every
  two minutes, running **only while the section is on screen**
- **Drag** spins the system, with an 8px intent threshold and a projected throw
  on release. Pointer capture is taken only once the threshold is crossed, and a
  capture-phase click handler cancels the activation a drag would otherwise fire
- **Selecting a planet turns the whole system** so that planet reaches the read
  position (front, left of centre, clear of the panel), on a 0.95s `power3.out`.
  The system moves, not just the marker
- Each planet is a real `<button>` with `aria-pressed`, inside a
  `role="group"` stage; `←` / `→` step the selection. The panel is
  `aria-live="polite"`
- **All panel content is server-rendered**, one card per app, toggled by the
  `hidden` attribute. No copy is ever built in JavaScript, which is what keeps
  the section inside the content rule
- **Deep link**: `?tiny=<id>` selects that app's planet on load, so a Tiny app
  can link back to its own planet with nothing but an anchor
- Under `prefers-reduced-motion` the system renders once at its home angle: no
  drift, no scroll response, no select tween. Drag still works, because drag is
  input, not animation

**Mobile (≤768px)**: the orbit survives rather than collapsing to a list. Sun
drops to 68px, planet bodies to 13px, and the planet labels are **clipped rather
than removed**, so each button keeps its accessible name.

### Chapter detail route (`/work/[slug]`)
Previously a dead end: no nav, no footer, and a dashed "PROJECT DETAIL COMING SOON" box behind the site's most inviting interaction.

- Now renders `<Nav />` and `<Footer />` — the page is never a trap
- Display-tier title (Archivo, up to 96px), arena line, 28px lede
- Two-column body: main content plus a **sticky spec panel** rail with role tags
- When `detail.projects` exists it renders projects with name / summary / outcome
- When it does not, an **honest holding state**: says the write-up is still being written, and offers a booking link ("Ask me about it on a call") instead of a dashed rectangle

### Not-found route (`/404`)

Replaces Astro's default 404. It carries `<Nav />` and `<Footer />` for the same
reason the chapter page does: a dead end is never allowed to be a trap.

**The failure is named in the site's own vocabulary.** Work here is presented as
Chapters, so an address with nothing behind it is a chapter that was never
written: *"This page has no chapter."* at display scale. No giant numeral, no
apology, no cartoon, and deliberately **no eyebrow above the heading**, even
though the chapter page carries an arena line in that slot.

The skeleton is the chapter page's, reused rather than reinvented: `.page` →
`.rail` → `.page-head` → `.page-body` as `minmax(0, 1fr) 320px` at a 72px gap,
**collapsing to one column at 1100px, not the chapter page's 900px.** The extra
200px is the door: this column carries a 600px fixed-width object beside a 320px
panel, so below 1100px the `1fr` track drops under 600 and the 48px label
orphans "start" on its own line. The chapter page has no such object and keeps
its 900px switch.

- **Left**: the lede at 28px, one explanatory paragraph, then **one door**. The
  door is the contact section's gold ticket block, same anatomy (title on the
  top line, note and 64px circular arrow sharing the foot), capped at **600px**
  so a 48px Archivo label holds on one line. The block is **164px**, not the
  contact block's 192px: with the title on one line, `space-between` across a
  taller box opened a trench between title and note and the note stopped
  reading as the foot of the ticket. Home is the only route offered;
  section shortcuts, an echo of the failed URL and a contact channel were all
  considered and declined.
- **Right**: an **inventory panel**, a `<dl>` of what does exist. A gold `404`
  status row, then Work chapters / Services / Tiny apps / Certifications. **Every
  count is read from the content collections at build time**, so the panel
  cannot drift from the site it describes, and the numbers are evidence rather
  than decoration. Below 900px the panel stays last: promoting it above the copy
  split the lede from the paragraph that answers it.
- The route is `noindex, follow` and carries **no canonical link** (a canonical
  URL is a claim the page is worth indexing). `BaseLayout` gained a `noindex`
  prop for it, and the sitemap excludes it.
- All copy lives in `src/content/en/sections/not-found.yaml`; the page title and
  description in `seo.yaml` under `pages.notFound`.

#### One entrance, two beats
The inherited GSAP `hero-text` y-stagger lifts the heading, lede, paragraph and
door in, and then the panel **rules itself up**: each `.spec-row::after`
hairline sweeps from `scale(0, 1)` on a 0.09s stagger, base delay 0.7s so the
sweep reads as the second beat rather than as noise under the first. Two
mechanics that are easy to get wrong and were:

- **`animation-fill-mode` is `both`, never `backwards`.** `backwards` fills only
  the delay, so every hairline reverted to its declared `scale: 0 1` the instant
  its run ended and the panel silently lost all five rules 1.1s after load.
- **The delay is driven by a `--row` custom property**, not by `:nth-child`, so
  adding a sixth row to a data-derived panel cannot produce a rule that sweeps
  with no delay.
- The stagger is declared inside `prefers-reduced-motion: no-preference`; the
  reduced-motion render is the finished sheet, fully ruled.

**The entrance hook sits on a `.action-slot` wrapper, never on the anchor.** GSAP
writes an inline `transform` for the y-stagger while the anchor's own
`transform` transition interpolates toward each frame of it, and the tween
stalled 29px short of zero with a dead hover lift. Same separation of transform
owners the service badges use.

`:focus-visible` gets the door's full response, lift and disc inversion and 3px
glyph travel, not just the disc.

### Contact Section (`#contact`)
The section whose job is to close. Three real channels, ranked, and nothing else.

**The hierarchy is geometric, not typographic.** Head above, full rail beneath it: one gold block, then the secondary pair side by side. The block is measured in secondary doors rather than in pixels: `--door: 110px`, `--door-gap: 16px` and `--door-span: 1.6` live on `.contact-actions` and are the only numbers the composition is built on. The pair is a `grid-auto-rows: minmax(var(--door), auto)` track, so the email address can push a door taller instead of overflowing it, and the block's `min-height` is `calc(var(--door) * var(--door-span) + var(--door-gap))` = **192px against a 110px door**.

`--door-span` was a flat `2` first, an exact `236 = 110 × 2 + 16`. The arithmetic was clean and the block read as an empty gold field rather than a lead action, so the span came down to 1.6. It is still plainly the largest element in the section; it is no longer the section's whole weight.

- Headline: "Let's Build Together" (Archivo display, `--size-section`, `--leading-tight`, `max-width: 22ch`)
- Lede at 21px carrying the voice, emoji accent preserved (`🤜🤛`). **Drops to 17px / `--leading-body` below 768px**, where 21px over a 342px column ran six lines and read as heavy as the heading above it.
- **The gold block is set like a ticket.** Its content spans the height rather than floating at the midpoint: `Book a call` in Archivo black at `--size-2xl` on the top line, the practical detail at the foot, and a 64px circular arrow affordance bottom-right on the note's line. `align-content: stretch` is declared alongside `align-items: stretch` because inheriting `align-content: center` from `.action` collapsed the row to its content height and the distribution silently did nothing.
- Arrow affordance inverts on hover and `:focus-visible` — dark fill, gold glyph, 3px glyph travel. It is an authored SVG, not a glyph.
- **Action order:** Book a call (gold block) → Message on LinkedIn → Email.
- **The facts rail was removed.** Availability and Based/timezone are no longer stated here; the availability claim lives in PRODUCT.md as a constraint on copy, not as page content. `availability` and `timezone` are gone from `src/content/en/site.yaml` with it. `base` stays, read by the hero base line.
- **Below 768px** the pair stacks, so the door ratio has no pair left to measure against. The block keeps its lead by scale alone at `min-height: 152px` with the title at `--size-xl` and a 48px arrow.
- All channels live in `src/content/en/site.yaml`, a single source of truth, read via `site()` from `src/lib/content.ts`

### Footer
- Inline logo SVG (same as nav) + "© 2026 Salvatore Cirone" in monospaced

---

## 5. Iconography & Image Assets

| File | Usage |
|---|---|
| `public/images/Hero.webp` | Hero portrait — 76 KB, 1440px, alpha preserved |
| `public/images/services/backend.png` | Backend service card avatar |
| `public/images/services/solution-architect.png` | Solution Architect avatar |
| `public/images/services/ai-engineer.png` | AI Engineer avatar |
| `public/images/services/digital-nomad.png` | Digital Nomad avatar |
| `public/images/social/linkedin.svg` | LinkedIn nav icon |
| `public/images/social/github.svg` | GitHub nav icon |
| `public/images/social/medium.svg` | Medium nav icon |
| `public/images/og/v1.png` | Open Graph share image |
| `public/favicon.svg` | Favicon (SVG) |
| `public/favicon.ico` | Favicon (fallback) |
| `public/fonts/archivo-latin[-ext].woff2` | Archivo variable (display) — self-hosted |
| `public/fonts/inter-latin[-ext].woff2` | Inter variable (body/UI) — self-hosted |
| `public/fonts/jetbrainsmono-latin[-ext].woff2` | JetBrains Mono variable (data) — self-hosted |
| `public/images/certifications/aws-sap.png` | AWS Solutions Architect Professional logo |
| `public/images/certifications/aws-dae.png` | AWS Data Engineer Associate logo |
| `public/images/certifications/hackerrank.png` | HackerRank logo |
| `public/images/certifications/ielts.png` | IELTS logo |

No external icon libraries — all icons are inline SVGs or static image files matching the industrial-tech aesthetic.

---

## 6. Motion & Animation

Powered by **GSAP** (plugins: ScrollTrigger, Draggable).

**Retired:** the 7-wave animated soundwave background. It was audio-waveform iconography on a page about cloud architecture — a borrowed motif from the wrong domain — and a second continuous background animation would have competed with the headline for the role of "the authored moment". The scroll-velocity machinery it pioneered was kept and repointed at the type.

| Pattern | Implementation |
|---|---|
| **Loading screen** | Logo rectangles animate in/out on loop, then whole screen fades out on `window.load` — **known cost, unchanged:** the overlay is opaque and removed only by that JS handler plus a 0.6s fade, so LCP cannot occur until every image, font and the GSAP bundle have loaded, and with JS disabled the page stays blank. Fixing it changes when the loader clears, which is a visible behavioural change, so it is deliberately out of scope for pixel-neutral work. |
| **Hero fade-in** | Portrait fades in (`power2.out`, 1s). Lede, base line and jump link stagger from below (`y: 30`, 0.12s) |
| **Headline load-in** | Archivo's variable `wdth` axis expands each line from `68` → `100` with a 0.13s stagger — type **arriving** rather than sliding. Runs once, on load, then settles permanently. Static at `wdth 100` under `prefers-reduced-motion`.<br><br>**The scroll-driven width response was removed.** Below 768px the lines are allowed to wrap, so a width change mid-scroll could re-wrap the headline and shift everything beneath it — a layout-stability bug on exactly the small screens it was least wanted on. |
| **Faceted light** | The hero's authored moment. Pointer-driven light over a seeded triangular lattice, with the portrait's gold rake reading from the same light. The figure itself is fixed; only the shading moves. Redraws only on light movement. Measured at a locked 60fps during a continuous pointer sweep: median 16.7ms, p95 17.7ms, worst 19.2ms, zero frames over 32ms. Renders once and never loops on touch or reduced-motion. |
| **Section reveal** | ScrollTrigger on `data-animate="section"` — children stagger in from `y: 30` when section enters 85% viewport |
| **Services scroll-trigger** | Header + hint text stagger in on scroll |
| **Badge pick-up** | On drag intent: `scale 1.045`, `y -12`, deepened shadow, and `rotation` driven by pointer velocity so the badge lags the hand. Release settles on `back.out(1.7)`. Applied to `.badge-lift`, a layer the per-frame deck layout never touches. |
| **Badge flip** | `rotateY(180deg)` on `.badge-inner` with `preserve-3d` and `backface-visibility: hidden`, 0.62s. Toggled by `aria-expanded`; transition removed under `prefers-reduced-motion` while the flip itself still works. |
| **Nav link hover** | Text translates up `-4px`, font-weight bolds to 700 |
| **Tinyverse nav mark** | A body travels a squashed ellipse on a CSS `offset-path` while the link is hovered or focused, and freezes in place when it is not. No GSAP: the animation is paused, not removed, which is what preserves the position. |
| **Nav breakpoint transition** | Desktop ↔ mobile swap at 768px: desktop items fade up/out (or down/in with stagger on re‑entry), burger cross‑fades. Sidebar closes via `clearProps` |
| **CTA hover** | "Let's meet" fades up out, "Book now" fades in from below |
| **Work carousel** | CSS transform slide + GSAP text stagger on each card entry |
| **Tinyverse orbit** | Orbital angle is the sum of scroll progress, drag, idle drift and the select tween. Input-driven first: scroll and drag are the primary movers, and the drift is slow enough to read as a system at rest rather than a loop playing at the visitor. Runs only while the section is in view, never under `prefers-reduced-motion`. |
| **Tinyverse selection** | The system turns to bring the selected planet to the read position, 0.95s `power3.out`, while its orbit lifts to gold and its wake arc follows it. |
| **Work card text entry** | Counter, title, description, roles stagger in from `y: 24` on first view |
| **Certifications auto-scroll** | Seamless GSAP loop (cloned cards, modulus `x`). `ScrollTrigger.onToggle` pauses/resumes with work section visibility. Edge-gradient mask for smooth fade. |
| **404 rule-in** | The not-found route's authored moment, and pure CSS. The inventory panel's five hairlines sweep from `scale(0, 1)`, 0.09s stagger off a `--row` property, 0.7s base delay so they land after the inherited `hero-text` stagger. `animation-fill-mode: both`, gated behind `prefers-reduced-motion: no-preference`. |

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
- **`.sr-only`** (global, authored beside `.skip-link`): the visually-hidden
  utility. `position: absolute` + `1px` box + `clip-path: inset(50%)`.
  Deliberately **not** `display: none` and **not** `visibility: hidden`, both of
  which drop the node from the accessibility tree. That distinction is the whole
  point: the hidden hero `<h1>` is a real heading a screen reader announces
  first, not text addressed only to crawlers. Verified present in Chrome's
  accessibility tree with the outline reading `h1` name/role → `h2` display
  headline → `h2` section labels.
- One `<h1>` per page: the hidden identity heading on `/`, the chapter title on
  `/work/[slug]`. Section labels are `<h2>`.
- Full OpenGraph + Twitter Card meta, and a connected JSON-LD graph:
  `Person` (with `@id`, `worksFor`, and `hasCredential` for the four
  certifications) ← referenced by `WebSite.author/publisher` and, on the home
  page only, by `ProfilePage.mainEntity`. Chapter pages add a `BreadcrumbList`.
  Canonical, every `og:*` URL and the sitemap all name the apex host.
- Scroll-triggered animations respect `prefers-reduced-motion: reduce` — skipped entirely
- `scroll-margin-top: var(--nav-height)` on each section for anchored nav
- `::selection` styling for branded highlight
- Hero collapses to single-column stacked layout below 768px
- Work card switches to single-column grid below 900px, where it also becomes a collapsed *cover* with one disclosure; the carousel becomes a `scroll-snap` scroller and the edge mask is dropped
- The card CTA stretches to the full column only below 560px; at 820px a stretched button is a 734px bar
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
7. **Single-page rhythm** — sections flow hero → services → work → tinyverse → contact → footer, each with distinct layout but unified visual language
