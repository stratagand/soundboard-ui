import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/soundboard-ui/',
  plugins: [react()],
  server: {
    port: 4173,
    proxy: {
      '/api': {
        target: 'http://71.178.45.235:3001',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
