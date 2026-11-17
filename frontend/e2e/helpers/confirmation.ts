import { Page, expect } from '@playwright/test';

/**
 * Helper to interact with the SensitiveActionConfirmationModal.
 * Verifies that the button is disabled until the exact confirmation phrase is typed,
 * then types the phrase and confirms the action.
 */
export async function completeTypedConfirmation(
  page: Page,
  expectedPhrase: string,
  confirmButtonText = 'Confirm & Execute'
) {
  // Modal container specifically containing the confirmation input
  const modal = page.locator('div[class*="fixed inset-0 z-50"]:has(input[type="text"])').last();
  await expect(modal).toBeVisible({ timeout: 10_000 });

  const input = modal.locator('input[type="text"]');
  await expect(input).toBeVisible();

  // Find the confirmation button in modal footer
  const confirmBtn = modal.locator('button', { hasText: confirmButtonText });
  await expect(confirmBtn).toBeVisible();

  // Initially button must be disabled
  await expect(confirmBtn).toBeDisabled();

  // If we type a partial or wrong phrase, it must still be disabled
  await input.fill('WRONG PHRASE');
  await expect(confirmBtn).toBeDisabled();

  // Now fill the exact expected phrase
  await input.fill(expectedPhrase);
  await expect(confirmBtn).toBeEnabled();

  // Click confirm
  await confirmBtn.click();

  // Wait for modal to disappear
  await expect(modal).not.toBeVisible({ timeout: 15_000 });
}

