import { get, set } from 'idb-keyval'
import { useEffect, useState } from 'react'

export type StoreState = { loaded: boolean; error: string | null }

/**
 * État React persisté dans IndexedDB (sur le téléphone) sous une clé. Charge une fois au
 * montage, réécrit à chaque changement. Même principe que meal-app.
 */
export function usePersisted<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial)
  const [state, setState] = useState<StoreState>({ loaded: false, error: null })

  useEffect(() => {
    let cancelled = false
    get<T>(key)
      .then((stored) => {
        if (cancelled) return
        if (stored !== undefined) setValue(stored)
        setState({ loaded: true, error: null })
      })
      .catch((e) => {
        if (cancelled) return
        // Sans ce drapeau on écraserait des données existantes par la valeur initiale.
        setState({ loaded: false, error: `Lecture impossible (${key}) : ${e}` })
      })
    return () => {
      cancelled = true
    }
  }, [key])

  useEffect(() => {
    if (!state.loaded) return
    // Une écriture qui échoue doit être visible : sinon la modification disparaît au
    // prochain lancement sans que personne l'ait su.
    set(key, value).catch((e) => setState((s) => ({ ...s, error: `Sauvegarde impossible (${key}) : ${e}` })))
  }, [key, state.loaded, value])

  return [value, setValue, state] as const
}
