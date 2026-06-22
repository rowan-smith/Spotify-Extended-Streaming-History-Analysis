import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: './',
  build: {
    outDir: 'docs',
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
