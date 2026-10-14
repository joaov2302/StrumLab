import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', fullyParallel: true,
  use: { baseURL: 'http://127.0.0.1:3000', trace: 'retain-on-failure' },
  webServer: process.env.EXTERNAL_WEB === '1' ? undefined : { command: `node ../../node_modules/next/dist/bin/next ${process.env.CI ? 'start' : 'dev'} --hostname 127.0.0.1`, env: { DEBUG: '' }, url: 'http://127.0.0.1:3000', reuseExistingServer: !process.env.CI, timeout: 120000 },
});
