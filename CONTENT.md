# CONTENT.md: Content Architecture

**The rule: no human-readable string may live in a `.astro`, `.ts`, or `.js` file.**
Prose, headings, button labels, `alt` text, `aria-label`s, SEO metadata and
JSON-LD values all live in `src/content/`. `pnpm build` fails if they do not.

## Where content lives

    src/content/en/
      site.yaml                # identity, contact channels, employer, schema.org Person values
      seo.yaml                 # site metadata, per-page title and description
      ui.yaml                  # label dictionary, keyed by component
      sections/
        hero.yaml              # hidden h1, headline, lede, base line, jump label, portrait
        services.yaml          # header + hint + the service items
        work.yaml              # work section header
        certifications.yaml    # label + credentials
        contact.yaml           # header + lede + action cards
        footer.yaml            # copyright
      work/
        <slug>.md               # one chapter: frontmatter = brief, body = detail

    src/content.config.ts      # collections + Zod schemas (schema is code)
    src/lib/content.ts         # the ONLY module that imports astro:content

## I have a new string. Where does it go?

| The string is | It goes in | Read it with |
|---|---|---|
| Prose belonging to one page section | `sections/<section>.yaml` | `<section>()` |
| A section heading or description | the `header` block of that section's file | same accessor |
| A button label, `aria-label`, `alt`, or structural heading | `ui.yaml`, under that component's key | `ui()` |
| A contact channel, URL, or identity fact | `site.yaml` | `site()` |
| A page `<title>`, meta description, or OG value | `seo.yaml` | `seo()` |
| Anything about one work chapter | `work/<slug>.md` frontmatter | `workChapters()` / `workChapter()` |
| A long-form chapter write-up | the Markdown body of `work/<slug>.md` | `renderChapter(entry)` |
| A design token (colour, size, easing) | `src/design.config.ts` | not content, leave it there |
| A string that exists only for screen readers or search engines | the same file as its visible siblings, never a component | same accessor |

Two fields exist purely for the accessibility tree and for search engines, and
are worth knowing about because nothing on screen reveals them:

- **`sections/hero.yaml` → `srHeadline`** is rendered as a visually hidden `<h1>`
  in `Hero.astro`. It is the page's only `<h1>`; the visible display headline is
  an `<h2>`. Keep it factually identical to `seo.pages.home.title` and to
  `site.person` — a hidden heading that disagrees with the visible page is the
  one version of this pattern that *is* search spam.
- **`site.yaml` → `person.worksFor`** feeds `schema.org/Person.worksFor`. It is
  never rendered. Verify the URL resolves before changing it.

Two structural rules:

1. **One file per section, header included.** A section's heading lives with its
   content. Never split a section's title from its items across two files.
2. **`ui.yaml` is keyed by component, not by page**, `nav.*`, `serviceCard.*`,
   `workCard.*`. A component reads exactly one block, so its whole text surface
   is visible in one place.

## Adding a section

1. Create `src/content/en/sections/<name>.yaml`.
2. Add a schema and a collection in `src/content.config.ts`:
   `<name>: defineCollection({ loader: section('<name>'), schema: <name>Schema })`
3. Add a one-line accessor in `src/lib/content.ts`.
4. Read it in the component with `await <name>()`. Never call `getEntry` directly.

## Adding a work chapter

Create `src/content/en/work/<slug>.md`. The filename is the URL slug. Copy the
frontmatter fields from an existing chapter, all are required except `projects`.
Set `order` to control carousel position. Leave the body empty to render the
holding state; write Markdown to render the full write-up.

`specPlaceholder: true` means the chapter's `spec` values are invented.
`pnpm build` warns while it is true and `pnpm deploy` refuses to ship.

## The rules the check enforces

`pnpm check:content` (also run by `pnpm build`):

| Rule | Catches | Severity |
|---|---|---|
| R1 | A literal text node in `.astro` markup | error |
| R2 | A literal `alt`, `aria-label`, `title`, `placeholder`, or copy-bearing `<meta content>` | error |
| R3 | A string or template literal with two adjacent words, in frontmatter, `.ts`, or a client `<script>` | error |
| R4 | `astro:content` imported outside `content.config.ts` and `lib/content.ts` (type-only imports are fine) | error |
| R5 | The `—` character in a content file (AGENTS.md forbids it in copy) | warning |
| SPEC | A chapter still carrying `specPlaceholder: true` | warning |

Exempt files: `design.config.ts`, `content.config.ts`, `lib/content.ts`, `env.d.ts`.

## The escape hatch

R1-R3 are heuristics and will occasionally flag a genuinely technical string,
such as a media query in a GSAP block. Two ways out, both requiring a reason:

- `// content-ok: media query, not copy` on the same line
- an exact entry in `scripts/content-check.allow.json` for repeated strings

**Never put human-readable copy in the allowlist.** If the check flags real copy,
migrate the copy, that is the rule working.

## Adding a language

The layout is locale-ready but not localized. To add Italian:

1. Copy `src/content/en/` to `src/content/it/` and translate.
2. In `src/content.config.ts`, widen `ROOT` to a `*` glob so entry ids become
   locale-prefixed.
3. Thread a `locale` parameter through the accessors in `src/lib/content.ts`.

No component changes, because no component knows a path or a collection name.

## Commands

| Command | Action |
|---|---|
| `pnpm check:content` | Run the content rules; warnings do not fail |
| `pnpm check:content --strict` | Warnings fail too; what `pnpm deploy` runs |
| `pnpm test:content` | Unit tests for the rules module (runs `node --test "scripts/lib/*.test.mjs"`) |
| `pnpm build` | Content check, then Astro build |
