# DESIGN.md — Salvatore Cirone Portfolio
> Author: Salvatore Cirone — Senior Backend Engineer & AWS Architect  
> Built with: Astro v6 (static, no SSR)

---

## 1. Overview & Aesthetic Direction

A **dark, tech-forward portfolio** with a purple/night palette punctuated by gold accents and fluid motion. The tone balances:

- **Editorial clarity** — structured sections with clear hierarchy, monospaced labels, alphanumeric counters
- **Industrial tech** — uppercase functional labels, barcode decorative elements, monospaced detail text
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

| Role | Font | Weight |
|---|---|---|
| Display (hero heading, section labels) | Inter | 800 (extra bold) |
| Card titles, subheadings | Inter | 600–700 (semi-bold / bold) |
| Body copy | Inter | 400 (regular) |
| Labels, counters, metadata | JetBrains Mono | 400–500 |
| Nav links, CTA | Inter | 400 (uppercase, letter-spaced) |

**Key typographic moves:**
- Section labels use large bold Inter with tight letter-spacing (`-0.03em`)
- Monospaced counters follow `01/01` pattern for work carousel, `04` for services count
- Role tags are uppercase monospaced with border (e.g. `ARCHITECTURE`, `BACKEND`, `AWS`)
- Nav links are uppercase `0.75rem` with `0.12em` letter-spacing

---

## 4. Layout & Grid

### Global Layout
- Full-width, single-column scroll
- Anchored sections with `id` hooks (`#services`, `#work`, `#contact`)
- Fixed navigation bar at top (`--nav-height: 64px`)
- Max inner width: `2000px`

### Navigation
```
[Logo SVG]   [Services]  [Work]  [Contact]   [LinkedIn] [GitHub]   [Let's meet ▸]   [☰]
```
- Logo: Inline SVG (abstract geometric rect composition) — left-aligned
- 3 nav links (Services, Work, Contact) — right-aligned before socials
- Social icons (LinkedIn, GitHub SVG) — muted opacity, hover to full
- CTA button: "Let's meet" with secondary label "Book now" (CSS flip on hover). Links to a Google Calendar booking page (appointment schedule) in a new tab — URL is the `BOOKING_URL` constant in Nav.astro
- **Mobile (≤768px)**: desktop links/socials/CTA hidden; burger icon appears. Clicking opens a sidebar that slides in from the left with the same items. Overlay backdrop + GSAP stagger on links. Escape/overlay/link-click closes. GSAP nav-link hover code lives in Nav.astro's own `<script>`.
- **Breakpoint transition**: GSAP animates the swap — desktop items fade up/out, burger fades in (mobile) and vice‑versa (desktop). Stagger on desktop items re‑entry. Sidebar auto‑closes on resize to desktop via `clearProps`.

### Hero Section
- Full-viewport height split layout: 48% left empty, 52% right image column
- Image column: hero portrait (`/images/Hero.png`), bottom-right aligned, `object-fit: contain`
- **Soundwave animation**: 7 dynamically-generated SVG sine waves behind hero content, amplitude/frequency responsive to scroll velocity
- Overlaid card (bottom-left, 38% width):
  - `background: rgba(21, 23, 61, 0.55)` with `backdrop-filter: blur(4px)`
  - "Ciao!" heading (Inter 800, `clamp(3.5rem, 8vw, 6.5rem)`)
  - 3px gold accent divider
  - Introduction paragraph + tagline in monospaced uppercase

### Services Section (`#services`)
- Header: "Services" (large section label) + counter `04`
- Hint text: "Drag to explore" in monospaced uppercase
- **Draggable card deck**: 4 cards positioned absolutely in a track, controlled by pointer drag with GSAP
  - Cards snap to nearest slot on release
  - Stack left when pushed past the last card (layered with offset x/y/rotation)
- Each card (360×200px, glassmorphism surface):
  - Circular avatar image (56×56px, `border-radius: 50%`)
  - Randomized barcode decoration (32-bit visual pattern)
  - Title + description text

### Work Section (`#work`)
- Header: "Work Chapters" + counter `01`
- **Horizontal carousel** with arrow navigation and `01/01` monospaced indicator
- Cards are 75vw wide, 3/2 aspect ratio, two-column grid:
  - **Left**: counter (`01/01`), title, description, role tags (bordered monospaced pills)
  - **Right**: placeholder image SVG + "Look inside 👀" CTA arrow link
- Carousel uses CSS transform + GSAP text stagger on slide
- Indicator reads `01/01`, `02/01`, etc.
- **Certifications sub-section** below carousel:
  - Subdued header: "Certifications" `03` in monospaced uppercase (`0.9rem`, muted)
  - **Seamless auto-scroll track**: GSAP loops cards continuously via cloned content + modulus `x` translation
  - Animation starts paused; `ScrollTrigger.onToggle` resumes when work section is in view, pauses on leave
  - Cards (280px wide, glassmorphism surface, same gradient/card language):
    - Circular logo (72×72px) with `<img>` fallback to SVG star badge on error
    - Certification name (Inter 600, centered)
    - Issuer (JetBrains Mono, uppercase, muted, centered)
  - Entire card links externally (`target="_blank" rel="noopener noreferrer"`)
  - Edge-gradient mask on viewport for smooth fade in/out
  - Hover: border brightens, card lifts `-4px`, shadow deepens
  - Respects `prefers-reduced-motion` — static layout without GSAP

### Contact Section (`#contact`)
- Headline: "Let's Build Together" (Inter 800)
- Two-column grid:
  - Bio paragraph with playful emoji accent
  - Email: `s.cirone.work@gmail.com` with underline hover effect

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
| `public/images/certifications/aws-saa.png` | AWS Solutions Architect logo |
| `public/images/certifications/gcp-pca.png` | Google Cloud Architect logo |
| `public/images/certifications/cka.png` | CKA logo |

No external icon libraries — all icons are inline SVGs or static image files matching the industrial-tech aesthetic.

---

## 6. Motion & Animation

Powered by **GSAP** (plugins: ScrollTrigger, Draggable).

| Pattern | Implementation |
|---|---|
| **Loading screen** | Logo rectangles animate in/out on loop, then whole screen fades out on `window.load` |
| **Hero fade-in** | Image column fades in (`power2.out`, 1s). Hero text stagers in from below (`y: 30`, 0.12s stagger) |
| **Soundwave animation** | 7 SVG sine waves, continuous GSAP loop, scroll-responsive speed/amplitude/frequency/opacity/width |
| **Section reveal** | ScrollTrigger on `data-animate="section"` — children stagger in from `y: 30` when section enters 85% viewport |
| **Services scroll-trigger** | Header + hint text stagger in on scroll |
| **Services drag** | Custom pointer-drag deck with snap-to-nearest, momentum, stacked card layout via GSAP set |
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

---

## 11. Key Design Principles

1. **Depth through colour** — a purple/night palette creates a moody, premium feel; gold accents provide focal anchors
2. **Motion as interaction** — the draggable service deck, scroll-reactive soundwaves, and carousel all invite tactile exploration
3. **Typography as hierarchy** — weight and size contrasts (800 → 600 → 400) structure information without relying on colour
4. **Decorative data** — the barcode pattern on service cards, the soundwave animation, and counters give technical texture without real data overload
5. **Restrained palette, expressive motion** — only 2 accent colours (gold, purple) but rich animation vocabulary
6. **Human details** — "Ciao!" greeting, playful emoji, "tech nomad" framing — personality within a professional container
7. **Single-page rhythm** — sections flow hero → services → work → contact → footer, each with distinct layout but unified visual language
