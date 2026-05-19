export interface Work {
  slug: string
  title: string
  description: string
  roles: string[]
  client: string
  image?: string
  imageAttribution?: string
  imageAlt?: string
}

export const works: Work[] = [
  {
    slug: "consultant",
    title: "Consultant Chapter",
    description: "As a Consultant, I have been involved in various projects, primarily focused on architecture, backend development, and AWS. I have worked with Reply, where I contributed to designing and implementing scalable solutions that meet their business needs.",
    roles: ["Architecture", "Backend", "AWS" ],
    client: "Reply",
    image: "/images/work/consultant.jpg",
    // imageAttribution: "Photo by <a href="https://unsplash.com/@charlesdeluvio?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">charlesdeluvio</a> on <a href="https://unsplash.com/photos/man-using-macbook-Lks7vei-eAg?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>"
  }
]
