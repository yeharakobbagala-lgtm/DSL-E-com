import { test, expect } from '@playwright/test';
import { loginAsAdmin, logoutAdmin, TEST_CREDENTIALS } from '../helpers/auth';

test.describe('Workflow 1 & 11: Authentication, Session Management & Password Change', () => {

  test('should redirect unauthenticated users from protected admin routes to /admin/login', async ({ page }) => {
    // Attempt direct access to admin dashboard without active session
    await page.goto('/admin/dashboard');
    await page.waitForURL(/\/admin\/login/, { timeout: 10_000 });
    expect(page.url()).toContain('/admin/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should reject invalid credentials with a visible security alert', async ({ page }) => {
    await page.goto('/admin/login');
    await page.locator('input[type="email"]').fill(TEST_CREDENTIALS.superAdmin.email);
    await page.locator('input[type="password"]').fill('IncorrectPassword999!');
    await page.locator('button[type="submit"]').click();

    // Verify error message rendered in UI
    const errorAlert = page.locator('text=Invalid administrative email or password').first();
    await expect(errorAlert).toBeVisible({ timeout: 10_000 });
  });

  test('should successfully authenticate Super Admin and display dashboard identity', async ({ page }) => {
    await loginAsAdmin(page, TEST_CREDENTIALS.superAdmin.email, TEST_CREDENTIALS.superAdmin.password);

    // Verify dashboard navigation
    await expect(page).toHaveURL(/\/admin\/dashboard/);
    
    // Verify administrative header displays identity
    const adminHeading = page.getByRole('heading', { name: 'Store Operations Dashboard' });
    await expect(adminHeading).toBeVisible();
    const adminEmail = page.locator(`text=${TEST_CREDENTIALS.superAdmin.email}`).first();
    await expect(adminEmail).toBeVisible();
  });

  test('should successfully log out and invalidate browser session', async ({ page }) => {
    await loginAsAdmin(page, TEST_CREDENTIALS.superAdmin.email, TEST_CREDENTIALS.superAdmin.password);
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // Perform logout
    await logoutAdmin(page);

    // Verify redirected back to login
    await expect(page).toHaveURL(/\/admin\/login/);

    // Verify back navigation does not reveal protected content
    await page.goto('/admin/dashboard');
    await page.waitForURL(/\/admin\/login/, { timeout: 10_000 });
  });

  test('should execute authenticated password change and enforce session revocation', async ({ page }) => {
    // 1. Log in with current password
    await loginAsAdmin(page, TEST_CREDENTIALS.superAdmin.email, TEST_CREDENTIALS.superAdmin.password);

    // 2. Navigate to profile page
    await page.goto('/admin/profile');
    await page.waitForLoadState('domcontentloaded');

    // 3. Fill change password form
    const currentPassInput = page.locator('input[placeholder="Enter your current password"]');
    const newPassInput = page.locator('input[placeholder="Enter new strong password"]');
    const confirmPassInput = page.locator('input[placeholder="Re-enter your new password"]');
    const submitBtn = page.getByRole('button', { name: 'Save New Password' });

    await expect(currentPassInput).toBeVisible();
    await currentPassInput.fill(TEST_CREDENTIALS.superAdmin.password);
    
    const updatedPassword = 'AdminUpdatedPassword2026!';
    await newPassInput.fill(updatedPassword);
    await confirmPassInput.fill(updatedPassword);

    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // 4. Session revocation immediately triggers redirection to /admin/login
    await page.waitForURL(/\/admin\/login/, { timeout: 10_000 });
    expect(page.url()).toContain('/admin/login');

    // 5. Verify old password is now rejected
    await page.locator('input[type="email"]').fill(TEST_CREDENTIALS.superAdmin.email);
    await page.locator('input[type="password"]').fill(TEST_CREDENTIALS.superAdmin.password);
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=Invalid administrative email or password').first()).toBeVisible({ timeout: 8_000 });

    // 6. Verify new password authenticates successfully
    await page.locator('input[type="password"]').fill(updatedPassword);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/admin\/(dashboard|profile)/, { timeout: 10_000 });

    // 7. Reset password back to standard TEST_CREDENTIALS.superAdmin.password for idempotent suite runs
    if (!page.url().includes('/admin/profile')) {
      await page.goto('/admin/profile');
    }
    await currentPassInput.fill(updatedPassword);
    await newPassInput.fill(TEST_CREDENTIALS.superAdmin.password);
    await confirmPassInput.fill(TEST_CREDENTIALS.superAdmin.password);
    await submitBtn.click();
    await page.waitForURL(/\/admin\/login/, { timeout: 10_000 });
  });

});
