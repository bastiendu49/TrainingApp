import { defaultPose, EXERCISE_INFO } from '../data/exerciseInfo'
import type { Photo } from '../domain/backup'
import type { Exercise } from '../domain/types'
import { resolveIllustration } from './illustrationChoice'
import { Pictogram } from './Pictogram'

/** Image d'un exercice : ta photo, l'image libre ou le pictogramme (voir resolveIllustration). */
export function Illustration({ exercise, photo, compact }: { exercise: Exercise; photo?: Photo; compact?: boolean }) {
  const kind = resolveIllustration(exercise, photo)
  const info = EXERCISE_INFO[exercise.id]
  const cls = compact ? 'illustration compact' : 'illustration'
  if (kind === 'photo') {
    return (
      <div className={`${cls} photo`}>
        <img src={photo!.dataUrl} alt={`Ta photo : ${exercise.name}`} />
      </div>
    )
  }
  if (kind === 'free') {
    return (
      <div className={`${cls} free`}>
        <img src={info!.image!.src} alt={`Illustration : ${exercise.name}`} />
      </div>
    )
  }
  return (
    <div className={`${cls} picto`}>
      <Pictogram pose={info?.pose ?? defaultPose(exercise.kind)} label={`Pictogramme : ${exercise.name}`} />
    </div>
  )
}
