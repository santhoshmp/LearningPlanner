import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Add visualizer plugin to analyze bundle size (generates stats.html)
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 3000,
    strictPort: true, // Don't try other ports if 3000 is occupied
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Configure code splitting
    rollupOptions: {
      output: {
        // Chunk by module category
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
        // Ensure chunks are reasonably sized
        chunkSizeWarningLimit: 1000,
      },
    },
    // Enable source maps for production (can be disabled for smaller bundles)
    sourcemap: false,
    // Ensure CSS is optimized
    cssCodeSplit: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', '@mui/material', '@emotion/react', '@emotion/styled'],
  },
})