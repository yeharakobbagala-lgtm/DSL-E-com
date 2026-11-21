'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  FolderPlus,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Loader2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ProductCategory } from '@/types/product';
import { categoryService } from '@/services/categoryService';
import { SearchableSelect, SearchableSelectOption } from '@/components/common/SearchableSelect';

export interface BulkCategoryDraft {
  id: string;
  name: string;
  parentId: string;
  displayOrder: string;
  description: string;
  featured: boolean;
}

interface BulkAddCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingCategories: ProductCategory[];
  onSuccess: () => void;
}

// 3 Reference Examples (For display guide only)
const REFERENCE_CATEGORY_EXAMPLES = [
  {
    name: 'Art & Craft Materials',
    parentCategory: '-- None (Creates as Main Parent Category) --',
    displayOrder: '1',
    description: 'Paints, drawing pads, sketch pencils and creative hobby supplies',
    featured: 'Yes',
  },
  {
    name: 'Mathematical & Geometry Sets',
    parentCategory: '-- None (Creates as Main Parent Category) --',
    displayOrder: '2',
    description: 'Compasses, divider sets, protractors, set squares and rulers',
    featured: 'No',
  },
  {
    name: 'Ballpoint Pens',
    parentCategory: 'Pens (Subcategory)',
    displayOrder: '3',
    description: 'Everyday smooth ballpoint writing pens',
    featured: 'No',
  },
];

const createEmptyCategoryRow = (order: number = 1): BulkCategoryDraft => ({
  id: `cat-draft-${Date.now()}-${Math.random()}`,
  name: '',
  parentId: '',
  displayOrder: String(order),
  description: '',
  featured: false,
});

export function BulkAddCategoriesModal({
  isOpen,
  onClose,
  existingCategories,
  onSuccess,
}: BulkAddCategoriesModalProps) {
  const [showGuide, setShowGuide] = useState(true);

  // Filter existing root / parent categories
  const parentOptions: SearchableSelectOption[] = useMemo(() => {
    return existingCategories
      .filter((c) => !c.parentId)
      .map((cat) => ({
        value: cat.id,
        label: cat.name,
        badge: 'Main Category',
      }));
  }, [existingCategories]);

  // Start with 1 clean empty row ready for admin input
  const [rows, setRows] = useState<BulkCategoryDraft[]>(() => [createEmptyCategoryRow(1)]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState<{ current: number; total: number } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  // Add new empty row
  const handleAddRow = () => {
    setRows((prev) => [...prev, createEmptyCategoryRow(prev.length + 1)]);
  };

  // Remove row
  const handleRemoveRow = (id: string) => {
    if (rows.length <= 1) {
      setRows([createEmptyCategoryRow(1)]);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    setFormError(null);
  };

  // Clear table to 1 empty row
  const handleClearTable = () => {
    setRows([createEmptyCategoryRow(1)]);
    setFormError(null);
    setSuccessCount(null);
  };

  // Optional: Copy the 3 display examples into the editable table
  const handleLoadExamplesIntoTable = () => {
    const pensParent = existingCategories.find(
      (c) => !c.parentId && c.name.toLowerCase().includes('pen')
    );
    const loadedRows: BulkCategoryDraft[] = [
      {
        id: `cat-example-${Date.now()}-1`,
        name: 'Art & Craft Materials',
        parentId: '',
        displayOrder: '1',
        description: 'Paints, drawing pads, sketch pencils and creative hobby supplies',
        featured: true,
      },
      {
        id: `cat-example-${Date.now()}-2`,
        name: 'Mathematical & Geometry Sets',
        parentId: '',
        displayOrder: '2',
        description: 'Compasses, divider sets, protractors, set squares and rulers',
        featured: false,
      },
      {
        id: `cat-example-${Date.now()}-3`,
        name: 'Ballpoint Pens',
        parentId: pensParent ? pensParent.id : '',
        displayOrder: '3',
        description: 'Everyday smooth ballpoint writing pens',
        featured: false,
      },
    ];
    setRows(loadedRows);
    setFormError(null);
    setSuccessCount(null);
  };

  // Update specific field in row
  const handleFieldChange = (
    id: string,
    field: keyof BulkCategoryDraft,
    val: any
  ) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  // Validate and submit only active rows
  const handleSaveAll = async () => {
    setFormError(null);
    setSuccessCount(null);

    // Filter only rows where user entered a category name
    const activeRows = rows.filter((r) => r.name.trim().length > 0);

    if (activeRows.length === 0) {
      setFormError('Please enter at least one Category Name before saving.');
      return;
    }

    setIsSaving(true);
    setSaveProgress({ current: 0, total: activeRows.length });

    let created = 0;
    const saveErrors: string[] = [];
    const newlyCreatedParentMap = new Map<string, string>();

    for (let i = 0; i < activeRows.length; i++) {
      const row = activeRows[i];
      setSaveProgress({ current: i + 1, total: activeRows.length });

      try {
        const cleanName = row.name.trim();
        const slug = cleanName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

        let effectiveParentId: string | null = null;
        if (row.parentId.trim()) {
          const rawParent = row.parentId.trim();
          const matchedParent = existingCategories.find(
            (c) => c.id === rawParent || c.name.toLowerCase() === rawParent.toLowerCase()
          );

          if (matchedParent) {
            effectiveParentId = matchedParent.id;
          } else if (newlyCreatedParentMap.has(rawParent.toLowerCase())) {
            effectiveParentId = newlyCreatedParentMap.get(rawParent.toLowerCase()) || null;
          } else {
            try {
              const pSlug = rawParent.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              const newParent = await categoryService.createCategoryApi({
                name: rawParent,
                slug: `${pSlug}-${Date.now().toString().slice(-4)}`,
                description: rawParent,
                parentId: null,
                displayOrder: 0,
              });
              effectiveParentId = newParent.id;
              newlyCreatedParentMap.set(rawParent.toLowerCase(), newParent.id);
            } catch {
              effectiveParentId = null;
            }
          }
        }

        await categoryService.createCategoryApi({
          name: cleanName,
          slug: `${slug}-${Date.now().toString().slice(-4)}`,
          description: row.description.trim() || cleanName,
          parentId: effectiveParentId,
          displayOrder: parseInt(row.displayOrder, 10) || 0,
          featured: row.featured,
        });
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
      setFormError(`Created ${created}/${activeRows.length} categories. Errors: ${saveErrors.join(', ')}`);
      onSuccess();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#08275E] text-white shadow-sm">
              <FolderPlus className="w-5 h-5 text-[#FFD21C]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Add Categories — Spreadsheet Data Entry
                </h2>
                <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
                  Excel Style Table
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Type categories in rows. Pick or type a parent category, or leave empty/null for a Main Parent Category.
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
              <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
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
          <div className="px-6 py-3 bg-purple-50/60 border-b border-purple-100 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-purple-900 text-white text-[10px] font-black uppercase tracking-wider">
                  Display Guide Only
                </span>
                <span className="font-bold text-slate-700 text-xs">
                  How to fill categories (These 3 examples are for reference only — they will not be saved):
                </span>
              </div>
              <button
                type="button"
                onClick={handleLoadExamplesIntoTable}
                className="text-xs text-purple-700 hover:text-purple-900 font-bold underline cursor-pointer inline-flex items-center gap-1 self-start sm:self-auto"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Load these examples into table as template</span>
              </button>
            </div>

            {/* Read-only guide preview table */}
            <div className="overflow-x-auto rounded-xl border border-purple-200/70 bg-white/90 shadow-2xs">
              <table className="min-w-[900px] w-full text-left text-[11px]">
                <thead>
                  <tr className="bg-purple-100/50 text-purple-900 font-bold border-b border-purple-200/60">
                    <th className="py-1.5 px-3">Example #</th>
                    <th className="py-1.5 px-3">Category Name</th>
                    <th className="py-1.5 px-3">Parent Category</th>
                    <th className="py-1.5 px-3 text-center">Order #</th>
                    <th className="py-1.5 px-3">Description</th>
                    <th className="py-1.5 px-3 text-center">Featured</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50 text-slate-600">
                  {REFERENCE_CATEGORY_EXAMPLES.map((ex, i) => (
                    <tr key={i} className="hover:bg-purple-50/30">
                      <td className="py-1.5 px-3 font-mono font-bold text-purple-600">Sample {i + 1}</td>
                      <td className="py-1.5 px-3 font-semibold text-slate-800">{ex.name}</td>
                      <td className="py-1.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 font-medium">
                          {ex.parentCategory}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-center font-bold text-slate-700">{ex.displayOrder}</td>
                      <td className="py-1.5 px-3 text-slate-500">{ex.description}</td>
                      <td className="py-1.5 px-3 text-center font-bold text-slate-700">{ex.featured}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
            <span>Successfully created {successCount} categor{successCount > 1 ? 'ies' : 'y'}! Updating list...</span>
          </div>
        )}

        {/* Table Area */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-6">
          <table className="min-w-[1100px] w-full text-left text-xs border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-bold">
                <th className="py-2.5 px-3 rounded-l-xl border-y border-l border-slate-200 w-10 text-center">#</th>
                <th className="py-2.5 px-3 border-y border-slate-200 min-w-[240px]">Category Name *</th>
                <th className="py-2.5 px-3 border-y border-slate-200 min-w-[260px]">
                  Parent Category (Dropdown + Type to Add New / Null for Main)
                </th>
                <th className="py-2.5 px-3 border-y border-slate-200 w-24 text-center">Order #</th>
                <th className="py-2.5 px-3 border-y border-slate-200 min-w-[220px]">Description (Optional)</th>
                <th className="py-2.5 px-3 border-y border-slate-200 w-20 text-center">Featured</th>
                <th className="py-2.5 px-3 rounded-r-xl border-y border-r border-slate-200 w-12 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, idx) => (
                <tr key={row.id} className="hover:bg-purple-50/20 transition-colors">
                  {/* Row # */}
                  <td className="py-2 px-3 text-center font-bold text-slate-400">
                    <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[11px] mx-auto">
                      {idx + 1}
                    </span>
                  </td>

                  {/* Name */}
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      placeholder="e.g. Art & Craft Materials"
                      value={row.name}
                      onChange={(e) => handleFieldChange(row.id, 'name', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-[#08275E] focus:ring-1 focus:ring-[#08275E] bg-white font-semibold text-slate-900"
                    />
                  </td>

                  {/* Parent Category Dropdown + Type to Add New + Clearable / Null */}
                  <td className="py-2 px-2">
                    <SearchableSelect
                      options={parentOptions}
                      value={row.parentId}
                      onChange={(val) => handleFieldChange(row.id, 'parentId', val)}
                      placeholder="-- None (Creates as Main Parent Category) --"
                      searchPlaceholder="Search or type parent category..."
                      allowCreate={true}
                      createPrefix="Add new parent category"
                      allowClear={true}
                      className="w-full"
                    />
                  </td>

                  {/* Display Order */}
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      min="0"
                      value={row.displayOrder}
                      onChange={(e) => handleFieldChange(row.id, 'displayOrder', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 focus:border-[#08275E] bg-white font-bold text-slate-900 text-center"
                    />
                  </td>

                  {/* Description */}
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      placeholder="Optional brief description"
                      value={row.description}
                      onChange={(e) => handleFieldChange(row.id, 'description', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-[#08275E] bg-white text-slate-600"
                    />
                  </td>

                  {/* Featured */}
                  <td className="py-2 px-2 text-center">
                    <input
                      type="checkbox"
                      checked={row.featured}
                      onChange={(e) => handleFieldChange(row.id, 'featured', e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#08275E] bg-purple-50 hover:bg-purple-100 transition-colors border border-purple-200/80 shadow-2xs cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Another Category Row</span>
            </button>

            <span className="text-xs text-slate-500 font-medium">
              {rows.filter((r) => r.name.trim().length > 0).length} of {rows.length} category row{rows.length > 1 ? 's' : ''} ready to save
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80">
          <div className="text-xs text-slate-500">
            {saveProgress ? (
              <span className="inline-flex items-center gap-2 font-bold text-[#08275E]">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                Saving category {saveProgress.current} of {saveProgress.total}...
              </span>
            ) : (
              <span>Leaving Parent Category empty creates it as a top-level Main Category.</span>
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
                  <span>Creating Categories...</span>
                </>
              ) : (
                <>
                  <FolderPlus className="w-4 h-4 text-[#FFD21C]" />
                  <span>
                    Save &amp; Create{' '}
                    {rows.filter((r) => r.name.trim().length > 0).length > 0
                      ? `${rows.filter((r) => r.name.trim().length > 0).length} Categor${
                          rows.filter((r) => r.name.trim().length > 0).length > 1 ? 'ies' : 'y'
                        }`
                      : 'Categories'}
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
