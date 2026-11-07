import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fingerprint, mergeData, parseBackup, toBackup, type DataSet } from '../domain/backup'

const ENDPOINT = '/.netlify/functions/sync'

export type SyncStatus = { state: 'off' | 'syncing' | 'ok' | 'error'; message?: string }

async function call(code: string, init?: RequestInit): Promise<unknown> {
  let res: Response
  try {
    res = await fetch(ENDPOINT, { ...init, cache: 'no-store', headers: { ...init?.headers, 'x-sync-code': code } })
  } catch {
    throw new Error('Pas de connexion : la sauvegarde se fera au retour du réseau.')
  }
  if (res.status === 401) throw new Error('Code secret incorrect.')
  if (res.status === 404) throw new Error('Sauvegarde en ligne indisponible sur cette adresse.')
  const body = (await res.json().catch(() => null)) as { error?: string; backup?: unknown } | null
  if (!res.ok) throw new Error(body?.error ?? `Erreur du serveur (${res.status}).`)
  return body
}

/** Vérifie un code auprès du serveur (pour l'écran de réglages). */
export async function checkCode(code: string): Promise<void> {
  await call(code)
}

/**
 * Synchro automatique : au démarrage, au retour du réseau et 4 s après chaque modification.
 * Une synchro = lire la copie en ligne, fusionner avec le téléphone, renvoyer si besoin.
 * Peu d'appels : rien n'est envoyé si les deux copies sont déjà identiques.
 */
export function useSync(loaded: boolean, data: DataSet, replace: (d: DataSet) => void, code: string | undefined, onSynced: (at: number) => void) {
  const [status, setStatus] = useState<SyncStatus>({ state: code ? 'ok' : 'off' })
  const dataRef = useRef(data)
  const lastSynced = useRef<string | null>(null)
  const running = useRef(false)

  useEffect(() => {
    dataRef.current = data
  }, [data])

  const sync = useCallback(async () => {
    if (!code || running.current) return
    running.current = true
    setStatus({ state: 'syncing' })
    try {
      const body = (await call(code)) as { backup?: unknown }
      const remote = body.backup ? parseBackup(body.backup) : null
      // Fusion avec l'état le plus récent du téléphone (il a pu changer pendant l'appel).
      const local = dataRef.current
      const merged = remote ? mergeData(local, remote) : local
      const mergedPrint = fingerprint(merged)
      if (mergedPrint !== fingerprint(local)) replace(merged)
      if (!remote || fingerprint(remote) !== mergedPrint) {
        await call(code, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(toBackup(merged, Date.now())) })
      }
      lastSynced.current = mergedPrint
      setStatus({ state: 'ok' })
      onSynced(Date.now())
    } catch (e) {
      setStatus({ state: 'error', message: e instanceof Error ? e.message : String(e) })
    } finally {
      running.current = false
    }
  }, [code, replace, onSynced])

  useEffect(() => {
    if (!code) {
      lastSynced.current = null
      return
    }
    if (!loaded) return
    const t = setTimeout(() => void sync(), 0)
    return () => clearTimeout(t)
  }, [loaded, code, sync])

  const print = useMemo(() => fingerprint(data), [data])
  useEffect(() => {
    if (!loaded || !code || print === lastSynced.current) return
    // Revérifie au moment de partir : une synchro lancée entre-temps a pu tout envoyer.
    const t = setTimeout(() => {
      if (fingerprint(dataRef.current) !== lastSynced.current) void sync()
    }, 4000)
    return () => clearTimeout(t)
  }, [print, loaded, code, sync])

  useEffect(() => {
    const onOnline = () => void sync()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [sync])

  return { status: code ? status : ({ state: 'off' } as SyncStatus), sync }
}
