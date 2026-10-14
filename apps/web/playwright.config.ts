import { defineConfig } from '@playwright/test';
const baseURL=process.env.E2E_BASE_URL??'http://127.0.0.1:3000';
export default defineConfig({
  testDir: './e2e', fullyParallel: true,
  use: { baseURL, trace: 'retain-on-failure' },
  webServer: process.env.EXTERNAL_WEB === '1' ? undefined : { command: `node ../../scripts/web.mjs ${process.env.CI ? 'start' : 'dev'}`, env: { DEBUG: '' }, url: 'http://127.0.0.1:3000', reuseExistingServer: !process.env.CI, timeout: 120000 },
});
