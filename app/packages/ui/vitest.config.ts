import { defineConfig } from 'vitest/config';

// UI components target React Native and React Native Web. For tests we
// alias `react-native` to `react-native-web` and run in jsdom so we can
// drive components through @testing-library/react without pulling in the
// RN Flow-typed entry that vitest can't parse.
//
// `esbuild.jsx: 'automatic'` makes JSX work without needing React in scope
// (the package tsconfig uses `jsx: "react-native"` for the production build,
// which is incompatible with esbuild — so we override here for tests only).
export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    globals: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/__tests__/**'],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
      reporter: ['text', 'json-summary', 'lcov'],
    },
  },
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
  },
});
