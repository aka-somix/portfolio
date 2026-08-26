export const design = {
  palette: {
    bg: {
      primary: "#15102f",
      accent: "#85409D",
      surface: "#3e2c60",
    },
    text: {
      primary: "#ffffff",
      secondary: "#d4d4d4",
      muted: "#EEA727",
    },
    border: {
      default: "#ffffff",
      light: "#cccccc",
    },
    accent: "#EEA727",
  },
  font: {
    /**
     * Three roles, three faces. Each has one job and does not do the others'.
     *
     *   display — Archivo. Headline tier ONLY. Variable width axis (62–125%) is
     *             what the hero's scroll-velocity motion drives.
     *   sans    — Inter. Body and UI. Never the display voice.
     *   mono    — JetBrains Mono. Tabular data and measurement ONLY, never a
     *             "technical" costume for uppercase micro-labels.
     *
     * All three are self-hosted variable fonts (see public/fonts, @font-face in
     * BaseLayout). There is no third-party font request.
     */
    display: "'Archivo', 'Inter', system-ui, sans-serif",
    sans: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
  /**
   * One scale, one source of truth. Every size on the site comes from here.
   *
   * Ratio ~1.25. The 28–36px band (`lede`, `xl`) is the tier the old site was
   * missing entirely, which is why the positioning statement had nowhere to sit
   * above body copy. `min` is a hard 11px floor — nothing functional goes below it.
   */
  type: {
    size: {
      min: "0.6875rem", // 11px — absolute floor for functional text
      xs: "0.75rem", //    12px — mono labels, tags
      sm: "0.875rem", //   14px — secondary body, captions
      base: "1.0625rem", //17px — body
      md: "1.3125rem", //  21px — lede (lower)
      lede: "1.75rem", //  28px — lede (upper)
      xl: "2.25rem", //    36px
      "2xl": "3rem", //    48px
      display: "clamp(2.75rem, 7vw, 6rem)", // 44 → 96px, capped at 6rem
      section: "clamp(2.25rem, 5vw, 3.5rem)", // 36 → 56px
    },
    leading: {
      tight: "1.05", // display
      snug: "1.25", // headings, lede
      body: "1.65", // body copy
    },
    tracking: {
      display: "-0.035em",
      tight: "-0.02em",
      normal: "0",
      label: "0.1em", // the ONE tracking value for mono uppercase labels
    },
    weight: {
      regular: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      black: "800",
    },
    measure: "66ch",
  },
  layout: {
    navHeight: "64px",
    // Was 2000px, which meant no container at any real viewport and therefore no
    // shared rail. 1280 gives headings, cards and carousel one vertical alignment.
    maxWidth: "1280px",
    borderRadius: "8px",
    borderRadiusSm: "4px",
  },
  animation: {
    durationFast: "0.2s",
    durationNormal: "0.4s",
    durationSlow: "0.6s",
    ease: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  },
} as const
