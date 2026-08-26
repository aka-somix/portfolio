import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

/**
 * Content root. This is the single locale seam: adding a second language means
 * turning this into a `*` glob and threading a locale through src/lib/content.ts.
 * No component ever references a path or a collection name.
 */
const ROOT = './src/content/en'

/** One YAML file in sections/ becomes one entry whose id is the filename. */
const section = (name: string) =>
  glob({ base: `${ROOT}/sections`, pattern: `${name}.yaml` })

const footerSchema = z.object({
  copyright: z.string(),
})

const siteSchema = z.object({
  bookingUrl: z.string().url(),
  email: z.string().email(),
  linkedin: z.string().url(),
  github: z.string().url(),
  medium: z.string().url(),
  base: z.string(),
  person: z.object({
    name: z.string(),
    givenName: z.string(),
    familyName: z.string(),
    jobTitle: z.array(z.string()).min(1),
    description: z.string(),
    knowsAbout: z.array(z.string()).min(1),
  }),
})

const seoSchema = z.object({
  siteName: z.string(),
  siteUrl: z.string().url(),
  ogImage: z.string(),
  ogImageWidth: z.string(),
  ogImageHeight: z.string(),
  pages: z.object({
    home: z.object({ title: z.string(), description: z.string() }),
    work: z.object({ titleTemplate: z.string() }),
  }),
})

const uiSchema = z.object({
  layout: z.object({ skipLink: z.string() }),
  nav: z.object({
    logoAriaLabel: z.string(),
    links: z.array(z.object({ id: z.string(), label: z.string() })).min(1),
    cta: z.object({ label: z.string(), alt: z.string() }),
    burgerAriaLabel: z.string(),
    sidebarAriaLabel: z.string(),
    socialAriaLabels: z.object({
      linkedin: z.string(),
      github: z.string(),
      medium: z.string(),
    }),
  }),
  services: z.object({
    deckAriaLabel: z.string(),
    prevAriaLabel: z.string(),
    nextAriaLabel: z.string(),
  }),
  serviceCard: z.object({ helpLabel: z.string(), flipAriaSuffix: z.string() }),
  work: z.object({ prevAriaLabel: z.string(), nextAriaLabel: z.string() }),
  workCard: z.object({
    held: z.string(),
    taught: z.string(),
    cta: z.string(),
    ctaAlt: z.string(),
  }),
  workSpec: z.object({ client: z.string(), years: z.string() }),
  workPage: z.object({
    back: z.string(),
    projects: z.string(),
    writeUpTitle: z.string(),
    holding: z.object({
      title: z.string(),
      body1: z.string(),
      body2: z.string(),
      cta: z.string(),
    }),
  }),
})

const servicesSchema = z.object({
  header: z.object({ title: z.string(), description: z.string() }),
  hint: z.string(),
  items: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        tag: z.string(),
        description: z.string(),
        help: z.array(z.string()).min(1),
        image: z.string(),
        imageAlt: z.string(),
      })
    )
    .min(1),
})

const heroSchema = z.object({
  headline: z.array(z.string()).min(1),
  lede: z.object({ before: z.string(), name: z.string(), after: z.string() }),
  baseSuffix: z.string(),
  jumpLabel: z.string(),
  portrait: z.object({ src: z.string(), alt: z.string() }),
})

export const collections = {
  footer: defineCollection({ loader: section('footer'), schema: footerSchema }),
  hero: defineCollection({ loader: section('hero'), schema: heroSchema }),
  site: defineCollection({ loader: glob({ base: ROOT, pattern: 'site.yaml' }), schema: siteSchema }),
  seo:  defineCollection({ loader: glob({ base: ROOT, pattern: 'seo.yaml'  }), schema: seoSchema  }),
  ui: defineCollection({ loader: glob({ base: ROOT, pattern: 'ui.yaml' }), schema: uiSchema }),
  services: defineCollection({ loader: section('services'), schema: servicesSchema }),
}
