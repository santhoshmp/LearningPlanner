import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Add visualizer plugin to analyze bundle size (generates stats.html)
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:3001/api'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('@mui')) {
              return 'vendor-mui'
            } else if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react'
            } else if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-charts'
            } else {
              return 'vendor'
            }
          }
        },
        chunkSizeWarningLimit: 1000,
      },
    },
    sourcemap: false,
    cssCodeSplit: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@mui/material', '@emotion/react', '@emotion/styled'],
  },
}))