import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  webServer: {
    command: 'npm run dev',
    cwd: '../analysis',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30000,
  },
});
