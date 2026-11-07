import type { Session } from './types'

/**
 * Séance proposée : celle qui suit la dernière faite dans l'ordre de la semaine
 * (Push → Pull A → Jambes → Épaules → Push…). Sans historique, la première.
 * On suit l'ordre plutôt que le jour de la semaine : une séance décalée ne casse pas le cycle.
 */
export function nextSession(sessions: Session[], lastDoneId?: string): Session {
  const i = sessions.findIndex((s) => s.id === lastDoneId)
  return sessions[(i + 1) % sessions.length]
}

/** Les 7 jours (lundi → dimanche) de la semaine qui contient `date`, à minuit. */
export function weekDays(date: Date): Date[] {
  const y = date.getFullYear()
  const m = date.getMonth()
  const monday = date.getDate() - ((date.getDay() + 6) % 7)
  return Array.from({ length: 7 }, (_, i) => new Date(y, m, monday + i))
}
