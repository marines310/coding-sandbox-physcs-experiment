import { defineConfig } from 'vite'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  base: '/coding-sandbox-physcs-experiment/',  // GitHub Pages base path
  plugins: [
    wasm(),
    topLevelAwait()
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    target: 'esnext'
  },
  optimizeDeps: {
    exclude: ['@dimforge/rapier3d']
  },
  server: {
    port: 3000,
    open: true
  }
})
