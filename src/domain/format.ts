import type { ExerciseKind, Target } from './types'

/** Objectif lisible : « 15 reps », « 12 / côté », « 40 s », « max », « 5 reps · +17 kg ». */
export function formatTarget(kind: ExerciseKind, target: Target): string {
  let base: string
  switch (kind) {
    case 'reps':
      base = `${target.reps ?? '?'} reps`
      break
    case 'repsPerSide':
      base = `${target.reps ?? '?'} / côté`
      break
    case 'time':
      base = formatDuration(target.seconds ?? 0)
      break
    case 'max':
      base = 'max'
      break
    case 'failure':
      base = 'jusqu’à l’échec'
      break
  }
  return target.loadKg ? `${base} · +${target.loadKg} kg` : base
}

/** Durée courte : 40 → « 40 s », 120 → « 2 min », 90 → « 1 min 30 », 0 → « aucun ». */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return 'aucun'
  if (seconds < 60) return `${seconds} s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s ? `${m} min ${String(s).padStart(2, '0')}` : `${m} min`
}
