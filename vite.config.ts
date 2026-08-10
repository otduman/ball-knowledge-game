// `defineConfig` comes from vitest/config rather than vite so the `test` block
// is typed. Vite's own defineConfig rejects it as an unknown property.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    sourcemap: true,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
