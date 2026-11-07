import { describe, expect, it } from 'vitest'
import type { Photo } from '../domain/backup'
import { INITIAL_PROGRAM } from '../domain/program'
import { resolveIllustration } from '../lib/illustrationChoice'
import { EXERCISE_INFO, FREE_IMAGES } from './exerciseInfo'

/** Fichiers réellement présents dans public/exercises. */
const files = Object.keys(import.meta.glob('../../public/exercises/*', { query: '?url', import: 'default' })).map((p) => p.split('/').pop())

describe('consignes et illustrations', () => {
  it('donne des consignes à chaque exercice du programme', () => {
    for (const id of Object.keys(INITIAL_PROGRAM.exercises)) {
      expect(EXERCISE_INFO[id]?.instructions.length, id).toBeGreaterThan(40)
    }
  })

  it('n’utilise que des images présentes dans l’app, toutes créditées', () => {
    expect(files.length).toBeGreaterThan(0)
    for (const img of FREE_IMAGES) {
      expect(files, img.src).toContain(img.src.split('/').pop())
      expect(img.author).not.toBe('')
      expect(img.url).toMatch(/^https:\/\/wger\.de\//)
    }
  })
})

describe('choix de l’illustration', () => {
  const ex = INITIAL_PROGRAM.exercises
  const photo: Photo = { dataUrl: 'data:image/jpeg;base64,xx', updatedAt: 1 }

  it('auto : photo, sinon image libre, sinon pictogramme', () => {
    expect(resolveIllustration(ex['pompes-piquees'], photo)).toBe('photo')
    expect(resolveIllustration(ex['pompes-piquees'], undefined)).toBe('free')
    expect(resolveIllustration(ex['pompes-archer'], undefined)).toBe('picto')
  })

  it('respecte le choix fait sur la fiche', () => {
    expect(resolveIllustration({ ...ex['pompes-piquees'], illustration: 'picto' }, photo)).toBe('picto')
    expect(resolveIllustration({ ...ex['pompes-piquees'], illustration: 'free' }, photo)).toBe('free')
  })

  it('retombe sur l’automatique si le choix n’est plus possible', () => {
    // Photo supprimée, ou image libre inexistante pour cet exercice.
    expect(resolveIllustration({ ...ex['pompes-piquees'], illustration: 'photo' }, { updatedAt: 2 })).toBe('free')
    expect(resolveIllustration({ ...ex['pompes-archer'], illustration: 'free' }, undefined)).toBe('picto')
  })
})
