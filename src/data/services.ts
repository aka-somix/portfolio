export interface Service {
  id: string
  title: string
  description: string
  image: string
}

export const services: Service[] = [
  {
    id: "backend",
    title: "Senior Backend Engineer",
    description: "Powering your appplication with robust, scalable backend solutions using Node.js, Python, and cloud services.",
    image: "/images/services/backend.png",
  },
  {
    id: "solution-architect",
    title: "AWS Solutions Architect",
    description: "Designing and implementing scalable, secure, and cost-effective cloud architectures tailored to your business needs.",
    image: "/images/services/solution-architect.png",
  },
  {
    id: "ai-prompt-engineer",
    title: "AI Prompt Engineer",
    description: "Creating effective prompts for AI models to generate high-quality, contextually relevant outputs.",
    image: "/images/services/ai-prompt-engineer.png",
  },
  {
    id: "digital-nomad",
    title: "Digital Nomad Consulting",
    description: "Help in working remotely while traveling the world, maintaining productivity and work-life balance.",
    image: "/images/services/digital-nomad.png",
  },
]
