/**
 * Bips de la séance, générés par Web Audio (aucun fichier son à télécharger).
 * Les navigateurs n'autorisent le son qu'après un geste de l'utilisateur : `unlockAudio()` est
 * appelé sur le bouton « Démarrer la séance » et sur chaque bouton de la séance.
 */
let ctx: AudioContext | null = null

export function unlockAudio(): void {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    // Pas de Web Audio : la séance marche quand même, sans son.
  }
}

function tone(frequency: number, seconds: number, volume: number): void {
  if (!ctx) return
  try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const t = ctx.currentTime
    osc.frequency.value = frequency
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds)
    osc.start(t)
    osc.stop(t + seconds + 0.02)
  } catch {
    // ignore
  }
}

/** Bip court des 3 dernières secondes. */
export const tick = () => tone(880, 0.12, 0.35)

/** Bip long : c'est parti (fin d'un repos, d'une préparation ou d'un chrono). */
export function go(): void {
  tone(1320, 0.4, 0.45)
  navigator.vibrate?.(200)
}
