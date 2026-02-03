import { defineConfig } from 'vite'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineConfig(({ command }) => ({
  root: '.',
  publicDir: 'public',
  base: command === 'build' ? '/coding-sandbox-physcs-experiment/' : '/',  // Only use base path for production
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
}))
