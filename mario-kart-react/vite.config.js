import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  // resolve: {
  //   alias: {
  //     'three': path.resolve('./node_modules/three') ??????
  //   }
  // },
  server: {
    host: true,
    strictPort: true,
    port: 5173,
    https: {
      key: fs.readFileSync('./certs/key.pem'),  // Legge la chiave privata
      cert: fs.readFileSync('./certs/cert.pem'), // Legge il certificato pubblico
    },
    watch: {
      usePolling: true // <--- Aggiungi questo se usi Windows/WSL per fixare il reload
    }
  }
})