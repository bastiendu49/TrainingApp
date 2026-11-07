import { useCallback, useEffect, useState } from 'react'

/**
 * Pile d'écrans dans un onglet (liste → détail → …). Chaque écran ouvert ajoute une entrée
 * à l'historique du navigateur : le bouton retour d'Android revient à l'écran précédent.
 */
export function useNavStack<T>() {
  const [stack, setStack] = useState<T[]>([])

  useEffect(() => {
    const onPop = () => setStack((s) => s.slice(0, -1))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const push = useCallback((view: T) => {
    window.history.pushState({ nav: true }, '')
    setStack((s) => [...s, view])
    window.scrollTo(0, 0)
  }, [])

  const back = useCallback(() => window.history.back(), [])

  return { view: stack.at(-1) ?? null, push, back }
}
