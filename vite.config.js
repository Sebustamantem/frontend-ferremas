import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return
          if (id.includes("react-router-dom")) return "router"
          if (id.includes("react") || id.includes("react-dom")) return "react"
          if (id.includes("axios")) return "axios"
          if (id.includes("lucide-react")) return "icons"
          return "vendor"
        },
      },
    },
  },
})
