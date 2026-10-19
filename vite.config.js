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
      // Two pages: the deck itself and the phone voting page at /vote/.
      input: {
        main: page('./index.html'),
        vote: page('./vote/index.html'),
      },
    },
  },
  server: {
    fs: {
      allow: ['..', '../..'],
    },
  },
})
