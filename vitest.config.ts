import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: path.resolve(__dirname, './vitest.setup.ts'),
    include: ['frontend/src/**/*.test.ts', 'frontend/src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'frontend/dist/',
        'vitest.config.ts',
        'vitest.setup.ts'
      ]
    }
  }
});
