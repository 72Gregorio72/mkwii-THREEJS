import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,      // <--- Aggiungi questo: permette l'accesso da fuori il container
    strictPort: true,
    port: 5173,
    watch: {
      usePolling: true // <--- Aggiungi questo se usi Windows/WSL per fixare il reload
    }
  }
})