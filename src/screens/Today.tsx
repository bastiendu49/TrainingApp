import { useState } from 'react'
import { formatDuration, formatTarget } from '../domain/format'
import { nextSession, weekDays } from '../domain/schedule'
import type { Program } from '../domain/types'
import { IconChevron } from '../lib/icons'

const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

type Props = {
  program: Program
  onOpenSession: (sessionId: string) => void
}

/** Accueil : la séance proposée aujourd'hui, ses trois parties et le bouton pour la lancer. */
export function Today({ program, onOpenSession }: Props) {
  const [now] = useState(() => new Date())
  // ponytail: sans historique, la séance proposée est toujours la première ; l'étape 2
  // passera ici l'identifiant de la dernière séance faite.
  const suggested = nextSession(program.sessions)
  const [chosenId, setChosenId] = useState(suggested.id)
  const session = program.sessions.find((s) => s.id === chosenId) ?? suggested
  const index = program.sessions.indexOf(session)

  const warmup = program.warmups.find((w) => w.id === session.warmupId)
  const skill = program.skills.find((s) => s.id === session.skillId)
  const level = skill?.levels[skill.currentLevel]
  const circuits = session.circuitIds.map((id) => program.circuits.find((c) => c.id === id)).filter((c) => c !== undefined)

  const date = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const todayKey = now.toDateString()

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
        {weekDays(now).map((d, i) => (
          <span key={d.toISOString()} className={d.toDateString() === todayKey ? 'day today' : 'day'}>
            {DAY_LETTERS[i]}
          </span>
        ))}
      </div>

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

      <div className="start">
        <button className="cta" disabled>
          Démarrer la séance
        </button>
        <p className="muted small center">La séance guidée arrive à la prochaine étape.</p>
      </div>

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
