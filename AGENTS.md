# AGENTS.md — Portfolio

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

## Stack & setup

- **Astro v6** — static site, no SSR
- **pnpm** — package manager (lockfile: `pnpm-lock.yaml`)
- **Node >=22.12.0**
- **GSAP** only extra dependency; uses ScrollTrigger + Draggable plugins
- Astro docs MCP available via `opencode.json`

## Commands

| Command | Action |
|---------|--------|
| `pnpm dev` | Dev server at `localhost:4321` |
| `pnpm build` | Production build to `dist/` |
| `pnpm preview` | Preview production build |
| `pnpm astro ...` | Run any Astro CLI command |
| `pnpm check:content` | Content rules check (also runs inside `pnpm build`) |
| `pnpm test:content` | Unit tests for the content rules |

## Architecture

- **Single-page portfolio** — sections: hero → services → work → contact → footer
- **Dynamic routes**: `/work/[slug].astro` uses `getStaticPaths` backed by `workChapters()` from `src/lib/content.ts`
- **Design tokens** — centralized in `src/design.config.ts`, injected as CSS custom properties via `BaseLayout.astro` (`<style set:html={...}>`). For design intent, see `DESIGN.md`.
- **Content** — all copy and data live in `src/content/en/**` (YAML + Markdown),
  schema-validated in `src/content.config.ts`, accessed via `src/lib/content.ts`.
  See `CONTENT.md`. There is no `src/data/` directory.
- **No linter or typecheck script** is configured. The only tests are `pnpm test:content`, 16 unit tests covering the content-rules module only.

## Project structure

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
public/          — favicon.svg, favicon.ico
```

## Notable

- `BaseLayout.astro` registers GSAP plugins (`ScrollTrigger`, `Draggable`) and drives all page animations (hero stagger, section scroll-triggers, nav hover, CTA flip, services drag)
- CTA button in nav uses a dual-label flip animation (`data-cta-label` / `data-cta-alt`)
- `data-animate` attributes are the hook for all GSAP animations
- `.astro/` is generated types directory — gitignored

## Design doc rule

- **`DESIGN.md`** must be kept in sync with the actual codebase — update it whenever changing layout, palette, typography, sections, animations, or assets.
- **Copywrighting** should **NEVER** use this character: `—`, prefer `,` or `.`
- **No copy lives in components.** Every string in a component comes from
  `src/content/en/**` via `src/lib/content.ts`. When changing a section's design,
  change its markup here and its words there. See `CONTENT.md`.