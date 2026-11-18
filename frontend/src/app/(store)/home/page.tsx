'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  Package,
  Layers,
  Sparkles,
  Copy,
  Award,
} from 'lucide-react';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { schoolPackService } from '@/services/schoolPackService';
import { bannerService } from '@/services/bannerService';
import { Product, ProductCategory } from '@/types/product';
import { SchoolPack } from '@/types/school-pack';
import { HomepageBanner } from '@/types/banner';
import { ProductCard } from '@/components/products/ProductCard';
import { HeroRibbonSection } from '@/components/home/HeroRibbonSection';
import ScrollStack, { ScrollStackItem } from '@/components/common/ScrollStack';
import { TrustedBrandsStackCard } from '@/components/home/TrustedBrandsStackCard';
import { CascadingProductsStackCard } from '@/components/home/CascadingProductsStackCard';
import { InteractiveBrandShowcaseCard } from '@/components/home/InteractiveBrandShowcaseCard';
import { LittleEssentialsShowcase } from '@/components/home/LittleEssentialsShowcase';
import { ShopByCollectionSection } from '@/components/home/ShopByCollectionSection';
import { PromotionalWaveRibbon } from '@/components/home/PromotionalWaveRibbon';
import { SpeedHeroSlide } from '@/components/home/SpeedHeroSlide';
import { MovingWatermarkBackground } from '@/components/common/MovingWatermarkBackground';
import { formatLKR } from '@/lib/currency';
import { NewsletterSubscriptionForm } from '@/components/newsletter/NewsletterSubscriptionForm';
import { WelcomeSplashLoader } from '@/components/common/WelcomeSplashLoader';
import { INITIAL_PRODUCTS } from '@/mocks/products';

function getCuratedStorefrontProducts(items: Product[], type: 'best' | 'new'): Product[] {
  const withImages = items.filter(
    (p) => p && p.images && p.images.length > 0 && p.images[0] && p.images[0].trim() !== ''
  );
  if (withImages.length === 0) return [];

  if (type === 'best') {
    const tagged = withImages.filter((p) => p.isBestSeller);
    if (tagged.length >= 6) return tagged.slice(0, 10);
    const remaining = withImages.filter((p) => !tagged.some((t) => t.id === p.id));
    return [...tagged, ...remaining].slice(0, 10);
  } else {
    const tagged = withImages.filter((p) => p.isNewArrival || p.tags?.includes('new'));
    if (tagged.length >= 6) return tagged.slice(0, 10);
    const remaining = withImages.filter((p) => !tagged.some((t) => t.id === p.id));
    return [...tagged, ...remaining].slice(0, 10);
  }
}

export default function HomeStorefrontPage() {
  const sectionOurBrandsRef = useRef<HTMLElement>(null);
  const [bestSellers, setBestSellers] = useState<Product[]>(() => getCuratedStorefrontProducts(INITIAL_PRODUCTS, 'best'));
  const [newArrivals, setNewArrivals] = useState<Product[]>(() => getCuratedStorefrontProducts(INITIAL_PRODUCTS, 'new'));
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [schoolPacks, setSchoolPacks] = useState<SchoolPack[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [midPromoBanner, setMidPromoBanner] = useState<HomepageBanner | null>(null);

  useEffect(() => {
    // Initial sync load from local cached products
    const all = productService.getAll();
    const localBest = getCuratedStorefrontProducts(all, 'best');
    const localNew = getCuratedStorefrontProducts(all, 'new');

    if (localBest.length > 0) setBestSellers(localBest);
    if (localNew.length > 0) setNewArrivals(localNew);
    setCategories(categoryService.getCategories().slice(0, 6));
    setSchoolPacks(schoolPackService.getAll().slice(0, 3));

    // Asynchronously fetch real backend database data
    let isMounted = true;
    Promise.all([
      productService.fetchProducts({}, 'newest', 1, 100),
      categoryService.fetchCategories(),
      schoolPackService.getPacks({ limit: 4 }),
      bannerService.getHomepageBanners('MID_PAGE_PROMO'),
    ])
      .then(([productRes, catList, packsRes, promoBanners]) => {
        if (isMounted) {
          const items = productRes.items || [];
          const apiBest = getCuratedStorefrontProducts(items, 'best');
          const apiNew = getCuratedStorefrontProducts(items, 'new');

          if (apiBest.length > 0) setBestSellers(apiBest);
          if (apiNew.length > 0) setNewArrivals(apiNew);
          setCategories(catList.slice(0, 6));
          if (packsRes?.items) {
            setSchoolPacks(packsRes.items.slice(0, 3));
          }
          if (promoBanners && promoBanners.length > 0) {
            setMidPromoBanner(promoBanners[0]);
          }
        }
      })
      .catch((err) => {
        console.warn('Home storefront API fetch error, maintaining authentic products:', err);
        if (isMounted) {
          const fallbackAll = productService.getAll();
          setBestSellers(getCuratedStorefrontProducts(fallbackAll, 'best'));
          setNewArrivals(getCuratedStorefrontProducts(fallbackAll, 'new'));
        }
      });

    const unsubProduct = productService.subscribe(() => {
      const updated = productService.getAll();
      const updatedBest = getCuratedStorefrontProducts(updated, 'best');
      const updatedNew = getCuratedStorefrontProducts(updated, 'new');
      if (updatedBest.length > 0) setBestSellers(updatedBest);
      if (updatedNew.length > 0) setNewArrivals(updatedNew);
    });

    const unsubCat = categoryService.subscribe(() => {
      setCategories(categoryService.getCategories().slice(0, 6));
    });

    return () => {
      isMounted = false;
      unsubProduct();
      unsubCat();
    };
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <>
      <WelcomeSplashLoader durationSeconds={4} />
      <div className="bg-white text-[#102C60] space-y-[1.5cm] pb-16 w-full select-none pt-0">

        {/* ========================================================= */}
        {/* 1. HERO SECTION WITH 3D RIBBON & TRANSPARENT CHILD         */}
        {/* ========================================================= */}
        <HeroRibbonSection />

        {/* ========================================================= */}
        {/* FEATURE HIGHLIGHTS (SCROLL STACK SECTION)                 */}
        {/* Pinned Window Scroll Sequence with Sticky DSL Watermark   */}
        {/* ========================================================= */}
        <section
          id="our-brands"
          className="w-full relative z-10 border-t border-blue-200/60"
          aria-label="Feature Highlights Stack"
        >
          {/* Pinned Sticky Background: Stays fixed in the viewport while scrolling the cards */}
          <div className="sticky top-0 h-[100dvh] w-full overflow-hidden pointer-events-none -mb-[100dvh]">
            <MovingWatermarkBackground opacity={0.24} speed={36} direction="diagonal" />
          </div>

          {/* Centered container for the ScrollStack cards */}
          <div className="w-full max-w-[1240px] mx-auto px-3 sm:px-6 lg:px-8 relative z-10 pt-4 sm:pt-6 pb-4 sm:pb-6">
            <ScrollStack
              useWindowScroll={true}
              smoothScroll={false}
              itemDistance={460}
              itemStackDistance={18}
              stackPosition="106px"
              holdDistance={40}
              itemScale={0.02}
              dimAmount={0.05}
              blurAmount={0}
            >
              {/* ScrollStack Card 1: Trusted by the Best (Our Brands) */}
              <ScrollStackItem
                itemClassName="!h-auto min-h-[410px] sm:min-h-[430px] lg:min-h-[450px] !p-0 !rounded-[28px] overflow-hidden flex flex-col justify-center relative !bg-transparent border border-white/70 shadow-[0_30px_70px_-15px_rgba(2,8,24,0.4),0_10px_25px_rgba(0,0,0,0.1),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(8,24,56,0.1)] backdrop-blur-2xl"
              >
                <TrustedBrandsStackCard />
              </ScrollStackItem>

              {/* ScrollStack Card 2: Cascading Product Cards */}
              <ScrollStackItem
                distance={460}
                itemClassName="!h-auto min-h-[410px] sm:min-h-[430px] lg:min-h-[450px] !p-0 !rounded-[28px] overflow-hidden flex flex-col justify-center relative !bg-transparent border border-white/70 shadow-[0_30px_70px_-15px_rgba(2,8,24,0.4),0_10px_25px_rgba(0,0,0,0.1),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(8,24,56,0.1)] backdrop-blur-2xl"
              >
                <CascadingProductsStackCard />
              </ScrollStackItem>

              {/* ScrollStack Card 3: Interactive Brand Showcase */}
              <ScrollStackItem
                distance={460}
                itemClassName="!h-auto min-h-[410px] sm:min-h-[430px] lg:min-h-[450px] !p-0 !rounded-[28px] overflow-hidden flex flex-col justify-center relative !bg-transparent border border-white/70 shadow-[0_30px_70px_-15px_rgba(2,8,24,0.4),0_10px_25px_rgba(0,0,0,0.1),inset_0_2px_3px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(8,24,56,0.1)] backdrop-blur-2xl"
              >
                <InteractiveBrandShowcaseCard />
              </ScrollStackItem>
            </ScrollStack>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. SUBSEQUENT SECTIONS WRAPPER (Z-30 SOLID WHITE SURFACE) */}
        {/* Glides cleanly over Section 2 with zero empty background  */}
        {/* ========================================================= */}
        <div className="relative z-30 bg-white w-full space-y-[1.5cm] pt-0">
          <ShopByCollectionSection />

          {/* ========================================================= */}
          {/* 3. PROMOTIONAL BLUE WAVE RIBBON                           */}
          {/* ========================================================= */}
          <PromotionalWaveRibbon />

          {/* ========================================================= */}
          {/* 4. BEST SELLERS (CONTINUOUS RIGHT-MOVING MARQUEE)         */}
          {/* ========================================================= */}
          <section className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="w-2 sm:w-2.5 h-6 sm:h-7 bg-[#0866E8] rounded-full inline-block" />
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#102C60] tracking-tight">
                  Best Sellers
                </h2>
              </div>
              <Link
                href="/shop?filter=best-sellers"
                className="text-xs sm:text-sm font-bold text-[#0866E8] hover:text-[#09285C] transition-colors flex items-center gap-1.5 group"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Continuous Right-Moving Product Track with Hover/Touch/Focus-Pause */}
            <div
              className="relative overflow-hidden py-3 group"
              onTouchStart={(e) => {
                const el = e.currentTarget.querySelector('.animate-marquee-right');
                if (el) (el as HTMLElement).style.animationPlayState = 'paused';
              }}
              onTouchEnd={(e) => {
                const target = e.currentTarget;
                setTimeout(() => {
                  const el = target.querySelector('.animate-marquee-right');
                  if (el) (el as HTMLElement).style.animationPlayState = 'running';
                }, 3000);
              }}
            >
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-white to-transparent z-10" />
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-white to-transparent z-10" />

              <div className="animate-marquee-right flex gap-4 sm:gap-6 items-stretch">
                {[...bestSellers, ...bestSellers].map((product, idx) => (
                  <div key={`best-${product.id}-${idx}`} className="w-[200px] sm:w-[240px] md:w-[260px] shrink-0 flex flex-col h-full">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ========================================================= */}
          {/* 5. ABOUT US SHOWCASE - "LITTLE ESSENTIALS. BIG IDEAS."    */}
          {/* ========================================================= */}
          <LittleEssentialsShowcase />

          {/* ========================================================= */}
          {/* 6. NEW ARRIVALS (CONTINUOUS LEFT-MOVING MARQUEE)          */}
          {/* ========================================================= */}
          <section className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="w-2 sm:w-2.5 h-6 sm:h-7 bg-[#16A34A] rounded-full inline-block" />
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#102C60] tracking-tight">
                  New Arrivals
                </h2>
              </div>
              <Link
                href="/shop?filter=new-arrivals"
                className="text-xs sm:text-sm font-bold text-[#0866E8] hover:text-[#09285C] transition-colors flex items-center gap-1.5 group"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Continuous Left-Moving Product Track with Hover/Touch/Focus-Pause */}
            <div
              className="relative overflow-hidden py-3 group"
              onTouchStart={(e) => {
                const el = e.currentTarget.querySelector('.animate-marquee-left');
                if (el) (el as HTMLElement).style.animationPlayState = 'paused';
              }}
              onTouchEnd={(e) => {
                const target = e.currentTarget;
                setTimeout(() => {
                  const el = target.querySelector('.animate-marquee-left');
                  if (el) (el as HTMLElement).style.animationPlayState = 'running';
                }, 3000);
              }}
            >
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-white to-transparent z-10" />
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-white to-transparent z-10" />

              <div className="animate-marquee-left flex gap-4 sm:gap-6 items-stretch">
                {[...newArrivals, ...newArrivals].map((product, idx) => (
                  <div key={`new-${product.id}-${idx}`} className="w-[200px] sm:w-[240px] md:w-[260px] shrink-0 flex flex-col h-full">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ========================================================= */}
          {/* 7. SPEED PROMOTION                                       */}
          {/* ========================================================= */}
          <SpeedHeroSlide />

          {/* ========================================================= */}
          {/* 8. AUTHORISED BRANDS (ONE BIGGER SINGLE ROW)              */}
          {/* ========================================================= */}
          <section className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="w-2 sm:w-2.5 h-6 sm:h-7 bg-[#FFD84D] rounded-full inline-block" />
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#102C60] tracking-tight">
                  Authorised Brands
                </h2>
              </div>
              <Link
                href="/brands"
                className="text-xs sm:text-sm font-bold text-[#0866E8] hover:text-[#09285C] transition-colors flex items-center gap-1.5 group"
              >
                <span>View All Brands</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* 1 Single Continuous Moving Row with Bigger Premium Brand Cards (Moving Right) */}
            <div className="relative overflow-hidden py-3 group">
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-white to-transparent z-10" />
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-white to-transparent z-10" />

              <div className="animate-marquee-right flex gap-4 sm:gap-6 items-center">
                {[
                  { name: 'Speed', slug: 'speed', desc: 'Pens, Adhesives & Correction', origin: 'Sri Lanka', logo: '/images/brands/speed.svg' },
                  { name: 'Doms', slug: 'doms', desc: 'Colour Pencils, Clay & Art Kits', origin: 'India', logo: '/images/brands/doms.svg' },
                  { name: 'Amigo', slug: 'amigo', desc: 'Scientific & Desk Calculators', origin: 'Sri Lanka', logo: '/images/brands/amigo.svg' },
                  { name: 'Linc', slug: 'linc', desc: 'Pentonic Smooth Ball & Gel Pens', origin: 'India', logo: '/images/brands/linc.svg' },
                  { name: 'Pentonic', slug: 'pentonic', desc: 'Featherlite Pastel Matte Pens', origin: 'India', logo: '/images/brands/pentonic.svg' },
                  { name: 'Accumate', slug: 'accumate', desc: 'Precision Geometry Instrument Boxes', origin: 'Sri Lanka', logo: '/images/brands/accumate.svg' },
                  { name: 'Geommy', slug: 'geommy', desc: 'High-Precision Compasses & Rulers', origin: 'Sri Lanka', logo: '/images/brands/geommy.svg' },
                  { name: 'FlexOffice', slug: 'flexoffice', desc: 'Highlighters, Tapes & Stationery', origin: 'Global', logo: '/images/brands/flexoffice.svg' },
                  // Duplicate set for seamless continuous marquee loop
                  { name: 'Speed', slug: 'speed', desc: 'Pens, Adhesives & Correction', origin: 'Sri Lanka', logo: '/images/brands/speed.svg' },
                  { name: 'Doms', slug: 'doms', desc: 'Colour Pencils, Clay & Art Kits', origin: 'India', logo: '/images/brands/doms.svg' },
                  { name: 'Amigo', slug: 'amigo', desc: 'Scientific & Desk Calculators', origin: 'Sri Lanka', logo: '/images/brands/amigo.svg' },
                  { name: 'Linc', slug: 'linc', desc: 'Pentonic Smooth Ball & Gel Pens', origin: 'India', logo: '/images/brands/linc.svg' },
                  { name: 'Pentonic', slug: 'pentonic', desc: 'Featherlite Pastel Matte Pens', origin: 'India', logo: '/images/brands/pentonic.svg' },
                  { name: 'Accumate', slug: 'accumate', desc: 'Precision Geometry Instrument Boxes', origin: 'Sri Lanka', logo: '/images/brands/accumate.svg' },
                  { name: 'Geommy', slug: 'geommy', desc: 'High-Precision Compasses & Rulers', origin: 'Sri Lanka', logo: '/images/brands/geommy.svg' },
                  { name: 'FlexOffice', slug: 'flexoffice', desc: 'Highlighters, Tapes & Stationery', origin: 'Global', logo: '/images/brands/flexoffice.svg' },
                ].map((brand, i) => (
                  <Link
                    key={`single-row-${brand.slug}-${i}`}
                    href={`/brands/${brand.slug}`}
                    className="w-[310px] sm:w-[350px] md:w-[380px] shrink-0 bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-slate-200/90 hover:border-[#0866E8] shadow-xs hover:shadow-xl transition-all duration-300 p-4 sm:p-5 flex items-center gap-4 group cursor-pointer"
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#F7FAFF] border border-slate-100 flex items-center justify-center p-2.5 sm:p-3 shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                      <img
                        src={brand.logo}
                        alt={`${brand.name} Logo`}
                        className="max-h-9 sm:max-h-11 max-w-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base sm:text-lg font-black text-[#09285C] group-hover:text-[#0866E8] transition-colors whitespace-nowrap">
                          {brand.name}
                        </span>
                        <span className="text-[10px] font-bold text-[#0866E8] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full shrink-0">
                          {brand.origin}
                        </span>
                      </div>
                      <p className="text-xs sm:text-[13px] text-[#64748B] font-medium truncate mt-1">
                        {brand.desc}
                      </p>
                    </div>
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F7FAFF] group-hover:bg-[#0866E8] text-slate-400 group-hover:text-white flex items-center justify-center transition-all ml-auto shrink-0 shadow-2xs">
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* ========================================================= */}
          {/* 9. ADVERTISEMENT SECTION: HIGH-IMPACT PROMOTIONS          */}
          {/* ========================================================= */}
          {(() => {
            const isMidPromoGraphic =
              midPromoBanner &&
              (midPromoBanner.subtitle === '__GRAPHIC_ONLY__' ||
                (!midPromoBanner.subtitle && !midPromoBanner.description && !midPromoBanner.buttonText));

            if (isMidPromoGraphic && midPromoBanner?.desktopImage) {
              return (
                <section className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
                  {midPromoBanner.buttonLink ? (
                    <Link href={midPromoBanner.buttonLink} className="block group">
                      <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 transition-all group-hover:shadow-2xl bg-slate-900">
                        <picture className="w-full h-auto block">
                          {midPromoBanner.mobileImage && (
                            <source media="(max-width: 768px)" srcSet={midPromoBanner.mobileImage} />
                          )}
                          <img
                            src={midPromoBanner.desktopImage}
                            alt={midPromoBanner.imageAltText || midPromoBanner.title}
                            className="w-full h-auto min-h-[160px] sm:min-h-[220px] object-cover transition-transform duration-500 group-hover:scale-[1.01]"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (!target.dataset.retried && target.src.includes('/uploads/')) {
                                target.dataset.retried = 'true';
                                target.src = `http://localhost:4000${midPromoBanner.desktopImage.startsWith('/') ? '' : '/'}${midPromoBanner.desktopImage}`;
                              }
                            }}
                          />
                        </picture>
                      </div>
                    </Link>
                  ) : (
                    <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-slate-900">
                      <picture className="w-full h-auto block">
                        {midPromoBanner.mobileImage && (
                          <source media="(max-width: 768px)" srcSet={midPromoBanner.mobileImage} />
                        )}
                        <img
                          src={midPromoBanner.desktopImage}
                          alt={midPromoBanner.imageAltText || midPromoBanner.title}
                          className="w-full h-auto min-h-[160px] sm:min-h-[220px] object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (!target.dataset.retried && target.src.includes('/uploads/')) {
                              target.dataset.retried = 'true';
                              target.src = `http://localhost:4000${midPromoBanner.desktopImage.startsWith('/') ? '' : '/'}${midPromoBanner.desktopImage}`;
                            }
                          }}
                        />
                      </picture>
                    </div>
                  )}
                </section>
              );
            }

            return (
              <section className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
                <div className="relative rounded-3xl bg-[#102C60] text-white p-8 sm:p-12 lg:p-16 overflow-hidden shadow-xl border border-[#102C60]">
                  {/* Subtle electric blue ambient glows */}
                  <div className="absolute top-0 right-0 w-96 h-96 bg-[#006DEB]/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#006DEB]/15 rounded-full blur-2xl pointer-events-none" />

                  {/* Optional background image if uploaded by admin */}
                  {midPromoBanner?.desktopImage && (
                    <img
                      src={midPromoBanner.desktopImage}
                      alt={midPromoBanner.imageAltText || ''}
                      className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
                    />
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                    {/* Left Content */}
                    <div className="lg:col-span-8 space-y-4">
                      <span className="inline-block bg-[#006DEB] text-white text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                        {midPromoBanner?.subtitle || 'Distribution Partner Promotion'}
                      </span>

                      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                        {midPromoBanner?.title || (
                          <>
                            Equip Classrooms &amp; Workplaces <br className="hidden sm:inline" />
                            With Wholesale Confidence.
                          </>
                        )}
                      </h2>

                      <p className="text-xs sm:text-sm text-white/80 max-w-2xl leading-relaxed">
                        {midPromoBanner?.description || 'Direct distribution agreements with Atlas, Promate, and Faber-Castell guarantee authentic supplies at authoritative distributor pricing.'}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 pt-4">
                        <button
                          onClick={() => handleCopyCode(midPromoBanner?.buttonText ? midPromoBanner.buttonText.replace(/^COPY CODE:\s*/i, '') : '20OFF')}
                          className="bg-[#006DEB] hover:bg-[#005ac2] text-white font-bold text-xs sm:text-sm px-7 py-3.5 rounded-full shadow-lg shadow-[#006DEB]/25 transition-all hover:scale-105 flex items-center gap-2 cursor-pointer"
                        >
                          <Copy className="w-4 h-4" />
                          <span>
                            {copiedCode
                              ? `Code Copied: ${midPromoBanner?.buttonText ? midPromoBanner.buttonText.replace(/^COPY CODE:\s*/i, '') : '20OFF'}!`
                              : (midPromoBanner?.buttonText ? `COPY CODE: ${midPromoBanner.buttonText.replace(/^COPY CODE:\s*/i, '')}` : 'COPY CODE: 20OFF')}
                          </span>
                        </button>

                        <Link
                          href={midPromoBanner?.buttonLink || '/offers'}
                          className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm px-7 py-3.5 rounded-full border border-white/20 transition-all hover:scale-105"
                        >
                          Browse Promotional Offers
                        </Link>
                      </div>
                    </div>

                    {/* Right Stat Highlight */}
                    <div className="lg:col-span-4 flex justify-center lg:justify-end">
                      <div className="bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-white/15 max-w-sm w-full text-center space-y-3 shadow-xl">
                        <span className="text-[11px] font-bold text-[#006DEB] uppercase tracking-widest block bg-white/10 px-3 py-1 rounded-full w-fit mx-auto">
                          Seasonal Bulk Benefit
                        </span>
                        <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                          SAVE 20%
                        </div>
                        <p className="text-xs text-white/75 font-medium leading-relaxed">
                          Applies automatically to bulk stationery orders and curriculum packs during the back-to-school season.
                        </p>
                        <div className="pt-2">
                          <Link
                            href="/shop?filter=new-arrivals"
                            className="inline-block bg-white text-[#102C60] hover:bg-slate-100 text-xs font-bold px-6 py-2.5 rounded-full shadow-sm transition-all hover:scale-105"
                          >
                            Shop New Releases
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          })()}

          {/* ========================================================= */}
          {/* 10. NEWSLETTER SUBSCRIPTION (CHECKERED GINGHAM PATTERN)   */}
          {/* ========================================================= */}
          <section
            className="relative w-full py-4 sm:py-6 md:py-8 px-3 sm:px-6 lg:px-8 bg-cover bg-center overflow-hidden"
            style={{
              backgroundImage: "url('/images/newsletter-checkered-bg.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="relative z-10 max-w-4xl mx-auto rounded-[20px] sm:rounded-[26px] md:rounded-[30px] bg-white/80 sm:bg-white/85 backdrop-blur-md border-2 border-white/95 py-4 sm:py-6 md:py-7 px-4 sm:px-8 md:px-10 shadow-[0_12px_36px_rgba(9,40,92,0.08)] overflow-hidden">
              {/* Corner Ambient Golden-Yellow Glows */}
              <div
                className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-amber-300/30 blur-2xl pointer-events-none"
                aria-hidden="true"
              />
              <div
                className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-amber-300/30 blur-2xl pointer-events-none"
                aria-hidden="true"
              />

              {/* Floating Blue Square Shape Background Elements (Left Cluster) */}
              <div
                className="absolute top-3 left-4 sm:left-6 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#087BFF]/15 border border-[#087BFF]/25 rotate-12 pointer-events-none"
                aria-hidden="true"
              />
              <div
                className="absolute top-9 left-8 sm:left-12 w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-[#006DEB]/20 border border-[#006DEB]/25 -rotate-6 pointer-events-none"
                aria-hidden="true"
              />

              {/* Floating Blue Square Shape Background Elements (Right Cluster) */}
              <div
                className="absolute bottom-3 right-5 sm:right-8 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#087BFF]/15 border border-[#087BFF]/25 -rotate-12 pointer-events-none"
                aria-hidden="true"
              />
              <div
                className="absolute bottom-8 right-12 sm:right-18 w-13 h-13 sm:w-16 sm:h-16 rounded-xl bg-[#006DEB]/20 border border-[#006DEB]/25 rotate-12 pointer-events-none"
                aria-hidden="true"
              />

              {/* Floating Little Blue Stars */}
              <span
                className="absolute top-5 left-1/4 text-blue-400/45 text-base pointer-events-none select-none"
                aria-hidden="true"
              >
                ★
              </span>
              <span
                className="absolute bottom-5 right-1/4 text-blue-400/45 text-sm pointer-events-none select-none"
                aria-hidden="true"
              >
                ★
              </span>
              <span
                className="absolute top-8 right-1/6 text-blue-300/55 text-xs pointer-events-none select-none"
                aria-hidden="true"
              >
                ✦
              </span>
              <span
                className="absolute bottom-8 left-1/6 text-blue-300/55 text-xs pointer-events-none select-none"
                aria-hidden="true"
              >
                ✦
              </span>

              {/* Content */}
              <div className="relative z-10 max-w-2xl mx-auto text-center space-y-2 mb-3.5 sm:mb-4">
                <span className="text-[10px] sm:text-[11px] font-black text-[#006DEB] uppercase tracking-wider bg-white/95 py-0.5 px-3.5 rounded-full inline-block border-2 border-[#006DEB] shadow-2xs">
                  STAY INFORMED
                </span>

                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-[26px] font-black text-[#09285C] tracking-tight leading-tight">
                  Subscribe for Distribution Updates &amp; Term{' '}
                  <span className="relative inline-block whitespace-nowrap">
                    Offers
                    {/* Yellow 3-sparkle burst next to Offers */}
                    <span
                      className="absolute -top-2.5 -right-4 text-[#FFB800] select-none pointer-events-none"
                      aria-hidden="true"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none">
                        <path d="M14 9L21 4" stroke="#FFB800" strokeWidth="3" strokeLinecap="round" />
                        <path d="M11 7L12 1" stroke="#FFB800" strokeWidth="3" strokeLinecap="round" />
                        <path d="M15 12L22 12" stroke="#FFB800" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                    </span>
                    {/* Yellow playful wavy underline beneath Offers */}
                    <svg
                      className="absolute -bottom-1 left-0 w-full h-2 text-[#FFB800]"
                      viewBox="0 0 100 12"
                      fill="none"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M2 7C25 11 65 11 98 4"
                        stroke="#FFB800"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </h2>

                <p className="text-xs sm:text-[13px] text-[#09285C]/75 leading-relaxed font-medium max-w-lg mx-auto">
                  Receive verified syllabus lists, seasonal stock allocations, and distributor discount codes straight to your inbox.
                </p>
              </div>

              <div className="relative z-10 max-w-lg mx-auto">
                <NewsletterSubscriptionForm variant="card" source="HOMEPAGE" />
              </div>
            </div>
          </section>

        </div>

      </div>
    </>
  );
}
