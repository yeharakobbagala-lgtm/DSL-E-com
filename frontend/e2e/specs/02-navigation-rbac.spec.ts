import { test, expect } from '@playwright/test';
import { loginAsAdmin, logoutAdmin, TEST_CREDENTIALS } from '../helpers/auth';

test.describe('Workflow 2 & 6: Administrative Navigation & Dynamic RBAC Access Control', () => {

  test('Workflow 2: Super Admin possesses sovereign navigation across administrative consoles', async ({ page }) => {
    await loginAsAdmin(page, TEST_CREDENTIALS.superAdmin.email, TEST_CREDENTIALS.superAdmin.password);
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // Verify main navigation targets are accessible without restriction
    const routes = [
      { path: '/admin/dashboard', expectedHeading: 'Store Operations Dashboard' },
      { path: '/admin/products', expectedHeading: 'Products Management' },
      { path: '/admin/categories', expectedHeading: 'Categories & Subcategories' },
      { path: '/admin/orders', expectedHeading: 'Order Fulfillment Management' },
      { path: '/admin/customers', expectedHeading: 'Customer Directory' },
      { path: '/admin/admins', expectedHeading: 'Administrator Accounts' },
      { path: '/admin/roles', expectedHeading: 'Roles & Access Control (RBAC)' },
      { path: '/admin/audit-logs', expectedHeading: 'Audit Logs' },
      { path: '/admin/settings', expectedHeading: 'Application & Store Settings' },
      { path: '/admin/payments', expectedHeading: 'Payments & Transactions' },
    ];

    for (const route of routes) {
      await page.goto(route.path);
      await page.waitForLoadState('domcontentloaded');

      // Assert no "Access Restricted" blocker is rendered for Super Admin
      const accessRestricted = page.locator('h2:has-text("Access Restricted")');
      await expect(accessRestricted).not.toBeVisible();

      // Assert page loaded its substantive header or title
      await expect(page.locator(`text=${route.expectedHeading}`).first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test('Workflow 6: Restricted administrator (Order Manager) is denied access to unauthorized consoles', async ({ page }) => {
    // Log in as Order Manager (possesses orders.*, inventory.*, customers.view, but NOT admins.*, roles.*, settings.*, audit.*)
    await loginAsAdmin(page, TEST_CREDENTIALS.orderManager.email, TEST_CREDENTIALS.orderManager.password);
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // 1. Authorized module: Orders page should load properly
    await page.goto('/admin/orders');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h2:has-text("Access Restricted")')).not.toBeVisible();
    await expect(page.locator('text=Order Fulfillment Management').first()).toBeVisible({ timeout: 10_000 });

    // 2. Unauthorized module: Administrators management (/admin/admins requires admins.view)
    await page.goto('/admin/admins');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h2:has-text("Access Restricted")')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=admins.view')).toBeVisible();

    // 3. Unauthorized module: Roles & Permissions (/admin/roles requires roles.view)
    await page.goto('/admin/roles');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h2:has-text("Access Restricted")')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=roles.view')).toBeVisible();

    // 4. Unauthorized module: Store Settings (/admin/settings requires settings.view)
    await page.goto('/admin/settings');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h2:has-text("Access Restricted")')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=settings.view')).toBeVisible();

    // 5. Unauthorized module: Audit Logs (/admin/audit-logs requires audit_logs.view)
    await page.goto('/admin/audit-logs');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h2:has-text("Access Restricted")')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=audit_logs.view')).toBeVisible();
  });

  test('Workflow 6: Quarantined administrator without assigned role is strictly blocked from privileged consoles', async ({ page }) => {
    // Log in as quarantined administrator (no role, no privileges)
    await loginAsAdmin(page, TEST_CREDENTIALS.quarantined.email, TEST_CREDENTIALS.quarantined.password);
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // Any privileged section should display Access Restricted
    await page.goto('/admin/roles');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h2:has-text("Access Restricted")')).toBeVisible({ timeout: 10_000 });

    await page.goto('/admin/admins');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h2:has-text("Access Restricted")')).toBeVisible({ timeout: 10_000 });
  });

});
