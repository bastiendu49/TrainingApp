import { sortedHistory, type ExerciseLog, type SetResult, type WorkoutLog } from './log'

/** Meilleure série : la plus lestée, puis le plus de reps (ou de secondes). */
export function bestSet(results: (SetResult | null)[]): SetResult | null {
  let best: SetResult | null = null
  for (const r of results) {
    if (!r) continue
    if (!best || (r.loadKg ?? 0) > (best.loadKg ?? 0) || ((r.loadKg ?? 0) === (best.loadKg ?? 0) && r.value > best.value)) best = r
  }
  return best
}

export interface ExerciseSession {
  log: WorkoutLog
  exercise: ExerciseLog
  best: SetResult
}

/** Toutes les séances où l'exercice a été fait, de la plus ancienne à la plus récente. */
export function exerciseSessions(history: WorkoutLog[], exerciseId: string): ExerciseSession[] {
  const out: ExerciseSession[] = []
  for (const log of sortedHistory(history).reverse()) {
    for (const exercise of log.exercises) {
      if (exercise.exerciseId !== exerciseId) continue
      const best = bestSet(exercise.results)
      if (best) out.push({ log, exercise, best })
    }
  }
  return out
}

/** Record de l'exercice (meilleure série jamais faite) et sa date. */
export function personalRecord(history: WorkoutLog[], exerciseId: string): ExerciseSession | null {
  let record: ExerciseSession | null = null
  for (const s of exerciseSessions(history, exerciseId)) {
    if (!record || bestSet([record.best, s.best]) === s.best) record = s
  }
  return record
}

/**
 * Points de la courbe : une valeur par séance. Pour un exercice lesté, c'est le lest qui
 * progresse (les reps restent autour de 5) : on trace le lest ; sinon les reps ou secondes.
 */
export function progressPoints(history: WorkoutLog[], exerciseId: string): { x: number; y: number }[] {
  const sessions = exerciseSessions(history, exerciseId)
  const loaded = sessions.some((s) => (s.best.loadKg ?? 0) > 0)
  return sessions.map((s) => ({ x: s.log.startedAt, y: loaded ? (s.best.loadKg ?? 0) : s.best.value }))
}

/** Exercices déjà faits au moins une fois, du plus souvent fait au moins souvent. */
export function practicedExercises(history: WorkoutLog[]): { exerciseId: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const log of history)
    for (const e of log.exercises) if (e.results.some((r) => r)) counts.set(e.exerciseId, (counts.get(e.exerciseId) ?? 0) + 1)
  return [...counts].map(([exerciseId, count]) => ({ exerciseId, count })).sort((a, b) => b.count - a.count || a.exerciseId.localeCompare(b.exerciseId))
}

/** Nombre de séries faites dans une séance. */
export const setsDone = (log: WorkoutLog) => log.exercises.reduce((n, e) => n + e.results.filter((r) => r).length, 0)
