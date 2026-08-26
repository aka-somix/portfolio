/* ============================================================================
 * ⚠️  PLACEHOLDER SPEC DATA — DO NOT DEPLOY AS-IS  ⚠️
 * ============================================================================
 *
 * Every chapter below with `specPlaceholder: true` carries INVENTED numbers in
 * its `spec` rows (years, scale, team size, throughput). They exist so the
 * design can be evaluated with realistically-shaped content. They are NOT true.
 *
 * PRODUCT.md forbids fabricated metrics on this site. Before `pnpm deploy`:
 *   1. Replace every `spec` value with a real one.
 *   2. Set `specPlaceholder: false` on that chapter.
 *
 * `pnpm build` prints a warning for each chapter still flagged. The rendered
 * markup also carries `data-spec-placeholder` so it is greppable in `dist/`.
 * ==========================================================================*/

export interface SpecRow {
  label: string
  value: string
}

export interface Work {
  slug: string
  /** Chapter name. An arena, not a job title. */
  title: string
  /** One line naming the world this chapter covers. */
  arena: string
  /** The 21–28px lede tier. What this arena was, in one sentence. */
  lede: string
  /** Main responsibilities held in this arena. 3–6 items. */
  responsibilities: string[]
  /** What this world taught him. The versatility payload. */
  learned: string
  roles: string[]
  client: string
  /** Quiet chronology for the hiring-manager read. Not a résumé. */
  years: string
  /** Tabular spec panel. Replaces the stock photo. 4–8 rows. */
  spec: SpecRow[]
  /** true = the spec values above are invented. Must be false before deploy. */
  specPlaceholder: boolean
  /** Long-form case study. Committed future work; absent renders a holding state. */
  detail?: {
    projects: { name: string; summary: string; outcome: string }[]
  }
}

export const works: Work[] = [
  {
    slug: "consultant",
    title: "Consultant Chapter",
    arena: "Enterprise consulting",
    lede: "Designing systems for clients who already have production traffic, existing constraints, and no appetite for a rewrite.",
    responsibilities: [
      "Architecture review and target-state design on AWS",
      "Backend delivery in Node.js and Python",
      "Migration planning against live production constraints",
      "Technical liaison between client stakeholders and delivery teams",
    ],
    learned:
      "Consulting teaches you that the best architecture is the one a client's team can actually operate after you leave. Constraints are the brief, not an obstacle to it.",
    roles: ["Architecture", "Backend", "AWS"],
    client: "Reply",
    years: "2021 — 2023",
    // ⚠️ PLACEHOLDER VALUES — see file header
    specPlaceholder: true,
    spec: [
      { label: "Domain", value: "Enterprise / consulting" },
      { label: "Engagements", value: "6" },
      { label: "Cloud", value: "AWS" },
      { label: "Core stack", value: "Node.js · Python · Terraform" },
      { label: "Largest system", value: "40 services" },
      { label: "Team span", value: "4 — 12 engineers" },
    ],
  },
  {
    slug: "startup",
    title: "Startup Chapter",
    arena: "Product engineering at scale-up pace",
    lede: "Owning architecture where the roadmap changes faster than the diagram, and shipping AI features on top of it without destabilising the platform.",
    responsibilities: [
      "Platform architecture and its evolution across releases",
      "Backend services for a production agritech platform",
      "AI feature design, evaluation and deployment",
      "Technical decisions under genuine time and headcount limits",
    ],
    learned:
      "A scale-up rewards architecture that can be wrong cheaply. You learn to pick the decisions worth defending and to leave the rest reversible.",
    roles: ["Architecture", "Backend", "AI Engineering"],
    client: "xFarm Technologies",
    years: "2023 — present",
    // ⚠️ PLACEHOLDER VALUES — see file header
    specPlaceholder: true,
    spec: [
      { label: "Domain", value: "Agritech SaaS" },
      { label: "Cloud", value: "AWS" },
      { label: "Core stack", value: "Node.js · Python · PostgreSQL" },
      { label: "AI surface", value: "LLM features in production" },
      { label: "Platform", value: "Multi-tenant" },
      { label: "Team span", value: "8 — 20 engineers" },
    ],
  },
]
