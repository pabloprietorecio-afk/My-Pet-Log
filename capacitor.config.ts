import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.petlog.diario',
  appName: 'PetLog',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  plugins: {
    // Android de borde a borde: Capacitor pasa las zonas seguras como variables CSS.
    SystemBars: { insetsHandling: 'css', initialViewportFitValueHint: 'cover' },
  },
}

export default config
