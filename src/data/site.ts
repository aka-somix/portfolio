/**
 * Single source of truth for the contact channels.
 *
 * These were previously scattered: BOOKING_URL lived only in Nav.astro and
 * LinkedIn appeared only in the nav.
 */

export const site = {
  bookingUrl: "https://calendar.app.google/PRkS5N4zfMgpPgud7",
  email: "s.cirone.work@gmail.com",
  linkedin: "https://www.linkedin.com/in/salvatore-cirone-it/",
  github: "https://github.com/aka-somix",
  medium: "https://medium.com/@salvatorecirone",

  /** Read in the hero base line. */
  base: "Based in Italy",
} as const
