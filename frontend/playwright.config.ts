import { defineConfig, devices } from '@playwright/test';

/**
 * PRODUCTION SAFETY GUARD
 * Explicitly reject execution against production environments or non-local hosts.
 */
const targetBaseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const isProductionEnv =
  process.env.NODE_ENV === 'production' ||
  (!targetBaseUrl.includes('localhost') && !targetBaseUrl.includes('127.0.0.1'));

if (isProductionEnv) {
  throw new Error(
    `CRITICAL SAFETY GUARD VIOLATION: Playwright E2E tests are strictly forbidden from executing against production environments or non-local hosts (${targetBaseUrl}).`
  );
}

/**
 * Playwright E2E Configuration for DSL Stationery E-Commerce Platform
 * Validating live administrator portal workflows, RBAC enforcement, and typed confirmations.
 */
export default defineConfig({
  testDir: './e2e/specs',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

