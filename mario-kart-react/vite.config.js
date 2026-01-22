import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // resolve: {
  //   alias: {
  //     'three': path.resolve('./node_modules/three')
  //   }
  // },
  server: {
    host: true,      // <--- Aggiungi questo: permette l'accesso da fuori il container
    strictPort: true,
    port: 5173,
	// 2. Aggiungi la configurazione HTTPS qui
    https: {
      key: fs.readFileSync('./certs/key.pem'),  // Legge la chiave privata
      cert: fs.readFileSync('./certs/cert.pem'), // Legge il certificato pubblico
    },
    watch: {
      usePolling: true // <--- Aggiungi questo se usi Windows/WSL per fixare il reload
    }
  }
})