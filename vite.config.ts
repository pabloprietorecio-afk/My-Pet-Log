import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  // Versión visible en Ajustes: en GitHub Actions coincide con la del APK (0.3.<n.º de ejecución>).
  define: { __APP_VERSION__: JSON.stringify(`0.3.${process.env.GITHUB_RUN_NUMBER ?? 'dev'}`) },
  build: { target: 'es2020', chunkSizeWarningLimit: 900 },
})
