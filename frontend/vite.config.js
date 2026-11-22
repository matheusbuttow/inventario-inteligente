import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Escuta em todas as interfaces para funcionar dentro do Docker e no celular da mesma rede.
  server: { host: true, port: 5173 },
})
