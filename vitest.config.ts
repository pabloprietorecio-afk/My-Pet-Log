import { defineConfig } from 'vitest/config'

// Zona horaria fija: las pruebas de horarios/DST deben ser deterministas.
process.env.TZ = 'Europe/Madrid'

export default defineConfig({
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
})
