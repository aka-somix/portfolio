export interface Work {
  slug: string
  title: string
  description: string
  roles: string[]
  client: string
}

export const works: Work[] = [
  {
    slug: "consultant",
    title: "Consultant Chapter",
    description: "A full-platform redesign for a SaaS analytics dashboard, improving load times by 40% and user engagement by 25%.",
    roles: ["Architecture", "Backend", "AWS" ],
    client: "Reply",
  }
]
