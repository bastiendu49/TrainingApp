import { useState } from 'react'
import { formatTarget } from '../domain/format'
import type { Suggestion } from '../domain/progression'
import type { Program } from '../domain/types'

const kg = (n: number) => `${String(n).replace('.', ',')} kg`
const shortDate = (ms: number) => new Date(ms).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

type SuggestionsProps = {
  program: Program
  suggestions: Suggestion[]
  onApply: (s: Suggestion, toKg?: number) => void
  onDismiss: (key: string) => void
}

/** Propositions de progression, sur l'accueil. */
export function Suggestions({ program, suggestions, onApply, onDismiss }: SuggestionsProps) {
  const [showAll, setShowAll] = useState(false)
  if (!suggestions.length) return null
  const shown = showAll ? suggestions : suggestions.slice(0, 2)
  return (
    <section className="suggestions" aria-label="Propositions de progression">
      <p className="kicker plain">Propositions de progression</p>
      {shown.map((s) => (
        <SuggestionCard key={s.key} program={program} s={s} onApply={onApply} onDismiss={onDismiss} />
      ))}
      {suggestions.length > 2 && (
        <button className="text-btn" onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'Voir moins' : `Voir les ${suggestions.length - 2} autres`}
        </button>
      )}
    </section>
  )
}

function SuggestionCard({ program, s, onApply, onDismiss }: { program: Program; s: Suggestion; onApply: SuggestionsProps['onApply']; onDismiss: SuggestionsProps['onDismiss'] }) {
  const [toKg, setToKg] = useState(s.kind === 'load' ? s.toKg : 0)
  let title: string
  let detail: string | null = null
  if (s.kind === 'target') {
    const ex = program.exercises[s.exerciseId]
    const circuit = program.circuits.find((c) => c.id === s.circuitId)
    title = `${ex.name} : passer à ${formatTarget(ex.kind, s.to)} ?`
    detail = circuit && circuit.items.filter((i) => i.exerciseId === s.exerciseId).length ? `Circuit ${circuit.name}` : null
  } else if (s.kind === 'level') {
    const skill = program.skills.find((k) => k.id === s.skillId)!
    const next = skill.levels[s.toLevel]
    title = `${skill.name} : passer à « ${program.exercises[next.exerciseId].name} » ?`
    detail = `Critère du niveau actuel : ${skill.levels[s.fromLevel].criterion}`
  } else {
    const skill = program.skills.find((k) => k.id === s.skillId)!
    title = `${program.exercises[skill.levels[s.level].exerciseId].name} : augmenter le lest ?`
  }
  return (
    <div className="suggestion">
      <p className="block-title">{title}</p>
      <p className="muted small">{s.evidence}</p>
      {detail && <p className="muted small">{detail}</p>}
      {s.kind === 'load' && (
        <div className="load">
          <span>Nouveau lest</span>
          <button aria-label="Moins de lest" onClick={() => setToKg((v) => Math.max(s.fromKg + 0.5, v - 0.5))}>
            −
          </button>
          <strong>{kg(toKg)}</strong>
          <button aria-label="Plus de lest" onClick={() => setToKg((v) => v + 0.5)}>
            +
          </button>
        </div>
      )}
      <div className="row-buttons">
        <button className="primary" onClick={() => onApply(s, s.kind === 'load' ? toKg : undefined)}>
          Appliquer
        </button>
        <button className="secondary" onClick={() => onDismiss(s.key)}>
          Ignorer
        </button>
      </div>
    </div>
  )
}

/** Échelles de technique : niveau actuel, validation, retour en arrière. */
export function Techniques({ program, onSetLevel }: { program: Program; onSetLevel: (skillId: string, level: number) => void }) {
  return (
    <>
      {program.skills.map((skill) => {
        const level = skill.levels[skill.currentLevel]
        const ex = program.exercises[level.exerciseId]
        const next = skill.levels[skill.currentLevel + 1]
        const prev = skill.levels[skill.currentLevel - 1]
        const since = [...(skill.levelHistory ?? [])].reverse().find((h) => h.level === skill.currentLevel)
        return (
          <section key={skill.id} className="panel tech">
            <p className="kicker">
              Technique · niveau {skill.currentLevel + 1}/{skill.levels.length}
            </p>
            <h2>{skill.name}</h2>
            <div className="level current">
              <p className="level-name">{ex.name}</p>
              <p className="small">
                {level.sets} séries · {formatTarget(ex.kind, level.target)}
              </p>
              <p className="muted small">Pour valider : {level.criterion}</p>
              {since && <p className="muted small">Niveau commencé le {shortDate(since.at)}</p>}
            </div>
            <ol className="ladder">
              {skill.levels.map((l, i) => (
                <li key={l.exerciseId} className={i < skill.currentLevel ? 'done' : i === skill.currentLevel ? 'now' : undefined}>
                  {program.exercises[l.exerciseId].name}
                  {l.optional ? ' (optionnel)' : ''}
                </li>
              ))}
            </ol>
            <div className="row-buttons">
              {next && (
                <button
                  className="primary"
                  onClick={() => {
                    if (window.confirm(`Niveau validé ? Tu passeras à « ${program.exercises[next.exerciseId].name} ».`)) onSetLevel(skill.id, skill.currentLevel + 1)
                  }}
                >
                  Niveau validé
                </button>
              )}
              {prev && (
                <button
                  className="secondary"
                  onClick={() => {
                    if (window.confirm(`Revenir à « ${program.exercises[prev.exerciseId].name} » ?`)) onSetLevel(skill.id, skill.currentLevel - 1)
                  }}
                >
                  Niveau précédent
                </button>
              )}
            </div>
          </section>
        )
      })}
    </>
  )
}
