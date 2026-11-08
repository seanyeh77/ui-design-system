import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

// Component tests run in a real Chromium: focus, positioning and pointer events behave as in a page.
// CHROMIUM_PATH points at an installed browser when `playwright install` cannot download one.
export default defineConfig({
  test: {
    include: ['src/**/*.test.tsx'],
    setupFiles: ['src/test/setup.ts'],
    // One file at a time: touch.test.tsx emulates a touch screen through CDP, which holds for the whole browser page,
    // so files running beside it would see (pointer: coarse) too.
    fileParallelism: false,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({ launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {} }),
      instances: [{ browser: 'chromium' }],
    },
  },
});
