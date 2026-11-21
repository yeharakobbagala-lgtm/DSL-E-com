'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  PenTool,
  Search,
  ExternalLink,
  Edit,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Plus,
  Printer,
  FileText,
  Clock,
  ShoppingBag,
  X,
  Save,
  Check,
  AlertCircle,
  Trash2,
  Upload,
  ImageIcon,
  Loader2,
  Crosshair,
  Sliders,
} from 'lucide-react';
import { apiClient } from '@/lib/api/apiClient';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { brandService } from '@/services/brandService';
import { ProductThumbnail } from '@/components/common/ProductThumbnail';
import { orderService } from '@/services/orderService';
import { Product, ProductCategory, Brand, BulkPricingRule } from '@/types/product';
import { Order } from '@/types/order';
import { formatLKR, rupeesToCents, centsToRupees } from '@/lib/currency';
import { resolveImageUrl } from '@/lib/image';
import { AdminPageAccess } from '@/components/admin/AdminPageAccess';
import { OrderInvoiceModal } from '@/components/admin/orders/OrderInvoiceModal';

function AdminCustomizePenContent() {
  const [activeTab, setActiveTab] = useState<'pens' | 'invoices'>('pens');

  // Pen Models State
  const [pens, setPens] = useState<Product[]>([]);
  const [catalogPens, setCatalogPens] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');

  // Sold Invoices / Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  // Add Pen Model Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'catalog' | 'new'>('catalog');
  const [isSavingPen, setIsSavingPen] = useState(false);
  const [addModalError, setAddModalError] = useState<string | null>(null);

  // Form Fields: Catalog Selection
  const [selectedCatalogPenId, setSelectedCatalogPenId] = useState('');

  // Form Fields: New Pen Model
  const [newPenName, setNewPenName] = useState('');
  const [newPenSku, setNewPenSku] = useState('');
  const [newPenBrandId, setNewPenBrandId] = useState('');
  const [newPenCategoryId, setNewPenCategoryId] = useState('');
  const [newPenPriceRupees, setNewPenPriceRupees] = useState<number | ''>(450);
  const [newPenStock, setNewPenStock] = useState<number | ''>(50);
  const [newPenImage, setNewPenImage] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [newPenDescription, setNewPenDescription] = useState('Premium smooth writing instrument crafted for personalized engraving.');

  // Form Fields: Customization Rules
  const [modalBaseFeeRupees, setModalBaseFeeRupees] = useState<number | ''>(350);
  const [modalMaxCharacters, setModalMaxCharacters] = useState(25);
  const [modalAllowedPositions, setModalAllowedPositions] = useState<string[]>(['CAP', 'BARREL', 'CLIP']);
  const [modalAllowedFonts, setModalAllowedFonts] = useState<string[]>([
    'Arial',
    'Times New Roman',
    'Italic',
    'Calibri',
    'Script',
  ]);
  const [modalBulkRules, setModalBulkRules] = useState<Array<{ minQuantity: number; feeRupees: number }>>([
    { minQuantity: 10, feeRupees: 250 },
    { minQuantity: 50, feeRupees: 180 },
    { minQuantity: 100, feeRupees: 120 },
  ]);

  // Visual Calibration Studio State
  const [calibratingPen, setCalibratingPen] = useState<Product | null>(null);
  const [calibrationPosition, setCalibrationPosition] = useState<'BARREL' | 'CAP' | 'CLIP'>('BARREL');
  const [calibrationText, setCalibrationText] = useState('Kasun Perera');
  const [calibrationFont, setCalibrationFont] = useState('Serif');
  const [calibrationFoil, setCalibrationFoil] = useState<'gold' | 'silver' | 'white' | 'black'>('gold');
  const [isSavingCalibration, setIsSavingCalibration] = useState(false);
  const [calibrationSavedToast, setCalibrationSavedToast] = useState(false);

  const [activeZoneCoordinates, setActiveZoneCoordinates] = useState<
    Record<
      string,
      {
        left: number;
        top: number;
        width: number;
        height: number;
        rotation: number;
        textAlign: 'left' | 'center' | 'right';
        fontScale: number;
      }
    >
  >({
    BARREL: { left: 38.0, top: 61.0, width: 32.0, height: 10.0, rotation: -17.6, textAlign: 'center', fontScale: 1.05 },
    CAP: { left: 74.0, top: 31.0, width: 25.0, height: 10.0, rotation: -17.6, textAlign: 'center', fontScale: 0.95 },
    CLIP: { left: 72.0, top: 25.0, width: 18.0, height: 8.0, rotation: -17.6, textAlign: 'center', fontScale: 0.85 },
  });

  const handleStartCalibration = (pen: Product) => {
    setCalibratingPen(pen);
    setCalibrationPosition('BARREL');
    const existingConfig = (pen.customizationConfig?.previewConfig as any) || {};

    const parseNum = (val: any, def: number) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const p = parseFloat(val.replace('%', '').trim());
        return isNaN(p) ? def : p;
      }
      return def;
    };

    const parseRot = (val: any, def: number) => {
      const parsed = parseNum(val, def);
      return parsed === 0 ? def : parsed;
    };

    const barrel = existingConfig.BARREL || existingConfig.barrel || existingConfig.zones?.BARREL || {};
    const cap = existingConfig.CAP || existingConfig.cap || existingConfig.zones?.CAP || {};
    const clip = existingConfig.CLIP || existingConfig.clip || existingConfig.zones?.CLIP || {};

    const isLegacyBarrel = (barrel.left === 45.5 || barrel.x === 50) && (barrel.top === 48.5 || barrel.y === 55);

    setActiveZoneCoordinates({
      BARREL: {
        left: isLegacyBarrel ? 38.0 : parseNum(barrel.left ?? barrel.x, 38.0),
        top: isLegacyBarrel ? 61.0 : parseNum(barrel.top ?? barrel.y, 61.0),
        width: parseNum(barrel.width, 32.0),
        height: parseNum(barrel.height, 10.0),
        rotation: parseRot(barrel.rotation ?? barrel.angle, -17.6),
        textAlign: barrel.textAlign || 'center',
        fontScale: parseNum(barrel.fontScale, 1.05),
      },
      CAP: {
        left: parseNum(cap.left ?? cap.x, 74.0),
        top: parseNum(cap.top ?? cap.y, 31.0),
        width: parseNum(cap.width, 25.0),
        height: parseNum(cap.height, 10.0),
        rotation: parseRot(cap.rotation ?? cap.angle, -17.6),
        textAlign: cap.textAlign || 'center',
        fontScale: parseNum(cap.fontScale, 0.95),
      },
      CLIP: {
        left: parseNum(clip.left ?? clip.x, 72.0),
        top: parseNum(clip.top ?? clip.y, 25.0),
        width: parseNum(clip.width, 18.0),
        height: parseNum(clip.height, 8.0),
        rotation: parseRot(clip.rotation ?? clip.angle, -17.6),
        textAlign: clip.textAlign || 'center',
        fontScale: parseNum(clip.fontScale, 0.85),
      },
    });
  };

  const handleSaveCalibration = async () => {
    if (!calibratingPen) return;
    setIsSavingCalibration(true);
    try {
      const existingCfg = calibratingPen.customizationConfig;
      const updatedPayload = {
        isCustomizable: existingCfg?.isCustomizable ?? true,
        maxCharacters: existingCfg?.maxCharacters ?? 25,
        baseFeeCents: existingCfg?.baseFeeCents ?? 35000,
        allowedPositions: existingCfg?.allowedPositions ?? ['CAP', 'BARREL', 'CLIP'],
        allowedFonts: existingCfg?.allowedFonts ?? ['Arial', 'Times New Roman', 'Italic', 'Calibri', 'Script'],
        bulkRules: existingCfg?.bulkRules ?? [],
        previewConfig: {
          ...((existingCfg?.previewConfig as any) || {}),
          ...activeZoneCoordinates,
        },
      };

      await productService.updateCustomizationConfig(calibratingPen.id, updatedPayload);
      setCalibrationSavedToast(true);
      setTimeout(() => setCalibrationSavedToast(false), 3000);
      await loadPens();
      setCalibratingPen(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to save calibration coordinates');
    } finally {
      setIsSavingCalibration(false);
    }
  };

  // Load Data
  const loadPens = async () => {
    setIsLoading(true);
    try {
      const [customizableItems, allProductsRes, cats, brs] = await Promise.all([
        productService.fetchCustomizablePens(),
        productService.fetchProducts({}, 'name_asc', 1, 100).catch(() => ({ items: [] })),
        categoryService.fetchCategories().catch(() => []),
        brandService.fetchBrands().catch(() => []),
      ]);
      setPens(customizableItems || []);
      setCategories(cats || []);
      setBrands(brs || []);

      // Filter catalog pens to those not yet customized
      const configuredIds = new Set((customizableItems || []).map((p) => p.id));
      const unenrolled = (allProductsRes.items || []).filter((p) => !configuredIds.has(p.id));
      setCatalogPens(unenrolled);
      if (unenrolled.length > 0 && !selectedCatalogPenId) {
        setSelectedCatalogPenId(unenrolled[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch customizable pens:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const res = await orderService.fetchOrders({ limit: 100 });
      // Filter for orders containing customized items
      const customOrders = (res.orders || []).filter((o) =>
        (o.items || []).some((i: any) => Boolean(i.customization))
      );
      setOrders(customOrders);
    } catch (err) {
      console.error('Failed to fetch sold customization orders:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadPens();
    loadOrders();
  }, []);

  // Filtered Pen List
  const filteredPens = useMemo(() => {
    return pens.filter((p) => {
      const matchesSearch =
        searchQuery === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());

      const isEnabled = Boolean(p.customizationConfig?.isCustomizable);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'enabled' && isEnabled) ||
        (statusFilter === 'disabled' && !isEnabled);

      return matchesSearch && matchesStatus;
    });
  }, [pens, searchQuery, statusFilter]);

  // Filtered Sold Customization Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (!orderSearchQuery.trim()) return true;
      const q = orderSearchQuery.toLowerCase();
      const matchNumber = o.orderNumber?.toLowerCase().includes(q);
      const matchCustomer = o.shippingAddress?.fullName?.toLowerCase().includes(q);
      const matchPhone = o.shippingAddress?.phone?.toLowerCase().includes(q);
      const matchText = (o.items || []).some((i: any) =>
        i.customization?.engravingText?.toLowerCase().includes(q)
      );
      return matchNumber || matchCustomer || matchPhone || matchText;
    });
  }, [orders, orderSearchQuery]);

  const enabledCount = pens.filter((p) => p.customizationConfig?.isCustomizable).length;

  // Selected Pen for Catalog Enrollment
  const selectedCatalogPen = useMemo(() => {
    return catalogPens.find((p) => p.id === selectedCatalogPenId);
  }, [catalogPens, selectedCatalogPenId]);

  // Handle Remove Pen from Customization Studio
  const handleRemoveCustomization = async (pen: Product) => {
    if (!confirm(`Are you sure you want to remove "${pen.name}" from the Customization Studio?`)) {
      return;
    }
    try {
      await apiClient.delete(`products/${pen.id}/customization`);
      await loadPens();
    } catch (err: any) {
      alert(err?.message || 'Failed to remove pen customization');
    }
  };

  // Handle Image File Upload directly from computer
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setAddModalError(null);

    try {
      const uploadedUrl = await productService.uploadProductImage(file);
      if (uploadedUrl) {
        setNewPenImage(uploadedUrl);
      }
    } catch (err: any) {
      console.warn('Backend file upload fallback:', err);
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setNewPenImage(String(uploadEvent.target.result));
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  // Handle Save Pen Model
  const handleSavePenModel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPen(true);
    setAddModalError(null);

    try {
      let targetProductId = selectedCatalogPenId;

      if (addMode === 'new') {
        if (!newPenName.trim()) throw new Error('Pen Model Name is required');
        const penPrice = Number(newPenPriceRupees) || 0;
        const penStock = Number(newPenStock) || 0;

        const defaultCat = categories.find((c) => c.slug === 'pens') || categories[0];
        const defaultBrand = brands.find((b) => b.slug === 'speed') || brands[0];

        const baseSlug = newPenName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const existingInCatalog = catalogPens.find(
          (p) => p.slug === baseSlug || p.name.toLowerCase() === newPenName.trim().toLowerCase()
        );

        if (existingInCatalog) {
          // If product already exists in catalog, re-enroll it and update with current inputs
          targetProductId = existingInCatalog.id;
          await productService.updateProductApi(existingInCatalog.id, {
            priceCents: rupeesToCents(penPrice),
            stockQuantity: penStock,
            images: newPenImage.trim() ? [newPenImage.trim()] : existingInCatalog.images,
            isActive: true,
          }).catch(() => {});
        } else {
          const created = await productService.createProductApi({
            name: newPenName.trim(),
            slug: baseSlug,
            sku: newPenSku.trim() || `DSL-PEN-${Date.now().toString().slice(-5)}`,
            categoryId: newPenCategoryId || defaultCat?.id || 'cat-pens',
            brandId: newPenBrandId || defaultBrand?.id || 'brand-speed',
            priceCents: rupeesToCents(penPrice),
            stockQuantity: penStock,
            images: newPenImage.trim() ? [newPenImage.trim()] : ['/products/speed-rim-blue.png'],
            description: newPenDescription,
            shortDescription: newPenName.trim(),
            isActive: true,
          });
          targetProductId = created.id;
        }
      }

      if (!targetProductId) {
        throw new Error('Please select or specify a valid product');
      }

      // Configure customization settings for this product
      const customizationPayload = {
        isCustomizable: true,
        maxCharacters: Number(modalMaxCharacters) || 25,
        baseFeeCents: rupeesToCents(Number(modalBaseFeeRupees) || 350),
        allowedPositions: modalAllowedPositions.length > 0 ? modalAllowedPositions : ['CAP', 'BARREL', 'CLIP'],
        allowedFonts: modalAllowedFonts.length > 0 ? modalAllowedFonts : ['Arial', 'Times New Roman', 'Script'],
        bulkRules: modalBulkRules
          .filter((r) => r.minQuantity > 0 && r.feeRupees >= 0)
          .map((r) => ({
            minQuantity: Number(r.minQuantity),
            feeCents: rupeesToCents(Number(r.feeRupees)),
          })),
        previewConfig: {
          barrel: { left: 38, top: 61, width: 32, height: 10, rotation: -17.6, textAlign: 'center', fontScale: 1.05 },
          BARREL: { left: 38, top: 61, width: 32, height: 10, rotation: -17.6, textAlign: 'center', fontScale: 1.05 },
          cap: { left: 74, top: 31, width: 25, height: 10, rotation: -17.6, textAlign: 'center', fontScale: 0.95 },
          CAP: { left: 74, top: 31, width: 25, height: 10, rotation: -17.6, textAlign: 'center', fontScale: 0.95 },
          clip: { left: 72, top: 25, width: 18, height: 8, rotation: -17.6, textAlign: 'center', fontScale: 0.85 },
          CLIP: { left: 72, top: 25, width: 18, height: 8, rotation: -17.6, textAlign: 'center', fontScale: 0.85 },
        },
      };

      await productService.updateCustomizationConfig(targetProductId, customizationPayload);

      // Reload
      await loadPens();
      setIsAddModalOpen(false);
      // Reset form
      setNewPenName('');
      setNewPenSku('');
      setNewPenImage('');
    } catch (err: any) {
      console.error('Failed to add pen model:', err);
      setAddModalError(err?.message || 'Failed to enroll pen model');
    } finally {
      setIsSavingPen(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#08275E] text-white flex items-center justify-center shrink-0 shadow-xs">
            <PenTool className="w-6 h-6 text-[#FFD21C]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Pen Customization &amp; Engraving
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-[#0066CC] border border-blue-200">
                Studio Suite
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage authentic pen models, configure laser engraving rules, and print sold invoices &amp; work orders.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#0052a3] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Pen Model</span>
          </button>

          <Link
            href="/customize-pen"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Customer Studio</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              loadPens();
              loadOrders();
            }}
            disabled={isLoading || isLoadingOrders}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RotateCcw className={`w-4 h-4 ${isLoading || isLoadingOrders ? 'animate-spin text-[#0066CC]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">Authentic Pen Models</span>
          <span className="text-2xl font-black text-[#08275E] mt-1 block">{pens.length}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Configured in PostgreSQL</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">Active in Customer Studio</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{enabledCount}</span>
          <span className="text-[11px] text-emerald-700/80 mt-0.5 block">Available for personalization</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">Engraved Orders Sold</span>
          <span className="text-2xl font-black text-[#0066CC] mt-1 block">{orders.length}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Customer work orders</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">Standard Engraving Fee</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">Rs. 350.00</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Tiered discounts to Rs. 120</span>
        </div>
      </div>

      {/* 3. Tab Navigation */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('pens')}
          className={`pb-2 px-3 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'pens'
              ? 'border-[#0066CC] text-[#0066CC]'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <PenTool className="w-3.5 h-3.5" />
          <span>Pen Models &amp; Settings ({pens.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('invoices')}
          className={`pb-2 px-3 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'invoices'
              ? 'border-[#0066CC] text-[#0066CC]'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Sold Invoices &amp; Work Orders ({orders.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PEN MODELS CATALOGUE */}
      {/* ========================================================================= */}
      {activeTab === 'pens' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search pen by model name, brand or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#08275E]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none"
              >
                <option value="all">All Statuses ({pens.length})</option>
                <option value="enabled">Active Only ({enabledCount})</option>
                <option value="disabled">Disabled Only ({pens.length - enabledCount})</option>
              </select>
            </div>
          </div>

          {/* Customizable Pens Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            {isLoading ? (
              <div className="py-20 text-center space-y-2">
                <RotateCcw className="w-6 h-6 animate-spin mx-auto text-[#08275E]" />
                <p className="text-xs font-medium text-slate-500">Loading authentic pen models...</p>
              </div>
            ) : filteredPens.length === 0 ? (
              <div className="py-20 text-center space-y-3 px-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <PenTool className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No matching pen models found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click &ldquo;+ Add Pen Model&rdquo; above to enroll new pen models into the customization studio.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Pen Model</th>
                      <th className="py-3 px-3">SKU</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Base Fee (Rs.)</th>
                      <th className="py-3 px-3">Max Chars</th>
                      <th className="py-3 px-3">Positions</th>
                      <th className="py-3 px-3">Bulk Tiers</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPens.map((pen) => {
                      const cfg = pen.customizationConfig;
                      const isEnabled = Boolean(cfg?.isCustomizable);
                      const img = pen.images && pen.images.length > 0 ? pen.images[0] : null;

                      return (
                        <tr key={pen.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <ProductThumbnail
                                src={img}
                                alt={pen.name}
                                brandName={pen.brandName}
                                className="w-11 h-11 rounded-xl shrink-0"
                              />
                              <div>
                                <span className="font-bold text-slate-900 block truncate max-w-xs">
                                  {pen.name}
                                </span>
                                <span className="text-[10px] text-slate-400 block">
                                  Base: {formatLKR(pen.priceCents)} • {pen.brandName || 'DSL'}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                            {pen.sku}
                          </td>

                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                isEnabled
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}
                            >
                              {isEnabled ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Enabled</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 text-slate-400" />
                                  <span>Disabled</span>
                                </>
                              )}
                            </span>
                          </td>

                          <td className="py-3 px-3 font-bold text-slate-800">
                            {(cfg?.baseFeeCents ? cfg.baseFeeCents / 100 : 350).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          <td className="py-3 px-3 font-semibold text-slate-700">
                            {cfg?.maxCharacters || 25} chars
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1 max-w-[140px]">
                              {(cfg?.allowedPositions || ['CAP', 'BARREL', 'CLIP']).map((pos) => (
                                <span
                                  key={pos}
                                  className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-[#0066CC] border border-blue-100"
                                >
                                  {pos}
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            {cfg?.bulkRules && cfg.bulkRules.length > 0 ? (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                {cfg.bulkRules.length} Tiers (from {formatLKR(cfg.bulkRules[cfg.bulkRules.length - 1].feeCents)})
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">Standard</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/customize-pen?product=${pen.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-slate-400 hover:text-[#0066CC] rounded-lg hover:bg-slate-100 transition-colors"
                                title="Live Preview"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleStartCalibration(pen)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                                title="Calibrate 2D Engraving Zones"
                              >
                                <Crosshair className="w-3.5 h-3.5 text-amber-700" />
                                <span>Calibrate</span>
                              </button>
                              <Link
                                href={`/admin/products/${pen.id}/edit`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#08275E] hover:bg-[#0066CC] text-white text-xs font-bold transition-all shadow-2xs"
                              >
                                <Edit className="w-3 h-3" />
                                <span>Configure</span>
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomization(pen)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Remove from Customization Studio"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SOLD INVOICES & ENGRAVING WORK ORDERS */}
      {/* ========================================================================= */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search orders by Order #, customer name, phone, or engraving text..."
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#08275E]"
              />
            </div>

            <span className="text-xs font-bold text-slate-500">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'Work Order' : 'Work Orders'}
            </span>
          </div>

          {/* Orders Listing */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            {isLoadingOrders ? (
              <div className="py-20 text-center space-y-2">
                <RotateCcw className="w-6 h-6 animate-spin mx-auto text-[#08275E]" />
                <p className="text-xs font-medium text-slate-500">Loading sold customization orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-20 text-center space-y-3 px-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No sold customization orders found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Orders placed by customers containing custom laser engraved pens will appear here ready for invoice generation and engraving execution.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Order / Invoice Ref</th>
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3">Date Placed</th>
                      <th className="py-3 px-3">Engraving Specifications</th>
                      <th className="py-3 px-3 text-right">Order Total</th>
                      <th className="py-3 px-3">Payment</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((order) => {
                      const customizedLines = (order.items || []).filter((i: any) => Boolean(i.customization));

                      return (
                        <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <span className="font-mono font-black text-sm text-[#08275E] block">
                              #{order.orderNumber}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400 block">
                              INV-{new Date(order.createdAt).getFullYear()}-{order.orderNumber}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 block">
                              {order.shippingAddress?.fullName || 'Customer'}
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              {order.shippingAddress?.phone}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-slate-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>

                          <td className="py-3 px-3">
                            <div className="space-y-1">
                              {customizedLines.map((line: any, idx: number) => (
                                <div key={idx} className="p-1.5 bg-blue-50/80 rounded-lg border border-blue-200/80 text-[11px] space-y-0.5">
                                  <div className="flex items-center gap-1 font-bold text-[#08275E]">
                                    <PenTool className="w-3 h-3 text-[#0066CC] shrink-0" />
                                    <span>&ldquo;{line.customization?.engravingText}&rdquo;</span>
                                  </div>
                                  <div className="text-[10px] text-slate-600 flex gap-2">
                                    <span>Model: <strong>{line.productName || line.product?.name}</strong></span>
                                    <span>Pos: <strong>{line.customization?.position}</strong></span>
                                    <span>Font: <strong>{line.customization?.font}</strong></span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-right font-black text-slate-900">
                            {formatLKR(order.totalCents)}
                          </td>

                          <td className="py-3 px-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              order.paymentStatus === 'PAID' || order.paymentStatus === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {order.paymentStatus}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedInvoiceOrder(order)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0066CC] hover:bg-[#0052a3] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                                title="Print Sold Invoice & Engraving Work Order"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Sold Invoice</span>
                              </button>

                              <Link
                                href={`/admin/orders/${order.id}`}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                                title="View Order Management Details"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD PEN MODEL TO CUSTOMIZATION STUDIO */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-[#08275E] text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                  <PenTool className="w-4 h-4 text-[#FFD21C]" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Add Customizable Pen Model</h3>
                  <p className="text-[11px] text-slate-300">Enroll new or existing pens into the laser engraving studio</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePenModel} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs">
              {addModalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addModalError}</span>
                </div>
              )}

              {/* Mode Selection */}
              <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setAddMode('catalog')}
                  className={`flex-1 py-2 font-bold rounded-lg transition-all ${
                    addMode === 'catalog'
                      ? 'bg-white text-[#08275E] shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Option A: Enroll Existing Catalogue Pen ({catalogPens.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode('new')}
                  className={`flex-1 py-2 font-bold rounded-lg transition-all ${
                    addMode === 'new'
                      ? 'bg-white text-[#08275E] shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Option B: Create New Pen From Scratch
                </button>
              </div>

              {/* MODE A: Select from existing */}
              {addMode === 'catalog' ? (
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="font-bold text-slate-700 block">
                    Select Pen from Catalogue
                  </label>
                  {catalogPens.length === 0 ? (
                    <p className="text-slate-400 italic">All current catalogue pens are already enrolled.</p>
                  ) : (
                    <select
                      value={selectedCatalogPenId}
                      onChange={(e) => setSelectedCatalogPenId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none"
                    >
                      {catalogPens.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) - {formatLKR(p.priceCents)}
                        </option>
                      ))}
                    </select>
                  )}

                  {selectedCatalogPen && (
                    <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200 mt-2">
                      <ProductThumbnail
                        src={selectedCatalogPen.images?.[0]}
                        alt={selectedCatalogPen.name}
                        brandName={selectedCatalogPen.brandName}
                        className="w-12 h-12 rounded-lg shrink-0"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">{selectedCatalogPen.name}</span>
                        <span className="text-[11px] text-slate-500">
                          SKU: {selectedCatalogPen.sku} • Price: {formatLKR(selectedCatalogPen.priceCents)} • Stock: {selectedCatalogPen.stockQuantity}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* MODE B: Create brand new pen model */
                <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    New Pen Model Specifications
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Model Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Speed Executive Gel Pen 0.7mm"
                        value={newPenName}
                        onChange={(e) => setNewPenName(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">SKU</label>
                      <input
                        type="text"
                        placeholder="e.g. DSL-SPD-EXEC-07"
                        value={newPenSku}
                        onChange={(e) => setNewPenSku(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono uppercase"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Base Price (Rs.) *</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="450"
                        value={newPenPriceRupees}
                        onChange={(e) => setNewPenPriceRupees(e.target.value ? Number(e.target.value) : '')}
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Initial Stock Count *</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="50"
                        value={newPenStock}
                        onChange={(e) => setNewPenStock(e.target.value ? Number(e.target.value) : '')}
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-700 block">
                          Pen Product Image
                        </label>
                        <span className="text-[11px] text-slate-400">Upload photo or select gallery preset</span>
                      </div>

                      {/* Visual Upload & Preview Zone */}
                      <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 bg-white border border-dashed border-slate-300 rounded-2xl hover:border-[#0066CC] transition-colors">
                        {/* Thumbnail Preview */}
                        <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative">
                          {newPenImage ? (
                            <img
                              src={resolveImageUrl(newPenImage)}
                              alt="Pen preview"
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <PenTool className="w-8 h-8 text-slate-300" />
                          )}
                          {isUploadingImage && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Loader2 className="w-5 h-5 text-white animate-spin" />
                            </div>
                          )}
                        </div>

                        {/* File Upload Button & Status */}
                        <div className="flex-1 space-y-1.5 text-center sm:text-left">
                          <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#08275E] hover:bg-[#0066CC] text-white text-xs font-bold transition-all shadow-xs cursor-pointer">
                              <Upload className="w-3.5 h-3.5" />
                              <span>{isUploadingImage ? 'Uploading Image...' : 'Choose Pen Photo'}</span>
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={handleImageFileUpload}
                                disabled={isUploadingImage}
                                className="hidden"
                              />
                            </label>
                            {newPenImage && (
                              <button
                                type="button"
                                onClick={() => setNewPenImage('')}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 text-[11px] font-semibold transition-colors"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400">
                            PNG, JPG or WebP up to 5MB (transparent PNG recommended for engraving preview)
                          </p>
                        </div>
                      </div>

                      {/* Quick Sign Pen Presets */}
                      <div className="pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Quick Sign Pen Presets:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { label: 'Blue Sign Pen', url: '/products/speed-rim-blue.png' },
                            { label: 'Black Sign Pen', url: '/products/speed-rim-black.png' },
                            { label: 'Glitter Gel Pen', url: '/products/linc-shine-glitter.png' },
                          ].map((preset) => (
                            <button
                              key={preset.url}
                              type="button"
                              onClick={() => setNewPenImage(preset.url)}
                              className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                newPenImage === preset.url
                                  ? 'bg-blue-50 border-blue-300 text-[#0066CC] font-bold'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Optional URL Field for Advanced Users */}
                      <details className="text-[11px] text-slate-500 pt-1">
                        <summary className="cursor-pointer hover:text-slate-800 font-medium select-none">
                          Or enter custom image URL directly
                        </summary>
                        <input
                          type="text"
                          placeholder="/products/your-pen.png or https://..."
                          value={newPenImage}
                          onChange={(e) => setNewPenImage(e.target.value)}
                          className="w-full mt-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                        />
                      </details>
                    </div>
                  </div>
                </div>
              )}

              {/* Customization Rules Configuration */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-[#0066CC]" />
                  <span>Customization &amp; Engraving Rules</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Base Engraving Fee (Rs.)</label>
                    <input
                      type="number"
                      min="0"
                      value={modalBaseFeeRupees}
                      onChange={(e) => setModalBaseFeeRupees(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Max Character Limit</label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      value={modalMaxCharacters}
                      onChange={(e) => setModalMaxCharacters(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                </div>

                {/* Positions */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Supported Positions</label>
                  <div className="flex gap-2">
                    {['CAP', 'BARREL', 'CLIP'].map((pos) => {
                      const checked = modalAllowedPositions.includes(pos);
                      return (
                        <label
                          key={pos}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border cursor-pointer font-bold ${
                            checked
                              ? 'bg-blue-50 border-[#0066CC] text-[#0066CC]'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              if (checked && modalAllowedPositions.length > 1) {
                                setModalAllowedPositions(modalAllowedPositions.filter((p) => p !== pos));
                              } else {
                                setModalAllowedPositions([...modalAllowedPositions, pos]);
                              }
                            }}
                            className="rounded text-[#0066CC]"
                          />
                          <span>{pos}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Fonts */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Supported Fonts</label>
                  <div className="flex flex-wrap gap-2">
                    {['Arial', 'Times New Roman', 'Italic', 'Calibri', 'Script'].map((font) => {
                      const checked = modalAllowedFonts.includes(font);
                      return (
                        <label
                          key={font}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border cursor-pointer font-bold ${
                            checked
                              ? 'bg-blue-50 border-[#0066CC] text-[#0066CC]'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              if (checked && modalAllowedFonts.length > 1) {
                                setModalAllowedFonts(modalAllowedFonts.filter((f) => f !== font));
                              } else {
                                setModalAllowedFonts([...modalAllowedFonts, font]);
                              }
                            }}
                            className="rounded text-[#0066CC]"
                          />
                          <span>{font}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPen}
                  className="px-5 py-2 bg-[#0066CC] hover:bg-[#0052a3] text-white rounded-xl font-bold shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingPen ? 'Enrolling Pen...' : 'Save & Enroll Pen Model'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SOLD INVOICE & WORK ORDER VIEWER */}
      {/* ========================================================================= */}
      {selectedInvoiceOrder && (
        <OrderInvoiceModal
          order={selectedInvoiceOrder}
          isOpen={Boolean(selectedInvoiceOrder)}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: VISUAL ENGRAVING CALIBRATION STUDIO */}
      {/* ========================================================================= */}
      {calibratingPen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-5xl bg-[#090B10] text-white rounded-3xl shadow-2xl border border-white/20 overflow-hidden my-4 flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.03]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center">
                  <Crosshair className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Engraving Zone Calibration:</span>
                    <span className="text-amber-300">{calibratingPen.name}</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    SKU: {calibratingPen.sku} &bull; Stored in PostgreSQL ProductCustomizationConfig.previewConfig
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCalibratingPen(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Calibration Body */}
            <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
              {/* Left Column: Visual Canvas */}
              <div className="lg:col-span-7 flex flex-col items-center justify-center bg-black/70 rounded-2xl border border-white/10 p-6 min-h-[360px] relative overflow-hidden">
                <div className="absolute top-3 left-4 flex items-center gap-2 text-[10px] font-mono text-slate-400 tracking-wider uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Interactive Optical Calibrator (1:1 Ratio)</span>
                </div>

                {/* Main Pen Image with Live Calibrated Bounding Box */}
                <div className="relative w-full aspect-[707/110] flex items-center justify-center my-auto">
                  <img
                    src={
                      calibratingPen.images && calibratingPen.images.length > 0
                        ? resolveImageUrl(calibratingPen.images[0])
                        : '/images/luxury-pen-clean-barrel-silver.png'
                    }
                    alt={calibratingPen.name}
                    draggable={false}
                    className="w-full h-auto object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.95)] select-none"
                  />

                  {/* Active Bounding Box Reticle */}
                  {(() => {
                    const zone = activeZoneCoordinates[calibrationPosition] || {
                      left: 45.5,
                      top: 48.5,
                      width: 25,
                      height: 9,
                      rotation: 0,
                      textAlign: 'center',
                      fontScale: 1.0,
                    };

                    const textLen = Math.max(1, calibrationText.trim().length);
                    let scale = textLen <= 6 ? 1.15 : textLen <= 10 ? 1.0 : textLen <= 15 ? 0.88 : textLen <= 20 ? 0.74 : 0.62;
                    scale *= zone.fontScale || 1.0;

                    return (
                      <>
                        <div
                          style={{
                            left: `${zone.left}%`,
                            top: `${zone.top}%`,
                            width: `${zone.width}%`,
                            height: `${zone.height}%`,
                            transform: `translate(-50%, -50%) rotate(${zone.rotation}deg)`,
                          }}
                          className="absolute rounded border-2 border-dashed border-amber-400 bg-amber-400/10 pointer-events-none flex items-center justify-center transition-all duration-75 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                        >
                          {/* Crosshair corners */}
                          <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-300" />
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-300" />
                          <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-amber-300" />
                          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-amber-300" />

                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-amber-500 text-black text-[9px] font-mono font-bold px-2 py-0.5 rounded shadow-sm">
                            {calibrationPosition} ZONE ({zone.left.toFixed(1)}%, {zone.top.toFixed(1)}%)
                          </div>
                        </div>

                        {/* Test Engraved Text */}
                        <div
                          style={{
                            left: `${zone.left}%`,
                            top: `${zone.top}%`,
                            width: `${zone.width}%`,
                            height: `${zone.height}%`,
                            transform: `translate(-50%, -50%) rotate(${zone.rotation}deg)`,
                          }}
                          className="absolute pointer-events-none flex items-center justify-center text-center overflow-hidden px-1"
                        >
                          <span
                            style={{
                              fontFamily:
                                calibrationFont === 'Script'
                                  ? '"Dancing Script", cursive'
                                  : calibrationFont === 'Serif'
                                  ? '"Playfair Display", serif'
                                  : calibrationFont === 'Monospace'
                                  ? '"JetBrains Mono", monospace'
                                  : 'Arial, sans-serif',
                              fontStyle: calibrationFont === 'Italic' ? 'italic' : 'normal',
                              fontWeight: calibrationFont === 'Script' ? 700 : 600,
                              background:
                                calibrationFoil === 'gold'
                                  ? 'linear-gradient(180deg, #FFF9D9 0%, #F5D77F 22%, #D4AF37 48%, #A87618 78%, #78520C 100%)'
                                  : calibrationFoil === 'silver'
                                  ? 'linear-gradient(180deg, #FFFFFF 0%, #CBD5E1 50%, #64748B 100%)'
                                  : calibrationFoil === 'black'
                                  ? 'linear-gradient(180deg, #1E293B 0%, #0F172A 60%, #020617 100%)'
                                  : '#FFFFFF',
                              WebkitBackgroundClip: calibrationFoil !== 'white' ? 'text' : undefined,
                              WebkitTextFillColor: calibrationFoil !== 'white' ? 'transparent' : '#FFFFFF',
                              filter: 'drop-shadow(0 0.5px 0.5px rgba(0, 0, 0, 0.95))',
                              transform: `scale(${scale})`,
                              transformOrigin: 'center center',
                              display: 'inline-block',
                              whiteSpace: 'nowrap',
                            }}
                            className="text-xs sm:text-sm font-bold tracking-wide"
                          >
                            {calibrationText || 'Sample Name'}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="w-full flex items-center justify-between pt-4 border-t border-white/10 text-[11px] font-mono text-slate-400 mt-2">
                  <span>Aspect: 707 &times; 110</span>
                  <span>Center Target Anchor: (50%, 50%)</span>
                </div>
              </div>

              {/* Right Column: Calibration Controls */}
              <div className="lg:col-span-5 space-y-4 text-xs">
                {/* Zone Selector Tabs */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    1. Select Zone to Calibrate
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['BARREL', 'CAP', 'CLIP'] as const).map((pos) => {
                      const isActive = calibrationPosition === pos;
                      return (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => setCalibrationPosition(pos)}
                          className={`py-2 px-3 rounded-xl font-bold tracking-wider text-xs transition-all cursor-pointer ${
                            isActive
                              ? 'bg-amber-400 text-black shadow-md shadow-amber-500/20'
                              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/10'
                          }`}
                        >
                          {pos}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Coordinate Sliders */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">Zone Coordinates: {calibrationPosition}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const defaults = {
                          BARREL: { left: 45.5, top: 48.5, width: 25.0, height: 9.0, rotation: 0, textAlign: 'center' as const, fontScale: 1.0 },
                          CAP: { left: 74.0, top: 48.5, width: 20.0, height: 9.0, rotation: 0, textAlign: 'center' as const, fontScale: 0.95 },
                          CLIP: { left: 74.0, top: 24.0, width: 17.0, height: 8.0, rotation: 0, textAlign: 'center' as const, fontScale: 0.85 },
                        };
                        setActiveZoneCoordinates((prev) => ({
                          ...prev,
                          [calibrationPosition]: defaults[calibrationPosition],
                        }));
                      }}
                      className="text-[10px] text-amber-300 hover:underline cursor-pointer"
                    >
                      Reset {calibrationPosition} Defaults
                    </button>
                  </div>

                  {(() => {
                    const current = activeZoneCoordinates[calibrationPosition] || {
                      left: 45.5,
                      top: 48.5,
                      width: 25,
                      height: 9,
                      rotation: 0,
                      textAlign: 'center',
                      fontScale: 1.0,
                    };

                    const updateField = (field: string, val: any) => {
                      setActiveZoneCoordinates((prev) => ({
                        ...prev,
                        [calibrationPosition]: {
                          ...prev[calibrationPosition],
                          [field]: val,
                        },
                      }));
                    };

                    return (
                      <div className="space-y-3 font-mono text-[11px]">
                        {/* Horizontal Position */}
                        <div>
                          <div className="flex justify-between text-slate-400 mb-1">
                            <span>Horizontal Center (Left):</span>
                            <span className="text-white font-bold">{current.left.toFixed(1)}%</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="90"
                            step="0.5"
                            value={current.left}
                            onChange={(e) => updateField('left', parseFloat(e.target.value))}
                            className="w-full accent-amber-400 cursor-pointer"
                          />
                        </div>

                        {/* Vertical Position */}
                        <div>
                          <div className="flex justify-between text-slate-400 mb-1">
                            <span>Vertical Center (Top):</span>
                            <span className="text-white font-bold">{current.top.toFixed(1)}%</span>
                          </div>
                          <input
                            type="range"
                            min="15"
                            max="85"
                            step="0.5"
                            value={current.top}
                            onChange={(e) => updateField('top', parseFloat(e.target.value))}
                            className="w-full accent-amber-400 cursor-pointer"
                          />
                        </div>

                        {/* Width */}
                        <div>
                          <div className="flex justify-between text-slate-400 mb-1">
                            <span>Engraving Width:</span>
                            <span className="text-white font-bold">{current.width.toFixed(1)}%</span>
                          </div>
                          <input
                            type="range"
                            min="8"
                            max="50"
                            step="0.5"
                            value={current.width}
                            onChange={(e) => updateField('width', parseFloat(e.target.value))}
                            className="w-full accent-amber-400 cursor-pointer"
                          />
                        </div>

                        {/* Height */}
                        <div>
                          <div className="flex justify-between text-slate-400 mb-1">
                            <span>Engraving Height:</span>
                            <span className="text-white font-bold">{current.height.toFixed(1)}%</span>
                          </div>
                          <input
                            type="range"
                            min="4"
                            max="25"
                            step="0.5"
                            value={current.height}
                            onChange={(e) => updateField('height', parseFloat(e.target.value))}
                            className="w-full accent-amber-400 cursor-pointer"
                          />
                        </div>

                        {/* Rotation */}
                        <div>
                          <div className="flex justify-between text-slate-400 mb-1">
                            <span>Rotation Angle:</span>
                            <span className="text-white font-bold">{current.rotation}&deg;</span>
                          </div>
                          <input
                            type="range"
                            min="-25"
                            max="25"
                            step="1"
                            value={current.rotation}
                            onChange={(e) => updateField('rotation', parseInt(e.target.value, 10))}
                            className="w-full accent-amber-400 cursor-pointer"
                          />
                        </div>

                        {/* Font Scale Multiplier */}
                        <div>
                          <div className="flex justify-between text-slate-400 mb-1">
                            <span>Font Sizing Scale:</span>
                            <span className="text-white font-bold">{(current.fontScale * 100).toFixed(0)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.6"
                            max="1.4"
                            step="0.05"
                            value={current.fontScale}
                            onChange={(e) => updateField('fontScale', parseFloat(e.target.value))}
                            className="w-full accent-amber-400 cursor-pointer"
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Sample Test Text & Chips */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    2. Test Engraving Text
                  </label>
                  <input
                    type="text"
                    value={calibrationText}
                    onChange={(e) => setCalibrationText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-white text-xs font-sans"
                    placeholder="Enter test text..."
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {['Alex', 'Yehara', 'Yehara Nethmi', 'Christopher Alexander', 'ABCDEFGHIJKLMNOPQRSTUVWXY'].map(
                      (name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setCalibrationText(name)}
                          className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 hover:bg-white/15 text-slate-300 border border-white/10 cursor-pointer"
                        >
                          {name}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Font & Foil Testing Pickers */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                      Typography
                    </label>
                    <select
                      value={calibrationFont}
                      onChange={(e) => setCalibrationFont(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-black/60 border border-white/20 text-xs text-white"
                    >
                      <option value="Serif">Serif / Times</option>
                      <option value="Script">Script / Cursive</option>
                      <option value="SANS">SANS / Arial</option>
                      <option value="Italic">Italic / Georgia</option>
                      <option value="Monospace">Monospace</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                      Foil Finish
                    </label>
                    <select
                      value={calibrationFoil}
                      onChange={(e) => setCalibrationFoil(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-black/60 border border-white/20 text-xs text-white"
                    >
                      <option value="gold">24K Gold Foil</option>
                      <option value="silver">Liquid Silver Foil</option>
                      <option value="white">Diamond White</option>
                      <option value="black">Obsidian Noir</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 px-6 border-t border-white/10 bg-white/[0.02]">
              <span className="text-xs text-slate-400 font-mono">
                {calibrationSavedToast ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Calibration saved to database successfully!
                  </span>
                ) : (
                  'Changes will immediately take effect in the customer atelier.'
                )}
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCalibratingPen(null)}
                  className="px-4 py-2 border border-white/20 text-slate-300 hover:text-white rounded-xl font-bold cursor-pointer hover:bg-white/5"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handleSaveCalibration}
                  disabled={isSavingCalibration}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingCalibration ? 'Saving Calibration...' : 'Save Zone Coordinates'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCustomizePenPage() {
  return (
    <AdminPageAccess permission="products.view" pageTitle="Pen Customization">
      <AdminCustomizePenContent />
    </AdminPageAccess>
  );
}
