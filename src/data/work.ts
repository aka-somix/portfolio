export interface Work {
  slug: string
  title: string
  description: string
  roles: string[]
  client: string
}

export const works: Work[] = [
  {
    slug: "project-alpha",
    title: "Project Alpha",
    description: "A full-platform redesign for a SaaS analytics dashboard, improving load times by 40% and user engagement by 25%.",
    roles: ["Frontend Lead", "Architecture", "UI Development"],
    client: "PRJ",
  },
  {
    slug: "project-beta",
    title: "Project Beta",
    description: "Built a design system from scratch supporting 12 products across web and mobile with consistent UX patterns.",
    roles: ["Design Engineer", "Design Systems"],
    client: "PRJ",
  },
  {
    slug: "project-gamma",
    title: "Project Gamma",
    description: "Developed an interactive data visualization platform handling millions of data points in real-time.",
    roles: ["Frontend Engineer", "Performance Optimization"],
    client: "PRJ",
  },
]
