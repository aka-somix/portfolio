import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scanSource } from './content-rules.mjs'

const scan = (text, path = 'src/components/X.astro') =>
  scanSource({ path, text, allow: [] })
const rules = (text, path) => scan(text, path).map((v) => v.rule)

test('R1 flags a literal text node in markup', () => {
  const v = scan('---\n---\n<p>See the work</p>')
  assert.equal(v.length, 1)
  assert.equal(v[0].rule, 'R1')
  assert.match(v[0].text, /See the work/)
  assert.match(v[0].remedy, /src\/content/)
})

test('R1 ignores expressions, style, script and comments', () => {
  assert.deepEqual(rules('---\n---\n<p>{content.lede}</p>'), [])
  assert.deepEqual(rules('---\n---\n<style>.a { color: red }</style>'), [])
  assert.deepEqual(rules('---\n---\n<!-- a design note in prose -->'), [])
})

test('R1 ignores svg path data and single-letter text', () => {
  assert.deepEqual(
    rules('---\n---\n<svg><path d="M8 3v10M4 9l4 4 4-4" /></svg>'),
    []
  )
})

test('R2 flags a literal alt and allows empty or expression', () => {
  assert.deepEqual(rules('---\n---\n<img alt="A portrait of someone" />'), ['R2'])
  assert.deepEqual(rules('---\n---\n<img alt="" />'), [])
  assert.deepEqual(rules('---\n---\n<img alt={content.alt} />'), [])
})

test('R2 flags a literal aria-label', () => {
  assert.deepEqual(rules('---\n---\n<button aria-label="Toggle menu" />'), ['R2'])
})

test('R2 ignores technical meta content but flags copy-bearing meta', () => {
  const technical =
    '---\n---\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
    '<meta property="og:type" content="website" />\n' +
    '<meta name="twitter:card" content="summary_large_image" />'
  assert.deepEqual(rules(technical), [])
  assert.deepEqual(
    rules('---\n---\n<meta name="description" content="A portfolio site for someone" />'),
    ['R2']
  )
})

test('R3 flags a two-word literal in frontmatter and in a client script', () => {
  assert.deepEqual(rules('---\nconst a = "Book a call"\n---\n'), ['R3'])
  assert.deepEqual(
    rules('---\n---\n<script>const l = "Book now please"</script>'),
    ['R3']
  )
})

test('R3 flags copy inside a template literal', () => {
  assert.deepEqual(
    rules('---\nconst a = `${title} flip for detail`\n---\n'),
    ['R3']
  )
})

test('R3 ignores single technical tokens', () => {
  assert.deepEqual(rules('---\nconst e = "power2.out"\n---\n'), [])
  assert.deepEqual(rules('---\nconst s = "[data-animate]"\n---\n'), [])
})

test('R4 flags astro:content imports outside the allowed modules', () => {
  assert.deepEqual(
    rules('---\nimport { getEntry } from "astro:content"\n---\n'),
    ['R4']
  )
  assert.deepEqual(
    rules('import { getEntry } from "astro:content"', 'src/lib/content.ts'),
    []
  )
  assert.deepEqual(
    rules('import { z } from "astro:content"', 'src/content.config.ts'),
    []
  )
})

test('R4 permits a type-only astro:content import anywhere', () => {
  assert.deepEqual(
    rules('---\nimport type { CollectionEntry } from "astro:content"\n---\n'),
    []
  )
})

test('R5 warns on the forbidden em dash in content files', () => {
  const v = scanSource({
    path: 'src/content/en/sections/hero.yaml',
    text: 'jumpLabel: See the work — now',
    allow: [],
  })
  assert.equal(v.length, 1)
  assert.equal(v[0].rule, 'R5')
  assert.equal(v[0].severity, 'warn')
})

test('a content-ok comment suppresses the violation on that line', () => {
  assert.deepEqual(
    rules('---\nconst q = "prefers-reduced-motion: reduce" // content-ok: media query\n---\n'),
    []
  )
  assert.deepEqual(
    rules('---\n---\n<p>Literal text</p> <!-- content-ok: fixture -->'),
    []
  )
})

test('a content-ok comment without a reason does not suppress', () => {
  assert.deepEqual(rules('---\nconst a = "Book a call" // content-ok\n---\n'), ['R3'])
})

test('the allowlist suppresses an exact repeated technical string', () => {
  const text = '---\nconst q = "prefers-reduced-motion: reduce"\n---\n'
  assert.deepEqual(scanSource({ path: 'src/x.astro', text, allow: [] }).map(v => v.rule), ['R3'])
  assert.deepEqual(
    scanSource({
      path: 'src/x.astro',
      text,
      allow: ['prefers-reduced-motion: reduce'],
    }),
    []
  )
})

test('exempt files are skipped entirely', () => {
  assert.deepEqual(
    rules('export const design = { font: "Archivo Variable" }', 'src/design.config.ts'),
    []
  )
})
