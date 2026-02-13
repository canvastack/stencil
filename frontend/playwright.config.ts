import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Vendor Portal E2E Testing
 * 
 * This configuration provides comprehensive E2E testing setup for the vendor portal
 * with support for multiple browsers, mobile devices, and test fixtures.
 * 
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './src/__tests__/e2e',
  
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
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['list'], // Console output
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    
    /* Take screenshot on failure */
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true,
    },
    
    /* Record video on failure */
    video: {
      mode: 'retain-on-failure',
      size: { width: 1280, height: 720 },
    },
    
    /* Maximum time each action such as `click()` can take */
    actionTimeout: 15000,
    
    /* Maximum time for navigation */
    navigationTimeout: 30000,
    
    /* Emulate browser locale */
    locale: 'en-US',
    
    /* Emulate timezone */
    timezoneId: 'America/New_York',
    
    /* Viewport size */
    viewport: { width: 1280, height: 720 },
    
    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,
    
    /* Whether to automatically download all the attachments */
    acceptDownloads: true,
    
    /* Collect HAR (HTTP Archive) for debugging */
    // har: {
    //   mode: 'retain-on-failure',
    //   path: 'test-results/har/',
    // },
  },

  /* Configure projects for major browsers */
  projects: [
    // Desktop Browsers
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Additional Chrome-specific settings
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
          ],
        },
      },
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        // Additional Firefox-specific settings
        launchOptions: {
          firefoxUserPrefs: {
            'security.fileuri.strict_origin_policy': false,
          },
        },
      },
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        // Additional Safari-specific settings
      },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        // Mobile-specific settings
        isMobile: true,
        hasTouch: true,
      },
    },
    
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        // Mobile-specific settings
        isMobile: true,
        hasTouch: true,
      },
    },
    
    {
      name: 'Tablet',
      use: {
        ...devices['iPad Pro'],
        // Tablet-specific settings
        isMobile: true,
        hasTouch: true,
      },
    },

    /* Test against branded browsers. */
    // Uncomment to test with Microsoft Edge
    // {
    //   name: 'Microsoft Edge',
    //   use: { 
    //     ...devices['Desktop Edge'], 
    //     channel: 'msedge',
    //   },
    // },
    
    // Uncomment to test with Google Chrome
    // {
    //   name: 'Google Chrome',
    //   use: { 
    //     ...devices['Desktop Chrome'], 
    //     channel: 'chrome',
    //   },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'ignore',
    stderr: 'pipe',
  },

  /* Global test timeout */
  timeout: 60 * 1000,
  
  /* Global expect timeout */
  expect: {
    timeout: 15 * 1000,
  },
  
  /* Output folder for test artifacts */
  outputDir: 'test-results',
  
  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  snapshotDir: 'src/__tests__/e2e/__snapshots__',
  
  /* Maximum number of failures before stopping the test suite */
  maxFailures: process.env.CI ? 10 : undefined,
  
  /* Whether to preserve output between test runs */
  preserveOutput: 'always',
  
  /* Global setup and teardown */
  // globalSetup: require.resolve('./src/__tests__/e2e/global-setup.ts'),
  // globalTeardown: require.resolve('./src/__tests__/e2e/global-teardown.ts'),
});