import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    root: path.resolve(__dirname),
    base: './',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    build: {
      outDir: '../dist',
      emptyOutDir: true,
    },
    server: {
      // HMR can be disabled via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during development.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during development.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
