import type { BodyEntry, BodyMetric } from './body'
import { averageRating, type SetResult, type WorkoutLog } from './log'
import { bestSet, exerciseSessions, setsDone } from './stats'

/** Début (inclus) et fin (exclue) d'un mois, en ms. `month` : 0 = janvier. */
export function monthRange(year: number, month: number): [number, number] {
  return [new Date(year, month, 1).getTime(), new Date(year, month + 1, 1).getTime()]
}

export interface ExerciseProgress {
  exerciseId: string
  /** Où il en était au début du mois : dernière séance avant le mois (ou première du mois). */
  start: SetResult
  /** Où il en est : dernière séance du mois. */
  now: SetResult
  /** Écart de la valeur suivie (lest si lesté, sinon reps / secondes). */
  delta: number
  loaded: boolean
}

export interface MonthlyReport {
  sessions: number
  sessionsPreviousMonth: number
  sets: number
  rating: number | null
  exercises: ExerciseProgress[]
  body: { metric: BodyMetric; start: number; now: number }[]
}

const metricValue = (r: SetResult, loaded: boolean) => (loaded ? (r.loadKg ?? 0) : r.value)

export function monthlyReport(history: WorkoutLog[], body: BodyEntry[], year: number, month: number): MonthlyReport {
  const [from, to] = monthRange(year, month)
  const [prevFrom] = monthRange(year, month - 1)
  const inMonth = history.filter((l) => l.startedAt >= from && l.startedAt < to)

  const ids = [...new Set(inMonth.flatMap((l) => l.exercises.filter((e) => e.results.some((r) => r)).map((e) => e.exerciseId)))]
  const exercises: ExerciseProgress[] = []
  for (const exerciseId of ids) {
    const sessions = exerciseSessions(history, exerciseId).filter((s) => s.log.startedAt < to)
    const during = sessions.filter((s) => s.log.startedAt >= from)
    const before = sessions.filter((s) => s.log.startedAt < from).at(-1)
    const startSession = before ?? during[0]
    const nowSession = during.at(-1)
    if (!startSession || !nowSession) continue
    const loaded = sessions.some((s) => (s.best.loadKg ?? 0) > 0)
    const start = bestSet(startSession.exercise.results)!
    const now = bestSet(nowSession.exercise.results)!
    exercises.push({ exerciseId, start, now, delta: metricValue(now, loaded) - metricValue(start, loaded), loaded })
  }
  exercises.sort((a, b) => b.delta - a.delta || a.exerciseId.localeCompare(b.exerciseId))

  const sortedBody = [...body].sort((a, b) => a.date.localeCompare(b.date))
  const monthKey = (ms: number) => {
    const d = new Date(ms)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  }
  const startKey = monthKey(from)
  const endKey = monthKey(to)
  const bodyRows: MonthlyReport['body'] = []
  for (const metric of ['weight', 'fat', 'waist', 'chest', 'arm', 'thigh', 'hips', 'calf'] as BodyMetric[]) {
    const withValue = sortedBody.filter((e) => e[metric] !== undefined && e.date < endKey)
    const during = withValue.filter((e) => e.date >= startKey)
    const start = withValue.filter((e) => e.date < startKey).at(-1) ?? during[0]
    const now = during.at(-1)
    if (start && now) bodyRows.push({ metric, start: start[metric]!, now: now[metric]! })
  }

  return {
    sessions: inMonth.length,
    sessionsPreviousMonth: history.filter((l) => l.startedAt >= prevFrom && l.startedAt < from).length,
    sets: inMonth.reduce((n, l) => n + setsDone(l), 0),
    rating: averageRating(inMonth.flatMap((l) => l.ratings.map((r) => r.rating))),
    exercises,
    body: bodyRows,
  }
}

/** Jours du mois en grille (lundi en premier), null pour les cases vides. */
export function calendarGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7
  const days = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = Array(offset).fill(null)
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7) cells.push(null)
  return cells
}
