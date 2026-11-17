'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Boxes,
  AlertTriangle,
  History,
  RefreshCw,
  Check,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  FileSpreadsheet,
  FileText,
  Package,
  Layers,
  ArrowDown,
  Info,
} from 'lucide-react';
import { inventoryService } from '@/services/inventoryService';
import { productService } from '@/services/productService';
import { inventorySocketService } from '@/services/inventorySocketService';
import { apiClient } from '@/lib/api/apiClient';
import { Product, ProductVariant } from '@/types/product';
import { InventoryMovement, InventoryChangeReason } from '@/types/admin';
import { formatLKR } from '@/lib/currency';
import { AdminPageAccess } from '@/components/admin/AdminPageAccess';
import { useUserStore } from '@/services/userStore';
import { KpiAnalyticsCard } from '@/components/admin/analytics/KpiAnalyticsCard';

type StockStatusFilter = 'all' | 'healthy' | 'low' | 'out';
type MovementClassFilter = 'all' | 'GRN' | 'INVOICE' | 'ADJUSTMENT';

export default function AdminInventoryPage() {
  const hasPermission = useUserStore((state) => state.hasPermission);

  // Products state & pagination
  const [products, setProducts] = useState<Product[]>([]);
  const [productPage, setProductPage] = useState<number>(1);
  const [productLimit, setProductLimit] = useState<number>(10);
  const [productTotalPages, setProductTotalPages] = useState<number>(1);
  const [productTotalCount, setProductTotalCount] = useState<number>(0);
  const [productSearch, setProductSearch] = useState<string>('');
  const [stockStatusFilter, setStockStatusFilter] = useState<StockStatusFilter>('all');

  // Overall catalog metrics for hero KPI cards
  const [analytics, setAnalytics] = useState<{
    totalProducts: number;
    outOfStock: number;
    lowStock: number;
    healthyStock: number;
    totalStockValueCents?: string;
  } | null>(null);

  // Movements audit trail state & pagination
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [movementPage, setMovementPage] = useState<number>(1);
  const [movementLimit, setMovementLimit] = useState<number>(10);
  const [movementTotalPages, setMovementTotalPages] = useState<number>(1);
  const [movementTotalItems, setMovementTotalItems] = useState<number>(0);
  const [movementClassFilter, setMovementClassFilter] = useState<MovementClassFilter>('all');

  // Loading & Error states
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [isLoadingMovements, setIsLoadingMovements] = useState<boolean>(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Adjustment modal state
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [reason, setReason] = useState<InventoryChangeReason>('RESTOCK');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);

  // Load KPI Analytics
  const loadAnalytics = useCallback(async () => {
    try {
      const data = await productService.fetchProductAnalytics();
      if (data) {
        setAnalytics({
          totalProducts: data.totalProducts,
          outOfStock: data.outOfStock,
          lowStock: data.lowStock,
          healthyStock: data.healthyStock,
          totalStockValueCents: data.totalStockValueCents,
        });
      }
    } catch (err) {
      console.warn('Failed to fetch inventory analytics:', err);
    }
  }, []);

  // Fetch products with search, pagination, and stock filters
  const loadProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    setPageError(null);
    try {
      let rawItems: Product[] = [];
      let totalItems = 0;
      let totalPages = 1;

      if (stockStatusFilter === 'low') {
        const res = await inventoryService.fetchLowStock({
          page: productPage,
          limit: productLimit,
        });
        rawItems = res.items;
        totalItems = res.total;
        totalPages = res.totalPages;
      } else {
        const filters: any = {};
        if (productSearch.trim()) {
          filters.query = productSearch.trim();
        }
        if (stockStatusFilter === 'out') {
          filters.inStock = false;
        }

        const res = await productService.fetchProducts(filters, 'newest', productPage, productLimit);
        rawItems = res.items;
        totalItems = res.total;
        totalPages = res.totalPages;
      }

      // Fetch live reserved & available stock breakdown from batch-status
      try {
        if (rawItems.length > 0) {
          const ids = rawItems.map((p) => p.id).join(',');
          const batchRes = await apiClient.get<any>(`/public/inventory/batch-status?ids=${ids}`);
          if (batchRes?.data) {
            const enriched = rawItems.map((p) => {
              const live = batchRes.data[p.id];
              return {
                ...p,
                stockQuantity: live ? live.physicalStock : p.stockQuantity,
                reservedStock: live ? live.reservedStock : 0,
                availableStock: live ? live.availableStock : p.stockQuantity,
              };
            });
            setProducts(enriched);
            setProductTotalCount(totalItems);
            setProductTotalPages(Math.max(1, totalPages));
            return;
          }
        }
      } catch {
        // Fallback to raw items if batch status unavailable
      }

      setProducts(rawItems);
      setProductTotalCount(totalItems);
      setProductTotalPages(Math.max(1, totalPages));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load products from server';
      setPageError(msg);
      setProducts(productService.getAll(true));
    } finally {
      setIsLoadingProducts(false);
    }
  }, [productPage, productLimit, productSearch, stockStatusFilter]);

  // Fetch movements audit trail
  const loadMovements = useCallback(async () => {
    setIsLoadingMovements(true);
    try {
      let backendReason: any = undefined;
      if (movementClassFilter === 'GRN') {
        backendReason = 'RESTOCK';
      } else if (movementClassFilter === 'INVOICE') {
        backendReason = 'ORDER_FULFILLMENT';
      }

      const res = await inventoryService.fetchMovements({
        page: movementPage,
        limit: movementLimit,
        reason: backendReason,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      let items = res.items;
      // If ADJUSTMENT filter selected, filter client-side for non-restock and non-order
      if (movementClassFilter === 'ADJUSTMENT') {
        items = items.filter(
          (m) =>
            m.reason !== 'RESTOCK' &&
            m.reason !== 'ORDER_FULFILLMENT'
        );
      }

      setMovements(items);
      setMovementPage(res.page);
      setMovementTotalPages(res.totalPages);
      setMovementTotalItems(res.total);
    } catch (err: unknown) {
      console.warn('Failed to load inventory movements from server:', err);
      setMovements(inventoryService.getMovements());
    } finally {
      setIsLoadingMovements(false);
    }
  }, [movementPage, movementLimit, movementClassFilter]);

  // Initial & Dependency loads
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  // Subscribe to real-time WebSocket inventory updates
  useEffect(() => {
    const unsubInv = inventoryService.subscribe(() => {
      setMovements(inventoryService.getMovements());
    });
    const unsubProd = productService.subscribe(() => {
      loadProducts();
    });
    const unsubSocket = inventorySocketService.subscribeAdmin((update) => {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === update.productId) {
            return {
              ...p,
              stockQuantity: update.physicalStock,
              reservedStock: update.reservedStock,
              availableStock: update.availableStock,
            };
          }
          return p;
        })
      );
      loadAnalytics();
      loadMovements();
    });
    const unsubReconnect = inventorySocketService.onReconnect(() => {
      loadProducts();
      loadMovements();
      loadAnalytics();
    });

    return () => {
      unsubInv();
      unsubProd();
      unsubSocket();
      unsubReconnect();
    };
  }, [loadProducts, loadMovements, loadAnalytics]);

  // Scroll smoothly to Audit Trail section
  const handleScrollToAuditTrail = () => {
    const el = document.getElementById('audit-trail-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openAdjustModal = (product: Product) => {
    setAdjustingProduct(product);
    setSelectedVariantId('');
    setNewQuantity(product.stockQuantity);
    setReason('RESTOCK');
    setNote('');
    setModalError(null);
    setSuccessMsg(false);
  };

  const getSelectedStock = (): number => {
    if (!adjustingProduct) return 0;
    if (selectedVariantId && adjustingProduct.variants) {
      const variant = adjustingProduct.variants.find((v) => v.id === selectedVariantId);
      return variant ? variant.stockQuantity : adjustingProduct.stockQuantity;
    }
    return adjustingProduct.stockQuantity;
  };

  const handleVariantChange = (variantId: string) => {
    setSelectedVariantId(variantId);
    if (adjustingProduct) {
      if (variantId && adjustingProduct.variants) {
        const variant = adjustingProduct.variants.find((v) => v.id === variantId);
        setNewQuantity(variant ? variant.stockQuantity : adjustingProduct.stockQuantity);
      } else {
        setNewQuantity(adjustingProduct.stockQuantity);
      }
    }
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || isSubmitting) return;

    setModalError(null);

    const currentReserved = adjustingProduct.reservedStock || 0;
    if (newQuantity < currentReserved) {
      setModalError(
        `Cannot reduce physical stock to ${newQuantity}: ${currentReserved} units are currently reserved by customer checkout sessions. Physical stock cannot fall below active reservations.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await inventoryService.adjustStock({
        productId: adjustingProduct.id,
        variantId: selectedVariantId || undefined,
        targetQuantity: newQuantity,
        reason: (reason || 'RESTOCK').toUpperCase() as any,
        note: note.trim() || undefined,
      });

      setSuccessMsg(true);

      await Promise.all([
        loadProducts(),
        loadMovements(),
        loadAnalytics(),
      ]);

      setTimeout(() => {
        setSuccessMsg(false);
        setIsSubmitting(false);
        setAdjustingProduct(null);
      }, 700);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : 'Stock adjustment failed on server';
      setModalError(msg);
    }
  };

  // Aggregated units for displayed page
  const totalPhysicalDisplayed = useMemo(
    () => products.reduce((acc, p) => acc + (p.stockQuantity || 0), 0),
    [products]
  );
  const totalReservedDisplayed = useMemo(
    () => products.reduce((acc, p) => acc + (p.reservedStock || 0), 0),
    [products]
  );
  const totalAvailableDisplayed = useMemo(
    () => products.reduce((acc, p) => acc + (p.availableStock !== undefined ? p.availableStock : Math.max(0, p.stockQuantity - (p.reservedStock || 0))), 0),
    [products]
  );

  return (
    <AdminPageAccess permission="inventory.view" pageTitle="Inventory Operations">
      <div className="space-y-8">
        {/* Header with Quick Action to Audit Trail */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1">
              <span>Operations</span>
              <span>&gt;</span>
              <span className="text-slate-600">Stock Control</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Inventory &amp; Stock Control
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Real-time warehouse inventory adjustments, movement audit trail, and low-stock alerts
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Redirect Button to Audit Trail */}
            <button
              type="button"
              onClick={handleScrollToAuditTrail}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#08275E] text-xs font-bold transition-all shadow-xs cursor-pointer group"
              title="Jump directly to Audit Trail: Stock Movement History table"
            >
              <History className="w-4 h-4 text-[#0066CC] group-hover:rotate-45 transition-transform" />
              <span>Audit Trail: Stock Movement History</span>
              <ArrowDown className="w-3.5 h-3.5 text-[#0066CC]" />
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => {
                loadProducts();
                loadMovements();
                loadAnalytics();
              }}
              disabled={isLoadingProducts || isLoadingMovements}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              title="Refresh live inventory and movements"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoadingProducts || isLoadingMovements ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* 4 Hero Warehouse Analytics KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiAnalyticsCard
            title="Total Physical Stock"
            value={totalPhysicalDisplayed.toLocaleString()}
            colorTheme="blue"
            icon={<Boxes className="w-5 h-5 text-white" />}
            sparklineData={[18, 22, 25, 29, 34, 38, 42]}
            trendText={`${analytics?.totalProducts ?? productTotalCount} catalog items`}
            trendDirection="up"
            isActive={stockStatusFilter === 'all'}
            onClick={() => {
              setStockStatusFilter('all');
              setProductPage(1);
            }}
            isLoading={isLoadingProducts && products.length === 0}
          />

          <KpiAnalyticsCard
            title="Available For Sale"
            value={totalAvailableDisplayed.toLocaleString()}
            colorTheme="blue"
            icon={<CheckCircle2 className="w-5 h-5 text-white" />}
            sparklineData={[16, 20, 24, 28, 30, 36, 40]}
            trendText="Unreserved live stock"
            trendDirection="up"
            isActive={stockStatusFilter === 'healthy'}
            onClick={() => {
              setStockStatusFilter('healthy');
              setProductPage(1);
            }}
            isLoading={isLoadingProducts && products.length === 0}
          />

          <KpiAnalyticsCard
            title="Reserved in Checkout"
            value={totalReservedDisplayed.toLocaleString()}
            colorTheme="amber"
            icon={<Clock className="w-5 h-5 text-white" />}
            sparklineData={[10, 14, 12, 18, 15, 22, 20]}
            trendText="Active cart hold sessions"
            trendDirection="neutral"
            isLoading={isLoadingProducts && products.length === 0}
          />

          <KpiAnalyticsCard
            title="Low & Out of Stock"
            value={(analytics?.lowStock ?? 0) + (analytics?.outOfStock ?? 0)}
            colorTheme="rose"
            icon={<AlertTriangle className="w-5 h-5 text-white" />}
            sparklineData={[28, 24, 26, 22, 19, 16, 14]}
            trendText={`${analytics?.lowStock ?? 0} low · ${analytics?.outOfStock ?? 0} out`}
            trendDirection="down"
            isActive={stockStatusFilter === 'low' || stockStatusFilter === 'out'}
            onClick={() => {
              setStockStatusFilter('low');
              setProductPage(1);
            }}
            isLoading={isLoadingProducts && products.length === 0}
          />
        </div>

        {/* Page Error Banner */}
        {pageError && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 flex items-start gap-3 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="block font-bold">Failed to sync inventory with server</strong>
              <span>{pageError}</span>
            </div>
            <button
              onClick={() => setPageError(null)}
              className="text-rose-500 hover:text-rose-800 text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* SECTION 1: Warehouse Stock Levels Table */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-4">
          {/* Table Header & Controls */}
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-[#08275E]" />
              <h2 className="text-base font-bold text-slate-900">
                Warehouse Stock Levels
              </h2>
              <span className="text-xs text-slate-400 ml-2">
                ({productTotalCount} items recorded)
              </span>
            </div>

            {/* Search Input & Page Size */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search product or SKU..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setProductPage(1);
                  }}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#08275E] w-48 sm:w-56"
                />
              </div>

              {/* Items per page selector */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="text-[11px] font-medium">Show:</span>
                <select
                  value={productLimit}
                  onChange={(e) => {
                    setProductLimit(Number(e.target.value));
                    setProductPage(1);
                  }}
                  className="px-2 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#08275E]"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filter Status Buttons */}
          <div className="px-5 flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setStockStatusFilter('all');
                setProductPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                stockStatusFilter === 'all'
                  ? 'bg-[#08275E] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Stock ({analytics?.totalProducts ?? productTotalCount})
            </button>
            <button
              onClick={() => {
                setStockStatusFilter('healthy');
                setProductPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                stockStatusFilter === 'healthy'
                  ? 'bg-[#08275E] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Healthy Stock ({analytics?.healthyStock ?? '-'})
            </button>
            <button
              onClick={() => {
                setStockStatusFilter('low');
                setProductPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                stockStatusFilter === 'low'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              Low Stock Alerts ({analytics?.lowStock ?? 0})
            </button>
            <button
              onClick={() => {
                setStockStatusFilter('out');
                setProductPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                stockStatusFilter === 'out'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              Out of Stock ({analytics?.outOfStock ?? 0})
            </button>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-y border-slate-200">
                  <th className="py-3 px-4 font-bold">Product</th>
                  <th className="py-3 px-4 font-bold">SKU</th>
                  <th className="py-3 px-4 font-bold">Price</th>
                  <th className="py-3 px-4 font-bold text-center">Physical Stock</th>
                  <th className="py-3 px-4 font-bold text-center">Reserved Stock</th>
                  <th className="py-3 px-4 font-bold text-center">Available Stock</th>
                  <th className="py-3 px-4 font-bold">Alert Level</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingProducts ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#08275E] mb-2" />
                      <span>Fetching live warehouse inventory...</span>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <div className="space-y-1">
                        <Check className="w-6 h-6 text-[#0066CC] mx-auto mb-1" />
                        <strong className="block font-bold text-slate-700">No matching inventory records found</strong>
                        <span className="text-[11px]">Try adjusting your search or clearing the stock status filter.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const isLow = p.stockQuantity <= p.lowStockThreshold;
                    const isOut = p.stockQuantity <= 0;
                    const hasVariants = Boolean(p.variants && p.variants.length > 0);
                    const reserved = p.reservedStock || 0;
                    const available =
                      p.availableStock !== undefined
                        ? p.availableStock
                        : Math.max(0, p.stockQuantity - reserved);

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs truncate">
                          <div>
                            <span>{p.name}</span>
                            {hasVariants && (
                              <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                                {p.variants?.length} variants configured
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">{p.sku}</td>
                        <td className="py-3.5 px-4 font-black text-[#08275E]">
                          {formatLKR(p.priceCents)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-sm font-black text-slate-900">
                            {p.stockQuantity}
                          </span>
                          {hasVariants && (
                            <span className="text-[10px] text-slate-400 font-medium block">
                              (aggregate)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`text-sm font-bold ${reserved > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                            {reserved}
                          </span>
                          {reserved > 0 && (
                            <span className="text-[9px] text-amber-600/80 font-medium block">
                              checkout hold
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`text-sm font-black ${
                              available > 0 ? 'text-[#08275E]' : 'text-rose-600'
                            }`}
                          >
                            {available}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium">
                          {p.lowStockThreshold} units
                        </td>
                        <td className="py-3.5 px-4">
                          {isOut ? (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full uppercase">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase">
                              Low Stock
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-[#08275E] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full uppercase">
                              Healthy
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {hasPermission('inventory.update') && (
                            <button
                              onClick={() => openAdjustModal(p)}
                              className="bg-slate-100 hover:bg-[#08275E] hover:text-white text-[#08275E] font-bold text-[11px] px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                            >
                              Adjust Stock
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Warehouse Stock Pagination Bar */}
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <span className="text-slate-500">
              Showing{' '}
              <strong className="text-slate-800">
                {productTotalCount === 0 ? 0 : (productPage - 1) * productLimit + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-slate-800">
                {Math.min(productTotalCount, productPage * productLimit)}
              </strong>{' '}
              of <strong className="text-slate-800">{productTotalCount}</strong> products
            </span>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                disabled={productPage <= 1 || isLoadingProducts}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>

              <span className="px-3 py-1 font-bold text-[#08275E] bg-blue-50 rounded-lg">
                Page {productPage} of {productTotalPages}
              </span>

              <button
                onClick={() => setProductPage((p) => Math.min(productTotalPages, p + 1))}
                disabled={productPage >= productTotalPages || isLoadingProducts}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 2: Dedicated Audit Trail Section with Anchor */}
        <div id="audit-trail-section" className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-[#08275E]">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Audit Trail: Stock Movement History
                  </h2>
                  <p className="text-xs text-slate-400">
                    Authoritative chronological ledger of warehouse deliveries, sales deductions, and corrections
                  </p>
                </div>
              </div>
            </div>

            {/* Movement Filter by Accounting Classification */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setMovementClassFilter('all');
                  setMovementPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  movementClassFilter === 'all'
                    ? 'bg-[#08275E] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Records ({movementTotalItems})
              </button>
              <button
                onClick={() => {
                  setMovementClassFilter('GRN');
                  setMovementPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  movementClassFilter === 'GRN'
                    ? 'bg-[#0066CC] text-white shadow-2xs'
                    : 'bg-blue-50 text-[#0066CC] hover:bg-blue-100 border border-blue-200'
                }`}
                title="Goods Received Note (+ Stock In from Supplier)"
              >
                <span>+ GRN (Restock)</span>
              </button>
              <button
                onClick={() => {
                  setMovementClassFilter('INVOICE');
                  setMovementPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  movementClassFilter === 'INVOICE'
                    ? 'bg-purple-700 text-white shadow-2xs'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                }`}
                title="Invoice (- Stock Out for Customer Order Fulfillment)"
              >
                <span>- INVOICE (Orders)</span>
              </button>
              <button
                onClick={() => {
                  setMovementClassFilter('ADJUSTMENT');
                  setMovementPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  movementClassFilter === 'ADJUSTMENT'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
                title="Manual Adjustments (Damage, count corrections, returns)"
              >
                <span>± Adjustments</span>
              </button>
            </div>
          </div>

          {/* Accounting & Inventory Glossary Legend Banner */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#0066CC] shrink-0 mt-0.5" />
              <div className="text-xs space-y-1.5">
                <div className="font-bold text-slate-800">
                  Understanding Inventory &amp; Accounting Audit Terminology:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-600">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <strong className="text-[#08275E] block font-black uppercase tracking-wider">
                      GRN — Goods Received Note
                    </strong>
                    <span>Records goods received from a supplier or factory intake (+ positive numbers). Confirms stock arrival against purchase order.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <strong className="text-purple-800 block font-black uppercase tracking-wider">
                      Invoice — Order Deduction
                    </strong>
                    <span>Records goods deducted and billed for customer orders (- negative numbers). Confirms physical inventory departure from warehouse.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <strong className="text-amber-800 block font-black uppercase tracking-wider">
                      Adjustment — Audit Correction
                    </strong>
                    <span>Corrections to inventory balance such as physical recounts, damaged goods write-offs, or returned deliveries (± signed change).</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Trail Movements Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 bg-slate-50/50">
                  <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                  <th className="py-2.5 px-3 font-semibold">Product &amp; SKU</th>
                  <th className="py-2.5 px-3 font-semibold">Classification Type</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Previous Qty</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Change Amount</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Resulting Stock</th>
                  <th className="py-2.5 px-3 font-semibold">Actor / Reference</th>
                  <th className="py-2.5 px-3 font-semibold">Audit Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingMovements ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#08275E] mb-2" />
                      <span>Loading audit records...</span>
                    </td>
                  </tr>
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      No inventory movement logs recorded for this classification.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => {
                    const dateString = m.createdAt || m.timestamp;
                    const formattedDate = dateString
                      ? new Date(dateString).toLocaleString()
                      : 'N/A';
                    const productName = m.product?.name || m.productName || 'Product';
                    const sku = m.variant?.sku || m.product?.sku || m.sku || 'N/A';
                    const rawReason = String(m.reason || '').toUpperCase();

                    // Map to accounting badge classification
                    let classificationBadge = (
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                        ADJUSTMENT · {rawReason}
                      </span>
                    );

                    if (rawReason === 'RESTOCK') {
                      classificationBadge = (
                        <span className="bg-blue-100 text-[#08275E] px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-blue-200">
                          GRN · Supplier Restock
                        </span>
                      );
                    } else if (rawReason === 'ORDER_FULFILLMENT') {
                      classificationBadge = (
                        <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-purple-200">
                          INVOICE · Order Fulfillment
                        </span>
                      );
                    } else if (rawReason === 'CORRECTION') {
                      classificationBadge = (
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-amber-200">
                          ADJUSTMENT · Physical Count
                        </span>
                      );
                    } else if (rawReason === 'DAMAGED') {
                      classificationBadge = (
                        <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-rose-200">
                          ADJUSTMENT · Damaged / Expired
                        </span>
                      );
                    }

                    const isPositive = m.changeAmount >= 0;

                    return (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {formattedDate}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-800 block truncate max-w-xs">
                            {productName}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 block">
                            SKU: {sku}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {classificationBadge}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-500 font-semibold">
                          {m.previousQuantity}
                        </td>
                        <td className="py-3 px-3 text-center font-bold font-mono">
                          <span
                            className={`px-2 py-0.5 rounded-md inline-block font-black ${
                              isPositive
                                ? 'bg-blue-50 text-[#0066CC]'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {isPositive ? `+${m.changeAmount}` : m.changeAmount}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                          {m.newQuantity}
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-mono text-[11px] max-w-[120px] truncate">
                          {m.performedById || m.performedBy || 'System Administrator'}
                        </td>
                        <td className="py-3 px-3 text-slate-500 italic max-w-xs truncate">
                          {m.note || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Movement Pagination Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-slate-100 text-xs gap-3">
            <span className="text-slate-400">
              Showing page <strong className="text-slate-700">{movementPage}</strong> of{' '}
              <strong className="text-slate-700">{movementTotalPages}</strong> ({movementTotalItems} recorded movements)
            </span>
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                onClick={() => setMovementPage((p) => Math.max(1, p - 1))}
                disabled={movementPage <= 1 || isLoadingMovements}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <button
                onClick={() => setMovementPage((p) => Math.min(movementTotalPages, p + 1))}
                disabled={movementPage >= movementTotalPages || isLoadingMovements}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Adjust Stock Modal */}
        {adjustingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
            <form
              onSubmit={handleSaveAdjustment}
              className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full space-y-4 shadow-xl text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">
                  Adjust Warehouse Inventory
                </h3>
                <button
                  type="button"
                  onClick={() => !isSubmitting && setAdjustingProduct(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Product
                </span>
                <strong className="block text-slate-900 text-xs font-bold">
                  {adjustingProduct.name}
                </strong>
                <span className="font-mono text-[11px] text-slate-500">
                  Base SKU: {adjustingProduct.sku}
                </span>
                <div className="grid grid-cols-3 gap-2 pt-2 mt-2 border-t border-slate-200/80 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Physical</span>
                    <strong className="text-slate-800">{adjustingProduct.stockQuantity}</strong>
                  </div>
                  <div>
                    <span className="text-amber-600 block text-[9px] uppercase font-bold">Reserved</span>
                    <strong className="text-amber-700">{adjustingProduct.reservedStock || 0}</strong>
                  </div>
                  <div>
                    <span className="text-[#08275E] block text-[9px] uppercase font-bold">Available</span>
                    <strong className="text-[#0066CC]">
                      {adjustingProduct.availableStock !== undefined
                        ? adjustingProduct.availableStock
                        : Math.max(0, adjustingProduct.stockQuantity - (adjustingProduct.reservedStock || 0))}
                    </strong>
                  </div>
                </div>
              </div>

              {/* In-Modal Error Banner */}
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Variant Picker (if product has variants) */}
              {adjustingProduct.variants && adjustingProduct.variants.length > 0 && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Target Product Option / Variant *
                  </label>
                  <select
                    value={selectedVariantId}
                    onChange={(e) => handleVariantChange(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    <option value="">
                      Base Product Aggregate (Current: {adjustingProduct.stockQuantity} units)
                    </option>
                    {adjustingProduct.variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.sku}) — Current: {v.stockQuantity} units
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Selecting a variant updates its specific SKU stock and increments the parent aggregate in lockstep.
                  </span>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  New Target Stock Level (Units) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(Math.max(0, Number(e.target.value)))}
                  disabled={isSubmitting}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#08275E]/20"
                />
                <span className="text-[11px] text-slate-400 mt-1 block font-medium">
                  Current stock: <strong className="text-slate-700">{getSelectedStock()}</strong>. Signed change amount:{' '}
                  <strong
                    className={
                      newQuantity - getSelectedStock() >= 0
                        ? 'text-[#0066CC]'
                        : 'text-rose-600'
                    }
                  >
                    {newQuantity - getSelectedStock() >= 0
                      ? `+${newQuantity - getSelectedStock()}`
                      : newQuantity - getSelectedStock()}
                  </strong>
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Adjustment Reason &amp; Classification *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="RESTOCK">GRN — Goods Received Note / Supplier Restock (+)</option>
                  <option value="CORRECTION">ADJUSTMENT — Audit Count Correction (±)</option>
                  <option value="DAMAGED">ADJUSTMENT — Damaged / Expired Goods (-)</option>
                  <option value="ORDER_FULFILLMENT">INVOICE — Manual Order Fulfillment (-)</option>
                  <option value="DEMO_RESET">ADJUSTMENT — Demo Reset (±)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Audit Note / PO Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. PO-8921 GRN delivery or Damaged pack"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={isSubmitting}
                  maxLength={500}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || newQuantity - getSelectedStock() === 0}
                  className="bg-[#08275E] hover:bg-[#103b8c] text-white font-bold px-5 py-2 rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : successMsg ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirmed!</span>
                    </>
                  ) : (
                    <span>Confirm Adjustment</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminPageAccess>
  );
}