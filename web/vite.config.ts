import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '../docs',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/plotly.js') || id.includes('node_modules/react-plotly.js')) {
            return 'plotly';
          }
          if (
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react/jsx-runtime') ||
            id.includes('node_modules/react/index')
          ) {
            return 'react-vendor';
          }
        },
      },
    },
  },
});
