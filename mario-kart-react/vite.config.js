import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    strictPort: true,
    port: 5173,
    
    // Nginx gestisce l'SSL, quindi qui è false
    https: false, 

    // CONFIGURAZIONE IMPORTANTE PER LA PORTA 8443
    hmr: {
      protocol: 'wss',
      clientPort: 8443, // <--- CAMBIATO QUI: Il browser deve puntare alla 8443
    },

    watch: {
      usePolling: true 
    }
  }
})