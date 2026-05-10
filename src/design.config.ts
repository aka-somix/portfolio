export const design = {
  palette: {
    bg: {
      primary: "#15102f",
      surface: "#3e2c60",
      card: "#85409D",
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
    sans: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
    googleFontsUrl:
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap",
    weights: {
      sans: "400;500;600;700;800",
      mono: "400;500",
    },
  },
  layout: {
    navHeight: "64px",
    maxWidth: "1200px",
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
