import type { ExerciseKind } from '../domain/types'

/** Silhouette de pictogramme utilisée quand il n'y a ni image libre ni photo. */
export type Pose = 'pushup' | 'plank' | 'hang' | 'pull' | 'dip' | 'lunge' | 'squat' | 'wallsit' | 'boat' | 'table' | 'handstand' | 'lever' | 'stand'

/** Image sous licence libre (base wger), avec ce qu'il faut pour la créditer. */
export interface FreeImage {
  src: string
  title: string
  author: string
  license: 'CC-BY-SA 3.0' | 'CC-BY-SA 4.0'
  url: string
}

export interface ExerciseInfo {
  instructions: string
  pose: Pose
  image?: FreeImage
}

const wger = (src: string, title: string, author: string, license: FreeImage['license'], id: number): FreeImage => ({
  src: `/exercises/${src}`,
  title,
  author,
  license,
  url: `https://wger.de/fr/exercise/${id}/view/`,
})

const IMG = {
  pike: wger('pike.png', 'Pike Push Ups', 'auteur non renseigné (wger)', 'CC-BY-SA 4.0', 454),
  chin: wger('chin-up.png', 'Chin Up', 'Everkinetic', 'CC-BY-SA 3.0', 152),
  pull: wger('pull-up.jpg', 'Pull-ups', 'Imobard', 'CC-BY-SA 4.0', 475),
  dips: wger('dips.png', 'Dips', 'cshep442', 'CC-BY-SA 4.0', 194),
  handstand: wger('handstand.png', 'Handstand Pushup', 'auteur non renseigné (wger)', 'CC-BY-SA 4.0', 282),
  legRaise: wger('leg-raise.png', 'Leg raises pull up bar', 'auteur non renseigné (wger)', 'CC-BY-SA 4.0', 979),
  plank: wger('plank.png', 'Plank', 'utkb', 'CC-BY-SA 4.0', 458),
}

/** Toutes les images libres utilisées, pour la page des crédits. */
export const FREE_IMAGES: FreeImage[] = Object.values(IMG)

/** Consignes rédigées pour l'app, et illustration de chaque exercice du programme. */
export const EXERCISE_INFO: Record<string, ExerciseInfo> = {
  'pompes-diamant': { pose: 'pushup', instructions: 'En appui sur les mains, index et pouces qui se touchent sous la poitrine. Coudes serrés le long du corps, descends jusqu’à effleurer le sol puis repousse jusqu’aux bras tendus.' },
  'pompes-archer': { pose: 'pushup', instructions: 'Mains bien plus écartées que les épaules. Descends en pliant un seul bras pendant que l’autre reste tendu sur le côté, remonte, puis change de côté.' },
  'extensions-triceps': { pose: 'plank', instructions: 'En gainage bras tendus, mains un peu devant le visage. Pose les avant-bras au sol sans bouger les épaules, puis repousse jusqu’à tendre les bras.' },
  'gainage-pieds-alternes': { pose: 'plank', image: IMG.plank, instructions: 'En gainage sur les coudes, corps aligné. Écarte un pied sur le côté puis ramène-le, en alternant, sans laisser le bassin tourner.' },
  bateau: { pose: 'boat', instructions: 'Assis, lève les jambes tendues et incline le buste en arrière : seuls les fessiers touchent le sol, pieds et épaules quelques centimètres au-dessus. Tiens la position.' },
  'planche-inversee': { pose: 'table', instructions: 'Assis, genoux pliés, mains au sol à côté des hanches. Pousse sur les mains et les talons pour monter le bassin jusqu’à former une table. Ouvre la poitrine, serre les omoplates, tiens.' },
  'tractions-explosives': { pose: 'pull', image: IMG.pull, instructions: 'Suspendu, mains en pronation. Monte le plus vite possible, menton au-dessus de la barre, en gardant le corps droit, puis contrôle la descente.' },
  'muscle-ups-negatifs': { pose: 'dip', instructions: 'Pars bras tendus au-dessus d’une barre basse. Descends lentement en dip jusqu’à la poitrine, passe sous la barre en reculant les épaules et termine comme une traction négative, jusqu’à être suspendu.' },
  'dips-droit': { pose: 'dip', image: IMG.dips, instructions: 'Bras tendus au-dessus d’une barre, mains à largeur d’épaules. Corps gainé, coudes rentrés, descends jusqu’à ce que la barre frôle la poitrine puis remonte bras tendus.' },
  'tractions-supination': { pose: 'pull', image: IMG.chin, instructions: 'Suspendu, paumes vers toi. Monte en gardant le corps droit jusqu’à passer le menton au-dessus de la barre, puis redescends jusqu’aux bras tendus.' },
  'tractions-pronation': { pose: 'pull', image: IMG.pull, instructions: 'Suspendu, paumes vers l’avant. Monte en gardant le corps droit jusqu’à passer le menton au-dessus de la barre, puis redescends jusqu’aux bras tendus.' },
  'tractions-australiennes': { pose: 'hang', instructions: 'Sous une barre basse, mains à largeur d’épaules, corps droit et talons au sol. Tire la poitrine jusqu’à la barre puis redescends bras tendus.' },
  'montees-jambes-explosives': { pose: 'hang', image: IMG.legRaise, instructions: 'Suspendu à une barre haute. Abdos engagés, monte vite les jambes tendues jusqu’à l’horizontale, puis contrôle la descente.' },
  'fentes-cosaques': { pose: 'squat', instructions: 'Pieds très écartés, buste engagé. Plie une jambe au maximum en gardant l’autre tendue, remonte, puis passe de l’autre côté.' },
  'fentes-alternees': { pose: 'lunge', instructions: 'Un pied en avant, genou plié à 90°, l’autre genou proche du sol, talon arrière décollé. Remonte et change de jambe, buste droit.' },
  chaise: { pose: 'wallsit', instructions: 'Dos contre un mur, descends jusqu’à ce que les cuisses soient à l’horizontale, genoux à 90°. Abdos engagés, tiens la position.' },
  'montee-mollets': { pose: 'stand', instructions: 'Debout, jambes tendues, éventuellement une main sur un appui. Monte sur la pointe des pieds puis redescends lentement.' },
  'pompes-piquees': { pose: 'pushup', image: IMG.pike, instructions: 'Bassin haut, jambes tendues, pieds rapprochés des mains. Plie les bras pour amener le nez près du sol, en gardant le poids sur les épaules, puis repousse.' },
  'pseudo-pompes': { pose: 'pushup', instructions: 'En gainage bras tendus, mains au niveau des hanches, doigts tournés vers l’extérieur. Descends lentement jusqu’à effleurer le sol de la poitrine puis remonte.' },
  'gainage-reach-up': { pose: 'plank', instructions: 'En gainage sur les avant-bras. Pivote sur le côté en levant le bras libre vers le plafond, regarde ta main, reviens de face et change de côté.' },
  'epaule-a-epaule': { pose: 'pushup', instructions: 'En gainage bras tendus. Touche l’épaule opposée avec une main, puis l’autre, sans laisser les hanches ni les épaules tourner.' },
  'souleves-pieds-alternes': { pose: 'pushup', instructions: 'En position de pseudo-pompe, bras tendus et mains sous le ventre. Décolle les pieds en alternance : à chaque changement, les deux pieds doivent quitter le sol un instant. Repousse le sol et gaine-toi.' },
  '90-pompe': { pose: 'pushup', instructions: 'Depuis le haut d’une pseudo-pompe, utilise l’élan de la descente pour décoller les deux pieds une seconde, puis repousse le sol pour remonter. Avance le buste plutôt que de le baisser.' },
  '90': { pose: 'plank', instructions: 'Corps à l’horizontale, en appui sur les mains, bras pliés à 90°, pieds décollés. Contracte épaules et abdos et tiens la position.' },
  'tractions-lestees': { pose: 'pull', image: IMG.pull, instructions: 'Tractions avec un lest à la ceinture ou dans un sac. 4 séries de 5 reps au même lest ; dès que 4 × 5 passe, augmente le lest.' },
  'muscle-up': { pose: 'pull', instructions: 'Suspendu, paumes au-dessus de la barre. Tire le plus haut possible en te penchant vers l’avant, passe le ventre sur la barre puis termine par un dip. Les deux bras passent en même temps.' },
  'skin-the-cat': { pose: 'hang', instructions: 'Depuis la position tête en bas, alterne contractions (mains, épaules, abdos) et relâchements pour descendre progressivement jusqu’à la position suspendue épaules tournées, puis remonte jambes au-dessus de la tête.' },
  'back-lever-negatif': { pose: 'lever', instructions: 'Depuis la tête en bas, déplie les jambes et contrôle la descente le plus lentement possible, buste droit, jusqu’à l’horizontale où la contraction est maximale.' },
  'straddle-back-lever': { pose: 'lever', instructions: 'Comme le back lever négatif, mais jambes écartées au maximum pour alléger le contrepoids. Resserre-les au fil des progrès.' },
  'back-lever': { pose: 'lever', instructions: 'Corps à l’horizontale sous la barre, face au sol, jambes tendues et serrées. Bassin rétroversé, fessiers contractés, tiens la position.' },
  equilibre: { pose: 'handstand', image: IMG.handstand, instructions: 'Équilibre sur les mains sans appui, corps aligné et gainé, doigts qui corrigent la position. Tiens le plus longtemps possible.' },
  'negatives-dos-mur': { pose: 'handstand', image: IMG.handstand, instructions: 'En équilibre dos au mur, pieds contre le mur. Coudes rentrés, fléchis les bras le plus lentement possible jusqu’à frôler le sol du nez, puis redescends les jambes.' },
  'pompes-equilibre-dos-mur': { pose: 'handstand', image: IMG.handstand, instructions: 'En équilibre dos au mur, descends puis remonte en repoussant le sol, abdos et doigts contractés au maximum.' },
  'negatives-equilibre': { pose: 'handstand', image: IMG.handstand, instructions: 'Négatives sans mur : pars bras tendus en équilibre et descends lentement jusqu’à frôler le sol du nez.' },
  'pompes-equilibre': { pose: 'handstand', image: IMG.handstand, instructions: 'Pompe complète en équilibre libre : descends puis remonte sans relâcher abdos ni pression des doigts.' },
}

/** Pose par défaut d'un exercice créé dans l'app. */
export const defaultPose = (kind: ExerciseKind): Pose => (kind === 'time' ? 'plank' : 'pushup')
