# Content Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move every human-readable string out of components, layouts, pages and `src/data/*.ts` into YAML and Markdown content files read through a single validated accessor layer, then make the separation enforceable by a build-gating check script.

**Architecture:** Content lives in `src/content/en/**` as YAML (one file per section, plus `site`, `seo`, `ui`) and Markdown (one file per work chapter, frontmatter = brief, body = long-form detail). `src/content.config.ts` declares one Astro content collection per file with a tight Zod schema, so a missing or mistyped key is a build error. `src/lib/content.ts` is the only module allowed to import `astro:content`; components call named accessors, which is what makes adding a locale later a one-file change. `scripts/check-content.mjs` scans source for literal copy and fails the build.

**Tech Stack:** Astro v6 (static output via `@astrojs/cloudflare`), pnpm, Node >=22.12.0, GSAP, Zod (bundled with Astro), `node:test` (built in) for the check script's unit tests. **No new dependencies.**

**Spec:** `docs/superpowers/specs/2026-08-26-content-architecture-design.md`

## Global Constraints

- **Zero new dependencies.** Astro bundles `js-yaml` and Zod; `node:test` and `node:assert` are built into Node 22. Do not add a package.
- **Node >=22.12.0**, pnpm only. Never run `npm install`.
- **No visual change and no copy rewriting.** Every string moves verbatim, including typos, emoji and em dashes. This is a pure architecture refactor.
- **Never modify** `src/design.config.ts`, any `<style>` block, or any CSS.
- **Never modify** the GSAP logic inside `<script>` blocks, except where a string literal must be read from content.
- **Copy rule (AGENTS.md):** copy must never use the `—` character; prefer `,` or `.`. Existing content violates this in several places. Task 9 adds a **warn-only** rule for it. **Do not fix those strings in this plan** — that is a copy edit for the site owner.
- **Rendered output must not change.** Verification is a normalized byte diff of `dist/client/**/*.html` against a baseline, per Task 1's `verify-dist` helper. Only the diffs explicitly listed in a task's verification step are acceptable.
- **One commit per task.** Message prefix `refactor(content):` for migration tasks, `feat(content):` for the check script, `docs:` for documentation.
- Rendered HTML is at `dist/client/`, not `dist/`.

---

### Task 1: Content plumbing, proven end to end on the Footer

Establishes the baseline snapshot, the verification helper, the collection config, the accessor layer, and the first migrated component. The Footer is chosen because it holds exactly one string, so any failure here is a plumbing failure, not a content failure.

**Files:**
- Create: `scripts/verify-dist.sh`
- Create: `src/content/en/sections/footer.yaml`
- Create: `src/content.config.ts`
- Create: `src/lib/content.ts`
- Modify: `src/components/Footer.astro:1-3` (frontmatter) and `:19` (the copyright `<p>`)
- Modify: `.gitignore` (add `dist-baseline/`)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `src/lib/content.ts` exports `LOCALE: string` and `footer(): Promise<{ copyright: string }>`.
  - The internal helper `data(collection: string, id: string)` — every later accessor is one line built on it.
  - `scripts/verify-dist.sh` — usage `./scripts/verify-dist.sh` diffs normalized `dist-baseline/client/**/*.html` against `dist/client/**/*.html`, exits 0 when identical.

- [ ] **Step 1: Build the baseline and stash it**

```bash
pnpm build
rm -rf dist-baseline && cp -R dist dist-baseline
echo "dist-baseline/" >> .gitignore
```

This baseline is the reference for every remaining task. Do not rebuild it after this point.

- [ ] **Step 2: Write the verification helper**

Create `scripts/verify-dist.sh`:

```bash
#!/usr/bin/env bash
# Diffs rendered HTML against dist-baseline/, normalizing content-derived
# asset hashes so an unchanged page compares equal.
set -uo pipefail

norm() {
  sed -E \
    -e 's/_astro\/([A-Za-z0-9_.-]+)\.[A-Za-z0-9_-]{8}\.(css|js)/_astro\/\1.HASH.\2/g' \
    "$1"
}

status=0
for base in $(cd dist-baseline/client && find . -name '*.html' | sort); do
  new="dist/client/${base#./}"
  old="dist-baseline/client/${base#./}"
  if [ ! -f "$new" ]; then
    echo "MISSING in new build: $base"; status=1; continue
  fi
  if ! diff -u <(norm "$old") <(norm "$new") > /tmp/vd.diff; then
    echo "=== DIFF: $base ==="; cat /tmp/vd.diff; status=1
  fi
done

for new in $(cd dist/client && find . -name '*.html' | sort); do
  [ -f "dist-baseline/client/${new#./}" ] || { echo "NEW page: $new"; status=1; }
done

[ $status -eq 0 ] && echo "dist HTML identical to baseline"
exit $status
```

```bash
chmod +x scripts/verify-dist.sh
```

- [ ] **Step 3: Confirm the helper reports clean on an untouched build**

Run: `pnpm build && ./scripts/verify-dist.sh`
Expected: `dist HTML identical to baseline`, exit 0. If it reports diffs before any change is made, the normalization is wrong — fix it now, because every later task depends on this signal.

- [ ] **Step 4: Create the first content file**

Create `src/content/en/sections/footer.yaml`:

```yaml
# Footer section. No heading is rendered here, so there is no `header` block.
copyright: © 2026 Salvatore Cirone
```

Note: the source used the HTML entity `&copy;`. YAML holds the character itself, which renders as the same glyph. This produces a one-character diff in `index.html` and both work pages, which is expected and confirmed in Step 8.

- [ ] **Step 5: Create the collection config**

Create `src/content.config.ts`:

```ts
import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

/**
 * Content root. This is the single locale seam: adding a second language means
 * turning this into a `*` glob and threading a locale through src/lib/content.ts.
 * No component ever references a path or a collection name.
 */
const ROOT = './src/content/en'

/** One YAML file in sections/ becomes one entry whose id is the filename. */
const section = (name: string) =>
  glob({ base: `${ROOT}/sections`, pattern: `${name}.yaml` })

const footerSchema = z.object({
  copyright: z.string(),
})

export const collections = {
  footer: defineCollection({ loader: section('footer'), schema: footerSchema }),
}
```

- [ ] **Step 6: Create the accessor layer**

Create `src/lib/content.ts`:

```ts
import { getEntry } from 'astro:content'
import type { CollectionKey } from 'astro:content'

/**
 * The ONLY module allowed to import `astro:content`. Components call the named
 * accessors below so that collection ids and locale paths live in one place.
 * scripts/check-content.mjs enforces this (rule R4).
 */
export const LOCALE = 'en'

async function data<K extends CollectionKey>(collection: K, id: string) {
  const entry = await getEntry(collection as never, id as never)
  if (!entry) {
    throw new Error(
      `Missing content entry "${id}" in collection "${collection}". ` +
        `Expected a file under src/content/${LOCALE}/ — see CONTENT.md.`
    )
  }
  return (entry as { data: unknown }).data
}

export const footer = () => data('footer', 'footer') as Promise<{ copyright: string }>
```

- [ ] **Step 7: Prove the validation actually fires**

Temporarily rename the key in `src/content/en/sections/footer.yaml` from `copyright:` to `copyrigt:`, then run `pnpm build`.
Expected: build FAILS with a Zod error naming `footer.yaml` and the missing `copyright` field.
Then revert the typo. This is the one place the plan verifies that the safety net exists; do not skip it.

- [ ] **Step 8: Migrate the Footer**

In `src/components/Footer.astro`, replace the empty frontmatter (lines 1-3) with:

```astro
---
import { footer } from "../lib/content"

const content = await footer()
---
```

Then replace the copyright line:

```astro
    <p class="footer-copy">{content.copyright}</p>
```

- [ ] **Step 9: Verify**

Run: `pnpm build && ./scripts/verify-dist.sh`
Expected: exactly three diffs, one per page, each showing only `&copy;` becoming `©`. No other change. If anything else differs, fix it before committing.

- [ ] **Step 10: Commit**

```bash
git add scripts/verify-dist.sh src/content src/content.config.ts src/lib/content.ts src/components/Footer.astro .gitignore
git commit -m "refactor(content): add content layer plumbing, migrate Footer

Establishes src/content/en as the content root, one Zod-validated
collection per file, and src/lib/content.ts as the sole astro:content
consumer. Footer proves the pipeline end to end.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Site facts, SEO metadata and JSON-LD

Moves the identity facts, page metadata and structured-data values out of `BaseLayout.astro` and `index.astro`. The JSON-LD object *shape* stays in code; only its values move. `site.yaml` also absorbs `src/data/site.ts`, though that file is not deleted until Task 8 because Nav, Hero, Contact and the work page still import it.

**Files:**
- Create: `src/content/en/site.yaml`
- Create: `src/content/en/seo.yaml`
- Modify: `src/content.config.ts` (add `site` and `seo` collections)
- Modify: `src/lib/content.ts` (add `site()` and `seo()` accessors)
- Modify: `src/layouts/BaseLayout.astro:1-11` (frontmatter), `:58-88` (siteUrl/siteName/ogImage/JSON-LD), `:138` (skip link), `:104-113` (og:image dimensions)
- Modify: `src/pages/index.astro:11-14` (title and description props)

**Interfaces:**
- Consumes: `data()` and `LOCALE` from Task 1.
- Produces:
  - `site(): Promise<SiteContent>` where `SiteContent` is `{ bookingUrl, email, linkedin, github, medium, base, person: { name, givenName, familyName, jobTitle: string[], description, knowsAbout: string[] } }`
  - `seo(): Promise<SeoContent>` where `SeoContent` is `{ siteName, siteUrl, ogImage, ogImageWidth, ogImageHeight, pages: { home: { title, description }, work: { titleTemplate } } }`
  - Later tasks read contact channels from `site()`, never from `src/data/site.ts`.

- [ ] **Step 1: Create `src/content/en/site.yaml`**

```yaml
# Identity and contact channels. Single source of truth: these were previously
# scattered across Nav.astro, Contact.astro and BaseLayout.astro.
bookingUrl: https://calendar.app.google/PRkS5N4zfMgpPgud7
email: s.cirone.work@gmail.com
linkedin: https://www.linkedin.com/in/salvatore-cirone-it/
github: https://github.com/aka-somix
medium: https://medium.com/@salvatorecirone

# Read in the hero base line.
base: Based in Italy

# Values for the schema.org Person block. The JSON-LD object shape lives in
# BaseLayout.astro; only these values are content. `sameAs` is derived from the
# linkedin and github channels above, in that order.
person:
  name: Salvatore Cirone
  givenName: Salvatore
  familyName: Cirone
  jobTitle:
    - Cloud Solutions Architect
    - Senior Backend Engineer
    - AI Engineer
  description: Tech nomad turning complex cloud and AI challenges into elegant realities.
  knowsAbout:
    - AWS
    - Cloud Architecture
    - AI/ML
    - Node.js
    - Python
    - Backend Engineering
```

- [ ] **Step 2: Create `src/content/en/seo.yaml`**

```yaml
# NOTE for the site owner: siteUrl below is the about. subdomain, which is what
# canonical and OG tags have always used, while astro.config.mjs `site` is the
# apex domain used by the sitemap. That discrepancy predates this refactor and is
# deliberately left alone here.
siteName: Salvatore Cirone
siteUrl: https://about.salvatorecirone.dev
ogImage: /images/og/v1.png
ogImageWidth: "1200"
ogImageHeight: "630"

pages:
  home:
    title: Salvatore Cirone | Senior Backend Engineer & AWS Architect
    description: Salvatore Cirone — Senior Backend Engineer, AWS Solutions Architect, and AI Prompt Engineer. Cloud-native development and scalable architectures for global teams.
  work:
    # {title} is replaced with the chapter title.
    titleTemplate: "{title} | Salvatore Cirone"
```

- [ ] **Step 3: Add the schemas and collections**

In `src/content.config.ts`, add above `export const collections`:

```ts
const siteSchema = z.object({
  bookingUrl: z.string().url(),
  email: z.string().email(),
  linkedin: z.string().url(),
  github: z.string().url(),
  medium: z.string().url(),
  base: z.string(),
  person: z.object({
    name: z.string(),
    givenName: z.string(),
    familyName: z.string(),
    jobTitle: z.array(z.string()).min(1),
    description: z.string(),
    knowsAbout: z.array(z.string()).min(1),
  }),
})

const seoSchema = z.object({
  siteName: z.string(),
  siteUrl: z.string().url(),
  ogImage: z.string(),
  ogImageWidth: z.string(),
  ogImageHeight: z.string(),
  pages: z.object({
    home: z.object({ title: z.string(), description: z.string() }),
    work: z.object({ titleTemplate: z.string() }),
  }),
})
```

and add to the `collections` object:

```ts
  site: defineCollection({ loader: glob({ base: ROOT, pattern: 'site.yaml' }), schema: siteSchema }),
  seo:  defineCollection({ loader: glob({ base: ROOT, pattern: 'seo.yaml'  }), schema: seoSchema  }),
```

- [ ] **Step 4: Add the accessors**

Append to `src/lib/content.ts`:

```ts
export const site = () => data('site', 'site') as Promise<{
  bookingUrl: string
  email: string
  linkedin: string
  github: string
  medium: string
  base: string
  person: {
    name: string
    givenName: string
    familyName: string
    jobTitle: string[]
    description: string
    knowsAbout: string[]
  }
}>

export const seo = () => data('seo', 'seo') as Promise<{
  siteName: string
  siteUrl: string
  ogImage: string
  ogImageWidth: string
  ogImageHeight: string
  pages: {
    home: { title: string; description: string }
    work: { titleTemplate: string }
  }
}>
```

- [ ] **Step 5: Rewire `BaseLayout.astro` frontmatter**

Replace lines 1-11 with:

```astro
---
import { design } from "../design.config"
import LoadingScreen from "../components/LoadingScreen.astro"
import { seo, site } from "../lib/content"

export interface Props {
  title: string
  description: string
}

const { title, description } = Astro.props
const { palette, font, type, layout, animation } = design
const meta = await seo()
const channels = await site()
---
```

`ui()` is deliberately absent here: it does not exist until Task 3, and importing a
missing export fails the build. Task 3 adds the `ui` import, the `labels` line, and
the skip-link edit together.

Leave the `cssVars` template exactly as it is.

- [ ] **Step 6: Replace the metadata constants and JSON-LD**

Delete lines 58-60 (`siteUrl`, `ogImage`, `siteName`) and replace the two JSON-LD objects with:

```ts
const siteUrl = meta.siteUrl
const ogImage = meta.ogImage
const siteName = meta.siteName

const jsonLdPerson = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": channels.person.name,
  "givenName": channels.person.givenName,
  "familyName": channels.person.familyName,
  "jobTitle": channels.person.jobTitle,
  "description": channels.person.description,
  "url": siteUrl,
  "sameAs": [channels.linkedin, channels.github],
  "knowsAbout": channels.person.knowsAbout,
  "image": `${siteUrl}${ogImage}`
}

const jsonLdWebsite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": siteName,
  "url": siteUrl
}
```

Keeping the local `siteUrl` / `ogImage` / `siteName` aliases means the `<head>` markup below needs no edit, which keeps this diff small and the output identical.

- [ ] **Step 7: Move the og:image dimensions to content**

Replace the two hardcoded dimension meta tags:

```astro
    <meta property="og:image:width" content={meta.ogImageWidth} />
    <meta property="og:image:height" content={meta.ogImageHeight} />
```

- [ ] **Step 8: Move the home page metadata**

In `src/pages/index.astro`, replace the `<BaseLayout ...>` opening tag with:

```astro
<BaseLayout title={home.title} description={home.description}>
```

and add to its frontmatter, after the existing imports:

```ts
import { seo } from "../lib/content"

const home = (await seo()).pages.home
```

- [ ] **Step 9: Verify**

Run: `pnpm build && ./scripts/verify-dist.sh`
Expected: only the Task 1 `&copy;` diff. The `<title>`, description, all OG and Twitter tags, and both JSON-LD blocks must be byte-identical, including key order in the JSON. If the JSON-LD diff shows reordered keys, match the original order exactly.

The skip link (`Skip to main content`) is intentionally **not** migrated here — it needs `ui.yaml`, which Task 3 creates.

- [ ] **Step 10: Commit**

```bash
git add src/content src/content.config.ts src/lib/content.ts src/layouts/BaseLayout.astro src/pages/index.astro
git commit -m "refactor(content): move site facts, SEO and JSON-LD values to content

JSON-LD keys stay in code, values come from site.yaml. sameAs is now
derived from the linkedin and github channels instead of duplicating them.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: The UI label dictionary and the Nav

Creates `ui.yaml`, the component-keyed label dictionary that every later task adds to, and migrates its two first consumers: the skip link in `BaseLayout.astro` and the whole of `Nav.astro`.

**Files:**
- Create: `src/content/en/ui.yaml`
- Modify: `src/content.config.ts` (add `ui` collection)
- Modify: `src/lib/content.ts` (add `ui()` accessor)
- Modify: `src/layouts/BaseLayout.astro` (frontmatter + skip link)
- Modify: `src/components/Nav.astro:1-10` (frontmatter), nav markup, sidebar markup

**Interfaces:**
- Consumes: `data()`, `site()` from Tasks 1-2.
- Produces: `ui(): Promise<UiContent>`. The full `UiContent` shape is written out in Step 1 and Step 3; later tasks extend both the YAML and the type together. Keys used by later tasks: `ui().services`, `ui().serviceCard`, `ui().work`, `ui().workCard`, `ui().workSpec`, `ui().workPage`.

- [ ] **Step 1: Create `src/content/en/ui.yaml` with every label the site needs**

Written in full now so later tasks only wire up consumers. Keyed by component, so a component's entire text surface is one block.

```yaml
# UI label dictionary, keyed by component. A component reads exactly one block.
# Structural labels, accessibility strings and button text all live here; prose
# lives in sections/*.yaml.

layout:
  skipLink: Skip to main content

nav:
  logoAriaLabel: Salvatore Cirone — home
  links:
    - { id: services, label: Services }
    - { id: work, label: Work }
    - { id: contact, label: Contact }
  cta:
    label: Let's meet
    alt: Book now
  burgerAriaLabel: Toggle menu
  sidebarAriaLabel: Navigation menu
  socialAriaLabels:
    linkedin: LinkedIn
    github: GitHub
    medium: Medium

services:
  deckAriaLabel: Services — draggable badge deck
  prevAriaLabel: Previous service
  nextAriaLabel: Next service

serviceCard:
  helpLabel: How I help
  # Appended to the service title to form the flip button's aria-label.
  flipAriaSuffix: " — flip for detail"

work:
  prevAriaLabel: Previous project
  nextAriaLabel: Next project

workCard:
  held: What I held
  taught: What it taught me
  cta: Look inside
  ctaAlt: 👀👀👀👀👀👀

# Shared by the carousel card and the chapter page.
workSpec:
  client: Client
  years: Years

workPage:
  back: All chapters
  projects: Projects
  writeUpTitle: The full write-up
  holding:
    title: The full write-up
    body1: Still being written. The projects, the decisions that turned out to be right, and the ones that didn't are the interesting part, and they deserve more than a paragraph.
    body2: Happy to walk you through any of it in the meantime.
    cta: Ask me about it on a call
```

- [ ] **Step 2: Add the schema and collection**

In `src/content.config.ts`:

```ts
const uiSchema = z.object({
  layout: z.object({ skipLink: z.string() }),
  nav: z.object({
    logoAriaLabel: z.string(),
    links: z.array(z.object({ id: z.string(), label: z.string() })).min(1),
    cta: z.object({ label: z.string(), alt: z.string() }),
    burgerAriaLabel: z.string(),
    sidebarAriaLabel: z.string(),
    socialAriaLabels: z.object({
      linkedin: z.string(),
      github: z.string(),
      medium: z.string(),
    }),
  }),
  services: z.object({
    deckAriaLabel: z.string(),
    prevAriaLabel: z.string(),
    nextAriaLabel: z.string(),
  }),
  serviceCard: z.object({ helpLabel: z.string(), flipAriaSuffix: z.string() }),
  work: z.object({ prevAriaLabel: z.string(), nextAriaLabel: z.string() }),
  workCard: z.object({
    held: z.string(),
    taught: z.string(),
    cta: z.string(),
    ctaAlt: z.string(),
  }),
  workSpec: z.object({ client: z.string(), years: z.string() }),
  workPage: z.object({
    back: z.string(),
    projects: z.string(),
    writeUpTitle: z.string(),
    holding: z.object({
      title: z.string(),
      body1: z.string(),
      body2: z.string(),
      cta: z.string(),
    }),
  }),
})
```

and in `collections`:

```ts
  ui: defineCollection({ loader: glob({ base: ROOT, pattern: 'ui.yaml' }), schema: uiSchema }),
```

- [ ] **Step 3: Add the accessor**

Append to `src/lib/content.ts`:

```ts
export const ui = () => data('ui', 'ui') as Promise<{
  layout: { skipLink: string }
  nav: {
    logoAriaLabel: string
    links: { id: string; label: string }[]
    cta: { label: string; alt: string }
    burgerAriaLabel: string
    sidebarAriaLabel: string
    socialAriaLabels: { linkedin: string; github: string; medium: string }
  }
  services: { deckAriaLabel: string; prevAriaLabel: string; nextAriaLabel: string }
  serviceCard: { helpLabel: string; flipAriaSuffix: string }
  work: { prevAriaLabel: string; nextAriaLabel: string }
  workCard: { held: string; taught: string; cta: string; ctaAlt: string }
  workSpec: { client: string; years: string }
  workPage: {
    back: string
    projects: string
    writeUpTitle: string
    holding: { title: string; body1: string; body2: string; cta: string }
  }
}>
```

- [ ] **Step 4: Migrate the skip link**

In `src/layouts/BaseLayout.astro`, add `ui` to the content import, add `const labels = await ui()` after `const channels = await site()`, and replace the skip link:

```astro
    <a href="#main-content" class="skip-link">{labels.layout.skipLink}</a>
```

- [ ] **Step 5: Migrate the Nav frontmatter**

Replace `src/components/Nav.astro` lines 1-10 with:

```astro
---
import { site, ui } from "../lib/content"

const channels = await site()
const nav = (await ui()).nav

const BOOKING_URL = channels.bookingUrl
const sections = nav.links
---
```

Keeping the `BOOKING_URL` and `sections` local names means the markup below only changes where a literal is being removed.

- [ ] **Step 6: Migrate the Nav markup**

Six edits in the `<nav>` block, all mechanical substitutions:

```astro
    <a href="/" class="nav-logo" aria-label={nav.logoAriaLabel}>
```
```astro
      <a href={channels.linkedin} target="_blank" class="nav-social" aria-label={nav.socialAriaLabels.linkedin} rel="noopener noreferrer">
```
```astro
      <a href={channels.github} target="_blank" class="nav-social" aria-label={nav.socialAriaLabels.github} rel="noopener noreferrer">
```
```astro
      <a href={channels.medium} target="_blank" class="nav-social" aria-label={nav.socialAriaLabels.medium} rel="noopener noreferrer">
```
```astro
      <span data-cta-label>{nav.cta.label}</span>
      <span data-cta-alt aria-hidden="true">{nav.cta.alt}</span>
```
```astro
    <button class="nav-burger" data-burger aria-label={nav.burgerAriaLabel} aria-expanded="false">
```

Then in the `<aside class="sidebar">` block:

```astro
<aside class="sidebar" data-sidebar role="dialog" aria-modal="true" aria-label={nav.sidebarAriaLabel}>
```

the three sidebar social links get the same `aria-label={nav.socialAriaLabels.*}` and `href={channels.*}` treatment as above, and the sidebar CTA becomes:

```astro
    <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" class="sidebar-cta" data-sidebar-cta>{nav.cta.label}</a>
```

The two `{sections.map(...)}` loops need no change: `sections` now comes from content and still yields `{ id, label }`.

Leave `alt=""` on the social `<img>` tags exactly as it is. An empty alt is correct for a decorative image beside a labelled link, and it is not copy.

- [ ] **Step 7: Verify**

Run: `pnpm build && ./scripts/verify-dist.sh`
Expected: only the Task 1 `&copy;` diff, plus possible whitespace-only shifts where `>Let's meet<` became `>{nav.cta.label}<`. Any non-whitespace difference in the nav or sidebar is a bug — the labels, hrefs and aria-labels must render identically.

- [ ] **Step 8: Commit**

```bash
git add src/content src/content.config.ts src/lib/content.ts src/layouts/BaseLayout.astro src/components/Nav.astro
git commit -m "refactor(content): add ui.yaml label dictionary, migrate Nav

ui.yaml is keyed by component so a component's whole text surface is one
block. Nav and the skip link are its first consumers.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: The Hero

The hero holds the site's most load-bearing copy and the only case of prose with inline markup, so it gets its own task.

**Files:**
- Create: `src/content/en/sections/hero.yaml`
- Modify: `src/content.config.ts`, `src/lib/content.ts`
- Modify: `src/components/Hero.astro:1-19` (frontmatter), portrait `img`, headline loop, lede, base line, jump link

**Interfaces:**
- Consumes: `data()`, `site()`.
- Produces: `hero(): Promise<{ headline: string[]; lede: { before, name, after }; baseSuffix: string; jumpLabel: string; portrait: { src, alt } }>`

- [ ] **Step 1: Create `src/content/en/sections/hero.yaml`**

The lede is split into three parts because the original wraps `Salvatore` in `<strong>`. Splitting keeps the markup in the component and the words in content, with no HTML in YAML and no `set:html`.

```yaml
# The headline is the claim, at display scale. Three explicit lines because the
# sentence is three sentences, and because the load-in animation expands them in
# sequence.
headline:
  - Architecture that holds.
  - AI that ships.
  - From wherever I am.

# Split around the <strong> in the markup. Leading and trailing spaces are
# significant, so these are quoted.
lede:
  before: "Ciao! I am "
  name: Salvatore
  after: ", a digital nomad and creative software engineer"

# Follows site.yaml `base` in the same paragraph.
baseSuffix: "; living around the world"

jumpLabel: See the work

portrait:
  src: /images/Hero.webp
  alt: Illustrated low-poly portrait of Salvatore Cirone
```

- [ ] **Step 2: Add the schema and collection**

In `src/content.config.ts`:

```ts
const heroSchema = z.object({
  headline: z.array(z.string()).min(1),
  lede: z.object({ before: z.string(), name: z.string(), after: z.string() }),
  baseSuffix: z.string(),
  jumpLabel: z.string(),
  portrait: z.object({ src: z.string(), alt: z.string() }),
})
```
```ts
  hero: defineCollection({ loader: section('hero'), schema: heroSchema }),
```

- [ ] **Step 3: Add the accessor**

```ts
export const hero = () => data('hero', 'hero') as Promise<{
  headline: string[]
  lede: { before: string; name: string; after: string }
  baseSuffix: string
  jumpLabel: string
  portrait: { src: string; alt: string }
}>
```

- [ ] **Step 4: Rewrite the Hero frontmatter**

Replace lines 1-19 of `src/components/Hero.astro` with:

```astro
---
import { hero, site } from "../lib/content"

const channels = await site()
const content = await hero()

const headline = content.headline
const PORTRAIT = content.portrait.src
---
```

The explanatory comment about the headline moves into `hero.yaml` (Step 1), where the copy it describes now lives.

- [ ] **Step 5: Migrate the markup**

Portrait alt:

```astro
        alt={content.portrait.alt}
```

The headline loop is unchanged. The lede, base line and jump link become:

```astro
      <p class="hero-lede" data-animate="hero-text">
        {content.lede.before}<strong>{content.lede.name}</strong>{content.lede.after}
      </p>

      <p class="hero-base" data-animate="hero-text">
        {channels.base}{content.baseSuffix}
      </p>

      <a href="#work" class="hero-jump" data-animate="hero-text">
        {content.jumpLabel}
```

Leave the `<svg>` inside the jump link exactly as it is.

- [ ] **Step 6: Verify**

Run: `pnpm build && ./scripts/verify-dist.sh`
Expected: the `&copy;` diff, plus a **whitespace-only** diff in the hero lede. The original source wrapped mid-sentence, so it rendered `creative\n        software engineer`; the new version renders the sentence on one line. Confirm by eye that the words and the `<strong>` placement are identical and only whitespace moved. Also confirm `{channels.base}{content.baseSuffix}` renders `Based in Italy; living around the world` with no space before the semicolon.

- [ ] **Step 7: Commit**

```bash
git add src/content src/content.config.ts src/lib/content.ts src/components/Hero.astro
git commit -m "refactor(content): move hero copy to sections/hero.yaml

Lede is split around its inline <strong> so markup stays in the component
and words stay in content.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Services section and ServiceCard

Merges `src/data/services.ts` and the `services` entry of `src/data/sections.ts` into one file, which is the payoff of the one-file-per-section rule: `Services.astro` goes from reading two data modules to reading one.

**Files:**
- Create: `src/content/en/sections/services.yaml`
- Modify: `src/content.config.ts`, `src/lib/content.ts`
- Modify: `src/components/Services.astro:1-6` (frontmatter), header, hint, deck aria-label, arrows
- Modify: `src/components/ServiceCard.astro` (frontmatter Props, flip aria-label, two `How I help` labels)
- Delete: `src/data/services.ts`

**Interfaces:**
- Consumes: `data()`, `ui()`.
- Produces: `services(): Promise<{ header: { title, description }, items: ServiceItem[] }>` where `ServiceItem` is `{ id, title, tag, description, help: string[], image, imageAlt }`.
- `ServiceCard`'s `Props` interface is unchanged except for one added prop: `helpLabel: string` and `flipAriaSuffix: string` are **not** added — the card reads `ui()` itself. See Step 5.

- [ ] **Step 1: Create `src/content/en/sections/services.yaml`**

Copy the four items verbatim from `src/data/services.ts`, carrying the draft-copy notice across as a YAML comment so the warning is not lost.

```yaml
# ---------------------------------------------------------------------------
# DRAFT COPY NOTICE
#
# The `help` bullets on each service are drafted from the existing service
# descriptions and PRODUCT.md. They are capability statements, not measured
# claims: no numbers, clients, or outcomes are asserted. They are still
# marketing copy written in Salvatore's voice by someone who is not Salvatore,
# so they are worth a read-through and an edit before they represent him.
# ---------------------------------------------------------------------------

header:
  title: Services
  description: What I do best

hint: Drag the badges, or tap one to turn it over

items:
  - id: backend
    title: Senior Backend Engineer
    # Short domain line on the badge front.
    tag: Node.js · Python · AWS
    description: Powering your application with robust, scalable backend solutions using Node.js, Python, and cloud services.
    # Badge reverse: how he actually helps.
    help:
      - Design and build services that hold up under real traffic
      - Untangle an existing codebase without stopping delivery
      - Set the testing, observability and deployment baseline
      - Review and harden what your team already shipped
    image: /images/services/backend.png
    imageAlt: Senior Backend Engineer avatar

  - id: solution-architect
    title: Cloud Solutions Architect
    tag: AWS · Well-Architected
    description: Designing and implementing scalable, secure, and cost-effective cloud architectures tailored to your business needs.
    help:
      - Target-state architecture your team can actually operate
      - Migration paths that work around live production constraints
      - Cost and security review of an existing AWS estate
      - Written decisions, so the reasoning outlives the engagement
    image: /images/services/solution-architect.png
    imageAlt: Cloud Solutions Architect avatar

  - id: ai-engineer
    title: AI Engineer
    tag: LLMs · Evaluation · Deployment
    description: Finetuning and deploying AI models to enhance your applications with intelligent features and automation.
    help:
      - Find the AI features worth building, and the ones that aren't
      - Ship LLM features into a product without destabilising it
      - Build the evaluation loop before the demo, not after
      - Keep cost and latency inside something you can budget for
    image: /images/services/ai-engineer.png
    imageAlt: AI Engineer avatar

  - id: digital-nomad
    title: Digital Nomad Consulting
    tag: Distributed teams · Async
    description: Help in working remotely while traveling the world, maintaining productivity and work-life balance.
    help:
      - Set up an engineering team that works across timezones
      - Async practices that survive people being offline
      - Practical logistics from someone who actually does this
      - Hiring and onboarding when nobody shares an office
    image: /images/services/digital-nomad.png
    imageAlt: Digital Nomad Consulting avatar
```

- [ ] **Step 2: Add the schema and collection**

```ts
const servicesSchema = z.object({
  header: z.object({ title: z.string(), description: z.string() }),
  hint: z.string(),
  items: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        tag: z.string(),
        description: z.string(),
        help: z.array(z.string()).min(1),
        image: z.string(),
        imageAlt: z.string(),
      })
    )
    .min(1),
})
```
```ts
  services: defineCollection({ loader: section('services'), schema: servicesSchema }),
```

- [ ] **Step 3: Add the accessor**

```ts
export const services = () => data('services', 'services') as Promise<{
  header: { title: string; description: string }
  hint: string
  items: {
    id: string
    title: string
    tag: string
    description: string
    help: string[]
    image: string
    imageAlt: string
  }[]
}>
```

- [ ] **Step 4: Migrate `Services.astro`**

Replace lines 1-6 with:

```astro
---
import ServiceCard from "./ServiceCard.astro"
import { services, ui } from "../lib/content"

const content = await services()
const section = content.header
const labels = (await ui()).services
const items = content.items
---
```

Markup edits:

```astro
  <p class="services-hint rail" data-services-header>
    {content.hint}
  </p>
```
```astro
      aria-label={labels.deckAriaLabel}
```
```astro
      <button class="deck-arrow" data-deck-prev aria-label={labels.prevAriaLabel}>
```
```astro
      <button class="deck-arrow" data-deck-next aria-label={labels.nextAriaLabel}>
```

Then replace the three remaining references to the old `services` array with `items`: the `{services.map((service, i) => ...)}` loop becomes `{items.map((service, i) => ...)}`, `total={services.length}` becomes `total={items.length}`, and the deck indicator becomes `01/{String(items.length).padStart(2, "0")}`.

`{section.title}` and `{section.description}` need no change.

- [ ] **Step 5: Migrate `ServiceCard.astro`**

The card reads its own two labels from `ui()` rather than taking them as props. Reason: they are fixed chrome, identical for every card, so threading them through `Services.astro` as props would put the same string in two files' interfaces for no gain.

Add to the frontmatter, after the `Astro.props` destructure:

```ts
const labels = (await ui()).serviceCard
```

and add the import at the top of the frontmatter:

```ts
import { ui } from "../lib/content"
```

Markup edits:

```astro
  aria-label={`${title}${labels.flipAriaSuffix}`}
```
```astro
          {labels.helpLabel}
```
(the `badge-hint` span, after its `<svg>`)
```astro
        <span class="badge-back-title">{labels.helpLabel}</span>
```

Leave the existing explanatory comment block in the frontmatter in place: it documents the three transform layers, which is design intent, not copy.

- [ ] **Step 6: Delete the old data module**

```bash
git rm src/data/services.ts
```

- [ ] **Step 7: Verify**

Run: `pnpm build && ./scripts/verify-dist.sh`
Expected: the `&copy;` diff, plus whitespace-only shifts where the hint paragraph and the `How I help` labels were inline text. All four service cards must render identical titles, tags, descriptions, help bullets, image paths and alt text. The flip `aria-label` must still read `Senior Backend Engineer — flip for detail`.

- [ ] **Step 8: Commit**

```bash
git add -A src/content src/content.config.ts src/lib/content.ts src/components/Services.astro src/components/ServiceCard.astro src/data
git commit -m "refactor(content): merge services data and section heading into one file

Services.astro previously read its heading from sections.ts and its items
from services.ts. Now one component reads one content file.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Work chapters, certifications and the carousel

The largest task, and the one that changes a data shape: work chapters become Markdown files whose body is the long-form detail. `WorkCarousel.astro` and `WorkCard.astro` migrate together because the carousel passes every card prop, so splitting them would mean editing both twice.

**Files:**
- Create: `src/content/en/sections/work.yaml`
- Create: `src/content/en/sections/certifications.yaml`
- Create: `src/content/en/work/consultant.md`
- Create: `src/content/en/work/startup.md`
- Modify: `src/content.config.ts`, `src/lib/content.ts`
- Modify: `src/components/WorkCarousel.astro:1-7` (frontmatter), card loop, arrows, cert subsection
- Modify: `src/components/WorkCard.astro:1-38` (frontmatter), block titles, spec labels, CTA
- Delete: `src/data/work.ts`, `src/data/certifications.ts`

**Interfaces:**
- Consumes: `data()`, `ui()`.
- Produces:
  - `workSection(): Promise<{ header: { title, description } }>`
  - `certifications(): Promise<{ label: string; items: { name, issuer, logo, link }[] }>`
  - `workChapters(): Promise<CollectionEntry<'work'>[]>` — sorted by the `order` frontmatter field ascending. Each entry has `.id` (the filename without extension, used as the slug), `.data` (the brief), and `.body` (the raw detail Markdown).
  - `workChapter(slug: string): Promise<CollectionEntry<'work'>>`
  - `renderChapter(entry: CollectionEntry<'work'>): Promise<{ Content: AstroComponentFactory }>` — wraps `render()` from `astro:content`, which is the content-layer API. `entry.render()` is the legacy API and does **not** exist on glob-loader collections; do not use it.`
  - `WorkCard`'s `Props` interface loses `specPlaceholder` and gains nothing; see Step 6.

- [ ] **Step 1: Create the two section files**

`src/content/en/sections/work.yaml`:

```yaml
header:
  title: Work Chapters
  description: A peek at my journey
```

`src/content/en/sections/certifications.yaml`:

```yaml
# Rendered as a subsection inside the work section.
label: Certifications

items:
  - name: AWS Solutions Architect Professional (SAP-C02)
    issuer: Amazon Web Services
    logo: /images/certifications/aws-sap.png
    link: https://aws.amazon.com/certification/certified-solutions-architect-professional/
  - name: AWS Data Engineer Associate (DAE-C01)
    issuer: Amazon Web Services
    logo: /images/certifications/aws-dae.png
    link: https://aws.amazon.com/certification/certified-data-engineer-associate/
  - name: IELTS Academic Band 8.0
    issuer: British Council
    logo: /images/certifications/ielts.png
    link: https://www.ielts.org/
  - name: Software Engineer Certificate
    issuer: Hackerrank
    logo: /images/certifications/hackerrank.png
    link: https://www.hackerrank.com/certificates/812122bd1887
```

- [ ] **Step 2: Create the two work chapters**

`order` is required because `getCollection` returns entries alphabetically by id, which would put `consultant` before `startup` — correct today by luck, not by intent. `description` is the new required page-metadata field; both use the existing lede verbatim, which is what the page rendered before.

`src/content/en/work/consultant.md`:

```markdown
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
learned: Consulting teaches you that the best architecture is the one a client's team can actually operate after you leave. Constraints are the brief, not an obstacle to it.
roles: [Architecture, Backend, AWS]
client: Reply
years: 2021 — 2023
# ⚠️ PLACEHOLDER VALUES. PRODUCT.md forbids fabricated metrics on this site.
# Every `spec` value below is INVENTED. Replace each one with a real value, then
# set specPlaceholder to false. `pnpm check:content` warns while this is true and
# `pnpm deploy` refuses to ship it.
specPlaceholder: true
spec:
  - { label: Domain, value: Enterprise / consulting }
  - { label: Engagements, value: "6" }
  - { label: Cloud, value: AWS }
  - { label: Core stack, value: Node.js · Python · Terraform }
  - { label: Largest system, value: 40 services }
  - { label: Team span, value: 4 — 12 engineers }
projects: []
---
```

Note: the body is intentionally empty, which renders the holding state exactly as today. Do not invent a write-up.

`src/content/en/work/startup.md`:

```markdown
---
order: 2
title: Startup Chapter
arena: Product engineering at scale-up pace
description: Owning architecture where the roadmap changes faster than the diagram, and shipping AI features on top of it without destabilising the platform.
lede: Owning architecture where the roadmap changes faster than the diagram, and shipping AI features on top of it without destabilising the platform.
responsibilities:
  - Platform architecture and its evolution across releases
  - Backend services for a production agritech platform
  - AI feature design, evaluation and deployment
  - Technical decisions under genuine time and headcount limits
learned: A scale-up rewards architecture that can be wrong cheaply. You learn to pick the decisions worth defending and to leave the rest reversible.
roles: [Architecture, Backend, AI Engineering]
client: xFarm Technologies
years: 2023 — present
# ⚠️ PLACEHOLDER VALUES. See the note in consultant.md.
specPlaceholder: true
spec:
  - { label: Domain, value: Agritech SaaS }
  - { label: Cloud, value: AWS }
  - { label: Core stack, value: Node.js · Python · PostgreSQL }
  - { label: AI surface, value: LLM features in production }
  - { label: Platform, value: Multi-tenant }
  - { label: Team span, value: 8 — 20 engineers }
---
```

`projects` is omitted here to confirm the schema's default works; `consultant.md` sets it explicitly to `[]`. Both must render the holding state.

- [ ] **Step 3: Add the schemas and collections**

```ts
const workSectionSchema = z.object({
  header: z.object({ title: z.string(), description: z.string() }),
})

const certificationsSchema = z.object({
  label: z.string(),
  items: z
    .array(
      z.object({
        name: z.string(),
        issuer: z.string(),
        logo: z.string(),
        link: z.string().url(),
      })
    )
    .min(1),
})

const workSchema = z.object({
  order: z.number().int(),
  title: z.string(),
  arena: z.string(),
  description: z.string(),
  lede: z.string(),
  responsibilities: z.array(z.string()).min(1),
  learned: z.string(),
  roles: z.array(z.string()).min(1),
  client: z.string(),
  years: z.string(),
  specPlaceholder: z.boolean(),
  spec: z.array(z.object({ label: z.string(), value: z.string() })).min(1),
  projects: z
    .array(z.object({ name: z.string(), summary: z.string(), outcome: z.string() }))
    .default([]),
})
```

In `collections`:

```ts
  workSection:    defineCollection({ loader: section('work'), schema: workSectionSchema }),
  certifications: defineCollection({ loader: section('certifications'), schema: certificationsSchema }),
  work: defineCollection({
    loader: glob({ base: `${ROOT}/work`, pattern: '**/*.md' }),
    schema: workSchema,
  }),
```

- [ ] **Step 4: Add the accessors**

Append to `src/lib/content.ts`, and add `getCollection` to the existing `astro:content` import:

```ts
import { getCollection, getEntry, render } from 'astro:content'
import type { CollectionEntry } from 'astro:content'

export const workSection = () => data('workSection', 'work') as Promise<{
  header: { title: string; description: string }
}>

export const certifications = () => data('certifications', 'certifications') as Promise<{
  label: string
  items: { name: string; issuer: string; logo: string; link: string }[]
}>

/** Chapters in author-declared order. `entry.id` is the slug. */
export async function workChapters(): Promise<CollectionEntry<'work'>[]> {
  const all = await getCollection('work')
  return all.sort((a, b) => a.data.order - b.data.order)
}

export async function workChapter(slug: string): Promise<CollectionEntry<'work'>> {
  const entry = await getEntry('work', slug)
  if (!entry) {
    throw new Error(
      `Missing work chapter "${slug}". Expected src/content/${LOCALE}/work/${slug}.md — see CONTENT.md.`
    )
  }
  return entry
}

/**
 * Renders a chapter's Markdown body. `render()` from astro:content is the
 * content-layer API; the legacy `entry.render()` method does not exist on
 * glob-loader collections. Wrapped here so pages never import astro:content.
 */
export const renderChapter = (entry: CollectionEntry<'work'>) => render(entry)
```

- [ ] **Step 5: Migrate `WorkCarousel.astro`**

Replace lines 1-7 with:

```astro
---
import WorkCard from "./WorkCard.astro"
import { certifications, ui, workChapters, workSection } from "../lib/content"

const section = (await workSection()).header
const works = await workChapters()
const certs = await certifications()
const labels = (await ui()).work
---
```

The card loop now spreads chapter data and passes the slug from the entry id:

```astro
        {works.map((work, i) => (
          <WorkCard
            title={work.data.title}
            arena={work.data.arena}
            lede={work.data.lede}
            responsibilities={work.data.responsibilities}
            learned={work.data.learned}
            roles={work.data.roles}
            client={work.data.client}
            years={work.data.years}
            spec={work.data.spec}
            specPlaceholder={work.data.specPlaceholder}
            slug={work.id}
            index={i}
            total={works.length}
          />
        ))}
```

Arrow labels:

```astro
      <button class="carousel-arrow" id="carousel-prev" aria-label={labels.prevAriaLabel}>
```
```astro
      <button class="carousel-arrow" id="carousel-next" aria-label={labels.nextAriaLabel}>
```

Certifications subsection:

```astro
      <span class="cert-label">{certs.label}</span>
```
and the loop becomes `{certs.items.map((cert) => (` with its body unchanged.

`{works.length}` in the indicator needs no change.

- [ ] **Step 6: Migrate `WorkCard.astro`**

Replace lines 1-38 with:

```astro
---
import { ui } from "../lib/content"

export interface Props {
  title: string
  arena: string
  lede: string
  responsibilities: string[]
  learned: string
  roles: string[]
  client: string
  years: string
  spec: { label: string; value: string }[]
  specPlaceholder: boolean
  slug: string
  index: number
  total: number
}

const {
  title,
  arena,
  lede,
  responsibilities,
  learned,
  roles,
  client,
  years,
  spec,
  specPlaceholder,
  slug,
} = Astro.props

const labels = (await ui()).workCard
const specLabels = (await ui()).workSpec
---
```

Two things changed: the `SpecRow` type is now inlined, because `src/data/work.ts` is being deleted and re-exporting a type from content config would couple the card to the schema module; and the `console.warn` block is gone, because Task 9 moves that gate into `scripts/check-content.mjs`. `specPlaceholder` stays a prop because the `data-spec-placeholder` attribute still needs it.

Markup edits:

```astro
      <h4 class="card-block-title">{labels.held}</h4>
```
```astro
      <h4 class="card-block-title">{labels.taught}</h4>
```
```astro
        <dt>{specLabels.client}</dt>
```
```astro
        <dt>{specLabels.years}</dt>
```
```astro
      <span data-cta-label>
        {labels.cta}
```
```astro
      <span data-cta-alt aria-hidden="true">{labels.ctaAlt}</span>
```

- [ ] **Step 7: Delete the old data modules**

```bash
git rm src/data/work.ts src/data/certifications.ts
```

`src/pages/work/[slug].astro` still imports `Work` from `../../data/work` and will now fail to build. That is expected and fixed in Task 7 — do not run the verification step until then. To keep this task independently buildable, apply the minimal shim: in `[slug].astro`, delete the `import type { Work }` line and change `work: Work` in `Props` to `work: any`, with the comment `// Task 7 replaces this with the content-collection entry type`.

- [ ] **Step 8: Verify**

Run: `pnpm build && ./scripts/verify-dist.sh`
Expected: the `&copy;` diff, plus whitespace-only shifts in the card block titles, spec labels and CTA. Both work chapters must appear in the carousel in the same order (`consultant`, then `startup`), with identical spec rows, roles, client and years, and `data-spec-placeholder="true"` still present on both spec panels. Both `/work/*` pages must still build.

- [ ] **Step 9: Commit**

```bash
git add -A src/content src/content.config.ts src/lib/content.ts src/components/WorkCarousel.astro src/components/WorkCard.astro src/pages/work src/data
git commit -m "refactor(content): work chapters become Markdown, migrate carousel

Chapters are one Markdown file each: frontmatter is the brief, body is the
long-form detail. Adds an explicit order field so chapter sequence is
declared rather than alphabetical. The specPlaceholder console.warn is
removed from WorkCard; the gate moves to the check script.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Contact section, the chapter page, and removing `src/data`

Finishes the migration. After this task no component, layout or page holds a human-readable literal, and `src/data/` is gone.

**Files:**
- Create: `src/content/en/sections/contact.yaml`
- Modify: `src/content.config.ts`, `src/lib/content.ts`
- Modify: `src/components/Contact.astro` (all of the frontmatter and markup copy)
- Modify: `src/pages/work/[slug].astro` (frontmatter, `getStaticPaths`, all block titles, holding state, spec labels)
- Delete: `src/data/site.ts`, `src/data/sections.ts`, and the now-empty `src/data/`

**Interfaces:**
- Consumes: `data()`, `site()`, `seo()`, `ui()`, `workChapters()`, `workChapter()`.
- Produces: `contact(): Promise<{ header: { title }, lede: string, actions: { booking: { title, note }, linkedin: { title, note }, email: { title } } }>`

- [ ] **Step 1: Create `src/content/en/sections/contact.yaml`**

`sections.ts` carried a `description` for the contact section (`Let's create something great`) that `Contact.astro` never rendered. It is dropped rather than carried forward as a dead key. If it was meant to be rendered, that is a design change and belongs in its own commit.

```yaml
header:
  title: Let's Build Together

lede: Whether you need to scale your cloud architecture, bring AI into your product, or just want to brainstorm how to build a global tech team from anywhere. Let's connect and make it happen 🤜🤛

actions:
  booking:
    title: Book a call
    note: 60 minutes, no pitch. Pick a slot
  linkedin:
    title: Message on LinkedIn
    note: Fastest for a quick question
  email:
    # The note is the email address itself, read from site.yaml.
    title: Email
```

- [ ] **Step 2: Add the schema, collection and accessor**

```ts
const contactSchema = z.object({
  header: z.object({ title: z.string() }),
  lede: z.string(),
  actions: z.object({
    booking: z.object({ title: z.string(), note: z.string() }),
    linkedin: z.object({ title: z.string(), note: z.string() }),
    email: z.object({ title: z.string() }),
  }),
})
```
```ts
  contact: defineCollection({ loader: section('contact'), schema: contactSchema }),
```
```ts
export const contact = () => data('contact', 'contact') as Promise<{
  header: { title: string }
  lede: string
  actions: {
    booking: { title: string; note: string }
    linkedin: { title: string; note: string }
    email: { title: string }
  }
}>
```

- [ ] **Step 3: Migrate `Contact.astro`**

Replace the frontmatter with:

```astro
---
import { contact, site } from "../lib/content"

const content = await contact()
const section = content.header
const channels = await site()
const actions = content.actions
---
```

Markup edits, in order:

```astro
      <p class="contact-lede">
        {content.lede}
      </p>
```
```astro
        href={channels.bookingUrl}
```
```astro
          <span class="action-title">{actions.booking.title}</span>
          <span class="action-note">{actions.booking.note}</span>
```
```astro
          href={channels.linkedin}
```
```astro
          <span class="action-title">{actions.linkedin.title}</span>
          <span class="action-note">{actions.linkedin.note}</span>
```
```astro
        <a href={`mailto:${channels.email}`} class="action action--tertiary">
          <span class="action-title">{actions.email.title}</span>
          <span class="action-note">{channels.email}</span>
        </a>
```

`{section.title}` needs no change. Leave the geometric-hierarchy comment in place: it is design intent.

- [ ] **Step 4: Migrate the chapter page frontmatter and `getStaticPaths`**

Replace lines 1-21 of `src/pages/work/[slug].astro` with:

```astro
---
import type { CollectionEntry } from "astro:content"
import BaseLayout from "../../layouts/BaseLayout.astro"
import Nav from "../../components/Nav.astro"
import Footer from "../../components/Footer.astro"
import { renderChapter, seo, site, ui, workChapters } from "../../lib/content"

export async function getStaticPaths() {
  const chapters = await workChapters()
  return chapters.map((chapter) => ({
    params: { slug: chapter.id },
    props: { chapter },
  }))
}

export interface Props {
  chapter: CollectionEntry<"work">
}

const { chapter } = Astro.props
const work = chapter.data
const { Content } = await renderChapter(chapter)

const channels = await site()
const labels = (await ui()).workPage
const cardLabels = (await ui()).workCard
const specLabels = (await ui()).workSpec
const meta = await seo()

const hasProjects = work.projects.length > 0
const hasWriteUp = Boolean(chapter.body?.trim())
const pageTitle = meta.pages.work.titleTemplate.replace("{title}", work.title)
---
```

`astro:content` is imported here for a **type only**. Rule R4 in Task 9 must permit type-only imports of `astro:content`; if the rule as implemented flags this line, prefer importing the type through `src/lib/content.ts` (re-export `export type { CollectionEntry }`) rather than weakening R4.

- [ ] **Step 5: Migrate the chapter page markup**

The `<BaseLayout>` tag:

```astro
<BaseLayout title={pageTitle} description={work.description}>
```

Back link, block titles and spec labels:

```astro
        {labels.back}
```
(replacing the `All chapters` text after the `<svg>`)
The two block titles are the same strings the carousel card renders, so they read the
same `ui().workCard` keys rather than being duplicated under `workPage`. `cardLabels`
is already declared in the Step 4 frontmatter.

```astro
            <h2 class="block-title">{cardLabels.held}</h2>
```
```astro
            <h2 class="block-title">{cardLabels.taught}</h2>
```

```astro
              <dt>{specLabels.client}</dt>
```
```astro
              <dt>{specLabels.years}</dt>
```

- [ ] **Step 6: Rewrite the projects and write-up blocks**

Replace the whole `{hasDetail ? (...) : (...)}` expression with two independent blocks, which is the behavioural shape the spec asked for: projects and the write-up are each optional on their own.

```astro
          {
            hasProjects && (
              <section class="block">
                <h2 class="block-title">{labels.projects}</h2>
                <div class="projects">
                  {work.projects.map((project) => (
                    <article class="project">
                      <h3 class="project-name">{project.name}</h3>
                      <p class="project-summary">{project.summary}</p>
                      <p class="project-outcome">{project.outcome}</p>
                    </article>
                  ))}
                </div>
              </section>
            )
          }

          {
            hasWriteUp ? (
              <section class="block">
                <h2 class="block-title">{labels.writeUpTitle}</h2>
                <div class="block-text">
                  <Content />
                </div>
              </section>
            ) : (
              /* Honest holding state. Carries real value: the facts are all
                 true and already on the page, instead of a dashed box. */
              <section class="block holding">
                <h2 class="block-title">{labels.holding.title}</h2>
                <p class="block-text">{labels.holding.body1}</p>
                <p class="block-text">{labels.holding.body2}</p>
                <a
                  href={channels.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="holding-cta"
                >
                  {labels.holding.cta}
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path
                      d="M4 10h11M11 5l5 5-5 5"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </a>
              </section>
            )
          }
```

Behaviour note: previously, a chapter with projects showed **no** write-up section at all. Now a chapter with projects and an empty body shows projects **and** the holding state. Neither chapter has projects today, so rendered output is unchanged; the new behaviour is the intended one.

- [ ] **Step 7: Delete `src/data`**

```bash
git rm src/data/site.ts src/data/sections.ts
rmdir src/data 2>/dev/null || true
grep -rn "data/site\|data/sections\|data/work\|data/services\|data/certifications\|src/data" src/ && echo "STILL REFERENCED — fix before committing" || echo "no references remain"
```

- [ ] **Step 8: Verify**

Run: `pnpm build && ./scripts/verify-dist.sh`
Expected: the `&copy;` diff, plus whitespace-only shifts in the contact block and on both chapter pages. Specifically confirm: both chapter pages still render the holding state with both paragraphs and the booking CTA; `<title>` on each is still `<Chapter> | Salvatore Cirone`; the meta description is still the chapter lede; the contact email appears both in the `mailto:` href and as the tertiary action note.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor(content): migrate Contact and chapter page, delete src/data

Chapter pages now render their long-form write-up from the Markdown body,
with projects and write-up independently optional. src/data is gone: all
content lives in src/content/en.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: The enforcement script

The one task with real unit tests. The rules live in a pure module so they can be tested without a build; the CLI is a thin wrapper. Uses `node:test`, built into Node 22.

**Files:**
- Create: `scripts/lib/content-rules.mjs`
- Create: `scripts/lib/content-rules.test.mjs`
- Create: `scripts/check-content.mjs`
- Create: `scripts/content-check.allow.json`
- Modify: `package.json` (scripts)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `scanSource({ path, text, allow })` returning `Violation[]`, where `Violation` is `{ path, line, rule, text, remedy }` and `rule` is one of `'R1' | 'R2' | 'R3' | 'R4' | 'R5'`. `scripts/check-content.mjs` is the CLI, accepting `--strict`.

- [ ] **Step 1: Write the failing tests**

Create `scripts/lib/content-rules.test.mjs`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scanSource } from './content-rules.mjs'

const scan = (text, path = 'src/components/X.astro') =>
  scanSource({ path, text, allow: [] })
const rules = (text, path) => scan(text, path).map((v) => v.rule)

test('R1 flags a literal text node in markup', () => {
  const v = scan('---\n---\n<p>See the work</p>')
  assert.equal(v.length, 1)
  assert.equal(v[0].rule, 'R1')
  assert.match(v[0].text, /See the work/)
  assert.match(v[0].remedy, /src\/content/)
})

test('R1 ignores expressions, style, script and comments', () => {
  assert.deepEqual(rules('---\n---\n<p>{content.lede}</p>'), [])
  assert.deepEqual(rules('---\n---\n<style>.a { color: red }</style>'), [])
  assert.deepEqual(rules('---\n---\n<!-- a design note in prose -->'), [])
})

test('R1 ignores svg path data and single-letter text', () => {
  assert.deepEqual(
    rules('---\n---\n<svg><path d="M8 3v10M4 9l4 4 4-4" /></svg>'),
    []
  )
})

test('R2 flags a literal alt and allows empty or expression', () => {
  assert.deepEqual(rules('---\n---\n<img alt="A portrait of someone" />'), ['R2'])
  assert.deepEqual(rules('---\n---\n<img alt="" />'), [])
  assert.deepEqual(rules('---\n---\n<img alt={content.alt} />'), [])
})

test('R2 flags a literal aria-label', () => {
  assert.deepEqual(rules('---\n---\n<button aria-label="Toggle menu" />'), ['R2'])
})

test('R2 ignores technical meta content but flags copy-bearing meta', () => {
  const technical =
    '---\n---\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
    '<meta property="og:type" content="website" />\n' +
    '<meta name="twitter:card" content="summary_large_image" />'
  assert.deepEqual(rules(technical), [])
  assert.deepEqual(
    rules('---\n---\n<meta name="description" content="A portfolio site for someone" />'),
    ['R2']
  )
})

test('R3 flags a two-word literal in frontmatter and in a client script', () => {
  assert.deepEqual(rules('---\nconst a = "Book a call"\n---\n'), ['R3'])
  assert.deepEqual(
    rules('---\n---\n<script>const l = "Book now please"</script>'),
    ['R3']
  )
})

test('R3 flags copy inside a template literal', () => {
  assert.deepEqual(
    rules('---\nconst a = `${title} flip for detail`\n---\n'),
    ['R3']
  )
})

test('R3 ignores single technical tokens', () => {
  assert.deepEqual(rules('---\nconst e = "power2.out"\n---\n'), [])
  assert.deepEqual(rules('---\nconst s = "[data-animate]"\n---\n'), [])
})

test('R4 flags astro:content imports outside the allowed modules', () => {
  assert.deepEqual(
    rules('---\nimport { getEntry } from "astro:content"\n---\n'),
    ['R4']
  )
  assert.deepEqual(
    rules('import { getEntry } from "astro:content"', 'src/lib/content.ts'),
    []
  )
  assert.deepEqual(
    rules('import { z } from "astro:content"', 'src/content.config.ts'),
    []
  )
})

test('R4 permits a type-only astro:content import anywhere', () => {
  assert.deepEqual(
    rules('---\nimport type { CollectionEntry } from "astro:content"\n---\n'),
    []
  )
})

test('R5 warns on the forbidden em dash in content files', () => {
  const v = scanSource({
    path: 'src/content/en/sections/hero.yaml',
    text: 'jumpLabel: See the work — now',
    allow: [],
  })
  assert.equal(v.length, 1)
  assert.equal(v[0].rule, 'R5')
  assert.equal(v[0].severity, 'warn')
})

test('a content-ok comment suppresses the violation on that line', () => {
  assert.deepEqual(
    rules('---\nconst q = "prefers-reduced-motion: reduce" // content-ok: media query\n---\n'),
    []
  )
  assert.deepEqual(
    rules('---\n---\n<p>Literal text</p> <!-- content-ok: fixture -->'),
    []
  )
})

test('a content-ok comment without a reason does not suppress', () => {
  assert.deepEqual(rules('---\nconst a = "Book a call" // content-ok\n---\n'), ['R3'])
})

test('the allowlist suppresses an exact repeated technical string', () => {
  const text = '---\nconst q = "prefers-reduced-motion: reduce"\n---\n'
  assert.deepEqual(scanSource({ path: 'src/x.astro', text, allow: [] }).map(v => v.rule), ['R3'])
  assert.deepEqual(
    scanSource({
      path: 'src/x.astro',
      text,
      allow: ['prefers-reduced-motion: reduce'],
    }),
    []
  )
})

test('exempt files are skipped entirely', () => {
  assert.deepEqual(
    rules('export const design = { font: "Archivo Variable" }', 'src/design.config.ts'),
    []
  )
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test scripts/lib/`
Expected: FAIL, cannot find module `./content-rules.mjs`.

- [ ] **Step 3: Implement the rules module**

Create `scripts/lib/content-rules.mjs`:

```js
/**
 * Source-text rules that keep human-readable copy out of code.
 * See CONTENT.md. These are heuristics, not a parser: they catch accidental
 * and agent-written copy, and can be defeated by deliberate concatenation.
 */

const EXEMPT = [
  'src/design.config.ts',
  'src/content.config.ts',
  'src/lib/content.ts',
  'src/env.d.ts',
]

const ASTRO_CONTENT_ALLOWED = ['src/content.config.ts', 'src/lib/content.ts']

const COPY_ATTRS = ['alt', 'aria-label', 'title', 'placeholder']

const COPY_META = [
  'description',
  'og:title',
  'og:description',
  'og:image:alt',
  'twitter:title',
  'twitter:description',
]

const REMEDY =
  'move this string to src/content/en/ and read it via src/lib/content.ts (see CONTENT.md)'

/** Two adjacent alphabetic words: the signal that a literal is prose. */
const TWO_WORDS = /[A-Za-z]{2,}[^\S\n]+[A-Za-z]{2,}/

const hasContentOk = (line) => /content-ok:\s*\S/.test(line)

function blank(text, re) {
  // Replace matched regions with equal-length whitespace so line numbers hold.
  return text.replace(re, (m) => m.replace(/[^\n]/g, ' '))
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length
}

export function scanSource({ path, text, allow = [] }) {
  if (EXEMPT.some((e) => path.endsWith(e))) return []

  const isContentFile = path.includes('/content/')
  const violations = []
  const lines = text.split('\n')

  const push = (rule, index, snippet, severity = 'error') => {
    const line = lineOf(text, index)
    if (hasContentOk(lines[line - 1] ?? '')) return
    const trimmed = snippet.trim()
    if (allow.includes(trimmed)) return
    violations.push({ path, line, rule, text: trimmed, remedy: REMEDY, severity })
  }

  // R5: content files only — the AGENTS.md copy rule. Warning, not an error.
  if (isContentFile) {
    let i = text.indexOf('—')
    while (i !== -1) {
      const line = lineOf(text, i)
      violations.push({
        path,
        line,
        rule: 'R5',
        text: (lines[line - 1] ?? '').trim(),
        remedy: 'AGENTS.md forbids the em dash in copy; prefer "," or "."',
        severity: 'warn',
      })
      i = text.indexOf('—', i + 1)
    }
    return violations
  }

  // Split frontmatter from template for .astro files.
  const isAstro = path.endsWith('.astro')
  let frontmatterEnd = 0
  if (isAstro && text.startsWith('---')) {
    const close = text.indexOf('\n---', 3)
    frontmatterEnd = close === -1 ? 0 : close + 4
  }

  // R4: astro:content may only be imported by the two allowed modules,
  // unless the import is type-only.
  const importRe = /^.*\bfrom\s+['"]astro:content['"].*$/gm
  for (const m of text.matchAll(importRe)) {
    if (ASTRO_CONTENT_ALLOWED.some((a) => path.endsWith(a))) continue
    if (/^\s*import\s+type\b/.test(m[0])) continue
    push('R4', m.index, m[0])
  }

  // Working copy with style/script bodies blanked for markup rules,
  // and a second copy that keeps script bodies for R3.
  let markup = text.slice(frontmatterEnd)
  const markupOffset = frontmatterEnd
  markup = blank(markup, /<style[\s\S]*?<\/style>/g)
  markup = blank(markup, /<script[\s\S]*?<\/script>/g)
  markup = blank(markup, /<!--[\s\S]*?-->/g)

  // R1: literal text nodes.
  for (const m of markup.matchAll(/>([^<>{}]*[A-Za-z]{2,}[^<>{}]*)</g)) {
    const inner = m[1]
    if (!/[A-Za-z]{2,}/.test(inner)) continue
    push('R1', markupOffset + m.index + 1, inner)
  }

  // R2: copy-bearing attributes must be expressions.
  const attrRe = new RegExp(
    `\\b(${COPY_ATTRS.join('|')})\\s*=\\s*"([^"]*)"`,
    'g'
  )
  for (const m of markup.matchAll(attrRe)) {
    if (m[2].trim() === '') continue
    if (!/[A-Za-z]{2,}/.test(m[2])) continue
    push('R2', markupOffset + m.index, `${m[1]}="${m[2]}"`)
  }

  // R2 for <meta>: only the copy-bearing names.
  for (const m of markup.matchAll(/<meta\b[^>]*>/g)) {
    const tag = m[0]
    const name = /(?:name|property)\s*=\s*"([^"]+)"/.exec(tag)?.[1]
    const content = /\bcontent\s*=\s*"([^"]*)"/.exec(tag)?.[1]
    if (!name || content == null) continue
    if (!COPY_META.includes(name)) continue
    if (!/[A-Za-z]{2,}/.test(content)) continue
    push('R2', markupOffset + m.index, tag)
  }

  // R3: prose in string and template literals, in frontmatter and scripts.
  const codeRegions = []
  if (frontmatterEnd > 0) codeRegions.push([0, frontmatterEnd])
  for (const m of text.matchAll(/<script[\s\S]*?<\/script>/g)) {
    codeRegions.push([m.index, m.index + m[0].length])
  }
  if (!isAstro) codeRegions.push([0, text.length])

  const litRe = /"([^"\n]*)"|'([^'\n]*)'|`([^`]*)`/g
  for (const [start, end] of codeRegions) {
    const region = text.slice(start, end)
    for (const m of region.matchAll(litRe)) {
      const raw = m[1] ?? m[2] ?? m[3] ?? ''
      // Strip ${...} interpolations before judging a template literal.
      const value = raw.replace(/\$\{[^}]*\}/g, ' ')
      if (!TWO_WORDS.test(value)) continue
      push('R3', start + m.index, raw)
    }
  }

  return violations
}

export const EXEMPT_FILES = EXEMPT
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test scripts/lib/`
Expected: all tests PASS. If a test fails, fix the rules module, not the test, unless the test itself encodes a wrong expectation — in which case say so explicitly in the commit message.

- [ ] **Step 5: Write the CLI**

Create `scripts/check-content.mjs`:

```js
#!/usr/bin/env node
/**
 * Fails the build when human-readable copy lives in code.
 * Usage: node scripts/check-content.mjs [--strict]
 *   --strict also fails on warnings, including unresolved specPlaceholder.
 */
import { readFile, readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { scanSource } from './lib/content-rules.mjs'

const strict = process.argv.includes('--strict')
const root = process.cwd()

const allow = JSON.parse(
  await readFile(join(root, 'scripts/content-check.allow.json'), 'utf8')
).allow

async function walk(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) await walk(p, out)
    else out.push(p)
  }
  return out
}

const files = (await walk(join(root, 'src'))).filter((f) =>
  /\.(astro|ts)$/.test(f)
)
const contentFiles = (await walk(join(root, 'src/content'))).filter((f) =>
  /\.(yaml|yml|md)$/.test(f)
)

const violations = []
for (const f of [...files, ...contentFiles]) {
  const path = relative(root, f)
  violations.push(...scanSource({ path, text: await readFile(f, 'utf8'), allow }))
}

// specPlaceholder gate: warns on build, fails under --strict.
for (const f of contentFiles.filter((f) => f.endsWith('.md'))) {
  const text = await readFile(f, 'utf8')
  if (/^specPlaceholder:\s*true\s*$/m.test(text)) {
    violations.push({
      path: relative(root, f),
      line: text.split('\n').findIndex((l) => /^specPlaceholder:\s*true/.test(l)) + 1,
      rule: 'SPEC',
      text: 'specPlaceholder: true',
      remedy:
        'the spec values in this chapter are INVENTED. Replace them with real values and set specPlaceholder: false before deploying',
      severity: 'warn',
    })
  }
}

const errors = violations.filter((v) => v.severity !== 'warn')
const warns = violations.filter((v) => v.severity === 'warn')

const show = (v) =>
  console.log(`  ${v.path}:${v.line}  [${v.rule}]  ${v.text}\n      → ${v.remedy}`)

if (warns.length) {
  console.log(`\n⚠️  ${warns.length} content warning(s):`)
  warns.forEach(show)
}
if (errors.length) {
  console.log(`\n❌ ${errors.length} content violation(s):`)
  errors.forEach(show)
  console.log(
    '\nCopy must never live in code. See CONTENT.md. If a string is genuinely\n' +
      'technical, add `content-ok: <reason>` on its line or add it to\n' +
      'scripts/content-check.allow.json.\n'
  )
}

if (errors.length || (strict && warns.length)) process.exit(1)
if (!errors.length && !warns.length) console.log('✅ content check clean')
```

- [ ] **Step 6: Seed the allowlist and run the check**

Create `scripts/content-check.allow.json`:

```json
{
  "_comment": "Exact technical strings that rule R3 would otherwise flag. Every entry must be genuinely technical, never copy. Prefer an inline `content-ok: <reason>` comment for one-off cases.",
  "allow": [
    "(prefers-reduced-motion: reduce)"
  ]
}
```

Run: `node scripts/check-content.mjs`
Then add each remaining legitimately-technical string it reports (GSAP eases, selectors, `ScrollTrigger` start values) to the allowlist, or an inline `content-ok:` comment where the string appears once. **Do not add any human-readable copy to the allowlist** — if the check flags real copy, that copy was missed in Tasks 1-7 and must be migrated instead.
Expected end state: zero errors. Warnings for `specPlaceholder` on both chapters and for R5 em dashes are expected and correct.

- [ ] **Step 7: Wire it into the build**

In `package.json`, replace the `scripts` block with:

```json
  "scripts": {
    "dev": "astro dev",
    "build": "node scripts/check-content.mjs && astro build",
    "preview": "pnpm run build && wrangler dev",
    "astro": "astro",
    "check:content": "node scripts/check-content.mjs",
    "test:content": "node --test scripts/lib/",
    "generate-types": "wrangler types",
    "deploy": "node scripts/check-content.mjs --strict && pnpm run build && wrangler deploy"
  },
```

- [ ] **Step 8: Verify the gate works in both directions**

```bash
pnpm check:content          # expect: warnings only, exit 0
pnpm check:content --strict # expect: exit 1, specPlaceholder warnings promoted
pnpm build                  # expect: check passes, then astro build succeeds
./scripts/verify-dist.sh    # expect: only the diffs from Tasks 1-7
```

Then prove the gate catches a regression: add `<p>Temporary literal copy</p>` to `src/components/Footer.astro`, run `pnpm build`, confirm it FAILS with an R1 violation naming the file and line, then remove the line.

- [ ] **Step 9: Commit**

```bash
git add scripts package.json
git commit -m "feat(content): add build-gating content check

Four error rules (literal text nodes, copy-bearing attributes, prose in
code, astro:content layer integrity) plus two warnings (em dash in copy,
unresolved specPlaceholder). Rules are a tested pure module; the CLI is a
wrapper. pnpm deploy runs it with --strict.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Documentation, so agents comply before the script has to catch them

**Files:**
- Create: `CONTENT.md`
- Modify: `AGENTS.md` (add a hard-rule block, update the project-structure tree and the commands table)
- Modify: `DESIGN.md` (extend the sync rule)

**Interfaces:**
- Consumes: the finished structure from Tasks 1-8.
- Produces: nothing code-facing.

- [ ] **Step 1: Write `CONTENT.md`**

```markdown
# CONTENT.md — Content Architecture

**The rule: no human-readable string may live in a `.astro`, `.ts`, or `.js` file.**
Prose, headings, button labels, `alt` text, `aria-label`s, SEO metadata and
JSON-LD values all live in `src/content/`. `pnpm build` fails if they do not.

## Where content lives

    src/content/en/
      site.yaml                # identity, contact channels, schema.org Person values
      seo.yaml                 # site metadata, per-page title and description
      ui.yaml                  # label dictionary, keyed by component
      sections/
        hero.yaml              # headline, lede, base line, jump label, portrait
        services.yaml          # header + hint + the service items
        work.yaml              # work section header
        certifications.yaml    # label + credentials
        contact.yaml           # header + lede + action cards
        footer.yaml            # copyright
      work/
        <slug>.md              # one chapter: frontmatter = brief, body = detail

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

Two structural rules:

1. **One file per section, header included.** A section's heading lives with its
   content. Never split a section's title from its items across two files.
2. **`ui.yaml` is keyed by component, not by page** — `nav.*`, `serviceCard.*`,
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
frontmatter fields from an existing chapter — all are required except `projects`.
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
migrate the copy — that is the rule working.

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
| `pnpm test:content` | Unit tests for the rules module |
| `pnpm build` | Content check, then Astro build |
```

- [ ] **Step 2: Add the hard-rule block to `AGENTS.md`**

Insert immediately after the `# AGENTS.md — Portfolio` heading, so an agent reads it before anything else:

```markdown
## Content rule (non-negotiable)

**No human-readable string may live in a `.astro`, `.ts`, or `.js` file.** Prose,
headings, button labels, `alt` text, `aria-label`s, SEO metadata and JSON-LD
values live in `src/content/en/`, are validated by Zod schemas in
`src/content.config.ts`, and are read **only** through `src/lib/content.ts`.

- Read **`CONTENT.md`** before adding or changing any string. It has a table
  telling you exactly which file a new string belongs in.
- Never call `getEntry` or `getCollection` in a component. Add an accessor to
  `src/lib/content.ts` and call that.
- `pnpm build` runs `pnpm check:content` and **fails** on a violation. Do not
  work around the check by adding copy to `scripts/content-check.allow.json`;
  move the copy to `src/content/en/` instead.
- Design tokens are not content. They stay in `src/design.config.ts`.
```

Then update the **Architecture** section: replace the `**Data** — src/data/*...` bullet with:

```markdown
- **Content** — all copy and data live in `src/content/en/**` (YAML + Markdown),
  schema-validated in `src/content.config.ts`, accessed via `src/lib/content.ts`.
  See `CONTENT.md`. There is no `src/data/` directory.
```

Update the **Project structure** tree to:

```
src/
  components/    — 9 Astro components (Nav, Hero, Services, ServiceCard, WorkCarousel, WorkCard, Contact, Footer, LoadingScreen)
  content/en/    — all copy and data (YAML sections + Markdown work chapters)
  lib/           — content.ts (the only astro:content consumer)
  layouts/       — BaseLayout.astro (shell + GSAP init + CSS vars)
  pages/         — index.astro, work/[slug].astro
  content.config.ts — content collections + Zod schemas
  design.config.ts  — design tokens
scripts/         — check-content.mjs (build gate), verify-dist.sh, lib/content-rules.mjs
```

Add to the **Commands** table:

```
| `pnpm check:content` | Content rules check (also runs inside `pnpm build`) |
| `pnpm test:content` | Unit tests for the content rules |
```

And correct the **No tests** line to: `**No linter or typecheck script** is configured. The only tests are `pnpm test:content`.`

- [ ] **Step 3: Extend the `DESIGN.md` sync rule**

In the **Design doc rule** section, add:

```markdown
- **No copy lives in components.** Every string in a component comes from
  `src/content/en/**` via `src/lib/content.ts`. When changing a section's design,
  change its markup here and its words there. See `CONTENT.md`.
```

- [ ] **Step 4: Verify the docs match reality**

Walk the `CONTENT.md` "Where content lives" tree against `find src/content -type f` and the accessor names against `src/lib/content.ts`. Every path and every accessor named in the docs must exist. Run `pnpm check:content` once more, since `CONTENT.md` is not scanned but `AGENTS.md` edits sometimes prompt stray source edits.

- [ ] **Step 5: Commit**

```bash
git add CONTENT.md AGENTS.md DESIGN.md
git commit -m "docs: add CONTENT.md standard, enforce it in AGENTS.md

AGENTS.md is pulled into CLAUDE.md via @AGENTS.md and read by the other
agent configs in this repo, so the rule reaches every agent from one edit.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Final verification

**Files:** none modified.

**Interfaces:** consumes everything.

- [ ] **Step 1: Confirm no copy remains in code**

```bash
pnpm check:content
```
Expected: zero errors. Warnings limited to R5 em dashes and the two `specPlaceholder` chapters.

- [ ] **Step 2: Confirm the deploy gate blocks placeholder specs**

```bash
pnpm check:content --strict; echo "exit=$?"
```
Expected: `exit=1`, listing both chapters. This is correct: the site must not deploy with invented spec numbers.

- [ ] **Step 3: Confirm the rules module still passes its tests**

```bash
pnpm test:content
```
Expected: all tests pass.

- [ ] **Step 4: Confirm rendered output is unchanged**

```bash
pnpm build && ./scripts/verify-dist.sh
```
Expected: the only diffs are those accepted in Tasks 1-7 — the `&copy;` to `©` change on all three pages, and whitespace-only shifts where literal text nodes became expressions. Read the diff in full and confirm every hunk is one of those two categories. **A word-level difference anywhere is a migration bug: content was lost, duplicated, or altered.** Fix it rather than accepting it.

- [ ] **Step 5: Confirm `src/data` is gone and nothing references it**

```bash
test ! -d src/data && echo "src/data removed"
grep -rn "src/data\|data/site\|data/work\|data/services\|data/sections\|data/certifications" src/ scripts/ *.md && echo "STALE REFERENCE" || echo "no stale references"
```

- [ ] **Step 6: Confirm the layer boundary holds**

```bash
grep -rln "astro:content" src/ | sort
```
Expected exactly: `src/content.config.ts`, `src/lib/content.ts`, and `src/pages/work/[slug].astro` (type-only import). Nothing else.

- [ ] **Step 7: Clean up and report**

```bash
rm -rf dist-baseline
git status --short
```

Report to the user: the diff summary from Step 4, the R5 em-dash warnings as a **content follow-up they own** (AGENTS.md forbids `—` in copy, and several existing strings use it — `Salvatore Cirone — home`, `Services — draggable badge deck`, the chapter `years` values, and the service flip aria-label), and the two chapters still carrying invented spec numbers.
