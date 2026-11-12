import { useEffect, useRef, useState } from 'react'
import { EXERCISE_INFO } from '../data/exerciseInfo'
import type { Photo } from '../domain/backup'
import { formatDuration, formatTarget } from '../domain/format'
import { averageRating, formatResults, lastPerformance, RATING_LABELS, ratingLabel, type SetResult, type WorkoutLog } from '../domain/log'
import {
  adjustRest,
  correctResult,
  finishLog,
  goToFinish,
  justDone,
  next,
  progress,
  rateRound,
  ratingOf,
  recordAndNext,
  restFollows,
  startWork,
  suggestedValue,
  toggleWarmupItem,
  upcomingExercise,
  type ActiveSession,
  type Step,
  type Timer,
} from '../domain/session'
import type { Program } from '../domain/types'
import { countdownBeep, go, metronomeTick, testSound, unlockAudio } from '../lib/audio'
import { Illustration } from '../lib/Illustration'
import { formatClock } from '../lib/time'
import { useWakeLock } from '../lib/useWakeLock'

type Update = (fn: (a: ActiveSession) => ActiveSession) => void

export type SoundSettings = { volume: number; metronome: boolean }

type Props = {
  program: Program
  history: WorkoutLog[]
  photos: Record<string, Photo>
  active: ActiveSession
  update: Update
  sound: SoundSettings
  onSound: (s: SoundSettings) => void
  onSave: (log: WorkoutLog) => void
  onAbort: () => void
  /** Revenir à l'accueil sans arrêter la séance. */
  onMinimize: () => void
}

/** Bips de fin : 5 dernières secondes d'un exercice en durée, 3 dernières d'un repos ou d'une préparation. */
const COUNTDOWN_FROM = { work: 5, rest: 3, prep: 3 } as const

/** La séance guidée : tout s'enchaîne seul, il suffit d'appuyer sur « Terminé » à chaque exercice. */
export function Guided({ program, history, photos, active, update, sound, onSound, onSave, onAbort, onMinimize }: Props) {
  useWakeLock()
  const [now, setNow] = useState(() => Date.now())
  const [menu, setMenu] = useState(false)
  const lastSecond = useRef('')

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(id)
  }, [])

  // Fin d'un compte à rebours : on passe à la suite sans action de l'utilisateur.
  const timer = active.timer
  const fired = useRef('')
  useEffect(() => {
    if (!timer || now < timer.endsAt) return
    const index = active.index
    const firedKey = `${index}-${timer.kind}-${timer.endsAt}`
    if (fired.current === firedKey) return
    fired.current = firedKey
    const same = (a: ActiveSession) => a.index === index && a.timer?.endsAt === timer.endsAt
    // Pas de bip si l'app revient d'arrière-plan longtemps après la fin du compte à rebours.
    if (now - timer.endsAt < 3000) go()
    if (timer.kind === 'rest') update((a) => (same(a) ? next(a, Date.now()) : a))
    else if (timer.kind === 'prep') update((a) => (same(a) ? startWork(a, Date.now()) : a))
    else {
      update((a) => {
        const step = a.steps[a.index]
        if (!same(a) || step.kind !== 'exercise') return a
        const ex = a.log.exercises[step.ex]
        return recordAndNext(a, withLoad(ex.target.seconds ?? 0, ex.target.loadKg), Date.now())
      })
    }
  }, [now, timer, active.index, update])

  // Une fois par seconde : bips de fin, ou tic du métronome pendant un exercice en durée.
  useEffect(() => {
    if (!timer) return
    const remaining = Math.ceil((timer.endsAt - now) / 1000)
    const key = `${active.index}-${timer.kind}-${timer.endsAt}-${remaining}`
    if (remaining < 1 || lastSecond.current === key) return
    lastSecond.current = key
    const total = Math.round((timer.endsAt - timer.startedAt) / 1000)
    if (remaining <= COUNTDOWN_FROM[timer.kind]) countdownBeep(remaining)
    // Pas de tic à la toute première seconde : le bip de départ vient de sonner.
    else if (timer.kind === 'work' && sound.metronome && remaining < total) metronomeTick()
  }, [now, timer, active.index, sound.metronome])

  const act: Update = (fn) => {
    unlockAudio()
    update(fn)
  }

  const step = active.steps[active.index]
  const session = program.sessions.find((s) => s.id === active.log.sessionId)
  const { done, total } = progress(active)

  return (
    <div className="guided">
      <header className="guided-top">
        <span className="muted">{session?.name ?? active.log.sessionName}</span>
        <button className="text-btn" onClick={() => setMenu((m) => !m)} aria-expanded={menu}>
          {menu ? 'Fermer' : 'Options'}
        </button>
      </header>
      {menu && (
        <div className="menu">
          <label className="volume">
            <span>Volume des bips : {Math.round(sound.volume * 100)} %</span>
            <input type="range" min={0} max={100} step={5} value={Math.round(sound.volume * 100)} onChange={(e) => onSound({ ...sound, volume: Number(e.target.value) / 100 })} />
          </label>
          <label className="toggle">
            <input type="checkbox" checked={sound.metronome} onChange={(e) => onSound({ ...sound, metronome: e.target.checked })} />
            <span>Métronome pendant les exercices en durée</span>
          </label>
          <button className="secondary" onClick={testSound}>
            Tester le son
          </button>
          {step.kind !== 'finish' && (
            <button
              className="secondary"
              onClick={() => {
                setMenu(false)
                act((a) => goToFinish(a, Date.now()))
              }}
            >
              Terminer la séance maintenant
            </button>
          )}
          <button className="secondary" onClick={onMinimize}>
            Revenir à l’accueil (la séance reste en cours)
          </button>
          <button
            className="danger"
            onClick={() => {
              if (window.confirm('Abandonner la séance ? Rien ne sera enregistré.')) onAbort()
            }}
          >
            Abandonner la séance
          </button>
        </div>
      )}
      {total > 0 && (
        <div className="segments" aria-label={`${done} exercices faits sur ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <i key={i} className={i < done ? 'on' : undefined} />
          ))}
        </div>
      )}

      {step.kind === 'warmup' && <WarmupStep program={program} active={active} act={act} />}
      {step.kind === 'exercise' && (
        <ExerciseStep key={active.index} program={program} history={history} photos={photos} active={active} step={step} now={now} act={act} />
      )}
      {step.kind === 'rest' && <RestStep key={active.index} program={program} history={history} photos={photos} active={active} step={step} now={now} act={act} />}
      {step.kind === 'rating' && <RatingStep active={active} step={step} act={act} />}
      {step.kind === 'finish' && <FinishStep program={program} active={active} onSave={onSave} />}

      {step.kind !== 'finish' && (
        <footer className="guided-foot">
          <span className="elapsed" aria-label="Temps écoulé depuis le début de la séance">
            ⏱ {formatClock((now - active.log.startedAt) / 1000)}
          </span>
          <span className="muted">
            {done}/{total} exercices
          </span>
        </footer>
      )}
    </div>
  )
}

const withLoad = (value: number, loadKg?: number): SetResult => (loadKg ? { value, loadKg } : { value })

/** Temps restant, borné à la durée totale : l'horloge de rendu peut avoir quelques ms de retard. */
const remainingMs = (timer: Timer, now: number) => Math.max(0, Math.min(timer.endsAt - now, timer.endsAt - timer.startedAt))

type StepProps<K extends Step['kind']> = {
  program: Program
  history: WorkoutLog[]
  active: ActiveSession
  step: Extract<Step, { kind: K }>
  now: number
  act: Update
}

function WarmupStep({ program, active, act }: Omit<StepProps<'warmup'>, 'history' | 'step' | 'now'>) {
  const warmup = program.warmups.find((w) => w.id === active.log.warmupId)
  return (
    <main className="step">
      <p className="kicker warm-t">Échauffement{warmup ? ` · ${warmup.maxMinutes} min max` : ''}</p>
      <h1>{warmup?.name ?? 'Échauffement'}</h1>
      <ul className="checklist">
        {warmup?.items.map((item) => {
          const checked = active.log.warmupDone.includes(item.id)
          return (
            <li key={item.id}>
              <label>
                <input type="checkbox" checked={checked} onChange={() => act((a) => toggleWarmupItem(a, item.id, Date.now()))} />
                <span className="check-label">{item.label}</span>
                <span className="muted">{item.detail}</span>
              </label>
            </li>
          )
        })}
      </ul>
      <button className="cta bottom" onClick={() => act((a) => next(a, Date.now()))}>
        Commencer la séance
      </button>
    </main>
  )
}

function lastLine(history: WorkoutLog[], exerciseId: string, before: number, timed: boolean): string | null {
  const last = lastPerformance(history, exerciseId, before)
  if (!last) return null
  const rating = averageRating(last.ratings)
  return `Dernière fois : ${formatResults(last.exercise.results, timed ? 's' : 'reps')}${rating ? ` — ${ratingLabel(rating).toLowerCase()}` : ''}`
}

/** Compteur − valeur + (reps ou secondes) et lest éventuel. */
function ResultEditor({ value, load, unit, onValue, onLoad, size = 'big' }: { value: number; load?: number; unit: string; onValue: (v: number) => void; onLoad: (l: number | undefined) => void; size?: 'big' | 'medium' }) {
  // Pendant le repos (taille moyenne), pas de lien « Ajouter du lest » : l'écran doit tenir en entier.
  const canAddLoad = size === 'big'
  return (
    <>
      <div className={`stepper ${size}`}>
        <button aria-label="Une de moins" onClick={() => onValue(Math.max(0, value - 1))}>
          −
        </button>
        <span className="big-num" aria-live="polite">
          {value}
        </span>
        <button aria-label="Une de plus" onClick={() => onValue(value + 1)}>
          +
        </button>
      </div>
      <p className="center muted">{unit}</p>
      {load !== undefined ? (
        <div className="load">
          <span>Lest</span>
          <button aria-label="Moins de lest" onClick={() => onLoad(Math.max(0, load - 0.5))}>
            −
          </button>
          <strong>+{load} kg</strong>
          <button aria-label="Plus de lest" onClick={() => onLoad(load + 0.5)}>
            +
          </button>
        </div>
      ) : canAddLoad ? (
        <button className="text-btn center" onClick={() => onLoad(1)}>
          Ajouter du lest
        </button>
      ) : null}
    </>
  )
}

const unitLabel = (kind: string, timed: boolean) => (timed ? 'secondes' : kind === 'repsPerSide' ? 'répétitions par côté' : 'répétitions')

function ExerciseStep({ program, history, photos, active, step, now, act }: StepProps<'exercise'> & { photos: Record<string, Photo> }) {
  const ex = active.log.exercises[step.ex]
  const exercise = program.exercises[ex.exerciseId]
  const timed = (ex.target.seconds ?? 0) > 0
  const suggested = suggestedValue(history, ex, step.set, active.log.startedAt)
  const [value, setValue] = useState(suggested.value)
  const [load, setLoad] = useState<number | undefined>(suggested.loadKg)
  // Repos ensuite : un simple « Terminé », les reps se corrigent pendant le repos.
  const quick = restFollows(active)
  const upcoming = upcomingExercise(active)
  const timer = active.timer
  const last = lastLine(history, ex.exerciseId, active.log.startedAt, timed)
  const instructions = exercise.instructions ?? EXERCISE_INFO[exercise.id]?.instructions
  const [showHelp, setShowHelp] = useState(false)

  return (
    <main className="step">
      <div className="step-head">
        <span>{step.title}</span>
        <span>{step.position}</span>
      </div>
      <Illustration exercise={exercise} photo={photos[exercise.id]} compact />
      <h1 className="ex-name">{exercise.name}</h1>
      {instructions && (
        <>
          <button className="text-btn left" aria-expanded={showHelp} onClick={() => setShowHelp((v) => !v)}>
            {showHelp ? 'Masquer les consignes' : 'Consignes'}
          </button>
          {showHelp && <p className="help">{instructions}</p>}
        </>
      )}

      {timed && timer ? (
        <>
          <p className="goal">Objectif · {formatTarget(exercise.kind, ex.target)}</p>
          <Ring remaining={remainingMs(timer, now)} total={timer.endsAt - timer.startedAt} tone={timer.kind === 'prep' ? 'muted' : 'accent'}>
            <p className="ring-label">{timer.kind === 'prep' ? 'Prépare-toi' : 'Tiens bon'}</p>
            <p className="ring-num">{formatClock(Math.ceil(remainingMs(timer, now) / 1000))}</p>
          </Ring>
          {timer.kind === 'prep' ? (
            <button className="cta" onClick={() => act((a) => startWork(a, Date.now()))}>
              Démarrer maintenant
            </button>
          ) : (
            <button
              className="cta"
              onClick={() => {
                const elapsed = Math.max(0, Math.round((Date.now() - timer.startedAt) / 1000))
                act((a) => recordAndNext(a, withLoad(Math.min(elapsed, ex.target.seconds ?? elapsed), load), Date.now()))
              }}
            >
              Stop
            </button>
          )}
        </>
      ) : quick ? (
        <>
          <div className="target-big">
            <span className="big-num">{exercise.kind === 'max' || exercise.kind === 'failure' ? 'Max' : (ex.target.reps ?? suggested.value)}</span>
            <span className="muted">{exercise.kind === 'repsPerSide' ? 'répétitions par côté' : exercise.kind === 'failure' ? 'jusqu’à l’échec' : 'répétitions'}{ex.target.loadKg ? ` · +${ex.target.loadKg} kg` : ''}</span>
          </div>
          <button className="cta big" onClick={() => act((a) => recordAndNext(a, withLoad(suggested.value, suggested.loadKg), Date.now()))}>
            Terminé
          </button>
          <p className="center muted">Tu ajusteras le nombre de reps pendant le repos.</p>
        </>
      ) : (
        <>
          <p className="goal">Objectif · {formatTarget(exercise.kind, ex.target)}</p>
          <ResultEditor value={value} load={load} unit={unitLabel(exercise.kind, false)} onValue={setValue} onLoad={setLoad} />
          <button className="cta" onClick={() => act((a) => recordAndNext(a, withLoad(value, load || undefined), Date.now()))}>
            Valider
          </button>
        </>
      )}

      {last && <p className="center muted">{last}</p>}
      <div className="step-foot">
        <button className="text-btn" onClick={() => act((a) => recordAndNext(a, null, Date.now()))}>
          Passer cet exercice
        </button>
        {upcoming && <span className="muted">Ensuite : {program.exercises[active.log.exercises[upcoming.ex].exerciseId].name}</span>}
      </div>
    </main>
  )
}

function RatingChips({ value, onPick }: { value: number | null; onPick: (n: number) => void }) {
  return (
    <div className="rating" role="group" aria-label="Difficulté ressentie">
      {RATING_LABELS.map((label, i) => {
        const n = i + 1
        return (
          <button key={n} className={value === n ? 'on' : undefined} aria-pressed={value === n} aria-label={`${n} : ${label}`} onClick={() => onPick(n)}>
            <strong>{n}</strong>
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Pendant le repos : correction du résultat de l'exercice qui vient d'être fait. */
function DoneEditor({ program, active, act }: { program: Program; active: ActiveSession; act: Update }) {
  const done = justDone(active)
  if (!done) return null
  const ex = active.log.exercises[done.ex]
  const exercise = program.exercises[ex.exerciseId]
  const result = ex.results[done.set]
  if (!result) return null
  const timed = (ex.target.seconds ?? 0) > 0
  const set = (r: SetResult) => act((a) => correctResult(a, done.ex, done.set, r, Date.now()))
  return (
    <section className="done-box">
      <p className="done-title">
        <span className="block-title">{exercise.name} : tu as fait</span>
        <span className="muted">objectif {formatTarget(exercise.kind, ex.target)}</span>
      </p>
      <ResultEditor
        size="medium"
        value={result.value}
        load={result.loadKg}
        unit={unitLabel(exercise.kind, timed)}
        onValue={(value) => set(withLoad(value, result.loadKg))}
        onLoad={(loadKg) => set(withLoad(result.value, loadKg || undefined))}
      />
    </section>
  )
}

function RestStep({ program, history, photos, active, step, now, act }: StepProps<'rest'> & { photos: Record<string, Photo> }) {
  const timer = active.timer
  const upcoming = upcomingExercise(active)
  const upEx = upcoming ? active.log.exercises[upcoming.ex] : null
  const upExercise = upEx ? program.exercises[upEx.exerciseId] : null
  const timed = (upEx?.target.seconds ?? 0) > 0
  const last = upEx ? lastLine(history, upEx.exerciseId, active.log.startedAt, timed) : null

  return (
    <main className="step">
      <div className="step-head">
        <span>{step.label}</span>
        <span>{formatDuration(step.seconds)}</span>
      </div>
      <div className="rest-top">
        {timer && (
          <Ring remaining={remainingMs(timer, now)} total={timer.endsAt - timer.startedAt} tone="rest" small>
            <p className="ring-num">{formatClock(Math.ceil(remainingMs(timer, now) / 1000))}</p>
            <p className="ring-label">repos</p>
          </Ring>
        )}
        <div className="adjust vertical">
          <button onClick={() => act((a) => adjustRest(a, 10, Date.now()))}>+10 s</button>
          <button onClick={() => act((a) => adjustRest(a, -10, Date.now()))}>−10 s</button>
          <button onClick={() => act((a) => next(a, Date.now()))}>Passer</button>
        </div>
      </div>
      <DoneEditor program={program} active={active} act={act} />
      {step.rating && (
        <div className="rate-box">
          <p className="block-title">Comment était ce tour ?</p>
          <RatingChips
            value={ratingOf(active.log, step.rating.circuitId, step.rating.round)}
            onPick={(n) => act((a) => rateRound(a, step.rating!.circuitId, step.rating!.round, n, Date.now()))}
          />
        </div>
      )}
      {upcoming && upEx && upExercise && (
        <div className="up-next">
          <div className="up-next-text">
            <p className="kicker plain">Ensuite</p>
            <p className="block-title">{upExercise.name}</p>
            <p className="muted">
              {formatTarget(upExercise.kind, upEx.target)} · {upcoming.position}
            </p>
            {last && <p className="muted">{last}</p>}
          </div>
          <div className="up-next-image">
            <Illustration exercise={upExercise} photo={photos[upExercise.id]} compact />
          </div>
        </div>
      )}
    </main>
  )
}

function RatingStep({ active, step, act }: Omit<StepProps<'rating'>, 'program' | 'history' | 'now'>) {
  return (
    <main className="step">
      <div className="step-head">
        <span>{step.label}</span>
      </div>
      <h1>Comment était ce tour ?</h1>
      <RatingChips value={ratingOf(active.log, step.circuitId, step.round)} onPick={(n) => act((a) => rateRound(a, step.circuitId, step.round, n, Date.now()))} />
      <button className="cta bottom" onClick={() => act((a) => next(a, Date.now()))}>
        Continuer
      </button>
    </main>
  )
}

function FinishStep({ program, active, onSave }: { program: Program; active: ActiveSession; onSave: (log: WorkoutLog) => void }) {
  const [comment, setComment] = useState(active.log.comment)
  const [endedAt] = useState(() => Date.now())
  const minutes = Math.round((endedAt - active.log.startedAt) / 60000)
  const ratings = active.log.ratings.map((r) => r.rating)
  const avg = averageRating(ratings)

  return (
    <main className="step">
      <p className="kicker plain">Séance terminée</p>
      <h1>Bravo !</h1>
      <div className="summary-tiles">
        <div>
          <strong>{minutes} min</strong>
          <span className="muted small">durée</span>
        </div>
        <div>
          <strong>{active.log.exercises.reduce((n, e) => n + e.results.filter((r) => r).length, 0)}</strong>
          <span className="muted small">séries faites</span>
        </div>
        <div>
          <strong>{avg ? ratingLabel(avg) : '–'}</strong>
          <span className="muted small">ressenti moyen</span>
        </div>
      </div>
      <ul className="rows">
        {active.log.exercises.map((e) => (
          <li key={e.key}>
            <span>{program.exercises[e.exerciseId]?.name ?? e.exerciseId}</span>
            <span className="target">{formatResults(e.results, (e.target.seconds ?? 0) > 0 ? 's' : 'reps')}</span>
          </li>
        ))}
      </ul>
      <label className="field">
        <span>Commentaire</span>
        <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Douleur, forme, sensations…" />
      </label>
      <button className="cta" onClick={() => onSave(finishLog(active, comment, endedAt))}>
        Enregistrer la séance
      </button>
    </main>
  )
}

/** Anneau qui se vide avec le temps restant. */
function Ring({ remaining, total, tone, small, children }: { remaining: number; total: number; tone: 'rest' | 'accent' | 'muted'; small?: boolean; children: React.ReactNode }) {
  const r = 86
  const c = 2 * Math.PI * r
  const ratio = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0
  return (
    <div className={small ? 'ring-timer small' : 'ring-timer'}>
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <circle className="ring-bg" cx="100" cy="100" r={r} />
        <circle className={`ring-fg ${tone}`} cx="100" cy="100" r={r} strokeDasharray={`${c * ratio} ${c}`} transform="rotate(-90 100 100)" />
      </svg>
      <div className="ring-content">{children}</div>
    </div>
  )
}
