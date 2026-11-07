import { describe, expect, it } from 'vitest'
import { lastPerformance, sortedHistory } from '../domain/log'
import { INITIAL_PROGRAM } from '../domain/program'
import { nextSession } from '../domain/schedule'
import { buildNotebookHistory } from './notebook'

const logs = buildNotebookHistory(INITIAL_PROGRAM)
const byId = (id: string) => logs.find((l) => l.id === id)!

describe('historique du carnet', () => {
  it('crée le bon nombre de séances par type', () => {
    const count = (s: string) => logs.filter((l) => l.sessionId === s).length
    expect(count('push')).toBe(9)
    expect(count('pull-a')).toBe(9)
    expect(count('jambes')).toBe(2)
    expect(count('epaules')).toBe(7)
  })

  it('place les séances les plus récentes la semaine du 2 novembre, puis une par semaine', () => {
    expect(new Date(byId('carnet-push-9').startedAt).toDateString()).toBe(new Date(2026, 10, 2).toDateString())
    expect(new Date(byId('carnet-push-8').startedAt).toDateString()).toBe(new Date(2026, 9, 26).toDateString())
    expect(new Date(byId('carnet-epaules-7').startedAt).toDateString()).toBe(new Date(2026, 10, 6).toDateString())
  })

  it('reprend les dernières perfs notées', () => {
    expect(lastPerformance(logs, 'pompes-archer')?.exercise.results.map((r) => r?.value)).toEqual([12, 12, 11])
    expect(lastPerformance(logs, 'equilibre')?.exercise.results.map((r) => r?.value)).toEqual([30, 13, 20, 30, 30, 28])
    expect(lastPerformance(logs, 'tractions-lestees')?.exercise.results).toEqual([
      { value: 5, loadKg: 17 },
      { value: 5, loadKg: 17 },
      { value: 5, loadKg: 17 },
      { value: 4, loadKg: 17 },
    ])
    expect(lastPerformance(logs, 'souleves-pieds-alternes')?.exercise.results).toHaveLength(8)
  })

  it('aligne les exercices sur la séance la plus récente quand ils ont moins d’entrées', () => {
    // Les tractions explosives ne sont notées que sur les 5 dernières séances de Pull A.
    expect(byId('carnet-pull-a-4').exercises.some((e) => e.exerciseId === 'tractions-explosives')).toBe(false)
    expect(byId('carnet-pull-a-5').exercises.some((e) => e.exerciseId === 'tractions-explosives')).toBe(true)
  })

  it('note l’essai du 90° + pompe au bon niveau', () => {
    const essai = byId('carnet-push-8').exercises[0]
    expect(essai).toMatchObject({ exerciseId: '90-pompe', levelIndex: 1 })
  })

  it('a des identifiants uniques et stables', () => {
    expect(new Set(logs.map((l) => l.id)).size).toBe(logs.length)
    expect(buildNotebookHistory(INITIAL_PROGRAM)).toEqual(logs)
  })

  it('fait proposer la séance qui suit Épaules (la plus récente)', () => {
    expect(nextSession(INITIAL_PROGRAM.sessions, sortedHistory(logs)[0].sessionId).id).toBe('push')
  })

  it('ne référence que des exercices du programme', () => {
    for (const l of logs) for (const e of l.exercises) expect(INITIAL_PROGRAM.exercises[e.exerciseId], e.exerciseId).toBeDefined()
  })
})
