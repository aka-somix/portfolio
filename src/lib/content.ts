import { getEntry } from 'astro:content'
import type { CollectionKey } from 'astro:content'

/**
 * The ONLY module allowed to import `astro:content`. Components call the named
 * accessors below so that collection ids and locale paths live in one place.
 * scripts/check-content.mjs enforces this (rule R4).
 */
export const LOCALE = 'en'

async function data<K extends CollectionKey>(collection: K, id: string) {
  const entry = await getEntry(collection as never, id as never)
  if (!entry) {
    throw new Error(
      `Missing content entry "${id}" in collection "${collection}". ` +
        `Expected a file under src/content/${LOCALE}/ — see CONTENT.md.`
    )
  }
  return (entry as { data: unknown }).data
}

export const footer = () => data('footer', 'footer') as Promise<{ copyright: string }>
