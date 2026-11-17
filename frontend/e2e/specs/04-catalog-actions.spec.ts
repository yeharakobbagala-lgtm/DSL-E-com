import { test, expect } from '@playwright/test';
import { loginAsAdmin, TEST_CREDENTIALS } from '../helpers/auth';
import { completeTypedConfirmation } from '../helpers/confirmation';

test.describe('Workflow 7, 8 & 9: Catalog Management & Sensitive Typed Deletions', () => {

  const timestamp = Date.now();
  const testProductName = `E2E Ballpoint Pen ${timestamp}`;
  const testCategoryName = `E2E Stationery Category ${timestamp}`;

  test('Workflow 7 & 8: Product creation, search, and typed deletion with SensitiveActionConfirmationModal', async ({ page }) => {
    // 1. Authenticate as Super Admin
    await loginAsAdmin(page, TEST_CREDENTIALS.superAdmin.email, TEST_CREDENTIALS.superAdmin.password);
    
    // 2. Navigate to New Product Creation Page
    await page.goto('/admin/products/new');
    await page.waitForLoadState('domcontentloaded');

    // 3. Fill required product attributes
    const nameInput = page.locator('input[placeholder*="Atlas Single Line"]');
    await expect(nameInput).toBeVisible({ timeout: 10_000 });
    await nameInput.fill(testProductName);

    // Auto-generate SKU
    const autoSkuBtn = page.getByRole('button', { name: /Auto-generate SKU/i });
    if (await autoSkuBtn.isEnabled()) {
      await autoSkuBtn.click();
      await page.waitForTimeout(500);
    } else {
      await page.locator('input[placeholder*="DSL-PEN-SPD"]').fill(`E2E-SKU-${timestamp}`);
    }

    // Set Selling Price & Stock
    await page.locator('input[placeholder="450.00"]').fill('350');
    await page.locator('input[placeholder="100"]').fill('75');

    // Submit product creation
    const saveBtn = page.getByRole('button', { name: /Save & Publish to Store/i });
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    // 4. Verify redirected to /admin/products and product is cataloged
    await page.waitForURL(/\/admin\/products$/, { timeout: 15_000 });
    await page.waitForLoadState('domcontentloaded');

    // Search for newly created product
    const searchInput = page.locator('input[placeholder*="Search by name, SKU"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill(testProductName);
    await page.waitForTimeout(600);

    // Locate product row
    const productRow = page.locator(`tr:has-text("${testProductName}")`).first();
    await expect(productRow).toBeVisible({ timeout: 10_000 });

    // 5. Workflow 8: Product deletion with typed confirmation
    const deleteBtn = productRow.locator('button[title="Delete product"]');
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // SensitiveActionConfirmationModal requires typing the exact product title
    await completeTypedConfirmation(page, testProductName, 'Confirm & Delete Product');

    // Verify product deleted successfully and removed from catalog
    await expect(page.locator(`tr:has-text("${testProductName}")`)).not.toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=No products found')).toBeVisible({ timeout: 10_000 });
  });

  test('Workflow 9: Category creation and deletion with typed confirmation', async ({ page }) => {
    // 1. Authenticate as Super Admin
    await loginAsAdmin(page, TEST_CREDENTIALS.superAdmin.email, TEST_CREDENTIALS.superAdmin.password);
    await page.goto('/admin/categories');
    await page.waitForLoadState('domcontentloaded');

    // 2. Open Add Category Modal
    const addCatBtn = page.getByRole('button', { name: 'Add Category' });
    await expect(addCatBtn).toBeVisible({ timeout: 10_000 });
    await addCatBtn.click();

    // Fill category name
    const catNameInput = page.locator('input[placeholder="e.g. Writing Instruments"]');
    await expect(catNameInput).toBeVisible();
    await catNameInput.fill(testCategoryName);

    // Submit category creation
    const submitCatBtn = page.getByRole('button', { name: 'Create Category' });
    await expect(submitCatBtn).toBeEnabled();
    await submitCatBtn.click();

    // Verify created
    await expect(page.locator(`text=${testCategoryName}`).first()).toBeVisible({ timeout: 10_000 });

    // 3. Locate category row in table and trigger deletion
    const categoryRow = page.locator('tr', { hasText: testCategoryName }).first();
    const deleteCatBtn = categoryRow.locator('button[title="Delete category"]');
    await expect(deleteCatBtn).toBeVisible({ timeout: 10_000 });
    await deleteCatBtn.click();

    // 4. SensitiveActionConfirmationModal requires typing exact category name
    await completeTypedConfirmation(page, testCategoryName, 'Confirm & Delete Category');

    // Verify category deleted
    await expect(page.locator('tr', { hasText: testCategoryName })).not.toBeVisible({ timeout: 10_000 });
  });

});
