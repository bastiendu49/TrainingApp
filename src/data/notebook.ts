import type { ExerciseLog, SetResult, WorkoutLog } from '../domain/log'
import type { Program } from '../domain/types'

/**
 * Historique noté au crayon dans le livre, avant l'app. Chaque ligne = une séance,
 * de la plus ancienne à la plus récente ; « 15/15/12 » = les tours (ou séries) successifs.
 * Les dates ne sont pas connues : la séance la plus récente de chaque type est placée la
 * semaine du 2 novembre 2026, les précédentes une semaine plus tôt à chaque fois.
 * Dates et identifiants fixes : importer deux fois (deux appareils) ne crée pas de doublon.
 */

type Entry = { exerciseId: string; lines: string[]; loadKg?: (number | undefined)[] }
type Skill = { exerciseId: string; levelIndex: number; line: string; loadKg?: number }

interface NotebookSession {
  sessionId: string
  /** Jour de la séance la plus récente (novembre 2026). */
  lastDay: number
  circuit: Record<string, Entry[]>
  /** Technique, de la plus ancienne à la plus récente. */
  skill: { skillId: string; entries: Skill[] }
}

const rep = (n: number, line: string) => Array(n).fill(line)

const NOTEBOOK: NotebookSession[] = [
  {
    sessionId: 'push',
    lastDay: 2,
    circuit: {
      push: [
        { exerciseId: 'pompes-diamant', lines: ['15/15', '15/15', '10/10/12', '13/13/13', '14/14/14', ...rep(4, '15/15/15')] },
        { exerciseId: 'pompes-archer', lines: ['6/6', '6/5', '5/5/6', '7/7/7', '8/8/8', '9/9/9', '12/11/11', '12/12/12', '12/12/11'] },
        { exerciseId: 'extensions-triceps', lines: ['6/5', '6/6/7', '8/8/8', '9/9/9', ...rep(4, '10/10/10')] },
        { exerciseId: 'gainage-pieds-alternes', lines: ['10/10', ...rep(7, '10/10/10')] },
        { exerciseId: 'bateau', lines: ['40/40', ...rep(7, '40/40/40')] },
        { exerciseId: 'planche-inversee', lines: ['30/30', ...rep(8, '30/30/30')] },
      ],
    },
    skill: {
      skillId: '90',
      entries: [
        { exerciseId: 'souleves-pieds-alternes', levelIndex: 0, line: '10/10/10' },
        { exerciseId: 'souleves-pieds-alternes', levelIndex: 0, line: '20/20/20/20/20/20/20/20' },
        { exerciseId: '90-pompe', levelIndex: 1, line: '5/6/5/6/5/5/5/5' },
        { exerciseId: 'souleves-pieds-alternes', levelIndex: 0, line: '20/20/20/20/20/20/20/20' },
      ],
    },
  },
  {
    sessionId: 'pull-a',
    lastDay: 3,
    circuit: {
      'pull-a-force': [{ exerciseId: 'tractions-explosives', lines: ['6/5', '6/6', '6/6/5', '6/6/6', '6/6/6'] }],
      'pull-a-endurance': [
        { exerciseId: 'muscle-ups-negatifs', lines: ['4/3', '3/3/3', '4/4/3', '4/3', ...rep(5, '4/3/3')] },
        { exerciseId: 'dips-droit', lines: ['10/10', '10/10/10', '12/12', '12/12/12', '13/13/13', '14/14/14', ...rep(3, '15/15/15')] },
        { exerciseId: 'tractions-supination', lines: ['5/4', '4/4/4', '5/5', '5/5/4', '5/5/4', '5/5/4', '5/5/5', '5/5/5', '6/6/5'] },
        { exerciseId: 'tractions-pronation', lines: ['5/4', '4/4/4', '5/4', '5/4/3', '5/4/3', '5/5/4', '5/5/4', '5/5/5', '6/5/4'] },
        { exerciseId: 'tractions-australiennes', lines: ['20/20', '15/15/15', '20/18', '16/16/16', '17/17/17', '18/18/18', ...rep(3, '20/20/20')] },
        { exerciseId: 'montees-jambes-explosives', lines: ['5/5', '4/4/4', '6/5', '6/6/6', '7/7/6', '8/8/8', '10/9/8', '10/10/6', '10/10/8'] },
      ],
    },
    skill: {
      skillId: 'muscle-up',
      entries: [
        ...['5/4/4/3', '5/5/4/4', '5/5/5/3', '5/5/5/4', '5/5/5/5'].map((line) => ({ exerciseId: 'tractions-lestees', levelIndex: 0, line, loadKg: 13 })),
        ...['4/4/4/3', '5/4/4/3', '5/5/4/4', '5/5/5/4'].map((line) => ({ exerciseId: 'tractions-lestees', levelIndex: 0, line, loadKg: 17 })),
      ],
    },
  },
  {
    sessionId: 'jambes',
    lastDay: 5,
    circuit: {
      jambes: [
        { exerciseId: 'fentes-cosaques', lines: ['12/12/10', '12/12/12'] },
        { exerciseId: 'fentes-alternees', lines: ['10/10/10', '10/10/10'] },
        { exerciseId: 'chaise', lines: ['45/45/45', '45/45/45'] },
        { exerciseId: 'montee-mollets', lines: ['20/20/20', '20/20/20'] },
      ],
    },
    skill: { skillId: 'back-lever', entries: [{ exerciseId: 'skin-the-cat', levelIndex: 0, line: '3/3/3/3/3/3' }] },
  },
  {
    sessionId: 'epaules',
    lastDay: 6,
    circuit: {
      epaules: [
        { exerciseId: 'pompes-piquees', lines: ['6/6/6', '8/8/8', '9/9/9', '10/10/10', '11/11', '12/12/12', '12/12/12'] },
        { exerciseId: 'pseudo-pompes', lines: ['7/7/7', '8/8/8', '10/10/10', '11/11/11', '12/12', '11/12/12', '12/12/12'] },
        { exerciseId: 'gainage-reach-up', lines: ['8/8', '12/12/12', '12/12/12'] },
        { exerciseId: 'epaule-a-epaule', lines: [...rep(4, '20/20/20'), '20/20', '20/20/20', '20/20/20'] },
        { exerciseId: 'planche-inversee', lines: [...rep(4, '30/30/30'), '30/30', '30/30/30', '30/30/30'] },
      ],
    },
    skill: { skillId: 'equilibre', entries: [{ exerciseId: 'equilibre', levelIndex: 0, line: '30/13/20/30/30/28' }] },
  },
]

/** Les séances du carnet sont réputées modifiées à cette date (fixe, avant toute utilisation de l'app). */
const NOTEBOOK_UPDATED_AT = new Date(2026, 10, 7, 12, 0).getTime()

const parse = (line: string, loadKg?: number): SetResult[] =>
  line.split('/').map((v) => (loadKg ? { value: Number(v), loadKg } : { value: Number(v) }))

/** Identifiant des séances du carnet : « carnet-<séance>-<n> », n = 1 pour la plus ancienne. */
export const isNotebookLog = (id: string) => id.startsWith('carnet-')

export function buildNotebookHistory(program: Program): WorkoutLog[] {
  const logs: WorkoutLog[] = []
  for (const nb of NOTEBOOK) {
    const session = program.sessions.find((s) => s.id === nb.sessionId)
    if (!session) continue
    const entries = Object.values(nb.circuit).flat()
    const count = Math.max(nb.skill.entries.length, ...entries.map((e) => e.lines.length))

    for (let k = 0; k < count; k++) {
      // k = 0 : la plus récente.
      const startedAt = new Date(2026, 10, nb.lastDay - 7 * k, 18, 0).getTime()
      const exercises: ExerciseLog[] = []

      const skillEntry = nb.skill.entries[nb.skill.entries.length - 1 - k]
      if (skillEntry) {
        const skill = program.skills.find((s) => s.id === nb.skill.skillId)
        const level = skill?.levels[skillEntry.levelIndex]
        exercises.push({
          key: 'skill',
          exerciseId: skillEntry.exerciseId,
          part: 'skill',
          skillId: nb.skill.skillId,
          levelIndex: skillEntry.levelIndex,
          target: level ? { ...level.target } : {},
          results: parse(skillEntry.line, skillEntry.loadKg),
        })
      }

      for (const [circuitId, circuitEntries] of Object.entries(nb.circuit)) {
        const circuit = program.circuits.find((c) => c.id === circuitId)
        circuitEntries.forEach((entry, i) => {
          const line = entry.lines[entry.lines.length - 1 - k]
          if (!line) return
          const item = circuit?.items.find((it) => it.exerciseId === entry.exerciseId)
          exercises.push({
            key: `${circuitId}:${i}`,
            exerciseId: entry.exerciseId,
            part: 'circuit',
            circuitId,
            target: item ? { ...item.target } : {},
            results: parse(line),
          })
        })
      }

      logs.push({
        id: `carnet-${nb.sessionId}-${count - k}`,
        sessionId: session.id,
        sessionName: session.name,
        startedAt,
        updatedAt: NOTEBOOK_UPDATED_AT,
        warmupDone: [],
        exercises,
        ratings: [],
        comment: 'Repris du carnet (date approximative).',
      })
    }
  }
  return logs
}
