import { useCallback, useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useAppData } from './domain/appData'
import { mergeData } from './domain/backup'
import { startSession, type ActiveSession } from './domain/session'
import { usePersisted } from './domain/store'
import { unlockAudio } from './lib/audio'
import { IconBody, IconChart, IconMore, IconRings } from './lib/icons'
import { useSync } from './lib/sync'
import { ComingSoon } from './screens/ComingSoon'
import { Guided } from './screens/Guided'
import { SessionDetail } from './screens/SessionDetail'
import { Settings } from './screens/Settings'
import { Today } from './screens/Today'

type Tab = 'seance' | 'suivi' | 'corps' | 'plus'

const TABS: { id: Tab; label: string; Icon: (p: { size?: number }) => React.ReactElement }[] = [
  { id: 'seance', label: 'Séance', Icon: IconRings },
  { id: 'suivi', label: 'Suivi', Icon: IconChart },
  { id: 'corps', label: 'Corps', Icon: IconBody },
  { id: 'plus', label: 'Plus', Icon: IconMore },
]

type AppSettings = { syncCode?: string; lastSyncAt?: number }

export default function App() {
  // Enregistre le service worker (hors ligne). Une nouvelle version attend la prochaine
  // ouverture de l'app : rien ne se recharge pendant une séance.
  useRegisterSW()

  const app = useAppData()
  const { program, history } = app.data
  // La séance en cours est enregistrée à chaque action : fermer l'app ne la perd pas.
  const [active, setActive, activeStore] = usePersisted<ActiveSession | null>('active', null)
  const [settings, setSettings, settingsStore] = usePersisted<AppSettings>('settings', {})
  const [tab, setTab] = useState<Tab>('seance')
  const [openSession, setOpenSession] = useState<string | null>(null)
  const [guided, setGuided] = useState(true)

  const loaded = app.loaded && activeStore.loaded && settingsStore.loaded
  const onSynced = useCallback((at: number) => setSettings((s) => ({ ...s, lastSyncAt: at })), [setSettings])
  const sync = useSync(loaded, app.data, app.replace, settings.syncCode, onSynced)

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

  const update = useCallback((fn: (a: ActiveSession) => ActiveSession) => setActive((a) => (a ? fn(a) : a)), [setActive])

  const error = app.error ?? activeStore.error ?? settingsStore.error
  if (error) {
    return (
      <main className="screen">
        <p className="error">{error}</p>
      </main>
    )
  }
  if (!loaded) return null

  if (active && guided && tab === 'seance') {
    return (
      <Guided
        program={program}
        history={history}
        active={active}
        update={update}
        onSave={(log) => {
          app.saveLog(log)
          setActive(null)
          window.scrollTo(0, 0)
        }}
        onAbort={() => setActive(null)}
        onMinimize={() => setGuided(false)}
      />
    )
  }

  let content: React.ReactNode
  if (tab === 'seance') {
    content = openSession ? (
      <SessionDetail program={program} sessionId={openSession} onBack={close} />
    ) : (
      <Today
        program={program}
        history={history}
        active={active}
        onOpenSession={open}
        onStart={(id) => {
          unlockAudio()
          setActive(startSession(program, id, Date.now()))
          setGuided(true)
        }}
        onResume={() => {
          unlockAudio()
          setGuided(true)
        }}
      />
    )
  } else if (tab === 'suivi') {
    content = <ComingSoon title="Suivi" text="Historique, fiches d’exercices avec tes records et tes courbes, calendrier et bilan mensuel : étapes 4 et 6." />
  } else if (tab === 'corps') {
    content = <ComingSoon title="Corps" text="Poids et mensurations avec leurs courbes : étape 6." />
  } else {
    content = (
      <Settings
        data={app.data}
        code={settings.syncCode}
        lastSyncAt={settings.lastSyncAt}
        status={sync.status}
        onSetCode={(syncCode) => setSettings((s) => ({ ...s, syncCode, lastSyncAt: syncCode ? s.lastSyncAt : undefined }))}
        onSyncNow={() => void sync.sync()}
        onImport={(d) => app.replace(mergeData(app.data, d))}
      />
    )
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
