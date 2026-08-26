# Content Architecture — Design

> Date: 2026-08-26
> Status: approved, ready for implementation planning

## 1. Problem

Copy and data are entangled with design across the codebase. `src/data/` exists and is
typed, but it is not authoritative:

- Copy lives inside components: the hero headline array and lede (`Hero.astro`), nav
  section labels and CTA labels (`Nav.astro`), contact action titles and notes
  (`Contact.astro`), block titles in `WorkCard.astro` and `work/[slug].astro`, the
  footer copyright, the certifications label, the services drag hint.
- Copy lives inside page and layout code: `<title>` and `description` in
  `index.astro`, the JSON-LD `Person` block, `siteUrl`, `siteName`, `ogImage` and the
  skip-link in `BaseLayout.astro`.
- Where `src/data/` is used, it is TypeScript, so copy still lives in code.
- Indirection: `Services.astro` reads its heading from `sections.ts` and its items from
  `services.ts`, two files for one section.

## 2. Goals

1. Establish one standard for where content lives and how the UI reads it.
2. Refactor the existing code onto that standard with no visual or copy change.
3. Make the standard machine-enforced, so future work by AI agents cannot drift from it.

### Decisions taken

| Decision | Choice |
|---|---|
| Scope of "copy" | **All human-readable strings** — prose, headings, button labels, `alt`, `aria-label`, SEO metadata, JSON-LD values |
| Localization | English only now, but the layout and access layer make adding a locale a file-addition, not a rewrite. No locale keys in content yet |
| Enforcement | Docs + an automated check that **fails the build** |
| Content format | Astro Content Layer, YAML + Markdown, Zod-validated |

### Non-goals

- No visual change, no copy rewriting, no component restructuring.
- `src/design.config.ts` is untouched. It holds tokens, not copy, and is out of scope.
- No `<style>` block is modified.
- The two known content problems flagged in today's `src/data/` headers (invented
  `spec` numbers on work chapters, unreviewed `help` bullets on services) move across
  **unchanged and still flagged**. Fixing them inside this refactor would hide them.

## 3. Format decision

Because copy may not live in TypeScript, content must live in non-code files. Three
options were considered:

- **Astro Content Layer with YAML + Markdown (chosen).** Zod schemas give build-time
  validation of every key, Markdown bodies give the work write-ups a home, and a locale
  is a directory addition. Verified against the installed Astro: `glob()` treats `.yaml`
  as a registered data entry type (one file → one entry, id from filename, flat
  document) and `file()` bundles `js-yaml`. **Zero new dependencies.**
- **Plain JSON plus a hand-rolled typed accessor.** Rejected: JSON is hostile to prose
  (no multiline, no comments, escaped quotes) and validation would be hand-built.
- **Markdown for everything.** Rejected: absurd for micro-copy such as
  `aria-label="Toggle menu"`.

## 4. File layout

```
src/content/
  en/
    site.yaml                # identity, urls, channels, base location, JSON-LD facts
    seo.yaml                 # defaults + per-page title/description/og
    ui.yaml                  # label dictionary, keyed by component
    sections/
      hero.yaml              # headline lines, lede, base line, jump label
      services.yaml          # header + the 4 service items
      work.yaml              # header + carousel labels
      contact.yaml           # header + the 3 action cards
      certifications.yaml    # label + the 4 credentials
      footer.yaml            # copyright line
    work/
      consultant.md
      startup.md
src/content.config.ts        # collections + Zod schemas
src/lib/content.ts          # accessor layer + LOCALE constant
scripts/check-content.mjs   # the enforcement script
```

Two structural rules:

**One file per section, header included.** A section's heading lives with its content.
`sections/services.yaml` is `header: {title, description}` plus `items: [...]`. This
removes the `sections.ts` + `services.ts` indirection: one component, one content file.
`hero.yaml` and `footer.yaml` carry no header block because neither renders one; each
section file has its own schema, so this is not an inconsistency to paper over.

**`ui.yaml` is keyed by component, not by page** — `nav.cta.primary`,
`nav.burger.ariaLabel`, `serviceCard.backTitle`, `workCard.blocks.held`. A component
reads exactly one entry, so its entire text surface is visible in one place and a
deleted component leaves one obviously-dead key.

## 5. Work chapters: brief and detail

One Markdown file per chapter. Frontmatter is the brief, the body is the detail:

```yaml
---
title: Consultant Chapter
arena: Enterprise consulting
description: <page meta description, new required field>
lede: ...
responsibilities: [...]
learned: ...
roles: [Architecture, Backend, AWS]
client: Reply
years: 2021 - 2023
specPlaceholder: true
spec:
  - { label: Domain, value: Enterprise / consulting }
projects: []        # optional [{ name, summary, outcome }]
---

Long-form write-up in Markdown. An empty body renders the holding state.
```

Rationale: `/work/[slug]` already renders every brief field the card renders, then adds
projects and the write-up. Detail is not a different document, it is the same document
read at greater depth. `render()` on the body gives the write-up with no extra plumbing,
and today's nested optional `detail?` object disappears.

The two long-form surfaces stay independently optional: `projects: []` skips the Projects
block, an empty body renders the "full write-up" holding state. Same behaviour as today.

Rejected alternatives: `work/<slug>/{brief.yaml,detail.md}` (the detail page needs the
brief fields anyway, so it reads both files and gains only a second path to keep in sync);
briefs as a list in `work.yaml` with details in `work/*.md` (adding a chapter touches two
files and the slug link is a hand-maintained string Zod cannot verify, so a card can ship
with no page).

## 6. Schemas and access layer

`src/content.config.ts` — one collection per content file, each with its own tight Zod
schema:

```ts
const ROOT = './src/content/en'                      // the single locale seam
const section = (name: string) =>
  glob({ base: `${ROOT}/sections`, pattern: `${name}.yaml` })

export const collections = {
  site: defineCollection({ loader: glob({ base: ROOT, pattern: 'site.yaml' }), schema: siteSchema }),
  seo:  defineCollection({ loader: glob({ base: ROOT, pattern: 'seo.yaml'  }), schema: seoSchema  }),
  ui:   defineCollection({ loader: glob({ base: ROOT, pattern: 'ui.yaml'   }), schema: uiSchema   }),
  hero: defineCollection({ loader: section('hero'), schema: heroSchema }),
  services: defineCollection({ loader: section('services'), schema: servicesSchema }),
  workSection:    defineCollection({ loader: section('work'), schema: workSectionSchema }),
  contact:        defineCollection({ loader: section('contact'), schema: contactSchema }),
  certifications: defineCollection({ loader: section('certifications'), schema: certificationsSchema }),
  footer:         defineCollection({ loader: section('footer'), schema: footerSchema }),
  work: defineCollection({ loader: glob({ base: `${ROOT}/work`, pattern: '**/*.md' }), schema: workSchema }),
}
```

Ten collections is deliberate verbosity: a shared loose schema would validate nothing.
Each schema states exactly which keys must exist and of what type, so a missing or
mistyped key is a build error naming the file and the key, not `undefined` rendered
into the page.

`src/lib/content.ts` is the **only** module that imports `astro:content`:

```ts
export const LOCALE = 'en'
export const hero = () => data('hero', 'hero')
export const ui   = () => data('ui', 'ui')
export const workChapters = () => getCollection('work')
export const workChapter  = (slug: string) => ...
```

`data()` calls `getEntry`, throws a named error if the entry is absent, and returns
typed `.data`. Three reasons the layer exists:

1. **It is the locale seam.** Adding Italian means `ROOT` becomes a `*` glob, ids become
   `it/hero`, accessors take `(locale = LOCALE)`. Zero component changes.
2. **It is enforceable.** The check script asserts `astro:content` is imported only here
   and in `content.config.ts`, so an agent cannot reach around the layer.
3. Non-null assertions and error messages live in one place instead of ten.

**JSON-LD and metadata.** `site.yaml` holds the facts (name, job titles, description,
`knowsAbout`, `sameAs`, `siteUrl`, `ogImage`); `BaseLayout.astro` still composes the
`@context` / `@type` object. The rule: **schema keys are code, values are content.**

**Work page SEO** comes from chapter frontmatter (`title`, plus the new required
`description`) merged with defaults from `seo.yaml`, so a new chapter cannot ship
without page metadata.

## 7. Enforcement

Three layers, weakest to strongest.

**Layer 1 — Astro's own validation, free.** Once the Zod schemas exist, malformed or
incomplete content is already a build error.

**Layer 2 — `scripts/check-content.mjs`**, run as `pnpm check:content` and wired in:

```json
"build": "node scripts/check-content.mjs && astro build"
```

`pnpm build`, `pnpm preview` and `pnpm deploy` all gate on it. Rules:

- **R1 — markup text nodes.** After stripping frontmatter, `<style>`, `<script>` and
  comments, any text node in an `.astro` template containing a word of two or more
  letters is a violation. SVG path data and class names are not text nodes, so false
  positives are near zero.
- **R2 — copy-bearing attributes.** `alt`, `aria-label`, `title`, `placeholder` must be
  `{expression}`, never a quoted literal. For `<meta content>` the rule applies **only**
  to the copy-bearing names (`description`, `og:title`, `og:description`, `og:image:alt`,
  `twitter:title`, `twitter:description`) and must **not** fire on technical values such
  as `width=device-width, initial-scale=1`, `website`, or `summary_large_image`.
- **R3 — string literals in code.** Applies to `.ts` files, `.astro` frontmatter, and
  `.astro` client `<script>` blocks. Any literal containing two adjacent alphabetic words
  is a violation. `<script>` blocks are in scope precisely because a label can be
  injected from JavaScript; this is also where the escape hatch below earns its keep.
- **R4 — layer integrity.** `astro:content` may be imported only by
  `src/content.config.ts` and `src/lib/content.ts`.

Exempt files: `src/design.config.ts`, `src/content.config.ts`, `src/lib/content.ts`,
`src/env.d.ts`.

**The escape hatch is required, not a weakness.** R3 will fire on genuinely technical
strings in GSAP client blocks (e.g. `"prefers-reduced-motion: reduce"`). Two ways out:
a `// content-ok: <reason>` or `<!-- content-ok: reason -->` comment on the line, and
`scripts/content-check.allow.json` for repeated technical strings, seeded during the
refactor. The reason string is mandatory, so every exception is self-documenting and
greppable. A rule with no escape hatch gets deleted the first time it blocks real work.

Failure output is written for an agent: `file:line`, the offending string, the rule id,
and the remedy — *move to `src/content/en/...` and read it via `src/lib/content.ts`*.

**The `specPlaceholder` gate moves into the script.** Today it is a `console.warn`
inside `WorkCard.astro` that only fires in PROD. In the script it warns on `pnpm build`
and **fails** under `--strict` on `pnpm deploy`, which is what the banner in `work.ts`
always intended. This also removes render-time logging from a component.

**Layer 3 — documentation**, so agents comply before the script has to catch them.

- **`CONTENT.md`** — the standard: taxonomy, a decision table for "I have a new string,
  where does it go", how to add a section or a chapter, the escape hatch, the commands.
- **`AGENTS.md`** gains a short hard-rule block pointing at `CONTENT.md`. It is already
  pulled into `CLAUDE.md` via `@AGENTS.md`, and the other agent configs in the repo
  (`.cursor/`, `.codex/`, `.opencode/`) read `AGENTS.md` by convention, so one edit
  reaches all of them.
- **`DESIGN.md`**'s existing sync rule extends to note that no copy lives in components.

**Stated limit.** R1–R3 are heuristics over source text, not a parser. They catch every
realistic case of an agent writing copy into a component and can be defeated by
deliberate string concatenation. Against accident and agent drift, which is the actual
threat, they hold.

## 8. Migration inventory

Every literal to move, from a full source scan:

| File | Strings |
|---|---|
| `Hero.astro` | headline (3 lines), `Ciao! I am`, `Salvatore`, `, a digital nomad and creative software engineer`, `See the work`, portrait `alt`, `PORTRAIT` path |
| `Nav.astro` | section labels (Services/Work/Contact), `Let's meet` (x2), `Book now`, `aria-label`s: home, LinkedIn, GitHub, Medium, Toggle menu, Navigation menu |
| `Services.astro` | `Drag the badges, or tap one to turn it over`, `aria-label`s: badge deck, Previous/Next service |
| `ServiceCard.astro` | `How I help` |
| `WorkCarousel.astro` | `Certifications`, `aria-label`s: Previous/Next project |
| `WorkCard.astro` | `What I held`, `What it taught me`, `Client`, `Years`, `Look inside` |
| `Contact.astro` | intro paragraph, `Book a call`, `60 minutes, no pitch. Pick a slot`, `Message on LinkedIn`, `Fastest for a quick question`, `Email` |
| `Footer.astro` | `© 2026 Salvatore Cirone` |
| `BaseLayout.astro` | `siteUrl`, `siteName`, `ogImage`, the full JSON-LD `Person` values, `Skip to main content` |
| `index.astro` | page `title` and `description` |
| `work/[slug].astro` | `All chapters`, `What I held`, `What it taught me`, `Projects`, `The full write-up`, the holding-state paragraphs, `Ask me about it on a call`, `Client`, `Years` |
| `src/data/*.ts` | all five files move to YAML/Markdown, then the directory is deleted |

`LoadingScreen.astro` contains no copy and needs no change.

## 9. Order of work

1. **Snapshot.** `pnpm build`, copy `dist/` aside.
2. **Scaffold** `src/content/en/**`, `src/content.config.ts`, `src/lib/content.ts`,
   moving strings verbatim.
3. **Migrate component by component** — Footer, Nav, Hero, ServiceCard/Services,
   WorkCard/WorkCarousel, Contact, BaseLayout, `index.astro`, `work/[slug].astro`. One
   commit each, building after each.
4. **Delete `src/data/`** once nothing imports it.
5. **Add** `scripts/check-content.mjs`, wire it into `build`, seed the allowlist from
   what it legitimately flags in the GSAP blocks.
6. **Write** `CONTENT.md`, patch `AGENTS.md` and `DESIGN.md`.

## 10. Verification

There is no test suite, so the gate is a byte diff of `dist/` against the step-1
snapshot. Expected non-empty diffs, each to be confirmed by eye:

- `/work/*`: the write-up holding state now keys off an empty Markdown body rather than
  an absent `detail` object. Markup should be identical; the mechanism differs.
- Incidental whitespace where a literal text node became `{expression}`. Anything beyond
  whitespace at those points is a bug to fix, not to accept.

Everything else must be byte-identical. Plus: `pnpm check:content` exits clean, and
`pnpm check:content --strict` fails while any chapter still has `specPlaceholder: true`.
