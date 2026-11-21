'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import LightCardWavesBackground from '@/components/common/LightCardWavesBackground';
import { useTranslation } from '@/services/languageStore';

// ============================================================================
// BRAND SHOWCASE DATA DEFINITION
// ============================================================================
export interface ShowcaseBrand {
  id: string;
  name: string;
  logo: string;
  slug: string;
  accent: string;
  heading: string;
  description: string;
}

export const SHOWCASE_BRANDS: ShowcaseBrand[] = [
  {
    id: 'speed',
    name: 'SPEED',
    logo: '/images/brands/speed.png',
    slug: 'speed',
    accent: '#FF5A00',
    heading: 'Manufacturer and Distributor of:',
    description:
    'Pens, Adhesives & Correction. A trusted name in stationery, SPEED is committed to delivering quality, innovation, and performance through a wide range of products crafted for every writing and creative need.',
  },
  {
    id: 'doms',
    name: 'DOMS',
    logo: '/images/brands/doms.png',
    slug: 'doms',
    accent: '#E11D48',
    heading: 'Manufacturer and Distributor of:',
    description:
    'Colour Pencils, Clay & Art Kits. DOMS offers a diverse range of creative and educational stationery products, combining quality, innovation, and functionality for everyday learning and creativity.',
  },
  {
    id: 'linc',
    name: 'LINC',
    logo: '/images/brands/linc.png',
    slug: 'linc',
    accent: '#0052CC',
    heading: 'Manufacturer and Distributor of:',
    description:
    'Pentonic Smooth Ball & Gel Pens. LINC is a trusted stationery brand offering quality writing instruments designed to deliver a smooth writing experience, reliability, and everyday performance.',
  },
  {
    id: 'pentonic',
    name: 'Pentonic',
    logo: '/images/brands/pentonic.png',
    slug: 'pentonic',
    accent: '#7C3AED',
    heading: 'Manufacturer and Distributor of:',
    description:
    'Featherlite Pastel Matte Pens. Pentonic brings modern writing instruments with stylish designs and smooth writing performance, combining functionality and contemporary style.',
  },
  {
    id: 'amico',
    name: 'Amigo',
    logo: '/images/brands/amigo.png',
    slug: 'amico',
    accent: '#16A34A',
    heading: 'Manufacturer and Distributor of:',
    description:
    'Scientific & Desk Calculators. Amigo offers practical and innovative stationery, calculators, and office products designed to make everyday tasks easier and more efficient.',
  },
  {
    id: 'flexoffice',
    name: 'FlexOffice',
    logo: '/images/brands/flexoffice.png',
    slug: 'flexoffice',
    accent: '#0284C7',
    heading: 'Manufacturer and Distributor of:',
    description:
    'Highlighters, Tapes & Stationery. FlexOffice provides quality pens, tapes, and stationery products designed to support comfortable writing, everyday productivity, and reliable performance.',
  },
];

export const InteractiveBrandShowcaseCard: React.FC = () => {
  const { t } = useTranslation();
  // SPEED is the default selected brand
  const [selectedBrandId, setSelectedBrandId] = useState<string>('speed');
  const prefersReducedMotion = useReducedMotion();

  const selectedBrand =
    SHOWCASE_BRANDS.find((b) => b.id === selectedBrandId) ?? SHOWCASE_BRANDS[2];

  const handleSelectBrand = (brandId: string) => {
    if (selectedBrandId === brandId) return;
    setSelectedBrandId(brandId);
  };

  return (
    <div className="relative w-full h-full min-h-[380px] sm:min-h-[420px] lg:min-h-[460px] flex items-center justify-center p-4 sm:p-8 lg:p-12 overflow-hidden rounded-[28px] bg-transparent select-none">
      {/* Light Silk Waves Background matching uploaded reference */}
      <LightCardWavesBackground />

      {/* Main Content Grid: Left/Top (Selected Info) + Right/Bottom (Compact 3x2 Brand Grid) */}
      <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-8 lg:gap-12 items-center">
        {/* ========================================================= */}
        {/* LEFT / TOP SIDE: DYNAMIC SELECTED BRAND INFORMATION       */}
        {/* ========================================================= */}
        <div className="md:col-span-5 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedBrand.id}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="flex flex-col items-start"
            >
              {/* Selected Brand Official Logo */}
              <div className="h-10 sm:h-12 md:h-16 max-w-[160px] sm:max-w-[200px] mb-2 sm:mb-3 flex items-center justify-start">
                <img
                  src={selectedBrand.logo}
                  alt={`${selectedBrand.name} logo`}
                  className="max-h-full max-w-full object-contain filter drop-shadow-sm select-none"
                  draggable={false}
                />
              </div>

              {/* Small Yellow/Accent Detail */}
              <div
                className="w-10 sm:w-16 h-1 sm:h-1.5 rounded-full mb-2 sm:mb-3 transition-colors duration-300"
                style={{
                  backgroundColor: selectedBrand.accent || '#FFC72C',
                  boxShadow: `0 0 10px ${selectedBrand.accent || '#FFC72C'}60`,
                }}
                aria-hidden="true"
              />

              {/* Heading: Manufacturer and Distributor of: */}
              <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-[#0F2752] leading-tight tracking-tight">
                {t('home.manufacturerOf', 'Manufacturer and Distributor of:')}
              </h3>

              {/* Brand Description */}
              <p className="mt-2 sm:mt-3 text-[#334155] text-xs sm:text-sm md:text-base leading-relaxed font-medium max-w-lg">
                {t(`brand.desc.${selectedBrand.id}` as any, selectedBrand.description)}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ========================================================= */}
        {/* RIGHT / BOTTOM SIDE: COMPACT 3x2 INTERACTIVE BRAND GRID   */}
        {/* Fits cleanly on mobile without vertical elongation         */}
        {/* ========================================================= */}
        <div className="md:col-span-7 w-full">
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 w-full">
            {SHOWCASE_BRANDS.map((brand) => {
              const isSelected = selectedBrandId === brand.id;
              const brandColor = brand.accent || '#0866E8';

              return (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() => handleSelectBrand(brand.id)}
                  aria-pressed={isSelected}
                  aria-label={`Select ${brand.name}`}
                  className={`group relative w-full h-14 sm:h-16 md:h-20 lg:h-24 rounded-xl sm:rounded-2xl transition-all duration-300 p-2 sm:p-3 flex items-center justify-center cursor-pointer select-none overflow-hidden touch-target ${isSelected
                      ? 'bg-white ring-2 scale-[1.02] z-10'
                      : 'bg-white/85 hover:bg-white border border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-md hover:scale-[1.01]'
                    }`}
                  style={{
                    borderColor: isSelected ? brandColor : undefined,
                    boxShadow: isSelected
                      ? `0 8px 24px -4px ${brandColor}40, 0 2px 6px ${brandColor}20`
                      : undefined,
                  }}
                >
                  {/* Subtle top edge glow when selected */}
                  {isSelected && (
                    <span
                      className="absolute top-0 inset-x-2 h-[2.5px] rounded-full pointer-events-none"
                      style={{ backgroundColor: brandColor }}
                    />
                  )}

                  {/* Glass glare */}
                  <span className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent pointer-events-none rounded-xl" />

                  {/* Logo - ALWAYS FULL COLOR, CLEAN & CRISP */}
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className={`max-h-7 sm:max-h-9 md:max-h-12 max-w-[85%] object-contain select-none transition-transform duration-300 ${isSelected
                        ? 'scale-105 opacity-100'
                        : 'opacity-85 group-hover:opacity-100 group-hover:scale-105'
                      }`}
                    draggable={false}
                  />

                  {/* Subtle active pill indicator */}
                  {isSelected && (
                    <span
                      className="absolute bottom-1 w-3 sm:w-5 h-0.5 sm:h-1 rounded-full pointer-events-none"
                      style={{ backgroundColor: brandColor }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveBrandShowcaseCard;
