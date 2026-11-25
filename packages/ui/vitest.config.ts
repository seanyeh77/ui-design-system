import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

// Two projects:
// - browser: component tests in a real Chromium, where focus, positioning and pointer events behave as in a page.
//   CHROMIUM_PATH points at an installed browser when `playwright install` cannot download one.
// - jsdom: every story rendered in jsdom with no polyfills, so apps that test in jsdom can render every component.
// Both run in Asia/Taipei, the time zone ui shots uses, so dates and times render the same on every machine and in CI.
const TIME_ZONE = 'Asia/Taipei';
process.env.TZ = TIME_ZONE;

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'browser',
          include: ['src/**/*.test.tsx'],
          exclude: ['src/**/*.jsdom.test.tsx'],
          setupFiles: ['src/test/setup.ts'],
          // One file at a time: touch.test.tsx emulates a touch screen through CDP, which holds for the whole browser page,
          // so files running beside it would see (pointer: coarse) too.
          fileParallelism: false,
          // 30 s instead of the 15 s browser default: the LayerGraph and css-split tests lay out whole diagrams and pages and
          // come close to 15 s on a loaded 2-core machine.
          testTimeout: 30_000,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
              contextOptions: { timezoneId: TIME_ZONE },
            }),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        test: {
          name: 'jsdom',
          include: ['src/**/*.jsdom.test.tsx'],
          environment: 'jsdom',
          env: { TZ: TIME_ZONE },
          testTimeout: 30_000,
        },
      },
    ],
  },
});
