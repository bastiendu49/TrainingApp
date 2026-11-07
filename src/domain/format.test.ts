import { describe, expect, it } from 'vitest'
import { formatDuration, formatTarget } from './format'

describe('formatTarget', () => {
  it('affiche chaque type d’exercice', () => {
    expect(formatTarget('reps', { reps: 15 })).toBe('15 reps')
    expect(formatTarget('repsPerSide', { reps: 12 })).toBe('12 / côté')
    expect(formatTarget('time', { seconds: 40 })).toBe('40 s')
    expect(formatTarget('max', {})).toBe('max')
    expect(formatTarget('failure', {})).toBe('jusqu’à l’échec')
  })
  it('ajoute le lest quand il y en a un', () => {
    expect(formatTarget('reps', { reps: 5, loadKg: 17 })).toBe('5 reps · +17 kg')
  })
})

describe('formatDuration', () => {
  it('passe en minutes au-delà de 59 s', () => {
    expect(formatDuration(45)).toBe('45 s')
    expect(formatDuration(120)).toBe('2 min')
    expect(formatDuration(90)).toBe('1 min 30')
    expect(formatDuration(0)).toBe('aucun')
  })
})
