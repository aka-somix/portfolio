/**
 * Single source of truth for the contact channels and the availability claim.
 *
 * These were previously scattered: BOOKING_URL lived only in Nav.astro, LinkedIn
 * appeared only in the nav, and the availability statement — which PRODUCT.md
 * records as a confirmed, binding fact — appeared nowhere on the site at all.
 */

export const site = {
  bookingUrl: "https://calendar.app.google/PRkS5N4zfMgpPgud7",
  email: "s.cirone.work@gmail.com",
  linkedin: "https://www.linkedin.com/in/salvatore-cirone-it/",
  github: "https://github.com/aka-somix",
  medium: "https://medium.com/@salvatorecirone",

  /**
   * The honest availability line from PRODUCT.md. Employed at xFarm AND open to
   * select projects. Do not soften this into "available for hire", and do not
   * strengthen it into full-time freelance availability.
   */
  availability: "At xFarm Technologies full-time — open to select projects and advisory work.",

  /** Turns the nomad claim into a practical booking fact. */
  base: "Based in Italy",
  timezone: "CET / UTC+1",
} as const
