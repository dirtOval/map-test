import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/erddap": { target: "https://data.neracoos.org", changeOrigin: true } } },
  optimizeDeps: {
    exclude: ['maplibre-gl']
  },
})
