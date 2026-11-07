import { lastPerformance, type ExerciseLog, type SetResult, type WorkoutLog } from './log'
import type { Program } from './types'

/**
 * Déroulé d'une séance guidée : une suite d'écrans (« étapes ») calculée au démarrage,
 * puis un moteur pur (fonctions sans effet de bord) qui avance d'étape en étape.
 * Les minuteurs sont des horodatages absolus : l'app peut être mise en arrière-plan ou
 * rechargée, le temps restant reste juste.
 */

export type Step =
  | { kind: 'warmup' }
  /** `ex` = index dans log.exercises, `set` = série (technique) ou tour (circuit). */
  | { kind: 'exercise'; ex: number; set: number; title: string; position: string }
  /** Repos ; `rating` = le tour à noter pendant ce repos (fin de tour). */
  | { kind: 'rest'; seconds: number; label: string; rating?: { circuitId: string; round: number } }
  /** Notation d'un tour quand aucun repos ne suit (dernier tour d'un circuit). */
  | { kind: 'rating'; circuitId: string; round: number; label: string }
  | { kind: 'finish' }

/** Compte à rebours en cours : repos, préparation ou chrono d'un exercice en durée. */
export interface Timer {
  kind: 'rest' | 'prep' | 'work'
  startedAt: number
  endsAt: number
}

export interface ActiveSession {
  log: WorkoutLog
  steps: Step[]
  index: number
  timer: Timer | null
}

/** Préparation avant un exercice en durée qui ne suit pas un repos. */
export const PREP_SECONDS = 5

let counter = 0
const newId = () => `${Date.now().toString(36)}-${(counter++).toString(36)}-${Math.random().toString(36).slice(2, 6)}`

/** Construit la séance : journal vide + suite d'étapes. */
export function startSession(program: Program, sessionId: string, now: number): ActiveSession {
  const session = program.sessions.find((s) => s.id === sessionId)
  if (!session) throw new Error(`Séance inconnue : ${sessionId}`)

  const exercises: ExerciseLog[] = []
  const steps: Step[] = [{ kind: 'warmup' }]

  const skill = program.skills.find((s) => s.id === session.skillId)
  const level = skill?.levels[skill.currentLevel]
  if (skill && level) {
    exercises.push({
      key: 'skill',
      exerciseId: level.exerciseId,
      part: 'skill',
      skillId: skill.id,
      levelIndex: skill.currentLevel,
      target: { ...level.target },
      results: Array(level.sets).fill(null),
    })
    for (let s = 0; s < level.sets; s++) {
      steps.push({ kind: 'exercise', ex: 0, set: s, title: `Technique · ${skill.name}`, position: `Série ${s + 1}/${level.sets}` })
      if (s < level.sets - 1 && level.restSeconds > 0) steps.push({ kind: 'rest', seconds: level.restSeconds, label: 'Repos' })
    }
  }

  const circuits = session.circuitIds.map((id) => program.circuits.find((c) => c.id === id)).filter((c) => c !== undefined)
  if (level && circuits.length && level.restSeconds > 0) {
    steps.push({ kind: 'rest', seconds: level.restSeconds, label: 'Repos avant le circuit' })
  }

  circuits.forEach((c, ci) => {
    const first = exercises.length
    c.items.forEach((item, i) =>
      exercises.push({
        key: `${c.id}:${i}`,
        exerciseId: item.exerciseId,
        part: 'circuit',
        circuitId: c.id,
        target: { ...item.target },
        results: Array(c.rounds).fill(null),
      }),
    )
    for (let r = 0; r < c.rounds; r++) {
      c.items.forEach((_, i) => {
        steps.push({
          kind: 'exercise',
          ex: first + i,
          set: r,
          title: c.name,
          position: c.items.length > 1 ? `Tour ${r + 1}/${c.rounds} · exercice ${i + 1}/${c.items.length}` : `Tour ${r + 1}/${c.rounds}`,
        })
        const lastOfRound = i === c.items.length - 1
        if (!lastOfRound) {
          if (c.restBetweenExercises > 0) steps.push({ kind: 'rest', seconds: c.restBetweenExercises, label: 'Repos' })
        } else if (r < c.rounds - 1 && c.restBetweenRounds > 0) {
          steps.push({ kind: 'rest', seconds: c.restBetweenRounds, label: 'Repos entre les tours', rating: { circuitId: c.id, round: r } })
        } else {
          steps.push({ kind: 'rating', circuitId: c.id, round: r, label: `Tour ${r + 1}/${c.rounds} terminé` })
          if (r === c.rounds - 1 && ci < circuits.length - 1 && c.restBetweenRounds > 0) {
            steps.push({ kind: 'rest', seconds: c.restBetweenRounds, label: 'Repos avant la partie suivante' })
          }
        }
      })
    }
  })

  steps.push({ kind: 'finish' })

  const log: WorkoutLog = {
    id: newId(),
    sessionId: session.id,
    sessionName: session.name,
    startedAt: now,
    updatedAt: now,
    warmupId: session.warmupId,
    warmupDone: [],
    exercises,
    ratings: [],
    comment: '',
  }
  return enterStep({ log, steps, index: 0, timer: null }, 0, now)
}

/** Va à l'étape `index` et arme le minuteur qui lui correspond. */
export function enterStep(active: ActiveSession, index: number, now: number): ActiveSession {
  const i = Math.min(index, active.steps.length - 1)
  const step = active.steps[i]
  const previous = active.steps[i - 1]
  let timer: Timer | null = null
  if (step.kind === 'rest') {
    timer = { kind: 'rest', startedAt: now, endsAt: now + step.seconds * 1000 }
  } else if (step.kind === 'exercise' && isTimed(active, step)) {
    const seconds = active.log.exercises[step.ex].target.seconds ?? 0
    // Juste après un repos, le chrono part tout de suite ; sinon on laisse quelques secondes
    // pour se mettre en place.
    timer =
      previous?.kind === 'rest'
        ? { kind: 'work', startedAt: now, endsAt: now + seconds * 1000 }
        : { kind: 'prep', startedAt: now, endsAt: now + PREP_SECONDS * 1000 }
  }
  return { ...active, index: i, timer }
}

/** Un exercice en durée se reconnaît à son objectif en secondes. */
function isTimed(active: ActiveSession, step: Extract<Step, { kind: 'exercise' }>): boolean {
  return (active.log.exercises[step.ex].target.seconds ?? 0) > 0
}

export function next(active: ActiveSession, now: number): ActiveSession {
  return enterStep(active, active.index + 1, now)
}

/** Fin de la préparation : le chrono de l'exercice démarre. */
export function startWork(active: ActiveSession, now: number): ActiveSession {
  const step = active.steps[active.index]
  if (step.kind !== 'exercise') return active
  const seconds = active.log.exercises[step.ex].target.seconds ?? 0
  return { ...active, timer: { kind: 'work', startedAt: now, endsAt: now + seconds * 1000 } }
}

/** Enregistre le résultat de l'exercice en cours, puis passe à l'étape suivante. */
export function recordAndNext(active: ActiveSession, result: SetResult | null, now: number): ActiveSession {
  const step = active.steps[active.index]
  if (step.kind !== 'exercise') return next(active, now)
  const exercises = active.log.exercises.map((e, i) => {
    if (i !== step.ex) return e
    const results = [...e.results]
    results[step.set] = result
    return { ...e, results }
  })
  return next({ ...active, log: { ...active.log, exercises, updatedAt: now } }, now)
}

/** Note (1 à 5) un tour de circuit ; une nouvelle note remplace l'ancienne. */
export function rateRound(active: ActiveSession, circuitId: string, round: number, rating: number, now: number): ActiveSession {
  const ratings = active.log.ratings.filter((r) => !(r.circuitId === circuitId && r.round === round))
  ratings.push({ circuitId, round, rating })
  return { ...active, log: { ...active.log, ratings, updatedAt: now } }
}

export function ratingOf(log: WorkoutLog, circuitId: string, round: number): number | null {
  return log.ratings.find((r) => r.circuitId === circuitId && r.round === round)?.rating ?? null
}

/** Rallonge ou raccourcit le repos en cours (jamais sous « maintenant »). */
export function adjustRest(active: ActiveSession, deltaSeconds: number, now: number): ActiveSession {
  if (!active.timer || active.timer.kind !== 'rest') return active
  const endsAt = Math.max(now, active.timer.endsAt + deltaSeconds * 1000)
  return { ...active, timer: { ...active.timer, endsAt, startedAt: Math.min(active.timer.startedAt, endsAt - 1000) } }
}

export function toggleWarmupItem(active: ActiveSession, itemId: string, now: number): ActiveSession {
  const done = active.log.warmupDone.includes(itemId)
    ? active.log.warmupDone.filter((id) => id !== itemId)
    : [...active.log.warmupDone, itemId]
  return { ...active, log: { ...active.log, warmupDone: done, updatedAt: now } }
}

/** Saute directement au résumé de fin (séance écourtée). */
export function goToFinish(active: ActiveSession, now: number): ActiveSession {
  return enterStep(active, active.steps.length - 1, now)
}

/** Valeur proposée pour une série : la perf de la dernière fois au même rang, sinon l'objectif. */
export function suggestedValue(history: WorkoutLog[], exercise: ExerciseLog, set: number, before: number): SetResult {
  const last = lastPerformance(history, exercise.exerciseId, before)
  const fromLast = last ? (last.exercise.results[set] ?? [...last.exercise.results].reverse().find((r) => r !== null)) : null
  const value = fromLast?.value ?? exercise.target.reps ?? exercise.target.seconds ?? 10
  const loadKg = exercise.target.loadKg ?? fromLast?.loadKg
  return loadKg ? { value, loadKg } : { value }
}

/** Nombre d'exercices faits / prévus, pour la barre de progression. */
export function progress(active: ActiveSession): { done: number; total: number } {
  const exerciseSteps = active.steps.filter((s) => s.kind === 'exercise')
  const done = active.steps.slice(0, active.index).filter((s) => s.kind === 'exercise').length
  return { done, total: exerciseSteps.length }
}

/** Prochaine étape d'exercice après l'étape en cours (pour « Ensuite : … »). */
export function upcomingExercise(active: ActiveSession): Extract<Step, { kind: 'exercise' }> | null {
  for (let i = active.index + 1; i < active.steps.length; i++) {
    const s = active.steps[i]
    if (s.kind === 'exercise') return s
  }
  return null
}

/** Journal final : horodatage de fin ; les exercices jamais faits restent à null. */
export function finishLog(active: ActiveSession, comment: string, now: number): WorkoutLog {
  return { ...active.log, comment: comment.trim(), endedAt: now, updatedAt: now }
}
