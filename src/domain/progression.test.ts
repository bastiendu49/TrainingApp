import { describe, expect, it } from 'vitest'
import { buildNotebookHistory } from '../data/notebook'
import type { WorkoutLog } from './log'
import { INITIAL_PROGRAM as P } from './program'
import { applySuggestion, computeSuggestions, setSkillLevel, type Suggestion } from './progression'

const history = buildNotebookHistory(P)
const suggestions = computeSuggestions(P, history)
const find = (pred: (s: Suggestion) => boolean) => suggestions.find(pred)
const target = (exerciseId: string, circuitId?: string) =>
  find((s) => s.kind === 'target' && s.exerciseId === exerciseId && (!circuitId || s.circuitId === circuitId))

describe('propositions à partir du carnet', () => {
  it('propose +1 rep quand l’objectif est atteint 2 séances de suite', () => {
    expect(target('pompes-diamant')).toMatchObject({ from: { reps: 15 }, to: { reps: 16 } })
    expect(target('dips-droit')).toMatchObject({ to: { reps: 16 } })
  })

  it('propose +5 s pour un exercice en durée', () => {
    expect(target('bateau')).toMatchObject({ from: { seconds: 40 }, to: { seconds: 45 } })
  })

  it('ne propose rien si un tour est sous l’objectif', () => {
    expect(target('pompes-archer')).toBeUndefined() // 12 · 12 · 11 à la dernière
    expect(target('tractions-supination')).toBeUndefined() // 6 · 6 · 5 pour 10
  })

  it('ne propose rien pour un exercice « max »', () => {
    expect(target('tractions-explosives')).toBeUndefined()
  })

  it('traite séparément la planche inversée de Push et d’Épaules', () => {
    expect(target('planche-inversee', 'push')).toBeDefined()
    expect(target('planche-inversee', 'epaules')).toBeDefined()
  })

  it('propose de valider les soulevés de pieds (2 séances à 8 × 20)', () => {
    expect(find((s) => s.kind === 'level' && s.skillId === '90')).toMatchObject({ fromLevel: 0, toLevel: 1 })
  })

  it('ne propose pas encore d’augmenter le lest (5 · 5 · 5 · 4)', () => {
    expect(find((s) => s.kind === 'load')).toBeUndefined()
  })

  it('propose d’augmenter le lest dès que 4 × 5 est atteint', () => {
    const last = history.filter((l) => l.sessionId === 'pull-a').sort((a, b) => b.startedAt - a.startedAt)[0]
    const done: WorkoutLog = {
      ...last,
      id: 'nouvelle',
      startedAt: last.startedAt + 7 * 86_400_000,
      exercises: [{ ...last.exercises[0], results: Array(4).fill({ value: 5, loadKg: 17 }) }],
    }
    const load = computeSuggestions(P, [...history, done]).find((s) => s.kind === 'load')
    expect(load).toMatchObject({ skillId: 'muscle-up', fromKg: 17, toKg: 19.5 })
  })
})

describe('application', () => {
  it('change l’objectif du bon exercice du bon circuit', () => {
    const p = applySuggestion(P, target('pompes-diamant')!, 1)
    expect(p.circuits.find((c) => c.id === 'push')!.items[0].target).toEqual({ reps: 16 })
    // Les autres exercices ne bougent pas.
    expect(p.circuits.find((c) => c.id === 'push')!.items[1].target).toEqual({ reps: 12 })
  })

  it('n’en reparle plus une fois appliquée', () => {
    const p = applySuggestion(P, target('pompes-diamant')!, 1)
    expect(computeSuggestions(p, history).some((s) => s.kind === 'target' && s.exerciseId === 'pompes-diamant')).toBe(false)
  })

  it('applique le palier de lest choisi', () => {
    const s: Suggestion = { key: 'k', kind: 'load', skillId: 'muscle-up', level: 0, fromKg: 17, toKg: 19.5, evidence: '' }
    expect(applySuggestion(P, s, 1, 20).skills.find((k) => k.id === 'muscle-up')!.levels[0].target).toEqual({ reps: 5, loadKg: 20 })
  })

  it('passe au niveau suivant en notant la date, et permet de revenir en arrière', () => {
    let p = applySuggestion(P, find((s) => s.kind === 'level')!, 1000)
    expect(p.skills.find((k) => k.id === '90')).toMatchObject({ currentLevel: 1, levelHistory: [{ level: 1, at: 1000 }] })
    p = setSkillLevel(p, '90', 0, 2000)
    expect(p.skills.find((k) => k.id === '90')!.currentLevel).toBe(0)
    expect(p.skills.find((k) => k.id === '90')!.levelHistory).toHaveLength(2)
  })

  it('refuse un niveau qui n’existe pas', () => {
    expect(setSkillLevel(P, '90', 9, 1)).toEqual(P)
  })
})
