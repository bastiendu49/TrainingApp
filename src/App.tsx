import { useCallback, useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { INITIAL_PROGRAM } from './domain/program'
import { usePersisted } from './domain/store'
import type { Program } from './domain/types'
import { IconBody, IconChart, IconMore, IconRings } from './lib/icons'
import { ComingSoon } from './screens/ComingSoon'
import { SessionDetail } from './screens/SessionDetail'
import { Today } from './screens/Today'

type Tab = 'seance' | 'suivi' | 'corps' | 'plus'

const TABS: { id: Tab; label: string; Icon: (p: { size?: number }) => React.ReactElement }[] = [
  { id: 'seance', label: 'Séance', Icon: IconRings },
  { id: 'suivi', label: 'Suivi', Icon: IconChart },
  { id: 'corps', label: 'Corps', Icon: IconBody },
  { id: 'plus', label: 'Plus', Icon: IconMore },
]

export default function App() {
  // Enregistre le service worker (hors ligne). Une nouvelle version attend la prochaine
  // ouverture de l'app : rien ne se recharge pendant une séance.
  useRegisterSW()

  const [program, , store] = usePersisted<Program>('program', INITIAL_PROGRAM)
  const [tab, setTab] = useState<Tab>('seance')
  const [openSession, setOpenSession] = useState<string | null>(null)

  // Le bouton retour d'Android ferme le détail au lieu de quitter l'app.
  useEffect(() => {
    const onPop = () => setOpenSession(null)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  const open = useCallback((id: string) => {
    window.history.pushState({ session: id }, '')
    setOpenSession(id)
    window.scrollTo(0, 0)
  }, [])
  const close = useCallback(() => window.history.back(), [])

  if (store.error) {
    return (
      <main className="screen">
        <p className="error">{store.error}</p>
      </main>
    )
  }
  if (!store.loaded) return null

  let content: React.ReactNode
  if (tab === 'seance') {
    content = openSession ? (
      <SessionDetail program={program} sessionId={openSession} onBack={close} />
    ) : (
      <Today program={program} onOpenSession={open} />
    )
  } else if (tab === 'suivi') {
    content = <ComingSoon title="Suivi" text="Historique, fiches d’exercices avec tes records et tes courbes, calendrier et bilan mensuel : étapes 4 et 6." />
  } else if (tab === 'corps') {
    content = <ComingSoon title="Corps" text="Poids et mensurations avec leurs courbes : étape 6." />
  } else {
    content = <ComingSoon title="Plus" text="Sauvegarde en ligne (étape 3), puis modification du programme et des échauffements (étape 7)." />
  }

  return (
    <div className="app">
      {content}
      <nav className="tabbar" aria-label="Navigation principale">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={id === tab ? 'tab on' : 'tab'}
            aria-current={id === tab ? 'page' : undefined}
            onClick={() => {
              if (openSession) close()
              setTab(id)
            }}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
