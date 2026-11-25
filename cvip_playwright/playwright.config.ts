import { defineConfig, devices } from '@playwright/test'
import { BASE_URL } from './tests/support/env'

const isCI = Boolean(process.env.CI)

export default defineConfig({
  testDir: './tests',
  outputDir: 'report/results',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  reporter: [
    ['list'],
    ['junit', { outputFile: 'report/junit.xml' }],
    ['html', { outputFolder: 'report/html', open: 'never' }],
  ],
  use: {
    baseURL: BASE_URL,
    locale: 'fr-FR',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    // PW_CHANNEL=chrome runs the machine's Chrome instead of the downloaded Chromium.
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL },
    },
    // Touch WebKit viewport: the interface must stay usable on a phone.
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
})
