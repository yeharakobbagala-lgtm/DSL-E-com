'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  PackagePlus,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Loader2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { ProductCategory, Brand } from '@/types/product';
import { productService } from '@/services/productService';
import { brandService } from '@/services/brandService';
import { categoryService } from '@/services/categoryService';
import { SearchableSelect, SearchableSelectOption } from '@/components/common/SearchableSelect';
import { resolveImageUrl } from '@/lib/image';

export interface BulkProductDraft {
  id: string;
  name: string;
  imageUrl?: string;
  isUploading?: boolean;
  uploadError?: string;
  brandName: string;
  parentCategory: string;
  subCategory: string;
  price: string;
  stockQuantity: string;
  sku: string;
  description: string;
  isActive: boolean;
}

interface BulkAddProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ProductCategory[];
  brands: Brand[];
  onSuccess: () => void;
}

// 3 Reference Examples (Display only guide to show how to format data)
const REFERENCE_EXAMPLES = [
  {
    name: 'SPEED RIM Ball Pen 0.7mm Blue',
    brand: 'Speed',
    parentCategory: 'Pens',
    subCategory: 'Ballpoint Pens',
    price: '60.00',
    stock: '150',
    sku: 'DSL-SPD-BLU',
    description: 'Smooth writing 0.7mm ballpoint pen with rubber grip',
  },
  {
    name: 'Atlas CR Book 120 Pages Single Line',
    brand: 'Atlas',
    parentCategory: 'Books & Exercise',
    subCategory: 'CR Exercise Books',
    price: '240.00',
    stock: '80',
    sku: 'DSL-CR-120-SL',
    description: 'Hardcover 120 pages single rule student exercise book',
  },
  {
    name: 'DSL Pastel Highlighter Set of 6',
    brand: 'DSL',
    parentCategory: 'Art & Writing',
    subCategory: '-- None (No Subcategory) --',
    price: '650.00',
    stock: '45',
    sku: 'DSL-HL-PST-6',
    description: 'Assorted soft pastel color chisel tip study highlighters',
  },
];

const createEmptyRow = (): BulkProductDraft => ({
  id: `draft-${Date.now()}-${Math.random()}`,
  name: '',
  imageUrl: '',
  isUploading: false,
  uploadError: undefined,
  brandName: '',
  parentCategory: '',
  subCategory: '',
  price: '',
  stockQuantity: '0',
  sku: '',
  description: '',
  isActive: true,
});

export function BulkAddProductsModal({
  isOpen,
  onClose,
  categories,
  brands,
  onSuccess,
}: BulkAddProductsModalProps) {
  const [showGuide, setShowGuide] = useState(true);

  // Convert root categories to SearchableSelect options
  const parentCategoryOptions: SearchableSelectOption[] = useMemo(() => {
    return categories
      .filter((c) => !c.parentId)
      .map((c) => ({
        value: c.id,
        label: c.name,
      }));
  }, [categories]);

  // Convert brands to SearchableSelect options
  const brandOptions: SearchableSelectOption[] = useMemo(() => {
    return brands.map((b) => ({
      value: b.id,
      label: b.name,
    }));
  }, [brands]);

  // Map subcategories grouped by parent ID
  const subCategoryMap = useMemo(() => {
    const map = new Map<string, SearchableSelectOption[]>();
    categories.forEach((c) => {
      if (c.parentId) {
        const arr = map.get(c.parentId) || [];
        arr.push({ value: c.id, label: c.name });
        map.set(c.parentId, arr);
      }
    });
    return map;
  }, [categories]);

  // All subcategories
  const allSubCategoryOptions: SearchableSelectOption[] = useMemo(() => {
    return categories
      .filter((c) => !!c.parentId)
      .map((c) => ({
        value: c.id,
        label: c.name,
      }));
  }, [categories]);

  const getSubOptions = (parentId: string): SearchableSelectOption[] => {
    if (!parentId) return allSubCategoryOptions;
    return subCategoryMap.get(parentId) || [];
  };

  // Start with 1 clean empty row ready for admin input
  const [rows, setRows] = useState<BulkProductDraft[]>(() => [createEmptyRow()]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState<{ current: number; total: number } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  // Add new empty row
  const handleAddRow = () => {
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  // Remove row
  const handleRemoveRow = (id: string) => {
    if (rows.length <= 1) {
      setRows([createEmptyRow()]);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    setFormError(null);
  };

  // Clear table to 1 empty row
  const handleClearTable = () => {
    setRows([createEmptyRow()]);
    setFormError(null);
    setSuccessCount(null);
  };

  // Optional: Copy the 3 display examples into the editable table
  const handleLoadExamplesIntoTable = () => {
    const loadedRows: BulkProductDraft[] = REFERENCE_EXAMPLES.map((ex, idx) => {
      const matchedBrand = brands.find((b) => b.name.toLowerCase() === ex.brand.toLowerCase());
      const firstParent = categories.find((c) => !c.parentId);
      return {
        id: `draft-example-${Date.now()}-${idx}`,
        name: ex.name,
        imageUrl: '',
        isUploading: false,
        uploadError: undefined,
        brandName: matchedBrand ? matchedBrand.id : ex.brand,
        parentCategory: firstParent ? firstParent.id : '',
        subCategory: '',
        price: ex.price,
        stockQuantity: ex.stock,
        sku: ex.sku,
        description: ex.description,
        isActive: true,
      };
    });
    setRows(loadedRows);
    setFormError(null);
    setSuccessCount(null);
  };

  const handleRowImageUpload = async (rowId: string, file: File) => {
    handleFieldChange(rowId, 'isUploading' as any, true);
    handleFieldChange(rowId, 'uploadError' as any, undefined);

    try {
      const url = await productService.uploadProductImage(file);
      handleFieldChange(rowId, 'imageUrl' as any, url);
    } catch (err: any) {
      handleFieldChange(rowId, 'uploadError' as any, err?.message || 'Upload failed');
    } finally {
      handleFieldChange(rowId, 'isUploading' as any, false);
    }
  };

  const handleRowImageRemove = (rowId: string) => {
    handleFieldChange(rowId, 'imageUrl' as any, '');
  };

  // Update specific field in row
  const handleFieldChange = (
    id: string,
    field: keyof BulkProductDraft,
    val: any
  ) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: val };
        if (field === 'parentCategory' && val) {
          const subs = subCategoryMap.get(val) || [];
          if (!subs.some((s) => s.value === updated.subCategory)) {
            updated.subCategory = '';
          }
        }
        return updated;
      })
    );
  };

  // Validate and submit only active rows
  const handleSaveAll = async () => {
    setFormError(null);
    setSuccessCount(null);

    // Filter only rows where user entered a product name
    const activeRows = rows.filter((r) => r.name.trim().length > 0);

    if (activeRows.length === 0) {
      setFormError('Please enter at least one product name in the table before saving.');
      return;
    }

    const errors: string[] = [];
    activeRows.forEach((row, idx) => {
      const rowNum = idx + 1;
      const priceNum = parseFloat(row.price);
      if (isNaN(priceNum) || priceNum < 0) {
        errors.push(`Row ${rowNum} ("${row.name}"): Please enter a valid Price in LKR.`);
      }
    });

    if (errors.length > 0) {
      setFormError(errors.slice(0, 3).join(' | ') + (errors.length > 3 ? ` (+${errors.length - 3} more)` : ''));
      return;
    }

    setIsSaving(true);
    setSaveProgress({ current: 0, total: activeRows.length });

    let created = 0;
    const saveErrors: string[] = [];

    const createdBrandMap = new Map<string, string>();
    const createdCategoryMap = new Map<string, string>();

    // Fallbacks so backend validation never fails if brand/category are left empty
    const defaultBrandId =
      brands.find((b) => b.name.toLowerCase() === 'dsl' || b.name.toLowerCase() === 'generic')?.id ||
      brands[0]?.id;
    const defaultCategoryId =
      categories.find((c) => !c.parentId)?.id ||
      categories[0]?.id;

    for (let i = 0; i < activeRows.length; i++) {
      const row = activeRows[i];
      setSaveProgress({ current: i + 1, total: activeRows.length });

      try {
        const cleanName = row.name.trim();
        const generatedSlug = cleanName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const autoSku = row.sku.trim() || `DSL-${generatedSlug.toUpperCase().slice(0, 8)}-${Date.now().toString().slice(-4)}`;

        // 1. Resolve Brand
        let resolvedBrandId: string | undefined = undefined;
        if (row.brandName.trim()) {
          const rawBrand = row.brandName.trim();
          const matchedBrand = brands.find(
            (b) => b.id === rawBrand || b.name.toLowerCase() === rawBrand.toLowerCase()
          );

          if (matchedBrand) {
            resolvedBrandId = matchedBrand.id;
          } else if (createdBrandMap.has(rawBrand.toLowerCase())) {
            resolvedBrandId = createdBrandMap.get(rawBrand.toLowerCase());
          } else {
            try {
              const bSlug = rawBrand.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              const newBrand = await brandService.createBrandApi({
                name: rawBrand,
                slug: `${bSlug}-${Date.now().toString().slice(-4)}`,
                description: rawBrand,
                originCountry: 'Sri Lanka',
              });
              resolvedBrandId = newBrand.id;
              createdBrandMap.set(rawBrand.toLowerCase(), newBrand.id);
            } catch {
              resolvedBrandId = undefined;
            }
          }
        }
        // Fallback to defaultBrand if empty
        const finalBrandId = resolvedBrandId || defaultBrandId;

        // 2. Resolve Parent Category
        let resolvedParentId: string | undefined = undefined;
        if (row.parentCategory.trim()) {
          const rawParent = row.parentCategory.trim();
          const matchedParent = categories.find(
            (c) => c.id === rawParent || c.name.toLowerCase() === rawParent.toLowerCase()
          );

          if (matchedParent) {
            resolvedParentId = matchedParent.id;
          } else if (createdCategoryMap.has(rawParent.toLowerCase())) {
            resolvedParentId = createdCategoryMap.get(rawParent.toLowerCase());
          } else {
            try {
              const cSlug = rawParent.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              const newParent = await categoryService.createCategoryApi({
                name: rawParent,
                slug: `${cSlug}-${Date.now().toString().slice(-4)}`,
                description: rawParent,
                parentId: null,
              });
              resolvedParentId = newParent.id;
              createdCategoryMap.set(rawParent.toLowerCase(), newParent.id);
            } catch {
              resolvedParentId = undefined;
            }
          }
        }

        // 3. Resolve Subcategory
        let resolvedSubCategoryId: string | undefined = undefined;
        if (row.subCategory.trim()) {
          const rawSub = row.subCategory.trim();
          const matchedSub = categories.find(
            (c) => c.id === rawSub || c.name.toLowerCase() === rawSub.toLowerCase()
          );

          if (matchedSub) {
            resolvedSubCategoryId = matchedSub.id;
          } else if (createdCategoryMap.has(rawSub.toLowerCase())) {
            resolvedSubCategoryId = createdCategoryMap.get(rawSub.toLowerCase());
          } else {
            try {
              const subSlug = rawSub.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              const newSub = await categoryService.createCategoryApi({
                name: rawSub,
                slug: `${subSlug}-${Date.now().toString().slice(-4)}`,
                description: rawSub,
                parentId: resolvedParentId || null,
              });
              resolvedSubCategoryId = newSub.id;
              createdCategoryMap.set(rawSub.toLowerCase(), newSub.id);
            } catch {
              resolvedSubCategoryId = undefined;
            }
          }
        }

        // Final Category: subcategory if specified, else parent category, else default category
        const effectiveCategoryId = resolvedSubCategoryId || resolvedParentId || defaultCategoryId;

        const payload: Record<string, any> = {
          name: cleanName,
          slug: `${generatedSlug}-${Date.now().toString().slice(-4)}`,
          sku: autoSku.toUpperCase(),
          description: row.description.trim() || cleanName,
          shortDescription: row.description.trim() ? row.description.trim().slice(0, 100) : cleanName,
          categoryId: effectiveCategoryId,
          brandId: finalBrandId,
          priceCents: Math.round(parseFloat(row.price) * 100),
          stockQuantity: parseInt(row.stockQuantity, 10) || 0,
          isActive: row.isActive,
          images: row.imageUrl ? [row.imageUrl] : ['/products/default.png'],
        };

        await productService.createProductApi(payload);
        created++;
      } catch (err: any) {
        saveErrors.push(`Row ${i + 1} (${row.name}): ${err?.message || 'Creation failed'}`);
      }
    }

    setIsSaving(false);
    setSaveProgress(null);

    if (saveErrors.length === 0) {
      setSuccessCount(created);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } else {
      setFormError(`Created ${created}/${activeRows.length} products. Errors: ${saveErrors.join(', ')}`);
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
              <PackagePlus className="w-5 h-5 text-[#FFD21C]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Add Products — Spreadsheet Data Entry
                </h2>
                <span className="bg-blue-100 text-[#08275E] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                  Excel Style Table
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Type your products directly in table rows. Brand, Parent Category &amp; Subcategory can be chosen or typed, or left blank.
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
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
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
          <div className="px-6 py-3 bg-blue-50/60 border-b border-blue-100 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#08275E] text-[#FFD21C] text-[10px] font-black uppercase tracking-wider">
                  Display Guide Only
                </span>
                <span className="font-bold text-slate-700 text-xs">
                  How to fill data (These 3 examples are for reference only — they will not be saved):
                </span>
              </div>
              <button
                type="button"
                onClick={handleLoadExamplesIntoTable}
                className="text-xs text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer inline-flex items-center gap-1 self-start sm:self-auto"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Load these examples into table as template</span>
              </button>
            </div>

            {/* Read-only guide preview table */}
            <div className="overflow-x-auto rounded-xl border border-blue-200/70 bg-white/90 shadow-2xs">
              <table className="min-w-[1100px] w-full text-left text-[11px]">
                <thead>
                  <tr className="bg-blue-100/50 text-blue-900 font-bold border-b border-blue-200/60">
                    <th className="py-1.5 px-3">Example #</th>
                    <th className="py-1.5 px-3">Product Name</th>
                    <th className="py-1.5 px-3">Brand Name</th>
                    <th className="py-1.5 px-3">Parent Category</th>
                    <th className="py-1.5 px-3">Sub Category</th>
                    <th className="py-1.5 px-3 text-right">Price (LKR)</th>
                    <th className="py-1.5 px-3 text-center">Stock</th>
                    <th className="py-1.5 px-3">SKU</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50 text-slate-600">
                  {REFERENCE_EXAMPLES.map((ex, i) => (
                    <tr key={i} className="hover:bg-blue-50/30">
                      <td className="py-1.5 px-3 font-mono font-bold text-blue-600">Sample {i + 1}</td>
                      <td className="py-1.5 px-3 font-semibold text-slate-800">{ex.name}</td>
                      <td className="py-1.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {ex.brand}
                        </span>
                      </td>
                      <td className="py-1.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-medium">
                          {ex.parentCategory}
                        </span>
                      </td>
                      <td className="py-1.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 font-medium">
                          {ex.subCategory}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 font-mono font-bold text-slate-900 text-right">Rs. {ex.price}</td>
                      <td className="py-1.5 px-3 text-center font-bold text-slate-700">{ex.stock}</td>
                      <td className="py-1.5 px-3 font-mono text-[10px] text-slate-500">{ex.sku}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Error / Success Notifications */}
        {formError && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-2 text-xs font-bold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="truncate">{formError}</span>
          </div>
        )}

        {successCount !== null && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Successfully created {successCount} product{successCount > 1 ? 's' : ''}! Refreshing catalog...</span>
          </div>
        )}

        {/* Table Area (Scrollable Spreadsheet Table) */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-6">
          <table className="min-w-[1650px] w-full text-left text-xs border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-bold">
                <th className="py-2.5 px-3 rounded-l-xl border-y border-l border-slate-200 w-10 text-center">#</th>
                <th className="py-2.5 px-3 border-y border-slate-200 w-20 text-center">Photo</th>
                <th className="py-2.5 px-3 border-y border-slate-200 min-w-[240px]">Product Name *</th>
                <th className="py-2.5 px-3 border-y border-slate-200 min-w-[180px]">Brand Name</th>
                <th className="py-2.5 px-3 border-y border-slate-200 min-w-[190px]">Parent Category</th>
                <th className="py-2.5 px-3 border-y border-slate-200 min-w-[190px]">Sub Category</th>
                <th className="py-2.5 px-3 border-y border-slate-200 min-w-[140px] text-right">Price (LKR) *</th>
                <th className="py-2.5 px-3 border-y border-slate-200 min-w-[110px] text-center">Stock</th>
                <th className="py-2.5 px-3 border-y border-slate-200 min-w-[140px]">SKU</th>
                <th className="py-2.5 px-3 border-y border-slate-200 min-w-[200px]">Description</th>
                <th className="py-2.5 px-3 border-y border-slate-200 w-16 text-center">Active</th>
                <th className="py-2.5 px-3 rounded-r-xl border-y border-r border-slate-200 w-12 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, idx) => (
                <tr key={row.id} className="hover:bg-blue-50/20 transition-colors">
                  {/* Row # */}
                  <td className="py-2 px-3 text-center font-bold text-slate-400">
                    <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[11px] mx-auto">
                      {idx + 1}
                    </span>
                  </td>

                  {/* Photo / Image Upload */}
                  <td className="py-2 px-2 text-center">
                    <div className="flex items-center justify-center">
                      {row.isUploading ? (
                        <div className="w-12 h-12 rounded-xl border border-blue-200 bg-blue-50 flex flex-col items-center justify-center text-blue-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-[8px] font-bold mt-0.5">Wait...</span>
                        </div>
                      ) : row.imageUrl ? (
                        <div className="relative group w-12 h-12 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center shadow-2xs">
                          <img
                            src={resolveImageUrl(row.imageUrl)}
                            alt={row.name || 'Product'}
                            className="w-full h-full object-contain p-0.5"
                          />
                          <button
                            type="button"
                            onClick={() => handleRowImageRemove(row.id)}
                            className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-xs cursor-pointer z-10"
                            title="Remove photo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="w-12 h-12 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#08275E] hover:bg-blue-50/30 flex flex-col items-center justify-center cursor-pointer transition-colors text-slate-400 hover:text-[#08275E] group">
                          <Upload className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                          <span className="text-[8px] font-bold mt-0.5 tracking-tight">Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleRowImageUpload(row.id, file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </td>

                  {/* Name */}
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      placeholder="e.g. speed red double pen"
                      value={row.name}
                      onChange={(e) => handleFieldChange(row.id, 'name', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-[#08275E] focus:ring-1 focus:ring-[#08275E] bg-white font-semibold text-slate-900"
                    />
                  </td>

                  {/* Brand Name (Dropdown + Type to create + Clearable/Null) */}
                  <td className="py-2 px-2">
                    <SearchableSelect
                      options={brandOptions}
                      value={row.brandName}
                      onChange={(val) => handleFieldChange(row.id, 'brandName', val)}
                      placeholder="-- None (No Brand) --"
                      searchPlaceholder="Search or type brand name..."
                      allowCreate={true}
                      createPrefix="Add new brand"
                      allowClear={true}
                      className="w-full"
                    />
                  </td>

                  {/* Parent Category (Dropdown + Type to create + Clearable/Null) */}
                  <td className="py-2 px-2">
                    <SearchableSelect
                      options={parentCategoryOptions}
                      value={row.parentCategory}
                      onChange={(val) => handleFieldChange(row.id, 'parentCategory', val)}
                      placeholder="-- None (No Category) --"
                      searchPlaceholder="Search or type parent category..."
                      allowCreate={true}
                      createPrefix="Add new parent category"
                      allowClear={true}
                      className="w-full"
                    />
                  </td>

                  {/* Sub Category (Dropdown + Type to create + Clearable/Null) */}
                  <td className="py-2 px-2">
                    <SearchableSelect
                      options={getSubOptions(row.parentCategory)}
                      value={row.subCategory}
                      onChange={(val) => handleFieldChange(row.id, 'subCategory', val)}
                      placeholder="-- None (No Subcategory) --"
                      searchPlaceholder="Search or type subcategory..."
                      allowCreate={true}
                      createPrefix="Add new subcategory"
                      allowClear={true}
                      className="w-full"
                    />
                  </td>

                  {/* Price (LKR) */}
                  <td className="py-2 px-2">
                    <div className="flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden focus-within:border-[#08275E] focus-within:ring-1 focus-within:ring-[#08275E]">
                      <span className="px-2 py-1.5 bg-slate-50 text-[11px] font-bold text-slate-500 border-r border-slate-200 shrink-0 select-none">
                        Rs
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={row.price}
                        onChange={(e) => handleFieldChange(row.id, 'price', e.target.value)}
                        className="w-full px-2.5 py-1.5 font-bold text-slate-900 text-right focus:outline-none min-w-[70px]"
                      />
                    </div>
                  </td>

                  {/* Stock Quantity */}
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={row.stockQuantity}
                      onChange={(e) => handleFieldChange(row.id, 'stockQuantity', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 focus:border-[#08275E] focus:ring-1 focus:ring-[#08275E] bg-white font-bold text-slate-900 text-center min-w-[70px]"
                    />
                  </td>

                  {/* SKU */}
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      placeholder="Auto / SKU"
                      value={row.sku}
                      onChange={(e) => handleFieldChange(row.id, 'sku', e.target.value.toUpperCase())}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 focus:border-[#08275E] bg-white font-mono text-[11px] text-slate-700 uppercase"
                    />
                  </td>

                  {/* Description */}
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      placeholder="Optional description"
                      value={row.description}
                      onChange={(e) => handleFieldChange(row.id, 'description', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-[#08275E] bg-white text-slate-600"
                    />
                  </td>

                  {/* Active Toggle */}
                  <td className="py-2 px-2 text-center">
                    <input
                      type="checkbox"
                      checked={row.isActive}
                      onChange={(e) => handleFieldChange(row.id, 'isActive', e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[#08275E] focus:ring-[#08275E] accent-[#08275E] cursor-pointer"
                    />
                  </td>

                  {/* Delete Row */}
                  <td className="py-2 px-2 text-center">
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
              ))}
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
              <span>+ Add Another Product Row</span>
            </button>

            <span className="text-xs text-slate-500 font-medium">
              {rows.filter((r) => r.name.trim().length > 0).length} of {rows.length} product row{rows.length > 1 ? 's' : ''} ready to save
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80">
          <div className="text-xs text-slate-500">
            {saveProgress ? (
              <span className="inline-flex items-center gap-2 font-bold text-[#08275E]">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                Saving product {saveProgress.current} of {saveProgress.total}...
              </span>
            ) : (
              <span>Only rows with a Product Name entered will be saved to your catalog.</span>
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
              disabled={isSaving || rows.filter((r) => r.name.trim().length > 0).length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#08275E] hover:bg-[#0c357d] shadow-md shadow-[#08275E]/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Products...</span>
                </>
              ) : (
                <>
                  <PackagePlus className="w-4 h-4 text-[#FFD21C]" />
                  <span>
                    Save &amp; Create{' '}
                    {rows.filter((r) => r.name.trim().length > 0).length > 0
                      ? `${rows.filter((r) => r.name.trim().length > 0).length} Product${
                          rows.filter((r) => r.name.trim().length > 0).length > 1 ? 's' : ''
                        }`
                      : 'Products'}
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
