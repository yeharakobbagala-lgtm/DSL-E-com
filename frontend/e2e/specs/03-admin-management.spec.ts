import { test, expect } from '@playwright/test';
import { loginAsAdmin, TEST_CREDENTIALS } from '../helpers/auth';
import { completeTypedConfirmation } from '../helpers/confirmation';

test.describe('Workflow 3, 4 & 5: Administrator Lifecycle, RBAC Roles & Sensitive Deactivation', () => {

  const timestamp = Date.now();
  const testAdminEmail = `e2e.admin.${timestamp}@dslstationery.lk`;
  const testAdminName = `E2E Test Administrator ${timestamp}`;
  const testRoleName = `E2E Auditor ${timestamp}`;
  const testRoleSlug = `e2e_auditor_${timestamp}`;

  test('Workflow 3 & 4: Create new administrator account and execute typed deactivation', async ({ page }) => {
    // 1. Authenticate as Super Admin
    await loginAsAdmin(page, TEST_CREDENTIALS.superAdmin.email, TEST_CREDENTIALS.superAdmin.password);
    await page.goto('/admin/admins');
    await page.waitForLoadState('domcontentloaded');

    // 2. Open Direct Administrator Creation Modal
    const createBtn = page.getByRole('button', { name: 'Create Admin' });
    await expect(createBtn).toBeVisible({ timeout: 10_000 });
    await createBtn.click();

    // 3. Fill Administrator Creation Form
    const modal = page.locator('div:has-text("Directly Create Administrator")').last();
    await expect(modal).toBeVisible();

    await page.locator('input[placeholder="e.g. Kasun Fernando"]').fill(testAdminName);
    await page.locator('input[placeholder="kasun.f@dslstationery.lk"]').fill(testAdminEmail);
    await page.locator('input[placeholder="+94 77 123 4567"]').fill('+94 77 987 6543');
    await page.locator('input[placeholder="Min 8 chars, 1 uppercase, 1 number"]').fill('TempPass2026!');

    // Submit form
    const submitBtn = page.getByRole('button', { name: 'Create Account' });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Verify success banner
    await expect(page.locator(`text=Administrator account for ${testAdminEmail} created successfully.`)).toBeVisible({ timeout: 10_000 });

    // 4. Locate created administrator row in table
    const searchInput = page.locator('input[placeholder*="Search by name, email"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(testAdminEmail);
      await page.waitForTimeout(500);
    }

    const adminRow = page.locator(`tr:has-text("${testAdminEmail}")`).first();
    await expect(adminRow).toBeVisible({ timeout: 10_000 });
    await expect(adminRow.locator('text=Active')).toBeVisible();

    // 5. Workflow 4: Trigger account deactivation requiring typed email confirmation
    const deactivateBtn = adminRow.locator('button[title="Deactivate account"]');
    await expect(deactivateBtn).toBeVisible();
    await deactivateBtn.click();

    // Complete typed confirmation modal with admin's email
    await completeTypedConfirmation(page, testAdminEmail, 'Confirm Deactivation');

    // Verify deactivation notification
    await expect(page.locator(`text=Administrator ${testAdminEmail} has been deactivated.`)).toBeVisible({ timeout: 10_000 });

    // Verify account status updated to Inactive or reactivate button appears
    await expect(adminRow.locator('button[title="Reactivate account"]')).toBeVisible({ timeout: 10_000 });
  });

  test('Workflow 5: Create dynamic custom role with granular permissions and verify catalog reflection', async ({ page }) => {
    // 1. Authenticate as Super Admin
    await loginAsAdmin(page, TEST_CREDENTIALS.superAdmin.email, TEST_CREDENTIALS.superAdmin.password);
    await page.goto('/admin/roles');
    await page.waitForLoadState('domcontentloaded');

    // 2. Open Create Custom Role Modal
    const createRoleBtn = page.getByRole('button', { name: 'Create Custom Role' });
    await expect(createRoleBtn).toBeVisible({ timeout: 10_000 });
    await createRoleBtn.click();

    const roleModal = page.locator('div:has-text("Create Custom Dynamic Role")').last();
    await expect(roleModal).toBeVisible();

    // 3. Fill role metadata
    await page.locator('input[placeholder="e.g. Catalog Specialist"]').fill(testRoleName);
    const slugInput = page.locator('input[placeholder="e.g. catalog_specialist"]');
    await slugInput.fill(testRoleSlug);
    await page.locator('textarea[placeholder*="Describe operational responsibilities"]').fill('Custom E2E testing role with granular privileges');

    // 4. Select permissions via "Select Module" (granular module permissions)
    const selectModuleBtn = page.getByRole('button', { name: 'Select Module' }).first();
    await expect(selectModuleBtn).toBeVisible({ timeout: 10_000 });
    await selectModuleBtn.click();

    // 5. Submit role creation
    const submitRoleBtn = page.getByRole('button', { name: /Create Role \(/i });
    await expect(submitRoleBtn).toBeEnabled({ timeout: 10_000 });
    await submitRoleBtn.click();

    // 6. Verify role created notification and appearance in roles directory
    await expect(page.locator(`text=Custom role "${testRoleName}" created successfully.`).or(page.locator('text=created successfully'))).toBeVisible({ timeout: 10_000 });

    // Assert new role appears in the list
    const roleCardOrRow = page.locator(`text=${testRoleName}`).first();
    await expect(roleCardOrRow).toBeVisible({ timeout: 10_000 });
  });

});
