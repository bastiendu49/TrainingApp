import { EXERCISE_INFO } from '../data/exerciseInfo'
import type { Photo } from '../domain/backup'
import type { Exercise } from '../domain/types'

export type IllustrationKind = 'photo' | 'free' | 'picto'

/**
 * Ce qui illustre un exercice : le choix fait sur sa fiche, sinon (« auto ») ta photo,
 * puis l'image libre, puis le pictogramme.
 */
export function resolveIllustration(exercise: Exercise, photo: Photo | undefined): IllustrationKind {
  const hasPhoto = Boolean(photo?.dataUrl)
  const hasFree = Boolean(EXERCISE_INFO[exercise.id]?.image)
  const choice = exercise.illustration ?? 'auto'
  if (choice === 'photo' && hasPhoto) return 'photo'
  if (choice === 'free' && hasFree) return 'free'
  if (choice === 'picto') return 'picto'
  return hasPhoto ? 'photo' : hasFree ? 'free' : 'picto'
}
