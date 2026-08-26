export interface Service {
  id: string
  title: string
  description: string
  image: string
  imageAlt: string
}

export const services: Service[] = [
  {
    id: "backend",
    title: "Senior Backend Engineer",
    description: "Powering your appplication with robust, scalable backend solutions using Node.js, Python, and cloud services.",
    image: "/images/services/backend.png",
    imageAlt: "Senior Backend Engineer avatar",
  },
  {
    id: "solution-architect",
    title: "Cloud Solutions Architect",
    description: "Designing and implementing scalable, secure, and cost-effective cloud architectures tailored to your business needs.",
    image: "/images/services/solution-architect.png",
    imageAlt: "Cloud Solutions Architect avatar",
  },
  {
    id: "ai-engineer",
    title: "AI Engineer",
    description: "Finetuning and deploying AI models to enhance your applications with intelligent features and automation.",
    image: "/images/services/ai-engineer.png",
    imageAlt: "AI Engineer avatar",
  },
  {
    id: "digital-nomad",
    title: "Digital Nomad Consulting",
    description: "Help in working remotely while traveling the world, maintaining productivity and work-life balance.",
    image: "/images/services/digital-nomad.png",
    imageAlt: "Digital Nomad Consulting avatar",
  },
]
