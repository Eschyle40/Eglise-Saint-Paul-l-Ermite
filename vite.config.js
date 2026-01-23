import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/Eglise-Saint-Paul-l-Ermite/',  // Remplacez par le nom de votre dépôt GitHub
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  server: {
    port: 3000,
  },
});
