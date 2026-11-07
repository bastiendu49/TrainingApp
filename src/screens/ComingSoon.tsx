type Props = { title: string; text: string }

/** Onglet dont le contenu arrive à une étape suivante du plan de construction. */
export function ComingSoon({ title, text }: Props) {
  return (
    <main className="screen">
      <header>
        <h1>{title}</h1>
      </header>
      <section className="panel">
        <p className="muted">{text}</p>
      </section>
      <p className="version muted">Training · version {__BUILD__}</p>
    </main>
  )
}
