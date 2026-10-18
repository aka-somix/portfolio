import { gsap } from "gsap"

const DURATION = 1.2
const revealed = new WeakSet<Element>()

/** Inverse of expo.out (1 - 2^(-10t)): when the wipe reaches progress p. */
const reachAt = (p: number) => (DURATION * -Math.log2(1 - Math.min(p, 0.999))) / 10

/**
 * Draws a river left to right, once per river. The static markup is already
 * the finished state, so with reduced motion (or no JS) the river is simply
 * there. Each position title fades in as the wipe passes its phase.
 */
export function revealRiver(river: Element | null) {
  if (!river || revealed.has(river)) return
  revealed.add(river)
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

  const body = river.querySelector("[data-river-body]")
  if (body) {
    gsap.fromTo(
      body,
      { clipPath: "inset(0 100% 0 0)" },
      { clipPath: "inset(0 0% 0 0)", duration: DURATION, ease: "expo.out", clearProps: "clipPath" }
    )
  }

  river.querySelectorAll<HTMLElement>("[data-river-title]").forEach((title) => {
    gsap.fromTo(
      title,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, ease: "power2.out", delay: reachAt(Number(title.dataset.x) / 100) }
    )
  })
}
