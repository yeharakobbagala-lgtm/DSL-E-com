import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { loginAsAdmin, TEST_CREDENTIALS } from '../helpers/auth';
import { completeTypedConfirmation } from '../helpers/confirmation';

test.describe('Workflow 10: Bulk Product Import & Typed Execution Confirmation', () => {

  test('Workflow 10: Upload CSV, validate preview metrics, and execute batch with CONFIRM PRODUCT IMPORT', async ({ page }) => {
    // 1. Authenticate as Super Admin
    await loginAsAdmin(page, TEST_CREDENTIALS.superAdmin.email, TEST_CREDENTIALS.superAdmin.password);
    
    // 2. Navigate to Bulk Import Console
    await page.goto('/admin/products/import');
    await page.waitForLoadState('domcontentloaded');

    // 3. Generate and attach dynamic CSV fixture file
    const timestamp = Date.now();
    const fixturePath = path.resolve(__dirname, '../fixtures/test-import.csv');
    const csvContent = `sku,name,category,brand,sellingPrice,costPrice,stockQuantity,lowStockThreshold,description\nE2E-IMP-${timestamp},E2E Imported Gel Pen ${timestamp},Pens,Speed,220.00,150.00,40,10,High quality imported test pen\n`;
    fs.writeFileSync(fixturePath, csvContent, 'utf-8');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(fixturePath);

    // 4. Click Validate & Preview
    const previewBtn = page.getByRole('button', { name: /Validate & Preview/i });
    await expect(previewBtn).toBeEnabled({ timeout: 10_000 });
    await previewBtn.click();

    // 5. Verify batch preview summary rendered
    await expect(page.locator('text=Ready to Execute Batch?')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('text=Total Rows').first()).toBeVisible();

    // 6. Open Execution Modal
    const executeBtn = page.getByRole('button', { name: /Authorize & Execute Import/i });
    await expect(executeBtn).toBeEnabled();
    await executeBtn.click();

    // 7. Complete typed confirmation with exact required phrase 'CONFIRM PRODUCT IMPORT'
    await completeTypedConfirmation(page, 'CONFIRM PRODUCT IMPORT', 'Confirm & Execute Import');

    // 8. Verify batch processing success banner
    const successBanner = page.locator('text=processed successfully');
    await expect(successBanner).toBeVisible({ timeout: 20_000 });
  });

  test('Workflow 10: Retrying the same import execution with identical idempotency key does not create duplicate imports or duplicate stock', async ({ page }) => {
    // 1. Authenticate as Super Admin
    await loginAsAdmin(page, TEST_CREDENTIALS.superAdmin.email, TEST_CREDENTIALS.superAdmin.password);

    const timestamp = Date.now();
    const sku = `E2E-IDEMP-${timestamp}`;
    const csvContent = `sku,name,category,brand,sellingPrice,costPrice,stockQuantity,lowStockThreshold,description\n${sku},Idempotent Pen ${timestamp},Pens,Speed,300.00,200.00,25,5,Idempotency regression test\n`;

    // 2. Upload preview via API request using the active authenticated browser session
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const formData = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="idemp-${timestamp}.csv"\r\nContent-Type: text/csv\r\n\r\n${csvContent}\r\n--${boundary}--\r\n`;

    const previewRes = await page.request.post('http://localhost:4000/api/v1/products/import/preview', {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Origin': 'http://localhost:3000',
        'X-Requested-With': 'XMLHttpRequest',
      },
      data: Buffer.from(formData),
    });
    expect(previewRes.status()).toBe(201);
    const previewJson = await previewRes.json();
    const { previewId, previewChecksum } = previewJson.data;

    // Fixed idempotency key representing the execution session
    const idempotencyKey = `idemp-retry-e2e-${timestamp}`;

    const executePayload = {
      previewId,
      previewChecksum,
      stockMode: 'ADD_STOCK',
      allowUpdates: true,
      idempotencyKey,
    };

    // 3. First execution
    const execRes1 = await page.request.post('http://localhost:4000/api/v1/products/import/execute', {
      headers: {
        'Content-Type': 'application/json',
        'x-action-confirmation': 'CONFIRM PRODUCT IMPORT',
        'Origin': 'http://localhost:3000',
        'X-Requested-With': 'XMLHttpRequest',
      },
      data: JSON.stringify(executePayload),
    });
    expect(execRes1.status()).toBe(201);
    const execJson1 = await execRes1.json();
    const batchId1 = execJson1.data.batchId;
    expect(batchId1).toBeDefined();

    // 4. Retry execution with the EXACT SAME payload and idempotency key (simulating retry on timeout/network glitch)
    const execRes2 = await page.request.post('http://localhost:4000/api/v1/products/import/execute', {
      headers: {
        'Content-Type': 'application/json',
        'x-action-confirmation': 'CONFIRM PRODUCT IMPORT',
        'Origin': 'http://localhost:3000',
        'X-Requested-With': 'XMLHttpRequest',
      },
      data: JSON.stringify(executePayload),
    });
    expect(execRes2.status()).toBe(201);
    const execJson2 = await execRes2.json();

    // Assert batch ID is identical (reused from existing batch)
    expect(execJson2.data.batchId).toBe(batchId1);

    // 5. Assert product in catalog: exactly 1 product exists and stock was NOT duplicated (remains 25, not 50)
    const productRes = await page.request.get(`http://localhost:4000/api/v1/products?search=${sku}`);
    expect(productRes.status()).toBe(200);
    const productJson = await productRes.json();
    const productList = Array.isArray(productJson.data) ? productJson.data : (productJson.data?.items || []);
    const matched = productList.filter((p: any) => p.sku === sku);
    expect(matched.length).toBe(1);
    expect(matched[0].stockQuantity).toBe(25);
  });

});
