import { describe, expect, it } from 'vitest'
import { INITIAL_PROGRAM } from './program'
import { nextSession, weekDays } from './schedule'

const sessions = INITIAL_PROGRAM.sessions

describe('nextSession', () => {
  it('commence par Push sans historique', () => {
    expect(nextSession(sessions).id).toBe('push')
  })
  it('suit l’ordre de la semaine et reboucle', () => {
    expect(nextSession(sessions, 'push').id).toBe('pull-a')
    expect(nextSession(sessions, 'jambes').id).toBe('epaules')
    expect(nextSession(sessions, 'epaules').id).toBe('push')
  })
  it('repart du début si la dernière séance n’existe plus', () => {
    expect(nextSession(sessions, 'supprimee').id).toBe('push')
  })
})

describe('weekDays', () => {
  it('va du lundi au dimanche de la semaine', () => {
    const days = weekDays(new Date(2026, 10, 7)) // samedi 7 novembre 2026
    expect(days).toHaveLength(7)
    expect(days[0].toDateString()).toBe(new Date(2026, 10, 2).toDateString()) // lundi 2
    expect(days[6].toDateString()).toBe(new Date(2026, 10, 8).toDateString()) // dimanche 8
  })
  it('garde le bon lundi un lundi et un dimanche', () => {
    expect(weekDays(new Date(2026, 10, 9))[0].getDate()).toBe(9)
    expect(weekDays(new Date(2026, 10, 8))[0].getDate()).toBe(2)
  })
  it('passe correctement d’un mois à l’autre', () => {
    const days = weekDays(new Date(2026, 11, 2)) // mercredi 2 décembre
    expect(days[0].toDateString()).toBe(new Date(2026, 10, 30).toDateString()) // lundi 30 novembre
  })
})
