import { useState } from 'react'
import { formatDuration, formatTarget } from '../domain/format'
import { sortedHistory, type WorkoutLog } from '../domain/log'
import { nextSession, weekDays } from '../domain/schedule'
import type { ActiveSession } from '../domain/session'
import type { Program } from '../domain/types'
import { IconChevron } from '../lib/icons'

const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

type Props = {
  program: Program
  history: WorkoutLog[]
  active: ActiveSession | null
  onOpenSession: (sessionId: string) => void
  onStart: (sessionId: string) => void
  onResume: () => void
}

/** Accueil : la séance proposée aujourd'hui, ses trois parties et le bouton pour la lancer. */
export function Today({ program, history, active, onOpenSession, onStart, onResume }: Props) {
  const [now] = useState(() => new Date())
  const sorted = sortedHistory(history)
  const suggested = nextSession(program.sessions, sorted[0]?.sessionId)
  const [chosenId, setChosenId] = useState(suggested.id)
  const session = program.sessions.find((s) => s.id === chosenId) ?? suggested
  const index = program.sessions.indexOf(session)

  const warmup = program.warmups.find((w) => w.id === session.warmupId)
  const skill = program.skills.find((s) => s.id === session.skillId)
  const level = skill?.levels[skill.currentLevel]
  const circuits = session.circuitIds.map((id) => program.circuits.find((c) => c.id === id)).filter((c) => c !== undefined)

  const date = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const todayKey = now.toDateString()
  const doneDays = new Set(history.map((l) => new Date(l.startedAt).toDateString()))

  return (
    <main className="screen">
      <header>
        <p className="date">{date.charAt(0).toUpperCase() + date.slice(1)}</p>
        <h1>{session.name}</h1>
        <p className="muted">
          Séance {index + 1} sur {program.sessions.length}
          {session.id === suggested.id ? ' · proposée aujourd’hui' : ''}
        </p>
      </header>

      <div className="week" aria-label="Semaine en cours">
        {weekDays(now).map((d, i) => {
          const key = d.toDateString()
          const cls = ['day', key === todayKey ? 'today' : '', doneDays.has(key) ? 'done' : ''].join(' ').trim()
          return (
            <span key={key} className={cls} aria-label={doneDays.has(key) ? `${DAY_LETTERS[i]} : séance faite` : undefined}>
              {DAY_LETTERS[i]}
            </span>
          )
        })}
      </div>

      {active && (
        <button className="resume" onClick={onResume}>
          <span className="ring-icon circ" aria-hidden="true" />
          <span>
            <span className="kicker">Séance en cours</span>
            <span className="block-title">{active.log.sessionName}</span>
          </span>
          <span className="resume-go">Reprendre</span>
        </button>
      )}

      <div className="blocks">
        {warmup && (
          <div className="block warm">
            <span className="ring-icon" aria-hidden="true" />
            <div>
              <p className="kicker">Échauffement</p>
              <p className="block-title">{warmup.name}</p>
              <p className="muted small">
                {warmup.items.length} exercices · {warmup.maxMinutes} min max
              </p>
            </div>
          </div>
        )}
        {skill && level && (
          <div className="block tech">
            <span className="ring-icon" aria-hidden="true" />
            <div>
              <p className="kicker">Technique · {skill.name}</p>
              <p className="block-title">{program.exercises[level.exerciseId].name}</p>
              <p className="muted small">
                {level.sets} séries · {formatTarget(program.exercises[level.exerciseId].kind, level.target)}
              </p>
            </div>
          </div>
        )}
        {circuits.map((c) => (
          <div className="block circ" key={c.id}>
            <span className="ring-icon" aria-hidden="true" />
            <div>
              <p className="kicker">Circuit</p>
              <p className="block-title">{c.name}</p>
              <p className="muted small">
                {c.items.length} {c.items.length > 1 ? 'exercices' : 'exercice'} × {c.rounds} tours
                {c.restBetweenExercises > 0 ? ` · repos ${formatDuration(c.restBetweenExercises)}` : ''}
              </p>
            </div>
          </div>
        ))}
      </div>

      <button className="link-row" onClick={() => onOpenSession(session.id)}>
        Voir le détail de la séance <IconChevron size={18} />
      </button>

      {!active && (
        <button className="cta" onClick={() => onStart(session.id)}>
          Démarrer la séance
        </button>
      )}

      <section className="other">
        <p className="kicker plain">Faire une autre séance</p>
        <div className="chips">
          {program.sessions.map((s) => (
            <button key={s.id} className={s.id === session.id ? 'chip on' : 'chip'} aria-pressed={s.id === session.id} onClick={() => setChosenId(s.id)}>
              {s.name}
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}
