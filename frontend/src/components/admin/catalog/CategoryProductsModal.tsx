'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  X,
  Search,
  ExternalLink,
  Package,
  Plus,
  Edit2,
  FolderOpen,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { ProductCategory, Product } from '@/types/product';
import { productService } from '@/services/productService';
import { ProductThumbnail } from '@/components/common/ProductThumbnail';
import { formatLKR } from '@/lib/currency';

interface CategoryProductsModalProps {
  category: ProductCategory | null;
  onClose: () => void;
  allCategories?: ProductCategory[];
}

export function CategoryProductsModal({
  category,
  onClose,
  allCategories = [],
}: CategoryProductsModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!category) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setSearch('');

    async function loadCategoryProducts() {
      try {
        if (!category) return;
        const res = await productService.fetchProducts(
          { category: category.id },
          'newest',
          1,
          100
        );
        if (isMounted) {
          setProducts(res.items || []);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Failed to load category products:', err);
          setError(err?.message || 'Failed to load products for this category');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCategoryProducts();

    return () => {
      isMounted = false;
    };
  }, [category]);

  // Find parent category name if this is a subcategory
  const parentCategory = useMemo(() => {
    if (!category?.parentId) return null;
    return allCategories.find((c) => c.id === category.parentId) || null;
  }, [category, allCategories]);

  // Filter products by local search query
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.brandName && p.brandName.toLowerCase().includes(q))
    );
  }, [products, search]);

  if (!category) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-linear-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center shrink-0 shadow-xs">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              {parentCategory && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-0.5">
                  <span>{parentCategory.name}</span>
                  <span>&rsaquo;</span>
                  <span className="text-blue-600 font-semibold">{category.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 truncate">
                  {category.name}
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                  {category.slug}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xl">
                {category.description || 'Stationery catalogue category'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/admin/products?category=${encodeURIComponent(category.id)}`}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition-colors border border-blue-200/60"
              title="Open full products catalogue with this category pre-filtered"
            >
              <span>Manage in Catalogue</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search and Summary */}
        <div className="p-4 sm:px-6 bg-slate-50/60 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products in this category by name, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <span className="text-xs font-semibold text-slate-600">
              Total Products:{' '}
              <strong className="text-slate-900 font-bold">{filteredProducts.length}</strong>
              {products.length !== filteredProducts.length && (
                <span className="text-slate-400 ml-1">of {products.length}</span>
              )}
            </span>

            <Link
              href={`/admin/products/new?categoryId=${encodeURIComponent(category.id)}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#08275E] hover:bg-[#103b8c] px-3.5 py-2 rounded-xl transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </Link>
          </div>
        </div>

        {/* Body: Product Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RotateCcw className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-sm font-semibold text-slate-600">
                Loading products for {category.name}...
              </p>
            </div>
          ) : error ? (
            <div className="py-16 text-center space-y-2">
              <p className="text-rose-600 font-bold text-sm">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  setError(null);
                  productService
                    .fetchProducts({ category: category.id }, 'newest', 1, 100)
                    .then((res) => setProducts(res.items || []))
                    .catch((err) => setError(err.message))
                    .finally(() => setIsLoading(false));
                }}
                className="text-xs text-blue-600 underline font-semibold cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <Package className="w-7 h-7" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">
                  {search ? 'No products match your search' : 'No products in this category yet'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {search
                    ? 'Try clearing the search box to view all items'
                    : `Add stationery products to assign them to ${category.name}`}
                </p>
              </div>
              {!search && (
                <Link
                  href={`/admin/products/new?categoryId=${encodeURIComponent(category.id)}`}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Product</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3 px-3 w-12 text-center">Image</th>
                    <th className="py-3 px-3">Product Name</th>
                    <th className="py-3 px-3">SKU</th>
                    <th className="py-3 px-3">Brand</th>
                    <th className="py-3 px-3">Price (Rs.)</th>
                    <th className="py-3 px-3">Stock</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const priceFormatted = formatLKR(p.priceCents).replace(/^Rs\.\s*/i, '');
                    const isHealthy = p.stockQuantity > (p.lowStockThreshold || 10);
                    const isLow = p.stockQuantity > 0 && p.stockQuantity <= (p.lowStockThreshold || 10);
                    const isOut = p.stockQuantity <= 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-center">
                          <ProductThumbnail
                            src={p.images && p.images[0] ? p.images[0] : null}
                            alt={p.name}
                            brandName={p.brandName}
                            className="w-10 h-10 rounded-lg shrink-0 mx-auto"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-xs">
                          <div className="truncate" title={p.name}>
                            {p.name}
                          </div>
                          {p.isFeatured && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                              Featured
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                          {p.sku}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                          {p.brandName || '-'}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                          {priceFormatted}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800">{p.stockQuantity}</span>
                            {isHealthy && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>Healthy</span>
                              </span>
                            )}
                            {isLow && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                <span>Low</span>
                              </span>
                            )}
                            {isOut && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-full">
                                <XCircle className="w-2.5 h-2.5" />
                                <span>Out</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {p.isActive ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                              HIDDEN
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-600 font-semibold p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <Link
            href={`/admin/products?category=${encodeURIComponent(category.id)}`}
            className="sm:hidden text-xs font-bold text-blue-600 flex items-center gap-1"
          >
            <span>Open in Catalogue</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
          <div className="hidden sm:block text-xs text-slate-400">
            Clicking &quot;Manage in Catalogue&quot; opens the full products view filtered to this category.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs transition-colors cursor-pointer ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
