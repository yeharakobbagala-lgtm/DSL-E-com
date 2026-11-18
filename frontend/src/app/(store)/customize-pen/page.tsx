'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PenTool,
  Check,
  ShoppingBag,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  AlertCircle,
  Tag,
  Plus,
  Minus,
  Award,
  Sliders,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { productService } from '@/services/productService';
import { Product, ProductVariant } from '@/types/product';
import { formatLKR } from '@/lib/currency';
import { useCartStore } from '@/services/cartStore';
import { PenLivePreview } from '@/components/customization/PenLivePreview';

// Flagship Bespoke Pen for the Atelier
const SOVEREIGN_FLAGSHIP_PEN: Product = {
  id: 'prod-dsl-sovereign',
  name: 'Sovereign Horological Masterpiece Pen',
  slug: 'dsl-sovereign-masterpiece',
  sku: 'DSL-SOV-001',
  description:
    'Hand-finished luxury writing instrument forged from high-density jeweler brass with diamond-cut guilloché fluting and balanced center of gravity. Precision personalized in our Colombo atelier.',
  shortDescription: 'Hand-finished porcelain white & liquid silver horological bespoke writing instrument.',
  priceCents: 245000, // Rs. 2,450.00
  images: ['/images/luxury-pen-clean-barrel-white.png'],
  categoryId: 'cat-pens',
  categoryName: 'Luxury Pens',
  brandId: 'brand-dsl',
  brandName: 'DSL Atelier',
  stockQuantity: 50,
  lowStockThreshold: 5,
  isActive: true,
  isFeatured: true,
  tags: ['luxury', 'pen', 'customizable', 'bespoke', 'atelier'],
  rating: 5.0,
  reviewCount: 42,
  specifications: {
    Material: 'Solid Jeweler Brass',
    Finish: 'Porcelain White Lacquer & Silver Guilloché',
    Nib: '0.7mm Tungsten Carbide Ball',
    Ink: 'German Document-Proof Blue',
  },
  createdAt: '2026-01-01',
  updatedAt: '2026-11-18',
  variants: [
    {
      id: 'var-sov-white',
      sku: 'DSL-SOV-WHT',
      name: 'Pure Carrara White & Platinum Chrome',
      priceCents: 245000,
      stockQuantity: 30,
      attributes: { finish: 'Pure White' },
      isActive: true,
    },
    {
      id: 'var-sov-silver',
      sku: 'DSL-SOV-SLV',
      name: 'Liquid Sterling Silver & Chrome',
      priceCents: 245000,
      stockQuantity: 25,
      attributes: { finish: 'Silver Chrome' },
      isActive: true,
    },
    {
      id: 'var-sov-stealth',
      sku: 'DSL-SOV-STL',
      name: 'Titanium Obsidian Stealth Noir',
      priceCents: 265000,
      stockQuantity: 15,
      attributes: { finish: 'Stealth Noir' },
      isActive: true,
    },
    {
      id: 'var-sov-gold',
      sku: 'DSL-SOV-GLD',
      name: '24K Imperial Gold & Obsidian Noir',
      priceCents: 245000,
      stockQuantity: 20,
      attributes: { finish: '24K Gold' },
      isActive: true,
    },
  ],
  customizationConfig: {
    isCustomizable: true,
    maxCharacters: 24,
    baseFeeCents: 35000, // Rs. 350.00
    allowedPositions: ['BARREL', 'CAP', 'CLIP'],
    allowedFonts: ['Serif', 'Script', 'SANS', 'Italic', 'Monospace'],
    bulkRules: [
      { minQuantity: 5, feeCents: 25000 },
      { minQuantity: 20, feeCents: 15000 },
      { minQuantity: 50, feeCents: 10000 },
    ],
  },
};

function CustomizePenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productParam = searchParams.get('product');

  const [pens, setPens] = useState<Product[]>([SOVEREIGN_FLAGSHIP_PEN]);
  const [selectedProduct, setSelectedProduct] = useState<Product>(SOVEREIGN_FLAGSHIP_PEN);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    SOVEREIGN_FLAGSHIP_PEN.variants?.[0] || null
  );
  const [engravingText, setEngravingText] = useState('Kasun Perera');
  const [selectedPosition, setSelectedPosition] = useState('BARREL');
  const [selectedFont, setSelectedFont] = useState('Serif');
  const [foilColor, setFoilColor] = useState<'white' | 'silver' | 'gold' | 'black'>('white');
  const [chassisFinish, setChassisFinish] = useState<'white' | 'silver' | 'stealth' | 'gold'>('white');
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const addItem = useCartStore((state) => state.addItem);
  const setDrawerOpen = useCartStore((state) => state.setDrawerOpen);

  // Fetch authentic customizable pens from real backend API
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    productService
      .fetchCustomizablePens()
      .then((items) => {
        if (!isMounted) return;
        const validItems = items || [];
        const filtered = validItems.filter((p) => p.id !== SOVEREIGN_FLAGSHIP_PEN.id);
        const combined = [SOVEREIGN_FLAGSHIP_PEN, ...filtered];
        setPens(combined);

        // Pre-select if query param exists
        if (productParam) {
          const matched = combined.find(
            (p) => p.slug === productParam || p.id === productParam || p.sku === productParam
          );
          if (matched) {
            handleProductSelect(matched);
            return;
          }
        }
      })
      .catch((err) => {
        console.warn('Error fetching customizable pens:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [productParam]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    const activeVars = (product.variants || []).filter((v) => v.isActive);
    setSelectedVariant(activeVars.length > 0 ? activeVars[0] : null);

    const cfg = product.customizationConfig;
    if (cfg) {
      if (cfg.allowedPositions && !cfg.allowedPositions.includes(selectedPosition)) {
        setSelectedPosition(cfg.allowedPositions[0]);
      }
      if (cfg.allowedFonts && !cfg.allowedFonts.includes(selectedFont)) {
        setSelectedFont(cfg.allowedFonts[0]);
      }
    }
    setErrorMessage(null);
  };

  const handleChassisChange = (finish: 'white' | 'silver' | 'stealth' | 'gold') => {
    setChassisFinish(finish);
    if (finish === 'white') {
      setFoilColor('white');
      if (selectedProduct?.variants?.[0]) setSelectedVariant(selectedProduct.variants[0]);
    } else if (finish === 'silver') {
      setFoilColor('silver');
      if (selectedProduct?.variants?.[1]) setSelectedVariant(selectedProduct.variants[1]);
    } else if (finish === 'stealth') {
      setFoilColor('white');
      if (selectedProduct?.variants?.[2]) setSelectedVariant(selectedProduct.variants[2]);
    } else {
      setFoilColor('gold');
      if (selectedProduct?.variants?.[3]) setSelectedVariant(selectedProduct.variants[3]);
    }
  };

  const config = selectedProduct?.customizationConfig;
  const maxCharacters = config?.maxCharacters ?? 24;
  const charsRemaining = maxCharacters - engravingText.length;

  const allowedPositions = useMemo(() => {
    return config?.allowedPositions && config.allowedPositions.length > 0
      ? config.allowedPositions
      : ['BARREL', 'CAP', 'CLIP'];
  }, [config]);

  const allowedFonts = useMemo(() => {
    return config?.allowedFonts && config.allowedFonts.length > 0
      ? config.allowedFonts
      : ['Serif', 'Script', 'SANS', 'Italic', 'Monospace'];
  }, [config]);

  // Pricing calculations
  const baseUnitPriceCents = selectedVariant
    ? selectedVariant.priceCents
    : selectedProduct?.priceCents ?? 0;

  const engravingFeePerUnitCents = useMemo(() => {
    const baseFee = config?.baseFeeCents ?? 35000;
    const bulkRules = Array.isArray(config?.bulkRules) ? config.bulkRules : [];
    const sorted = [...bulkRules].sort((a, b) => (b.minQuantity || 0) - (a.minQuantity || 0));
    for (const rule of sorted) {
      if (quantity >= rule.minQuantity) {
        return rule.feeCents ?? baseFee;
      }
    }
    return baseFee;
  }, [config, quantity]);

  const totalUnitPriceCents = baseUnitPriceCents + engravingFeePerUnitCents;
  const subtotalCents = totalUnitPriceCents * quantity;

  const activeDiscountNotice = useMemo(() => {
    if (!config?.bulkRules || config.bulkRules.length === 0) return null;
    const baseFee = config.baseFeeCents ?? 35000;
    if (engravingFeePerUnitCents < baseFee) {
      const savedPerUnit = baseFee - engravingFeePerUnitCents;
      return `Atelier Bulk Tier Applied: You save ${formatLKR(savedPerUnit * quantity)} on laser engraving.`;
    }
    const nextTier = config.bulkRules.find((r) => r.minQuantity > quantity);
    if (nextTier) {
      return `Bespoke Corporate Tier: Order ${nextTier.minQuantity}+ pens for ${formatLKR(nextTier.feeCents)} laser engraving!`;
    }
    return null;
  }, [config, quantity, engravingFeePerUnitCents]);

  const handleAddToCart = async () => {
    if (!selectedProduct) return;
    const trimmed = engravingText.trim();
    if (!trimmed) {
      setErrorMessage('Please enter the name, monogram, or inscription to engrave.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const customizationPayload = {
      engravingText: trimmed,
      font: selectedFont,
      position: selectedPosition,
      foilColor,
      chassisFinish,
      customizationFeeCents: engravingFeePerUnitCents,
      baseUnitPriceCents,
    };

    try {
      const success = await addItem(
        selectedProduct,
        quantity,
        selectedVariant || undefined,
        undefined,
        customizationPayload
      );

      if (success) {
        setAddedSuccess(true);
        setTimeout(() => setAddedSuccess(false), 2800);
        setDrawerOpen(true);
      } else {
        setErrorMessage('Could not complete atelier reservation. Please check stock availability.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to add customized pen to order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#060709] py-12 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin shadow-[0_0_20px_#FFFFFF]" />
      </div>
    );
  }

  if (pens.length === 0 || !selectedProduct) {
    return (
      <div className="min-h-screen bg-[#060709] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-white/[0.04] border border-white/20 flex items-center justify-center text-white mb-6 shadow-[0_0_30px_rgba(255,255,255,0.15)]">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-serif text-white mb-3">Customization Studio Updating</h1>
        <p className="text-slate-400 max-w-md text-sm mb-8 font-light">
          We are currently preparing our bespoke engraving catalog. Please check back shortly or explore our writing instruments collection.
        </p>
        <Link
          href="/shop"
          className="px-6 py-3 rounded-full bg-white hover:bg-slate-100 text-black font-semibold text-sm hover:shadow-[0_0_25px_rgba(255,255,255,0.4)] transition-all"
        >
          Explore Stationery
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060709] text-white selection:bg-white selection:text-black select-none relative overflow-x-hidden pb-16">

      {/* ========================================================= */}
      {/* LUXURY BACKGROUND LIGHTING & LIQUID GLASS GLOW            */}
      {/* ========================================================= */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Soft Radial Pure White Flare Top Center */}
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[140px] opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 50%, transparent 80%)',
          }}
        />
        {/* Soft Liquid Chrome Flare Bottom Right */}
        <div
          className="absolute top-1/3 -right-20 w-[600px] h-[600px] rounded-full blur-[160px] opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
          }}
        />
        {/* Subtle grid texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 pt-6 sm:pt-10 space-y-8 sm:space-y-12">

        {/* ========================================================= */}
        {/* ATELIER TITLE HEADER & BREADCRUMBS                       */}
        {/* ========================================================= */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.08]">
          <div className="space-y-3">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-xs font-mono tracking-wider text-slate-400">
              <Link href="/home" className="hover:text-white transition-colors">
                DSL HOME
              </Link>
              <span>/</span>
              <Link href="/shop" className="hover:text-white transition-colors">
                COLLECTIONS
              </Link>
              <span>/</span>
              <span className="text-white font-bold">ATELIER BESPOKE</span>
            </nav>

            {/* Atelier Crest Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.12)] text-white text-xs font-serif tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>DSL Haute Écriture &bull; Precision Laser Atelier</span>
            </div>

            {/* Grand Luxury Typography */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif tracking-tight text-white leading-tight">
              {selectedProduct.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl font-light leading-relaxed">
              Precision Swiss-grade fiber laser personalization. Each writing instrument is individually engraved, inspected, and presented in a luxury velvet-lined gift case.
            </p>
          </div>

          {/* Luxury Atelier Badges */}
          <div className="flex items-center gap-3 shrink-0 bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-3.5 rounded-2xl shadow-xl">
            <div className="flex items-center gap-2 text-xs">
              <ShieldCheck className="w-4 h-4 text-white" />
              <span className="text-slate-200 font-medium">Bespoke Certified</span>
            </div>
            <div className="w-px h-4 bg-white/15" />
            <div className="flex items-center gap-2 text-xs">
              <Truck className="w-4 h-4 text-slate-300" />
              <span className="text-slate-200 font-medium">White-Glove Dispatch</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MAIN 2-COLUMN ATELIER STUDIO                             */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* LEFT COLUMN: LIVE OPTICAL PREVIEW & COLLECTION PICKER    */}
          <div className="lg:col-span-7 space-y-6 lg:sticky lg:top-24">

            {/* Live Visualizer on Liquid Glass Pedestal */}
            <PenLivePreview
              product={selectedProduct}
              variant={selectedVariant}
              engravingText={engravingText}
              font={selectedFont}
              position={selectedPosition}
              foilColor={foilColor}
              chassisFinish={chassisFinish}
              onChassisChange={handleChassisChange}
            />

            {/* ========================================================= */}
            {/* DEVIALET-STYLE HORIZONTAL COLLECTION CAROUSEL             */}
            {/* ========================================================= */}
            <div className="p-5 rounded-3xl backdrop-blur-2xl bg-white/[0.02] border border-white/10 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif tracking-widest text-white uppercase font-bold flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>The Atelier Collection ({pens.length} Models)</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">Select model to customize</span>
              </div>

              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {pens.map((pen) => {
                  const isSelected = selectedProduct.id === pen.id;
                  const thumb =
                    pen.id === 'prod-dsl-sovereign'
                      ? '/images/luxury-pen-clean-barrel-white.png'
                      : pen.images?.[0] || '/images/luxury-pen-clean-barrel-white.png';

                  return (
                    <button
                      key={pen.id}
                      type="button"
                      onClick={() => handleProductSelect(pen)}
                      className={`shrink-0 w-48 p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${isSelected
                          ? 'border-white bg-gradient-to-b from-white/20 to-white/[0.02] shadow-[0_0_25px_rgba(255,255,255,0.3)] ring-1 ring-white'
                          : 'border-white/10 bg-black/40 hover:border-white/20 hover:bg-white/[0.04]'
                        }`}
                    >
                      {/* Active Indicator Top Tag */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-mono font-bold text-white">
                          <Check className="w-3 h-3" />
                          <span>ACTIVE</span>
                        </div>
                      )}

                      <div className="w-full h-16 rounded-xl bg-black/60 border border-white/5 flex items-center justify-center p-2 mb-2.5 overflow-hidden">
                        <img
                          src={thumb}
                          alt={pen.name}
                          className="max-h-full max-w-full object-contain filter drop-shadow-md"
                        />
                      </div>

                      <p className="text-xs font-serif font-bold text-white truncate">{pen.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[11px] font-mono text-white font-bold">
                          {formatLKR(pen.priceCents)}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 uppercase">
                          {pen.brandName || 'DSL'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: LIQUID GLASS CONFIGURATION SLAB             */}
          <div className="lg:col-span-5 space-y-6 rounded-3xl p-6 sm:p-8 backdrop-blur-3xl bg-gradient-to-b from-white/[0.07] via-white/[0.03] to-white/[0.01] border border-white/15 shadow-[0_30px_70px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.2)]">

            {/* Atelier Specification Header */}
            <div className="pb-5 border-b border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-widest uppercase text-white bg-white/10 px-2.5 py-1 rounded-full border border-white/25">
                  Bespoke Specification
                </span>
                <span className="text-xs font-mono text-slate-400">
                  SKU: {selectedVariant?.sku || selectedProduct.sku}
                </span>
              </div>
              <h2 className="text-xl font-serif text-white tracking-wide">
                {selectedProduct.name}
              </h2>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-xs text-slate-400">Base Writing Instrument</span>
                <span className="text-lg font-mono font-bold text-white">
                  {formatLKR(baseUnitPriceCents)}
                </span>
              </div>
            </div>

            {/* Step 1: Chassis Metallurgy / Finish Selector */}
            {selectedProduct.id === 'prod-dsl-sovereign' && (
              <div className="space-y-2.5">
                <label className="text-xs font-serif tracking-wider text-slate-200 block uppercase">
                  1. Instrument Chassis Finish
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleChassisChange('white')}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${chassisFinish === 'white'
                        ? 'border-white bg-white/15 shadow-[0_0_15px_rgba(255,255,255,0.35)] ring-1 ring-white'
                        : 'border-white/10 bg-black/40 hover:border-white/20 text-slate-400'
                      }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-white mx-auto mb-1.5 shadow-sm border border-slate-300" />
                    <span className="text-[11px] font-bold block text-white">Pure White</span>
                    <span className="text-[9px] font-mono text-slate-400">Carrara Lacquer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChassisChange('silver')}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${chassisFinish === 'silver'
                        ? 'border-white bg-white/15 shadow-[0_0_15px_rgba(255,255,255,0.35)] ring-1 ring-white'
                        : 'border-white/10 bg-black/40 hover:border-white/20 text-slate-400'
                      }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#94A3B8] via-white to-[#E2E8F0] mx-auto mb-1.5 shadow-sm border border-slate-300/50" />
                    <span className="text-[11px] font-bold block text-white">Liquid Silver</span>
                    <span className="text-[9px] font-mono text-slate-400">Chrome Fluted</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChassisChange('stealth')}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${chassisFinish === 'stealth'
                        ? 'border-slate-400 bg-slate-800/80 shadow-[0_0_15px_rgba(0,0,0,0.6)] ring-1 ring-slate-400'
                        : 'border-white/10 bg-black/40 hover:border-white/20 text-slate-400'
                      }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-black via-slate-700 to-slate-900 mx-auto mb-1.5 shadow-sm border border-slate-600" />
                    <span className="text-[11px] font-bold block text-white">Stealth Noir</span>
                    <span className="text-[9px] font-mono text-slate-400">Dark Titanium</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChassisChange('gold')}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${chassisFinish === 'gold'
                        ? 'border-amber-300 bg-amber-500/15 shadow-[0_0_15px_rgba(255,215,0,0.3)] ring-1 ring-amber-300'
                        : 'border-white/10 bg-black/40 hover:border-white/20 text-slate-400'
                      }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#AA771C] via-[#FFE37A] to-[#D4AF37] mx-auto mb-1.5 shadow-sm border border-amber-300/40" />
                    <span className="text-[11px] font-bold block text-white">24K Gold</span>
                    <span className="text-[9px] font-mono text-slate-400">Obsidian Lacquer</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Custom Engraving Inscription Input */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-serif tracking-wider text-slate-200 flex items-center gap-2 uppercase">
                  <span>2. Custom Inscription</span>
                  <span className="text-white font-bold">*</span>
                </label>
                <span
                  className={`text-[11px] font-mono ${charsRemaining <= 3 ? 'text-rose-400' : 'text-white'
                    }`}
                >
                  {charsRemaining} / {maxCharacters} chars
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={engravingText}
                  onChange={(e) => {
                    if (e.target.value.length <= maxCharacters) {
                      setEngravingText(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }
                  }}
                  maxLength={maxCharacters}
                  placeholder="e.g. Kasun Perera or Managing Director"
                  className="w-full text-sm font-semibold px-4 py-3.5 rounded-2xl border border-white/15 bg-black/60 text-white placeholder-slate-500 focus:outline-hidden focus:border-white focus:ring-2 focus:ring-white/30 transition-all font-serif"
                />
                <PenTool className="w-4 h-4 text-white absolute right-4 top-4 pointer-events-none opacity-80" />
              </div>

              {/* Quick Inspiration Monogram Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-mono text-slate-400">Inspiration:</span>
                {['Kasun Perera', 'K.D.P.', 'CEO & Founder', 'Happy Birthday', 'Class of 2026'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setEngravingText(chip)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Laser Metal Foil Finish */}
            <div className="space-y-2.5">
              <label className="text-xs font-serif tracking-wider text-slate-200 block uppercase">
                3. Laser Inscription Metal Finish
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'white', name: 'Diamond White', color: 'from-white to-slate-200' },
                  { id: 'silver', name: 'Liquid Chrome', color: 'from-white to-[#94A3B8]' },
                  { id: 'black', name: 'Obsidian Noir', color: 'from-slate-800 to-black' },
                  { id: 'gold', name: '24K Gold Foil', color: 'from-[#D4AF37] to-[#AA771C]' },
                ].map((item) => {
                  const isSelected = foilColor === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFoilColor(item.id as any)}
                      className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${isSelected
                          ? 'border-white bg-white/15 shadow-[0_0_12px_rgba(255,255,255,0.3)] ring-1 ring-white'
                          : 'border-white/10 bg-black/40 hover:border-white/20 text-slate-400'
                        }`}
                    >
                      <span className={`w-3 h-3 rounded-full bg-gradient-to-tr ${item.color} mx-auto mb-1 block shadow-xs`} />
                      <span className="text-[11px] font-bold block text-white truncate">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Font Style Selection */}
            <div className="space-y-2.5">
              <label className="text-xs font-serif tracking-wider text-slate-200 block uppercase">
                4. Select Horological Typography
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {allowedFonts.map((fontName) => {
                  const isSelected = selectedFont === fontName;
                  let fontClass = 'font-serif';
                  if (fontName === 'Script') fontClass = 'italic font-serif';
                  if (fontName === 'SANS') fontClass = 'font-sans font-bold';
                  if (fontName === 'Monospace') fontClass = 'font-mono text-[10px]';

                  return (
                    <button
                      key={fontName}
                      type="button"
                      onClick={() => setSelectedFont(fontName)}
                      className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${isSelected
                          ? 'border-white bg-white/15 text-white shadow-[0_0_12px_rgba(255,255,255,0.25)] ring-1 ring-white'
                          : 'border-white/10 bg-black/40 text-slate-300 hover:border-white/25'
                        }`}
                    >
                      <span className={`text-xs block truncate ${fontClass}`}>{fontName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 5: Engraving Placement Zone */}
            <div className="space-y-2.5">
              <label className="text-xs font-serif tracking-wider text-slate-200 block uppercase">
                5. Engraving Position
              </label>
              <div className="grid grid-cols-3 gap-2">
                {allowedPositions.map((pos) => {
                  const isSelected = selectedPosition === pos;
                  const label =
                    pos === 'CAP' ? 'Pen Cap' : pos === 'CLIP' ? 'Pen Clip' : 'Center Barrel';
                  return (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setSelectedPosition(pos)}
                      className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${isSelected
                          ? 'border-white bg-white/15 text-white font-bold shadow-[0_0_12px_rgba(255,255,255,0.25)] ring-1 ring-white'
                          : 'border-white/10 bg-black/40 text-slate-400 hover:border-white/20'
                        }`}
                    >
                      <span className="text-xs block">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 6: Quantity & Price Breakdown (Liquid Glass Invoice) */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif tracking-wider text-slate-300 uppercase">
                  Order Quantity
                </span>
                <div className="flex items-center border border-white/20 rounded-xl bg-white/5">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="p-2 hover:bg-white/10 text-white disabled:opacity-30 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 font-mono font-bold text-xs text-white">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="p-2 hover:bg-white/10 text-white cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Price Calculation Lines */}
              <div className="space-y-1.5 pt-2 border-t border-white/10 text-xs text-slate-400 font-mono">
                <div className="flex justify-between">
                  <span>Base Writing Instrument:</span>
                  <span className="text-slate-200">
                    {formatLKR(baseUnitPriceCents)} × {quantity}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Fiber-Laser Personalization:</span>
                  <span className="text-white font-bold">
                    {formatLKR(engravingFeePerUnitCents)} × {quantity}
                  </span>
                </div>
                {activeDiscountNotice && (
                  <div className="text-[11px] font-sans font-bold text-white bg-white/10 p-2 rounded-xl border border-white/20 flex items-center gap-1.5 mt-1">
                    <Tag className="w-3.5 h-3.5 shrink-0 text-white" />
                    <span>{activeDiscountNotice}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-white/15 text-sm font-serif">
                  <span className="text-white font-bold">Total Atelier Amount:</span>
                  <span className="text-xl font-mono font-black text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                    {formatLKR(subtotalCents)}
                  </span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs font-medium text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* CTA Button */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isSubmitting}
                className={`w-full py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl ${isSubmitting
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : addedSuccess
                      ? 'bg-emerald-600 text-white shadow-emerald-900/40'
                      : 'bg-white hover:bg-slate-100 text-[#060709] shadow-[0_0_30px_rgba(255,255,255,0.45)] hover:shadow-[0_0_50px_rgba(255,255,255,0.7)] active:scale-[0.99]'
                  }`}
              >
                {addedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Customized Masterpiece Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Reserve Customized Pen &bull; {formatLKR(subtotalCents)}</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-center text-xs text-slate-400 font-mono">
                <RotateCcw className="w-3.5 h-3.5 text-white" />
                <span>Hand-inspected & dispatched within 24-48 hours.</span>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================= */}
        {/* CHRONOS / DEVIALET MONOCHROME LUXURY FOOTER               */}
        {/* ========================================================= */}
        <div className="pt-12 pb-6 border-t border-white/[0.08] grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-slate-400 font-mono">
          <div>
            <span className="text-white font-bold block mb-1 uppercase tracking-widest">
              Atelier Typography Standards
            </span>
            <p className="text-white font-serif text-sm">Aa Playfair Display (Imperial Serif Headings)</p>
            <p className="text-slate-300 font-sans text-xs">Aa Inter &amp; JetBrains Mono (Precision System)</p>
          </div>

          <div>
            <span className="text-white font-bold block mb-2 uppercase tracking-widest">
              Monochrome Horological Palette
            </span>
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-lg bg-[#060709] border border-white/20 shadow-xs" />
                <span className="text-[9px]">#060709 Noir</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-lg bg-[#12151D] border border-white/20 shadow-xs" />
                <span className="text-[9px]">#12151D Glass</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-lg bg-[#FFFFFF] border border-white/20 shadow-xs" />
                <span className="text-[9px]">#FFFFFF White</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-lg bg-[#E2E8F0] border border-white/20 shadow-xs" />
                <span className="text-[9px]">#E2E8F0 Silver</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-lg bg-[#64748B] border border-white/20 shadow-xs" />
                <span className="text-[9px]">#64748B Titanium</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function CustomizePenPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#060709] py-12 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin shadow-[0_0_20px_#FFFFFF]" />
        </div>
      }
    >
      <CustomizePenContent />
    </Suspense>
  );
}
