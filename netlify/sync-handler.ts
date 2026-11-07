/**
 * Logique de la fonction de synchro, séparée de Netlify pour être testée.
 * Une seule copie en ligne (clé « backup »), lue (GET) ou remplacée (PUT) par l'app,
 * qui fusionne elle-même les deux copies avant d'envoyer.
 */

export interface KeyValueStore {
  get(key: string): Promise<unknown>
  set(key: string, value: unknown): Promise<void>
}

const KEY = 'backup'
/** Limite des fonctions Netlify : 6 Mo par requête. On refuse un peu avant. */
const MAX_BYTES = 5_500_000

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })

/** Comparaison en temps constant : ne laisse pas deviner le code par la durée de réponse. */
function sameSecret(given: string, expected: string): boolean {
  let diff = given.length ^ expected.length
  for (let i = 0; i < expected.length; i++) diff |= (given.charCodeAt(i) || 0) ^ expected.charCodeAt(i)
  return diff === 0
}

export async function handleSync(req: Request, store: KeyValueStore, secret: string | undefined): Promise<Response> {
  if (!secret) return json(500, { error: 'Le code secret n’est pas configuré sur Netlify (variable SYNC_CODE).' })
  if (!sameSecret(req.headers.get('x-sync-code') ?? '', secret)) return json(401, { error: 'Code secret incorrect.' })

  if (req.method === 'GET') {
    return json(200, { backup: (await store.get(KEY)) ?? null })
  }

  if (req.method === 'PUT') {
    const text = await req.text()
    if (text.length > MAX_BYTES) return json(413, { error: 'Sauvegarde trop volumineuse (photos ?).' })
    let body: unknown
    try {
      body = JSON.parse(text)
    } catch {
      return json(400, { error: 'Contenu illisible.' })
    }
    const b = body as { app?: unknown; version?: unknown }
    if (!b || b.app !== 'training-app' || b.version !== 1) return json(400, { error: 'Ce n’est pas une sauvegarde de Training-app.' })
    await store.set(KEY, body)
    return json(200, { ok: true })
  }

  return json(405, { error: 'Méthode non prise en charge.' })
}
