'use client';

import React, { useState, useMemo } from 'react';
import { PenTool, Sparkles, Check, Maximize2, Compass } from 'lucide-react';
import { Product, ProductVariant, CustomizationPositionConfig } from '@/types/product';

export interface PenLivePreviewProps {
  product: Product;
  variant?: ProductVariant | null;
  engravingText: string;
  font: string;
  position: string; // 'CAP' | 'BARREL' | 'CLIP'
  foilColor?: 'white' | 'silver' | 'gold' | 'black';
  chassisFinish?: 'white' | 'silver' | 'stealth' | 'gold';
  onChassisChange?: (finish: 'white' | 'silver' | 'stealth' | 'gold') => void;
}

export interface ResolvedZoneConfig {
  left: number; // percentage (0 - 100)
  top: number; // percentage (0 - 100)
  width: number; // percentage (0 - 100)
  height: number; // percentage (0 - 100)
  rotation: number; // degrees
  textAlign: 'left' | 'center' | 'right';
  letterSpacing?: string;
  fontScale: number;
}

/**
 * Standard calibrated fallbacks for horizontal luxury pens (707 x 110 aspect).
 * Meticulously centered on the actual printable surface of barrel, cap, and clip.
 */
const DEFAULT_ZONES: Record<string, ResolvedZoneConfig> = {
  BARREL: {
    left: 45.5,
    top: 48.5,
    width: 25.0,
    height: 9.0,
    rotation: 0,
    textAlign: 'center',
    fontScale: 1.0,
  },
  CAP: {
    left: 74.0,
    top: 48.5,
    width: 20.0,
    height: 9.0,
    rotation: 0,
    textAlign: 'center',
    fontScale: 0.95,
  },
  CLIP: {
    left: 74.0,
    top: 24.0,
    width: 17.0,
    height: 8.0,
    rotation: 0,
    textAlign: 'center',
    fontScale: 0.85,
  },
};

/**
 * Resolves product-specific engraving zone from ProductCustomizationConfig.previewConfig
 * or falls back to the calibrated standard coordinates.
 */
export function resolveEngravingZone(product: Product, positionKey: string): ResolvedZoneConfig {
  const normKey = positionKey.toUpperCase().replace(/^PEN\s+/, '');
  const fallback = DEFAULT_ZONES[normKey] || DEFAULT_ZONES.BARREL;

  const rawConfig = product?.customizationConfig?.previewConfig as any;
  if (!rawConfig) return fallback;

  // Search across possible database structures:
  // 1. rawConfig[normKey] (e.g. rawConfig.BARREL or rawConfig.barrel)
  // 2. rawConfig.zones[normKey]
  const zoneData: CustomizationPositionConfig | undefined =
    rawConfig[normKey] ||
    rawConfig[normKey.toLowerCase()] ||
    rawConfig.zones?.[normKey] ||
    rawConfig.zones?.[normKey.toLowerCase()];

  if (!zoneData) return fallback;

  const parseNum = (val: string | number | undefined, def: number): number => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const parsed = parseFloat(val.replace('%', '').trim());
      return isNaN(parsed) ? def : parsed;
    }
    return def;
  };

  return {
    left: parseNum(zoneData.left ?? (zoneData as any).x, fallback.left),
    top: parseNum(zoneData.top ?? (zoneData as any).y, fallback.top),
    width: parseNum(zoneData.width, fallback.width),
    height: parseNum(zoneData.height, fallback.height),
    rotation: parseNum(zoneData.rotation ?? zoneData.angle, fallback.rotation),
    textAlign: zoneData.textAlign || fallback.textAlign,
    letterSpacing: zoneData.letterSpacing ? `${zoneData.letterSpacing}em` : undefined,
    fontScale: parseNum(zoneData.fontScale, fallback.fontScale),
  };
}

export const PenLivePreview: React.FC<PenLivePreviewProps> = ({
  product,
  variant,
  engravingText,
  font,
  position,
  foilColor = 'white',
  chassisFinish = 'white',
  onChassisChange,
}) => {
  const [showGuide, setShowGuide] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);

  // Active pen image determination
  const isMasterpiece =
    product.id === 'prod-dsl-sovereign' ||
    product.slug === 'dsl-sovereign-masterpiece' ||
    !product.images ||
    product.images.length === 0 ||
    product.images[0].includes('speed-rim');

  let penImageSrc = '/images/luxury-pen-clean-barrel-white.png';
  if (chassisFinish === 'white') {
    penImageSrc = '/images/luxury-pen-clean-barrel-white.png';
  } else if (chassisFinish === 'silver') {
    penImageSrc = '/images/luxury-pen-clean-barrel-silver.png';
  } else if (chassisFinish === 'stealth') {
    penImageSrc = '/images/luxury-pen-clean-barrel-stealth.png';
  } else if (chassisFinish === 'gold') {
    penImageSrc = '/images/luxury-pen-clean-barrel-gold.png';
  } else if (!isMasterpiece && product.images?.[0]) {
    penImageSrc = product.images[0];
  }

  // Resolve product-specific coordinates
  const activeZone = useMemo(() => {
    return resolveEngravingZone(product, position);
  }, [product, position]);

  const currentPos = position.toUpperCase().replace(/^PEN\s+/, '');
  const positionLabel =
    currentPos === 'CAP' ? 'Pen Cap' : currentPos === 'CLIP' ? 'Pen Clip' : 'Pen Barrel';

  // Typography family mapping
  const getFontFamily = (fontName: string): string => {
    switch (fontName) {
      case 'Times New Roman':
      case 'Serif':
        return '"Playfair Display", "Times New Roman", Times, Georgia, serif';
      case 'Italic':
        return 'Georgia, "Times New Roman", Times, serif';
      case 'Script':
        return '"Dancing Script", "Brush Script MT", "Great Vibes", cursive';
      case 'Monospace':
        return '"JetBrains Mono", Menlo, Consolas, Monaco, monospace';
      case 'Calibri':
        return 'Calibri, Candara, "Segoe UI", Optima, Arial, sans-serif';
      case 'Arial':
      case 'SANS':
      default:
        return 'Arial, "Helvetica Neue", Helvetica, system-ui, sans-serif';
    }
  };

  const getFontStyle = (fontName: string): 'normal' | 'italic' => {
    return fontName === 'Italic' ? 'italic' : 'normal';
  };

  const getFontWeight = (fontName: string): number => {
    switch (fontName) {
      case 'Script':
        return 700;
      case 'Arial':
      case 'SANS':
        return 700;
      case 'Times New Roman':
      case 'Serif':
        return 600;
      case 'Monospace':
        return 600;
      case 'Italic':
      default:
        return 600;
    }
  };

  // Dynamic text fitting & scaling based on character length
  const textFitting = useMemo(() => {
    const rawLen = engravingText.trim().length;
    const len = Math.max(1, rawLen);

    // Dynamic scale factor relative to length
    let scale = 1.0;
    let letterSpacing = '0.08em';

    if (len <= 6) {
      // Short names: "Alex", "Kasun"
      scale = 1.15;
      letterSpacing = '0.12em';
    } else if (len <= 10) {
      // Medium names: "Yehara", "Jonathan"
      scale = 1.0;
      letterSpacing = '0.08em';
    } else if (len <= 15) {
      // Longer names: "Yehara Nethmi", "Kasun Perera"
      scale = 0.88;
      letterSpacing = '0.05em';
    } else if (len <= 20) {
      // Long names: "Christopher Alex"
      scale = 0.74;
      letterSpacing = '0.025em';
    } else {
      // Very long names (up to 25): "Christopher Alexander", "ABCDEFGHIJKLMNOPQRSTUVWXY"
      scale = Math.max(0.60, 1 - (len - 10) * 0.026);
      letterSpacing = '0.012em';
    }

    if (font === 'Monospace') {
      scale *= 0.82;
      letterSpacing = '0.02em';
    } else if (font === 'Script') {
      scale *= 1.15;
    }

    // Multiply by zone's specific fontScale
    scale *= activeZone.fontScale;

    return { scale, letterSpacing };
  }, [engravingText, font, activeZone.fontScale]);

  // Realistic laser engraving surface shader & styling
  const engravingStyle: React.CSSProperties = useMemo(() => {
    const isSilverChassis = chassisFinish === 'silver';
    const isBlackChassis = chassisFinish === 'stealth';
    const isWhiteChassis = chassisFinish === 'white';
    const isGoldChassis = chassisFinish === 'gold';

    // 1. Foil Treatment & Metallic Light Simulation
    let background: string;
    let color: string;
    let filter: string;
    let textShadow: string;
    let opacity = 0.96;

    if (foilColor === 'gold') {
      // 24K Imperial Gold Foil Inscription
      background =
        'linear-gradient(180deg, #FFF9D9 0%, #F5D77F 22%, #D4AF37 48%, #A87618 78%, #78520C 100%)';
      color = '#D4AF37';
      // Laser physical deboss: top groove shadow + micro bottom specular catch
      filter = 'drop-shadow(0 0.5px 0.5px rgba(0, 0, 0, 0.95)) drop-shadow(0 -0.5px 0.5px rgba(0, 0, 0, 0.4))';
      textShadow = '0 0.5px 1px rgba(255, 248, 220, 0.35)';
    } else if (foilColor === 'silver') {
      // Liquid Sterling Silver / Platinum Chrome
      background =
        'linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 22%, #CBD5E1 50%, #94A3B8 78%, #64748B 100%)';
      color = '#E2E8F0';

      if (isSilverChassis) {
        // High-contrast frosted tone-on-tone with deep laser recess for silver surface
        filter =
          'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.95)) drop-shadow(0 -0.5px 0.5px rgba(15, 23, 42, 0.8))';
        textShadow = '0 0.5px 1px rgba(255, 255, 255, 0.8)';
      } else {
        filter = 'drop-shadow(0 0.5px 0.5px rgba(0, 0, 0, 0.95)) drop-shadow(0 -0.5px 0.5px rgba(0, 0, 0, 0.3))';
        textShadow = '0 0.5px 1px rgba(255, 255, 255, 0.4)';
      }
    } else if (foilColor === 'black') {
      // Deep Laser Anneal / Obsidian Etch
      if (isBlackChassis) {
        // Burnished obsidian gloss on black chassis
        background =
          'linear-gradient(180deg, #475569 0%, #334155 35%, #1E293B 70%, #0F172A 100%)';
        color = '#334155';
        filter = 'drop-shadow(0 0.5px 0.5px rgba(255, 255, 255, 0.4)) drop-shadow(0 -0.5px 0.5px rgba(0, 0, 0, 0.9))';
        textShadow = '0 0.5px 0.5px rgba(255, 255, 255, 0.3)';
      } else {
        // Rich fiber-laser annealed charcoal on silver/gold/white chassis
        background =
          'linear-gradient(180deg, #1E293B 0%, #0F172A 50%, #020617 100%)';
        color = '#0F172A';
        filter =
          'drop-shadow(0 0.5px 0.5px rgba(255, 255, 255, 0.55)) drop-shadow(0 -0.5px 0.5px rgba(0, 0, 0, 0.95))';
        textShadow = '0 0.5px 0.5px rgba(255, 255, 255, 0.35)';
      }
    } else {
      // Diamond White Laser Engraving
      if (isWhiteChassis) {
        // High-contrast etched dark charcoal on white chassis
        background =
          'linear-gradient(180deg, #1E293B 0%, #0F172A 60%, #020617 100%)';
        color = '#0F172A';
        filter = 'drop-shadow(0 0.5px 0.5px rgba(255, 255, 255, 0.8)) drop-shadow(0 -0.5px 0.5px rgba(0, 0, 0, 0.9))';
        textShadow = '0 0.5px 0.5px rgba(255, 255, 255, 0.5)';
      } else {
        // Pure fiber-laser etched frosted white
        background =
          'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 55%, #E2E8F0 100%)';
        color = '#FFFFFF';
        filter = 'drop-shadow(0 0.5px 0.8px rgba(0, 0, 0, 0.95)) drop-shadow(0 -0.5px 0.5px rgba(0, 0, 0, 0.4))';
        textShadow = '0 0 1px rgba(255, 255, 255, 0.7)';
      }
    }

    return {
      fontFamily: getFontFamily(font),
      fontStyle: getFontStyle(font),
      fontWeight: getFontWeight(font),
      background,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      color,
      filter,
      textShadow,
      letterSpacing: activeZone.letterSpacing || textFitting.letterSpacing,
      opacity,
      transform: `scale(${textFitting.scale})`,
      transformOrigin: 'center center',
      display: 'inline-block',
      maxWidth: '100%',
      whiteSpace: 'nowrap',
      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      userSelect: 'none',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
    };
  }, [chassisFinish, foilColor, font, activeZone.letterSpacing, textFitting]);

  return (
    <div className="relative w-full rounded-3xl overflow-hidden select-none border border-white/10 bg-[#07080A] shadow-[0_25px_60px_rgba(0,0,0,0.95)]">
      {/* ========================================================= */}
      {/* 1. LIQUID GLASS AMBIENCE & OVERHEAD SPOTLIGHT             */}
      {/* ========================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Overhead Pure Liquid White Spotlight */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[360px] rounded-full blur-[110px] opacity-35 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 50%, transparent 80%)',
          }}
        />

        {/* Ambient Silver / Platinum Halo */}
        <div
          className="absolute -bottom-24 right-1/4 w-[450px] h-[300px] rounded-full blur-[120px] opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(226,232,240,0.3) 0%, transparent 70%)',
          }}
        />

        {/* Subtle Liquid Glass Specular Shimmer Diagonal */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none" />
      </div>

      {/* ========================================================= */}
      {/* 2. ATELIER HEADER BAR (TOP CONTROLS)                     */}
      {/* ========================================================= */}
      <div className="relative z-20 px-5 sm:px-7 py-4 flex items-center justify-between border-b border-white/[0.08] backdrop-blur-xl bg-white/[0.02]">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_10px_#FFFFFF]" />
          <span className="text-[11px] sm:text-xs font-semibold tracking-widest uppercase text-slate-300">
            Atelier Live Optical Studio &bull;{' '}
            <span className="text-white font-bold">1:1 Scale Precision</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Zone Guide */}
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
              showGuide
                ? 'bg-white/15 text-white border-white/50 shadow-[0_0_15px_rgba(255,255,255,0.25)]'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10'
            }`}
            title="Toggle Reticle Alignment Guide"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{showGuide ? 'Reticle Active' : 'Show Reticle'}</span>
          </button>

          {/* Toggle Zoom View */}
          <button
            type="button"
            onClick={() => setIsZoomed(!isZoomed)}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all cursor-pointer"
            title="Inspect Detail"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. MAIN PRODUCT CANVAS WITH GLASS PEDESTAL & REFLECTION   */}
      {/* ========================================================= */}
      <div className="relative z-10 w-full min-h-[360px] sm:min-h-[440px] lg:min-h-[480px] flex flex-col items-center justify-center p-6 sm:p-10 overflow-hidden">
        {/* Floating Brand Badge (Top Left Corner of Stage) */}
        <div className="absolute top-5 left-5 z-20 hidden sm:flex flex-col gap-0.5 pointer-events-none">
          <span className="text-[9px] font-mono tracking-widest text-white/90 uppercase font-bold">
            DSL Horological Grade
          </span>
          <span className="text-xs font-serif text-white tracking-wide">{product.name}</span>
        </div>

        {/* Chassis Material Quick-Switch Pills (Top Right) */}
        {onChassisChange && (
          <div className="absolute top-5 right-5 z-20 flex items-center gap-1.5 bg-black/70 backdrop-blur-xl border border-white/15 p-1 rounded-full shadow-lg">
            <button
              type="button"
              onClick={() => onChassisChange('white')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                chassisFinish === 'white'
                  ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-white border border-slate-300 inline-block shadow-xs" />
              <span>Pure White</span>
            </button>

            <button
              type="button"
              onClick={() => onChassisChange('silver')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                chassisFinish === 'silver'
                  ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-300 border border-slate-400 inline-block" />
              <span>Sterling Silver</span>
            </button>

            <button
              type="button"
              onClick={() => onChassisChange('stealth')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                chassisFinish === 'stealth'
                  ? 'bg-slate-800 text-slate-100 border border-slate-600 shadow-[0_0_12px_rgba(0,0,0,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-700 border border-slate-900 inline-block" />
              <span>Stealth Noir</span>
            </button>

            <button
              type="button"
              onClick={() => onChassisChange('gold')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                chassisFinish === 'gold'
                  ? 'bg-amber-100 text-amber-950 font-black shadow-[0_0_12px_rgba(255,215,0,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#FFE37A] border border-amber-600 inline-block" />
              <span>24K Gold</span>
            </button>
          </div>
        )}

        {/* Center Pen Assembly */}
        <div
          className={`relative w-full max-w-2xl transition-transform duration-500 ease-out select-none ${
            isZoomed ? 'scale-125 sm:scale-135' : 'scale-100'
          }`}
        >
          {/* Main Horizontal Pen Visual with 1:1 Percentage-Anchored Overlay */}
          <div className="relative w-full aspect-[707/110] flex items-center justify-center">
            <img
              src={penImageSrc}
              alt={product.name}
              draggable={false}
              className="w-full h-auto object-contain filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.9)] transition-all duration-300"
            />

            {/* Alignment Reticle & Target Box (Dynamic from previewConfig) */}
            {showGuide && (
              <div
                style={{
                  left: `${activeZone.left}%`,
                  top: `${activeZone.top}%`,
                  width: `${activeZone.width}%`,
                  height: `${activeZone.height}%`,
                  transform: `translate(-50%, -50%) rotate(${activeZone.rotation}deg)`,
                }}
                className="absolute rounded border border-dashed border-white/80 bg-white/[0.04] pointer-events-none flex items-center justify-center transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                {/* Corner Precision Reticle Crosshairs */}
                <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white" />
                <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white" />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white" />

                {/* Target Zone Label Floating Above Reticle */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="text-[8px] sm:text-[9px] font-mono tracking-widest uppercase text-white bg-black/90 px-2.5 py-0.5 rounded border border-white/50 shadow-md">
                    {positionLabel} Zone
                  </span>
                </div>
              </div>
            )}

            {/* Real-time Laser Engraved Inscription Layer */}
            <div
              style={{
                left: `${activeZone.left}%`,
                top: `${activeZone.top}%`,
                width: `${activeZone.width}%`,
                height: `${activeZone.height}%`,
                transform: `translate(-50%, -50%) rotate(${activeZone.rotation}deg)`,
              }}
              className="absolute pointer-events-none flex items-center justify-center text-center overflow-hidden transition-all duration-300 px-1"
            >
              {engravingText.trim() ? (
                <span
                  style={engravingStyle}
                  className="text-xs sm:text-sm md:text-base leading-none select-none"
                >
                  {engravingText}
                </span>
              ) : (
                <span className="text-[10px] sm:text-xs font-serif text-white/40 italic tracking-wider">
                  Your inscription here
                </span>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* LIQUID GLASS SURFACE REFLECTION                           */}
          {/* ========================================================= */}
          <div className="relative w-full aspect-[707/70] overflow-hidden pointer-events-none mt-1">
            {/* Glossy Polished Glass Plinth Seam */}
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />

            {/* Inverted Pen Mirror Reflection */}
            <div
              className="w-full opacity-25 filter blur-[0.7px] transform scale-y-[-1] origin-top"
              style={{
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 65%)',
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 65%)',
              }}
            >
              <img
                src={penImageSrc}
                alt=""
                aria-hidden="true"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. ATELIER FOOTER SPECIFICATION STRIP                     */}
      {/* ========================================================= */}
      <div className="relative z-20 px-5 sm:px-7 py-3 border-t border-white/[0.08] backdrop-blur-xl bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-white">✦</span>
            <span>
              Position: <strong className="text-white">{positionLabel}</strong>
            </span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-white">✦</span>
            <span>
              Style: <strong className="text-white">{font}</strong>
            </span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-white">✦</span>
            <span>
              Foil: <strong className="text-white capitalize">{foilColor} Laser</strong>
            </span>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 font-mono tracking-tight text-center sm:text-right">
          0.02mm Micrometric Fiber Laser &bull; Non-Corrosive Depth Etch
        </p>
      </div>
    </div>
  );
};
