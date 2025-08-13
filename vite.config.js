import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    // Generate pre-compressed assets (gzip and brotli) at build time
    viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),
    viteCompression({ algorithm: 'gzip' })
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['react-bootstrap', 'bootstrap'],
          'vendor-pdf': ['@react-pdf/renderer']
        }
      }
    }
  }
})
