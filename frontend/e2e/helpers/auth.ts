import { Page, expect } from '@playwright/test';

export const TEST_CREDENTIALS = {
  superAdmin: {
    email: 'e2e.superadmin@dslstationery.lk',
    password: 'AdminPassword123!',
  },
  projectManager: {
    email: 'e2e.project.manager@dslstationery.lk',
    password: 'ManagerPassword123!',
  },
  orderManager: {
    email: 'e2e.order.manager@dslstationery.lk',
    password: 'OrderMgrPassword123!',
  },
  quarantined: {
    email: 'e2e.quarantined@dslstationery.lk',
    password: 'QuarantinePass123!',
  },
};

/**
 * Perform a real browser login through the /admin/login form
 */
export async function loginAsAdmin(
  page: Page,
  email = TEST_CREDENTIALS.superAdmin.email,
  password = TEST_CREDENTIALS.superAdmin.password
) {
  await page.goto('/admin/login');
  await page.waitForLoadState('domcontentloaded');

  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  const submitButton = page.locator('button[type="submit"]');

  await expect(emailInput).toBeVisible({ timeout: 10_000 });
  await emailInput.fill(email);
  await passwordInput.fill(password);
  await submitButton.click();

  // Wait until the browser leaves /admin/login and navigates into an authorized admin route
  await page.waitForURL(
    (url) => url.pathname.startsWith('/admin') && !url.pathname.includes('/login'),
    { timeout: 15_000 }
  );
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Log out from the administrator portal
 */
export async function logoutAdmin(page: Page) {
  const logoutBtn = page.getByRole('button', { name: 'Logout' }).or(page.getByRole('button', { name: 'Sign Out' })).first();
  await expect(logoutBtn).toBeVisible({ timeout: 10_000 });
  await logoutBtn.click();
  await page.waitForURL(/\/admin\/login/, { timeout: 10_000 });
}
