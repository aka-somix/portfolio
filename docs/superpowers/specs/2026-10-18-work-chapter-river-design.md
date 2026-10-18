# Work chapter card: the river of roles

Date: 2026-10-18
Status: approved design, not yet planned

## Why

The current chapter card reads as a spec sheet: a lede, a responsibilities
list, a lesson paragraph, role tags, and a `<dl>` of Client / Years / Domain /
Cloud / Stack / Team span. Two problems:

- **The data is misleading.** "Client" names Reply and xFarm, which were
  employers, not clients. The spec values are invented placeholders.
- **It frames a career as a ladder of credentials.** The intent is a journey:
  each chapter is a stretch of working life with its own roles, challenges and
  lessons, and the reader should get a glance of the life lived.

## What the card says

In priority order:

1. **Who I was**: the roles held, and how their mix shifted during the chapter.
   Told by the visual.
2. **What it taught me**: the lessons. Kept from the current design, now a list.
3. **The challenges**: what was overcome. A list.

Timeline position (years) is supporting metadata. Stack, KPIs, achievements and
responsibilities do not appear on the card.

## The visual: a river of roles

A horizontal streamgraph. Left to right is time within the chapter.

- The chapter is split into **2 to 4 phases**. Each phase lists the roles held
  with a coarse weight of **1 to 3**. Each role is one stream; its thickness at
  a phase is its weight. Streams are stacked around a centre line and joined
  with smooth horizontal curves, so roles swell, thin, appear and disappear.
- Growth reads as **widening**, never climbing. Seniority is carried by the
  **position title** drawn above each phase (for example *Backend Engineer*,
  *Solutions Architect*): a dot on the phase line with the title above it. The
  last title is gold. A title identical to the previous phase is drawn once.
- Role names label the streams at the river's mouth (right edge).
- No technologies, no phase names ("Arrival" etc.), no axis labels.
- Phase positions are marked with hairlines at 12% white.

Approved mockup (local, not committed): `.superpowers/brainstorm/10046-1792319433/content/card-layout-v3.html`.

## Card layout (desktop)

```
Arena (mono)                                        2021 · 2023 (mono)
Chapter title (Archivo)

Backend Engineer      Senior Backend Engineer      Solutions Architect
   •                         •                             •
 ════════ river, full card width ══════════════════════  Backend
                                                          Architecture
                                                          Client liaison
───────────────────────────────────────────────────────────────
• Who I was           • The challenges          • What it taught me
  one sentence          - bullet                  - bullet (Archivo, white)
                        - bullet                  - bullet
[CTA to /work/slug]
```

- Three columns, `1fr 1.15fr 1.15fr`, each topped by a hairline and a node
  dot. The lesson column's dot and bullet markers are gold, its bullets set in
  Archivo 17px. Challenge bullets are Inter 15px secondary.
- Column order mirrors the river: arrival, mid-stream, mouth.
- Card stays inside the existing carousel; carousel behaviour is unchanged.

## Content model

All copy lives in content files. The visual contains no authored copy; every
string it renders (titles, role names, labels) comes from `src/content/en/**`
through `src/lib/content.ts`.

### Chapter frontmatter (`src/content/en/work/*.md`)

```yaml
order: 1
title: Consultant Chapter
arena: Enterprise consulting
description: ...            # SEO, unchanged
lede: ...                   # inner page only, unchanged
responsibilities: [...]     # inner page only, unchanged
years: { from: 2021, to: 2023 }      # `to` may be "present"
draft: true                 # see Build gate
whoIWas: One sentence.
challenges:                 # 1 to 4
  - ...
lessons:                    # 1 to 3
  - ...
phases:                     # 2 to 4, drives the river
  - id: backend             # slug, future anchor `#position-<id>`
    title: Backend Engineer
    roles: { backend: 3, architecture: 1 }
  - id: architect
    title: Solutions Architect
    roles: { backend: 1, architecture: 3, client-liaison: 2 }
projects: []                # unchanged
```

Removed fields: `client`, `learned` (becomes `lessons`), `roles` (derived from
`phases`), `spec`, `specPlaceholder`.

Validation in `src/content.config.ts`:

- `years.from` integer; `years.to` integer or literal `"present"`; `to >= from`
  when numeric.
- `phases[].roles` values are integers 1 to 3; each phase has at least one role.
- `phases[].id` unique within the chapter, lowercase slug.

### Shared role list (`src/content/en/roles.yaml`)

```yaml
- { id: backend, name: Backend }
- { id: architecture, name: Architecture }
- { id: ai-engineering, name: AI Engineering }
- { id: client-liaison, name: Client liaison }
```

- Declaration order is the **stacking order** of streams (top to bottom) and
  the **colour order**.
- Colours are design tokens, not content: an ordered `river` palette in
  `src/design.config.ts`, assigned to roles by index. The same role is the same
  colour in every chapter. Initial palette from the mockup: `#a463c4`,
  `#EEA727`, `#e9dcf7`, then further tokens as roles are added. The build fails
  if there are more roles than palette entries.
- `workChapters()` in `src/lib/content.ts` throws at build time if a phase uses
  a role id missing from `roles.yaml`.

### Labels (`src/content/en/ui.yaml`)

`workCard` gains `whoIWas`, `challenges`, `lessons` labels ("Who I was", "The
challenges", "What it taught me") and loses `held`, `details`. `workSpec` is
removed. A visually hidden heading for the river's text alternative is added.

### Year range

Rendered as `from · to` (middle dot, mono, tabular). `"present"` renders a
label from `ui.yaml`. No em dash anywhere.

## Components

### `src/lib/river.ts`

Pure geometry, no Astro, no DOM.

- Input: phases (ordered role weights) and the role order.
- Output, in a fixed viewBox (width 1000, height given):
  - one closed path per role (stacked, centred, cubic joins at phase midpoints),
  - phase x positions as percentages,
  - per role, the vertical centre of its stream at the last phase as a
    percentage (for the mouth label), or none when its last weight is 0.
- Unit-tested with `node --test` alongside the existing content-rules tests.

### `src/components/ChapterRiver.astro`

- Props: `phases`, `roles`, `variant: "card" | "page"`, optional
  `phaseHref(phase) => string`.
- SVG streams with `preserveAspectRatio="none"` and `vector-effect:
  non-scaling-stroke` so the river fills any width with no client JS.
- Titles, dots and mouth labels are **HTML** absolutely positioned from the
  geometry percentages, so text never distorts.
- SVG is `aria-hidden`. A visually hidden ordered list states each phase:
  title, then its roles by name.
- When `phaseHref` is given, titles render as links. Neither page passes it yet
  (see Inner page).

### `src/components/WorkCard.astro`

Rewritten to the layout above. The spec panel, its markup, CSS and the
small-screen fold disclosure are deleted. `WorkCarousel.astro` passes the new
props.

## Small screens (900px and below)

- River keeps full card width; height drops from about 150px to about 110px.
- Mouth labels move to a legend row under the river: colour swatch plus name.
- Only the **first and last** position titles are drawn; titles may wrap to two
  lines. Middle titles stay in the text alternative.
- The three columns stack: who I was, challenges, lessons.
- No disclosure toggle. Target card height is about 750px, down from about
  1250px.

## Motion

One authored moment, using the existing GSAP and ScrollTrigger setup in
`BaseLayout.astro`, hooked by a `data-animate` attribute.

- When a river first enters view, or the carousel pages to its card, the streams
  reveal left to right with a `clip-path` wipe, about 1.2s, exponential
  ease-out. Each position title fades in as the wipe passes its phase.
- Runs once per card. The river is fully visible by default, so it is complete
  without JS. Skipped entirely under `prefers-reduced-motion`.
- No hover effects on streams.

## Inner page (`/work/[slug]`), minimal patch only

The inner page redesign is out of scope. Only what keeps it working with the new
model:

- The spec table and Client row are removed. `ChapterRiver variant="page"`
  takes their place.
- `lessons` renders as a list where `learned` was.
- Role tags are derived from the roles used in `phases`.
- No `phaseHref` is passed yet.

**Structure for later** (not built now): each position title will link to
`#position-<phase.id>`, a section of the inner page that explains that
position. The `phases[].id` field and the `phaseHref` prop exist so this can be
added without changing the content model.

## Build gate

`specPlaceholder` is replaced by a per-chapter `draft: true` flag in
`scripts/check-content.mjs`: a warning in `pnpm build`, a failure under
`--strict` (so `pnpm deploy` refuses to ship), same mechanism as today.

Both existing chapters ship with drafted copy derived from their current text
(`whoIWas`, `challenges`, `lessons`) and placeholder `phases`, and with
`draft: true`. Position titles and role weights are facts only the author can
supply; nothing is presented as final until the author removes the flag.

## Docs to update

- `DESIGN.md`: work section (card, river, small screens, motion); remove the
  spec panel and placeholder notes. Both duplicated work sections in the file.
- `CONTENT.md`: new chapter fields, `roles.yaml`, the `draft` check replacing
  SPEC.
- `PRODUCT.md`: chapter description no longer mentions the spec panel or Client.

## Testing

- `pnpm test:content`: existing tests updated for the `draft` rule; new tests
  for `river.ts` geometry (stack sums, zero-weight roles, 2 and 4 phases,
  mouth label omission).
- `pnpm build` passes with `draft` warnings only.
- Visual check at 1280px and 390px for both chapters: no title collision, no
  overflow, legend legible, reduced-motion renders the static river.

## Out of scope

- Inner page redesign and per-position sections.
- Adding chapters beyond the existing two.
- Hover or click interaction on the river.
