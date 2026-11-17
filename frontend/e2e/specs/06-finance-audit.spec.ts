import { test, expect } from '@playwright/test';
import { loginAsAdmin, TEST_CREDENTIALS } from '../helpers/auth';
import { completeTypedConfirmation } from '../helpers/confirmation';
import { getBankDepositSubmission, queryLatestAuditLog } from '../helpers/db';

test.describe('Workflow 12 & 13: Financial Controls, Bank Deposits, Audit Logs & CSV Export', () => {

  test('Workflow 12: Complete Bank Deposit Approval workflow with typed confirmation and audit logging', async ({ page }) => {
    // 1. Authenticate as Authorized Super Admin (has payments.verify_bank_deposit)
    await loginAsAdmin(page, TEST_CREDENTIALS.superAdmin.email, TEST_CREDENTIALS.superAdmin.password);

    // 2. Access Bank Transfers Review Queue
    await page.goto('/admin/payments/bank-transfers');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('heading', { name: 'Bank Transfers Review Queue' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=Stage 3.3 — Verification of customer deposit slips').first()).toBeVisible();

    // 3. Locate the seeded pending submission row (DSL-2026-E2E-BANK / TX-E2E-REF-999)
    const testRow = page.locator('tr:has-text("TX-E2E-REF-999")').or(page.locator('tr:has-text("DSL-2026-E2E-BANK")')).first();
    await expect(testRow).toBeVisible({ timeout: 10_000 });
    await expect(testRow.locator('text=PENDING')).toBeVisible();

    // 4. Open Verification Drawer
    const reviewBtn = testRow.getByRole('button', { name: 'Review Slip' });
    await reviewBtn.click();

    // 5. Drawer opens with comparison checklist and approval action
    await expect(page.locator('text=Corporate Bank Statement Comparison Required').first()).toBeVisible({ timeout: 10_000 });
    const verifyBtn = page.getByRole('button', { name: 'Verify & Confirm Order' });
    await expect(verifyBtn).toBeVisible();
    await verifyBtn.click();

    // 6. Intermediate approval notes modal opens
    await expect(page.getByRole('heading', { name: 'Approve Bank Transfer' })).toBeVisible({ timeout: 10_000 });
    const confirmApprovalBtn = page.getByRole('button', { name: 'Confirm Approval' });
    await expect(confirmApprovalBtn).toBeVisible();
    await confirmApprovalBtn.click();

    // 7. Sensitive Action Typed Confirmation Modal opens
    // Enforces exact phrase "APPROVE BANK DEPOSIT"
    await completeTypedConfirmation(page, 'APPROVE BANK DEPOSIT', 'Confirm & Approve Deposit');

    // 8. Assert successful status transition to VERIFIED in UI
    const successAlert = page.locator('text=Bank transfer verified successfully! Order is now confirmed.').first();
    await expect(successAlert).toBeVisible({ timeout: 10_000 });

    // Drawer or table status badge updates to VERIFIED
    const verifiedBadge = page.locator('span:has-text("VERIFIED")').first();
    await expect(verifiedBadge).toBeVisible({ timeout: 10_000 });

    // 9. Verify PostgreSQL Database State & Append-Only Audit Trail
    const sub = await getBankDepositSubmission('e2e-bank-sub-001');
    expect(sub).not.toBeNull();
    expect(sub.status).toBe('VERIFIED');
    expect(sub.reviewedById).not.toBeNull();

    const audit = await queryLatestAuditLog('APPROVE_BANK_TRANSFER', 'e2e-bank-sub-001');
    expect(audit).not.toBeNull();
    expect(audit.entityType).toBe('BankDepositSubmission');
    expect(audit.description).toContain('DSL-2026-E2E-BANK');
  });

  test('Workflow 12: Repeated approval attempt is rejected with HTTP 409 Conflict', async ({ page }) => {
    // 1. Authenticate as Super Admin
    await loginAsAdmin(page, TEST_CREDENTIALS.superAdmin.email, TEST_CREDENTIALS.superAdmin.password);

    // 2. Perform direct approval re-attempt on already VERIFIED submission
    const result = await page.evaluate(async () => {
      const res = await fetch('http://localhost:4000/api/v1/admin/payments/bank-transfers/e2e-bank-sub-001/approve', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'x-action-confirmation': 'APPROVE BANK DEPOSIT',
        },
        body: JSON.stringify({ adminNotes: 'Duplicate approval re-attempt test' }),
      });
      return { status: res.status, body: await res.json() };
    });

    // 3. Assert HTTP 409 Conflict
    expect(result.status).toBe(409);
    expect(result.body.message).toContain('already been verified');
  });

  test('Workflow 12: Unauthorized administrator is denied in UI and direct API returns HTTP 403', async ({ page }) => {
    // 1. Authenticate as Quarantined Admin (lacks payments.verify_bank_deposit)
    await loginAsAdmin(page, TEST_CREDENTIALS.quarantined.email, TEST_CREDENTIALS.quarantined.password);

    // 2. Navigate to Bank Transfers Review Queue
    await page.goto('/admin/payments/bank-transfers');
    await page.waitForLoadState('domcontentloaded');

    // 3. Verify UI displays restricted staff advisory
    const readOnlyAdvisory = page.locator('text=Read-Only Staff Mode:').or(page.locator('h2:has-text("Access Restricted")'));
    await expect(readOnlyAdvisory.first()).toBeVisible({ timeout: 10_000 });

    // 4. Verification action buttons must be hidden / absent
    await expect(page.getByRole('button', { name: 'Verify & Confirm Order' })).not.toBeVisible();

    // 5. Direct API request must return HTTP 403 Forbidden
    const apiResult = await page.evaluate(async () => {
      const res = await fetch('http://localhost:4000/api/v1/admin/payments/bank-transfers/e2e-bank-sub-001/approve', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'x-action-confirmation': 'APPROVE BANK DEPOSIT',
        },
        body: JSON.stringify({ adminNotes: 'Unauthorized attempt' }),
      });
      return { status: res.status };
    });

    expect(apiResult.status).toBe(403);

    // 6. Verify deposit status remains unchanged in the database
    const sub = await getBankDepositSubmission('e2e-bank-sub-001');
    expect(sub).not.toBeNull();
    expect(sub.status).toBe('VERIFIED'); // Remains from previous test, unaffected by unauthorized request
  });

  test('Workflow 12: Financial permissions, bank transfers review queue, and store bank configuration', async ({ page }) => {
    // 1. Authenticate as Super Admin
    await loginAsAdmin(page, TEST_CREDENTIALS.superAdmin.email, TEST_CREDENTIALS.superAdmin.password);

    // 2. Inspect Store Configuration and Bank Details
    await page.goto('/admin/settings');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('text=Application & Store Settings').first()).toBeVisible({ timeout: 10_000 });
    const bankSection = page.locator('text=Bank Transfer Payment Gateway').or(page.locator('text=Account Number'));
    await expect(bankSection.first()).toBeVisible({ timeout: 10_000 });
  });

  test('Workflow 13: Unified audit logs viewing, source switching, and RFC 4180 CSV export', async ({ page }) => {
    // 1. Authenticate as Super Admin
    await loginAsAdmin(page, TEST_CREDENTIALS.superAdmin.email, TEST_CREDENTIALS.superAdmin.password);

    // 2. View Unified Audit Logs Console
    await page.goto('/admin/audit-logs');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('heading', { name: 'Audit Logs' })).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=All Audit Sources').first()).toBeVisible();
    await expect(page.locator('text=Order Lifecycle').first()).toBeVisible();

    // 3. Navigate to Super Admin Center for compliance CSV export
    await page.goto('/admin/super-admin');
    await page.waitForLoadState('domcontentloaded');

    const exportBtn = page.getByRole('button', { name: /Export Audit CSV|Export RFC 4180 CSV/i }).first();
    await expect(exportBtn).toBeVisible({ timeout: 10_000 });

    // 4. Trigger and capture CSV download event
    const downloadPromise = page.waitForEvent('download', { timeout: 15_000 });
    await exportBtn.click();
    const download = await downloadPromise;

    // Verify downloaded filename format
    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.csv$/i);
    expect(suggestedFilename.toLowerCase()).toContain('admin');
  });

});
