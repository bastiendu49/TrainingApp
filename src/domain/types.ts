/**
 * Modèle du programme d'entraînement.
 * Les identifiants sont des chaînes lisibles (« pompes-diamant ») : l'historique y fera
 * référence, ils ne doivent donc plus changer une fois utilisés.
 */

/** Façon de mesurer un exercice. */
export type ExerciseKind =
  | 'reps' // répétitions
  | 'repsPerSide' // répétitions par côté
  | 'time' // durée tenue, avec chrono
  | 'max' // le plus de répétitions possible
  | 'failure' // jusqu'à l'échec

export interface Exercise {
  id: string
  name: string
  kind: ExerciseKind
  /** Illustration choisie sur la fiche ; absent ou « auto » : photo, sinon image libre, sinon pictogramme. */
  illustration?: 'auto' | 'free' | 'picto' | 'photo'
  /** Consignes saisies dans l'app (exercice créé par l'utilisateur). */
  instructions?: string
}

/** Objectif d'une série. `loadKg` > 0 = lesté, absent = poids du corps. */
export interface Target {
  reps?: number
  seconds?: number
  loadKg?: number
}

export interface CircuitItem {
  exerciseId: string
  target: Target
}

/** Exercices enchaînés, répétés `rounds` fois. Repos en secondes (0 possible). */
export interface Circuit {
  id: string
  name: string
  rounds: number
  restBetweenExercises: number
  restBetweenRounds: number
  items: CircuitItem[]
}

export interface WarmupItem {
  id: string
  label: string
  detail: string
}

/** Échauffement en simple checklist, réutilisable par plusieurs séances. */
export interface Warmup {
  id: string
  name: string
  maxMinutes: number
  items: WarmupItem[]
}

/** Un niveau d'une échelle de technique : un exercice fait en `sets` séries. */
export interface SkillLevel {
  exerciseId: string
  /** Ce qu'il faut réussir pour valider le niveau. */
  criterion: string
  sets: number
  target: Target
  restSeconds: number
  optional?: boolean
}

/** Échelle de progression d'une technique (90°, muscle up…). */
export interface Skill {
  id: string
  name: string
  levels: SkillLevel[]
  /** Index du niveau travaillé actuellement dans `levels`. */
  currentLevel: number
  /** Changements de niveau (validation ou retour en arrière), avec leur date. */
  levelHistory?: { level: number; at: number }[]
}

export interface Session {
  id: string
  name: string
  warmupId: string
  skillId: string
  circuitIds: string[]
}

export interface Program {
  version: 1
  /** Dernière modification (ms) : la copie la plus récente gagne lors de la synchro. */
  updatedAt?: number
  exercises: Record<string, Exercise>
  warmups: Warmup[]
  skills: Skill[]
  circuits: Circuit[]
  /** Dans l'ordre de la semaine : la séance suivante est celle qui suit la dernière faite. */
  sessions: Session[]
}
