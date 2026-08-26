---
target: the current site
total_score: 17
max_score: 32
na_heuristics: 9,10
p0_count: 2
p1_count: 3
timestamp: 2026-08-26T14-38-14Z
slug: src-pages-index-astro
---
Method: dual-agent (A: design review · B: detector + browser evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Services deck hides 3 of 4 cards with zero position indicator. No nav active-section state. Loading screen loops with no progress. |
| 2 | Match System / Real World | 3 | "Chapters", "Ciao!", "Look inside 👀" genuinely well-matched. Docked for the randomised barcode (`ServiceCard.astro:11`) and "Project image" placeholder leaking system artifacts. |
| 3 | User Control and Freedom | 2 | `/work/[slug]` renders no nav and no footer — only exit is a 12.8px mono "Back". Deck cannot be stepped or keyboard-driven. Cert auto-scroll cannot be paused. |
| 4 | Consistency and Standards | 1 | 21 hard-coded font-sizes, zero type tokens. `.section-label`/`.section-description` duplicated across two components with different margins. Three section-heading scales. Four mono tracking values for one role. |
| 5 | Error Prevention | 3 | `rel="noopener noreferrer"` correct throughout. Docked: `Nav.astro:14` logo is `href="#"` no-op; startup card links to a placeholder. |
| 6 | Recognition Rather Than Recall | 2 | No nav active state, no deck indicator, no cue that only 2 chapters exist. Service cards readable only one at a time. |
| 7 | Flexibility and Efficiency | 2 | No keyboard path through the services deck at all. No way to reach booking from the contact section. No CV/PDF for the hiring-manager audience. |
| 8 | Aesthetic and Minimalist Design | 2 | Strong palette undermined by three large dead zones, 5px white section rules, and the IELTS logo rendering as a bright white box in a dark card. |
| 9 | Error Recovery | n/a | Static page with no error states; the one failure surface (cert logo onerror → SVG fallback) is already handled. |
| 10 | Help and Documentation | n/a | Nothing here requires documentation; the one learned interaction (drag) is handled inline by hint text. |
| **Total** | | **17/32** | **Acceptable (53%) — significant improvements needed** |

## Design Specificity Verdict

**LLM assessment:** Not authored for this product. It is a competent dark dev-portfolio template wearing Salvatore's face. Strip the portrait and the copy in `src/data/*.ts`, drop in any other senior engineer, and every line of CSS still works.

- Inter 400–800 + JetBrains Mono 400–500 (`design.config.ts:20-21`) is the single most common dev-portfolio pairing in existence. It labels the positioning; it does not carry it.
- The one bespoke motion idea is borrowed from the wrong domain: `Hero.astro:200-245` generates 7 SVG sine waves — audio-waveform iconography — behind a page about cloud architecture. No map, no region, no topology, no route, no trace.
- The "technical texture" is fake data: `ServiceCard.astro:11` is `Math.random() > 0.5` × 32 — decoration cosplaying as information, on a page whose job is credibility.
- `--max-width: 2000px` (`design.config.ts:31`) means no container at any real viewport — a default, not a decision.

Against Product Principle 2 ("the combination is the claim"), the page reads as "senior backend engineer, dark theme." AI appears once as card 3 of 4. Nomadism is one 12px mono line plus a service card about "work-life balance" — lifestyle framing, not the operating-experience framing PRODUCT.md requires.

**Deterministic scan:** CLI detector exit 2, 2 findings — `overused-font` (`design.config.ts:23`, Inter) and `em-dash-overuse` (advisory, `BaseLayout.astro`, 21 em-dashes largely in code comments; low-confidence). Browser detector on the homepage: **22 anti-patterns**, grouped — `undersized-ui-text` ×9, `gray-on-color` ×5, `ai-color-palette` ×4, `numbered-section-labels` ×2, `all-caps-body` ×1, `clipped-overflow-container` ×1, `low-contrast` ×1, `overused-font` ×1. Both work detail routes returned clean, but `/work/startup` has only 69 characters of text, so its clean result carries no signal.

Detector caught what the review did not: **`.nav-link` and `.sidebar-link` gold `#EEA727` on purple `#85409D` measure 3.17:1 against a 4.5:1 requirement** — independently confirmed by direct computation. Every gold-on-ink pairing passes comfortably (8.89:1); the failure is nav/sidebar/footer only. Also: **22 text-bearing elements below 12px**, worst being `.cert-issuer` at **8px** ×8.

Not false positives: `ai-color-palette` and `gray-on-color` are the site's own tokens, not overlay artifacts. `em-dash-overuse` is the detector's own advisory and mostly hits code comments — discount it.

**Browser console — two real site-code errors on every page load:**
```
[warning]   Please gsap.registerPlugin(ScrollTrigger)
[pageerror] _context2 is not a function
```
Identical at 1440/390/320 and on both detail routes. Six accompanying 404s are Astro dev-toolbar chunks, dev-only, ignorable. The GSAP warning plus the thrown error are not — they mean ScrollTrigger may not be registered when the animation code runs, so section reveals and the certification auto-scroll can silently fail in production.

**Visual overlays:** injection succeeded and the detector ran in-page; overlay screenshots were captured to the scratchpad. The live server was stopped and the dev server on :4321 shut down before reporting, so no overlay tab is currently open for you to look at.

## Overall Impression

The palette and the illustrated portrait are genuinely memorable and are doing all the work. Everything structural around them is interchangeable, and the two things a visitor is asked to engage with most — the services deck and "Look inside 👀" — are respectively unusable on mobile and a dead end.

The single biggest opportunity: **the display tier is spent on "Ciao!" while the sentence that carries the entire product claim sits at 16px grey.** 104px of extra-bold type is given to a greeting; "a tech nomad who turns complex cloud and AI challenges into elegant realities" is set at the same size and colour as form helper text. Fix that inversion and the "no oh-wow headline" problem largely solves itself — no added motion can substitute for a headline that says something.

## What's Working

1. **The chroma plus the illustrated portrait.** `#15102f` night-purple with a single gold accent is a disciplined two-accent palette, and the low-poly portrait is why it holds — it survives at any size, can't go stale like a headshot, has real personality in the upward gaze, and its gold-adjacent tones tie to the logo. Against the "remembered accurately" success criterion this is the asset actually doing the job.
2. **The voice, and in exactly one place, an interaction that embodies it.** The `Look inside` → `👀👀👀👀👀👀` hover flip works because the personality *happens to you* rather than being asserted at you. It's the most memorable moment on the site and directly serves Product Principle 4.
3. **The soundwave is technically honest motion.** `Hero.astro:279-307` drives timeScale, amplitude and frequency from real scroll *velocity* with exponential decay and lerped smoothing — it responds to input rather than looping. The metaphor is wrong for the domain; the instinct and execution are right. Re-skin it, don't remove it.

## Priority Issues

**[P0] The contact section, whose job is to close, offers one channel and it's the weakest one.**
`Contact.astro:11-24` contains exactly one action: a `mailto:` to a `@gmail.com` address, in the right column, with the left half prose and the rest empty. The Google Calendar booking link — the highest-intent action on the site — exists *only* in the fixed nav and mobile sidebar. LinkedIn appears only in the nav. No availability statement, no timezone, no response expectation.
*Why it matters:* A founder who has scrolled the whole page and decided to act must scroll back up to a 12px nav button. A hiring manager gets no CV and no LinkedIn at the point of decision. Both audiences reach maximum intent and find minimum infrastructure. The `@gmail.com` address on a site at `salvatorecirone.dev` is a live credibility leak.
*Fix:* Rebuild around a primary "Book a call" button (existing `BOOKING_URL`) at ≥18px with real padding; LinkedIn secondary; email tertiary. Add the honest availability line from PRODUCT.md — at xFarm full-time, open to select projects — plus a location/timezone line that converts the nomad claim into a practical booking fact. Kill the empty column.
*Command:* `/impeccable shape` then `/impeccable clarify`

**[P0] There is no type system, and the display tier is spent on a greeting.**
21 hard-coded font-sizes across 8 files, zero type tokens in `design.config.ts`. The scale contains `0.7/0.75/0.78/0.8rem` — four values inside a 1.6px range, differences no reader can perceive. **The 28–36px band is empty, so there is no lede voice** — which is exactly why the positioning statement dies at 16px. Plus: `.contact-heading` (`Contact.astro:39`) declares no `line-height` and inherits `1.6`, rendering "Let's Build / Together" at 40px with 64px leading on mobile — the most important heading on the page is the one with the bug. `.cert-issuer` at **8px** sets the credibility payload of a certification smaller than a legal disclaimer. Three leadings for one body size; four tracking values for one label role.
*Why it matters:* This is your explicit ask, the direct cause of the missing "oh wow", and the mechanism by which the positioning gets flattened to "senior backend engineer".
*Fix:* Add a `type` block to `design.config.ts` — ~6-step scale on a 1.25 ratio, tokenised leading, one mono-tracking token, one measure token (~62ch) — inject as CSS vars alongside the palette vars, and hoist `.section-label`/`.section-description` into shared globals. Then restructure the hero: "Ciao!" demoted to a warm eyebrow (keeping the personality), display tier reassigned to a real headline stating the combination, and the current intro promoted into the new 21–28px lede tier.
*Command:* `/impeccable typeset`

**[P1] The services deck is pointer-only, indicator-less, keyboard-unreachable, and broken on mobile.**
`BaseLayout.astro:220-228` appends a bare `<div>` over the track with `inset:0; z-index:10` — no `tabindex`, no `role`, no key handler. Cards are `position:absolute; width:360px` fixed, so at 390px **one card shows and clips at the right edge**; on desktop the 4th card bleeds off-screen with text cut mid-word (visible unprompted). No position indicator anywhere. The drag has no z-lift, no scale, no shadow response, no rotation-follows-velocity — `layout()` just `gsap.set`s per frame, which is exactly the "feels off" you reported. The flip you want does not exist.
*Why it matters:* Three of four "work badges" — including AI Engineer and the nomad service, the two things that make you distinct — are invisible to a mobile visitor, a keyboard user, and anyone who doesn't guess the section is draggable. Mobile is ~half the traffic.
*Fix:* (a) `width: min(360px, calc(100vw - 48px))`, prev/next buttons plus arrow keys on a focusable track, and an `n/4` indicator matching the carousel's existing pattern. (b) Real pick-up physics: on `pointerdown` tween `scale:1.04`, `y:-8`, deepen shadow, raise `zIndex`; drive `rotation` from `velX` so the card lags the hand; overshoot ease on release. (c) The flip — `rotateY` two-face card, back carrying 3–4 concrete "how I help" points — which also converts a flat card into the progressive-disclosure step the cognitive-load checklist currently fails.
*Command:* `/impeccable animate` then `/impeccable adapt`

**[P1] `/work/[slug]` is an unnavigable dead end sitting behind the best interaction on the site.**
`[slug].astro:23-37` renders no nav, no footer, no CTA — a 12.8px "Back" link and a dashed "PROJECT DETAIL COMING SOON" box. The `startup` route additionally renders an empty `<p>`, so it's a title, a blank line, and a rectangle: 69 characters of text total.
*Why it matters:* This is the terminus of "Look inside 👀" — the moment of highest curiosity. Every visitor who engages most deeply is rewarded with nothing and stranded with no way onward but the browser back button. It also makes the `02` chapter count read as an overclaim.
*Fix:* Immediately add `<Nav />` and `<Footer />` so the page is never a trap, and replace the dashed box with an honest in-voice holding state that still carries value — client, roles, stack, years, and a "full write-up coming, ask me on a call" link to `BOOKING_URL`. Then build the real structure: projects, responsibilities, wins, metrics, and the "what that world taught me" framing.
*Command:* `/impeccable shape` then `/impeccable harden`

**[P1] Two JavaScript errors fire on every page load.**
`Please gsap.registerPlugin(ScrollTrigger)` (warning) and `_context2 is not a function` (thrown pageerror), identical at all three widths and on both detail routes.
*Why it matters:* If ScrollTrigger isn't registered when the animation code runs, section reveals and the certification auto-scroll can silently fail — and a thrown error on load is the kind of thing a CTO evaluating engineering rigour opens the console and finds.
*Fix:* Register plugins before any ScrollTrigger reference; trace the `_context2` throw (likely a transpiled async-generator helper in the GSAP init block).
*Command:* `/impeccable audit`

**[P2] Nav gold-on-purple fails AA, and the loudest element on the page carries the least value.**
`.nav-link`/`.sidebar-link` gold on purple = **3.17:1** against a 4.5:1 requirement, at 12px uppercase with 0.12em tracking — the hardest text on the page to read, holding the wayfinding. Footer copyright is the same pair. Meanwhile the full-bleed `#85409D` bar is the highest-chroma object on every screen; over the dark hero it reads like a consent banner and out-shouts the portrait.
*Fix:* Nav/sidebar links to `#ffffff` (6.53:1), gold reserved for active/hover. Make the nav transparent over the hero and transition to translucent dark on scroll — this hands the hero its full first viewport back and buys an active-section indicator at the same time.
*Command:* `/impeccable colorize` then `/impeccable audit`

**[P3] No shared rail, and three large dead zones read as unfinished layout.**
Section headings sit at the 24px gutter while the work card is `75vw` centred starting at x≈180 — no shared vertical rail. Plus ~360px of empty purple in the work card's left column with role tags exiled to the bottom edge, ~250px of empty space under the mobile hero, and 8rem of blank purple above the footer. The IELTS logo renders as a bright white rectangle inside a dark glass card; cert logos are large squares while service avatars are 56px circles.
*Why it matters:* Emptiness on a portfolio doesn't read as confident whitespace — it reads as content that was planned and never arrived, the precise impression a page selling architectural rigour must avoid.
*Fix:* Real container token (1200–1280px, not 2000px) with headings, cards and carousel on one rail. Move role tags up under the description and use the recovered space for the "what that world taught me" framing. Cap the mobile hero card at content height. Normalise cert logos into a consistent contained mask with a neutral plate.
*Command:* `/impeccable layout`

## Persona Red Flags

**Casey (distracted mobile user) — most damaging.** Lands from a shared link. First viewport: 40vh of portrait, "Ciao!", one grey sentence, then ~250px of empty space — 30% of the highest-value screen is blank. Scrolls to Services and sees **one card, clipped at the right edge**. No idea three more exist; the only signal is an 11px gold `04`. She never learns Salvatore does AI engineering or nomad consulting. Taps the burger: sidebar has **no logo, no close button**, gold links at 3.17:1, and an overlay too weak to separate the panel from the page. Failed by `Hero.astro:123`, `ServiceCard.astro:28-33`, `Services.astro:12`, `Nav.astro:240-296`.

**Sam (accessibility-dependent).** Skip link works — credit. Then **the services deck is completely unreachable**: the drag surface is a `<div>` with no `tabindex`, no `role`, no key handler, covering the cards at `z-index:10`. Cards 2–4 do not exist for Sam at all. **No `:focus-visible` styles anywhere in the codebase** — focus rings are UA default over a custom dark palette. Nav links fail AA at 3.17:1; cert issuers at 8px are unreadable at any acuity. (Credit where due: `prefers-reduced-motion` is genuinely honoured — measured 0 of 10 animated elements moving under `reduce`, with `getAnimations().length` at 0.)

**Marta — CTO at a Series-A, evaluating for a 3-month architecture contract (project-specific).** Arrives from a referral needing one answer: can this person be trusted with our platform? Reads the 16px grey positioning line as marketing prose with no verifiable content. Goes hunting for evidence. Services: four cards, three hidden behind an undiscoverable drag, and the first one she reads contains the typo **"appplication"** — three p's, first sentence a paying client reads. Work Chapters: a **stock photo of an anonymous stranger at a laptop** beside three sentences with no system, no scale, no constraint, no outcome, then 360px of empty purple. Clicks "Look inside" hoping for architecture: "PROJECT DETAIL COMING SOON". Certifications are the only hard evidence on the page — AWS SAP-C02 is genuinely strong — and the issuer authenticating them is set at **8px**. Reaches the bottom: no booking button, no availability statement, just a gmail address. **She cannot answer her question and there is no low-cost next step, so she replies to the referrer instead of to him.**

**Daniel — engineering hiring manager, 90-second scan (project-specific).** Wants seniority, current stack, contact. JSON-LD lists `jobTitle: "Senior Backend Engineer"` only — even the machine-readable layer flattens the positioning. Never sees the AI Engineer card because it's behind the drag. Looks for a CV: **none exists anywhere on the site**. Looks for dates, tenure, team scale: nothing — "Chapters" deliberately abstracts away the chronology his process requires. Finds two employers named with no dates. Leaves with less than the LinkedIn profile he came from.

## Minor Observations

- **Typo in production copy, first service card, first sentence:** `"Powering your appplication"` — `services.ts:13`.
- All four service avatars **look like the same illustration** at 56px — four identical gold circles carrying zero differentiating information.
- `work.ts:20` has the Unsplash attribution commented out while the photo is live; `WorkCard.astro:43` would render it if present. Licence expects it.
- The Medium icon exists in the nav but appears in neither DESIGN.md nor PRODUCT.md's evidence — either it's real proof that deserves far more than a 60%-opacity 16px icon, or it should go.
- `jsonLdPerson.knowsAbout` is the only place on the site where the full combination is enumerated — and it's invisible to humans.
- `html { scroll-behavior: smooth }` is not gated on `prefers-reduced-motion`.
- The loading screen loops a ~1.5s logo cycle and only exits on `window.load` — on a fast connection it spends the visitor's first 1.5 seconds on a logo instead of the portrait.
- 14 images have neither dimensions nor `aspect-ratio` (CLS risk). Zero images missing `alt` — that part is clean.
- Tap targets under 44px at 390px: `a.nav-social` **20×20** ×3, `a.contact-link` 249×**24**, both carousel arrows 40×40, burger 40×32.
- `Footer.astro:45-50` defines `.logo-text`; no element uses it. Dead CSS.
- Credit: `data-cta-alt` and the emoji flip both correctly carry `aria-hidden` — preserve that through any refactor.

## Questions to Consider

1. **If the largest words on the page were the answer to "what makes you different", what would they say?** Right now they say "Ciao!" and "Services". What sentence deserves 76px? Until that sentence exists, no amount of added motion produces "oh wow".
2. **What if the hero's background motion were a real system instead of a decorative one?** The scroll-velocity plumbing is already built and good. Replace 7 sine waves with something only this person could put there — the cities he's actually shipped from, a slow orbit of regions, a route line — and the nomad claim is *shown* rather than asserted in 12px mono.
3. **Should the four service cards be four services, or one claim in four parts?** "Backend, Cloud, AI, Nomad" as a peer list reads as four separate offerings — exactly the flattening Product Principle 2 forbids.
4. **What is the honest, valuable version of an unwritten case study?** Not a dashed box. PRODUCT.md says specifics are cleared. What is the smallest set of true facts that would make Marta book the call *before* the prose is written?
5. **Is "Chapters" costing you the hiring manager?** The framing is distinctive and load-bearing, but Daniel needs dates and tenure. Can a chapter carry a quiet date range and a scale marker without becoming a résumé?
6. **Why is a gmail address the terminal fact on a page hosted at `salvatorecirone.dev`?**
7. **What should be the last thing a visitor sees?** Currently `© 2026`. Peak-end says the ending is half of what gets remembered.
