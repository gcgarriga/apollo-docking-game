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
        statements: 65,
        branches: 45,
        functions: 70,
        lines: 65
      }
    },
    include: ['tests/**/*.test.js'],
    exclude: ['tests/e2e/**']
  }
});
