'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Boxes,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Loader2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Product } from '@/types/product';
import { inventoryService } from '@/services/inventoryService';
import { SearchableSelect, SearchableSelectOption } from '@/components/common/SearchableSelect';

export interface BulkStockDraft {
  id: string;
  productId: string;
  direction: 'ADD' | 'DEDUCT';
  quantity: string;
  reason: 'RESTOCK' | 'CORRECTION' | 'DAMAGED' | 'ORDER_FULFILLMENT' | string;
  notes: string;
}

interface BulkAddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSuccess: () => void;
}

// 3 Reference Examples (Display guide only - NOT submitted)
const REFERENCE_STOCK_EXAMPLES = [
  {
    sample: 'Supplier Restock',
    productHint: 'e.g. SPEED RIM Ball Pen 0.7mm Blue',
    direction: '+ In (Restock)',
    quantity: '50 units',
    reason: 'GRN — Supplier Restock (+)',
    note: 'PO-8921 GRN delivery batch A',
  },
  {
    sample: 'Audit Restock',
    productHint: 'e.g. Atlas CR Book 120 Pages Single Line',
    direction: '+ In (Restock)',
    quantity: '20 units',
    reason: 'GRN — Supplier Restock (+)',
    note: 'Warehouse carton restock',
  },
  {
    sample: 'Damaged Stock Deduction',
    productHint: 'e.g. DSL Pastel Highlighter Set of 6',
    direction: '− Out (Deduct)',
    quantity: '2 units',
    reason: 'ADJUSTMENT — Damaged / Expired (-)',
    note: 'Transit packaging damage inspection',
  },
];

const createEmptyStockRow = (): BulkStockDraft => ({
  id: `stock-draft-${Date.now()}-${Math.random()}`,
  productId: '',
  direction: 'ADD',
  quantity: '10',
  reason: 'RESTOCK',
  notes: '',
});

export function BulkAddStockModal({
  isOpen,
  onClose,
  products,
  onSuccess,
}: BulkAddStockModalProps) {
  const [showGuide, setShowGuide] = useState(true);

  // Reason presets
  const reasonOptions: SearchableSelectOption[] = useMemo(() => [
    { value: 'RESTOCK', label: 'GRN — Supplier Restock (+)', badge: '+' },
    { value: 'CORRECTION', label: 'ADJUSTMENT — Count Correction (±)', badge: '±' },
    { value: 'DAMAGED', label: 'ADJUSTMENT — Damaged / Expired (-)', badge: '−' },
    { value: 'ORDER_FULFILLMENT', label: 'INVOICE — Manual Fulfillment (-)', badge: '−' },
  ], []);

  // Map products to SearchableSelect options
  const productOptions: SearchableSelectOption[] = useMemo(() => {
    return products.map((p) => ({
      value: p.id,
      label: p.name,
      sublabel: `SKU: ${p.sku}`,
      badge: `Stock: ${p.stockQuantity}`,
    }));
  }, [products]);

  // Lookup map for fast stock checks
  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  // Start with 1 clean empty row ready for admin input
  const [rows, setRows] = useState<BulkStockDraft[]>(() => [createEmptyStockRow()]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState<{ current: number; total: number } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  // Add new row
  const handleAddRow = () => {
    setRows((prev) => [...prev, createEmptyStockRow()]);
  };

  // Remove row
  const handleRemoveRow = (id: string) => {
    if (rows.length <= 1) {
      setRows([createEmptyStockRow()]);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    setFormError(null);
  };

  // Clear table to 1 empty row
  const handleClearTable = () => {
    setRows([createEmptyStockRow()]);
    setFormError(null);
    setSuccessCount(null);
  };

  // Optional: Copy examples into editable table
  const handleLoadExamplesIntoTable = () => {
    const p1 = products[0]?.id || '';
    const p2 = products[1]?.id || p1;
    const p3 = products[2]?.id || p1;

    setRows([
      {
        id: `stock-example-${Date.now()}-1`,
        productId: p1,
        direction: 'ADD',
        quantity: '50',
        reason: 'RESTOCK',
        notes: 'Supplier shipment GRN delivery',
      },
      {
        id: `stock-example-${Date.now()}-2`,
        productId: p2,
        direction: 'ADD',
        quantity: '20',
        reason: 'RESTOCK',
        notes: 'Warehouse carton restock batch A',
      },
      {
        id: `stock-example-${Date.now()}-3`,
        productId: p3,
        direction: 'DEDUCT',
        quantity: '2',
        reason: 'DAMAGED',
        notes: 'Transit packaging damage inspection',
      },
    ]);
    setFormError(null);
    setSuccessCount(null);
  };

  // Update field
  const handleFieldChange = (
    id: string,
    field: keyof BulkStockDraft,
    val: any
  ) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  // Summary calculations
  const totalIncoming = rows.reduce((sum, r) => {
    if (r.direction === 'ADD' && r.productId) {
      const q = parseInt(r.quantity, 10);
      return sum + (isNaN(q) ? 0 : Math.max(0, q));
    }
    return sum;
  }, 0);

  const totalOutgoing = rows.reduce((sum, r) => {
    if (r.direction === 'DEDUCT' && r.productId) {
      const q = parseInt(r.quantity, 10);
      return sum + (isNaN(q) ? 0 : Math.max(0, q));
    }
    return sum;
  }, 0);

  // Submit all active rows
  const handleSaveAll = async () => {
    setFormError(null);
    setSuccessCount(null);

    // Filter only rows where user picked a product
    const activeRows = rows.filter((r) => !!r.productId);

    if (activeRows.length === 0) {
      setFormError('Please select at least one product in the table before saving.');
      return;
    }

    const errors: string[] = [];
    activeRows.forEach((row, idx) => {
      const rowNum = idx + 1;
      const qty = parseInt(row.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        errors.push(`Row ${rowNum}: Quantity must be greater than 0.`);
      }

      // Check for deductions exceeding stock
      if (row.direction === 'DEDUCT') {
        const prod = productMap.get(row.productId);
        if (prod && qty > prod.stockQuantity) {
          errors.push(
            `Row ${rowNum}: Cannot deduct ${qty} from "${prod.name}" (only ${prod.stockQuantity} in stock).`
          );
        }
      }
    });

    if (errors.length > 0) {
      setFormError(errors.slice(0, 3).join(' | ') + (errors.length > 3 ? ` (+${errors.length - 3} more)` : ''));
      return;
    }

    setIsSaving(true);
    setSaveProgress({ current: 0, total: activeRows.length });

    let applied = 0;
    const saveErrors: string[] = [];

    for (let i = 0; i < activeRows.length; i++) {
      const row = activeRows[i];
      setSaveProgress({ current: i + 1, total: activeRows.length });

      try {
        const rawQty = Math.max(1, parseInt(row.quantity, 10) || 1);
        const signedDelta = row.direction === 'ADD' ? rawQty : -rawQty;

        await inventoryService.adjustStock(
          row.productId,
          signedDelta,
          row.reason,
          row.notes.trim() || undefined
        );
        applied++;
      } catch (err: any) {
        const p = productMap.get(row.productId);
        saveErrors.push(`Row ${i + 1} (${p?.name || row.productId}): ${err?.message || 'Adjustment failed'}`);
      }
    }

    setIsSaving(false);
    setSaveProgress(null);

    if (saveErrors.length === 0) {
      setSuccessCount(applied);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } else {
      setFormError(`Applied ${applied}/${activeRows.length} adjustments. Errors: ${saveErrors.join(', ')}`);
      onSuccess();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-7xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#08275E] text-white shadow-sm">
              <Boxes className="w-5 h-5 text-[#FFD21C]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Add &amp; Adjust Stock — Table Data Entry
                </h2>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Bulk Restock Table
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Select products with searchable dropdown, set incoming (+) or outgoing (-) quantities, and apply changes in batch.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Toggle example guide"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>{showGuide ? 'Hide Example Guide' : 'Show Example Guide'}</span>
              {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={handleClearTable}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Reset to 1 clean empty row"
            >
              <span>Clear Table</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Example Guide (For Display Only to understand how to apply data - NOT submitted) */}
        {showGuide && (
          <div className="px-6 py-3 bg-emerald-50/60 border-b border-emerald-100 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-800 text-white text-[10px] font-black uppercase tracking-wider">
                  Display Guide Only
                </span>
                <span className="font-bold text-slate-700 text-xs">
                  How stock adjustments work (These 3 examples are for reference only — they will not be saved):
                </span>
              </div>
              <button
                type="button"
                onClick={handleLoadExamplesIntoTable}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer inline-flex items-center gap-1 self-start sm:self-auto"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Load these examples into table as template</span>
              </button>
            </div>

            {/* Read-only guide preview table */}
            <div className="overflow-x-auto rounded-xl border border-emerald-200/70 bg-white/90 shadow-2xs">
              <table className="min-w-[950px] w-full text-left text-[11px]">
                <thead>
                  <tr className="bg-emerald-100/50 text-emerald-900 font-bold border-b border-emerald-200/60">
                    <th className="py-1.5 px-3">Example #</th>
                    <th className="py-1.5 px-3">Adjustment Purpose</th>
                    <th className="py-1.5 px-3">Product Name</th>
                    <th className="py-1.5 px-3">Direction</th>
                    <th className="py-1.5 px-3 text-center">Quantity</th>
                    <th className="py-1.5 px-3">Reason Classification</th>
                    <th className="py-1.5 px-3">Audit Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50 text-slate-600">
                  {REFERENCE_STOCK_EXAMPLES.map((ex, i) => (
                    <tr key={i} className="hover:bg-emerald-50/30">
                      <td className="py-1.5 px-3 font-mono font-bold text-emerald-700">Sample {i + 1}</td>
                      <td className="py-1.5 px-3 font-semibold text-slate-800">{ex.sample}</td>
                      <td className="py-1.5 px-3 text-slate-700">{ex.productHint}</td>
                      <td className="py-1.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            ex.direction.includes('+')
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {ex.direction}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-center font-bold text-slate-800">{ex.quantity}</td>
                      <td className="py-1.5 px-3 text-slate-700">{ex.reason}</td>
                      <td className="py-1.5 px-3 text-slate-500 italic">{ex.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Dynamic Summary Metric Pills */}
        <div className="px-6 py-3 bg-slate-50/60 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600 font-medium">Incoming (Restock):</span>
              <strong className="text-emerald-700 font-black">+{totalIncoming} units</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-600 font-medium">Outgoing (Deductions):</span>
              <strong className="text-rose-700 font-black">−{totalOutgoing} units</strong>
            </div>
          </div>

          <div className="text-slate-400 text-[11px]">
            {rows.filter((r) => !!r.productId).length} product{rows.filter((r) => !!r.productId).length > 1 ? 's' : ''} ready to adjust
          </div>
        </div>

        {/* Notifications */}
        {formError && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-2 text-xs font-bold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="truncate">{formError}</span>
          </div>
        )}

        {successCount !== null && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Successfully updated stock for {successCount} product{successCount > 1 ? 's' : ''}! Refreshing inventory...</span>
          </div>
        )}

        {/* Table Area */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-6">
          <table className="min-w-[1300px] w-full text-left text-xs border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-bold">
                <th className="py-2.5 px-3 rounded-l-xl border-y border-l border-slate-200 w-10 text-center">#</th>
                <th className="py-2.5 px-3 border-y border-slate-200 min-w-[280px]">Select Product (Dropdown + Type) *</th>
                <th className="py-2.5 px-3 border-y border-slate-200 w-24 text-center">Current</th>
                <th className="py-2.5 px-3 border-y border-slate-200 w-36">Direction *</th>
                <th className="py-2.5 px-3 border-y border-slate-200 w-24 text-center">Units *</th>
                <th className="py-2.5 px-3 border-y border-slate-200 min-w-[220px]">Classification / Reason *</th>
                <th className="py-2.5 px-3 border-y border-slate-200 min-w-[180px]">Audit Remarks / PO Ref</th>
                <th className="py-2.5 px-3 border-y border-slate-200 w-24 text-center">New Balance</th>
                <th className="py-2.5 px-3 rounded-r-xl border-y border-r border-slate-200 w-12 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, idx) => {
                const product = productMap.get(row.productId);
                const currentStock = product ? product.stockQuantity : 0;
                const parsedQty = parseInt(row.quantity, 10) || 0;
                const newBalance =
                  row.direction === 'ADD'
                    ? currentStock + parsedQty
                    : Math.max(0, currentStock - parsedQty);

                return (
                  <tr key={row.id} className="hover:bg-blue-50/20 transition-colors">
                    {/* Row # */}
                    <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                      <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[11px] mx-auto">
                        {idx + 1}
                      </span>
                    </td>

                    {/* Product Dropdown with live search */}
                    <td className="py-2.5 px-2">
                      <SearchableSelect
                        options={productOptions}
                        value={row.productId}
                        onChange={(val) => handleFieldChange(row.id, 'productId', val)}
                        placeholder="Search or select product..."
                        searchPlaceholder="Type product name or SKU..."
                        className="w-full"
                      />
                    </td>

                    {/* Current Stock */}
                    <td className="py-2.5 px-2 text-center">
                      <span className="font-extrabold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg text-xs font-mono">
                        {row.productId ? currentStock : '—'}
                      </span>
                    </td>

                    {/* Direction (+ Add or - Deduct) */}
                    <td className="py-2.5 px-2">
                      <select
                        value={row.direction}
                        onChange={(e) =>
                          handleFieldChange(row.id, 'direction', e.target.value as 'ADD' | 'DEDUCT')
                        }
                        className={`w-full px-2.5 py-1.5 rounded-lg border font-bold text-xs ${
                          row.direction === 'ADD'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        <option value="ADD">+ In (Restock / Add)</option>
                        <option value="DEDUCT">− Out (Deduct / Loss)</option>
                      </select>
                    </td>

                    {/* Quantity */}
                    <td className="py-2.5 px-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 50"
                        value={row.quantity}
                        onChange={(e) => handleFieldChange(row.id, 'quantity', e.target.value)}
                        className={`w-full px-2 py-1.5 rounded-lg border font-black text-center text-xs ${
                          row.direction === 'ADD'
                            ? 'border-emerald-300 bg-emerald-50/50 text-emerald-900'
                            : 'border-rose-300 bg-rose-50/50 text-rose-900'
                        }`}
                      />
                    </td>

                    {/* Classification Reason (Dropdown + Type Custom) */}
                    <td className="py-2.5 px-2">
                      <SearchableSelect
                        options={reasonOptions}
                        value={row.reason}
                        onChange={(val) => handleFieldChange(row.id, 'reason', val)}
                        placeholder="Select or type reason..."
                        searchPlaceholder="Search or type custom reason..."
                        allowCreate={true}
                        createPrefix="Custom reason"
                        className="w-full"
                      />
                    </td>

                    {/* Audit Notes */}
                    <td className="py-2.5 px-2">
                      <input
                        type="text"
                        placeholder="Optional PO Ref or audit note"
                        value={row.notes}
                        onChange={(e) => handleFieldChange(row.id, 'notes', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs"
                      />
                    </td>

                    {/* Resulting Balance */}
                    <td className="py-2.5 px-2 text-center font-mono">
                      <span
                        className={`font-black text-xs px-2.5 py-1 rounded-lg ${
                          !row.productId
                            ? 'text-slate-400 bg-slate-50'
                            : newBalance > currentStock
                            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                            : newBalance < currentStock
                            ? 'text-rose-700 bg-rose-50 border border-rose-200'
                            : 'text-slate-700 bg-slate-50'
                        }`}
                      >
                        {row.productId ? newBalance : '—'}
                      </span>
                    </td>

                    {/* Delete Row */}
                    <td className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.id)}
                        disabled={isSaving}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Add Row Button */}
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handleAddRow}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#08275E] bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200/80 shadow-2xs cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Another Product Adjustment Row</span>
            </button>

            <span className="text-xs text-slate-500 font-medium">
              {rows.filter((r) => !!r.productId).length} of {rows.length} product adjustment row{rows.length > 1 ? 's' : ''} ready to save
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80">
          <div className="text-xs text-slate-500">
            {saveProgress ? (
              <span className="inline-flex items-center gap-2 font-bold text-[#08275E]">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                Applying adjustment {saveProgress.current} of {saveProgress.total}...
              </span>
            ) : (
              <span>Only rows with a selected product will be updated in warehouse inventory.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving || rows.filter((r) => !!r.productId).length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#08275E] hover:bg-[#0c357d] shadow-md shadow-[#08275E]/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Applying Changes...</span>
                </>
              ) : (
                <>
                  <Boxes className="w-4 h-4 text-[#FFD21C]" />
                  <span>
                    Save &amp; Apply{' '}
                    {rows.filter((r) => !!r.productId).length > 0
                      ? `${rows.filter((r) => !!r.productId).length} Stock Adjustment${
                          rows.filter((r) => !!r.productId).length > 1 ? 's' : ''
                        }`
                      : 'Adjustments'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
