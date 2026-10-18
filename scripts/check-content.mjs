#!/usr/bin/env node
/**
 * Fails the build when human-readable copy lives in code.
 * Usage: node scripts/check-content.mjs [--strict]
 *   --strict also fails on warnings, including chapters still marked draft.
 */
import { readFile, readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { draftFlag, scanSource } from './lib/content-rules.mjs'

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

// Draft gate: warns on build, fails under --strict.
for (const f of contentFiles.filter((f) => f.endsWith('.md'))) {
  violations.push(...draftFlag({ path: relative(root, f), text: await readFile(f, 'utf8') }))
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
