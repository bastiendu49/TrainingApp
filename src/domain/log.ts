import type { Target } from './types'

/** Résultat d'une série : reps ou secondes selon l'exercice, et le lest éventuel. */
export interface SetResult {
  value: number
  loadKg?: number
}

/** Un exercice tel que fait pendant une séance. */
export interface ExerciseLog {
  /** Unique dans la séance : « skill » ou « <circuitId>:<position> ». */
  key: string
  exerciseId: string
  part: 'skill' | 'circuit'
  circuitId?: string
  skillId?: string
  levelIndex?: number
  /** Objectif au moment de la séance (le programme peut changer ensuite). */
  target: Target
  /** Index = série (technique) ou tour (circuit). null = pas fait. */
  results: (SetResult | null)[]
}

/** Difficulté ressentie (1 à 5) à la fin d'un tour de circuit. */
export interface RoundRating {
  circuitId: string
  round: number
  rating: number
}

export interface WorkoutLog {
  id: string
  sessionId: string
  sessionName: string
  /** Horodatages en millisecondes. */
  startedAt: number
  endedAt?: number
  /** Dernière modification : sert à fusionner les copies (synchro). */
  updatedAt: number
  warmupId?: string
  warmupDone: string[]
  exercises: ExerciseLog[]
  ratings: RoundRating[]
  comment: string
}

/** Séances terminées, de la plus récente à la plus ancienne. */
export function sortedHistory(history: WorkoutLog[]): WorkoutLog[] {
  return [...history].sort((a, b) => b.startedAt - a.startedAt)
}

export interface LastPerformance {
  log: WorkoutLog
  exercise: ExerciseLog
  /** Ressenti des tours correspondants (circuit), dans l'ordre des tours. */
  ratings: (number | null)[]
}

/** Dernière fois qu'un exercice a été fait (technique ou circuit), avant `before` si fourni. */
export function lastPerformance(history: WorkoutLog[], exerciseId: string, before = Infinity): LastPerformance | null {
  for (const log of sortedHistory(history)) {
    if (log.startedAt >= before) continue
    const exercise = log.exercises.find((e) => e.exerciseId === exerciseId && e.results.some((r) => r !== null))
    if (!exercise) continue
    const ratings = exercise.results.map((_, round) =>
      exercise.part === 'circuit'
        ? (log.ratings.find((r) => r.circuitId === exercise.circuitId && r.round === round)?.rating ?? null)
        : null,
    )
    return { log, exercise, ratings }
  }
  return null
}

/** « 15 · 15 · 12 » ; les séries non faites sont ignorées. Lest affiché une fois s'il est commun. */
export function formatResults(results: (SetResult | null)[], unit: 'reps' | 's' = 'reps'): string {
  const done = results.filter((r) => r !== null)
  if (!done.length) return '–'
  const values = done.map((r) => (unit === 's' ? `${r.value} s` : String(r.value))).join(' · ')
  const loads = new Set(done.map((r) => r.loadKg ?? 0))
  const load = loads.size === 1 ? [...loads][0] : 0
  return load ? `${values} (+${load} kg)` : values
}

/** Moyenne arrondie des ressentis notés, ou null. */
export function averageRating(ratings: (number | null)[]): number | null {
  const rated = ratings.filter((r) => r !== null)
  return rated.length ? Math.round(rated.reduce((a, b) => a + b, 0) / rated.length) : null
}
