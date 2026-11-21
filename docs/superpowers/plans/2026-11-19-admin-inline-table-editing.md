# Admin Inline Table / Spreadsheet Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement spreadsheet-style inline table editing across the three core admin sections (Inventory, Products, Categories) while keeping all existing single-item modal cards and detailed edit pages 100% intact.

---

## 1. Scope & Key Invariants
- **Cards preserved:** All existing modal cards (`Adjust Stock` modal, `Add/Edit Category` modal, `Product Edit` page) must remain functional and accessible.
- **Toggleable Mode:** Each table has a clean `⚡ Quick Edit Mode` or `Spreadsheet Mode` toggle button so normal browsing is never cluttered.
- **Safety & Validation:** Negative stock prevention, checkout reservation checks, non-empty category names, and valid price numbers must be strictly enforced before saving.
- **Atomic / Batch Feedback:** Clear visual feedback showing which rows were changed (highlighted rows), how many items are dirty, and a persistent floating bottom dock with `Save All Changes` and `Discard`.

---

## 2. Tasks

### Task 1: Inventory Table Inline Stock Editing (`/admin/inventory`)
- [x] Add `isQuickEditMode: boolean` and `pendingStockChanges: Record<string, { delta: number; reason: InventoryChangeReason; note?: string }>` state in `frontend/src/app/admin/inventory/page.tsx`.
- [x] Add `[⚡ Quick Stock Edit]` toggle button to the inventory table header.
- [x] When enabled, render an inline adjustment widget in each row:
  - Signed numeric input (`+20`, `-5`) or Add/Deduct toggle with quick pills (`+10`, `+20`, `+50`).
  - Reason selector dropdown per modified row.
  - Highlight rows that have pending changes.
- [x] Add a floating bottom action dock when `pendingStockChanges` is non-empty:
  - Display: `X products modified | Total units to adjust: +Y`.
  - `Discard All` button (clears state).
  - `Save All Adjustments` button with loading state.
- [x] Implement batch submission handler: iterates over pending changes, executes `inventoryService.adjustStock` in parallel with error aggregation, and triggers live reload.
- [x] Verify existing single-item `Adjust Stock` modal button continues to work seamlessly.

---

### Task 2: Products Table Inline Quick Editing (`/admin/products`)
- [x] Add `isQuickEditMode: boolean` and `pendingProductEdits: Record<string, { price?: number; stockQuantity?: number; isActive?: boolean }>` state in `frontend/src/app/admin/products/page.tsx`.
- [x] Add `[⚡ Quick Edit Mode]` toggle button to the products table toolbar.
- [x] When enabled, replace read-only cells with inline inputs:
  - **Price**: Number input formatted for LKR.
  - **Stock**: Number input (min 0).
  - **Status**: Quick dropdown or toggle pill (`ACTIVE` / `DRAFT`).
- [x] Highlight edited rows with an accent background (e.g. amber/blue border).
- [x] Add a floating bottom action dock when `pendingProductEdits` has entries:
  - Display: `X products modified`.
  - `Discard Changes` button.
  - `Save All Changes` button with progress loader.
- [x] Implement batch update handler calling `productService.updateProduct` for all modified rows.
- [x] Verify standard `Edit` and `Delete` actions remain intact.

---

### Task 3: Categories Table Inline Creation & Editing (`/admin/categories`)
- [x] Add `isQuickEditMode: boolean`, `inlineNewCategory: { name: string; parentId: string; displayOrder: number } | null`, and `pendingCategoryEdits: Record<string, { name: string; parentId: string; displayOrder: number }>` state in `frontend/src/app/admin/categories/page.tsx`.
- [x] Add `[➕ Quick Add Row]` and `[⚡ Quick Edit]` toggle buttons to the categories table header.
- [x] When `[➕ Quick Add Row]` is clicked, prepend an editable input row at the top of the table:
  - Category Name input (with autofocus).
  - Parent Category searchable select / dropdown (`None` for root, or select existing parent).
  - Display Order number input.
  - Actions: `✓ Save` button (or Enter key) and `✕ Cancel` button.
- [x] When `[⚡ Quick Edit]` is active, category names, parent dropdowns, and display order cells become inline editable fields with a floating `Save All Changes` dock.
- [x] Connect inline category creation to `categoryService.createCategory` and updates to `categoryService.updateCategory`.
- [x] Verify the existing "Add New Category" card modal and "Edit" card modal remain 100% functional.

---

### Task 4: End-to-End Verification & Build Check
- [x] Run Next.js production build (`npm run build`) to ensure 0 TypeScript or lint errors.
- [x] Test Inventory inline stock adjustments with positive and negative numbers.
- [x] Test Products inline price, stock, and status updates.
- [x] Test Categories inline row creation and inline editing.
- [x] Confirm all modal cards open and submit without regression.
