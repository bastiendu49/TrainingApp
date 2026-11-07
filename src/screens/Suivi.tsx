import { useRef, useState } from 'react'
import { EXERCISE_INFO } from '../data/exerciseInfo'
import type { Photo } from '../domain/backup'
import type { Exercise } from '../domain/types'
import { Illustration } from '../lib/Illustration'
import { resolveIllustration } from '../lib/illustrationChoice'
import { photoToDataUrl } from '../lib/photo'
import { isNotebookLog } from '../data/notebook'
import { formatTarget } from '../domain/format'
import { averageRating, formatResults, sortedHistory, type SetResult, type WorkoutLog } from '../domain/log'
import { exerciseSessions, personalRecord, practicedExercises, progressPoints, setsDone } from '../domain/stats'
import type { Program } from '../domain/types'
import { IconBack, IconChevron } from '../lib/icons'
import { LineChart } from '../lib/LineChart'
import { useNavStack } from '../lib/useNavStack'

type View = { kind: 'log'; id: string } | { kind: 'exercise'; id: string }
type Section = 'seances' | 'exercices'

type Props = {
  program: Program
  history: WorkoutLog[]
  onSaveLog: (log: WorkoutLog) => void
  onDeleteLog: (id: string) => void
  photos: Record<string, Photo>
  onSetPhoto: (exerciseId: string, dataUrl: string | undefined) => void
  onSetIllustration: (exerciseId: string, choice: Exercise['illustration']) => void
  /** Sections ajoutées par les étapes suivantes (calendrier, bilan). */
  extraSections?: { id: string; label: string; render: (open: (v: View) => void) => React.ReactNode }[]
}

const dayLabel = (ms: number) => new Date(ms).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
const monthLabel = (ms: number) => {
  const s = new Date(ms).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}
const isTimed = (e: { target: { seconds?: number } }) => (e.target.seconds ?? 0) > 0

/** Onglet Suivi : séances passées (modifiables) et fiche de chaque exercice. */
export function Suivi({ program, history, onSaveLog, onDeleteLog, photos, onSetPhoto, onSetIllustration, extraSections = [] }: Props) {
  const nav = useNavStack<View>()
  const [section, setSection] = useState<string>('seances')

  if (nav.view?.kind === 'log') {
    const log = history.find((l) => l.id === nav.view?.id)
    if (log) {
      return (
        <LogEditor
          key={log.id}
          program={program}
          log={log}
          onBack={nav.back}
          onSave={(l) => {
            onSaveLog(l)
            nav.back()
          }}
          onDelete={() => {
            onDeleteLog(log.id)
            nav.back()
          }}
        />
      )
    }
  }
  if (nav.view?.kind === 'exercise') {
    return (
      <ExerciseSheet
        program={program}
        history={history}
        exerciseId={nav.view.id}
        photo={photos[nav.view.id]}
        onSetPhoto={onSetPhoto}
        onSetIllustration={onSetIllustration}
        onBack={nav.back}
        onOpenLog={(id) => nav.push({ kind: 'log', id })}
      />
    )
  }

  const sections: { id: string; label: string }[] = [{ id: 'seances', label: 'Séances' }, { id: 'exercices', label: 'Exercices' }, ...extraSections]
  const extra = extraSections.find((s) => s.id === section)

  return (
    <main className="screen">
      <header>
        <h1>Suivi</h1>
      </header>
      <div className="segmented" role="tablist">
        {sections.map((s) => (
          <button key={s.id} role="tab" aria-selected={section === s.id} className={section === s.id ? 'on' : undefined} onClick={() => setSection(s.id as Section)}>
            {s.label}
          </button>
        ))}
      </div>
      {section === 'seances' && <LogList program={program} history={history} onOpen={(id) => nav.push({ kind: 'log', id })} />}
      {section === 'exercices' && <ExerciseList program={program} history={history} onOpen={(id) => nav.push({ kind: 'exercise', id })} />}
      {extra?.render(nav.push)}
    </main>
  )
}

function LogList({ program, history, onOpen }: { program: Program; history: WorkoutLog[]; onOpen: (id: string) => void }) {
  if (!history.length) return <p className="panel muted">Tes séances terminées apparaîtront ici.</p>
  const groups: { month: string; logs: WorkoutLog[] }[] = []
  for (const log of sortedHistory(history)) {
    const month = monthLabel(log.startedAt)
    if (groups.at(-1)?.month !== month) groups.push({ month, logs: [] })
    groups.at(-1)!.logs.push(log)
  }
  return (
    <>
      {groups.map((g) => (
        <section key={g.month} className="list-group">
          <p className="kicker plain">{g.month}</p>
          <div className="list">
            {g.logs.map((log) => {
              const rating = averageRating(log.ratings.map((r) => r.rating))
              const session = program.sessions.find((s) => s.id === log.sessionId)
              return (
                <button key={log.id} className="list-item" onClick={() => onOpen(log.id)}>
                  <span className="list-main">
                    <span className="block-title">{session?.name ?? log.sessionName}</span>
                    <span className="muted small">
                      {dayLabel(log.startedAt)} · {setsDone(log)} séries{rating ? ` · ressenti ${rating}/5` : ''}
                      {isNotebookLog(log.id) ? ' · carnet' : ''}
                    </span>
                  </span>
                  <IconChevron size={18} />
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </>
  )
}

function ExerciseList({ program, history, onOpen }: { program: Program; history: WorkoutLog[]; onOpen: (id: string) => void }) {
  const practiced = practicedExercises(history).filter((e) => program.exercises[e.exerciseId])
  const others = Object.values(program.exercises)
    .filter((e) => !practiced.some((p) => p.exerciseId === e.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    .map((e) => ({ exerciseId: e.id, count: 0 }))
  const list = [...practiced, ...others]
  return (
    <div className="list">
      {list.map(({ exerciseId, count }) => {
        const record = personalRecord(history, exerciseId)
        const ex = program.exercises[exerciseId]
        return (
          <button key={exerciseId} className="list-item" onClick={() => onOpen(exerciseId)}>
            <span className="list-main">
              <span className="block-title">{ex.name}</span>
              <span className="muted small">
                {count ? `${count} séance${count > 1 ? 's' : ''}` : 'jamais fait'}
                {record ? ` · record ${formatResults([record.best], ex.kind === 'time' ? 's' : 'reps')}` : ''}
              </span>
            </span>
            <IconChevron size={18} />
          </button>
        )
      })}
    </div>
  )
}

type SheetProps = {
  program: Program
  history: WorkoutLog[]
  exerciseId: string
  photo: Photo | undefined
  onSetPhoto: Props['onSetPhoto']
  onSetIllustration: Props['onSetIllustration']
  onBack: () => void
  onOpenLog: (id: string) => void
}

const ILLUSTRATION_LABEL = { photo: 'ta photo', free: 'image libre', picto: 'pictogramme' }

function ExerciseSheet({ program, history, exerciseId, photo, onSetPhoto, onSetIllustration, onBack, onOpenLog }: SheetProps) {
  const ex = program.exercises[exerciseId]
  const fileInput = useRef<HTMLInputElement>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const info = EXERCISE_INFO[exerciseId]
  const instructions = ex?.instructions ?? info?.instructions
  const choices: [NonNullable<Exercise['illustration']>, string][] = [
    ['auto', 'Automatique'],
    ...(info?.image ? [['free', 'Image libre'] as [NonNullable<Exercise['illustration']>, string]] : []),
    ['picto', 'Pictogramme'],
    ...(photo?.dataUrl ? [['photo', 'Ma photo'] as [NonNullable<Exercise['illustration']>, string]] : []),
  ]
  const shown = ex ? resolveIllustration(ex, photo) : 'picto'
  const sessions = exerciseSessions(history, exerciseId)
  const record = personalRecord(history, exerciseId)
  const points = progressPoints(history, exerciseId)
  const loaded = sessions.some((s) => (s.best.loadKg ?? 0) > 0)
  const unit = loaded ? 'kg' : ex?.kind === 'time' ? 's' : 'reps'
  const timed = ex?.kind === 'time'

  return (
    <main className="screen">
      <header className="screen-head">
        <button className="icon-btn" onClick={onBack} aria-label="Retour">
          <IconBack />
        </button>
        <h1>{ex?.name ?? exerciseId}</h1>
      </header>
      {ex && <Illustration exercise={ex} photo={photo} />}
      {instructions && (
        <section className="panel">
          <h2>Consignes</h2>
          <p>{instructions}</p>
        </section>
      )}
      {ex && (
        <section className="panel">
          <h2>Image</h2>
          <div className="chips">
            {choices.map(([value, label]) => {
              const on = (ex.illustration ?? 'auto') === value
              return (
                <button key={value} className={on ? 'chip on' : 'chip'} aria-pressed={on} onClick={() => onSetIllustration(ex.id, value)}>
                  {label}
                </button>
              )
            })}
          </div>
          <p className="muted small">
            Affichée : {ILLUSTRATION_LABEL[shown]}
            {info?.image && shown === 'free' ? ` (« ${info.image.title} », ${info.image.author}, ${info.image.license})` : ''}
          </p>
          <div className="row-buttons">
            <button className="secondary" onClick={() => fileInput.current?.click()}>
              {photo?.dataUrl ? 'Changer ma photo' : 'Ajouter ma photo'}
            </button>
            {photo?.dataUrl && (
              <button
                className="secondary"
                onClick={() => {
                  if (window.confirm('Supprimer ta photo pour cet exercice ?')) onSetPhoto(ex.id, undefined)
                }}
              >
                Supprimer ma photo
              </button>
            )}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            hidden
            aria-label="Choisir une photo"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              try {
                setPhotoError(null)
                onSetPhoto(ex.id, await photoToDataUrl(file))
                onSetIllustration(ex.id, 'photo')
              } catch {
                setPhotoError('Impossible de lire cette image.')
              }
            }}
          />
          {photoError && <p className="error-text">{photoError}</p>}
        </section>
      )}
      {record && (
        <section className="panel record">
          <p className="kicker plain">Record</p>
          <p className="record-value">{formatResults([record.best], timed ? 's' : 'reps')}</p>
          <p className="muted small">le {dayLabel(record.log.startedAt)}</p>
        </section>
      )}
      {sessions.length > 0 && (
      <section className="panel">
        <h2>Évolution</h2>
        <p className="muted small">{loaded ? 'Lest de la meilleure série à chaque séance' : `Meilleure série à chaque séance (${unit})`}</p>
        <LineChart points={points} unit={unit} label={`Évolution de ${ex?.name ?? exerciseId}`} />
      </section>
      )}
      {sessions.length > 0 && (
      <section className="panel">
        <h2>Historique</h2>
        <ul className="rows">
          {[...sessions].reverse().map((s) => (
            <li key={`${s.log.id}-${s.exercise.key}`}>
              <button className="row-link" onClick={() => onOpenLog(s.log.id)}>
                <span>{dayLabel(s.log.startedAt)}</span>
                <span className="target">{formatResults(s.exercise.results, timed ? 's' : 'reps')}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      )}
    </main>
  )
}

const toDateInput = (ms: number) => {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function LogEditor({ program, log, onBack, onSave, onDelete }: { program: Program; log: WorkoutLog; onBack: () => void; onSave: (l: WorkoutLog) => void; onDelete: () => void }) {
  const [draft, setDraft] = useState(log)
  const session = program.sessions.find((s) => s.id === log.sessionId)
  const circuits = [...new Set(draft.exercises.filter((e) => e.circuitId).map((e) => e.circuitId!))]

  const setResult = (exIndex: number, set: number, raw: string) => {
    setDraft((d) => ({
      ...d,
      exercises: d.exercises.map((e, i) => {
        if (i !== exIndex) return e
        const results = [...e.results]
        const value = raw === '' ? null : Math.max(0, Math.round(Number(raw)))
        results[set] = value === null || Number.isNaN(value) ? null : ({ ...(results[set] ?? {}), value } as SetResult)
        return { ...e, results }
      }),
    }))
  }

  const setRating = (circuitId: string, round: number, rating: number | null) =>
    setDraft((d) => ({
      ...d,
      ratings: [...d.ratings.filter((r) => !(r.circuitId === circuitId && r.round === round)), ...(rating ? [{ circuitId, round, rating }] : [])],
    }))

  const setDate = (value: string) => {
    if (!value) return
    const [y, m, day] = value.split('-').map(Number)
    const old = new Date(draft.startedAt)
    const startedAt = new Date(y, m - 1, day, old.getHours(), old.getMinutes()).getTime()
    const shift = startedAt - draft.startedAt
    setDraft((d) => ({ ...d, startedAt, endedAt: d.endedAt ? d.endedAt + shift : d.endedAt }))
  }

  return (
    <main className="screen">
      <header className="screen-head">
        <button className="icon-btn" onClick={onBack} aria-label="Retour">
          <IconBack />
        </button>
        <h1>{session?.name ?? log.sessionName}</h1>
      </header>
      <label className="field">
        <span>Date</span>
        <input type="date" value={toDateInput(draft.startedAt)} onChange={(e) => setDate(e.target.value)} />
      </label>

      {draft.exercises.map((e, i) => {
        const ex = program.exercises[e.exerciseId]
        return (
          <section key={e.key} className="panel">
            <p className="kicker plain">
              {e.part === 'skill' ? 'Technique' : (program.circuits.find((c) => c.id === e.circuitId)?.name ?? 'Circuit')} · objectif {ex ? formatTarget(ex.kind, e.target) : ''}
            </p>
            <h2>{ex?.name ?? e.exerciseId}</h2>
            <div className="set-inputs">
              {e.results.map((r, set) => (
                <label key={set} className="set-input">
                  <span className="muted small">{e.part === 'skill' ? `S${set + 1}` : `T${set + 1}`}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={r?.value ?? ''}
                    aria-label={`${ex?.name ?? e.exerciseId}, ${e.part === 'skill' ? 'série' : 'tour'} ${set + 1}${isTimed(e) ? ' (secondes)' : ''}`}
                    onChange={(ev) => setResult(i, set, ev.target.value)}
                  />
                </label>
              ))}
            </div>
            {e.results.some((r) => r?.loadKg) && <p className="muted small">Lest : +{e.results.find((r) => r?.loadKg)?.loadKg} kg</p>}
          </section>
        )
      })}

      {circuits.map((circuitId) => {
        const rounds = Math.max(...draft.exercises.filter((e) => e.circuitId === circuitId).map((e) => e.results.length))
        return (
          <section key={circuitId} className="panel">
            <p className="kicker plain">Ressenti · {program.circuits.find((c) => c.id === circuitId)?.name ?? circuitId}</p>
            <div className="set-inputs">
              {Array.from({ length: rounds }, (_, round) => {
                const value = draft.ratings.find((r) => r.circuitId === circuitId && r.round === round)?.rating
                return (
                  <label key={round} className="set-input">
                    <span className="muted small">T{round + 1}</span>
                    <select value={value ?? ''} aria-label={`Ressenti du tour ${round + 1}`} onChange={(ev) => setRating(circuitId, round, ev.target.value ? Number(ev.target.value) : null)}>
                      <option value="">–</option>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                )
              })}
            </div>
          </section>
        )
      })}

      <label className="field">
        <span>Commentaire</span>
        <textarea rows={3} value={draft.comment} onChange={(e) => setDraft((d) => ({ ...d, comment: e.target.value }))} />
      </label>
      <button className="cta" onClick={() => onSave(draft)}>
        Enregistrer les modifications
      </button>
      <button
        className="danger wide"
        onClick={() => {
          if (window.confirm('Supprimer définitivement cette séance ?')) onDelete()
        }}
      >
        Supprimer la séance
      </button>
    </main>
  )
}
