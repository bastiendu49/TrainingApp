import { useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export default function App() {
  // Enregistre le service worker (hors ligne). Une nouvelle version attend la prochaine
  // ouverture de l'app : rien ne se recharge pendant une séance.
  useRegisterSW()

  const [today] = useState(() =>
    new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
  )

  return (
    <main className="screen">
      <header>
        <p className="date">{today.charAt(0).toUpperCase() + today.slice(1)}</p>
        <h1>Training</h1>
      </header>

      <section className="card">
        <span className="ring" aria-hidden="true" />
        <div>
          <p className="eyebrow">Installation réussie</p>
          <p className="title">L’app est prête</p>
          <p className="muted">Prochaine étape : ton programme de la semaine.</p>
        </div>
      </section>

      <p className="version muted">Training · version {__BUILD__}</p>
    </main>
  )
}
