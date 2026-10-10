import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4175';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: 'pnpm dev --host 127.0.0.1 --port 4175 --strictPort',
    url: `${baseURL}/e2e/modal-harness.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
