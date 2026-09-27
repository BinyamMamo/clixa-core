import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.spec.ts'],
    /* daysBetween() works on local-midnight dates, so the golden snapshot is
       only reproducible under a pinned zone. */
    env: { TZ: 'UTC' },
  },
});
