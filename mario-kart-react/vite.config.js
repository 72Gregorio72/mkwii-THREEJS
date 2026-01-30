import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    strictPort: true,
    port: 5173,
    
    // 1. RIMUOVIAMO l'oggetto https: { ... }
    // Nginx si occupa dell'SSL. Vite ora gira in HTTP standard dentro il container.
    https: false, 

    // 2. CONFIGURIAMO l'HMR (Hot Module Replacement)
    // Senza questo, il browser cercherà di aggiornare i file sulla porta 5173,
    // ma noi ora passiamo tutto dalla 443 di Nginx.
    hmr: {
      protocol: 'wss',
      clientPort: 443,
    },

    watch: {
      usePolling: true 
    }
  }
})