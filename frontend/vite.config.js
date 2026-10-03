import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Set VITE_BASE=/Research-IITB/ when building for a server that hosts the app
  // under a sub-path. Local dev and the default build stay at '/'.
  base: process.env.VITE_BASE || '/',
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
