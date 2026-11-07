import { useState } from 'react'
import { formatDuration, formatTarget } from '../domain/format'
import type { Circuit, Exercise, ExerciseKind, Program, Target } from '../domain/types'
import { IconBack } from '../lib/icons'

type Change = (fn: (p: Program) => Program) => void

const KINDS: { kind: ExerciseKind; label: string }[] = [
  { kind: 'reps', label: 'Répétitions' },
  { kind: 'repsPerSide', label: 'Répétitions par côté' },
  { kind: 'time', label: 'Durée (chrono)' },
  { kind: 'max', label: 'Max' },
  { kind: 'failure', label: 'Jusqu’à l’échec' },
]

/** Objectif de départ d'un exercice qu'on ajoute, selon son type. */
const defaultTarget = (kind: ExerciseKind): Target => (kind === 'time' ? { seconds: 30 } : kind === 'reps' || kind === 'repsPerSide' ? { reps: 10 } : {})

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/** Bouton − valeur + compact. */
function Stepper({ label, value, step, min, max = Infinity, format, onChange }: { label: string; value: number; step: number; min: number; max?: number; format: (v: number) => string; onChange: (v: number) => void }) {
  return (
    <div className="stepper-row">
      <span>{label}</span>
      <div className="mini-stepper">
        <button aria-label={`${label} : moins`} onClick={() => onChange(Math.max(min, value - step))} disabled={value <= min}>
          −
        </button>
        <strong>{format(value)}</strong>
        <button aria-label={`${label} : plus`} onClick={() => onChange(Math.min(max, value + step))} disabled={value >= max}>
          +
        </button>
      </div>
    </div>
  )
}

/** Objectif modifiable d'un exercice (reps ±1, secondes ±5) ; rien pour « max » ou « échec ». */
function TargetStepper({ exercise, target, onChange }: { exercise: Exercise; target: Target; onChange: (t: Target) => void }) {
  if (exercise.kind === 'time') {
    return <Stepper label={exercise.name} value={target.seconds ?? 30} step={5} min={5} format={(v) => formatDuration(v)} onChange={(seconds) => onChange({ ...target, seconds })} />
  }
  if (exercise.kind === 'reps' || exercise.kind === 'repsPerSide') {
    return <Stepper label={exercise.name} value={target.reps ?? 10} step={1} min={1} format={(v) => formatTarget(exercise.kind, { reps: v })} onChange={(reps) => onChange({ ...target, reps })} />
  }
  return (
    <div className="stepper-row">
      <span>{exercise.name}</span>
      <strong>{formatTarget(exercise.kind, target)}</strong>
    </div>
  )
}

function NewExerciseForm({ program, onCreate }: { program: Program; onCreate: (e: Exercise) => void }) {
  const [name, setName] = useState('')
  const [kind, setKind] = useState<ExerciseKind>('reps')
  const create = () => {
    const clean = name.trim()
    if (!clean) return
    let id = slug(clean) || 'exercice'
    for (let n = 2; program.exercises[id]; n++) id = `${slug(clean)}-${n}`
    onCreate({ id, name: clean, kind })
    setName('')
  }
  return (
    <div className="new-exercise">
      <label className="field">
        <span>Nouvel exercice</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom de l’exercice" />
      </label>
      <label className="field">
        <span>Type</span>
        <select value={kind} onChange={(e) => setKind(e.target.value as ExerciseKind)}>
          {KINDS.map((k) => (
            <option key={k.kind} value={k.kind}>
              {k.label}
            </option>
          ))}
        </select>
      </label>
      <button className="secondary" onClick={create} disabled={!name.trim()}>
        Créer et ajouter
      </button>
    </div>
  )
}

function CircuitEditor({ program, circuit, change }: { program: Program; circuit: Circuit; change: Change }) {
  const [adding, setAdding] = useState('')
  const set = (fn: (c: Circuit) => Circuit) => change((p) => ({ ...p, circuits: p.circuits.map((c) => (c.id === circuit.id ? fn(c) : c)) }))
  const move = (i: number, d: number) =>
    set((c) => {
      const items = [...c.items]
      const j = i + d
      if (j < 0 || j >= items.length) return c
      ;[items[i], items[j]] = [items[j], items[i]]
      return { ...c, items }
    })
  const addItem = (exercise: Exercise) => set((c) => ({ ...c, items: [...c.items, { exerciseId: exercise.id, target: defaultTarget(exercise.kind) }] }))
  const available = Object.values(program.exercises).sort((a, b) => a.name.localeCompare(b.name, 'fr'))

  return (
    <details className="panel editor">
      <summary>
        <span className="kicker circ-t">Circuit</span>
        <span className="block-title">{circuit.name}</span>
        <span className="muted small">
          {circuit.items.length} exercices × {circuit.rounds} tours · repos {formatDuration(circuit.restBetweenExercises)} / {formatDuration(circuit.restBetweenRounds)}
        </span>
      </summary>
      <Stepper label="Tours" value={circuit.rounds} step={1} min={1} max={10} format={String} onChange={(rounds) => set((c) => ({ ...c, rounds }))} />
      <Stepper label="Repos entre exercices" value={circuit.restBetweenExercises} step={5} min={0} max={600} format={formatDuration} onChange={(v) => set((c) => ({ ...c, restBetweenExercises: v }))} />
      <Stepper label="Repos entre tours" value={circuit.restBetweenRounds} step={15} min={0} max={900} format={formatDuration} onChange={(v) => set((c) => ({ ...c, restBetweenRounds: v }))} />
      <p className="kicker plain">Exercices et objectifs</p>
      {circuit.items.map((item, i) => {
        const ex = program.exercises[item.exerciseId]
        if (!ex) return null
        return (
          <div key={`${item.exerciseId}-${i}`} className="item-row">
            <TargetStepper exercise={ex} target={item.target} onChange={(target) => set((c) => ({ ...c, items: c.items.map((it, k) => (k === i ? { ...it, target } : it)) }))} />
            <div className="item-tools">
              <button className="icon-btn" aria-label={`Monter ${ex.name}`} onClick={() => move(i, -1)} disabled={i === 0}>
                ↑
              </button>
              <button className="icon-btn" aria-label={`Descendre ${ex.name}`} onClick={() => move(i, 1)} disabled={i === circuit.items.length - 1}>
                ↓
              </button>
              <button
                className="icon-btn"
                aria-label={`Retirer ${ex.name}`}
                onClick={() => {
                  if (window.confirm(`Retirer « ${ex.name} » du circuit ? Ton historique est conservé.`)) set((c) => ({ ...c, items: c.items.filter((_, k) => k !== i) }))
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )
      })}
      <div className="add-row">
        <select value={adding} onChange={(e) => setAdding(e.target.value)} aria-label="Exercice à ajouter">
          <option value="">Ajouter un exercice…</option>
          {available.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <button
          className="secondary"
          disabled={!adding}
          onClick={() => {
            addItem(program.exercises[adding])
            setAdding('')
          }}
        >
          Ajouter
        </button>
      </div>
      <NewExerciseForm
        program={program}
        onCreate={(e) => {
          change((p) => ({ ...p, exercises: { ...p.exercises, [e.id]: e } }))
          addItem(e)
        }}
      />
    </details>
  )
}

/** Plus › Modifier le programme : circuits, techniques et échauffements. */
export function ProgramEditor({ program, change, onBack }: { program: Program; change: Change; onBack: () => void }) {
  const [label, setLabel] = useState<Record<string, string>>({})
  const [detail, setDetail] = useState<Record<string, string>>({})
  const usedCircuits = new Set(program.sessions.flatMap((s) => s.circuitIds))

  return (
    <main className="screen">
      <header className="screen-head">
        <button className="icon-btn" onClick={onBack} aria-label="Retour">
          <IconBack />
        </button>
        <h1>Programme</h1>
      </header>
      <p className="muted small">Les modifications sont enregistrées tout de suite et s’appliquent aux prochaines séances.</p>

      <h2>Circuits</h2>
      {program.circuits
        .filter((c) => usedCircuits.has(c.id))
        .map((c) => (
          <CircuitEditor key={c.id} program={program} circuit={c} change={change} />
        ))}

      <h2>Techniques</h2>
      {program.skills.map((skill) => (
        <details key={skill.id} className="panel editor">
          <summary>
            <span className="kicker tech-t">Technique</span>
            <span className="block-title">{skill.name}</span>
            <span className="muted small">Niveau actuel : {program.exercises[skill.levels[skill.currentLevel].exerciseId].name}</span>
          </summary>
          {skill.levels.map((level, i) => {
            const ex = program.exercises[level.exerciseId]
            const setLevel = (fn: (l: typeof level) => typeof level) =>
              change((p) => ({ ...p, skills: p.skills.map((s) => (s.id === skill.id ? { ...s, levels: s.levels.map((l, k) => (k === i ? fn(l) : l)) } : s)) }))
            return (
              <div key={level.exerciseId} className={i === skill.currentLevel ? 'level current' : 'level'}>
                <p className="level-name">
                  {i + 1}. {ex.name}
                  {i === skill.currentLevel ? ' (actuel)' : ''}
                </p>
                <Stepper label="Séries" value={level.sets} step={1} min={1} max={12} format={String} onChange={(sets) => setLevel((l) => ({ ...l, sets }))} />
                <TargetStepper exercise={{ ...ex, name: 'Objectif' }} target={level.target} onChange={(target) => setLevel((l) => ({ ...l, target }))} />
                <Stepper label="Repos" value={level.restSeconds} step={15} min={0} max={600} format={formatDuration} onChange={(restSeconds) => setLevel((l) => ({ ...l, restSeconds }))} />
              </div>
            )
          })}
        </details>
      ))}

      <h2>Échauffements</h2>
      {program.warmups.map((w) => (
        <details key={w.id} className="panel editor">
          <summary>
            <span className="kicker warm-t">Échauffement</span>
            <span className="block-title">{w.name}</span>
            <span className="muted small">{w.items.length} exercices</span>
          </summary>
          <ul className="rows">
            {w.items.map((item) => (
              <li key={item.id}>
                <span>
                  {item.label} <span className="muted small">· {item.detail}</span>
                </span>
                <button
                  className="icon-btn"
                  aria-label={`Retirer ${item.label}`}
                  onClick={() => change((p) => ({ ...p, warmups: p.warmups.map((x) => (x.id === w.id ? { ...x, items: x.items.filter((it) => it.id !== item.id) } : x)) }))}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <div className="new-exercise">
            <label className="field">
              <span>Ajouter</span>
              <input value={label[w.id] ?? ''} placeholder="Exercice (ex. Rotations de hanches)" onChange={(e) => setLabel((s) => ({ ...s, [w.id]: e.target.value }))} />
            </label>
            <label className="field">
              <span>Durée ou reps</span>
              <input value={detail[w.id] ?? ''} placeholder="ex. 10 par côté" onChange={(e) => setDetail((s) => ({ ...s, [w.id]: e.target.value }))} />
            </label>
            <button
              className="secondary"
              disabled={!label[w.id]?.trim()}
              onClick={() => {
                const text = label[w.id].trim()
                const id = `${slug(text) || 'exercice'}-${Date.now().toString(36)}`
                change((p) => ({ ...p, warmups: p.warmups.map((x) => (x.id === w.id ? { ...x, items: [...x.items, { id, label: text, detail: detail[w.id]?.trim() ?? '' }] } : x)) }))
                setLabel((s) => ({ ...s, [w.id]: '' }))
                setDetail((s) => ({ ...s, [w.id]: '' }))
              }}
            >
              Ajouter à l’échauffement
            </button>
          </div>
        </details>
      ))}
    </main>
  )
}
