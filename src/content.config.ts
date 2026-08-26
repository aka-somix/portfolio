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

export const collections = {
  footer: defineCollection({ loader: section('footer'), schema: footerSchema }),
  site: defineCollection({ loader: glob({ base: ROOT, pattern: 'site.yaml' }), schema: siteSchema }),
  seo:  defineCollection({ loader: glob({ base: ROOT, pattern: 'seo.yaml'  }), schema: seoSchema  }),
}
