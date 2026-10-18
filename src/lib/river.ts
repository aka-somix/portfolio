/**
 * Geometry for the river of roles: a streamgraph of how a chapter's role mix
 * shifted across its phases. Pure and DOM-free, so it is unit-tested with
 * scripts/lib/river.test.mjs and drawn by ChapterRiver.astro.
 *
 * Coordinates live in a fixed VIEW_W × VIEW_H box. The SVG is stretched with
 * preserveAspectRatio="none", so every position the HTML overlay needs is also
 * returned as a percentage of that box.
 */
export const VIEW_W = 1000
export const VIEW_H = 100

/** Share of the height the widest phase fills, leaving air above and below. */
const FILL = 0.92

export type RiverPhase = { id: string; title: string; roles: Record<string, number> }

export type RiverStream = {
  roleId: string
  /** Index in the shared role list: drives stacking and colour. */
  order: number
  d: string
  /** Vertical centre at the last phase, in %, or null when the role ended earlier. */
  mouthY: number | null
}

export type RiverTitle = {
  title: string
  phaseIndex: number
  /** Horizontal position in %. */
  x: number
  edge: 'start' | 'mid' | 'end'
}

export type RiverGeometry = {
  /** Phase positions in %. */
  phaseX: number[]
  streams: RiverStream[]
  titles: RiverTitle[]
  /** True when a role ends before the mouth and so carries no mouth label. */
  hasEnded: boolean
}

type Pt = readonly [number, number]

const round = (n: number) => Math.round(n * 100) / 100
const pt = (p: Pt) => `${round(p[0])},${round(p[1])}`

/** Role ids held in at least one phase, in role-list order. */
export function rolesUsed(phases: RiverPhase[], roleOrder: string[]): string[] {
  return roleOrder.filter((id) => phases.some((p) => (p.roles[id] ?? 0) > 0))
}

/** Role ids a phase uses that the role list does not declare. */
export function unknownRoles(phases: RiverPhase[], roleOrder: string[]): string[] {
  const ids = phases.flatMap((p) => Object.keys(p.roles))
  return [...new Set(ids)].filter((id) => !roleOrder.includes(id))
}

/**
 * For each phase, the [top, bottom] band of every used role in box units,
 * stacked in role order and centred on the midline.
 */
export function phaseBands(phases: RiverPhase[], used: string[]) {
  const totals = phases.map((p) => used.reduce((s, id) => s + (p.roles[id] ?? 0), 0))
  const unit = (VIEW_H * FILL) / Math.max(...totals)
  return phases.map((p, i) => {
    let y = VIEW_H / 2 - (totals[i] * unit) / 2
    return used.map((id) => {
      const top = y
      y += (p.roles[id] ?? 0) * unit
      return [top, y] as const
    })
  })
}

/** Smooth horizontal joins: both control points sit at the x midpoint. */
function joins(pts: readonly Pt[]): string {
  let d = ''
  for (let i = 1; i < pts.length; i++) {
    const cx = round((pts[i - 1][0] + pts[i][0]) / 2)
    d += ` C${cx},${round(pts[i - 1][1])} ${cx},${round(pts[i][1])} ${pt(pts[i])}`
  }
  return d
}

export function riverGeometry(phases: RiverPhase[], roleOrder: string[]): RiverGeometry {
  const n = phases.length
  const used = rolesUsed(phases, roleOrder)
  const bands = phaseBands(phases, used)
  const xs = phases.map((_, i) => (n === 1 ? 0 : (VIEW_W * i) / (n - 1)))

  const streams = used.map((roleId, r) => {
    const upper: Pt[] = xs.map((x, i): Pt => [x, bands[i][r][0]])
    const lower: Pt[] = xs.map((x, i): Pt => [x, bands[i][r][1]]).reverse()
    const [top, bottom] = bands[n - 1][r]
    return {
      roleId,
      order: roleOrder.indexOf(roleId),
      d: `M${pt(upper[0])}${joins(upper)} L${pt(lower[0])}${joins(lower)} Z`,
      mouthY: bottom - top > 0 ? round(((top + bottom) / 2 / VIEW_H) * 100) : null,
    }
  })

  const titles: RiverTitle[] = []
  phases.forEach((p, i) => {
    if (i > 0 && p.title === phases[i - 1].title) return
    titles.push({
      title: p.title,
      phaseIndex: i,
      x: round((xs[i] / VIEW_W) * 100),
      edge: i === 0 ? 'start' : i === n - 1 ? 'end' : 'mid',
    })
  })

  return {
    phaseX: xs.map((x) => round((x / VIEW_W) * 100)),
    streams,
    titles,
    hasEnded: streams.some((s) => s.mouthY === null),
  }
}
