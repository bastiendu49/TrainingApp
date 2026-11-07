import { describe, expect, it } from 'vitest'
import { buildNotebookHistory } from '../data/notebook'
import type { BodyEntry } from './body'
import { INITIAL_PROGRAM } from './program'
import { calendarGrid, monthlyReport } from './report'

const history = buildNotebookHistory(INITIAL_PROGRAM)
const body: BodyEntry[] = [
  { id: 'a', date: '2026-10-20', updatedAt: 1, weight: 78.4, waist: 82 },
  { id: 'b', date: '2026-11-03', updatedAt: 1, weight: 78 },
  { id: 'c', date: '2026-11-17', updatedAt: 1, weight: 77.2 },
]

describe('bilan mensuel', () => {
  const nov = monthlyReport(history, body, 2026, 10)
  const oct = monthlyReport(history, body, 2026, 9)

  it('compte les séances du mois et du mois précédent', () => {
    expect(nov.sessions).toBe(4) // 2, 3, 5 et 6 novembre
    expect(nov.sessionsPreviousMonth).toBe(oct.sessions)
    expect(oct.sessions).toBeGreaterThan(nov.sessions)
  })

  it('compare le début du mois (dernière séance d’octobre) à maintenant', () => {
    const lest = nov.exercises.find((e) => e.exerciseId === 'tractions-lestees')!
    expect(lest).toMatchObject({ loaded: true, start: { value: 5, loadKg: 17 }, now: { value: 5, loadKg: 17 }, delta: 0 })
    const archer = nov.exercises.find((e) => e.exerciseId === 'pompes-archer')!
    expect(archer).toMatchObject({ start: { value: 12 }, now: { value: 12 }, delta: 0 })
  })

  it('classe les exercices du plus progressé au moins progressé', () => {
    const deltas = oct.exercises.map((e) => e.delta)
    expect([...deltas].sort((a, b) => b - a)).toEqual(deltas)
    expect(oct.exercises[0].delta).toBeGreaterThan(0)
  })

  it('suit le lest plutôt que les reps pour les tractions lestées', () => {
    const lest = oct.exercises.find((e) => e.exerciseId === 'tractions-lestees')!
    expect(lest.delta).toBe(4) // 13 kg fin septembre → 17 kg fin octobre
  })

  it('compare aussi les mesures du corps', () => {
    expect(nov.body).toEqual([
      { metric: 'weight', start: 78.4, now: 77.2 },
    ])
  })

  it('renvoie un bilan vide pour un mois sans séance', () => {
    const r = monthlyReport(history, [], 2025, 0)
    expect(r).toMatchObject({ sessions: 0, sets: 0, rating: null, exercises: [], body: [] })
  })
})

describe('calendarGrid', () => {
  it('commence le lundi et complète les semaines', () => {
    const cells = calendarGrid(2026, 10) // novembre 2026 : commence un dimanche
    expect(cells.slice(0, 6)).toEqual(Array(6).fill(null))
    expect(cells[6]?.getDate()).toBe(1)
    expect(cells.length % 7).toBe(0)
    expect(cells.filter((c) => c).length).toBe(30)
  })
})
