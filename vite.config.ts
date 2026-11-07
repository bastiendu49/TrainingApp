import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

const BUILD = new Date().toISOString().slice(0, 16).replace('T', ' ')

export default defineConfig({
  define: { __BUILD__: JSON.stringify(BUILD) },
  plugins: [
    react(),
    VitePWA({
      // 'prompt' : la nouvelle version attend la prochaine ouverture de l'app au lieu de
      // recharger d'office, pour ne jamais couper une séance en cours.
      registerType: 'prompt',
      injectRegister: null,
      // woff2 : la police est embarquée, elle doit être précachée pour le hors-ligne.
      workbox: { cleanupOutdatedCaches: true, globPatterns: ['**/*.{js,css,html,png,woff2}'] },
      includeAssets: ['favicon.png'],
      manifest: {
        name: 'Training-app',
        short_name: 'Training',
        description: 'Séances guidées et suivi de progression au poids du corps',
        lang: 'fr',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#fff7ee',
        theme_color: '#fff7ee',
        // Une entrée par usage : Chrome déconseille « any maskable » combinés.
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
})
