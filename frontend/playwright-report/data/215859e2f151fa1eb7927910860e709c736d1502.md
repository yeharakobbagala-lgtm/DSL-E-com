# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 07-customize-pen-calibration.spec.ts >> Admin Pen Customization Calibration Studio >> should open visual calibration modal and display interactive controls
- Location: e2e\specs\07-customize-pen-calibration.spec.ts:8:3

# Error details

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "Admin Portal Sign In" [level=1] [ref=e10]
      - paragraph [ref=e11]: Authorized store managers and administrators
    - generic [ref=e12]: Invalid administrative email or password
    - generic [ref=e16]:
      - generic [ref=e17]:
        - generic [ref=e18]: Admin Email
        - textbox "admin@dslstationery.lk" [ref=e19]: e2e.superadmin@dslstationery.lk
      - generic [ref=e20]:
        - generic [ref=e21]: Password
        - textbox "••••••••••••" [ref=e22]: AdminPassword123!
      - button "Sign In to Admin Dashboard" [ref=e23] [cursor=pointer]
    - link "Return to Customer Storefront" [ref=e28] [cursor=pointer]:
      - /url: /home
  - alert [ref=e34]
```

# Test source

```ts
  1  | import { Page, expect } from '@playwright/test';
  2  | 
  3  | export const TEST_CREDENTIALS = {
  4  |   superAdmin: {
  5  |     email: 'e2e.superadmin@dslstationery.lk',
  6  |     password: 'AdminPassword123!',
  7  |   },
  8  |   projectManager: {
  9  |     email: 'e2e.project.manager@dslstationery.lk',
  10 |     password: 'ManagerPassword123!',
  11 |   },
  12 |   orderManager: {
  13 |     email: 'e2e.order.manager@dslstationery.lk',
  14 |     password: 'OrderMgrPassword123!',
  15 |   },
  16 |   quarantined: {
  17 |     email: 'e2e.quarantined@dslstationery.lk',
  18 |     password: 'QuarantinePass123!',
  19 |   },
  20 | };
  21 | 
  22 | /**
  23 |  * Perform a real browser login through the /admin/login form
  24 |  */
  25 | export async function loginAsAdmin(
  26 |   page: Page,
  27 |   email = TEST_CREDENTIALS.superAdmin.email,
  28 |   password = TEST_CREDENTIALS.superAdmin.password
  29 | ) {
  30 |   await page.goto('/admin/login');
  31 |   await page.waitForLoadState('domcontentloaded');
  32 | 
  33 |   const emailInput = page.locator('input[type="email"]');
  34 |   const passwordInput = page.locator('input[type="password"]');
  35 |   const submitButton = page.locator('button[type="submit"]');
  36 | 
  37 |   await expect(emailInput).toBeVisible({ timeout: 10_000 });
  38 |   await emailInput.fill(email);
  39 |   await passwordInput.fill(password);
  40 |   await submitButton.click();
  41 | 
  42 |   // Wait until the browser leaves /admin/login and navigates into an authorized admin route
> 43 |   await page.waitForURL(
     |              ^ TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
  44 |     (url) => url.pathname.startsWith('/admin') && !url.pathname.includes('/login'),
  45 |     { timeout: 15_000 }
  46 |   );
  47 |   await page.waitForLoadState('domcontentloaded');
  48 | }
  49 | 
  50 | /**
  51 |  * Log out from the administrator portal
  52 |  */
  53 | export async function logoutAdmin(page: Page) {
  54 |   const logoutBtn = page.getByRole('button', { name: 'Logout' }).or(page.getByRole('button', { name: 'Sign Out' })).first();
  55 |   await expect(logoutBtn).toBeVisible({ timeout: 10_000 });
  56 |   await logoutBtn.click();
  57 |   await page.waitForURL(/\/admin\/login/, { timeout: 10_000 });
  58 | }
  59 | 
```