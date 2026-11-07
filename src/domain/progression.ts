import { formatResults, sortedHistory, type ExerciseLog, type WorkoutLog } from './log'
import type { Program, Target } from './types'

/**
 * Propositions de progression, calculées à partir de l'historique. Rien n'est appliqué
 * sans l'accord de l'utilisateur ; une proposition ignorée ne revient pas tant que
 * l'objectif concerné ne change pas (sa clé contient la valeur actuelle).
 */
export type Suggestion =
  | { key: string; kind: 'target'; circuitId: string; itemIndex: number; exerciseId: string; from: Target; to: Target; evidence: string }
  | { key: string; kind: 'level'; skillId: string; fromLevel: number; toLevel: number; evidence: string }
  | { key: string; kind: 'load'; skillId: string; level: number; fromKg: number; toKg: number; evidence: string }

/** Combien de séances de suite l'objectif doit être atteint avant de proposer plus. */
export const STREAK = 2
/** Pas de progression proposé : +1 rep, +5 s, +2,5 kg. */
const NEXT_REPS = 1
const NEXT_SECONDS = 5
const NEXT_KG = 2.5

/** Tous les tours / séries faits et chacun au moins à l'objectif. */
function reached(e: ExerciseLog, target: Target, expectedSets: number): boolean {
  if (e.results.length < expectedSets) return false
  return e.results.every((r) => {
    if (!r) return false
    if (target.loadKg && (r.loadKg ?? 0) < target.loadKg) return false
    const goal = target.reps ?? target.seconds
    return goal !== undefined && r.value >= goal
  })
}

const unitOf = (e: ExerciseLog): 'reps' | 's' => ((e.target.seconds ?? 0) > 0 ? 's' : 'reps')

export function computeSuggestions(program: Program, history: WorkoutLog[]): Suggestion[] {
  const logs = sortedHistory(history)
  const out: Suggestion[] = []

  for (const circuit of program.circuits) {
    circuit.items.forEach((item, itemIndex) => {
      const kind = program.exercises[item.exerciseId]?.kind
      if (kind !== 'reps' && kind !== 'repsPerSide' && kind !== 'time') return
      const recent = logs
        .map((l) => l.exercises.find((e) => e.circuitId === circuit.id && e.exerciseId === item.exerciseId))
        .filter((e) => e !== undefined)
        .slice(0, STREAK)
      if (recent.length < STREAK || !recent.every((e) => reached(e, item.target, circuit.rounds))) return
      const to: Target = kind === 'time' ? { ...item.target, seconds: (item.target.seconds ?? 0) + NEXT_SECONDS } : { ...item.target, reps: (item.target.reps ?? 0) + NEXT_REPS }
      out.push({
        key: `target:${circuit.id}:${item.exerciseId}:${item.target.reps ?? item.target.seconds}`,
        kind: 'target',
        circuitId: circuit.id,
        itemIndex,
        exerciseId: item.exerciseId,
        from: item.target,
        to,
        evidence: `${formatResults(recent[0].results, unitOf(recent[0]))} sur tes ${STREAK} dernières séances`,
      })
    })
  }

  for (const skill of program.skills) {
    const level = skill.levels[skill.currentLevel]
    if (!level) continue
    const atLevel = logs
      .map((l) => l.exercises.find((e) => e.part === 'skill' && e.skillId === skill.id && e.levelIndex === skill.currentLevel))
      .filter((e) => e !== undefined)

    if (level.target.loadKg) {
      // Lest : une séance à l'objectif suffit (« dès que j'atteins 4 × 5, j'augmente »).
      const last = atLevel[0]
      if (last && reached(last, level.target, level.sets)) {
        out.push({
          key: `load:${skill.id}:${skill.currentLevel}:${level.target.loadKg}`,
          kind: 'load',
          skillId: skill.id,
          level: skill.currentLevel,
          fromKg: level.target.loadKg,
          toKg: level.target.loadKg + NEXT_KG,
          evidence: `${formatResults(last.results)} à ta dernière séance`,
        })
      }
      continue
    }

    const recent = atLevel.slice(0, STREAK)
    if (skill.currentLevel < skill.levels.length - 1 && recent.length === STREAK && recent.every((e) => reached(e, level.target, level.sets))) {
      out.push({
        key: `level:${skill.id}:${skill.currentLevel}`,
        kind: 'level',
        skillId: skill.id,
        fromLevel: skill.currentLevel,
        toLevel: skill.currentLevel + 1,
        evidence: `objectif atteint sur tes ${STREAK} dernières séances (${formatResults(recent[0].results, unitOf(recent[0]))})`,
      })
    }
  }
  return out
}

/** Change le niveau travaillé d'une technique et garde la date du changement. */
export function setSkillLevel(program: Program, skillId: string, level: number, now: number): Program {
  return {
    ...program,
    skills: program.skills.map((s) => {
      if (s.id !== skillId || level < 0 || level >= s.levels.length) return s
      return { ...s, currentLevel: level, levelHistory: [...(s.levelHistory ?? []), { level, at: now }] }
    }),
  }
}

/** Applique une proposition au programme (`toKg` permet de choisir un autre palier de lest). */
export function applySuggestion(program: Program, s: Suggestion, now: number, toKg?: number): Program {
  switch (s.kind) {
    case 'target':
      return {
        ...program,
        circuits: program.circuits.map((c) =>
          c.id === s.circuitId ? { ...c, items: c.items.map((it, i) => (i === s.itemIndex ? { ...it, target: s.to } : it)) } : c,
        ),
      }
    case 'level':
      return setSkillLevel(program, s.skillId, s.toLevel, now)
    case 'load':
      return {
        ...program,
        skills: program.skills.map((sk) =>
          sk.id === s.skillId
            ? { ...sk, levels: sk.levels.map((l, i) => (i === s.level ? { ...l, target: { ...l.target, loadKg: toKg ?? s.toKg } } : l)) }
            : sk,
        ),
      }
  }
}
