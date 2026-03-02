import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['game.js'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 85,
        lines: 80
      }
    },
    include: ['tests/**/*.test.js'],
    exclude: ['tests/e2e/**']
  }
});
