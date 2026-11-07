import type { Exercise, ExerciseKind, Program } from './types'

/**
 * Programme de départ : 4 séances par semaine (échauffement → technique → circuit),
 * repris du livre et des notes de l'utilisateur. Voir CAHIER_DES_CHARGES.md, « Programme actuel ».
 */

const ex = (id: string, name: string, kind: ExerciseKind): [string, Exercise] => [id, { id, name, kind }]

const EXERCISES: Record<string, Exercise> = Object.fromEntries([
  // Circuit Push
  ex('pompes-diamant', 'Pompes diamant', 'reps'),
  ex('pompes-archer', 'Pompes archer alternées', 'repsPerSide'),
  ex('extensions-triceps', 'Extensions triceps', 'reps'),
  ex('gainage-pieds-alternes', 'Gainage pieds alternés', 'repsPerSide'),
  ex('bateau', 'Bateau', 'time'),
  ex('planche-inversee', 'Planche inversée', 'time'),
  // Circuit Pull A
  ex('tractions-explosives', 'Tractions explosives', 'max'),
  ex('muscle-ups-negatifs', 'Muscle ups négatifs', 'reps'),
  ex('dips-droit', 'Dips droit', 'reps'),
  ex('tractions-supination', 'Tractions supination', 'reps'),
  ex('tractions-pronation', 'Tractions pronation', 'reps'),
  ex('tractions-australiennes', 'Tractions australiennes', 'reps'),
  ex('montees-jambes-explosives', 'Montées de jambes explosives', 'reps'),
  // Circuit Jambes
  ex('fentes-cosaques', 'Fentes cosaques', 'repsPerSide'),
  ex('fentes-alternees', 'Fentes alternées', 'repsPerSide'),
  ex('chaise', 'Chaise', 'time'),
  ex('montee-mollets', 'Montée de mollets', 'reps'),
  // Circuit Épaules
  ex('pompes-piquees', 'Pompes piquées', 'reps'),
  ex('pseudo-pompes', 'Pseudo-pompes', 'reps'),
  ex('gainage-reach-up', 'Gainage reach up', 'repsPerSide'),
  ex('epaule-a-epaule', 'Épaule à épaule', 'reps'),
  // Technique 90°
  ex('souleves-pieds-alternes', 'Soulevés de pieds alternés', 'reps'),
  ex('90-pompe', '90° + pompe', 'reps'),
  ex('90', '90°', 'time'),
  // Technique muscle up
  ex('tractions-lestees', 'Tractions lestées', 'reps'),
  ex('muscle-up', 'Muscle up', 'reps'),
  // Technique back lever
  ex('skin-the-cat', 'Skin the cat', 'reps'),
  ex('back-lever-negatif', 'Back lever négatif', 'time'),
  ex('straddle-back-lever', 'Straddle back lever', 'time'),
  ex('back-lever', 'Back lever', 'time'),
  // Technique équilibre
  ex('equilibre', 'Équilibre sans appui', 'time'),
  ex('negatives-dos-mur', 'Négatives dos au mur', 'reps'),
  ex('pompes-equilibre-dos-mur', 'Pompes en équilibre dos au mur', 'reps'),
  ex('negatives-equilibre', 'Négatives sans mur', 'reps'),
  ex('pompes-equilibre', 'Pompes en équilibre', 'reps'),
])

export const INITIAL_PROGRAM: Program = {
  version: 1,
  exercises: EXERCISES,

  warmups: [
    {
      id: 'haut-du-corps',
      name: 'Haut du corps',
      maxMinutes: 5,
      items: [
        { id: 'moulinets-poignets', label: 'Moulinets poignets', detail: '10-15 par sens' },
        { id: 'moulinets-coudes', label: 'Moulinets coudes', detail: '10-15 par sens' },
        { id: 'moulinets-epaules', label: 'Moulinets épaules', detail: '10-15 par sens' },
        { id: 'torsions-buste', label: 'Torsions de buste', detail: '10-15 par côté' },
        { id: 'extensions-poignets', label: 'Extensions de poignets', detail: '5 par angle' },
        { id: 'flexions-poignets', label: 'Flexions de poignets', detail: '5 par angle' },
        { id: 'pull-facile', label: 'Tractions australiennes faciles', detail: '10-15 reps' },
        { id: 'push-facile', label: 'Pompes à genoux', detail: '15-20 reps' },
      ],
    },
    {
      id: 'bas-du-corps',
      name: 'Bas du corps',
      maxMinutes: 3,
      items: [
        { id: 'mollets', label: 'Montées de mollets', detail: '20-30 s' },
        { id: 'orteils', label: 'Montées d’orteils', detail: '20-30 s' },
        { id: 'squats', label: 'Squats', detail: '20-30 s' },
        { id: 'cosaques', label: 'Fentes cosaques alternées', detail: '20-30 s' },
        { id: 'fentes', label: 'Fentes alternées', detail: '20-30 s' },
        { id: 'genoux', label: 'Montées de genoux allongé', detail: '20-30 s' },
      ],
    },
  ],

  skills: [
    {
      id: '90',
      name: '90°',
      currentLevel: 0,
      levels: [
        { exerciseId: 'souleves-pieds-alternes', criterion: '10 reps, les 2 pieds en l’air 1 s à chaque changement', sets: 8, target: { reps: 20 }, restSeconds: 120 },
        { exerciseId: '90-pompe', criterion: '10 reps, les 2 pieds en l’air 1 s', sets: 8, target: { reps: 10 }, restSeconds: 120 },
        { exerciseId: '90', criterion: 'Tenir 5 s', sets: 6, target: { seconds: 5 }, restSeconds: 120 },
      ],
    },
    {
      id: 'muscle-up',
      name: 'Muscle up',
      currentLevel: 0,
      levels: [
        { exerciseId: 'tractions-lestees', criterion: '4 × 5 reps : augmenter le lest', sets: 4, target: { reps: 5, loadKg: 17 }, restSeconds: 180 },
        { exerciseId: 'muscle-up', criterion: '5 reps', sets: 4, target: { reps: 5 }, restSeconds: 120 },
      ],
    },
    {
      id: 'back-lever',
      name: 'Back lever',
      currentLevel: 0,
      levels: [
        { exerciseId: 'skin-the-cat', criterion: '5 reps, jambes tendues jusqu’à la verticale', sets: 6, target: { reps: 3 }, restSeconds: 120 },
        { exerciseId: 'back-lever-negatif', criterion: 'Tenir 2 s à l’horizontale, jambes tendues', sets: 6, target: { seconds: 2 }, restSeconds: 120 },
        { exerciseId: 'straddle-back-lever', criterion: 'Tenir 2 s à l’horizontale, jambes fermées', sets: 6, target: { seconds: 2 }, restSeconds: 120, optional: true },
        { exerciseId: 'back-lever', criterion: 'Tenir 5 s', sets: 6, target: { seconds: 5 }, restSeconds: 120 },
      ],
    },
    {
      id: 'equilibre',
      name: 'Équilibre',
      currentLevel: 0,
      levels: [
        { exerciseId: 'equilibre', criterion: '6 × 30 s', sets: 6, target: { seconds: 30 }, restSeconds: 120 },
        { exerciseId: 'negatives-dos-mur', criterion: '10 reps, arrêt contrôlé à n’importe quelle hauteur', sets: 4, target: { reps: 10 }, restSeconds: 120 },
        { exerciseId: 'pompes-equilibre-dos-mur', criterion: '8 reps', sets: 4, target: { reps: 8 }, restSeconds: 120 },
        { exerciseId: 'negatives-equilibre', criterion: '8 reps', sets: 4, target: { reps: 8 }, restSeconds: 120 },
        { exerciseId: 'pompes-equilibre', criterion: '5 reps', sets: 4, target: { reps: 5 }, restSeconds: 120 },
      ],
    },
  ],

  circuits: [
    {
      id: 'push',
      name: 'Push',
      rounds: 3,
      restBetweenExercises: 40,
      restBetweenRounds: 120,
      items: [
        { exerciseId: 'pompes-diamant', target: { reps: 15 } },
        { exerciseId: 'pompes-archer', target: { reps: 12 } },
        { exerciseId: 'extensions-triceps', target: { reps: 10 } },
        { exerciseId: 'gainage-pieds-alternes', target: { reps: 10 } },
        { exerciseId: 'bateau', target: { seconds: 40 } },
        { exerciseId: 'planche-inversee', target: { seconds: 30 } },
      ],
    },
    {
      id: 'pull-a-force',
      name: 'Pull A · Force et explosivité',
      rounds: 3,
      restBetweenExercises: 0,
      restBetweenRounds: 180,
      items: [{ exerciseId: 'tractions-explosives', target: {} }],
    },
    {
      id: 'pull-a-endurance',
      name: 'Pull A · Endurance',
      rounds: 3,
      restBetweenExercises: 60,
      restBetweenRounds: 120,
      items: [
        { exerciseId: 'muscle-ups-negatifs', target: { reps: 6 } },
        { exerciseId: 'dips-droit', target: { reps: 15 } },
        { exerciseId: 'tractions-supination', target: { reps: 10 } },
        { exerciseId: 'tractions-pronation', target: { reps: 10 } },
        { exerciseId: 'tractions-australiennes', target: { reps: 20 } },
        { exerciseId: 'montees-jambes-explosives', target: { reps: 10 } },
      ],
    },
    {
      id: 'jambes',
      name: 'Jambes',
      rounds: 3,
      restBetweenExercises: 45,
      restBetweenRounds: 120,
      items: [
        { exerciseId: 'fentes-cosaques', target: { reps: 12 } },
        { exerciseId: 'fentes-alternees', target: { reps: 10 } },
        { exerciseId: 'chaise', target: { seconds: 45 } },
        { exerciseId: 'montee-mollets', target: { reps: 20 } },
      ],
    },
    {
      id: 'epaules',
      name: 'Épaules',
      rounds: 3,
      restBetweenExercises: 40,
      restBetweenRounds: 120,
      items: [
        { exerciseId: 'pompes-piquees', target: { reps: 12 } },
        { exerciseId: 'pseudo-pompes', target: { reps: 12 } },
        { exerciseId: 'gainage-reach-up', target: { reps: 12 } },
        { exerciseId: 'epaule-a-epaule', target: { reps: 20 } },
        { exerciseId: 'planche-inversee', target: { seconds: 30 } },
      ],
    },
  ],

  sessions: [
    { id: 'push', name: 'Push', warmupId: 'haut-du-corps', skillId: '90', circuitIds: ['push'] },
    { id: 'pull-a', name: 'Pull A', warmupId: 'haut-du-corps', skillId: 'muscle-up', circuitIds: ['pull-a-force', 'pull-a-endurance'] },
    { id: 'jambes', name: 'Jambes', warmupId: 'bas-du-corps', skillId: 'back-lever', circuitIds: ['jambes'] },
    { id: 'epaules', name: 'Épaules', warmupId: 'haut-du-corps', skillId: 'equilibre', circuitIds: ['epaules'] },
  ],
}
