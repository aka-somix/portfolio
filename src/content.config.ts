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

export const collections = {
  footer: defineCollection({ loader: section('footer'), schema: footerSchema }),
}
