import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  preserveOutput: 'always',
  use: { baseURL: process.env.WEB_E2E_URL ?? 'http://127.0.0.1:5173', ...devices['Desktop Chrome'] },
  webServer: process.env.WEB_E2E_URL ? undefined : { command: 'pnpm dev --host 127.0.0.1', port: 5173, reuseExistingServer: !process.env.CI },
});
