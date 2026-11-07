import { useCallback, useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { buildNotebookHistory } from './data/notebook'
import { useAppData } from './domain/appData'
import { mergeData } from './domain/backup'
import { applySuggestion, computeSuggestions, setSkillLevel } from './domain/progression'
import { startSession, type ActiveSession } from './domain/session'
import { usePersisted } from './domain/store'
import { unlockAudio } from './lib/audio'
import { IconBody, IconChart, IconMore, IconRings } from './lib/icons'
import { useSync } from './lib/sync'
import { useNavStack } from './lib/useNavStack'
import { Body } from './screens/Body'
import { Guided } from './screens/Guided'
import { ProgramEditor } from './screens/ProgramEditor'
import { CalendarView, MonthlyReportView } from './screens/Monthly'
import { Suggestions, Techniques } from './screens/Progression'
import { SessionDetail } from './screens/SessionDetail'
import { Settings } from './screens/Settings'
import { Suivi } from './screens/Suivi'
import { Today } from './screens/Today'

type Tab = 'seance' | 'suivi' | 'corps' | 'plus'

const TABS: { id: Tab; label: string; Icon: (p: { size?: number }) => React.ReactElement }[] = [
  { id: 'seance', label: 'Séance', Icon: IconRings },
  { id: 'suivi', label: 'Suivi', Icon: IconChart },
  { id: 'corps', label: 'Corps', Icon: IconBody },
  { id: 'plus', label: 'Plus', Icon: IconMore },
]

type AppSettings = { syncCode?: string; lastSyncAt?: number; notebookImported?: boolean; dismissed?: string[] }

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
  const plusNav = useNavStack<'program'>()

  const loaded = app.loaded && activeStore.loaded && settingsStore.loaded
  const onSynced = useCallback((at: number) => setSettings((s) => ({ ...s, lastSyncAt: at })), [setSettings])
  const sync = useSync(loaded, app.data, app.replace, settings.syncCode, onSynced)

  // Premier lancement : ajoute l'historique noté dans le carnet (une seule fois).
  const { importLogs } = app
  useEffect(() => {
    if (!loaded || settings.notebookImported) return
    importLogs(buildNotebookHistory(program))
    setSettings((s) => ({ ...s, notebookImported: true }))
  }, [loaded, settings.notebookImported, importLogs, program, setSettings])

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
        photos={app.data.photos}
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
        suggestions={
          <Suggestions
            program={program}
            suggestions={computeSuggestions(program, history).filter((s) => !settings.dismissed?.includes(s.key))}
            onApply={(s, toKg) => app.updateProgram((p) => applySuggestion(p, s, Date.now(), toKg))}
            onDismiss={(key) => setSettings((st) => ({ ...st, dismissed: [...(st.dismissed ?? []), key] }))}
          />
        }
      />
    )
  } else if (tab === 'suivi') {
    content = (
      <Suivi
        program={program}
        history={history}
        onSaveLog={app.saveLog}
        onDeleteLog={app.deleteLog}
        photos={app.data.photos}
        onSetPhoto={app.setPhoto}
        onSetIllustration={(id, illustration) =>
          app.updateProgram((p) => ({ ...p, exercises: { ...p.exercises, [id]: { ...p.exercises[id], illustration } } }))
        }
        extraSections={[
          { id: 'calendrier', label: 'Calendrier', render: (open) => <CalendarView program={program} history={history} open={open} /> },
          { id: 'bilan', label: 'Bilan', render: (open) => <MonthlyReportView program={program} history={history} body={app.data.body} open={open} /> },
          {
            id: 'techniques',
            label: 'Techniques',
            render: () => <Techniques program={program} onSetLevel={(skillId, level) => app.updateProgram((p) => setSkillLevel(p, skillId, level, Date.now()))} />,
          },
        ]}
      />
    )
  } else if (tab === 'corps') {
    content = <Body body={app.data.body} onSave={app.saveBody} onDelete={app.deleteBody} />
  } else {
    content = plusNav.view === 'program' ? (
      <ProgramEditor program={program} change={app.updateProgram} onBack={plusNav.back} />
    ) : (
      <Settings
        data={app.data}
        code={settings.syncCode}
        lastSyncAt={settings.lastSyncAt}
        status={sync.status}
        onSetCode={(syncCode) => setSettings((s) => ({ ...s, syncCode, lastSyncAt: syncCode ? s.lastSyncAt : undefined }))}
        onSyncNow={() => void sync.sync()}
        onImport={(d) => app.replace(mergeData(app.data, d))}
        onEditProgram={() => plusNav.push('program')}
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
