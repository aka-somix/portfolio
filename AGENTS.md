# AGENTS.md — Portfolio

## Stack & setup

- **Astro v6** (not v5 despite DESIGN.md) — static site, no SSR
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

## Architecture

- **Single-page portfolio** — sections: hero → services → work → contact → footer
- **Dynamic routes** — `/work/[slug].astro` uses `getStaticPaths` from `src/data/work.ts`
- **Design tokens** — centralized in `src/design.config.ts`, injected as CSS custom properties via `BaseLayout.astro` (`<style set:html={...}>`). For design intent, see `DESIGN.md`.
- **Data** — `src/data/work.ts` and `src/data/services.ts` drive all content
- **No tests, linter, or typecheck script** is configured

## Project structure

```
src/
  components/    — 8 Astro components (Nav, Hero, Services, ServiceCard, WorkCarousel, WorkCard, Contact, Footer)
  data/          — work.ts, services.ts
  layouts/       — BaseLayout.astro (shell + GSAP init + CSS vars)
  pages/         — index.astro, work/[slug].astro
  design.config.ts — design tokens (colors, fonts, layout, animation)
public/          — favicon.svg, favicon.ico
```

## Notable

- `BaseLayout.astro` registers GSAP plugins (`ScrollTrigger`, `Draggable`) and drives all page animations (hero stagger, section scroll-triggers, nav hover, CTA flip, services drag)
- CTA button in nav uses a dual-label flip animation (`data-cta-label` / `data-cta-alt`)
- `data-animate` attributes are the hook for all GSAP animations
- `.astro/` is generated types directory — gitignored
