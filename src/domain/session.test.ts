import { describe, expect, it } from 'vitest'
import type { WorkoutLog } from './log'
import { INITIAL_PROGRAM as P } from './program'
import {
  adjustRest,
  enterStep,
  finishLog,
  goToFinish,
  next,
  PREP_SECONDS,
  progress,
  rateRound,
  ratingOf,
  recordAndNext,
  startSession,
  startWork,
  suggestedValue,
  toggleWarmupItem,
  upcomingExercise,
  type Step,
} from './session'

const T0 = 1_000_000

const kinds = (steps: Step[]) => steps.map((s) => s.kind)

describe('startSession : déroulé de la séance Push', () => {
  const a = startSession(P, 'push', T0)

  it('commence par l’échauffement et finit par le résumé', () => {
    expect(a.steps[0].kind).toBe('warmup')
    expect(a.steps.at(-1)?.kind).toBe('finish')
    expect(a.index).toBe(0)
    expect(a.timer).toBeNull()
  })

  it('enchaîne les 8 séries de technique avec un repos de 2 min entre elles', () => {
    const technique = a.steps.slice(1, 16)
    expect(kinds(technique)).toEqual(['exercise', 'rest', 'exercise', 'rest', 'exercise', 'rest', 'exercise', 'rest', 'exercise', 'rest', 'exercise', 'rest', 'exercise', 'rest', 'exercise'])
    expect(technique.filter((s) => s.kind === 'rest').every((s) => s.kind === 'rest' && s.seconds === 120)).toBe(true)
    expect(a.steps[16]).toMatchObject({ kind: 'rest', label: 'Repos avant le circuit' })
  })

  it('fait 3 tours de 6 exercices, avec 40 s entre exercices et 2 min entre tours', () => {
    const circuit = a.steps.slice(17, -1)
    expect(circuit.filter((s) => s.kind === 'exercise')).toHaveLength(18)
    const rests = circuit.filter((s) => s.kind === 'rest')
    expect(rests.filter((s) => s.kind === 'rest' && s.seconds === 40)).toHaveLength(15)
    const roundRests = rests.filter((s) => s.kind === 'rest' && s.rating)
    expect(roundRests).toHaveLength(2)
    expect(roundRests.every((s) => s.kind === 'rest' && s.seconds === 120)).toBe(true)
    // Le dernier tour se note sur un écran dédié, puisqu'aucun repos ne suit.
    expect(circuit.at(-1)).toMatchObject({ kind: 'rating', circuitId: 'push', round: 2 })
  })

  it('prépare un journal avec la technique puis les 6 exercices du circuit', () => {
    expect(a.log.exercises.map((e) => e.exerciseId)).toEqual([
      'souleves-pieds-alternes',
      'pompes-diamant',
      'pompes-archer',
      'extensions-triceps',
      'gainage-pieds-alternes',
      'bateau',
      'planche-inversee',
    ])
    expect(a.log.exercises[0].results).toHaveLength(8)
    expect(a.log.exercises[1].results).toEqual([null, null, null])
  })
})

describe('startSession : Pull A et ses deux parties', () => {
  const a = startSession(P, 'pull-a', T0)
  it('enchaîne force puis endurance, avec 3 min de repos entre les deux', () => {
    const force = a.steps.filter((s) => s.kind === 'exercise' && a.log.exercises[s.ex].circuitId === 'pull-a-force')
    expect(force).toHaveLength(3)
    const ratingForce = a.steps.findIndex((s) => s.kind === 'rating' && s.circuitId === 'pull-a-force')
    expect(a.steps[ratingForce + 1]).toMatchObject({ kind: 'rest', seconds: 180, label: 'Repos avant la partie suivante' })
  })
  it('porte le lest des tractions lestées', () => {
    expect(a.log.exercises[0].target).toEqual({ reps: 5, loadKg: 17 })
  })
})

describe('minuteurs', () => {
  it('arme un repos à l’entrée d’une étape de repos', () => {
    const a = startSession(P, 'push', T0)
    const rest = enterStep(a, 2, T0)
    expect(rest.timer).toEqual({ kind: 'rest', startedAt: T0, endsAt: T0 + 120_000 })
  })

  it('lance le chrono tout de suite après un repos, et une préparation sinon', () => {
    const a = startSession(P, 'push', T0)
    const bateau = a.steps.findIndex((s) => s.kind === 'exercise' && a.log.exercises[s.ex].exerciseId === 'bateau')
    expect(a.steps[bateau - 1].kind).toBe('rest')
    expect(enterStep(a, bateau, T0).timer).toEqual({ kind: 'work', startedAt: T0, endsAt: T0 + 40_000 })

    const eq = startSession(P, 'epaules', T0)
    const firstHold = enterStep(eq, 1, T0) // première série d'équilibre, juste après l'échauffement
    expect(firstHold.timer).toEqual({ kind: 'prep', startedAt: T0, endsAt: T0 + PREP_SECONDS * 1000 })
    expect(startWork(firstHold, T0 + 5000).timer).toEqual({ kind: 'work', startedAt: T0 + 5000, endsAt: T0 + 35_000 })
  })

  it('n’arme rien pour un exercice en répétitions', () => {
    const a = enterStep(startSession(P, 'push', T0), 1, T0)
    expect(a.timer).toBeNull()
  })

  it('ajuste le repos sans jamais repasser dans le passé', () => {
    const a = enterStep(startSession(P, 'push', T0), 2, T0)
    expect(adjustRest(a, 10, T0).timer?.endsAt).toBe(T0 + 130_000)
    expect(adjustRest(a, -500, T0 + 1000).timer?.endsAt).toBe(T0 + 1000)
  })
})

describe('enregistrement', () => {
  it('note le résultat de la série et passe au repos suivant', () => {
    let a = next(startSession(P, 'push', T0), T0)
    a = recordAndNext(a, { value: 18 }, T0 + 1)
    expect(a.log.exercises[0].results[0]).toEqual({ value: 18 })
    expect(a.steps[a.index].kind).toBe('rest')
    expect(a.log.updatedAt).toBe(T0 + 1)
  })

  it('remplace une note de tour au lieu de la dupliquer', () => {
    let a = startSession(P, 'push', T0)
    a = rateRound(a, 'push', 0, 3, T0)
    a = rateRound(a, 'push', 0, 4, T0)
    expect(a.log.ratings).toEqual([{ circuitId: 'push', round: 0, rating: 4 }])
    expect(ratingOf(a.log, 'push', 0)).toBe(4)
  })

  it('coche et décoche les exercices d’échauffement', () => {
    let a = startSession(P, 'push', T0)
    a = toggleWarmupItem(a, 'squats', T0)
    expect(a.log.warmupDone).toEqual(['squats'])
    a = toggleWarmupItem(a, 'squats', T0)
    expect(a.log.warmupDone).toEqual([])
  })

  it('compte la progression et annonce l’exercice suivant', () => {
    const a = startSession(P, 'push', T0)
    expect(progress(a)).toEqual({ done: 0, total: 26 })
    expect(upcomingExercise(a)).toMatchObject({ ex: 0, set: 0 })
    const fin = goToFinish(a, T0)
    expect(fin.steps[fin.index].kind).toBe('finish')
    expect(progress(fin).done).toBe(26)
  })

  it('termine le journal avec la date de fin et le commentaire nettoyé', () => {
    const log = finishLog(startSession(P, 'push', T0), '  Bonne séance  ', T0 + 3_600_000)
    expect(log).toMatchObject({ endedAt: T0 + 3_600_000, comment: 'Bonne séance' })
  })
})

describe('suggestedValue', () => {
  const a = startSession(P, 'push', T0)
  const diamant = a.log.exercises[1]

  it('propose l’objectif sans historique', () => {
    expect(suggestedValue([], diamant, 0, T0)).toEqual({ value: 15 })
  })

  it('reprend la perf de la dernière fois au même tour', () => {
    const past: WorkoutLog = {
      ...a.log,
      id: 'ancien',
      startedAt: T0 - 7 * 86_400_000,
      exercises: a.log.exercises.map((e) => (e.exerciseId === 'pompes-diamant' ? { ...e, results: [{ value: 14 }, { value: 13 }, null] } : e)),
    }
    expect(suggestedValue([past], diamant, 1, T0)).toEqual({ value: 13 })
    // Tour non fait la dernière fois : on reprend la dernière valeur connue.
    expect(suggestedValue([past], diamant, 2, T0)).toEqual({ value: 13 })
  })

  it('garde le lest prévu pour les tractions lestées', () => {
    const pull = startSession(P, 'pull-a', T0)
    expect(suggestedValue([], pull.log.exercises[0], 0, T0)).toEqual({ value: 5, loadKg: 17 })
  })
})
