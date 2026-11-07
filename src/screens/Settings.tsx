import { useRef, useState } from 'react'
import { parseBackup, toBackup, type DataSet } from '../domain/backup'
import { checkCode, type SyncStatus } from '../lib/sync'

type Props = {
  data: DataSet
  code: string | undefined
  lastSyncAt: number | undefined
  status: SyncStatus
  onSetCode: (code: string | undefined) => void
  onSyncNow: () => void
  onImport: (data: DataSet) => void
  /** Liens vers les autres réglages (étapes suivantes). */
  children?: React.ReactNode
}

const time = (ms: number) =>
  new Date(ms).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export function Settings({ data, code, lastSyncAt, status, onSetCode, onSyncNow, onImport, children }: Props) {
  const [draft, setDraft] = useState('')
  const [checking, setChecking] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [fileMessage, setFileMessage] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const activate = async () => {
    const value = draft.trim()
    if (!value) return
    setChecking(true)
    setCodeError(null)
    try {
      await checkCode(value)
      onSetCode(value)
      setDraft('')
    } catch (e) {
      setCodeError(e instanceof Error ? e.message : String(e))
    } finally {
      setChecking(false)
    }
  }

  const exportFile = () => {
    const blob = new Blob([JSON.stringify(toBackup(data, Date.now()), null, 1)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `training-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`
    document.body.append(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 5000)
    setFileMessage('Fichier enregistré dans tes téléchargements.')
  }

  const importFile = async (file: File) => {
    try {
      const parsed = parseBackup(JSON.parse(await file.text()))
      if (!parsed) {
        setFileMessage('Ce fichier n’est pas une sauvegarde de Training.')
        return
      }
      onImport(parsed)
      setFileMessage(`Sauvegarde importée (${parsed.history.length} séances), fusionnée avec tes données.`)
    } catch {
      setFileMessage('Fichier illisible.')
    }
  }

  return (
    <main className="screen">
      <header>
        <h1>Plus</h1>
      </header>

      {children}

      <section className="panel">
        <h2>Sauvegarde en ligne</h2>
        {code ? (
          <>
            <p className={status.state === 'error' ? 'error-text' : 'muted'} role="status">
              {status.state === 'syncing' && 'Synchronisation…'}
              {status.state === 'ok' && (lastSyncAt ? `À jour · dernière synchro ${time(lastSyncAt)}` : 'Activée')}
              {status.state === 'error' && status.message}
            </p>
            <p className="muted small">Tes séances, ton programme et tes mesures sont copiés en ligne automatiquement après chaque modification.</p>
            <div className="row-buttons">
              <button className="secondary" onClick={onSyncNow} disabled={status.state === 'syncing'}>
                Synchroniser maintenant
              </button>
              <button
                className="secondary"
                onClick={() => {
                  if (window.confirm('Désactiver la sauvegarde en ligne sur ce téléphone ? La copie en ligne est conservée.')) onSetCode(undefined)
                }}
              >
                Désactiver
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="muted small">
              Saisis le code secret défini dans Netlify (variable SYNC_CODE). Tes données seront copiées en ligne et fusionnées avec celles des autres appareils.
            </p>
            <label className="field">
              <span>Code secret</span>
              <input type="password" autoComplete="off" value={draft} onChange={(e) => setDraft(e.target.value)} />
            </label>
            {codeError && <p className="error-text">{codeError}</p>}
            <button className="cta" onClick={activate} disabled={!draft.trim() || checking}>
              {checking ? 'Vérification…' : 'Activer la sauvegarde'}
            </button>
          </>
        )}
      </section>

      <section className="panel">
        <h2>Sauvegarde dans un fichier</h2>
        <p className="muted small">En secours : un fichier avec toutes tes données, à garder où tu veux. L’import fusionne le fichier avec tes données actuelles.</p>
        <div className="row-buttons">
          <button className="secondary" onClick={exportFile}>
            Exporter
          </button>
          <button className="secondary" onClick={() => fileInput.current?.click()}>
            Importer un fichier
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void importFile(f)
            e.target.value = ''
          }}
        />
        {fileMessage && (
          <p className="muted small" role="status">
            {fileMessage}
          </p>
        )}
      </section>

      <p className="version muted">Training · version {__BUILD__}</p>
    </main>
  )
}
