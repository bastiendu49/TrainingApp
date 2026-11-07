import { describe, expect, it } from 'vitest'
import { buildNotebookHistory } from '../data/notebook'
import { INITIAL_PROGRAM } from './program'
import { bestSet, exerciseSessions, personalRecord, practicedExercises, progressPoints, setsDone } from './stats'

const history = buildNotebookHistory(INITIAL_PROGRAM)

describe('bestSet', () => {
  it('prend le plus de reps', () => {
    expect(bestSet([{ value: 12 }, null, { value: 14 }, { value: 13 }])).toEqual({ value: 14 })
  })
  it('préfère le lest le plus lourd, même avec moins de reps', () => {
    expect(bestSet([{ value: 5, loadKg: 13 }, { value: 4, loadKg: 17 }])).toEqual({ value: 4, loadKg: 17 })
  })
  it('renvoie null si rien n’a été fait', () => {
    expect(bestSet([null, null])).toBeNull()
  })
})

describe('suivi d’un exercice', () => {
  it('liste les séances dans l’ordre chronologique', () => {
    const s = exerciseSessions(history, 'pompes-archer')
    expect(s).toHaveLength(9)
    expect(s[0].best.value).toBe(6)
    expect(s.at(-1)?.best.value).toBe(12)
  })

  it('compte la planche inversée des deux circuits (Push et Épaules)', () => {
    expect(exerciseSessions(history, 'planche-inversee')).toHaveLength(16)
  })

  it('trouve le record et la première séance où il a été atteint', () => {
    const r = personalRecord(history, 'pompes-archer')
    expect(r?.best.value).toBe(12)
    expect(r?.log.id).toBe('carnet-push-7')
  })

  it('trace le lest pour les tractions lestées, les reps sinon', () => {
    const lest = progressPoints(history, 'tractions-lestees')
    expect(lest.map((p) => p.y)).toEqual([13, 13, 13, 13, 13, 17, 17, 17, 17])
    expect(progressPoints(history, 'dips-droit').at(-1)?.y).toBe(15)
  })

  it('classe les exercices pratiqués du plus fréquent au moins fréquent', () => {
    const list = practicedExercises(history)
    expect(list[0]).toEqual({ exerciseId: 'planche-inversee', count: 16 })
    expect(list.find((e) => e.exerciseId === 'skin-the-cat')?.count).toBe(1)
  })

  it('compte les séries faites', () => {
    expect(setsDone(history.find((l) => l.id === 'carnet-jambes-1')!)).toBe(12)
  })
})
