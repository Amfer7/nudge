import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    VitePWA({
      // Ship updates silently — the SW takes over and refreshes assets on next load.
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Static assets to precache alongside the hashed build output.
      includeAssets: ['logo.jpg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Nudge',
        short_name: 'Nudge',
        description:
          'Nudge is a streak-first workout tracker with freeze logic, weekly plans, and simple daily consistency.',
        theme_color: '#2cff05',
        background_color: '#0b1410',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache the app shell; offline-first is the product identity.
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,woff2}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
