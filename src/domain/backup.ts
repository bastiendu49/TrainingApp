import type { BodyEntry } from './body'
import type { WorkoutLog } from './log'
import type { Program } from './types'

/**
 * Sauvegarde : tout ce qui doit survivre à un changement de téléphone (pas la séance en cours).
 * La même structure sert à la synchro en ligne et à l'export en fichier.
 */

/** Photo ajoutée par l'utilisateur pour un exercice ; `dataUrl` absent = photo supprimée. */
export interface Photo {
  dataUrl?: string
  updatedAt: number
}

/** Trace d'une suppression, pour qu'une copie plus ancienne ne fasse pas réapparaître l'élément. */
export interface Tombstone {
  kind: 'history' | 'body'
  id: string
  deletedAt: number
}

export interface DataSet {
  program: Program
  history: WorkoutLog[]
  body: BodyEntry[]
  photos: Record<string, Photo>
  tombstones: Tombstone[]
}

export interface Backup extends DataSet {
  app: 'training-app'
  version: 1
  savedAt: number
}

export function toBackup(data: DataSet, now: number): Backup {
  return { app: 'training-app', version: 1, savedAt: now, ...normalize(data) }
}

/** Lit une sauvegarde (fichier importé ou copie en ligne) ; null si ce n'en est pas une. */
export function parseBackup(value: unknown): DataSet | null {
  if (!value || typeof value !== 'object') return null
  const b = value as Partial<Backup>
  if (b.app !== 'training-app' || b.version !== 1) return null
  if (!b.program || !Array.isArray(b.program.sessions) || !Array.isArray(b.history)) return null
  return normalize({
    program: b.program,
    history: b.history,
    body: Array.isArray(b.body) ? b.body : [],
    photos: b.photos && typeof b.photos === 'object' ? b.photos : {},
    tombstones: Array.isArray(b.tombstones) ? b.tombstones : [],
  })
}

/** Ordre stable : deux copies identiques donnent le même JSON. */
function normalize(d: DataSet): DataSet {
  return {
    program: d.program,
    history: [...d.history].sort((a, b) => a.startedAt - b.startedAt || a.id.localeCompare(b.id)),
    body: [...d.body].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)),
    photos: Object.fromEntries(Object.entries(d.photos).sort(([a], [b]) => a.localeCompare(b))),
    tombstones: [...d.tombstones].sort((a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id)),
  }
}

/** Empreinte pour savoir si deux jeux de données sont identiques. */
export function fingerprint(d: DataSet): string {
  return JSON.stringify(normalize(d))
}

function mergeById<T extends { id: string; updatedAt: number }>(a: T[], b: T[], dead: Map<string, number>): T[] {
  const byId = new Map<string, T>()
  for (const item of [...a, ...b]) {
    const current = byId.get(item.id)
    if (!current || item.updatedAt > current.updatedAt) byId.set(item.id, item)
  }
  return [...byId.values()].filter((item) => {
    const deletedAt = dead.get(item.id)
    return deletedAt === undefined || item.updatedAt > deletedAt
  })
}

/**
 * Fusionne deux copies (téléphone et en ligne) sans rien perdre :
 * séances et mesures réunies (la version la plus récente de chacune gagne), suppressions
 * respectées, programme le plus récemment modifié, photo la plus récente par exercice.
 */
export function mergeData(a: DataSet, b: DataSet): DataSet {
  const tombstones = new Map<string, Tombstone>()
  for (const t of [...a.tombstones, ...b.tombstones]) {
    const key = `${t.kind}:${t.id}`
    const current = tombstones.get(key)
    if (!current || t.deletedAt > current.deletedAt) tombstones.set(key, t)
  }
  const dead = (kind: Tombstone['kind']) =>
    new Map([...tombstones.values()].filter((t) => t.kind === kind).map((t) => [t.id, t.deletedAt] as const))

  const photos: Record<string, Photo> = { ...a.photos }
  for (const [key, photo] of Object.entries(b.photos)) {
    if (!photos[key] || photo.updatedAt > photos[key].updatedAt) photos[key] = photo
  }

  return normalize({
    program: (b.program.updatedAt ?? 0) > (a.program.updatedAt ?? 0) ? b.program : a.program,
    history: mergeById(a.history, b.history, dead('history')),
    body: mergeById(a.body, b.body, dead('body')),
    photos,
    tombstones: [...tombstones.values()],
  })
}
