import { defineConfig, devices } from '@playwright/test'

/**
 * PWA offline suite — separate from playwright.config.ts because service
 * workers don't exist under `vite dev`: this needs a real production build
 * served by `vite preview` (see webServer below). Chromium only, since that's
 * the browser the offline/install-prompt behavior is verified against.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testMatch: 'tests/e2e/pwa-offline.spec.ts',
  outputDir: './temp/reports/test-results',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: './temp/reports/playwright-report' }],
    ['junit', { outputFile: './temp/reports/e2e-results.xml' }],
    ['json', { outputFile: './temp/reports/e2e-results.json' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:4173',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot only when test fails */
    screenshot: 'only-on-failure',

    /* Record video only when test fails */
    video: 'retain-on-failure',

    /* Automatically wait for elements to be actionable */
    actionTimeout: 15000,

    /* Wait for navigation to complete */
    navigationTimeout: 30000,
  },

  /* Chromium only — the offline/service-worker behavior under test isn't browser-agnostic. */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Serve the real production build — `npm run build` must run first. */
  webServer: {
    command: 'npm run preview -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
  },
})
