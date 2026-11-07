import { useCallback, useMemo } from 'react'
import type { DataSet, Photo, Tombstone } from './backup'
import type { BodyEntry } from './body'
import type { WorkoutLog } from './log'
import { INITIAL_PROGRAM } from './program'
import { usePersisted } from './store'
import type { Program } from './types'

/**
 * Toutes les données conservées sur le téléphone (hors séance en cours), avec les opérations
 * qui gardent la synchro cohérente : horodatage des modifications, trace des suppressions.
 */
export function useAppData() {
  const [program, setProgram, s1] = usePersisted<Program>('program', INITIAL_PROGRAM)
  const [history, setHistory, s2] = usePersisted<WorkoutLog[]>('history', [])
  const [body, setBody, s3] = usePersisted<BodyEntry[]>('body', [])
  const [photos, setPhotos, s4] = usePersisted<Record<string, Photo>>('photos', {})
  const [tombstones, setTombstones, s5] = usePersisted<Tombstone[]>('tombstones', [])

  const stores = [s1, s2, s3, s4, s5]
  const loaded = stores.every((s) => s.loaded)
  const error = stores.find((s) => s.error)?.error ?? null

  const data: DataSet = useMemo(() => ({ program, history, body, photos, tombstones }), [program, history, body, photos, tombstones])

  /** Remplace tout (résultat d'une fusion avec la copie en ligne ou d'un import). */
  const replace = useCallback(
    (d: DataSet) => {
      setProgram(d.program)
      setHistory(d.history)
      setBody(d.body)
      setPhotos(d.photos)
      setTombstones(d.tombstones)
    },
    [setProgram, setHistory, setBody, setPhotos, setTombstones],
  )

  /** Modifie le programme en notant l'heure de la modification. */
  const updateProgram = useCallback((fn: (p: Program) => Program) => setProgram((p) => ({ ...fn(p), updatedAt: Date.now() })), [setProgram])

  /** Ajoute ou remplace une séance. */
  const saveLog = useCallback((log: WorkoutLog) => setHistory((h) => [...h.filter((l) => l.id !== log.id), { ...log, updatedAt: Date.now() }]), [setHistory])

  const deleteLog = useCallback(
    (id: string) => {
      setHistory((h) => h.filter((l) => l.id !== id))
      setTombstones((t) => [...t.filter((x) => !(x.kind === 'history' && x.id === id)), { kind: 'history', id, deletedAt: Date.now() }])
    },
    [setHistory, setTombstones],
  )

  const saveBody = useCallback((entry: BodyEntry) => setBody((b) => [...b.filter((e) => e.id !== entry.id), { ...entry, updatedAt: Date.now() }]), [setBody])

  const deleteBody = useCallback(
    (id: string) => {
      setBody((b) => b.filter((e) => e.id !== id))
      setTombstones((t) => [...t.filter((x) => !(x.kind === 'body' && x.id === id)), { kind: 'body', id, deletedAt: Date.now() }])
    },
    [setBody, setTombstones],
  )

  const setPhoto = useCallback((exerciseId: string, dataUrl: string | undefined) => setPhotos((p) => ({ ...p, [exerciseId]: { dataUrl, updatedAt: Date.now() } })), [setPhotos])

  return { data, loaded, error, replace, updateProgram, saveLog, deleteLog, saveBody, deleteBody, setPhoto }
}

export type AppData = ReturnType<typeof useAppData>
