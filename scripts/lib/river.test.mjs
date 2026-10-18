import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  VIEW_H,
  phaseBands,
  riverGeometry,
  rolesUsed,
  unknownRoles,
} from '../../src/lib/river.ts'

const ORDER = ['backend', 'architecture', 'ai-engineering', 'client-liaison']

const TWO = [
  { id: 'engineer', title: 'Engineer', roles: { backend: 3, architecture: 1 } },
  {
    id: 'architect',
    title: 'Architect',
    roles: { backend: 1, architecture: 3, 'client-liaison': 2 },
  },
]

const close = (a, b) => assert.ok(Math.abs(a - b) < 0.01, `${a} != ${b}`)

test('rolesUsed keeps role-list order and drops roles never held', () => {
  assert.deepEqual(rolesUsed(TWO, ORDER), ['backend', 'architecture', 'client-liaison'])
})

test('unknownRoles lists ids missing from the role list, once each', () => {
  const phases = [
    { id: 'a', title: 'A', roles: { backend: 1, devops: 2 } },
    { id: 'b', title: 'B', roles: { devops: 1 } },
  ]
  assert.deepEqual(unknownRoles(phases, ORDER), ['devops'])
  assert.deepEqual(unknownRoles(TWO, ORDER), [])
})

test('phaseBands stacks roles around the midline and the widest phase fills 92%', () => {
  const bands = phaseBands(TWO, rolesUsed(TWO, ORDER))
  // Phase 2 is the widest (total 6): it spans 4 → 96 of a 100-high box.
  close(bands[1][0][0], 4)
  close(bands[1][2][1], 96)
  // Phase 1 (total 4) is centred: its envelope is symmetric around 50.
  close(bands[0][0][0] + bands[0][2][1], VIEW_H)
  // A role absent from a phase has a zero-height band.
  close(bands[0][2][1] - bands[0][2][0], 0)
})

test('riverGeometry places phases at 0% and 100% for two phases', () => {
  assert.deepEqual(riverGeometry(TWO, ORDER).phaseX, [0, 100])
})

test('riverGeometry spaces four phases evenly', () => {
  const four = ['a', 'b', 'c', 'd'].map((id) => ({ id, title: id, roles: { backend: 1 } }))
  assert.deepEqual(riverGeometry(four, ORDER).phaseX, [0, 33.33, 66.67, 100])
})

test('streams keep their global order and are closed paths with one join per gap', () => {
  const { streams } = riverGeometry(TWO, ORDER)
  assert.deepEqual(
    streams.map((s) => [s.roleId, s.order]),
    [['backend', 0], ['architecture', 1], ['client-liaison', 3]]
  )
  for (const s of streams) {
    assert.match(s.d, /^M[\d.]+,[\d.]+ /)
    assert.match(s.d, / Z$/)
    // Upper edge and lower edge each have (phases - 1) cubic joins.
    assert.equal(s.d.match(/C/g).length, 2)
  }
})

test('mouthY is the vertical centre of each stream at the last phase', () => {
  const { streams } = riverGeometry(TWO, ORDER)
  close(streams[0].mouthY, 11.67)
  close(streams[1].mouthY, 42.33)
  close(streams[2].mouthY, 80.67)
})

test('a role that ends before the last phase has no mouth label', () => {
  const phases = [
    { id: 'a', title: 'A', roles: { backend: 2, 'ai-engineering': 1 } },
    { id: 'b', title: 'B', roles: { backend: 2 } },
  ]
  const geo = riverGeometry(phases, ORDER)
  assert.equal(geo.streams.find((s) => s.roleId === 'ai-engineering').mouthY, null)
  assert.equal(geo.hasEnded, true)
  assert.equal(riverGeometry(TWO, ORDER).hasEnded, false)
})

test('titles collapse consecutive repeats and carry their edge', () => {
  const phases = [
    { id: 'a', title: 'Engineer', roles: { backend: 1 } },
    { id: 'b', title: 'Architect', roles: { backend: 1 } },
    { id: 'c', title: 'Architect', roles: { backend: 1 } },
  ]
  assert.deepEqual(riverGeometry(phases, ORDER).titles, [
    { title: 'Engineer', phaseIndex: 0, x: 0, edge: 'start' },
    { title: 'Architect', phaseIndex: 1, x: 50, edge: 'mid' },
  ])
  assert.deepEqual(
    riverGeometry(TWO, ORDER).titles.map((t) => t.edge),
    ['start', 'end']
  )
})
