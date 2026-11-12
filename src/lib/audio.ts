/**
 * Sons de la séance, générés par Web Audio (aucun fichier son à télécharger).
 * Les navigateurs n'autorisent le son qu'après un geste de l'utilisateur : `unlockAudio()` est
 * appelé sur le bouton « Démarrer la séance » et sur chaque bouton de la séance.
 * Sur Android, c'est le volume multimédia du téléphone qui s'applique.
 */
let ctx: AudioContext | null = null
/** Volume général choisi dans les réglages, de 0 à 1 (1 par défaut : le plus fort). */
let volume = 1

export function setVolume(v: number): void {
  volume = Math.max(0, Math.min(1, v))
}

export function unlockAudio(): void {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    // Pas de Web Audio : la séance marche quand même, sans son.
  }
}

/** Un son ; `level` relatif au volume général (1 = volume général plein). */
function tone(frequency: number, seconds: number, level: number, type: OscillatorType, delay = 0): void {
  if (!ctx || volume <= 0) return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const t = ctx.currentTime + delay
    // Onde carrée pour les bips : plus perçante, elle s'entend mieux qu'une sinusoïde au même volume.
    osc.type = type
    osc.frequency.value = frequency
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume * level), t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds)
    osc.start(t)
    osc.stop(t + seconds + 0.02)
  } catch {
    // ignore
  }
}

/** Tic du métronome (chaque seconde d'un exercice en durée) : discret. */
export const metronomeTick = () => tone(1600, 0.04, 0.22, 'sine')

/**
 * Bips de fin de compte à rebours, au volume maximum : un son différent pour chacune des
 * 5 dernières secondes (de plus en plus aigu), pour savoir sans regarder combien il reste.
 */
const COUNTDOWN_HZ: Record<number, number> = { 5: 523, 4: 587, 3: 659, 2: 784, 1: 880 }
export function countdownBeep(secondsLeft: number): void {
  const hz = COUNTDOWN_HZ[secondsLeft]
  if (hz) tone(hz, 0.18, 1, 'square')
}

/** Bip long : c'est parti (fin d'un repos, d'une préparation ou d'un chrono). */
export function go(): void {
  tone(1320, 0.5, 1, 'square')
  navigator.vibrate?.(250)
}

/** Aperçu des sons pour régler le volume : 2 tics, la fin du compte à rebours, puis le départ. */
export function testSound(): void {
  unlockAudio()
  tone(1600, 0.04, 0.22, 'sine', 0)
  tone(1600, 0.04, 0.22, 'sine', 0.5)
  tone(659, 0.18, 1, 'square', 1)
  tone(784, 0.18, 1, 'square', 1.5)
  tone(880, 0.18, 1, 'square', 2)
  tone(1320, 0.5, 1, 'square', 2.5)
}
