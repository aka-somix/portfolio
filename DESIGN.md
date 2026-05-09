# DESIGN.md — daveholloway.uk
> Design document extracted from [daveholloway.uk](https://daveholloway.uk/)  
> Author: Dave Holloway — Full-Stack Freelance Designer, Creative Developer & Strategist, Leeds (UK)  
> Built with: Astro v5 (with View Transitions)

---

## 1. Overview & Aesthetic Direction

The site is a **dark, editorial-brutalist portfolio** with a strong industrial/utilitarian edge softened by fluid animations and expressive motion. The overall tone sits between:

- **Editorial magazine** — dense, structured information grids with coded labels and alphanumeric markers
- **Industrial brutalism** — raw uppercase labelling, functional tags, arrow iconography
- **Hi-fi minimalism** — dark background, restrained palette, generous white space

The single-page design scrolls through anchored sections: `#work`, `#services`, `#about`, `#contact`, plus a separate `/lab` route.

---

## 2. Colour Palette

| Role | Description |
|---|---|
| Background | Very dark (near-black) — likely `#0a0a0a` or `#0d0d0d` |
| Surface / Cards | Slightly lifted dark surface — ~`#111` or `#141414` |
| Primary Text | Off-white / light grey — ~`#e8e8e8` or `#f0f0f0` |
| Accent / Highlight | Likely a sharp warm neutral or a single pop colour (to be verified from source CSS) |
| Tag/Label Text | Muted uppercase grey — ~`#666` or `#888` |
| Borders/Dividers | Thin, low-contrast lines — ~`#222` or `#2a2a2a` |

The palette is **dominant dark with sharp, minimal accents**. No gradients or colour washes. The contrast is achieved through spatial organisation rather than colour variety.

---

## 3. Typography

| Role | Characteristics |
|---|---|
| Display / Hero | Large, bold, possibly a geometric sans or condensed display font. The word "Hey!" uses a standout weight/style. |
| Navigation | Uppercase, tight-tracked, small — functional and label-like |
| Section Headings (`## Work`, `## Services`, etc.) | All-caps or sentence case with significant weight contrast |
| Body Copy | Smaller, readable weight — clean and editorial |
| Labels / Tags | Monospaced or near-mono impression; all caps; used for service codes like `WEB`, `DEV`, `STR`, `BRD`, `GFK`, `MOT`, `ILL`, `CRD` |
| Alphanumeric Codes | Technical-looking date/number strings (e.g. `06-20-12`, `02-20-03`) — monospaced feel |

**Key typographic moves:**
- Service cards display dual-label codes (e.g. `WIR → PRO`, `FRO → BCK`) with a long arrow `→`, indicating a process or range
- Client abbreviations appear as 3-letter codes (`SVF`, `CBS`, `KSG`, `NHS`, etc.) — like ticker symbols
- Counter/pagination style: `1/12`, `2/12`, ... `12/12`

---

## 4. Layout & Grid

### Global Layout
- Full-width, single-column scroll
- Anchored sections with `id` hooks (`#work`, `#services`, `#about`, `#contact`)
- Sticky or fixed navigation bar at the top
- View Transitions enabled via Astro (`meta-astro-view-transitions-enabled: true`)

### Navigation
```
[Logo SVG]   [Work]  [Services]  [About]  [Contact]  [Lab]   [Let's talk →]
```
- Logo: SVG (`/dh-logo.svg`) — left-aligned
- Nav items duplicated in DOM (likely for animation/split-text effect)
- CTA button: `Let's talk` with secondary label `Fun Stuff` (toggle/hover state)
- Link to external Calendly booking

### Hero Section
- Minimal: single `<h1>` — "Hey!"
- Short paragraph introduction (name, role, location)
- Animate in on load — likely GSAP-driven stagger

### Work Section (`#work`)
12-item project grid/carousel. Each card contains:
```
[3-letter client code]   CLIENT (label)
[Project Name]           (heading)
[Tag ▼] [Tag ▼] [Tag ▼]  (service tags with down-arrow icons)
[/work/slug]             (path link)
[N/12]                   (counter)
```
- Background: `langbar-bg.svg` — a decorative SVG landscape/topographic element between sections

### Services Section (`#services`)
8 service cards in a grid. Each card:
```
[SERVICE CODE]  (e.g. WEB, DEV, STR...)
[Date code]     (e.g. 06-20-12)
SERVICE (label)
[Service Name]  (heading)
[▲ Tag] [▲ Tag] [▲ Tag] [▲ Tag]   (top row — "up" tags)
[▼ Tag] [▼ Tag] [▼ Tag] [▼ Tag]   (bottom row — "down" tags)
[CODE] —————————→ [CODE]           (spectrum/range label with long arrow)
```
The triangle icons (`triangle-up.svg`, `triangle-down.svg`) indicate hierarchy or direction within each capability.

### About Section (`#about`)
Two-column layout:
- **Left/BIO**: Two paragraphs of biography
- **Right/Roster**: Bullet list of notable clients (Kantar, NHS England, Mother London, etc.)

Below: scrolling ticker of **awards** (marquee/infinite scroll):
```
FWA FOTD x2 · Awwwards HM x4 · CSS Design Awards SOTD x1 & SK x4 · ...
```
(Content duplicated for seamless loop)

Also contains a scoreboard-style element:
```
HOME 0  -  AWAY 0
```
(Likely a fun interactive easter egg or decorative counter)

### Contact Section (`#contact`)
- Headline: "Ready to play?"
- Email: `hello@daveholloway.uk` (displayed as a large link)
- Phone: `+44 (0)113 460 7989`
- CTA: "Book a video call" → Calendly link

### Footer
- Minimal: `© 2026 Dave Holloway`

---

## 5. Iconography & SVG Assets

| File | Usage |
|---|---|
| `/dh-logo.svg` | Main site logo (nav) |
| `/triangle-up.svg` | Tag directional indicator (upward capability/skill) |
| `/triangle-down.svg` | Tag directional indicator (downward/tool/output) |
| `/arrow-long.svg` | Long horizontal arrow between service spectrum codes |
| `/langbar-bg.svg` | Decorative landscape SVG background between Work and Services sections |
| `/og-image-default.webp` | Open Graph social share image |

All icons are inline SVG files — minimal, likely line-drawn or geometric, matching the industrial aesthetic.

---

## 6. Motion & Animation

The site uses **GSAP** extensively (listed as a core development skill). Key animation patterns:

| Pattern | Implementation |
|---|---|
| **Page load stagger** | Hero text + nav items animate in with staggered delays |
| **View Transitions** | Astro's built-in view transitions with `animate` fallback — smooth between pages |
| **Awards ticker** | Infinite marquee/scroll loop for the awards strip |
| **Hover states** | Navigation items appear duplicated in DOM — likely a split-text clip/slide hover effect |
| **CTA button** | "Let's talk / Fun Stuff" dual-label suggests a flip or slide-in hover animation |
| **Work cards** | Likely scroll-triggered reveal on entry |
| **Service cards** | Possible stagger or reveal animation on scroll |

---

## 7. Navigation Interaction Pattern

The nav items are doubled in the HTML (e.g. `WorkWork`, `ServicesServices`). This is a classic **GSAP/CSS split-text hover animation** technique:

```html
<a>[Work][Work]</a>
```

Two copies are stacked; on hover, one slides out (up or down) while the second slides in — creating a fluid text-replacement animation on hover.

---

## 8. Content Strategy & Voice

- **Tone**: Confident, direct, self-aware without being arrogant. Casual intro ("Hey!"), professional credibility signal (16 years, multi-award-winning).
- **Credibility stacking**: Long award list, recognisable client names, specific tools and skills
- **"Ready to play?"** — playful closing CTA that matches the "Fun Stuff" nav label; humanises without losing authority
- **`/lab`** section — separate space for experimental/personal work, signals curiosity and craft
- **3-letter client codes** (`SVF`, `CBS`, `NHS`) — editorial shorthand that gives the work section an architectural, data-driven aesthetic

---

## 9. Technical Stack

| Technology | Role |
|---|---|
| **Astro v5** | Static site framework with View Transitions |
| **GSAP** | Primary animation library |
| **WordPress / Bricks** | Client project delivery (not used on this site itself) |
| **Figma** | Design tool |
| **CSS/HTML/JS** | Core frontend |
| **Git** | Version control |

---

## 10. Responsive & Accessibility Notes

- `viewport-fit=cover` with `interactive-widget=resizes-content` — optimised for mobile notch/safe areas
- `<a href="#main-content">Skip to main content</a>` — accessibility skip link present
- `meta-description` and full OpenGraph + Twitter Card meta — social/SEO complete

---

## 11. Key Design Principles (Inferred)

1. **Data over decoration** — labels, codes and alphanumeric strings replace ornamental illustration
2. **Motion as language** — every transition and animation carries meaning (hover = replace, scroll = reveal)
3. **Dark = focus** — dark background removes visual noise, forces attention onto content
4. **Typography does the heavy lifting** — weight, size, and case contrasts create hierarchy without colour
5. **Systems thinking** — service cards follow a strict repeatable structure; work cards follow another; both feel part of one coherent system
6. **Editorial restraint** — generous whitespace, minimal UI chrome, no decorative gradients
7. **Playful details** — the HOME/AWAY scoreboard, the "Fun Stuff" CTA label, the `/lab` — humanity hidden inside the rigour
