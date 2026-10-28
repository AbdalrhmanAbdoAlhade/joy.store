import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// Base URL of the Laravel REST API (see API.md).
// Overridable per environment via VITE_API_BASE_URL.
const API_BASE_URL =
  process.env.VITE_API_BASE_URL ?? 'https://toy.backend.rouqy-jewellery.com/api/v1';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    // The API sends `Access-Control-Allow-Origin: *`, so a proxy is not
    // required. It is kept available for local debugging without CORS.
    proxy: {
      '/api': {
        target: API_BASE_URL.replace(/\/api\/v1$/, ''),
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Rolldown (Vite 8) requires the functional form of chunking.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('gsap')) return 'motion';
          if (id.includes('@tanstack')) return 'query';
          if (id.includes('axios')) return 'http';
          if (id.includes('react-router') || id.includes('/react/') || id.includes('/react-dom/')) {
            return 'react';
          }
          return undefined;
        },
      },
    },
  },
});
