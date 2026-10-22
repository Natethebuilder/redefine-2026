import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { deckPlugin, tailwindPlugin } from '@deckio/deck-engine/vite'

const page = (path) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  // GitHub Pages serves the site from /<repo>/; the deploy workflow sets BASE_PATH.
  base: process.env.BASE_PATH || '/',
  plugins: [
    react({
      include: [/\.[jt]sx?$/, /node_modules\/@deckio\/deck-engine\/.+\.jsx$/],
    }),
    deckPlugin({ inlineEditing: true }),
    tailwindPlugin(),
  ],
  build: {
    rolldownOptions: {
      // The deck, the phone voting page (/vote/) and the sign-up page (/get-involved/).
      input: {
        main: page('./index.html'),
        vote: page('./vote/index.html'),
        getInvolved: page('./get-involved/index.html'),
      },
    },
  },
  server: {
    fs: {
      allow: ['..', '../..'],
    },
  },
})
