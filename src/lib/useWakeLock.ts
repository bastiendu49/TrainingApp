import { useEffect } from 'react'

/**
 * Garde l'écran allumé tant que le composant est affiché (pendant la séance).
 * Le navigateur relâche le verrou quand l'app passe en arrière-plan : on le redemande au retour.
 */
export function useWakeLock(): void {
  useEffect(() => {
    if (!('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let cancelled = false
    const request = async () => {
      try {
        const l = await navigator.wakeLock.request('screen')
        if (cancelled) void l.release()
        else lock = l
      } catch {
        // Refusé (économie d'énergie…) : la séance continue, l'écran pourra s'éteindre.
      }
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') void request()
    }
    void request()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      void lock?.release()
    }
  }, [])
}
