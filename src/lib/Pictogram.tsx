import type { Pose } from '../data/exerciseInfo'

/**
 * Silhouettes simples (vue de profil, tournées vers la droite) pour les exercices sans image
 * libre. Le trait prend la couleur du texte : lisibles en thème clair comme sombre.
 */
const FIGURES: Record<Pose, React.ReactNode> = {
  pushup: (
    <>
      <line className="pg-gear" x1="14" y1="126" x2="186" y2="126" />
      <polyline className="pg-fig" points="30,122 95,104 148,86 150,124" />
      <circle className="pg-head" cx="165" cy="78" r="10" />
    </>
  ),
  plank: (
    <>
      <line className="pg-gear" x1="14" y1="126" x2="186" y2="126" />
      <polyline className="pg-fig" points="30,122 95,108 145,98 145,122 172,122" />
      <circle className="pg-head" cx="162" cy="88" r="10" />
    </>
  ),
  hang: (
    <>
      <line className="pg-gear" x1="14" y1="126" x2="186" y2="126" />
      <line className="pg-gear" x1="152" y1="46" x2="152" y2="126" />
      <circle className="pg-bar" cx="152" cy="46" r="5" />
      <polyline className="pg-fig" points="32,122 92,100 134,78 152,48" />
      <circle className="pg-head" cx="147" cy="72" r="10" />
    </>
  ),
  pull: (
    <>
      <line className="pg-gear" x1="44" y1="18" x2="156" y2="18" style={{ strokeWidth: 5 }} />
      <polyline className="pg-fig" points="84,20 70,46 86,62 114,62 130,46 116,20" />
      <line className="pg-fig" x1="100" y1="62" x2="100" y2="100" />
      <polyline className="pg-fig" points="93,132 100,100 107,132" />
      <circle className="pg-head" cx="100" cy="44" r="10" />
    </>
  ),
  dip: (
    <>
      <line className="pg-gear" x1="56" y1="74" x2="156" y2="74" style={{ strokeWidth: 5 }} />
      <polyline className="pg-fig" points="110,74 86,62 104,50 96,100 112,118 92,130" />
      <circle className="pg-head" cx="110" cy="35" r="10" />
    </>
  ),
  lunge: (
    <>
      <line className="pg-gear" x1="14" y1="126" x2="186" y2="126" />
      <polyline className="pg-fig" points="142,124 138,96 110,94 84,118 60,122" />
      <polyline className="pg-fig" points="110,94 112,54 130,72" />
      <circle className="pg-head" cx="114" cy="38" r="10" />
    </>
  ),
  squat: (
    <>
      <line className="pg-gear" x1="14" y1="126" x2="186" y2="126" />
      <polyline className="pg-fig" points="36,124 100,104 142,100 132,124" />
      <polyline className="pg-fig" points="100,104 104,64 136,74" />
      <circle className="pg-head" cx="106" cy="48" r="10" />
    </>
  ),
  wallsit: (
    <>
      <line className="pg-gear" x1="14" y1="126" x2="186" y2="126" />
      <line className="pg-gear" x1="58" y1="16" x2="58" y2="126" />
      <polyline className="pg-fig" points="68,58 68,100 110,100 110,124" />
      <line className="pg-fig" x1="68" y1="64" x2="100" y2="96" />
      <circle className="pg-head" cx="70" cy="42" r="10" />
    </>
  ),
  boat: (
    <>
      <line className="pg-gear" x1="14" y1="126" x2="186" y2="126" />
      <polyline className="pg-fig" points="156,70 100,112 70,74" />
      <line className="pg-fig" x1="72" y1="78" x2="114" y2="84" />
      <circle className="pg-head" cx="60" cy="60" r="10" />
    </>
  ),
  table: (
    <>
      <line className="pg-gear" x1="14" y1="126" x2="186" y2="126" />
      <polyline className="pg-fig" points="152,124 150,92 100,92 58,92 58,124" />
      <circle className="pg-head" cx="42" cy="84" r="10" />
    </>
  ),
  handstand: (
    <>
      <line className="pg-gear" x1="14" y1="126" x2="186" y2="126" />
      <polyline className="pg-fig" points="88,124 92,92 108,92 112,124" />
      <line className="pg-fig" x1="100" y1="92" x2="100" y2="52" />
      <polyline className="pg-fig" points="96,14 100,52 104,14" />
      <circle className="pg-head" cx="100" cy="108" r="9" />
    </>
  ),
  lever: (
    <>
      <circle className="pg-bar" cx="104" cy="36" r="5" />
      <line className="pg-gear" x1="104" y1="36" x2="104" y2="16" />
      <polyline className="pg-fig" points="104,38 116,70 64,70 16,70" />
      <circle className="pg-head" cx="132" cy="74" r="10" />
    </>
  ),
  stand: (
    <>
      <line className="pg-gear" x1="14" y1="126" x2="186" y2="126" />
      <polyline className="pg-fig" points="94,124 104,118 100,84 100,46 96,82" />
      <circle className="pg-head" cx="100" cy="30" r="10" />
    </>
  ),
}

export function Pictogram({ pose, label }: { pose: Pose; label: string }) {
  return (
    <svg className="pictogram" viewBox="0 0 200 140" role="img" aria-label={label}>
      {FIGURES[pose]}
    </svg>
  )
}
