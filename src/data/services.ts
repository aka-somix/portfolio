export interface Service {
  id: string
  title: string
  description: string
  code: string
}

export const services: Service[] = [
  {
    id: "backend",
    title: "Senior Backend Engineer",
    description: "Powering your appplication with robust, scalable backend solutions using Node.js, Python, and cloud services.",
    code: "1010010001",
  },
  {
    id: "solution-architect",
    title: "AWS Solutions Architect",
    description: "Designing and implementing scalable, secure, and cost-effective cloud architectures tailored to your business needs.",
    code: "1000101110",
  },
  {
    id: "ai-prompt-engineer",
    title: "AI Prompt Engineer",
    description: "Creating effective prompts for AI models to generate high-quality, contextually relevant outputs.",
    code: "1110010110",
  },
  {
    id: "digital-nomad",
    title: "Digital Nomad Consulting",
    description: "Help in working remotely while traveling the world, maintaining productivity and work-life balance.",
    code: "1010101010",
  },
]
