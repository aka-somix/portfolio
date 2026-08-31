# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences read the same page, in this priority order:

1. **Prospective clients (primary)** — founders, CTOs, and engineering leads evaluating Salvatore for consulting or advisory work. They arrive from a referral, a LinkedIn profile, or a conversation already in progress, and are deciding whether this is a person worth a call.
2. **Hiring managers and recruiters (secondary)** — evaluating him for a senior backend/architecture role. They read the same Work Chapters and certifications and must come away with the same credibility.

The site is not built for a cold, high-volume audience. Traffic is low-intent-volume, high-intent-per-visitor: most visitors already know the name and are verifying the person behind it.

## Product Purpose

A single-page personal portfolio for **Salvatore Cirone** — Senior Backend Engineer and Cloud Solutions Architect — that establishes who he is, how he thinks, and what he has actually built.

Success is **being remembered accurately**, not a conversion event. There is no funnel to optimise. A visitor succeeds when they leave with a correct and specific impression of Salvatore's technical depth, working style, and personality, strong enough to recall unprompted later. Booking a call and emailing are both available and both real, but neither is the goal the design serves.

This makes the site closer to an *impression* artifact than a lead-generation page: memorability, distinctiveness, and truthfulness outrank persuasion mechanics.

## Positioning

The differentiator is the **combination**, not any single credential: deep backend and AWS architecture practice, current hands-on AI engineering work, and a genuinely location-independent working life ("digital nomad"). Most senior backend profiles have one or two of these. The nomad dimension is real operating experience, not a lifestyle aesthetic — it is offered as a service ("Digital Nomad Consulting") because it is practised.

A neighbouring portfolio could copy the palette and the motion. It could not truthfully copy "architect who ships AI features and has run senior delivery work from anywhere in the world."

## Operating Context

- **Site**: `https://salvatorecirone.dev` — static Astro build deployed to Cloudflare (Wrangler). This apex host is canonical; `about.salvatorecirone.dev` was the previous host and 301-redirects here. `seo.yaml` `siteUrl` and `astro.config.mjs` `site` must both name it.
- **Structure**: single-page scroll — hero → services → work → tinyverse → contact → footer — plus dynamic `/work/[slug]` chapter detail pages.
- **Content sources**: all copy lives in `src/content/en/**` (YAML sections + Markdown chapters), is schema-validated in `src/content.config.ts`, and is read only through `src/lib/content.ts`. There is no `src/data/` directory. Content changes belong in content files, never in components. See `CONTENT.md`.
- **Design tokens**: centralised in `src/design.config.ts`, injected as CSS custom properties by `BaseLayout.astro`.
- **Contact channels**: `s.cirone.work@gmail.com` and a Google Calendar appointment-schedule booking link (`BOOKING_URL` in `Nav.astro`). Both are live and real.
- **Reading situation**: visitors arrive on desktop and mobile in roughly equal measure; the page is often opened mid-conversation (a link shared in a chat or email thread), so the first viewport carries disproportionate weight.

## Capabilities and Constraints

**Availability (binding claim):** Salvatore is employed at xFarm Technologies **and open to select projects**. Copy may invite project enquiries and advisory conversations. It must not imply full-time freelance availability, an agency, or a team.

**Work Chapters:** framed as narrative chapters of a career rather than a client portfolio. Two exist today:
- `consultant` — Reply; architecture, backend, AWS. Has real copy.
- `startup` — xFarm Technologies; architecture, backend, AI engineering. **Description is currently empty — an acknowledged content gap, not a design decision.**

**Chapter detail pages are committed work.** `/work/[slug]` currently renders a "Project detail coming soon" placeholder. Real case-study pages are planned for each chapter; future design work should build toward full detail pages rather than removing the route or treating the cards as terminal.

**Evidence clearance:** specifics are permitted. Named clients (Reply, xFarm Technologies), real architecture detail, stack, and outcomes may all be described in chapter case studies. Salvatore supplies the facts — the constraint is that facts come from him, never from inference.

**Technical constraints:**
- Astro v6, static output only, no SSR.
- GSAP is the only runtime dependency (ScrollTrigger + Draggable). Additional animation or UI libraries are a deliberate decision, not a default.
- Node >= 22.12.0, pnpm.
- No tests, linter, or typecheck script configured.
- Content is English-only (`lang="en"`); no i18n requirement established.

**Undecided / open:**
- Whether services remain four fixed offerings or become a living list.
- Whether more Work Chapters are added beyond the two current ones.

## Brand Commitments

- **Name and identity**: Salvatore Cirone. Titles used in production: Senior Backend Engineer, Cloud Solutions Architect, AI Engineer.
- **Voice**: professional but warm and first-person. Italian-inflected personality is deliberate — the hero opens on "Ciao!". Self-description is "a digital nomad who turns complex cloud and AI challenges into elegant realities". Playful punctuation (emoji as accent, e.g. `🤜🤛`, `👀`) is in-voice, used sparingly as texture rather than decoration.
- **Framing**: work is presented as "Chapters" — a career narrative, not a case-study catalogue.
- **Logo**: inline SVG geometric rect composition, used in nav, footer, and loading screen.
- **Assets on hand**: hero portrait (`public/images/Hero.webp`), four service avatars, four certification logos, social icons, OG image, favicons. `public/` holds no unreferenced assets.

## Evidence on Hand

**Real and verifiable:**
- AWS Solutions Architect Professional (SAP-C02)
- AWS Data Engineer Associate (DAE-C01)
- IELTS Academic Band 8.0 — British Council
- Software Engineer Certificate — HackerRank (public credential link)
- Employment: Reply (consulting), xFarm Technologies (current)
- LinkedIn and GitHub profiles, linked in nav and JSON-LD

**Absences that must not be fabricated:** no client testimonials, no named case-study metrics, no press coverage, no open-source project showcase, no revenue or team-size claims, no awards. The `startup` chapter has no written description yet. `/work/[slug]` has no real content yet. Future work must leave these visibly absent or ask Salvatore to supply them — never invent a quote, a number, or an outcome.

## Product Principles

1. **Memorability over conversion.** There is no funnel to optimise. Design decisions are judged by whether a visitor could describe this person accurately a week later.
2. **The combination is the claim.** Backend depth + cloud architecture + AI engineering + genuinely nomadic practice. Any presentation that flattens this into "senior backend engineer" has lost the positioning.
3. **One page must serve two readers.** Client-first, but never at the cost of credibility with a hiring manager reading the same words.
4. **Personality is load-bearing, not decoration.** "Ciao!", the emoji, the chapter framing — these carry the impression the site exists to create. Sanding them off makes the product fail its own goal.
5. **Never fabricate proof.** Specifics are welcome and permitted, but every specific comes from Salvatore. An absent testimonial stays absent.
6. **Chapters are unfinished, not finished-small.** Detail pages are committed work; design for the full case study, not around its absence.

## Accessibility & Inclusion

No audience-specific accessibility requirement was established beyond standard practice. Existing commitments in the implementation are treated as a floor to preserve: skip-to-content link, `prefers-reduced-motion` honoured (scroll and auto-scroll animations skipped entirely), `viewport-fit=cover` safe areas, and `scroll-margin-top` on anchored sections.
