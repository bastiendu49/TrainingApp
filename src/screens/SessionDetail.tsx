import { formatDuration, formatTarget } from '../domain/format'
import type { Program } from '../domain/types'
import { IconBack } from '../lib/icons'

type Props = {
  program: Program
  sessionId: string
  onBack: () => void
}

/** Tout le contenu d'une séance : échauffement, niveau de technique, circuits. */
export function SessionDetail({ program, sessionId, onBack }: Props) {
  const session = program.sessions.find((s) => s.id === sessionId)
  if (!session) return null

  const warmup = program.warmups.find((w) => w.id === session.warmupId)
  const skill = program.skills.find((s) => s.id === session.skillId)
  const circuits = session.circuitIds.map((id) => program.circuits.find((c) => c.id === id)).filter((c) => c !== undefined)
  const ex = (id: string) => program.exercises[id]

  return (
    <main className="screen">
      <header className="screen-head">
        <button className="icon-btn" onClick={onBack} aria-label="Retour">
          <IconBack />
        </button>
        <h1>{session.name}</h1>
      </header>

      {warmup && (
        <section className="panel warm">
          <p className="kicker">Échauffement · {warmup.maxMinutes} min max</p>
          <h2>{warmup.name}</h2>
          <ul className="rows">
            {warmup.items.map((item) => (
              <li key={item.id}>
                <span>{item.label}</span>
                <span className="muted">{item.detail}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {skill && (
        <section className="panel tech">
          <p className="kicker">Technique</p>
          <h2>{skill.name}</h2>
          {skill.levels.map((level, i) => {
            const e = ex(level.exerciseId)
            if (i < skill.currentLevel) return null
            const current = i === skill.currentLevel
            return (
              <div key={level.exerciseId} className={current ? 'level current' : 'level'}>
                <p className="level-name">
                  {current ? 'Niveau actuel : ' : ''}
                  {e.name}
                  {level.optional ? <span className="tag">optionnel</span> : null}
                </p>
                {current && (
                  <p className="small">
                    {level.sets} séries · {formatTarget(e.kind, level.target)} · repos {formatDuration(level.restSeconds)}
                  </p>
                )}
                <p className="muted small">Pour valider : {level.criterion}</p>
              </div>
            )
          })}
        </section>
      )}

      {circuits.map((c) => (
        <section className="panel circ" key={c.id}>
          <p className="kicker">Circuit · {c.rounds} tours</p>
          <h2>{c.name}</h2>
          <p className="muted small">
            Repos entre exercices : {formatDuration(c.restBetweenExercises)} · entre tours : {formatDuration(c.restBetweenRounds)}
          </p>
          <ul className="rows">
            {c.items.map((item, i) => (
              <li key={`${item.exerciseId}-${i}`}>
                <span>{ex(item.exerciseId).name}</span>
                <span className="target">{formatTarget(ex(item.exerciseId).kind, item.target)}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  )
}
