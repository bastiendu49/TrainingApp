import { describe, expect, it } from 'vitest'
import { fingerprint, mergeData, parseBackup, toBackup, type DataSet } from './backup'
import type { WorkoutLog } from './log'
import { INITIAL_PROGRAM } from './program'

const log = (id: string, updatedAt: number, comment = ''): WorkoutLog => ({
  id,
  sessionId: 'push',
  sessionName: 'Push',
  startedAt: updatedAt,
  updatedAt,
  warmupDone: [],
  exercises: [],
  ratings: [],
  comment,
})

const empty: DataSet = { program: INITIAL_PROGRAM, history: [], body: [], photos: {}, tombstones: [] }

describe('mergeData', () => {
  it('réunit les séances des deux copies', () => {
    const merged = mergeData({ ...empty, history: [log('a', 1)] }, { ...empty, history: [log('b', 2)] })
    expect(merged.history.map((l) => l.id)).toEqual(['a', 'b'])
  })

  it('garde la version la plus récente d’une séance modifiée', () => {
    const merged = mergeData({ ...empty, history: [log('a', 1, 'ancien')] }, { ...empty, history: [{ ...log('a', 1), updatedAt: 5, comment: 'corrigé' }] })
    expect(merged.history).toHaveLength(1)
    expect(merged.history[0].comment).toBe('corrigé')
  })

  it('ne fait pas réapparaître une séance supprimée', () => {
    const phone = { ...empty, tombstones: [{ kind: 'history' as const, id: 'a', deletedAt: 10 }] }
    const cloud = { ...empty, history: [log('a', 1)] }
    expect(mergeData(phone, cloud).history).toEqual([])
    expect(mergeData(cloud, phone).history).toEqual([])
    expect(mergeData(phone, cloud).tombstones).toHaveLength(1)
  })

  it('garde une séance modifiée après sa suppression ailleurs', () => {
    const phone = { ...empty, tombstones: [{ kind: 'history' as const, id: 'a', deletedAt: 10 }] }
    const cloud = { ...empty, history: [log('a', 20)] }
    expect(mergeData(phone, cloud).history.map((l) => l.id)).toEqual(['a'])
  })

  it('prend le programme modifié le plus récemment', () => {
    const newer = { ...INITIAL_PROGRAM, updatedAt: 50, sessions: INITIAL_PROGRAM.sessions.slice(0, 2) }
    expect(mergeData(empty, { ...empty, program: newer }).program.sessions).toHaveLength(2)
    expect(mergeData({ ...empty, program: newer }, empty).program.sessions).toHaveLength(2)
  })

  it('réunit les mesures et garde la photo la plus récente', () => {
    const merged = mergeData(
      { ...empty, body: [{ id: 'm1', date: '2026-11-01', updatedAt: 1, weight: 80 }], photos: { bateau: { dataUrl: 'old', updatedAt: 1 } } },
      { ...empty, body: [{ id: 'm2', date: '2026-11-08', updatedAt: 2, weight: 79 }], photos: { bateau: { updatedAt: 3 } } },
    )
    expect(merged.body.map((b) => b.weight)).toEqual([80, 79])
    expect(merged.photos.bateau).toEqual({ updatedAt: 3 })
  })

  it('donne le même résultat dans les deux sens', () => {
    const a = { ...empty, history: [log('a', 1), log('c', 3)] }
    const b = { ...empty, history: [log('b', 2), { ...log('c', 3), updatedAt: 9 }] }
    expect(fingerprint(mergeData(a, b))).toBe(fingerprint(mergeData(b, a)))
  })
})

describe('parseBackup', () => {
  it('relit une sauvegarde exportée', () => {
    const data = { ...empty, history: [log('a', 1)] }
    const parsed = parseBackup(JSON.parse(JSON.stringify(toBackup(data, 99))))
    expect(parsed && fingerprint(parsed)).toBe(fingerprint(data))
  })

  it('refuse un fichier qui n’est pas une sauvegarde de l’app', () => {
    expect(parseBackup(null)).toBeNull()
    expect(parseBackup({ app: 'mes-repas', version: 1 })).toBeNull()
    expect(parseBackup({ app: 'training-app', version: 1, history: [] })).toBeNull()
  })

  it('complète les parties absentes d’une sauvegarde plus ancienne', () => {
    const parsed = parseBackup({ app: 'training-app', version: 1, program: INITIAL_PROGRAM, history: [] })
    expect(parsed).toMatchObject({ body: [], photos: {}, tombstones: [] })
  })
})
