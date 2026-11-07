/** Mesures du corps à une date (une entrée par jour au plus). */
export interface BodyEntry {
  id: string
  /** Jour de la mesure, AAAA-MM-JJ. */
  date: string
  updatedAt: number
  weight?: number
  fat?: number
  waist?: number
  chest?: number
  arm?: number
  thigh?: number
  hips?: number
  calf?: number
}

export type BodyMetric = Exclude<keyof BodyEntry, 'id' | 'date' | 'updatedAt'>

export const BODY_METRICS: { key: BodyMetric; label: string; unit: string }[] = [
  { key: 'weight', label: 'Poids', unit: 'kg' },
  { key: 'fat', label: 'Masse grasse', unit: '%' },
  { key: 'waist', label: 'Tour de taille', unit: 'cm' },
  { key: 'chest', label: 'Poitrine', unit: 'cm' },
  { key: 'arm', label: 'Bras', unit: 'cm' },
  { key: 'thigh', label: 'Cuisse', unit: 'cm' },
  { key: 'hips', label: 'Hanches', unit: 'cm' },
  { key: 'calf', label: 'Mollet', unit: 'cm' },
]
