import { useState } from 'react'
import { BODY_METRICS, type BodyEntry, type BodyMetric } from '../domain/body'
import { LineChart } from '../lib/LineChart'

type Props = {
  body: BodyEntry[]
  onSave: (entry: BodyEntry) => void
  onDelete: (id: string) => void
}

const todayInput = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const num = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',')
const parseNum = (s: string) => {
  const n = Number(s.replace(',', '.'))
  return s.trim() === '' || Number.isNaN(n) || n <= 0 ? undefined : n
}
const dateLabel = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

/** Onglet Corps : poids et mensurations, avec leurs courbes. */
export function Body({ body, onSave, onDelete }: Props) {
  const entries = [...body].sort((a, b) => a.date.localeCompare(b.date))
  const [metric, setMetric] = useState<BodyMetric>('weight')
  const [formOpen, setFormOpen] = useState(false)
  const [date, setDate] = useState(todayInput)
  const [values, setValues] = useState<Partial<Record<BodyMetric, string>>>({})
  const [message, setMessage] = useState<string | null>(null)

  const latest = (k: BodyMetric) => [...entries].reverse().find((e) => e[k] !== undefined)?.[k]
  const first = (k: BodyMetric) => entries.find((e) => e[k] !== undefined)?.[k]

  const save = () => {
    const parsed: Partial<Record<BodyMetric, number>> = {}
    for (const m of BODY_METRICS) {
      const v = parseNum(values[m.key] ?? '')
      if (v !== undefined) parsed[m.key] = v
    }
    if (!Object.keys(parsed).length) {
      setMessage('Renseigne au moins une mesure.')
      return
    }
    // Une entrée par jour : une nouvelle mesure le même jour complète celle qui existe.
    const existing = body.find((e) => e.date === date)
    onSave({ ...(existing ?? { id: `corps-${date}`, date, updatedAt: 0 }), ...parsed })
    setValues({})
    setFormOpen(false)
    setMessage(existing ? 'Mesure du jour complétée.' : 'Mesure enregistrée.')
  }

  const points = entries.filter((e) => e[metric] !== undefined).map((e) => ({ x: new Date(`${e.date}T12:00:00`).getTime(), y: e[metric]! }))
  const meta = BODY_METRICS.find((m) => m.key === metric)!

  return (
    <main className="screen">
      <header>
        <h1>Corps</h1>
      </header>

      <div className="summary-tiles">
        {(['weight', 'fat', 'waist'] as BodyMetric[]).map((k) => {
          const m = BODY_METRICS.find((x) => x.key === k)!
          const l = latest(k)
          const f = first(k)
          const d = l !== undefined && f !== undefined ? l - f : 0
          return (
            <div key={k}>
              <strong>{l !== undefined ? `${num(l)} ${m.unit}` : '–'}</strong>
              <span className="muted small">{m.label}</span>
              {l !== undefined && entries.filter((e) => e[k] !== undefined).length > 1 && (
                <span className="small">
                  {d > 0 ? '+' : ''}
                  {num(d)} depuis le début
                </span>
              )}
            </div>
          )
        })}
      </div>

      {formOpen ? (
        <section className="panel">
          <h2>Nouvelle mesure</h2>
          <label className="field">
            <span>Date</span>
            <input type="date" value={date} max={todayInput()} onChange={(e) => setDate(e.target.value)} />
          </label>
          <div className="body-grid">
            {BODY_METRICS.map((m) => {
              const l = latest(m.key)
              return (
                <label key={m.key} className="field">
                  <span>
                    {m.label} ({m.unit})
                  </span>
                  <input
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder={l !== undefined ? num(l) : ''}
                    value={values[m.key] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [m.key]: e.target.value }))}
                  />
                </label>
              )
            })}
          </div>
          <p className="muted small">Remplis seulement ce que tu as mesuré.</p>
          <div className="row-buttons">
            <button className="primary" onClick={save}>
              Enregistrer
            </button>
            <button className="secondary" onClick={() => setFormOpen(false)}>
              Annuler
            </button>
          </div>
        </section>
      ) : (
        <button
          className="cta"
          onClick={() => {
            setDate(todayInput())
            setFormOpen(true)
            setMessage(null)
          }}
        >
          Nouvelle mesure
        </button>
      )}
      {message && (
        <p className="muted small center" role="status">
          {message}
        </p>
      )}

      <section className="panel">
        <h2>Évolution</h2>
        <div className="chips">
          {BODY_METRICS.map((m) => (
            <button key={m.key} className={m.key === metric ? 'chip on' : 'chip'} aria-pressed={m.key === metric} onClick={() => setMetric(m.key)}>
              {m.label}
            </button>
          ))}
        </div>
        <LineChart points={points} unit={meta.unit} label={`Évolution : ${meta.label}`} />
      </section>

      {entries.length > 0 && (
        <section className="panel">
          <h2>Mesures</h2>
          <ul className="rows">
            {[...entries].reverse().map((e) => (
              <li key={e.id}>
                <span>
                  <span className="block-title small">{dateLabel(e.date)}</span>
                  <br />
                  <span className="muted small">
                    {BODY_METRICS.filter((m) => e[m.key] !== undefined)
                      .map((m) => `${m.label} ${num(e[m.key]!)} ${m.unit}`)
                      .join(' · ')}
                  </span>
                </span>
                <button
                  className="text-btn"
                  aria-label={`Supprimer la mesure du ${dateLabel(e.date)}`}
                  onClick={() => {
                    if (window.confirm('Supprimer cette mesure ?')) onDelete(e.id)
                  }}
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
