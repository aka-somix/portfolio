# Portfolio

Single-page portfolio built with **Astro v6** and **GSAP**. Galaxy-themed dark design with frosted-glass cards, a draggable services carousel, and a work project carousel.

## Stack

| Tool | Version | Role |
|------|---------|------|
| Astro | ^6.3.1 | Static site framework, no SSR |
| GSAP | ^3.15.0 | Animations (ScrollTrigger, Draggable plugins) |
| Node | >=22.12.0 | Runtime |
| pnpm | — | Package manager |

## Commands

| Command | Action |
|---------|--------|
| `pnpm dev` | Dev server at `localhost:4321` |
| `pnpm build` | Production build to `dist/` |
| `pnpm preview` | Preview production build |
| `pnpm astro ...` | Run any Astro CLI command |

## Project structure

```
src/
  components/     — 8 Astro components
    Nav.astro          Fixed top nav with CTA flip animation
    Hero.astro         48/52 split layout: empty left, image right, glass card overlay
    Services.astro     Draggable horizontal card stack
    ServiceCard.astro  Individual service card (absolutely positioned by drag)
    WorkCarousel.astro  3-card carousel, 75vw cards with 15vw gap, centered
    WorkCard.astro     40/60 text-to-image split, glass card
    Contact.astro      Email + bio section
    Footer.astro       Minimal footer
  data/           — Content sources
    work.ts            Work projects (slug, title, description, roles, client)
    services.ts        Services list (id, title, description, code)
  layouts/
    BaseLayout.astro   HTML shell, CSS custom properties, GSAP init, all animations
  pages/
    index.astro        Single-page assembly (Nav → Hero → Services → Work → Contact → Footer)
    work/[slug].astro  Dynamic project detail page (getStaticPaths)
  design.config.ts — All design tokens: palette, fonts, layout, animation
public/
  images/Hero.webp Hero portrait
  favicon.svg       Site favicon
  favicon.ico       Fallback favicon
```

## Design system

All tokens live in `src/design.config.ts` and are injected as CSS custom properties in `BaseLayout.astro` via `<style set:html>`. Components reference variables like `var(--bg-surface)`, `var(--text-muted)`, `var(--accent)`, etc.

**Palette** (galaxy theme):

| Token | Value |
|-------|-------|
| `--bg-primary` | `#15102f` |
| `--bg-surface` | `#3e2c60` |
| `--bg-card` | `#85409D` |
| `--text-primary` | `#ffffff` |
| `--text-secondary` | `#d4d4d4` |
| `--text-muted` | `#EEA727` (gold) |
| `--border-color` | `#ffffff` |
| `--accent` | `#EEA727` |

For the full design reference (type, layout, spacing, motion), see `DESIGN.md`.

## Key interactions

### Services drag-to-stack
- An invisible overlay captures GSAP Draggable gestures
- Cards smoothly interpolate between spread positions and a stacked pile on the left
- Each card piles with 6px/3px/-0.5° offsets per card in the stack
- On release, snaps to the nearest card index

### Work carousel
- Manual prev/next controls, each card is `75vw` wide with `15vw` gap
- Track translates by `cardWidth + gap` per click + centering offset
- Glass card with `backdrop-filter: blur(12px)` and `aspect-ratio: 3 / 2`

### Hero section
- Split layout: 48% empty left, 52% image right (anchored bottom-right)
- Glass card overlay at left: 6%/14% position, 38% width, frosted glass effect

## Animations (BaseLayout.astro)

All GSAP animation is centralized in the `<script>` block of `BaseLayout.astro`:

| Animation | Trigger | Elements |
|-----------|---------|---------|
| Hero bg fade-in | Page load | `[data-animate="hero-bg"]` |
| Hero text stagger | Page load | `[data-animate="hero-text"]` |
| Section reveal | ScrollTrigger | `[data-animate="section"]` children |
| Nav link hover | mouseenter/leave | `[data-animate="nav-link"]` |
| CTA dual-label | mouseenter/leave | `[data-animate="cta"]` |
| Services drag | GSAP Draggable | `[data-draggable]` |

## Notes

- `/work/[slug].astro` uses `getStaticPaths` — pages are prebuilt at build time
- `DESIGN.md` documents the original inspiration (daveholloway.uk) — not all details match the current code
- `AGENTS.md` has quick-reference commands and architecture notes for AI agents
- Opencode MCP for Astro docs is configured in `opencode.json`
- No tests, linter, or typecheck script is configured
- `.astro/` (generated types) and `dist/` (build output) are gitignored
