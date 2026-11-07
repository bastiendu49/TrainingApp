import { describe, expect, it } from 'vitest'
import { handleSync, type KeyValueStore } from './sync-handler'

const memory = (): KeyValueStore & { data: Map<string, unknown> } => {
  const data = new Map<string, unknown>()
  return { data, get: async (k) => data.get(k) ?? null, set: async (k, v) => void data.set(k, v) }
}

const req = (method: string, code: string | null, body?: unknown) =>
  new Request('https://exemple.netlify.app/.netlify/functions/sync', {
    method,
    headers: code === null ? {} : { 'x-sync-code': code },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  })

const backup = { app: 'training-app', version: 1, savedAt: 1, program: {}, history: [] }

describe('fonction de synchro', () => {
  it('refuse tout si le code n’est pas configuré sur Netlify', async () => {
    const res = await handleSync(req('GET', 'x'), memory(), undefined)
    expect(res.status).toBe(500)
  })

  it('refuse un code absent ou faux', async () => {
    expect((await handleSync(req('GET', null), memory(), 'secret')).status).toBe(401)
    expect((await handleSync(req('GET', 'secreT'), memory(), 'secret')).status).toBe(401)
    expect((await handleSync(req('GET', 'secret-plus-long'), memory(), 'secret')).status).toBe(401)
  })

  it('renvoie null tant que rien n’a été enregistré', async () => {
    const res = await handleSync(req('GET', 'secret'), memory(), 'secret')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ backup: null })
  })

  it('enregistre puis relit la sauvegarde', async () => {
    const store = memory()
    expect((await handleSync(req('PUT', 'secret', backup), store, 'secret')).status).toBe(200)
    const res = await handleSync(req('GET', 'secret'), store, 'secret')
    expect(await res.json()).toEqual({ backup })
  })

  it('refuse un contenu qui n’est pas une sauvegarde de l’app', async () => {
    const store = memory()
    expect((await handleSync(req('PUT', 'secret', '{pas du json'), store, 'secret')).status).toBe(400)
    expect((await handleSync(req('PUT', 'secret', { app: 'autre', version: 1 }), store, 'secret')).status).toBe(400)
    expect(store.data.size).toBe(0)
  })

  it('refuse les autres méthodes', async () => {
    expect((await handleSync(req('DELETE', 'secret'), memory(), 'secret')).status).toBe(405)
  })
})
