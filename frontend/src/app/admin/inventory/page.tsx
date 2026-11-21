'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  Plus,
  Minus,
  Zap,
  Save,
  X,
  Table,
  Tag,
  FolderTree,
  ShoppingBag,
  SlidersHorizontal,
  Flame,
  Sparkles,
  ArrowUpDown,
  RotateCcw,
  TrendingUp,
  User,
  ShieldCheck,
  Truck,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react';
import { BulkAddStockModal } from '@/components/admin/catalog';
import { inventoryService } from '@/services/inventoryService';
import { productService } from '@/services/productService';
import { brandService } from '@/services/brandService';
import { categoryService } from '@/services/categoryService';
import { inventorySocketService } from '@/services/inventorySocketService';
import { apiClient } from '@/lib/api/apiClient';
import { Product, ProductVariant, Brand, ProductCategory } from '@/types/product';
import { InventoryMovement, InventoryChangeReason } from '@/types/admin';
import { formatLKR } from '@/lib/currency';
import { AdminPageAccess } from '@/components/admin/AdminPageAccess';
import { useUserStore } from '@/services/userStore';
import { KpiAnalyticsCard } from '@/components/admin/analytics/KpiAnalyticsCard';

type StockStatusFilter = 'all' | 'healthy' | 'low' | 'out' | 'reserved';
type StockCountRange = 'all' | '0' | '1-10' | '11-50' | '51-200' | '200plus' | 'custom';
type CustomerDemandFilter = 'all' | 'in_cart' | 'best_seller' | 'new_arrival' | 'featured' | 'stagnant';
type InventorySort = 'stock_asc' | 'stock_desc' | 'cart_reserved' | 'price_desc' | 'price_asc' | 'name_asc' | 'newest';
type MovementClassFilter = 'all' | 'GRN' | 'INVOICE' | 'ADJUSTMENT';
type MovementActorType = 'all' | 'CUSTOMER' | 'ADMIN' | 'SUPPLIER';
type MovementDirection = 'all' | 'inward' | 'outward' | 'high_inflow' | 'high_outflow';
type MovementTimeframe = 'all' | 'today' | '7days' | '30days' | '90days' | 'custom';
type MovementSortOption = 'newest' | 'oldest' | 'change_desc' | 'change_asc';
type ActiveInventoryView = 'STOCK' | 'LEDGER';
type AdjustmentMode = 'DELTA' | 'TARGET';
type DeltaOp = 'ADD' | 'DEDUCT';

function InventoryManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeView, setActiveView] = useState<ActiveInventoryView>(
    tabParam === 'movements' || tabParam === 'ledger' ? 'LEDGER' : 'STOCK'
  );

  useEffect(() => {
    if (tabParam === 'movements' || tabParam === 'ledger') {
      setActiveView('LEDGER');
    } else if (tabParam === 'stock') {
      setActiveView('STOCK');
    }
  }, [tabParam]);

  const handleTabChange = (view: ActiveInventoryView) => {
    setActiveView(view);
    const newTab = view === 'LEDGER' ? 'movements' : 'stock';
    router.replace(`/admin/inventory?tab=${newTab}`, { scroll: false });
  };

  const hasPermission = useUserStore((state) => state.hasPermission);

  // Products state & pagination
  const [products, setProducts] = useState<Product[]>([]);
  const [productPage, setProductPage] = useState<number>(1);
  const [productLimit, setProductLimit] = useState<number>(10);
  const [productTotalPages, setProductTotalPages] = useState<number>(1);
  const [productTotalCount, setProductTotalCount] = useState<number>(0);
  const [productSearch, setProductSearch] = useState<string>('');
  const [stockStatusFilter, setStockStatusFilter] = useState<StockStatusFilter>('all');

  // Multi-dimensional Warehouse Filters
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockCountRange, setStockCountRange] = useState<StockCountRange>('all');
  const [customMinStock, setCustomMinStock] = useState<string>('');
  const [customMaxStock, setCustomMaxStock] = useState<string>('');
  const [customerDemandFilter, setCustomerDemandFilter] = useState<CustomerDemandFilter>('all');
  const [inventorySort, setInventorySort] = useState<InventorySort>('stock_asc');

  // Fetch Brands and Categories on mount for dropdown options
  useEffect(() => {
    let isMounted = true;
    brandService
      .fetchBrands()
      .then((bList) => {
        if (isMounted && Array.isArray(bList)) setBrands(bList);
      })
      .catch((err) => console.warn('Failed to load brands for filter:', err));

    categoryService
      .fetchCategories()
      .then((cList) => {
        if (isMounted && Array.isArray(cList)) setCategories(cList);
      })
      .catch((err) => console.warn('Failed to load categories for filter:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute active filters
  const hasActiveFilters = useMemo(() => {
    return (
      productSearch.trim() !== '' ||
      stockStatusFilter !== 'all' ||
      selectedBrand !== 'all' ||
      selectedCategory !== 'all' ||
      stockCountRange !== 'all' ||
      customMinStock !== '' ||
      customMaxStock !== '' ||
      customerDemandFilter !== 'all' ||
      inventorySort !== 'stock_asc'
    );
  }, [
    productSearch,
    stockStatusFilter,
    selectedBrand,
    selectedCategory,
    stockCountRange,
    customMinStock,
    customMaxStock,
    customerDemandFilter,
    inventorySort,
  ]);

  const handleClearAllFilters = () => {
    setProductSearch('');
    setStockStatusFilter('all');
    setSelectedBrand('all');
    setSelectedCategory('all');
    setStockCountRange('all');
    setCustomMinStock('');
    setCustomMaxStock('');
    setCustomerDemandFilter('all');
    setInventorySort('stock_asc');
    setProductPage(1);
  };

  // Count items currently held in carts
  const reservedCount = useMemo(() => {
    return products.filter((p) => (p.reservedStock || 0) > 0).length;
  }, [products]);

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

  // Movement Multi-Dimensional Filters
  const [movementSearch, setMovementSearch] = useState<string>('');
  const [movementActorType, setMovementActorType] = useState<MovementActorType>('all');
  const [movementDirection, setMovementDirection] = useState<MovementDirection>('all');
  const [movementTimeframe, setMovementTimeframe] = useState<MovementTimeframe>('all');
  const [movementStartDate, setMovementStartDate] = useState<string>('');
  const [movementEndDate, setMovementEndDate] = useState<string>('');
  const [movementSort, setMovementSort] = useState<MovementSortOption>('newest');

  // Compute active movement filters
  const hasActiveMovementFilters = useMemo(() => {
    return (
      movementSearch.trim() !== '' ||
      movementClassFilter !== 'all' ||
      movementActorType !== 'all' ||
      movementDirection !== 'all' ||
      movementTimeframe !== 'all' ||
      movementStartDate !== '' ||
      movementEndDate !== '' ||
      movementSort !== 'newest'
    );
  }, [
    movementSearch,
    movementClassFilter,
    movementActorType,
    movementDirection,
    movementTimeframe,
    movementStartDate,
    movementEndDate,
    movementSort,
  ]);

  const handleClearAllMovementFilters = () => {
    setMovementSearch('');
    setMovementClassFilter('all');
    setMovementActorType('all');
    setMovementDirection('all');
    setMovementTimeframe('all');
    setMovementStartDate('');
    setMovementEndDate('');
    setMovementSort('newest');
    setMovementPage(1);
  };

  // Loading & Error states
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [isLoadingMovements, setIsLoadingMovements] = useState<boolean>(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Adjustment modal state
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [adjustmentMode, setAdjustmentMode] = useState<AdjustmentMode>('DELTA');
  const [deltaOp, setDeltaOp] = useState<DeltaOp>('ADD');
  const [deltaAmount, setDeltaAmount] = useState<number | ''>(0);
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [reason, setReason] = useState<InventoryChangeReason>('RESTOCK');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);

  // Bulk Add Stock Table Modal
  const [isBulkStockModalOpen, setIsBulkStockModalOpen] = useState<boolean>(false);

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

  // Fetch products with search, pagination, and multi-dimensional filters
  const loadProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    setPageError(null);
    try {
      let rawItems: Product[] = [];
      let totalItems = 0;
      let totalPages = 1;

      const filters: any = {};
      if (productSearch.trim()) {
        filters.query = productSearch.trim();
      }

      if (stockStatusFilter === 'out') {
        filters.stockStatus = 'OUT_OF_STOCK';
      } else if (stockStatusFilter === 'healthy') {
        filters.stockStatus = 'HEALTHY';
      } else if (stockStatusFilter === 'low') {
        filters.stockStatus = 'LOW_STOCK';
      }

      if (selectedBrand !== 'all') {
        filters.brandId = selectedBrand;
      }

      if (selectedCategory !== 'all') {
        filters.categoryId = selectedCategory;
      }

      if (customerDemandFilter === 'best_seller') {
        filters.isBestSeller = true;
      } else if (customerDemandFilter === 'new_arrival') {
        filters.isNewArrival = true;
      } else if (customerDemandFilter === 'featured') {
        filters.featured = true;
      }

      // Backend sort mapping
      let backendSort: any = 'newest';
      if (inventorySort === 'stock_asc') backendSort = 'stock_asc';
      else if (inventorySort === 'stock_desc') backendSort = 'stock_desc';
      else if (inventorySort === 'price_desc') backendSort = 'price_desc';
      else if (inventorySort === 'price_asc') backendSort = 'price_asc';
      else if (inventorySort === 'name_asc') backendSort = 'name_asc';

      const res = await productService.fetchProducts(filters, backendSort, productPage, productLimit);
      rawItems = res.items;
      totalItems = res.total;
      totalPages = res.totalPages;

      // Fetch live reserved & available stock breakdown from batch-status
      let enriched = rawItems;
      try {
        if (rawItems.length > 0) {
          const ids = rawItems.map((p) => p.id).join(',');
          const batchRes = await apiClient.get<any>(`/public/inventory/batch-status?ids=${ids}`);
          if (batchRes?.data) {
            enriched = rawItems.map((p) => {
              const live = batchRes.data[p.id];
              return {
                ...p,
                stockQuantity: live ? live.physicalStock : p.stockQuantity,
                reservedStock: live ? live.reservedStock : 0,
                availableStock: live ? live.availableStock : p.stockQuantity,
              };
            });
          }
        }
      } catch {
        // Fallback to raw items if batch status unavailable
      }

      // Client-side refinements on live-enriched inventory
      let finalItems = enriched;

      // 1. In-cart / checkout hold demand filter
      if (stockStatusFilter === 'reserved' || customerDemandFilter === 'in_cart') {
        finalItems = finalItems.filter((p) => (p.reservedStock || 0) > 0);
      } else if (customerDemandFilter === 'stagnant') {
        finalItems = finalItems.filter((p) => p.stockQuantity >= 25 && (!p.reservedStock || p.reservedStock === 0));
      }

      // 2. Physical Stock Count Range Filter
      if (stockCountRange === '0') {
        finalItems = finalItems.filter((p) => p.stockQuantity === 0);
      } else if (stockCountRange === '1-10') {
        finalItems = finalItems.filter((p) => p.stockQuantity >= 1 && p.stockQuantity <= 10);
      } else if (stockCountRange === '11-50') {
        finalItems = finalItems.filter((p) => p.stockQuantity >= 11 && p.stockQuantity <= 50);
      } else if (stockCountRange === '51-200') {
        finalItems = finalItems.filter((p) => p.stockQuantity >= 51 && p.stockQuantity <= 200);
      } else if (stockCountRange === '200plus') {
        finalItems = finalItems.filter((p) => p.stockQuantity > 200);
      } else if (stockCountRange === 'custom') {
        const min = customMinStock !== '' ? Number(customMinStock) : null;
        const max = customMaxStock !== '' ? Number(customMaxStock) : null;
        if (min !== null && !isNaN(min)) {
          finalItems = finalItems.filter((p) => p.stockQuantity >= min);
        }
        if (max !== null && !isNaN(max)) {
          finalItems = finalItems.filter((p) => p.stockQuantity <= max);
        }
      }

      // 3. Customer cart hold sort
      if (inventorySort === 'cart_reserved') {
        finalItems = [...finalItems].sort((a, b) => (b.reservedStock || 0) - (a.reservedStock || 0));
      }

      setProducts(finalItems);
      setProductTotalCount(finalItems.length < rawItems.length ? finalItems.length : totalItems);
      setProductTotalPages(Math.max(1, totalPages));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load products from server';
      setPageError(msg);
      setProducts(productService.getAll(true));
    } finally {
      setIsLoadingProducts(false);
    }
  }, [
    productPage,
    productLimit,
    productSearch,
    stockStatusFilter,
    selectedBrand,
    selectedCategory,
    stockCountRange,
    customMinStock,
    customMaxStock,
    customerDemandFilter,
    inventorySort,
  ]);

  // Fetch movements audit trail with multi-dimensional filtering
  const loadMovements = useCallback(async () => {
    setIsLoadingMovements(true);
    try {
      let backendReason: any = undefined;
      if (movementClassFilter === 'GRN') {
        backendReason = 'RESTOCK';
      } else if (movementClassFilter === 'INVOICE') {
        backendReason = 'ORDER_FULFILLMENT';
      }

      // Calculate date filters
      let startDateStr: string | undefined = undefined;
      let endDateStr: string | undefined = undefined;

      const now = new Date();
      if (movementTimeframe === 'today') {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        startDateStr = todayStart.toISOString();
      } else if (movementTimeframe === '7days') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        startDateStr = d.toISOString();
      } else if (movementTimeframe === '30days') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        startDateStr = d.toISOString();
      } else if (movementTimeframe === '90days') {
        const d = new Date();
        d.setDate(d.getDate() - 90);
        startDateStr = d.toISOString();
      } else if (movementTimeframe === 'custom') {
        if (movementStartDate) startDateStr = movementStartDate;
        if (movementEndDate) endDateStr = movementEndDate;
      }

      // Backend sort mapping
      let backendSortBy: 'createdAt' | 'changeAmount' | 'newQuantity' = 'createdAt';
      let backendSortOrder: 'asc' | 'desc' = 'desc';

      if (movementSort === 'newest') {
        backendSortBy = 'createdAt';
        backendSortOrder = 'desc';
      } else if (movementSort === 'oldest') {
        backendSortBy = 'createdAt';
        backendSortOrder = 'asc';
      } else if (movementSort === 'change_desc') {
        backendSortBy = 'changeAmount';
        backendSortOrder = 'desc';
      } else if (movementSort === 'change_asc') {
        backendSortBy = 'changeAmount';
        backendSortOrder = 'asc';
      }

      const res = await inventoryService.fetchMovements({
        page: movementPage,
        limit: movementLimit,
        reason: backendReason,
        startDate: startDateStr,
        endDate: endDateStr,
        sortBy: backendSortBy,
        sortOrder: backendSortOrder,
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

      // Filter by search query (product name, sku, actor name, email, phone, note, reference)
      if (movementSearch.trim()) {
        const q = movementSearch.trim().toLowerCase();
        items = items.filter((m) => {
          const pName = (m.product?.name || m.productName || '').toLowerCase();
          const sku = (m.variant?.sku || m.product?.sku || m.sku || '').toLowerCase();
          const note = (m.note || '').toLowerCase();
          const actorName = (m.actor?.name || m.performedBy || '').toLowerCase();
          const actorEmail = (m.actor?.email || '').toLowerCase();
          const actorRef = (m.actor?.reference || '').toLowerCase();
          const actorRole = (m.actor?.role || '').toLowerCase();

          return (
            pName.includes(q) ||
            sku.includes(q) ||
            note.includes(q) ||
            actorName.includes(q) ||
            actorEmail.includes(q) ||
            actorRef.includes(q) ||
            actorRole.includes(q)
          );
        });
      }

      // Filter by Actor Type
      if (movementActorType === 'CUSTOMER') {
        items = items.filter(
          (m) =>
            m.actor?.type === 'CUSTOMER' ||
            m.reason === 'ORDER_FULFILLMENT' ||
            m.actor?.role?.toLowerCase().includes('customer')
        );
      } else if (movementActorType === 'ADMIN') {
        items = items.filter(
          (m) =>
            m.actor?.type === 'ADMIN' ||
            (m.reason !== 'ORDER_FULFILLMENT' && m.reason !== 'RESTOCK')
        );
      } else if (movementActorType === 'SUPPLIER') {
        items = items.filter(
          (m) =>
            m.actor?.type === 'SUPPLIER' ||
            m.reason === 'RESTOCK'
        );
      }

      // Filter by Movement Direction & Magnitude
      if (movementDirection === 'inward') {
        items = items.filter((m) => m.changeAmount > 0);
      } else if (movementDirection === 'outward') {
        items = items.filter((m) => m.changeAmount < 0);
      } else if (movementDirection === 'high_inflow') {
        items = items.filter((m) => m.changeAmount >= 50);
      } else if (movementDirection === 'high_outflow') {
        items = items.filter((m) => m.changeAmount <= -20);
      }

      setMovements(items);
      setMovementPage(res.page);
      setMovementTotalPages(res.totalPages);
      setMovementTotalItems(items.length < res.items.length ? items.length : res.total);
    } catch (err: unknown) {
      console.warn('Failed to load inventory movements from server:', err);
      setMovements(inventoryService.getMovements());
    } finally {
      setIsLoadingMovements(false);
    }
  }, [
    movementPage,
    movementLimit,
    movementClassFilter,
    movementSearch,
    movementActorType,
    movementDirection,
    movementTimeframe,
    movementStartDate,
    movementEndDate,
    movementSort,
  ]);

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
      unsubSocket();
      unsubReconnect();
    };
  }, [loadProducts, loadMovements, loadAnalytics]);

  // Switch view to Audit Trail / Movements Ledger
  const handleScrollToAuditTrail = () => {
    handleTabChange('LEDGER');
  };

  const openAdjustModal = (product: Product) => {
    setAdjustingProduct(product);
    setSelectedVariantId('');
    setAdjustmentMode('DELTA');
    setDeltaOp('ADD');
    setDeltaAmount(0);
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
      const currentStock = variantId && adjustingProduct.variants
        ? (adjustingProduct.variants.find((v) => v.id === variantId)?.stockQuantity ?? adjustingProduct.stockQuantity)
        : adjustingProduct.stockQuantity;
      setNewQuantity(currentStock);
    }
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || isSubmitting) return;

    setModalError(null);

    const currentStock = getSelectedStock();
    const numericDelta = typeof deltaAmount === 'number' ? deltaAmount : 0;
    const signedDelta =
      adjustmentMode === 'DELTA'
        ? deltaOp === 'ADD'
          ? numericDelta
          : -numericDelta
        : newQuantity - currentStock;

    const effectiveTarget = currentStock + signedDelta;

    if (signedDelta === 0) {
      setModalError('Please specify a non-zero quantity to add or deduct.');
      return;
    }

    if (effectiveTarget < 0) {
      setModalError(
        `Cannot reduce physical stock below 0 (current: ${currentStock}, adjustment: ${signedDelta > 0 ? `+${signedDelta}` : signedDelta}, resulting: ${effectiveTarget}).`
      );
      return;
    }

    const currentReserved = adjustingProduct.reservedStock || 0;
    if (effectiveTarget < currentReserved) {
      setModalError(
        `Cannot reduce physical stock to ${effectiveTarget}: ${currentReserved} units are currently reserved by customer checkout sessions. Physical stock cannot fall below active reservations.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await inventoryService.adjustStock({
        productId: adjustingProduct.id,
        variantId: selectedVariantId || undefined,
        targetQuantity: effectiveTarget,
        delta: signedDelta,
        reason: (reason || (signedDelta > 0 ? 'RESTOCK' : 'DAMAGED')).toUpperCase() as any,
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
        {/* Header */}
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
            {/* Refresh Button */}
            <button
              onClick={() => {
                loadProducts();
                loadMovements();
                loadAnalytics();
              }}
              disabled={isLoadingProducts || isLoadingMovements}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-1.5 text-xs font-bold"
              title="Refresh live inventory and movements"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoadingProducts || isLoadingMovements ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Dual-Page Mode Toggle Switcher */}
        <div className="bg-white p-2 sm:p-2.5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Segmented Control Buttons */}
          <div className="inline-flex p-1 bg-slate-100/90 rounded-2xl w-full md:w-auto">
            <button
              type="button"
              onClick={() => handleTabChange('STOCK')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeView === 'STOCK'
                  ? 'bg-[#08275E] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
            >
              <Boxes className="w-4 h-4 shrink-0" />
              <span>Warehouse Stock Table</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeView === 'STOCK' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
              >
                {productTotalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('LEDGER')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeView === 'LEDGER'
                  ? 'bg-[#0066CC] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
            >
              <History className="w-4 h-4 shrink-0" />
              <span>Audit Trail &amp; Movements Ledger</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeView === 'LEDGER' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
              >
                {movementTotalItems}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 px-2 text-xs text-slate-500 justify-between md:justify-end">
            <span className="flex items-center gap-1.5 font-medium">
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${activeView === 'STOCK' ? 'bg-emerald-500' : 'bg-[#0066CC]'
                  }`}
              />
              {activeView === 'STOCK'
                ? 'Showing Live Warehouse Stock Levels'
                : 'Showing Authoritative Stock Movement History'}
            </span>
          </div>
        </div>

        {activeView === 'STOCK' && (
          <div className="space-y-8 animate-fade-in">

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
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${stockStatusFilter === 'all'
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
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${stockStatusFilter === 'healthy'
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
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${stockStatusFilter === 'low'
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
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${stockStatusFilter === 'out'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                    }`}
                >
                  Out of Stock ({analytics?.outOfStock ?? 0})
                </button>
                <button
                  onClick={() => {
                    setStockStatusFilter('reserved');
                    setProductPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${stockStatusFilter === 'reserved'
                      ? 'bg-orange-600 text-white shadow-2xs'
                      : 'bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200'
                    }`}
                  title="View items currently held in customer shopping carts or active checkout sessions"
                >
                  🛒 In Cart Hold ({reservedCount})
                </button>
              </div>

              {/* Comprehensive Warehouse Inventory Filter Bar */}
              <div className="mx-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <SlidersHorizontal className="w-4 h-4 text-[#08275E]" />
                    <span>Warehouse Multi-Filter Toolbar</span>
                    <span className="text-[11px] font-normal text-slate-500 ml-1">
                      (Brand, Stock Count Range, Customer Purchase & Velocity)
                    </span>
                  </div>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleClearAllFilters}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100/90 border border-rose-200/60 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear All Filters</span>
                    </button>
                  )}
                </div>

                {/* Filter Controls Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                  {/* 1. Brand Filter */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-[#0066CC]" /> Brand
                    </label>
                    <select
                      value={selectedBrand}
                      onChange={(e) => {
                        setSelectedBrand(e.target.value);
                        setProductPage(1);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#08275E]"
                    >
                      <option value="all">All Brands {brands.length > 0 ? `(${brands.length})` : ''}</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Category Filter */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <FolderTree className="w-3 h-3 text-[#0066CC]" /> Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setProductPage(1);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#08275E]"
                    >
                      <option value="all">All Categories {categories.length > 0 ? `(${categories.length})` : ''}</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Stock Count Range Filter */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <Boxes className="w-3 h-3 text-amber-600" /> Stock Count Range
                    </label>
                    <select
                      value={stockCountRange}
                      onChange={(e) => {
                        setStockCountRange(e.target.value as StockCountRange);
                        setProductPage(1);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#08275E]"
                    >
                      <option value="all">All Quantities (Any Stock)</option>
                      <option value="0">0 Units (Depleted / Out of Stock)</option>
                      <option value="1-10">1 – 10 Units (Critically Low)</option>
                      <option value="11-50">11 – 50 Units (Low / Reorder Soon)</option>
                      <option value="51-200">51 – 200 Units (Healthy / Standard)</option>
                      <option value="200plus">200+ Units (Surplus / High Volume)</option>
                      <option value="custom">⚙️ Custom Range (Min / Max)...</option>
                    </select>
                  </div>

                  {/* 4. Customer Purchase / Demand Velocity */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3 text-emerald-600" /> Customer Purchase & Demand
                    </label>
                    <select
                      value={customerDemandFilter}
                      onChange={(e) => {
                        setCustomerDemandFilter(e.target.value as CustomerDemandFilter);
                        setProductPage(1);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#08275E]"
                    >
                      <option value="all">All Demand & Velocity</option>
                      <option value="in_cart">🛒 In Active Cart / Checkout Hold</option>
                      <option value="best_seller">🔥 Best Sellers (High Demand)</option>
                      <option value="new_arrival">✨ New Arrivals (Customer Launch)</option>
                      <option value="featured">⭐ Featured Store Products</option>
                      <option value="stagnant">💤 Slow Moving / Stagnant Stock</option>
                    </select>
                  </div>

                  {/* 5. Inventory Sorting */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <ArrowUpDown className="w-3 h-3 text-purple-600" /> Sort Order
                    </label>
                    <select
                      value={inventorySort}
                      onChange={(e) => {
                        setInventorySort(e.target.value as InventorySort);
                        setProductPage(1);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#08275E]"
                    >
                      <option value="stock_asc">📦 Stock: Lowest First (Urgent Reorder)</option>
                      <option value="stock_desc">📦 Stock: Highest First (Overstocked)</option>
                      <option value="cart_reserved">🛒 Cart Hold: Most Reserved First</option>
                      <option value="price_desc">💰 Price: High to Low</option>
                      <option value="price_asc">💰 Price: Low to High</option>
                      <option value="name_asc">🔤 Product Name: A to Z</option>
                      <option value="newest">🕒 Recently Added (Newest)</option>
                    </select>
                  </div>
                </div>

                {/* Custom Min/Max Stock Inputs (Visible when stockCountRange === 'custom') */}
                {stockCountRange === 'custom' && (
                  <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs">
                    <span className="font-bold text-amber-900 shrink-0">
                      Specify Exact Stock Boundaries:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <label className="text-slate-600 font-semibold">Min Units:</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={customMinStock}
                        onChange={(e) => {
                          setCustomMinStock(e.target.value);
                          setProductPage(1);
                        }}
                        className="w-24 px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#08275E]"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="text-slate-600 font-semibold">Max Units:</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="500"
                        value={customMaxStock}
                        onChange={(e) => {
                          setCustomMaxStock(e.target.value);
                          setProductPage(1);
                        }}
                        className="w-24 px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#08275E]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomMinStock('');
                        setCustomMaxStock('');
                        setStockCountRange('all');
                      }}
                      className="text-[11px] text-amber-800 underline hover:text-amber-950 font-semibold ml-auto"
                    >
                      Clear Range
                    </button>
                  </div>
                )}

                {/* Active Filter Chips */}
                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 mr-1">Active:</span>

                    {productSearch.trim() && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#08275E] border border-blue-200">
                        <Search className="w-2.5 h-2.5" /> &ldquo;{productSearch}&rdquo;
                        <button
                          type="button"
                          onClick={() => {
                            setProductSearch('');
                            setProductPage(1);
                          }}
                          className="hover:text-rose-600 ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {selectedBrand !== 'all' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-800 border border-slate-300">
                        <Tag className="w-2.5 h-2.5" /> Brand: {brands.find((b) => b.id === selectedBrand)?.name || selectedBrand}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBrand('all');
                            setProductPage(1);
                          }}
                          className="hover:text-rose-600 ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {selectedCategory !== 'all' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-800 border border-slate-300">
                        <FolderTree className="w-2.5 h-2.5" /> Category: {categories.find((c) => c.id === selectedCategory)?.name || selectedCategory}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory('all');
                            setProductPage(1);
                          }}
                          className="hover:text-rose-600 ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {stockCountRange !== 'all' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                        <Boxes className="w-2.5 h-2.5" />
                        Count: {stockCountRange === 'custom' ? `${customMinStock || '0'}–${customMaxStock || '∞'} units` : stockCountRange === '0' ? '0 units' : `${stockCountRange} units`}
                        <button
                          type="button"
                          onClick={() => {
                            setStockCountRange('all');
                            setCustomMinStock('');
                            setCustomMaxStock('');
                            setProductPage(1);
                          }}
                          className="hover:text-rose-600 ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {customerDemandFilter !== 'all' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-900 border border-purple-300">
                        <ShoppingBag className="w-2.5 h-2.5" />
                        Demand: {
                          customerDemandFilter === 'in_cart'
                            ? 'In Cart Hold'
                            : customerDemandFilter === 'best_seller'
                            ? 'Best Sellers'
                            : customerDemandFilter === 'new_arrival'
                            ? 'New Arrivals'
                            : customerDemandFilter === 'featured'
                            ? 'Featured'
                            : 'Slow Moving'
                        }
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerDemandFilter('all');
                            setProductPage(1);
                          }}
                          className="hover:text-rose-600 ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {inventorySort !== 'stock_asc' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-700 border border-slate-300">
                        <ArrowUpDown className="w-2.5 h-2.5" />
                        Sort: {inventorySort.replace('_', ' ')}
                        <button
                          type="button"
                          onClick={() => {
                            setInventorySort('stock_asc');
                            setProductPage(1);
                          }}
                          className="hover:text-rose-600 ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Bulk Add Stock Table Button */}
              {hasPermission('inventory.update') && (
                <div className="px-5 pb-1 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setIsBulkStockModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/80 shadow-2xs transition-colors cursor-pointer active:scale-95"
                    title="Bulk add or adjust warehouse stock using a spreadsheet table"
                  >
                    <Table className="w-3.5 h-3.5 text-emerald-700" />
                    <span>+ Add Stock via Table (Bulk Entry)</span>
                  </button>

                  <span className="text-[11px] text-slate-500 font-medium">
                    Batch update incoming shipments (GRN) or deductions with pre-populated rows.
                  </span>
                </div>
              )}

              {/* Table Content */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-y border-slate-200">
                      <th className="py-3 px-4 font-bold">Product</th>
                      <th className="py-3 px-4 font-bold">SKU</th>
                      <th className="py-3 px-4 font-bold">Price (Rs.)</th>
                      <th className="py-3 px-4 font-bold text-center">Physical Stock</th>
                      <th className="py-3 px-4 font-bold text-center">Reserved Stock</th>
                      <th className="py-3 px-4 font-bold text-center">Available Stock</th>
                      <th className="py-3 px-4 font-bold">Alert Level</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y divide-slate-100 ${isLoadingProducts ? 'opacity-60 transition-opacity' : ''}`}>
                    {isLoadingProducts && products.length === 0 ? (
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
                            <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs">
                              <div>
                                <span className="text-slate-900 block truncate">{p.name}</span>
                                {/* Metadata badges for Brand, Category, Demand */}
                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                  {p.brandName && (
                                    <span className="inline-flex items-center text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                      {p.brandName}
                                    </span>
                                  )}
                                  {p.categoryName && (
                                    <span className="inline-flex items-center text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded">
                                      {p.categoryName}
                                    </span>
                                  )}
                                  {p.isBestSeller && (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-full">
                                      <Flame className="w-2.5 h-2.5" /> Best Seller
                                    </span>
                                  )}
                                  {p.isNewArrival && (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded-full">
                                      <Sparkles className="w-2.5 h-2.5" /> New
                                    </span>
                                  )}
                                  {reserved > 0 && (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                                      <ShoppingBag className="w-2.5 h-2.5" /> {reserved} in cart
                                    </span>
                                  )}
                                </div>
                                {hasVariants && (
                                  <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                                    {p.variants?.length} variants configured
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-500">{p.sku}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              {(p.priceCents / 100).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                className={`text-sm font-black ${available > 0 ? 'text-[#08275E]' : 'text-rose-600'
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
          </div>
        )}

        {/* VIEW 2: THE INVENTORY AUDIT TRAIL & MOVEMENTS LEDGER */}
        {activeView === 'LEDGER' && (
          <div className="space-y-6 animate-fade-in">
            {/* SECTION 2: Dedicated Audit Trail Section */}
            <div id="audit-trail-section" className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
              {/* Section Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-3">
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

                {/* Search Input & Page Size */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search product, SKU, remark, PO, or actor..."
                      value={movementSearch}
                      onChange={(e) => {
                        setMovementSearch(e.target.value);
                        setMovementPage(1);
                      }}
                      className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#08275E] w-56 sm:w-64"
                    />
                  </div>

                  {/* Items per page selector */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="text-[11px] font-medium">Show:</span>
                    <select
                      value={movementLimit}
                      onChange={(e) => {
                        setMovementLimit(Number(e.target.value));
                        setMovementPage(1);
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

              {/* Movement Filter by Accounting Classification */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setMovementClassFilter('all');
                    setMovementPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${movementClassFilter === 'all'
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${movementClassFilter === 'GRN'
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${movementClassFilter === 'INVOICE'
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${movementClassFilter === 'ADJUSTMENT'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                    }`}
                  title="Manual Adjustments (Damage, count corrections, returns)"
                >
                  <span>± Adjustments</span>
                </button>
              </div>

              {/* Comprehensive Audit Trail Multi-Filter Toolbar */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <SlidersHorizontal className="w-4 h-4 text-[#08275E]" />
                    <span>Audit Trail Multi-Filter Toolbar</span>
                    <span className="text-[11px] font-normal text-slate-500 ml-1">
                      (Actor/Role, Customer Purchases, Reason, Direction, Date Range)
                    </span>
                  </div>

                  {hasActiveMovementFilters && (
                    <button
                      type="button"
                      onClick={handleClearAllMovementFilters}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100/90 border border-rose-200/60 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear All Filters</span>
                    </button>
                  )}
                </div>

                {/* Filter Controls Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                  {/* 1. Actor / Role Filter */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <User className="w-3 h-3 text-[#0066CC]" /> Action Performed By
                    </label>
                    <select
                      value={movementActorType}
                      onChange={(e) => {
                        setMovementActorType(e.target.value as MovementActorType);
                        setMovementPage(1);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#08275E]"
                    >
                      <option value="all">All Actors &amp; Roles</option>
                      <option value="CUSTOMER">👤 Customer Purchases (Orders)</option>
                      <option value="ADMIN">🛡️ Admin &amp; Staff Adjustments</option>
                      <option value="SUPPLIER">🚚 Supplier Intake (GRN Restock)</option>
                    </select>
                  </div>

                  {/* 2. Classification / Reason Filter */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-purple-600" /> Classification Reason
                    </label>
                    <select
                      value={movementClassFilter}
                      onChange={(e) => {
                        setMovementClassFilter(e.target.value as MovementClassFilter);
                        setMovementPage(1);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#08275E]"
                    >
                      <option value="all">All Classifications</option>
                      <option value="GRN">+ GRN (Supplier Restock)</option>
                      <option value="INVOICE">- Invoice (Customer Orders)</option>
                      <option value="ADJUSTMENT">± Adjustments (Count / Damage)</option>
                    </select>
                  </div>

                  {/* 3. Direction & Volume */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <Boxes className="w-3 h-3 text-emerald-600" /> Stock Direction &amp; Volume
                    </label>
                    <select
                      value={movementDirection}
                      onChange={(e) => {
                        setMovementDirection(e.target.value as MovementDirection);
                        setMovementPage(1);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#08275E]"
                    >
                      <option value="all">All Stock Movements</option>
                      <option value="inward">🟢 Inward Only (+ Additions)</option>
                      <option value="outward">🔴 Outward Only (- Deductions)</option>
                      <option value="high_inflow">⚡ Large Inflow (50+ units)</option>
                      <option value="high_outflow">⚠️ Large Outflow (20+ units)</option>
                    </select>
                  </div>

                  {/* 4. Date & Timeframe */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-600" /> Date &amp; Timeframe
                    </label>
                    <select
                      value={movementTimeframe}
                      onChange={(e) => {
                        setMovementTimeframe(e.target.value as MovementTimeframe);
                        setMovementPage(1);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#08275E]"
                    >
                      <option value="all">All Time History</option>
                      <option value="today">Today (tdy)</option>
                      <option value="7days">1 Week (7 Days)</option>
                      <option value="30days">1 Month (30 Days)</option>
                      <option value="90days">3 Months (90 Days)</option>
                      <option value="custom">📅 Custom Date Range...</option>
                    </select>
                  </div>

                  {/* 5. Sort Order */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <ArrowUpDown className="w-3 h-3 text-indigo-600" /> Sort Movements
                    </label>
                    <select
                      value={movementSort}
                      onChange={(e) => {
                        setMovementSort(e.target.value as MovementSortOption);
                        setMovementPage(1);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#08275E]"
                    >
                      <option value="newest">🕒 Timestamp: Newest First</option>
                      <option value="oldest">🕒 Timestamp: Oldest First</option>
                      <option value="change_desc">📈 Largest Addition (+ In)</option>
                      <option value="change_asc">📉 Largest Deduction (- Out)</option>
                    </select>
                  </div>
                </div>

                {/* Custom Date Range Inputs (when movementTimeframe === 'custom') */}
                {movementTimeframe === 'custom' && (
                  <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs">
                    <span className="font-bold text-amber-900 shrink-0 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-700" />
                      Specify Date Range:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <label className="text-slate-600 font-semibold">From:</label>
                      <input
                        type="date"
                        value={movementStartDate}
                        onChange={(e) => {
                          setMovementStartDate(e.target.value);
                          setMovementPage(1);
                        }}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#08275E]"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="text-slate-600 font-semibold">To:</label>
                      <input
                        type="date"
                        value={movementEndDate}
                        onChange={(e) => {
                          setMovementEndDate(e.target.value);
                          setMovementPage(1);
                        }}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#08275E]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMovementStartDate('');
                        setMovementEndDate('');
                        setMovementTimeframe('all');
                        setMovementPage(1);
                      }}
                      className="text-[11px] text-amber-800 underline hover:text-amber-950 font-semibold ml-auto cursor-pointer"
                    >
                      Clear Date Range
                    </button>
                  </div>
                )}

                {/* Active Movement Filter Chips */}
                {hasActiveMovementFilters && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 mr-1">Active:</span>

                    {movementSearch.trim() && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#08275E] border border-blue-200">
                        <Search className="w-2.5 h-2.5" /> &ldquo;{movementSearch}&rdquo;
                        <button
                          type="button"
                          onClick={() => {
                            setMovementSearch('');
                            setMovementPage(1);
                          }}
                          className="hover:text-rose-600 ml-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {movementActorType !== 'all' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        <User className="w-2.5 h-2.5" />
                        Actor: {movementActorType === 'CUSTOMER' ? 'Customer Purchases' : movementActorType === 'ADMIN' ? 'Admin / Staff' : 'Supplier GRN'}
                        <button
                          type="button"
                          onClick={() => {
                            setMovementActorType('all');
                            setMovementPage(1);
                          }}
                          className="hover:text-rose-600 ml-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {movementClassFilter !== 'all' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-900 border border-purple-300">
                        <Tag className="w-2.5 h-2.5" />
                        Type: {movementClassFilter}
                        <button
                          type="button"
                          onClick={() => {
                            setMovementClassFilter('all');
                            setMovementPage(1);
                          }}
                          className="hover:text-rose-600 ml-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {movementDirection !== 'all' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-800 border border-slate-300">
                        <Boxes className="w-2.5 h-2.5" />
                        Direction: {movementDirection.replace('_', ' ')}
                        <button
                          type="button"
                          onClick={() => {
                            setMovementDirection('all');
                            setMovementPage(1);
                          }}
                          className="hover:text-rose-600 ml-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {movementTimeframe !== 'all' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                        <Calendar className="w-2.5 h-2.5" />
                        Timeframe: {movementTimeframe === 'custom' ? `${movementStartDate || 'Start'} to ${movementEndDate || 'End'}` : movementTimeframe}
                        <button
                          type="button"
                          onClick={() => {
                            setMovementTimeframe('all');
                            setMovementStartDate('');
                            setMovementEndDate('');
                            setMovementPage(1);
                          }}
                          className="hover:text-rose-600 ml-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {movementSort !== 'newest' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 text-slate-700 border border-slate-300">
                        <ArrowUpDown className="w-2.5 h-2.5" />
                        Sort: {movementSort.replace('_', ' ')}
                        <button
                          type="button"
                          onClick={() => {
                            setMovementSort('newest');
                            setMovementPage(1);
                          }}
                          className="hover:text-rose-600 ml-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>
                )}
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
                      <th className="py-2.5 px-3 font-semibold text-center text-emerald-700 bg-emerald-50/50">+ In (Addition)</th>
                      <th className="py-2.5 px-3 font-semibold text-center text-rose-700 bg-rose-50/50">- Out (Deduction)</th>
                      <th className="py-2.5 px-3 font-semibold text-center">Resulting Stock</th>
                      <th className="py-2.5 px-3 font-semibold min-w-[200px]">Action Performed By / Actor</th>
                      <th className="py-2.5 px-3 font-semibold">Audit Remarks</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y divide-slate-100 ${isLoadingMovements ? 'opacity-60 transition-opacity' : ''}`}>
                    {isLoadingMovements && movements.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-10 text-center text-slate-400">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#08275E] mb-2" />
                          <span>Loading audit records...</span>
                        </td>
                      </tr>
                    ) : movements.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-10 text-center text-slate-400">
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
                            {/* + Inward / Addition Column (Green) */}
                            <td className="py-3 px-3 text-center font-bold font-mono">
                              {m.changeAmount > 0 ? (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-md inline-block font-black shadow-2xs">
                                  +{m.changeAmount}
                                </span>
                              ) : (
                                <span className="text-slate-300 font-normal">—</span>
                              )}
                            </td>
                            {/* - Outward / Deduction Column (Red) */}
                            <td className="py-3 px-3 text-center font-bold font-mono">
                              {m.changeAmount < 0 ? (
                                <span className="bg-rose-50 text-rose-700 border border-rose-200/80 px-2 py-0.5 rounded-md inline-block font-black shadow-2xs">
                                  {m.changeAmount}
                                </span>
                              ) : (
                                <span className="text-slate-300 font-normal">—</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                              {m.newQuantity}
                            </td>
                            {/* Action Performed By (Actor, Role, ID, and Customer Info) */}
                            <td className="py-3 px-3 min-w-[200px]">
                              {(() => {
                                const actor = m.actor || {
                                  name: m.performedBy || 'System Administrator',
                                  role: 'Super Admin',
                                  type: 'ADMIN',
                                  id: m.performedById,
                                };

                                const isCustomer =
                                  actor.type === 'CUSTOMER' ||
                                  actor.role?.toLowerCase().includes('customer') ||
                                  rawReason === 'ORDER_FULFILLMENT';
                                const isSupplier = actor.type === 'SUPPLIER';

                                return (
                                  <div className="space-y-1">
                                    {/* Name & Role Badge Row */}
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                                        {isCustomer ? (
                                          <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        ) : isSupplier ? (
                                          <Truck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                        ) : (
                                          <ShieldCheck className="w-3.5 h-3.5 text-[#0066CC] shrink-0" />
                                        )}
                                        {actor.name}
                                      </span>
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                          isCustomer
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : isSupplier
                                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                            : 'bg-blue-50 text-[#08275E] border border-blue-200'
                                        }`}
                                      >
                                        {actor.role || (isCustomer ? 'Customer' : 'Admin')}
                                      </span>
                                    </div>

                                    {/* Contact info / email if available */}
                                    {actor.email && (
                                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                        <Mail className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                        <span className="truncate max-w-[170px]">{actor.email}</span>
                                      </div>
                                    )}

                                    {/* Customer Phone if available */}
                                    {actor.phone && (
                                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                        <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                        <span>{actor.phone}</span>
                                      </div>
                                    )}

                                    {/* Reference / Order / User ID line */}
                                    <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                                      {actor.reference ? (
                                        <span className="font-semibold text-purple-700 bg-purple-50 px-1 py-0.5 rounded border border-purple-200">
                                          Ref: {actor.reference}
                                        </span>
                                      ) : actor.id ? (
                                        <span title={`Account ID: ${actor.id}`}>
                                          ID: {actor.id.length > 14 ? `${actor.id.slice(0, 12)}…` : actor.id}
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                );
                              })()}
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
          </div>
        )}

        {/* Bulk Add Stock Table Modal */}
        <BulkAddStockModal
          isOpen={isBulkStockModalOpen}
          onClose={() => setIsBulkStockModalOpen(false)}
          products={products}
          onSuccess={() => {
            loadProducts();
            loadAnalytics();
            loadMovements();
          }}
        />

        {/* Adjust Stock Modal */}
        {adjustingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <form
              onSubmit={handleSaveAdjustment}
              className="bg-white rounded-3xl border border-slate-200 max-w-md w-full shadow-2xl text-xs flex flex-col max-h-[85vh] overflow-hidden my-auto"
            >
              {/* Fixed Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 shrink-0 bg-white">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Adjust Warehouse Inventory
                  </h3>
                  <span className="text-[11px] text-slate-500 block">
                    Update physical stock count &amp; record audit movement
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => !isSubmitting && setAdjustingProduct(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
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

                {/* Adjustment Mode Selector */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5 text-xs uppercase tracking-wider">
                    Adjustment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setAdjustmentMode('DELTA');
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        adjustmentMode === 'DELTA'
                          ? 'bg-white text-[#08275E] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>➕ / ➖ Add or Deduct Stock</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAdjustmentMode('TARGET');
                        setNewQuantity(getSelectedStock());
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        adjustmentMode === 'TARGET'
                          ? 'bg-white text-[#08275E] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>🎯 Set Exact Total</span>
                    </button>
                  </div>
                </div>

                {/* Mode 1: Quick Add or Deduct */}
                {adjustmentMode === 'DELTA' ? (
                  <div className="space-y-3">
                    {/* Operation Toggle (+ Add or - Deduct) */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDeltaOp('ADD');
                          setReason('RESTOCK');
                        }}
                        className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          deltaOp === 'ADD'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Stock (Restock)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeltaOp('DEDUCT');
                          setReason('DAMAGED');
                        }}
                        className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          deltaOp === 'DEDUCT'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-500/20'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Minus className="w-4 h-4" />
                        <span>Deduct Stock (Damage / Loss)</span>
                      </button>
                    </div>

                    {/* Quantity Input */}
                    <div>
                      <label className="font-bold text-slate-700 block mb-1 text-sm">
                        {deltaOp === 'ADD' ? 'Quantity to Add (+)' : 'Quantity to Deduct (-)'} *
                      </label>
                      <div className="relative">
                        <span
                          className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-base ${
                            deltaOp === 'ADD' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {deltaOp === 'ADD' ? '+' : '−'}
                        </span>
                        <input
                          type="number"
                          min="1"
                          placeholder="e.g. 20"
                          value={deltaAmount === 0 ? '' : deltaAmount}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0);
                            setDeltaAmount(val);
                          }}
                          disabled={isSubmitting}
                          required
                          className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#08275E]/20"
                        />
                      </div>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1.5">
                        <span>Quick Presets:</span>
                        {deltaAmount !== 0 && deltaAmount !== '' && (
                          <button
                            type="button"
                            onClick={() => setDeltaAmount(0)}
                            className="text-slate-400 hover:text-slate-600 underline text-[10px] cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {deltaOp === 'ADD' ? (
                          <>
                            {[5, 10, 20, 50, 100].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setDeltaAmount(val)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                                  deltaAmount === val
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                                }`}
                              >
                                +{val}
                              </button>
                            ))}
                          </>
                        ) : (
                          <>
                            {[1, 5, 10, 20, 50].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setDeltaAmount(val)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                                  deltaAmount === val
                                    ? 'bg-rose-100 text-rose-800 border-rose-300 ring-1 ring-rose-400'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                                }`}
                              >
                                -{val}
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Mode 2: Set Exact Target Total */
                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-sm">
                      New Target Stock Level (Units) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newQuantity}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value));
                        setNewQuantity(val);
                        if (val > getSelectedStock()) {
                          setReason('RESTOCK');
                        } else if (val < getSelectedStock()) {
                          setReason('CORRECTION');
                        }
                      }}
                      disabled={isSubmitting}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#08275E]/20"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block font-medium">
                      Enter the total physical count currently on shelf.
                    </span>
                  </div>
                )}

                {/* Stock Calculation Equation Preview Card */}
                {(() => {
                  const currentStock = getSelectedStock();
                  const numericDelta = typeof deltaAmount === 'number' ? deltaAmount : 0;
                  const effectiveSignedDelta =
                    adjustmentMode === 'DELTA'
                      ? deltaOp === 'ADD'
                        ? numericDelta
                        : -numericDelta
                      : newQuantity - currentStock;
                  const effectiveNewTotal = currentStock + effectiveSignedDelta;

                  return (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-2">
                        <span>Stock Calculation Preview</span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            effectiveSignedDelta > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : effectiveSignedDelta < 0
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {effectiveSignedDelta > 0
                            ? `+${effectiveSignedDelta} IN (Restock)`
                            : effectiveSignedDelta < 0
                            ? `${effectiveSignedDelta} OUT (Deduction)`
                            : 'No Change'}
                        </span>
                      </div>

                      <div className="flex items-center justify-around text-center py-1">
                        <div>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase">Current Stock</div>
                          <div className="text-base font-extrabold text-slate-700">{currentStock}</div>
                        </div>
                        <div className="text-xl text-slate-300 font-light">
                          {effectiveSignedDelta >= 0 ? '+' : '−'}
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase">
                            {effectiveSignedDelta >= 0 ? 'Adding' : 'Deducting'}
                          </div>
                          <div
                            className={`text-base font-extrabold ${
                              effectiveSignedDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {Math.abs(effectiveSignedDelta)}
                          </div>
                        </div>
                        <div className="text-xl text-slate-300 font-light">=</div>
                        <div>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase">New Balance</div>
                          <div
                            className={`text-xl font-black ${
                              effectiveNewTotal > currentStock
                                ? 'text-emerald-600'
                                : effectiveNewTotal < currentStock
                                ? 'text-rose-600'
                                : 'text-slate-800'
                            }`}
                          >
                            {effectiveNewTotal}
                          </div>
                        </div>
                      </div>

                      {adjustingProduct.reservedStock ? (
                        <div className="mt-2 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 flex justify-between">
                          <span>
                            Reserved for checkouts: <strong className="text-slate-700">{adjustingProduct.reservedStock}</strong>
                          </span>
                          <span>
                            Effective Available:{' '}
                            <strong
                              className={
                                effectiveNewTotal - adjustingProduct.reservedStock >= 0
                                  ? 'text-[#08275E]'
                                  : 'text-rose-600'
                              }
                            >
                              {Math.max(0, effectiveNewTotal - adjustingProduct.reservedStock)}
                            </strong>
                          </span>
                        </div>
                      ) : null}
                    </div>
                  );
                })()}

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
              </div>

              {/* Fixed Sticky Footer */}
              <div className="flex gap-2 justify-end p-4 sm:p-5 border-t border-slate-100 shrink-0 bg-slate-50/90">
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
                  disabled={
                    isSubmitting ||
                    (adjustmentMode === 'DELTA'
                      ? (typeof deltaAmount === 'number' ? deltaAmount : 0) === 0
                      : newQuantity - getSelectedStock() === 0)
                  }
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
                    <span>
                      {(() => {
                        const currentStock = getSelectedStock();
                        const numericDelta = typeof deltaAmount === 'number' ? deltaAmount : 0;
                        const signedDelta =
                          adjustmentMode === 'DELTA'
                            ? deltaOp === 'ADD'
                              ? numericDelta
                              : -numericDelta
                            : newQuantity - currentStock;
                        return signedDelta !== 0
                          ? `Confirm (${signedDelta > 0 ? `+${signedDelta}` : signedDelta})`
                          : 'Confirm Adjustment';
                      })()}
                    </span>
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

export default function AdminInventoryPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#08275E] mb-2" />
          <span>Loading Inventory &amp; Stock Control...</span>
        </div>
      }
    >
      <InventoryManagementContent />
    </Suspense>
  );
}