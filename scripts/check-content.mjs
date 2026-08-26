#!/usr/bin/env node
/**
 * Fails the build when human-readable copy lives in code.
 * Usage: node scripts/check-content.mjs [--strict]
 *   --strict also fails on warnings, including unresolved specPlaceholder.
 */
import { readFile, readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { scanSource } from './lib/content-rules.mjs'

const strict = process.argv.includes('--strict')
const root = process.cwd()

const allow = JSON.parse(
  await readFile(join(root, 'scripts/content-check.allow.json'), 'utf8')
).allow

async function walk(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) await walk(p, out)
    else out.push(p)
  }
  return out
}

const files = (await walk(join(root, 'src'))).filter((f) =>
  /\.(astro|ts)$/.test(f)
)
const contentFiles = (await walk(join(root, 'src/content'))).filter((f) =>
  /\.(yaml|yml|md)$/.test(f)
)

const violations = []
for (const f of [...files, ...contentFiles]) {
  const path = relative(root, f)
  violations.push(...scanSource({ path, text: await readFile(f, 'utf8'), allow }))
}

// specPlaceholder gate: warns on build, fails under --strict.
for (const f of contentFiles.filter((f) => f.endsWith('.md'))) {
  const text = await readFile(f, 'utf8')
  if (/^specPlaceholder:\s*true\s*$/m.test(text)) {
    violations.push({
      path: relative(root, f),
      line: text.split('\n').findIndex((l) => /^specPlaceholder:\s*true/.test(l)) + 1,
      rule: 'SPEC',
      text: 'specPlaceholder: true',
      remedy:
        'the spec values in this chapter are INVENTED. Replace them with real values and set specPlaceholder: false before deploying',
      severity: 'warn',
    })
  }
}

const errors = violations.filter((v) => v.severity !== 'warn')
const warns = violations.filter((v) => v.severity === 'warn')

const show = (v) =>
  console.log(`  ${v.path}:${v.line}  [${v.rule}]  ${v.text}\n      → ${v.remedy}`)

if (warns.length) {
  console.log(`\n⚠️  ${warns.length} content warning(s):`)
  warns.forEach(show)
}
if (errors.length) {
  console.log(`\n❌ ${errors.length} content violation(s):`)
  errors.forEach(show)
  console.log(
    '\nCopy must never live in code. See CONTENT.md. If a string is genuinely\n' +
      'technical, add `content-ok: <reason>` on its line or add it to\n' +
      'scripts/content-check.allow.json.\n'
  )
}

if (errors.length || (strict && warns.length)) process.exit(1)
if (!errors.length && !warns.length) console.log('✅ content check clean')
