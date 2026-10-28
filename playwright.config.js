const { defineConfig, devices } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests', timeout: 30000,
  expect: { timeout: 8000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:8766', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } }
  ],
  webServer: { command: 'python -m http.server 8766 --bind 127.0.0.1', url: 'http://127.0.0.1:8766/sport/', reuseExistingServer: !process.env.CI, timeout: 30000 }
});
