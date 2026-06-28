import { defineConfig } from '@playwright/test';

const baseURL = process.env.SVP_HOSTING_BASE_URL || 'https://sodovanphuc.vn';

export default defineConfig({
  testDir: './qa',
  testMatch: /hosting-live\.spec\.ts/,
  outputDir: './qa/hosting-screenshots',
  timeout: 45_000,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'mobile-live',
      use: {
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'desktop-live',
      use: {
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
