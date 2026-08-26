/* ----------------------------------------------------------------------------
 * DRAFT COPY NOTICE
 *
 * The `help` bullets on each service are drafted from the existing service
 * descriptions and PRODUCT.md. They are capability statements, not measured
 * claims — no numbers, clients, or outcomes are asserted. They are still
 * marketing copy written in Salvatore's voice by someone who is not Salvatore,
 * so they are worth a read-through and an edit before they represent him.
 * -------------------------------------------------------------------------- */

export interface Service {
  id: string
  title: string
  /** Short domain line on the badge front. Replaces the randomised barcode. */
  tag: string
  description: string
  /** Badge reverse: how he actually helps. 3–4 concrete items. */
  help: string[]
  image: string
  imageAlt: string
}

export const services: Service[] = [
  {
    id: "backend",
    title: "Senior Backend Engineer",
    tag: "Node.js · Python · AWS",
    description:
      "Powering your application with robust, scalable backend solutions using Node.js, Python, and cloud services.",
    help: [
      "Design and build services that hold up under real traffic",
      "Untangle an existing codebase without stopping delivery",
      "Set the testing, observability and deployment baseline",
      "Review and harden what your team already shipped",
    ],
    image: "/images/services/backend.png",
    imageAlt: "Senior Backend Engineer avatar",
  },
  {
    id: "solution-architect",
    title: "Cloud Solutions Architect",
    tag: "AWS · Well-Architected",
    description:
      "Designing and implementing scalable, secure, and cost-effective cloud architectures tailored to your business needs.",
    help: [
      "Target-state architecture your team can actually operate",
      "Migration paths that work around live production constraints",
      "Cost and security review of an existing AWS estate",
      "Written decisions, so the reasoning outlives the engagement",
    ],
    image: "/images/services/solution-architect.png",
    imageAlt: "Cloud Solutions Architect avatar",
  },
  {
    id: "ai-engineer",
    title: "AI Engineer",
    tag: "LLMs · Evaluation · Deployment",
    description:
      "Finetuning and deploying AI models to enhance your applications with intelligent features and automation.",
    help: [
      "Find the AI features worth building, and the ones that aren't",
      "Ship LLM features into a product without destabilising it",
      "Build the evaluation loop before the demo, not after",
      "Keep cost and latency inside something you can budget for",
    ],
    image: "/images/services/ai-engineer.png",
    imageAlt: "AI Engineer avatar",
  },
  {
    id: "digital-nomad",
    title: "Digital Nomad Consulting",
    tag: "Distributed teams · Async",
    description:
      "Help in working remotely while traveling the world, maintaining productivity and work-life balance.",
    help: [
      "Set up an engineering team that works across timezones",
      "Async practices that survive people being offline",
      "Practical logistics from someone who actually does this",
      "Hiring and onboarding when nobody shares an office",
    ],
    image: "/images/services/digital-nomad.png",
    imageAlt: "Digital Nomad Consulting avatar",
  },
]
