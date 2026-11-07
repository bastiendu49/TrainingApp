import { describe, expect, it } from 'vitest'
import { formatClock } from './time'

describe('formatClock', () => {
  it('affiche minutes et secondes', () => {
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(28)).toBe('0:28')
    expect(formatClock(65)).toBe('1:05')
    expect(formatClock(120)).toBe('2:00')
  })
  it('ajoute les heures au-delà de 59:59', () => {
    expect(formatClock(3723)).toBe('1:02:03')
  })
  it('arrondit vers le bas et ne descend jamais sous zéro', () => {
    expect(formatClock(9.9)).toBe('0:09')
    expect(formatClock(-3)).toBe('0:00')
  })
})
