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
import { resolveImageUrl } from '@/lib/image';

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
    allowedFonts: ['SANS', 'Serif', 'Script', 'Italic', 'Monospace'],
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
  const [selectedFont, setSelectedFont] = useState('SANS');
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
      : ['SANS', 'Serif', 'Script', 'Italic', 'Monospace'];
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
      <div className="min-h-screen bg-white py-12 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (pens.length === 0 || !selectedProduct) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-black mb-6">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-3">Customization Studio Updating</h1>
        <p className="text-neutral-500 max-w-md text-sm mb-8 font-light">
          We are currently preparing our bespoke engraving catalog. Please check back shortly or explore our writing instruments collection.
        </p>
        <Link
          href="/shop"
          className="px-6 py-3 rounded-full bg-black hover:bg-neutral-800 text-white font-semibold text-sm transition-all"
        >
          Explore Stationery
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 selection:bg-black selection:text-white select-none relative overflow-x-hidden pb-20">

      <div className="relative z-10 max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 pt-6 sm:pt-10 space-y-8 sm:space-y-12">

        {/* ========================================================= */}
        {/* ATELIER TITLE HEADER & BREADCRUMBS                       */}
        {/* ========================================================= */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-neutral-200">
          <div className="space-y-3">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-xs font-mono tracking-wider text-neutral-500">
              <Link href="/home" className="hover:text-black transition-colors">
                DSL HOME
              </Link>
              <span>/</span>
              <Link href="/shop" className="hover:text-black transition-colors">
                COLLECTIONS
              </Link>
              <span>/</span>
              <span className="text-black font-bold">ATELIER BESPOKE</span>
            </nav>

            {/* Atelier Crest Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-900 text-xs font-bold tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>DSL Haute Écriture &bull; Precision Laser Atelier</span>
            </div>

            {/* Grand Luxury Typography */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-neutral-950 leading-tight">
              {selectedProduct.name}
            </h1>

            <p className="text-xs sm:text-sm text-neutral-600 max-w-2xl font-normal leading-relaxed">
              Precision Swiss-grade fiber laser personalization. Each writing instrument is individually engraved, inspected, and presented in a luxury velvet-lined gift case.
            </p>
          </div>

          {/* Luxury Atelier Badges */}
          <div className="flex items-center gap-3 shrink-0 bg-white border border-neutral-200 p-3.5 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2 text-xs">
              <ShieldCheck className="w-4 h-4 text-black" />
              <span className="text-neutral-900 font-semibold">Bespoke Certified</span>
            </div>
            <div className="w-px h-4 bg-neutral-200" />
            <div className="flex items-center gap-2 text-xs">
              <Truck className="w-4 h-4 text-neutral-700" />
              <span className="text-neutral-900 font-semibold">White-Glove Dispatch</span>
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
            <div className="p-5 rounded-3xl bg-white border border-neutral-200 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-widest text-neutral-900 uppercase flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>The Atelier Collection ({pens.length} Models)</span>
                </span>
                <span className="text-[11px] font-mono text-neutral-500">Select model to customize</span>
              </div>

              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {pens.map((pen) => {
                  const isSelected = selectedProduct.id === pen.id;
                  const thumb =
                    pen.id === 'prod-dsl-sovereign'
                      ? '/images/luxury-pen-clean-barrel-white.png'
                      : (pen.images?.[0] ? resolveImageUrl(pen.images[0]) : '/images/luxury-pen-clean-barrel-white.png');

                  return (
                    <button
                      key={pen.id}
                      type="button"
                      onClick={() => handleProductSelect(pen)}
                      className={`shrink-0 w-48 p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${isSelected
                          ? 'border-2 border-black bg-neutral-50 shadow-sm ring-1 ring-black'
                          : 'border-neutral-200 bg-white hover:border-neutral-400 hover:bg-neutral-50/50'
                        }`}
                    >
                      {/* Active Indicator Top Tag */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-mono font-bold text-black">
                          <Check className="w-3 h-3" />
                          <span>ACTIVE</span>
                        </div>
                      )}

                      <div className="w-full h-16 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center p-2 mb-2.5 overflow-hidden">
                        <img
                          src={thumb}
                          alt={pen.name}
                          className="max-h-full max-w-full object-contain filter drop-shadow-xs"
                        />
                      </div>

                      <p className="text-xs font-bold text-neutral-900 truncate">{pen.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[11px] font-mono text-black font-bold">
                          {formatLKR(pen.priceCents)}
                        </span>
                        <span className="text-[9px] font-mono text-neutral-500 uppercase">
                          {pen.brandName || 'DSL'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: LUXURY DECENT MONOCHROME SLAB             */}
          <div className="lg:col-span-5 space-y-6 rounded-3xl p-6 sm:p-8 bg-white border border-neutral-200 shadow-sm">

            {/* Atelier Specification Header */}
            <div className="pb-5 border-b border-neutral-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-widest uppercase text-black bg-neutral-100 px-2.5 py-1 rounded-full border border-neutral-300 font-bold">
                  Bespoke Specification
                </span>
                <span className="text-xs font-mono text-neutral-500">
                  SKU: {selectedVariant?.sku || selectedProduct.sku}
                </span>
              </div>
              <h2 className="text-xl font-black text-neutral-950 tracking-tight">
                {selectedProduct.name}
              </h2>
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-xs text-neutral-500">Base Writing Instrument</span>
                <span className="text-lg font-mono font-bold text-black">
                  {formatLKR(baseUnitPriceCents)}
                </span>
              </div>
            </div>

            {/* Step 1: Chassis Metallurgy / Finish Selector */}
            {selectedProduct.id === 'prod-dsl-sovereign' && (
              <div className="space-y-2.5">
                <label className="text-xs font-bold tracking-wider text-neutral-900 block uppercase">
                  1. Instrument Chassis Finish
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleChassisChange('white')}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${chassisFinish === 'white'
                        ? 'border-2 border-black bg-neutral-50 shadow-sm ring-1 ring-black'
                        : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 text-neutral-600'
                      }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-white mx-auto mb-1.5 shadow-sm border border-neutral-300" />
                    <span className="text-[11px] font-bold block text-neutral-900">Pure White</span>
                    <span className="text-[9px] font-mono text-neutral-500">Carrara Lacquer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChassisChange('silver')}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${chassisFinish === 'silver'
                        ? 'border-2 border-black bg-neutral-50 shadow-sm ring-1 ring-black'
                        : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 text-neutral-600'
                      }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#94A3B8] via-white to-[#E2E8F0] mx-auto mb-1.5 shadow-sm border border-neutral-300/50" />
                    <span className="text-[11px] font-bold block text-neutral-900">Liquid Silver</span>
                    <span className="text-[9px] font-mono text-neutral-500">Chrome Fluted</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChassisChange('stealth')}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${chassisFinish === 'stealth'
                        ? 'border-2 border-black bg-neutral-100 shadow-sm ring-1 ring-black'
                        : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 text-neutral-600'
                      }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-black via-neutral-700 to-neutral-900 mx-auto mb-1.5 shadow-sm border border-neutral-700" />
                    <span className="text-[11px] font-bold block text-neutral-900">Stealth Noir</span>
                    <span className="text-[9px] font-mono text-neutral-500">Dark Titanium</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChassisChange('gold')}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${chassisFinish === 'gold'
                        ? 'border-2 border-amber-600 bg-amber-50/50 shadow-sm ring-1 ring-amber-600'
                        : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 text-neutral-600'
                      }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#AA771C] via-[#FFE37A] to-[#D4AF37] mx-auto mb-1.5 shadow-sm border border-amber-400" />
                    <span className="text-[11px] font-bold block text-neutral-900">24K Gold</span>
                    <span className="text-[9px] font-mono text-neutral-500">Obsidian Lacquer</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Custom Engraving Inscription Input */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold tracking-wider text-slate-900 flex items-center gap-2 uppercase">
                  <span>2. Custom Inscription</span>
                  <span className="text-black font-bold">*</span>
                </label>
                <span
                  className={`text-[11px] font-mono ${charsRemaining <= 3 ? 'text-rose-600 font-bold' : 'text-slate-600'
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
                  className="w-full text-sm font-semibold px-4 py-3.5 rounded-2xl border-2 border-neutral-200 bg-white text-black placeholder-neutral-400 focus:outline-hidden focus:border-black focus:ring-1 focus:ring-black transition-all font-sans"
                />
                <PenTool className="w-4 h-4 text-neutral-500 absolute right-4 top-4 pointer-events-none" />
              </div>

              {/* Quick Inspiration Monogram Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-mono text-neutral-500">Inspiration:</span>
                {['Kasun Perera', 'K.D.P.', 'CEO & Founder', 'Happy Birthday', 'Class of 2026'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setEngravingText(chip)}
                    className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-neutral-100 hover:bg-black hover:text-white text-neutral-800 border border-neutral-200 transition-colors cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Engraving Font Colour (Black, White, Gold, Silver) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold tracking-wider text-neutral-900 block uppercase">
                  3. Engraving Font Colour
                </label>
                <span className="text-[10px] font-mono text-neutral-500">
                  {foilColor === 'white'
                    ? 'White (Crisp & High Contrast)'
                    : foilColor === 'black'
                    ? 'Black (Deep Laser Obsidian)'
                    : foilColor === 'silver'
                    ? 'Liquid Silver'
                    : '24K Gold Foil'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    id: 'white',
                    name: 'Crisp White',
                    subtitle: 'High Contrast',
                    swatch: 'bg-white border-2 border-neutral-300 shadow-xs',
                  },
                  {
                    id: 'black',
                    name: 'Deep Black',
                    subtitle: 'Laser Obsidian',
                    swatch: 'bg-black border border-black shadow-xs',
                  },
                  {
                    id: 'silver',
                    name: 'Liquid Silver',
                    subtitle: 'Chrome Foil',
                    swatch: 'bg-gradient-to-tr from-neutral-400 via-white to-neutral-300 border border-neutral-300',
                  },
                  {
                    id: 'gold',
                    name: '24K Gold',
                    subtitle: 'Gold Leaf Foil',
                    swatch: 'bg-gradient-to-tr from-[#AA771C] via-[#FFE37A] to-[#D4AF37] border border-amber-400',
                  },
                ].map((item) => {
                  const isSelected = foilColor === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFoilColor(item.id as any)}
                      className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-2 border-black bg-neutral-50 shadow-sm ring-1 ring-black'
                          : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 text-neutral-600'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full ${item.swatch} mx-auto mb-1.5 block`} />
                      <span className="text-[11px] font-bold block text-neutral-900 truncate">{item.name}</span>
                      <span className="text-[9px] font-mono text-neutral-500 block truncate">{item.subtitle}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Font Style Selection */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold tracking-wider text-neutral-900 block uppercase">
                4. Select Horological Typography
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {allowedFonts.map((fontName) => {
                  const isSelected = selectedFont === fontName;
                  let fontClass = 'font-sans font-medium';
                  if (fontName === 'Serif') fontClass = 'font-serif';
                  if (fontName === 'Script') fontClass = 'italic font-serif';
                  if (fontName === 'SANS') fontClass = 'font-sans font-bold';
                  if (fontName === 'Italic') fontClass = 'italic font-sans';
                  if (fontName === 'Monospace') fontClass = 'font-mono text-[10px]';

                  return (
                    <button
                      key={fontName}
                      type="button"
                      onClick={() => setSelectedFont(fontName)}
                      className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${isSelected
                          ? 'border-2 border-black bg-black text-white shadow-sm font-bold'
                          : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400 hover:bg-neutral-50'
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
              <label className="text-xs font-bold tracking-wider text-neutral-900 block uppercase">
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
                          ? 'border-2 border-black bg-black text-white font-bold shadow-sm'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50'
                        }`}
                    >
                      <span className="text-xs block">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 6: Quantity & Price Breakdown (Invoice Card) */}
            <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-neutral-700 uppercase">
                  Order Quantity
                </span>
                <div className="flex items-center border border-neutral-300 rounded-xl bg-white shadow-xs">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="p-2 hover:bg-neutral-100 text-neutral-800 disabled:opacity-30 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-3 font-mono font-bold text-xs text-black">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="p-2 hover:bg-neutral-100 text-neutral-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Price Calculation Lines */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs text-slate-600 font-mono">
                <div className="flex justify-between">
                  <span>Base Writing Instrument:</span>
                  <span className="text-slate-900 font-semibold">
                    {formatLKR(baseUnitPriceCents)} × {quantity}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Fiber-Laser Personalization:</span>
                  <span className="text-slate-950 font-bold">
                    {formatLKR(engravingFeePerUnitCents)} × {quantity}
                  </span>
                </div>
                {activeDiscountNotice && (
                  <div className="text-[11px] font-sans font-bold text-slate-900 bg-slate-200/80 p-2 rounded-xl border border-slate-300 flex items-center gap-1.5 mt-1">
                    <Tag className="w-3.5 h-3.5 shrink-0 text-black" />
                    <span>{activeDiscountNotice}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-neutral-200 text-sm font-bold">
                  <span className="text-neutral-900 font-bold">Total Atelier Amount:</span>
                  <span className="text-2xl font-mono font-black text-black">
                    {formatLKR(subtotalCents)}
                  </span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* CTA Button */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isSubmitting}
                className={`w-full py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg ${isSubmitting
                    ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                    : addedSuccess
                      ? 'bg-black text-white'
                      : 'bg-black hover:bg-neutral-800 text-white active:scale-[0.99]'
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

              <div className="flex items-center justify-center gap-2 text-center text-xs text-neutral-500 font-mono">
                <RotateCcw className="w-3.5 h-3.5 text-black" />
                <span>Hand-inspected & dispatched within 24-48 hours.</span>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================= */}
        {/* ATELIER STANDARDS & QUALITY PROMISE                      */}
        {/* ========================================================= */}
        <div className="pt-12 pb-6 border-t border-neutral-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-white border border-neutral-200 space-y-2">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center mb-3">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-black uppercase tracking-wider">
                Precision Laser Fiber
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Etched with 0.01mm Swiss-calibrated accuracy for a lifetime of permanent clarity.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-neutral-200 space-y-2">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center mb-3">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-black uppercase tracking-wider">
                Luxury Presentation Box
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Hand-packed in an elegant velvet-lined presentation case ready for executive gifting.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-neutral-200 space-y-2">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center mb-3">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-black uppercase tracking-wider">
                Authentic DSL Warranty
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                100% genuine authorized writing instruments backed by our distributor guarantee.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-neutral-200 space-y-2">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center mb-3">
                <Truck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-black uppercase tracking-wider">
                Islandwide Secure Delivery
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Fast, insured door-to-door courier service with live order tracking updates.
              </p>
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
        <div className="min-h-screen bg-white py-12 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CustomizePenContent />
    </Suspense>
  );
}
