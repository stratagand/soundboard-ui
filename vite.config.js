import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/soundboard-ui/',
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://71.178.45.235',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
