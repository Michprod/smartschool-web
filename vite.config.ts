import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { IncomingMessage } from 'http';

const API_TARGET = 'http://127.0.0.1:8000';

/** Routes auth Laravel : proxy POST uniquement ; GET = pages React (évite boucle redirect). */
function authProxy() {
  return {
    target: API_TARGET,
    changeOrigin: true,
    bypass(req: IncomingMessage) {
      if (req.method === 'GET') {
        return '/index.html';
      }
    },
  };
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true },
      '/sanctum': { target: API_TARGET, changeOrigin: true },
      '/login': authProxy(),
      '/logout': authProxy(),
      '/register': authProxy(),
      '/forgot-password': authProxy(),
      '/reset-password': authProxy(),
    },
  },
});
