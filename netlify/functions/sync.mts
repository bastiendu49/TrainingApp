import { getStore } from '@netlify/blobs'
import { handleSync } from '../sync-handler'

/**
 * Synchro des données de l'app, appelée sur /.netlify/functions/sync.
 * Le code secret est la variable d'environnement SYNC_CODE (réglages Netlify).
 */
export default async (req: Request) => {
  const store = getStore({ name: 'training', consistency: 'strong' })
  return handleSync(
    req,
    {
      get: (key) => store.get(key, { type: 'json' }),
      set: async (key, value) => {
        await store.setJSON(key, value)
      },
    },
    process.env.SYNC_CODE,
  )
}
