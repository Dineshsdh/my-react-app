import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React and core dependencies
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // UI chunk for Bootstrap components
          ui: ['react-bootstrap'],
          // PDF chunk for heavy PDF libraries
          pdf: ['@react-pdf/renderer', 'html2canvas', 'jspdf', 'file-saver']
        }
      }
    },
    // Enable source maps for debugging in production
    sourcemap: false,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['@react-pdf/renderer']
  },
  // Performance optimizations
  server: {
    hmr: {
      overlay: false
    }
  }
})
