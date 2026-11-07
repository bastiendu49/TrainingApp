type Point = { x: number; y: number }

type Props = {
  points: Point[]
  unit: string
  /** Libellé accessible décrivant la courbe. */
  label: string
}

const W = 340
const H = 170
const PAD = { l: 34, r: 14, t: 18, b: 26 }

const shortDate = (ms: number) => new Date(ms).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','))

/** Courbe d'évolution simple, en SVG, aux couleurs du thème. */
export function LineChart({ points, unit, label }: Props) {
  if (points.length === 0) return <p className="muted small">Pas encore de données.</p>
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  let x0 = Math.min(...xs)
  let x1 = Math.max(...xs)
  if (x0 === x1) {
    x0 -= 3 * 86_400_000
    x1 += 3 * 86_400_000
  }
  let y0 = Math.min(...ys)
  let y1 = Math.max(...ys)
  const pad = (y1 - y0) * 0.15 || Math.max(1, Math.abs(y1) * 0.1)
  y0 = Math.max(0, y0 - pad)
  y1 += pad
  const X = (x: number) => PAD.l + ((x - x0) / (x1 - x0)) * (W - PAD.l - PAD.r)
  const Y = (y: number) => PAD.t + (1 - (y - y0) / (y1 - y0)) * (H - PAD.t - PAD.b)
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join('')
  const last = points[points.length - 1]
  // Reps et secondes sont entières : graduations entières aussi (pas de « 12,9 reps »).
  const integers = ys.every(Number.isInteger)
  const ticks = [y0, (y0 + y1) / 2, y1].map((t) => (integers ? Math.round(t) : t))

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {ticks.map((t) => (
        <g key={t}>
          <line className="chart-grid" x1={PAD.l} x2={W - PAD.r} y1={Y(t)} y2={Y(t)} />
          <text className="chart-axis" x={PAD.l - 6} y={Y(t) + 4} textAnchor="end">
            {fmt(Math.round(t * 10) / 10)}
          </text>
        </g>
      ))}
      <text className="chart-axis" x={PAD.l} y={H - 6} textAnchor="start">
        {shortDate(points[0].x)}
      </text>
      <text className="chart-axis" x={W - PAD.r} y={H - 6} textAnchor="end">
        {shortDate(last.x)}
      </text>
      <path className="chart-line" d={path} />
      {points.map((p) => (
        <circle key={`${p.x}-${p.y}`} className="chart-dot" cx={X(p.x)} cy={Y(p.y)} r="3.5">
          <title>{`${shortDate(p.x)} : ${fmt(p.y)} ${unit}`}</title>
        </circle>
      ))}
      <text className="chart-last" x={Math.min(X(last.x), W - PAD.r)} y={Math.max(12, Y(last.y) - 9)} textAnchor="end">
        {fmt(last.y)} {unit}
      </text>
    </svg>
  )
}
