export interface Section {
  title: string
  description: string
}

export const sections: Record<string, Section> = {
  services: {
    title: "Services",
    description: "What I do best",
  },
  work: {
    title: "Work Chapters",
    description: "A peek at my journey",
  },
  contact: {
    title: "Let's Build Together",
    description: "Let's create something great",
  },
}
