import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['speakeasy', 'qrcode'],
  },
  worker: {
    format: 'es'
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      }
    }
  },
  publicDir: 'public'
});
