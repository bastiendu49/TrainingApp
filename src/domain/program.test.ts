import { describe, expect, it } from 'vitest'
import { INITIAL_PROGRAM as P } from './program'
import type { Target } from './types'

describe('programme de départ', () => {
  it('ne référence que des éléments qui existent', () => {
    for (const c of P.circuits) for (const item of c.items) expect(P.exercises[item.exerciseId], item.exerciseId).toBeDefined()
    for (const s of P.skills) for (const l of s.levels) expect(P.exercises[l.exerciseId], l.exerciseId).toBeDefined()
    for (const s of P.sessions) {
      expect(P.warmups.some((w) => w.id === s.warmupId), s.warmupId).toBe(true)
      expect(P.skills.some((k) => k.id === s.skillId), s.skillId).toBe(true)
      for (const id of s.circuitIds) expect(P.circuits.some((c) => c.id === id), id).toBe(true)
    }
  })

  it('a des identifiants uniques', () => {
    for (const list of [P.warmups, P.skills, P.circuits, P.sessions]) {
      const ids = list.map((x) => x.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('donne un objectif chiffré aux exercices qui en ont besoin', () => {
    const check = (exerciseId: string, t: Target) => {
      const kind = P.exercises[exerciseId].kind
      if (kind === 'reps' || kind === 'repsPerSide') expect(t.reps, exerciseId).toBeGreaterThan(0)
      if (kind === 'time') expect(t.seconds, exerciseId).toBeGreaterThan(0)
    }
    for (const c of P.circuits) for (const item of c.items) check(item.exerciseId, item.target)
    for (const s of P.skills) for (const l of s.levels) check(l.exerciseId, l.target)
  })

  it('pointe chaque technique sur un niveau existant', () => {
    for (const s of P.skills) expect(s.levels[s.currentLevel], s.id).toBeDefined()
  })
})
