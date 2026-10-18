# Work Chapter River Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the spec-sheet work chapter card with a "river of roles" card: a horizontal streamgraph of how roles shifted across a chapter's phases, plus three text beats (Who I was / The challenges / What it taught me).

**Architecture:** A pure geometry module (`src/lib/river.ts`) turns a chapter's `phases` into SVG paths and percentage positions. `ChapterRiver.astro` draws the streams as a stretchable SVG and overlays all text as positioned HTML. `WorkCard.astro` is rewritten around it, the chapter page gets a minimal patch, and the content model moves from `client`/`spec`/`learned`/`roles` to `whoIWas`/`challenges`/`lessons`/`phases` plus a shared `roles.yaml`.

**Tech Stack:** Astro v6 (static), TypeScript, Zod via `astro:content`, GSAP + ScrollTrigger, `node --test` (Node 22.22 runs `.ts` imports natively by type stripping).

**Spec:** `docs/superpowers/specs/2026-10-18-work-chapter-river-design.md`

## Global Constraints

- **No human-readable string in `.astro`, `.ts` or `.js` files.** All copy lives in `src/content/en/**` and is read through `src/lib/content.ts` only. `pnpm build` runs `pnpm check:content` and fails on a violation (rules R1–R4, see `CONTENT.md`). Never add copy to `scripts/content-check.allow.json`. `src/lib/content.ts`, `src/content.config.ts` and `src/design.config.ts` are exempt from the scan, so error messages with prose may only live there.
- **Never call `getEntry`/`getCollection` in a component.** Add an accessor to `src/lib/content.ts`.
- **Never use the `—` character in copy.** Prefer `,` or `.`.
- **Design tokens stay in `src/design.config.ts`.** Every font size comes from the `--size-*` custom properties; no raw `font-size` in components.
- **Fonts have fixed jobs:** Archivo (`--font-display`) for display, Inter (`--font-sans`) for body, JetBrains Mono (`--font-mono`) for data and measurement only.
- **Never fabricate facts** (PRODUCT.md). Phase titles and role weights are placeholders until the author supplies them; chapters carry `draft: true` until then.
- **`prefers-reduced-motion: reduce` skips animation entirely.** Content is complete without JS.
- **Phases:** 2 to 4 per chapter. **Role weights:** integers 1 to 3. **Challenges:** 1 to 4. **Lessons:** 1 to 3.
- GSAP is the only runtime dependency. Add no packages.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.

## Deviations from the spec (decided while planning)

- `ui.yaml` `workCard.held` is **kept**: the chapter page still renders `responsibilities` under that label. `taught` is replaced by `lessons`; `details` and `workSpec` are removed.
- On the chapter page the river sits **full width between the header and the body** instead of inside the 320px aside, which is too narrow for a river plus mouth labels. The aside keeps the year range and the role tags.
- `PRODUCT.md` does not mention the spec panel or the Client row, so it needs no edit. `AGENTS.md` gets its test count corrected instead.
- When a role ends before the last phase it has no mouth label, so the legend row (otherwise mobile only) is also shown on desktop for that chapter.
- *Found during execution:* on small screens the last drawn title can be a middle phase (when the final title repeats), which collided with the first title. Each visible title now gets `--room-sm` (the space up to the other visible title) as its max width, and a middle title anchors left at its phase line. Implemented in `ChapterRiver.astro`.

## File map

| File | Responsibility | Task |
|---|---|---|
| `src/lib/river.ts` (create) | Pure river geometry, role helpers | 1 |
| `scripts/lib/river.test.mjs` (create) | Unit tests for geometry | 1 |
| `src/design.config.ts` | `river` colour palette | 2 |
| `src/content/en/roles.yaml` (create) | Shared role list | 2 |
| `src/content.config.ts` | `roles` collection, new work fields | 2, 3, 5 |
| `src/lib/content.ts` | `roles()` accessor, role validation in `workChapters()`, `ui` type | 2, 3, 4, 5 |
| `src/components/ChapterRiver.astro` (create) | Draws one river | 2 |
| `src/components/ChapterYears.astro` (create) | Renders a year range | 3 |
| `src/content/en/ui.yaml` | New labels | 3, 4, 5 |
| `src/content/en/work/*.md` | New fields, then old fields removed | 3, 5 |
| `scripts/lib/content-rules.mjs` + `.test.mjs` | `draftFlag` rule | 3 |
| `scripts/check-content.mjs` | DRAFT gate replaces SPEC gate | 3 |
| `src/lib/river-motion.ts` (create) | Client-side reveal animation | 4 |
| `src/components/WorkCard.astro` | Rewritten card | 3 (years only), 4 |
| `src/components/WorkCarousel.astro` | New props, motion hook, fold JS removed | 4 |
| `src/pages/work/[slug].astro` | Minimal patch | 3 (years only), 5 |
| `DESIGN.md`, `CONTENT.md`, `AGENTS.md` | Docs | 6 |

---

### Task 1: River geometry module

**Files:**
- Create: `src/lib/river.ts`
- Test: `scripts/lib/river.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces (exact exports of `src/lib/river.ts`):
  - `VIEW_W = 1000`, `VIEW_H = 100`
  - `type RiverPhase = { id: string; title: string; roles: Record<string, number> }`
  - `type RiverStream = { roleId: string; order: number; d: string; mouthY: number | null }`
  - `type RiverTitle = { title: string; phaseIndex: number; x: number; edge: 'start' | 'mid' | 'end' }`
  - `type RiverGeometry = { phaseX: number[]; streams: RiverStream[]; titles: RiverTitle[]; hasEnded: boolean }`
  - `rolesUsed(phases: RiverPhase[], roleOrder: string[]): string[]`
  - `unknownRoles(phases: RiverPhase[], roleOrder: string[]): string[]`
  - `phaseBands(phases: RiverPhase[], used: string[]): (readonly [number, number])[][]`
  - `riverGeometry(phases: RiverPhase[], roleOrder: string[]): RiverGeometry`

- [ ] **Step 1: Write the failing tests**

Create `scripts/lib/river.test.mjs`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  VIEW_H,
  phaseBands,
  riverGeometry,
  rolesUsed,
  unknownRoles,
} from '../../src/lib/river.ts'

const ORDER = ['backend', 'architecture', 'ai-engineering', 'client-liaison']

const TWO = [
  { id: 'engineer', title: 'Engineer', roles: { backend: 3, architecture: 1 } },
  {
    id: 'architect',
    title: 'Architect',
    roles: { backend: 1, architecture: 3, 'client-liaison': 2 },
  },
]

const close = (a, b) => assert.ok(Math.abs(a - b) < 0.01, `${a} != ${b}`)

test('rolesUsed keeps role-list order and drops roles never held', () => {
  assert.deepEqual(rolesUsed(TWO, ORDER), ['backend', 'architecture', 'client-liaison'])
})

test('unknownRoles lists ids missing from the role list, once each', () => {
  const phases = [
    { id: 'a', title: 'A', roles: { backend: 1, devops: 2 } },
    { id: 'b', title: 'B', roles: { devops: 1 } },
  ]
  assert.deepEqual(unknownRoles(phases, ORDER), ['devops'])
  assert.deepEqual(unknownRoles(TWO, ORDER), [])
})

test('phaseBands stacks roles around the midline and the widest phase fills 92%', () => {
  const bands = phaseBands(TWO, rolesUsed(TWO, ORDER))
  // Phase 2 is the widest (total 6): it spans 4 → 96 of a 100-high box.
  close(bands[1][0][0], 4)
  close(bands[1][2][1], 96)
  // Phase 1 (total 4) is centred: its envelope is symmetric around 50.
  close(bands[0][0][0] + bands[0][2][1], VIEW_H)
  // A role absent from a phase has a zero-height band.
  close(bands[0][2][1] - bands[0][2][0], 0)
})

test('riverGeometry places phases at 0% and 100% for two phases', () => {
  assert.deepEqual(riverGeometry(TWO, ORDER).phaseX, [0, 100])
})

test('riverGeometry spaces four phases evenly', () => {
  const four = ['a', 'b', 'c', 'd'].map((id) => ({ id, title: id, roles: { backend: 1 } }))
  assert.deepEqual(riverGeometry(four, ORDER).phaseX, [0, 33.33, 66.67, 100])
})

test('streams keep their global order and are closed paths with one join per gap', () => {
  const { streams } = riverGeometry(TWO, ORDER)
  assert.deepEqual(
    streams.map((s) => [s.roleId, s.order]),
    [['backend', 0], ['architecture', 1], ['client-liaison', 3]]
  )
  for (const s of streams) {
    assert.match(s.d, /^M[\d.]+,[\d.]+ /)
    assert.match(s.d, / Z$/)
    // Upper edge and lower edge each have (phases - 1) cubic joins.
    assert.equal(s.d.match(/C/g).length, 2)
  }
})

test('mouthY is the vertical centre of each stream at the last phase', () => {
  const { streams } = riverGeometry(TWO, ORDER)
  close(streams[0].mouthY, 11.67)
  close(streams[1].mouthY, 42.33)
  close(streams[2].mouthY, 80.67)
})

test('a role that ends before the last phase has no mouth label', () => {
  const phases = [
    { id: 'a', title: 'A', roles: { backend: 2, 'ai-engineering': 1 } },
    { id: 'b', title: 'B', roles: { backend: 2 } },
  ]
  const geo = riverGeometry(phases, ORDER)
  assert.equal(geo.streams.find((s) => s.roleId === 'ai-engineering').mouthY, null)
  assert.equal(geo.hasEnded, true)
  assert.equal(riverGeometry(TWO, ORDER).hasEnded, false)
})

test('titles collapse consecutive repeats and carry their edge', () => {
  const phases = [
    { id: 'a', title: 'Engineer', roles: { backend: 1 } },
    { id: 'b', title: 'Architect', roles: { backend: 1 } },
    { id: 'c', title: 'Architect', roles: { backend: 1 } },
  ]
  assert.deepEqual(riverGeometry(phases, ORDER).titles, [
    { title: 'Engineer', phaseIndex: 0, x: 0, edge: 'start' },
    { title: 'Architect', phaseIndex: 1, x: 50, edge: 'mid' },
  ])
  assert.deepEqual(
    riverGeometry(TWO, ORDER).titles.map((t) => t.edge),
    ['start', 'end']
  )
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test:content`
Expected: FAIL in `river.test.mjs` with `ERR_MODULE_NOT_FOUND` for `src/lib/river.ts`. The 16 existing content-rules tests still pass.

- [ ] **Step 3: Write the implementation**

Create `src/lib/river.ts`:

```ts
/**
 * Geometry for the river of roles: a streamgraph of how a chapter's role mix
 * shifted across its phases. Pure and DOM-free, so it is unit-tested with
 * scripts/lib/river.test.mjs and drawn by ChapterRiver.astro.
 *
 * Coordinates live in a fixed VIEW_W × VIEW_H box. The SVG is stretched with
 * preserveAspectRatio="none", so every position the HTML overlay needs is also
 * returned as a percentage of that box.
 */
export const VIEW_W = 1000
export const VIEW_H = 100

/** Share of the height the widest phase fills, leaving air above and below. */
const FILL = 0.92

export type RiverPhase = { id: string; title: string; roles: Record<string, number> }

export type RiverStream = {
  roleId: string
  /** Index in the shared role list: drives stacking and colour. */
  order: number
  d: string
  /** Vertical centre at the last phase, in %, or null when the role ended earlier. */
  mouthY: number | null
}

export type RiverTitle = {
  title: string
  phaseIndex: number
  /** Horizontal position in %. */
  x: number
  edge: 'start' | 'mid' | 'end'
}

export type RiverGeometry = {
  /** Phase positions in %. */
  phaseX: number[]
  streams: RiverStream[]
  titles: RiverTitle[]
  /** True when a role ends before the mouth and so carries no mouth label. */
  hasEnded: boolean
}

type Pt = readonly [number, number]

const round = (n: number) => Math.round(n * 100) / 100
const pt = (p: Pt) => `${round(p[0])},${round(p[1])}`

/** Role ids held in at least one phase, in role-list order. */
export function rolesUsed(phases: RiverPhase[], roleOrder: string[]): string[] {
  return roleOrder.filter((id) => phases.some((p) => (p.roles[id] ?? 0) > 0))
}

/** Role ids a phase uses that the role list does not declare. */
export function unknownRoles(phases: RiverPhase[], roleOrder: string[]): string[] {
  const ids = phases.flatMap((p) => Object.keys(p.roles))
  return [...new Set(ids)].filter((id) => !roleOrder.includes(id))
}

/**
 * For each phase, the [top, bottom] band of every used role in box units,
 * stacked in role order and centred on the midline.
 */
export function phaseBands(phases: RiverPhase[], used: string[]) {
  const totals = phases.map((p) => used.reduce((s, id) => s + (p.roles[id] ?? 0), 0))
  const unit = (VIEW_H * FILL) / Math.max(...totals)
  return phases.map((p, i) => {
    let y = VIEW_H / 2 - (totals[i] * unit) / 2
    return used.map((id) => {
      const top = y
      y += (p.roles[id] ?? 0) * unit
      return [top, y] as const
    })
  })
}

/** Smooth horizontal joins: both control points sit at the x midpoint. */
function joins(pts: readonly Pt[]): string {
  let d = ''
  for (let i = 1; i < pts.length; i++) {
    const cx = round((pts[i - 1][0] + pts[i][0]) / 2)
    d += ` C${cx},${round(pts[i - 1][1])} ${cx},${round(pts[i][1])} ${pt(pts[i])}`
  }
  return d
}

export function riverGeometry(phases: RiverPhase[], roleOrder: string[]): RiverGeometry {
  const n = phases.length
  const used = rolesUsed(phases, roleOrder)
  const bands = phaseBands(phases, used)
  const xs = phases.map((_, i) => (n === 1 ? 0 : (VIEW_W * i) / (n - 1)))

  const streams = used.map((roleId, r) => {
    const upper: Pt[] = xs.map((x, i): Pt => [x, bands[i][r][0]])
    const lower: Pt[] = xs.map((x, i): Pt => [x, bands[i][r][1]]).reverse()
    const [top, bottom] = bands[n - 1][r]
    return {
      roleId,
      order: roleOrder.indexOf(roleId),
      d: `M${pt(upper[0])}${joins(upper)} L${pt(lower[0])}${joins(lower)} Z`,
      mouthY: bottom - top > 0 ? round(((top + bottom) / 2 / VIEW_H) * 100) : null,
    }
  })

  const titles: RiverTitle[] = []
  phases.forEach((p, i) => {
    if (i > 0 && p.title === phases[i - 1].title) return
    titles.push({
      title: p.title,
      phaseIndex: i,
      x: round((xs[i] / VIEW_W) * 100),
      edge: i === 0 ? 'start' : i === n - 1 ? 'end' : 'mid',
    })
  })

  return {
    phaseX: xs.map((x) => round((x / VIEW_W) * 100)),
    streams,
    titles,
    hasEnded: streams.some((s) => s.mouthY === null),
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test:content`
Expected: PASS, 16 content-rules tests + 9 river tests, 0 failures.

- [ ] **Step 5: Run the content check**

Run: `pnpm check:content`
Expected: no R1–R4 errors from `src/lib/river.ts` (it contains no two-word literals). Existing warnings (R5 em dashes, SPEC) are unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/lib/river.ts scripts/lib/river.test.mjs
git commit -m "feat(work): add river geometry module

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Role list, palette and the ChapterRiver component

The component is built here but first rendered in Task 4. This task leaves the site building and unchanged.

**Files:**
- Create: `src/content/en/roles.yaml`
- Create: `src/components/ChapterRiver.astro`
- Modify: `src/design.config.ts` (add `river` after `palette`)
- Modify: `src/content.config.ts` (add `rolesSchema` and the `roles` collection)
- Modify: `src/lib/content.ts` (add `roles()` accessor)
- Modify: `src/content/en/ui.yaml` (add `workCard.riverLabel`)
- Modify: `src/content.config.ts` `uiSchema.workCard` and `src/lib/content.ts` `ui` type (add `riverLabel`)

**Interfaces:**
- Consumes: `riverGeometry`, `rolesUsed`, `VIEW_W`, `VIEW_H`, `RiverPhase` from Task 1.
- Produces:
  - `design.river: readonly string[]` (hex colours, index = role order)
  - `roles(): Promise<{ items: { id: string; name: string }[] }>` in `src/lib/content.ts`
  - `<ChapterRiver phases={RiverPhase[]} variant?: "card" | "page" phaseHref?: (phase: RiverPhase) => string />`
  - Root element `figure[data-river]`; the part to wipe is `[data-river-body]`; each title is `[data-river-title]` with `data-x` (percentage) — Task 4's motion relies on these three hooks.

- [ ] **Step 1: Add the palette**

In `src/design.config.ts`, insert after the closing `},` of `palette`:

```ts
  /**
   * River of roles. One colour per entry in src/content/en/roles.yaml, by
   * index, so a role is the same colour in every chapter. Add a colour when
   * you add a role: the build fails if roles outnumber colours.
   */
  river: ["#a463c4", "#EEA727", "#e9dcf7", "#e0806a"],
```

- [ ] **Step 2: Create the role list**

Create `src/content/en/roles.yaml`:

```yaml
# The roles a chapter's river can show. Order is the stacking order of the
# streams (top to bottom) and the colour order (design.config.ts `river`).
# Chapters reference roles by `id` in `phases[].roles`.
items:
  - { id: backend, name: Backend }
  - { id: architecture, name: Architecture }
  - { id: ai-engineering, name: AI Engineering }
  - { id: client-liaison, name: Client liaison }
```

- [ ] **Step 3: Add the collection and accessor**

In `src/content.config.ts`, add above `const workSchema`:

```ts
/** Lowercase slug: role ids and phase ids. */
const slug = z.string().regex(/^[a-z0-9-]+$/, 'use lowercase letters, digits and dashes')

const rolesSchema = z.object({
  items: z.array(z.object({ id: slug, name: z.string() })).min(1),
})
```

and in `collections`, after `ui`:

```ts
  roles: defineCollection({ loader: glob({ base: ROOT, pattern: 'roles.yaml' }), schema: rolesSchema }),
```

In `src/lib/content.ts`, add after `ui`:

```ts
/** The shared role list. Order is the river's stacking and colour order. */
export const roles = () => data('roles', 'roles') as Promise<{
  items: { id: string; name: string }[]
}>
```

- [ ] **Step 4: Add the river label**

In `src/content/en/ui.yaml`, under `workCard:` add:

```yaml
  # Visually hidden. Introduces the text version of the river for screen readers.
  riverLabel: How my roles shifted through this chapter
```

In `src/content.config.ts` `uiSchema.workCard`, add `riverLabel: z.string(),`.
In `src/lib/content.ts` `ui` type, change the `workCard` line to:

```ts
  workCard: { held: string; taught: string; cta: string; ctaAlt: string; riverLabel: string }
```

- [ ] **Step 5: Create the component**

Create `src/components/ChapterRiver.astro`:

```astro
---
import { design } from "../design.config"
import { roles, ui } from "../lib/content"
import { riverGeometry, rolesUsed, VIEW_H, VIEW_W } from "../lib/river"
import type { RiverPhase } from "../lib/river"

export interface Props {
  phases: RiverPhase[]
  variant?: "card" | "page"
  /** When given, position titles become links (future `#position-<id>` sections). */
  phaseHref?: (phase: RiverPhase) => string
}

const { phases, variant = "card", phaseHref } = Astro.props

const roleList = (await roles()).items
const order = roleList.map((r) => r.id)
const names = new Map(roleList.map((r) => [r.id, r.name]))
const label = (await ui()).workCard.riverLabel
const geo = riverGeometry(phases, order)
const colour = (i: number) => design.river[i]
---

<!-- The SVG only draws shapes and stretches to any width. Every word is HTML
     positioned from the geometry's percentages, so text never distorts and
     always comes from content. -->
<figure class="river" data-river data-variant={variant} data-ended={geo.hasEnded ? "" : undefined}>
  <p class="sr-only">{label}</p>
  <ol class="sr-only">
    {
      phases.map((p) => (
        <li>
          {p.title}: {rolesUsed([p], order).map((id) => names.get(id)).join(", ")}
        </li>
      ))
    }
  </ol>

  <div class="river-titles" aria-hidden={phaseHref ? undefined : "true"}>
    {
      geo.titles.map((t) => {
        const href = phaseHref?.(phases[t.phaseIndex])
        const style = `--x: ${t.x}%`
        return href ? (
          <a class="river-title" href={href} data-river-title data-edge={t.edge} data-x={t.x} style={style}>
            {t.title}
          </a>
        ) : (
          <span class="river-title" data-river-title data-edge={t.edge} data-x={t.x} style={style}>
            {t.title}
          </span>
        )
      })
    }
  </div>

  <div class="river-body" data-river-body>
    <svg
      class="river-svg"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {
        geo.phaseX.map((x) => (
          <line
            class="river-phase"
            x1={(x * VIEW_W) / 100}
            x2={(x * VIEW_W) / 100}
            y1="0"
            y2={VIEW_H}
            vector-effect="non-scaling-stroke"
          />
        ))
      }
      {
        geo.streams.map((s) => (
          <path class="river-stream" d={s.d} fill={colour(s.order)} vector-effect="non-scaling-stroke" />
        ))
      }
    </svg>

    <ul class="river-mouth" aria-hidden="true">
      {
        geo.streams
          .filter((s) => s.mouthY !== null)
          .map((s) => <li style={`--y: ${s.mouthY}%`}>{names.get(s.roleId)}</li>)
      }
    </ul>
  </div>

  <ul class="river-legend" aria-hidden="true">
    {geo.streams.map((s) => <li style={`--c: ${colour(s.order)}`}>{names.get(s.roleId)}</li>)}
  </ul>
</figure>

<style>
  .river {
    --river-h: 150px;
    --title-h: 40px;
    --mouth-w: 150px;
    margin: 0;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .river[data-variant="page"] {
    --river-h: 200px;
    --river-gap: var(--bg-primary);
  }

  /* Same width as the SVG, so x% here is x% of the river. */
  .river-titles {
    position: relative;
    height: var(--title-h);
    margin-right: var(--mouth-w);
  }

  .river-title {
    position: absolute;
    left: var(--x);
    bottom: 14px;
    font-family: var(--font-display);
    font-size: var(--size-sm);
    font-weight: var(--weight-semibold);
    line-height: var(--leading-snug);
    color: var(--text-primary);
    white-space: nowrap;
  }

  .river-title[data-edge="mid"] {
    transform: translateX(-50%);
    text-align: center;
  }

  .river-title[data-edge="end"] {
    transform: translateX(-100%);
    text-align: right;
  }

  /* The dot sits on the phase line, under the title's anchor point. */
  .river-title::after {
    content: "";
    position: absolute;
    bottom: -11px;
    left: 0;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--text-secondary);
  }

  .river-title[data-edge="mid"]::after {
    left: 50%;
    transform: translateX(-50%);
  }

  .river-title[data-edge="end"]::after {
    left: auto;
    right: 0;
  }

  /* Where the chapter ended up. */
  .river-title:last-child {
    color: var(--accent);
  }

  .river-title:last-child::after {
    background: var(--accent);
  }

  a.river-title:hover,
  a.river-title:focus-visible {
    text-decoration: underline;
    text-underline-offset: 4px;
  }

  .river-body {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) var(--mouth-w);
  }

  .river-svg {
    display: block;
    width: 100%;
    height: var(--river-h);
    overflow: visible;
  }

  .river-phase {
    stroke: color-mix(in srgb, var(--border-color) 12%, transparent);
    stroke-width: 1;
  }

  /* A hairline of the ground colour between streams keeps them distinct. */
  .river-stream {
    stroke: var(--river-gap, var(--bg-surface));
    stroke-width: 1.5;
  }

  .river-mouth {
    list-style: none;
    position: relative;
    height: var(--river-h);
  }

  .river-mouth li {
    position: absolute;
    top: var(--y);
    left: 14px;
    transform: translateY(-50%);
    font-size: var(--size-sm);
    color: var(--text-primary);
    white-space: nowrap;
  }

  /* Shown on desktop only when a role ends before the mouth and so has no
     mouth label; always shown on small screens. */
  .river-legend {
    display: none;
    flex-wrap: wrap;
    gap: 8px 18px;
    list-style: none;
    margin-top: 14px;
  }

  .river[data-ended] .river-legend {
    display: flex;
  }

  .river-legend li {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: var(--size-xs);
    color: var(--text-secondary);
  }

  .river-legend li::before {
    content: "";
    width: 10px;
    height: 10px;
    border-radius: 2px;
    background: var(--c);
  }

  @media (max-width: 900px) {
    .river {
      --river-h: 110px;
      --title-h: 58px;
      --mouth-w: 0px;
    }

    .river[data-variant="page"] {
      --river-h: 140px;
    }

    .river-mouth {
      display: none;
    }

    .river-legend {
      display: flex;
    }

    /* Three titles collide at phone width: keep where you started and where
       you ended up. The middle ones stay in the screen-reader list. */
    .river-title:not(:first-child):not(:last-child) {
      display: none;
    }

    .river-title {
      white-space: normal;
      max-width: 48%;
    }
  }
</style>
```

- [ ] **Step 6: Verify**

Run: `pnpm test:content && pnpm build`
Expected: tests pass; content check shows no new errors (only the existing R5 and SPEC warnings); `astro build` succeeds. The component is not used yet, so the site is unchanged.

- [ ] **Step 7: Commit**

```bash
git add src/design.config.ts src/content/en/roles.yaml src/content.config.ts src/lib/content.ts src/content/en/ui.yaml src/components/ChapterRiver.astro
git commit -m "feat(work): add shared role list and ChapterRiver component

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: New chapter fields, year range and the DRAFT gate

Additive: the new fields are added alongside the old ones so every consumer keeps working. `years` changes shape, so its three render sites move to a shared `ChapterYears` component in this task.

**Files:**
- Modify: `scripts/lib/content-rules.mjs` (add `draftFlag`)
- Test: `scripts/lib/content-rules.test.mjs`
- Modify: `scripts/check-content.mjs` (DRAFT replaces SPEC)
- Modify: `src/content.config.ts` (`workSchema`, `uiSchema.workCard`)
- Modify: `src/lib/content.ts` (`ui` type, `workChapters()` validation)
- Modify: `src/content/en/ui.yaml`
- Modify: `src/content/en/work/consultant.md`, `src/content/en/work/startup.md`
- Create: `src/components/ChapterYears.astro`
- Modify: `src/components/WorkCard.astro:55,111`, `src/pages/work/[slug].astro:163` (years render sites)

**Interfaces:**
- Consumes: `unknownRoles` (Task 1), `roles()` and `design.river` (Task 2).
- Produces:
  - `draftFlag({ path, text }): Violation[]` exported from `scripts/lib/content-rules.mjs`
  - Work entry data gains `years: { from: number; to: number | "present" }`, `draft: boolean`, `whoIWas: string`, `challenges: string[]`, `lessons: string[]`, `phases: { id: string; title: string; roles: Record<string, number> }[]`
  - `ui().workCard` gains `whoIWas`, `challenges`, `lessons`, `yearsTo`, `present`
  - `<ChapterYears years={{ from, to }} />` renders `2021 · 2023` with a screen-reader "to"

- [ ] **Step 1: Write the failing DRAFT tests**

Append to `scripts/lib/content-rules.test.mjs` (and add `draftFlag` to its import from `./content-rules.mjs`):

```js
test('DRAFT warns on a chapter carrying draft: true, with its line', () => {
  const v = draftFlag({
    path: 'src/content/en/work/x.md',
    text: '---\norder: 1\ndraft: true\n---\n',
  })
  assert.equal(v.length, 1)
  assert.equal(v[0].rule, 'DRAFT')
  assert.equal(v[0].severity, 'warn')
  assert.equal(v[0].line, 3)
})

test('DRAFT is silent when draft is false or absent', () => {
  const path = 'src/content/en/work/x.md'
  assert.deepEqual(draftFlag({ path, text: '---\ndraft: false\n---\n' }), [])
  assert.deepEqual(draftFlag({ path, text: '---\norder: 1\n---\n' }), [])
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm test:content`
Expected: FAIL, `draftFlag` is not exported.

- [ ] **Step 3: Implement `draftFlag`**

Append to `scripts/lib/content-rules.mjs`, above `export const EXEMPT_FILES`:

```js
/**
 * DRAFT: a work chapter still marked `draft: true` carries drafted copy and
 * placeholder river data. Warns on build; `--strict` (deploy) fails on it.
 */
export function draftFlag({ path, text }) {
  const index = text.split('\n').findIndex((l) => /^draft:\s*true\s*$/.test(l))
  if (index === -1) return []
  return [
    {
      path,
      line: index + 1,
      rule: 'DRAFT',
      text: 'draft: true',
      remedy:
        'this chapter has drafted copy and placeholder phases (titles and role weights). Replace them with real facts and remove draft: true before deploying',
      severity: 'warn',
    },
  ]
}
```

In `scripts/check-content.mjs`: change the import to `import { draftFlag, scanSource } from './lib/content-rules.mjs'`, update the header comment's `--strict` line to `--strict also fails on warnings, including chapters still marked draft.`, and replace the whole `// specPlaceholder gate` loop with:

```js
// Draft gate: warns on build, fails under --strict.
for (const f of contentFiles.filter((f) => f.endsWith('.md'))) {
  violations.push(...draftFlag({ path: relative(root, f), text: await readFile(f, 'utf8') }))
}
```

- [ ] **Step 4: Run the tests**

Run: `pnpm test:content`
Expected: PASS, 18 content-rules tests + 9 river tests.

- [ ] **Step 5: Extend the schema**

In `src/content.config.ts`, add above `const workSchema` (below `slug`, which Task 2 added):

```ts
const phaseSchema = z.object({
  id: slug,
  title: z.string(),
  roles: z
    .record(slug, z.number().int().min(1).max(3))
    .refine((r) => Object.keys(r).length > 0, 'a phase needs at least one role'),
})
```

In `workSchema`, replace `years: z.string(),` with:

```ts
  years: z
    .object({
      from: z.number().int(),
      to: z.union([z.number().int(), z.literal('present')]),
    })
    .refine((y) => y.to === 'present' || y.to >= y.from, 'years.to is before years.from'),
  /** Drafted copy and placeholder phases. Warns on build, blocks deploy. */
  draft: z.boolean().default(false),
  whoIWas: z.string(),
  challenges: z.array(z.string()).min(1).max(4),
  lessons: z.array(z.string()).min(1).max(3),
  phases: z
    .array(phaseSchema)
    .min(2)
    .max(4)
    .refine((ps) => new Set(ps.map((p) => p.id)).size === ps.length, 'phase ids must be unique'),
```

In `uiSchema.workCard` add `whoIWas: z.string(), challenges: z.string(), lessons: z.string(), yearsTo: z.string(), present: z.string(),`.

- [ ] **Step 6: Validate roles at build time**

In `src/lib/content.ts`, add imports at the top:

```ts
import { design } from '../design.config'
import { unknownRoles } from './river'
```

Replace `workChapters()` with:

```ts
/**
 * Chapters in author-declared order. `entry.id` is the slug. Throws when a
 * chapter's river uses a role roles.yaml does not declare, or when roles
 * outnumber the river palette: both would otherwise render a silent gap.
 */
export async function workChapters(): Promise<CollectionEntry<'work'>[]> {
  const all = await getCollection('work')
  const { items } = await roles()
  if (items.length > design.river.length) {
    throw new Error(
      `roles.yaml declares ${items.length} roles but the river palette in ` +
        `src/design.config.ts has ${design.river.length} colours. Add a colour.`
    )
  }
  const ids = items.map((r) => r.id)
  for (const entry of all) {
    const missing = unknownRoles(entry.data.phases, ids)
    if (missing.length) {
      throw new Error(
        `Work chapter "${entry.id}" uses undeclared role(s): ${missing.join(', ')}. ` +
          `Add them to src/content/${LOCALE}/roles.yaml.`
      )
    }
  }
  return all.sort((a, b) => a.data.order - b.data.order)
}
```

Update the `ui` type's `workCard` line:

```ts
  workCard: {
    held: string
    taught: string
    cta: string
    ctaAlt: string
    riverLabel: string
    whoIWas: string
    challenges: string
    lessons: string
    yearsTo: string
    present: string
  }
```

- [ ] **Step 7: Add the labels**

In `src/content/en/ui.yaml` under `workCard:` add:

```yaml
  whoIWas: Who I was
  challenges: The challenges
  lessons: What it taught me
  # Year ranges render as "2021 · 2023". `yearsTo` is read aloud in place of
  # the dot; `present` replaces the end year of an ongoing chapter.
  yearsTo: to
  present: Present
```

- [ ] **Step 8: Add the new fields to both chapters**

In `src/content/en/work/consultant.md`: replace `years: 2021 — 2023` with `years: { from: 2021, to: 2023 }` and insert directly after it:

```yaml
# ⚠️ DRAFT. `whoIWas`, `challenges` and `lessons` are drafted from the previous
# copy, and every phase title and role weight below is a PLACEHOLDER. PRODUCT.md
# forbids fabricated facts on this site. Replace them, then delete `draft: true`.
# `pnpm check:content` warns while it is set and `pnpm deploy` refuses to ship.
draft: true
whoIWas: A backend engineer learning to design for systems that were already in production.
challenges:
  - Planning migrations against live production constraints
  - Designing target-state architecture on AWS for systems nobody could switch off
  - Being the technical link between client stakeholders and delivery teams
lessons:
  - The best architecture is the one a client's team can actually operate after you leave.
  - Constraints are the brief, not an obstacle to it.
phases:
  - id: engineer
    title: Backend Engineer
    roles: { backend: 3, architecture: 1 }
  - id: architect
    title: Cloud Architect
    roles: { backend: 1, architecture: 3, client-liaison: 2 }
```

In `src/content/en/work/startup.md`: replace `years: 2023 — present` with `years: { from: 2023, to: present }` and insert directly after it:

```yaml
# ⚠️ DRAFT. See the note in consultant.md.
draft: true
whoIWas: An architect learning to keep decisions reversible at scale-up pace.
challenges:
  - Evolving the platform architecture while the roadmap kept moving
  - Shipping AI features without destabilising a production platform
  - Making technical decisions under real time and headcount limits
lessons:
  - A scale-up rewards architecture that can be wrong cheaply.
  - Pick the decisions worth defending and leave the rest reversible.
phases:
  - id: platform
    title: Senior Backend Engineer
    roles: { backend: 3, architecture: 2 }
  - id: architecture
    title: Software Architect
    roles: { architecture: 3, backend: 2, ai-engineering: 1 }
  - id: ai
    title: Software Architect
    roles: { architecture: 3, backend: 1, ai-engineering: 3 }
```

The startup chapter deliberately repeats a title (tests title de-duplication) and has three phases (tests the middle title).

- [ ] **Step 9: Create `ChapterYears` and use it at the three render sites**

Create `src/components/ChapterYears.astro`:

```astro
---
import { ui } from "../lib/content"

export interface Props {
  years: { from: number; to: number | "present" }
}

const { years } = Astro.props
const labels = (await ui()).workCard
---

<!-- One line on purpose: whitespace between the spans would render. The
     non-breaking spaces make a screen reader say "2021 to 2023". -->
<span class="years tabular"><span>{years.from}</span><span class="years-sep" aria-hidden="true">·</span><span class="sr-only">&nbsp;{labels.yearsTo}&nbsp;</span><span>{years.to === "present" ? labels.present : years.to}</span></span>

<style>
  .years-sep {
    padding: 0 0.5em;
    opacity: 0.6;
  }
</style>
```

Then import it (`import ChapterYears from "./ChapterYears.astro"` in WorkCard, `"../../components/ChapterYears.astro"` in the page) and replace:
- `src/components/WorkCard.astro` (currently line 55): `<span class="card-meta-years tabular">{years}</span>` → `<span class="card-meta-years"><ChapterYears years={years} /></span>`
- `src/components/WorkCard.astro` (currently line 111): `<dd class="tabular">{years}</dd>` → `<dd><ChapterYears years={years} /></dd>`
- `src/pages/work/[slug].astro` (currently line 163): `<dd class="tabular">{work.years}</dd>` → `<dd><ChapterYears years={work.years} /></dd>`

Change WorkCard's `years: string` prop type to `years: { from: number; to: number | "present" }`.

- [ ] **Step 10: Verify**

Run: `pnpm test:content && pnpm build`
Expected: tests pass. Content check prints two `[DRAFT]` warnings (one per chapter) and the `[SPEC]` warnings are gone; the two R5 em-dash warnings on `years` are gone. Build succeeds.
Run: `grep -o '2021<[^>]*>[^<]*' dist/client/index.html | head -2` (or open `pnpm preview`)
Expected: the card shows `2021 · 2023` and `2023 · Present`.
Run: `pnpm check:content --strict; echo "exit $?"`
Expected: `exit 1` (drafts block deploy).

- [ ] **Step 11: Commit**

```bash
git add scripts src/content.config.ts src/lib/content.ts src/content/en src/components/ChapterYears.astro src/components/WorkCard.astro "src/pages/work/[slug].astro"
git commit -m "feat(work): add chapter phases, beats and draft gate

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Rewrite the card and add the river reveal

**Files:**
- Create: `src/lib/river-motion.ts`
- Rewrite: `src/components/WorkCard.astro`
- Modify: `src/components/WorkCarousel.astro` (props at lines 22-38, `animateCardText` at ~111-125, delete the "Chapter disclosure" block at ~212-226)
- Modify: `src/content/en/ui.yaml`, `src/content.config.ts`, `src/lib/content.ts` (remove `workCard.details`)

**Interfaces:**
- Consumes: `<ChapterRiver>` hooks `[data-river]`, `[data-river-body]`, `[data-river-title][data-x]` (Task 2); `<ChapterYears>` and the Task 3 fields and labels.
- Produces: `revealRiver(river: Element | null): void` from `src/lib/river-motion.ts` (used again in Task 5).

- [ ] **Step 1: Create the motion module**

Create `src/lib/river-motion.ts`:

```ts
import { gsap } from "gsap"

const DURATION = 1.2
const revealed = new WeakSet<Element>()

/** Inverse of expo.out (1 - 2^(-10t)): when the wipe reaches progress p. */
const reachAt = (p: number) => (DURATION * -Math.log2(1 - Math.min(p, 0.999))) / 10

/**
 * Draws a river left to right, once per river. The static markup is already
 * the finished state, so with reduced motion (or no JS) the river is simply
 * there. Each position title fades in as the wipe passes its phase.
 */
export function revealRiver(river: Element | null) {
  if (!river || revealed.has(river)) return
  revealed.add(river)
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

  const body = river.querySelector("[data-river-body]")
  if (body) {
    gsap.fromTo(
      body,
      { clipPath: "inset(0 100% 0 0)" },
      { clipPath: "inset(0 0% 0 0)", duration: DURATION, ease: "expo.out", clearProps: "clipPath" }
    )
  }

  river.querySelectorAll<HTMLElement>("[data-river-title]").forEach((title) => {
    gsap.fromTo(
      title,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, ease: "power2.out", delay: reachAt(Number(title.dataset.x) / 100) }
    )
  })
}
```

- [ ] **Step 2: Rewrite the card**

Replace the whole of `src/components/WorkCard.astro` with:

```astro
---
import ChapterRiver from "./ChapterRiver.astro"
import ChapterYears from "./ChapterYears.astro"
import { ui } from "../lib/content"
import type { RiverPhase } from "../lib/river"

export interface Props {
  title: string
  arena: string
  years: { from: number; to: number | "present" }
  whoIWas: string
  challenges: string[]
  lessons: string[]
  phases: RiverPhase[]
  slug: string
}

const { title, arena, years, whoIWas, challenges, lessons, phases, slug } = Astro.props
const labels = (await ui()).workCard
---

<!-- A chapter reads left to right like its river: who I was at the source,
     what I went through mid-stream, what I carried out at the mouth. -->
<article class="work-card">
  <header class="card-head">
    <div class="card-name">
      <p class="card-arena">{arena}</p>
      <h3 class="card-title">{title}</h3>
    </div>
    <p class="card-years"><ChapterYears years={years} /></p>
  </header>

  <ChapterRiver phases={phases} />

  <div class="card-beats">
    <section class="card-beat">
      <h4 class="card-beat-title">{labels.whoIWas}</h4>
      <p class="card-who">{whoIWas}</p>
    </section>

    <section class="card-beat">
      <h4 class="card-beat-title">{labels.challenges}</h4>
      <ul class="card-list">
        {challenges.map((item) => <li>{item}</li>)}
      </ul>
    </section>

    <section class="card-beat card-beat--lesson">
      <h4 class="card-beat-title">{labels.lessons}</h4>
      <ul class="card-list">
        {lessons.map((item) => <li>{item}</li>)}
      </ul>
    </section>
  </div>

  <a href={`/work/${slug}`} class="card-cta">
    <span data-cta-label>
      {labels.cta}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M3 8h10M9 4l4 4-4 4"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>
    <span data-cta-alt aria-hidden="true">{labels.ctaAlt}</span>
  </a>
</article>

<style>
  .work-card {
    width: 75vw;
    max-width: var(--max-width);
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 32px;
    background: var(--bg-surface);
    border: 1px solid color-mix(in srgb, var(--border-color) 10%, transparent);
    border-radius: var(--radius);
    padding: 48px;
    overflow: hidden;
  }

  .card-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 24px;
  }

  .card-name {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }

  /* The arena names the world. Not an eyebrow above the title: it is the
     title's subject, set at reading size in its own right. */
  .card-arena {
    font-size: var(--size-sm);
    color: var(--text-muted);
    letter-spacing: var(--tracking-tight);
  }

  .card-title {
    font-family: var(--font-display);
    font-size: var(--size-xl);
    font-weight: var(--weight-black);
    font-stretch: 108%;
    letter-spacing: var(--tracking-display);
    line-height: var(--leading-tight);
    color: var(--text-primary);
    text-wrap: balance;
  }

  /* Measurement, so mono earns its place. */
  .card-years {
    flex-shrink: 0;
    font-family: var(--font-mono);
    font-size: var(--size-xs);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    color: var(--text-secondary);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .card-beats {
    display: grid;
    grid-template-columns: 1fr 1.15fr 1.15fr;
    gap: 32px;
  }

  /* Each beat hangs from a hairline with a node, like a stop on the river. */
  .card-beat {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-top: 18px;
    border-top: 1px solid color-mix(in srgb, var(--border-color) 14%, transparent);
  }

  .card-beat::before {
    content: "";
    position: absolute;
    top: -5px;
    left: 0;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--bg-surface);
    border: 1.5px solid var(--text-secondary);
  }

  .card-beat--lesson::before {
    background: var(--accent);
    border-color: var(--accent);
  }

  .card-beat-title {
    font-size: var(--size-xs);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
    letter-spacing: var(--tracking-label);
    color: var(--text-secondary);
  }

  .card-beat--lesson .card-beat-title {
    color: var(--accent);
  }

  .card-who {
    font-size: var(--size-base);
    line-height: var(--leading-snug);
    color: var(--text-primary);
    max-width: 34ch;
  }

  .card-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .card-list li {
    position: relative;
    padding-left: 18px;
    font-size: var(--size-sm);
    line-height: var(--leading-snug);
    color: var(--text-secondary);
    max-width: 40ch;
  }

  .card-list li::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0.62em;
    width: 8px;
    height: 1px;
    background: color-mix(in srgb, var(--text-secondary) 60%, transparent);
  }

  /* The lessons lead: display face, primary colour, gold markers. */
  .card-beat--lesson .card-list li {
    font-family: var(--font-display);
    font-size: var(--size-base);
    font-weight: var(--weight-medium);
    color: var(--text-primary);
  }

  .card-beat--lesson .card-list li::before {
    background: var(--accent);
  }

  /* --- CTA (personality preserved) --------------------------------------- */

  .card-cta {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: var(--size-xs);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    color: var(--text-primary);
    padding: 14px 22px;
    min-height: 44px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    background: transparent;
    align-self: flex-start;
    transition: background var(--duration-fast) var(--ease),
      border-color var(--duration-fast) var(--ease),
      color var(--duration-fast) var(--ease);
  }

  .card-cta:hover {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--bg-primary);
  }

  .card-cta [data-cta-label] {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: opacity var(--duration-fast) ease,
      transform var(--duration-fast) ease;
    opacity: 1;
    transform: translateY(0);
  }

  .card-cta:hover [data-cta-label] {
    opacity: 0;
    transform: translateY(-6px);
  }

  .card-cta [data-cta-alt] {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transform: translateY(6px);
    font-size: var(--size-md);
    transition: opacity var(--duration-fast) ease,
      transform var(--duration-fast) ease;
  }

  .card-cta:hover [data-cta-alt] {
    opacity: 1;
    transform: translateY(0);
  }

  @media (prefers-reduced-motion: reduce) {
    .card-cta [data-cta-label],
    .card-cta [data-cta-alt] {
      transition: opacity var(--duration-fast) ease;
      transform: none;
    }

    .card-cta:hover [data-cta-label],
    .card-cta:hover [data-cta-alt] {
      transform: none;
    }
  }

  /* --- Small screens ------------------------------------------------------
     No disclosure: with short bullets the whole chapter fits in roughly
     750px, so nothing needs hiding. The beats stack in reading order. */
  @media (max-width: 900px) {
    .work-card {
      /* The carousel viewport is the rail, so 100% is the full column. */
      width: 100%;
      gap: 24px;
      padding: 26px 22px 22px;
      /* The carousel viewport is a scroll-snap scroller at this width. */
      scroll-snap-align: center;
    }

    .card-head {
      flex-direction: column;
      gap: 10px;
    }

    .card-beats {
      grid-template-columns: 1fr;
      gap: 24px;
    }

    .card-who,
    .card-list li {
      max-width: none;
    }
  }

  /* A thumb-width action, only where the column is actually thumb-width. */
  @media (max-width: 560px) {
    .card-cta {
      align-self: stretch;
      justify-content: center;
    }
  }
</style>
```

- [ ] **Step 3: Update the carousel**

In `src/components/WorkCarousel.astro`, replace the `<WorkCard ... />` props (lines 23-37) with:

```astro
          <WorkCard
            title={work.data.title}
            arena={work.data.arena}
            years={work.data.years}
            whoIWas={work.data.whoIWas}
            challenges={work.data.challenges}
            lessons={work.data.lessons}
            phases={work.data.phases}
            slug={work.id}
          />
```

In the `<script>`, add after the GSAP imports:

```ts
  import { revealRiver } from "../lib/river-motion"
```

Replace the whole `animateCardText` function with:

```ts
    function animateCardText(card: Element) {
      // The river draws itself once; the text staggers in every time.
      revealRiver(card.querySelector("[data-river]"))
      if (reduceMotion) return
      const targets = [...card.querySelectorAll(".card-head, .card-beat, .card-cta")] // content-ok: CSS selector list
      if (!targets.length) return

      gsap.fromTo(
        targets,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out", delay: 0.15 }
      )
    }
```

Delete the whole `// === Chapter disclosure (small screens) ===` block (the comment and the `document.querySelectorAll<HTMLButtonElement>("[data-fold-toggle]")...` loop).

- [ ] **Step 4: Remove the disclosure label**

Delete `details` and its two comment lines from `workCard` in `src/content/en/ui.yaml`, `details: z.string(),` from `uiSchema.workCard` in `src/content.config.ts` if present, and confirm the `ui` type in `src/lib/content.ts` has no `details`.

- [ ] **Step 5: Verify the build**

Run: `pnpm test:content && pnpm build`
Expected: all pass; content check shows only the two DRAFT warnings; build succeeds.
Run: `grep -o 'data-river-body' dist/client/index.html | wc -l`
Expected: `2` (one river per chapter).
Run: `grep -o 'data-fold' dist/client/index.html | wc -l`
Expected: `0`.

- [ ] **Step 6: Visual check**

Run `pnpm dev` and open `http://localhost:4321/#work` at 1280px wide and 390px wide (browser devtools device mode). If you cannot drive a browser, stop and ask the user to check these points:
- 1280px: titles sit above their phase lines and do not overlap; the last title is gold; mouth labels align with their streams; the three beats sit in one row; the startup chapter shows two titles (the repeated "Software Architect" is drawn once).
- 390px: only first and last title show, wrapped if needed; the legend row replaces mouth labels; beats stack; nothing overflows horizontally.
- Paging the carousel: the next card's river wipes in left to right once; paging back does not replay the wipe.
- With "prefers-reduced-motion: reduce" emulated (devtools Rendering panel): the river is fully drawn with no animation.

Fix anything found in one batch, then re-check once.

- [ ] **Step 7: Commit**

```bash
git add src/lib/river-motion.ts src/components/WorkCard.astro src/components/WorkCarousel.astro src/content/en/ui.yaml src/content.config.ts src/lib/content.ts
git commit -m "feat(work): rebuild chapter card around the river of roles

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Patch the chapter page and remove the old fields

**Files:**
- Modify: `src/pages/work/[slug].astro`
- Modify: `src/content.config.ts` (`workSchema`, `uiSchema`)
- Modify: `src/lib/content.ts` (`ui` type)
- Modify: `src/content/en/ui.yaml` (remove `workSpec`, `workCard.taught`)
- Modify: `src/content/en/work/consultant.md`, `src/content/en/work/startup.md`

**Interfaces:**
- Consumes: `<ChapterRiver variant="page">` (Task 2), `rolesUsed` (Task 1), `roles()` (Task 2), `revealRiver` (Task 4), `<ChapterYears>` and labels (Task 3).
- Produces: final content model: work entries no longer have `client`, `learned`, `roles`, `spec`, `specPlaceholder`.

- [ ] **Step 1: Patch the page frontmatter**

In `src/pages/work/[slug].astro`:
- Add imports: `import ChapterRiver from "../../components/ChapterRiver.astro"`, `import { rolesUsed } from "../../lib/river"`, and add `roles` to the existing `../../lib/content` import.
- Delete `const specLabels = (await ui()).workSpec`.
- Add after `const cardLabels = ...`:

```ts
// Tags are the roles the river shows, in role-list order: one source of truth.
const roleList = (await roles()).items
const roleNames = new Map(roleList.map((r) => [r.id, r.name]))
const tags = rolesUsed(work.phases, roleList.map((r) => r.id)).map((id) => roleNames.get(id))
```

- [ ] **Step 2: Patch the page markup**

Insert the river directly after the closing `</header>` of `.page-head`:

```astro
      <!-- Position titles will link to #position-<id> sections once they exist
           (pass phaseHref). Until then they are plain text. -->
      <div class="page-river">
        <ChapterRiver phases={work.phases} variant="page" />
      </div>
```

Replace the "What it taught me" block:

```astro
          <section class="block">
            <h2 class="block-title">{cardLabels.lessons}</h2>
            <ul class="block-list">
              {work.lessons.map((item) => <li>{item}</li>)}
            </ul>
          </section>
```

Replace the whole `<aside class="page-side">...</aside>` with:

```astro
        <aside class="page-side">
          <p class="side-years"><ChapterYears years={work.years} /></p>
          <div class="side-roles">
            {tags.map((name) => <span class="role-tag">{name}</span>)}
          </div>
        </aside>
```

Add before `<script type="application/ld+json"`:

```astro
  <script>
    import { gsap } from "gsap"
    import { ScrollTrigger } from "gsap/ScrollTrigger"
    import { revealRiver } from "../../lib/river-motion"

    gsap.registerPlugin(ScrollTrigger)
    document.querySelectorAll("[data-river]").forEach((river) => {
      ScrollTrigger.create({ trigger: river, start: "top 85%", once: true, onEnter: () => revealRiver(river) })
    })
  </script>
```

- [ ] **Step 3: Patch the page styles**

In the page `<style>`: delete the `.spec`, `.spec-row`, `.spec-row dt`, `.spec-row dd`, `.spec-row--head dd` rules and the `@media (max-width: 560px)` block that only targets `.spec-row`. Rename the `/* --- Side spec panel --- */` comment to `/* --- Side panel --- */`. Add:

```css
  .page-river {
    margin: 0 0 64px;
  }

  .side-years {
    font-family: var(--font-mono);
    font-size: var(--size-xs);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    color: var(--accent);
    font-variant-numeric: tabular-nums;
    padding-bottom: 12px;
    border-bottom: 1px solid color-mix(in srgb, var(--border-color) 12%, transparent);
  }
```

and change `.page-head`'s `margin: 24px 0 64px;` to `margin: 24px 0 48px;`.

- [ ] **Step 4: Remove the old fields**

In `src/content.config.ts` `workSchema`, delete the lines `learned`, `roles`, `client`, `specPlaceholder`, `spec`. In `uiSchema`, delete `taught` from `workCard` and the whole `workSpec` entry.

In `src/lib/content.ts` `ui` type, delete `taught: string` from `workCard` and the `workSpec` line.

In `src/content/en/ui.yaml`, delete `taught: What it taught me` and the whole `# Shared by the carousel card...` comment plus `workSpec:` block.

In both chapter files delete: `learned:`, `roles:`, `client:`, the `# ⚠️ PLACEHOLDER VALUES...` comment block (consultant, 4 lines) or `# ⚠️ PLACEHOLDER VALUES. See the note in consultant.md.` (startup), `specPlaceholder:` and the whole `spec:` list. The consultant frontmatter must end up as:

```yaml
---
order: 1
title: Consultant Chapter
arena: Enterprise consulting
description: Designing systems for clients who already have production traffic, existing constraints, and no appetite for a rewrite.
lede: Designing systems for clients who already have production traffic, existing constraints, and no appetite for a rewrite.
responsibilities:
  - Architecture review and target-state design on AWS
  - Backend delivery in Node.js and Python
  - Migration planning against live production constraints
  - Technical liaison between client stakeholders and delivery teams
years: { from: 2021, to: 2023 }
# ⚠️ DRAFT. `whoIWas`, `challenges` and `lessons` are drafted from the previous
# copy, and every phase title and role weight below is a PLACEHOLDER. PRODUCT.md
# forbids fabricated facts on this site. Replace them, then delete `draft: true`.
# `pnpm check:content` warns while it is set and `pnpm deploy` refuses to ship.
draft: true
whoIWas: A backend engineer learning to design for systems that were already in production.
challenges:
  - Planning migrations against live production constraints
  - Designing target-state architecture on AWS for systems nobody could switch off
  - Being the technical link between client stakeholders and delivery teams
lessons:
  - The best architecture is the one a client's team can actually operate after you leave.
  - Constraints are the brief, not an obstacle to it.
phases:
  - id: engineer
    title: Backend Engineer
    roles: { backend: 3, architecture: 1 }
  - id: architect
    title: Cloud Architect
    roles: { backend: 1, architecture: 3, client-liaison: 2 }
projects: []
---
```

and startup the same shape with its own values (no `projects` line; it had none).

- [ ] **Step 5: Verify**

Run: `grep -rn "specPlaceholder\|workSpec\|\.learned\|\.client\b\|\.taught\|data-spec" src`
Expected: no output.
Run: `pnpm test:content && pnpm build`
Expected: all pass; only the two DRAFT warnings; build succeeds.
Run `pnpm dev`, open `/work/consultant` and `/work/startup` at 1280px and 390px:
- the river spans the content width under the lede and wipes in once on scroll;
- lessons render as a list; the aside shows the year range and the role tags (Backend, Architecture, Client liaison for consultant);
- no spec table, no Client row.
If you cannot drive a browser, ask the user to check.

- [ ] **Step 6: Commit**

```bash
git add "src/pages/work/[slug].astro" src/content.config.ts src/lib/content.ts src/content/en
git commit -m "feat(work): put the river on the chapter page, drop spec fields

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Documentation

**Files:**
- Modify: `DESIGN.md` (both copies of the Work Section: lines starting `### Work Section (\`#work\`)` through the line before `- **Certifications sub-section**`, currently ~201-256 and ~380-435)
- Modify: `CONTENT.md`
- Modify: `AGENTS.md:46`

**Interfaces:**
- Consumes: the final state of Tasks 1-5.
- Produces: docs only.

- [ ] **Step 1: Replace both Work Section blocks in DESIGN.md**

Replace each of the two ranges with exactly this text (keep the `- **Certifications sub-section**` block that follows untouched):

```markdown
### Work Section (`#work`)
- Header: "Work Chapters" section label (the carousel indicator carries position)
- Description text below header (from `sections/work.yaml`)
- **Horizontal carousel** with arrow navigation and a `01/02` tabular indicator. Viewport carries an edge mask so the neighbouring card fades. Arrows are 44×44. Step distance is read from live layout (`offsetWidth` + computed `columnGap`).

**A chapter is a stretch of the journey, not a job.** The card reads left to right like its river:

- **Head**: arena line and chapter title (Archivo) on the left, the year range in mono on the right (`2021 · 2023`, `Present` for an ongoing chapter; `ChapterYears.astro`).
- **The river of roles** (`ChapterRiver.astro`, geometry in `src/lib/river.ts`): a horizontal streamgraph. Each chapter has 2 to 4 `phases`; each phase lists roles with a weight of 1 to 3. A role is a stream whose thickness is its weight, stacked around a centre line and joined with smooth curves, so roles swell, thin, appear and end. Growth reads as widening, never climbing.
  - Above each phase: the **position title** held then, on a dot at the phase line. A title repeated by the next phase is drawn once. The last title is gold.
  - Role names label the streams at the river's mouth. When a role ends before the mouth, a colour-swatch legend row is shown under the river instead of leaving it unnamed.
  - Role colours come from `design.river`, by the role's index in `src/content/en/roles.yaml`, so a role is the same colour in every chapter.
  - The SVG only draws shapes (`preserveAspectRatio="none"`, non-scaling strokes). Every word is HTML positioned from the geometry's percentages, so text never distorts. The SVG is `aria-hidden`; a visually hidden ordered list states each phase's title and roles.
- **Three beats** under the river, each hanging from a hairline with a node: *Who I was* (one sentence), *The challenges* (bullets), *What it taught me* (bullets in Archivo, gold node and markers). Column order mirrors the river: source, mid-stream, mouth.
- **CTA** to `/work/[slug]` with the dual-label flip.

The spec panel (Client / Years / Domain / Cloud / Stack) is gone: "Client" named employers, and the values were placeholders.

> ⚠️ Both chapters ship with `draft: true`: drafted beats and placeholder phase titles and role weights. `pnpm check:content` warns per chapter, and `pnpm deploy` refuses to ship until the author supplies the facts and removes the flag.

#### Below 900px

- Card is 100% wide, the viewport becomes a `scroll-snap` scroller, controls move above the card.
- River height drops from 150px to 110px; mouth labels give way to the legend row.
- Only the first and last position titles are drawn (they may wrap); middle titles stay in the screen-reader list.
- Beats stack. There is no disclosure: with short bullets the card is about 750px tall, down from about 1250px.

#### Motion

One authored moment: when a river first comes into view (or the carousel pages to its card) its body wipes in left to right with a `clip-path` reveal, 1.2s `expo.out`, and each position title fades in as the wipe reaches it (the delay is the inverse of the ease curve). Once per river (`src/lib/river-motion.ts`). The text beats keep the existing entrance stagger. Skipped entirely under `prefers-reduced-motion`; the static markup is the finished river.

- `cards` is read as `.work-card`, not `track.children`: Astro injects a component's hoisted script at the component's own position, which for WorkCard is inside the track, and that stray element was being counted as a chapter (`01/03` for two chapters).

#### Chapter page (`/work/[slug]`)

The river runs full width between the header and the body (`variant="page"`, 200px tall). The side panel holds the year range and role tags derived from the phases. Each phase has an `id`; position titles will link to `#position-<id>` sections when the page grows them (`phaseHref` prop).
```

- [ ] **Step 2: Update CONTENT.md**

In the "Where content lives" tree, add under `ui.yaml`:

```
      roles.yaml               # the roles a chapter's river can show (order = stacking + colour)
```

In the "Where does it go?" table add a row after the work chapter row:

```
| A role name shown in a chapter's river | `roles.yaml` | `roles()` |
```

Replace the second paragraph of "## Adding a work chapter" (the `specPlaceholder` one) with:

```markdown
A chapter's card is `whoIWas` (one sentence), `challenges` (1 to 4 bullets),
`lessons` (1 to 3 bullets), `years` (`{ from: 2021, to: 2023 }` or
`to: present`) and `phases` (2 to 4). Each phase is
`{ id, title, roles: { <role id>: 1-3 } }`: `title` is the position held,
`roles` the mix of roles and how much of each. Role ids must exist in
`roles.yaml`, or the build fails. Adding a role also needs a colour in
`design.config.ts` → `river`.

`draft: true` means the chapter still carries drafted copy or placeholder
phases. `pnpm build` warns while it is set and `pnpm deploy` refuses to ship.
```

In the rules table replace the SPEC row with:

```
| DRAFT | A chapter still carrying `draft: true` | warning |
```

- [ ] **Step 3: Fix the test count in AGENTS.md**

Replace line 46 with:

```markdown
- **No linter or typecheck script** is configured. The only tests are `pnpm test:content`: unit tests for the content-rules module and the river geometry (`src/lib/river.ts`).
```

- [ ] **Step 4: Verify and commit**

Run: `grep -n "specPlaceholder\|spec panel\|SPEC" DESIGN.md CONTENT.md AGENTS.md`
Expected: only the sentence "The spec panel ... is gone" in DESIGN.md (twice, once per copy).
Run: `pnpm build`
Expected: succeeds with the two DRAFT warnings.

```bash
git add DESIGN.md CONTENT.md AGENTS.md
git commit -m "docs: describe the river of roles card and the draft gate

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```
