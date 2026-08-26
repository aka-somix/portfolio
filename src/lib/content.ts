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
