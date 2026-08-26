/**
 * Source-text rules that keep human-readable copy out of code.
 * See CONTENT.md. These are heuristics, not a parser: they catch accidental
 * and agent-written copy, and can be defeated by deliberate concatenation.
 */

const EXEMPT = [
  'src/design.config.ts',
  'src/content.config.ts',
  'src/lib/content.ts',
  'src/env.d.ts',
]

const ASTRO_CONTENT_ALLOWED = ['src/content.config.ts', 'src/lib/content.ts']

const COPY_ATTRS = ['alt', 'aria-label', 'title', 'placeholder']

const COPY_META = [
  'description',
  'og:title',
  'og:description',
  'og:image:alt',
  'twitter:title',
  'twitter:description',
]

const REMEDY =
  'move this string to src/content/en/ and read it via src/lib/content.ts (see CONTENT.md)'

/**
 * Two or more whitespace-separated word-like tokens: the signal that a literal
 * is prose. A token is word-like when it contains two consecutive letters, so
 * `power2.out`, `[data-animate]` and `85%` are never words, while `reduce` and
 * `motion:` are. The plan specified this as the regex
 * /[A-Za-z]{2,}[^\S\n]+[A-Za-z]{2,}/, but that form requires the two words to
 * be *adjacent* and separated by nothing but whitespace, so it misses its own
 * fixtures ("Book a call", "prefers-reduced-motion: reduce"). Counting tokens
 * is the same intent, correctly expressed.
 */
const WORDLIKE = /[A-Za-z]{2}/
const TWO_WORDS = {
  test: (value) =>
    value.split(/\s+/).filter((t) => WORDLIKE.test(t)).length >= 2,
}

const hasContentOk = (line) => /content-ok:\s*\S/.test(line)

function blank(text, re) {
  // Replace matched regions with equal-length whitespace so line numbers hold.
  return text.replace(re, (m) => m.replace(/[^\n]/g, ' '))
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length
}

export function scanSource({ path, text, allow = [] }) {
  if (EXEMPT.some((e) => path.endsWith(e))) return []

  const isContentFile = path.includes('/content/')
  const violations = []
  const lines = text.split('\n')

  const push = (rule, index, snippet, severity = 'error') => {
    const line = lineOf(text, index)
    if (hasContentOk(lines[line - 1] ?? '')) return
    const trimmed = snippet.trim()
    if (allow.includes(trimmed)) return
    violations.push({ path, line, rule, text: trimmed, remedy: REMEDY, severity })
  }

  // R5: content files only - the AGENTS.md copy rule. Warning, not an error.
  if (isContentFile) {
    let i = text.indexOf('—')
    while (i !== -1) {
      const line = lineOf(text, i)
      violations.push({
        path,
        line,
        rule: 'R5',
        text: (lines[line - 1] ?? '').trim(),
        remedy: 'AGENTS.md forbids the em dash in copy; prefer "," or "."',
        severity: 'warn',
      })
      i = text.indexOf('—', i + 1)
    }
    return violations
  }

  // Split frontmatter from template for .astro files.
  const isAstro = path.endsWith('.astro')
  let frontmatterEnd = 0
  if (isAstro && text.startsWith('---')) {
    const close = text.indexOf('\n---', 3)
    frontmatterEnd = close === -1 ? 0 : close + 4
  }

  // R4: astro:content may only be imported by the two allowed modules,
  // unless the import is type-only.
  const importRe = /^.*\bfrom\s+['"]astro:content['"].*$/gm
  for (const m of text.matchAll(importRe)) {
    if (ASTRO_CONTENT_ALLOWED.some((a) => path.endsWith(a))) continue
    if (/^\s*import\s+type\b/.test(m[0])) continue
    push('R4', m.index, m[0])
  }

  // Working copy with style/script bodies blanked for markup rules,
  // and a second copy that keeps script bodies for R3.
  let markup = text.slice(frontmatterEnd)
  const markupOffset = frontmatterEnd
  markup = blank(markup, /<style[\s\S]*?<\/style>/g)
  markup = blank(markup, /<script[\s\S]*?<\/script>/g)
  markup = blank(markup, /<!--[\s\S]*?-->/g)

  // R1: literal text nodes.
  for (const m of markup.matchAll(/>([^<>{}]*[A-Za-z]{2,}[^<>{}]*)</g)) {
    const inner = m[1]
    if (!/[A-Za-z]{2,}/.test(inner)) continue
    push('R1', markupOffset + m.index + 1, inner)
  }

  // R2: copy-bearing attributes must be expressions.
  const attrRe = new RegExp(
    `\\b(${COPY_ATTRS.join('|')})\\s*=\\s*"([^"]*)"`,
    'g'
  )
  for (const m of markup.matchAll(attrRe)) {
    if (m[2].trim() === '') continue
    if (!/[A-Za-z]{2,}/.test(m[2])) continue
    push('R2', markupOffset + m.index, `${m[1]}="${m[2]}"`)
  }

  // R2 for <meta>: only the copy-bearing names.
  for (const m of markup.matchAll(/<meta\b[^>]*>/g)) {
    const tag = m[0]
    const name = /(?:name|property)\s*=\s*"([^"]+)"/.exec(tag)?.[1]
    const content = /\bcontent\s*=\s*"([^"]*)"/.exec(tag)?.[1]
    if (!name || content == null) continue
    if (!COPY_META.includes(name)) continue
    if (!/[A-Za-z]{2,}/.test(content)) continue
    push('R2', markupOffset + m.index, tag)
  }

  // R3: prose in string and template literals, in frontmatter and scripts.
  const codeRegions = []
  if (frontmatterEnd > 0) codeRegions.push([0, frontmatterEnd])
  for (const m of text.matchAll(/<script[\s\S]*?<\/script>/g)) {
    codeRegions.push([m.index, m.index + m[0].length])
  }
  if (!isAstro) codeRegions.push([0, text.length])

  const litRe = /"([^"\n]*)"|'([^'\n]*)'|`([^`]*)`/g
  for (const [start, end] of codeRegions) {
    const region = text.slice(start, end)
    for (const m of region.matchAll(litRe)) {
      const raw = m[1] ?? m[2] ?? m[3] ?? ''
      // Strip ${...} interpolations before judging a template literal.
      const value = raw.replace(/\$\{[^}]*\}/g, ' ')
      if (!TWO_WORDS.test(value)) continue
      push('R3', start + m.index, raw)
    }
  }

  return violations
}

export const EXEMPT_FILES = EXEMPT
