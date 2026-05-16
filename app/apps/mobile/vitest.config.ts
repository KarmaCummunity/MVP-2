import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/__tests__/**/*.test.tsx'],
    environment: 'node',
    globals: false,
    server: {
      deps: {
        // react-native ships Flow syntax; route imports to react-native-web for tests
        inline: ['react-native'],
      },
    },
  },
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
  },
});
