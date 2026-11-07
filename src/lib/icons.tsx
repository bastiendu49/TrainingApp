/**
 * Icônes en SVG inline, dessinées au trait : elles prennent la couleur du texte (currentColor)
 * et restent nettes à toutes les tailles, sans police d'icônes ni dépendance.
 */
type Props = { size?: number }

const Svg = ({ size = 24, children }: Props & { children: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
)

/** Barre et anneaux de gym, comme l'icône de l'app. */
export const IconRings = (p: Props) => (
  <Svg {...p}>
    <path d="M3 4h18M8 4v7M16 4v7" />
    <circle cx="8" cy="15" r="3.5" />
    <circle cx="16" cy="15" r="3.5" />
  </Svg>
)

export const IconChart = (p: Props) => (
  <Svg {...p}>
    <path d="M3 20h18M5 16l4-5 4 3 6-8" />
  </Svg>
)

export const IconBody = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="4.5" r="2" />
    <path d="M5 9l7 1 7-1M12 10v5M9 22l3-7 3 7" />
  </Svg>
)

export const IconMore = (p: Props) => (
  <Svg {...p}>
    <circle cx="5" cy="12" r="1.2" />
    <circle cx="12" cy="12" r="1.2" />
    <circle cx="19" cy="12" r="1.2" />
  </Svg>
)

export const IconBack = (p: Props) => (
  <Svg {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Svg>
)

export const IconChevron = (p: Props) => (
  <Svg {...p}>
    <path d="M9 5l7 7-7 7" />
  </Svg>
)
