import { getCollection, getEntry, render } from 'astro:content'
import type { CollectionEntry, CollectionKey } from 'astro:content'

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

export const hero = () => data('hero', 'hero') as Promise<{
  headline: string[]
  lede: { before: string; name: string; after: string }
  baseSuffix: string
  jumpLabel: string
  portrait: { src: string; alt: string }
}>

export const site = () => data('site', 'site') as Promise<{
  bookingUrl: string
  email: string
  linkedin: string
  github: string
  medium: string
  base: string
  person: {
    name: string
    givenName: string
    familyName: string
    jobTitle: string[]
    description: string
    knowsAbout: string[]
  }
}>

export const seo = () => data('seo', 'seo') as Promise<{
  siteName: string
  siteUrl: string
  ogImage: string
  ogImageWidth: string
  ogImageHeight: string
  pages: {
    home: { title: string; description: string }
    work: { titleTemplate: string }
  }
}>

export const services = () => data('services', 'services') as Promise<{
  header: { title: string; description: string }
  hint: string
  items: {
    id: string
    title: string
    tag: string
    description: string
    help: string[]
    image: string
    imageAlt: string
  }[]
}>

export const ui = () => data('ui', 'ui') as Promise<{
  layout: { skipLink: string }
  nav: {
    logoAriaLabel: string
    links: { id: string; label: string }[]
    cta: { label: string; alt: string }
    burgerAriaLabel: string
    sidebarAriaLabel: string
    socialAriaLabels: { linkedin: string; github: string; medium: string }
  }
  services: { deckAriaLabel: string; prevAriaLabel: string; nextAriaLabel: string }
  serviceCard: { helpLabel: string; flipAriaSuffix: string }
  work: { prevAriaLabel: string; nextAriaLabel: string }
  workCard: { held: string; taught: string; cta: string; ctaAlt: string }
  workSpec: { client: string; years: string }
  workPage: {
    back: string
    projects: string
    writeUpTitle: string
    holding: { title: string; body1: string; body2: string; cta: string }
  }
}>

export const workSection = () => data('workSection', 'work') as Promise<{
  header: { title: string; description: string }
}>

export const certifications = () => data('certifications', 'certifications') as Promise<{
  label: string
  items: { name: string; issuer: string; logo: string; link: string }[]
}>

/** Chapters in author-declared order. `entry.id` is the slug. */
export async function workChapters(): Promise<CollectionEntry<'work'>[]> {
  const all = await getCollection('work')
  return all.sort((a, b) => a.data.order - b.data.order)
}

export async function workChapter(slug: string): Promise<CollectionEntry<'work'>> {
  const entry = await getEntry('work', slug)
  if (!entry) {
    throw new Error(
      `Missing work chapter "${slug}". Expected src/content/${LOCALE}/work/${slug}.md — see CONTENT.md.`
    )
  }
  return entry
}

/**
 * Renders a chapter's Markdown body. `render()` from astro:content is the
 * content-layer API; the legacy `entry.render()` method does not exist on
 * glob-loader collections. Wrapped here so pages never import astro:content.
 */
export const renderChapter = (entry: CollectionEntry<'work'>) => render(entry)
