export interface Certification {
  name: string
  issuer: string
  logo: string
  link: string
}

export const certifications: Certification[] = [
  {
    name: "AWS Solutions Architect Professional (SAP-C02)",
    issuer: "Amazon Web Services",
    logo: "/images/certifications/aws-sap.png",
    link: "https://aws.amazon.com/certification/certified-solutions-architect-professional/"
  },
  {
    name: "AWS Data Engineer Associate (DAE-C01)",
    issuer: "Amazon Web Services",
    logo: "/images/certifications/aws-dae.png",
    link: "https://aws.amazon.com/certification/certified-data-engineer-associate/"
  },
  {
    name: "IELTS Academic Band 8.0",
    issuer: "British Council",
    logo: "/images/certifications/ielts.png",
    link: "https://www.ielts.org/",
  },
  {
    name: "Software Engineer Certificate",
    issuer: "Hackerrank",
    logo: "/images/certifications/hackerrank.png",
    link: "https://www.hackerrank.com/certificates/812122bd1887",
  },
]
