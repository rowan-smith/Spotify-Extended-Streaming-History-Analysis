import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/Spotify-Extended-Streaming-History-Analysis/',
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  },
});
