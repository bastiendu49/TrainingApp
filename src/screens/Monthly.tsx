import { useState } from 'react'
import { BODY_METRICS, type BodyEntry } from '../domain/body'
import type { WorkoutLog } from '../domain/log'
import { calendarGrid, monthlyReport, monthRange } from '../domain/report'
import { progressPoints } from '../domain/stats'
import type { Program } from '../domain/types'
import { LineChart } from '../lib/LineChart'

type Open = (v: { kind: 'log'; id: string } | { kind: 'exercise'; id: string }) => void

const monthTitle = (y: number, m: number) => {
  const s = new Date(y, m, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}
const num = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',')

/** Mois affiché, avec flèches précédent / suivant (pas au-delà du mois en cours). */
function useMonth() {
  const [now] = useState(() => new Date())
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const shift = (d: number) => setYm(({ y, m }) => ({ y: new Date(y, m + d, 1).getFullYear(), m: new Date(y, m + d, 1).getMonth() }))
  const isCurrent = ym.y === now.getFullYear() && ym.m === now.getMonth()
  return { ...ym, shift, isCurrent, now }
}

function MonthNav({ y, m, shift, isCurrent }: { y: number; m: number; shift: (d: number) => void; isCurrent: boolean }) {
  return (
    <div className="month-nav">
      <button className="icon-btn" onClick={() => shift(-1)} aria-label="Mois précédent">
        ‹
      </button>
      <h2>{monthTitle(y, m)}</h2>
      <button className="icon-btn" onClick={() => shift(1)} aria-label="Mois suivant" disabled={isCurrent}>
        ›
      </button>
    </div>
  )
}

/** Couleur et initiale d'une séance dans le calendrier. */
const SESSION_STYLE: Record<string, { cls: string; short: string }> = {
  push: { cls: 'circ', short: 'P' },
  'pull-a': { cls: 'tech', short: 'PA' },
  jambes: { cls: 'warm', short: 'J' },
  epaules: { cls: 'ink', short: 'É' },
}

export function CalendarView({ program, history, open }: { program: Program; history: WorkoutLog[]; open: Open }) {
  const { y, m, shift, isCurrent, now } = useMonth()
  const [from, to] = monthRange(y, m)
  const inMonth = history.filter((l) => l.startedAt >= from && l.startedAt < to)
  const byDay = new Map<string, WorkoutLog[]>()
  for (const l of inMonth) {
    const key = new Date(l.startedAt).toDateString()
    byDay.set(key, [...(byDay.get(key) ?? []), l])
  }

  return (
    <section className="panel">
      <MonthNav y={y} m={m} shift={shift} isCurrent={isCurrent} />
      <div className="calendar" role="grid" aria-label={`Séances de ${monthTitle(y, m)}`}>
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <span key={i} className="cal-head" aria-hidden="true">
            {d}
          </span>
        ))}
        {calendarGrid(y, m).map((d, i) => {
          if (!d) return <span key={`vide-${i}`} />
          const logs = byDay.get(d.toDateString()) ?? []
          const today = d.toDateString() === now.toDateString()
          if (!logs.length) {
            return (
              <span key={d.getDate()} className={today ? 'cal-day today' : 'cal-day'}>
                {d.getDate()}
              </span>
            )
          }
          const style = SESSION_STYLE[logs[0].sessionId] ?? { cls: 'accent', short: '•' }
          const name = program.sessions.find((s) => s.id === logs[0].sessionId)?.name ?? logs[0].sessionName
          return (
            <button key={d.getDate()} className={`cal-day done ${style.cls}`} onClick={() => open({ kind: 'log', id: logs[0].id })} aria-label={`${d.getDate()} : ${name}`}>
              <span>{d.getDate()}</span>
              <small>{style.short}</small>
            </button>
          )
        })}
      </div>
      <p className="muted small">
        {inMonth.length} séance{inMonth.length > 1 ? 's' : ''} ce mois-ci
      </p>
      <div className="legend">
        {program.sessions.map((s) => (
          <span key={s.id} className={`legend-item ${SESSION_STYLE[s.id]?.cls ?? 'accent'}`}>
            {s.name}
          </span>
        ))}
      </div>
    </section>
  )
}

export function MonthlyReportView({ program, history, body, open }: { program: Program; history: WorkoutLog[]; body: BodyEntry[]; open: Open }) {
  const { y, m, shift, isCurrent } = useMonth()
  const report = monthlyReport(history, body, y, m)
  const [from, to] = monthRange(y, m)
  const diff = report.sessions - report.sessionsPreviousMonth
  const unitOf = (id: string, loaded: boolean) => (loaded ? 'kg' : program.exercises[id]?.kind === 'time' ? 's' : 'reps')
  const top = report.exercises.filter((e) => e.delta > 0).slice(0, 3)
  // Courbes : du point de départ (fin du mois précédent) à la fin du mois.
  const pointsFor = (id: string) => {
    const all = progressPoints(history, id)
    const before = all.filter((p) => p.x < from).at(-1)
    return [...(before ? [before] : []), ...all.filter((p) => p.x >= from && p.x < to)]
  }

  return (
    <>
      <section className="panel">
        <MonthNav y={y} m={m} shift={shift} isCurrent={isCurrent} />
        <div className="summary-tiles">
          <div>
            <strong>{report.sessions}</strong>
            <span className="muted small">séances {diff !== 0 && report.sessionsPreviousMonth ? `(${diff > 0 ? '+' : ''}${diff})` : ''}</span>
          </div>
          <div>
            <strong>{report.sets}</strong>
            <span className="muted small">séries</span>
          </div>
          <div>
            <strong>{report.rating ? `${report.rating}/5` : '–'}</strong>
            <span className="muted small">ressenti</span>
          </div>
        </div>
      </section>

      {report.exercises.length > 0 ? (
        <section className="panel">
          <h2>Début du mois → maintenant</h2>
          <p className="muted small">Meilleure série de ta dernière séance avant le mois, comparée à ta dernière séance du mois.</p>
          <ul className="rows">
            {report.exercises.map((e) => {
              const unit = unitOf(e.exerciseId, e.loaded)
              const v = (r: { value: number; loadKg?: number }) => (e.loaded ? `${num(r.loadKg ?? 0)} kg` : `${r.value}${unit === 's' ? ' s' : ''}`)
              return (
                <li key={e.exerciseId}>
                  <button className="row-link" onClick={() => open({ kind: 'exercise', id: e.exerciseId })}>
                    <span>{program.exercises[e.exerciseId]?.name ?? e.exerciseId}</span>
                    <span className="progress-cell">
                      {v(e.start)} → {v(e.now)}
                      <span className={e.delta > 0 ? 'delta up' : e.delta < 0 ? 'delta down' : 'delta'}>
                        {e.delta > 0 ? '+' : ''}
                        {num(e.delta)}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ) : (
        <p className="panel muted">Aucune séance ce mois-ci.</p>
      )}

      {top.map((e) => (
        <section key={e.exerciseId} className="panel">
          <h2>{program.exercises[e.exerciseId]?.name}</h2>
          <LineChart points={pointsFor(e.exerciseId)} unit={unitOf(e.exerciseId, e.loaded)} label={`Évolution de ${program.exercises[e.exerciseId]?.name} ce mois-ci`} />
        </section>
      ))}

      {report.body.length > 0 && (
        <section className="panel">
          <h2>Corps</h2>
          <ul className="rows">
            {report.body.map((b) => {
              const meta = BODY_METRICS.find((x) => x.key === b.metric)!
              const d = b.now - b.start
              return (
                <li key={b.metric}>
                  <span>{meta.label}</span>
                  <span className="progress-cell">
                    {num(b.start)} → {num(b.now)} {meta.unit}
                    <span className="delta">
                      {d > 0 ? '+' : ''}
                      {num(d)}
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </>
  )
}
