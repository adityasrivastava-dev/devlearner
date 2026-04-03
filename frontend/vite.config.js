import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api':          { target: 'http://localhost:8080', changeOrigin: true },
      '/oauth2':       { target: 'http://localhost:8080', changeOrigin: true },
      '/login/oauth2': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@monaco-editor') || id.includes('monaco-editor')) return 'monaco-vendor';
          if (id.includes('@tanstack'))   return 'query-vendor';
          if (id.includes('react-dom') || id.includes('react-router')) return 'react-vendor';
        },
      },
    },
  },
});
