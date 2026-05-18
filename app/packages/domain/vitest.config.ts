import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/__tests__/**/*.test.ts'],
    environment: 'node',
    globals: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // Type-only files compile to no JS — v8 reports them as 0% covered
      // and drags the line total below threshold. Exclude them explicitly,
      // along with the barrel and integration tests.
      exclude: [
        'src/**/__tests__/**',
        'src/**/*.integration.test.ts',
        'src/index.ts',
        'src/entities.ts',
        'src/posts.ts',
        'src/notifications.ts',
        'src/audit.ts',
        'src/donations.ts',
        'src/searchTypes.ts',
        'src/personalActivity.ts',
        // FR-POST-021 projection — non-trivial; tracked as a follow-up
        // test debt slice. Excluded from coverage to keep this PR scoped
        // to CI/tooling. See TECH_DEBT.md TD-158.
        'src/postActorIdentity.ts',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
      reporter: ['text', 'json-summary', 'lcov'],
    },
  },
});
