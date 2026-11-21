'use client';

import React, { useState, useMemo } from 'react';
import { PenTool, Sparkles, Check, Maximize2, Compass } from 'lucide-react';
import { Product, ProductVariant, CustomizationPositionConfig } from '@/types/product';
import { resolveImageUrl } from '@/lib/image';

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
 * Standard calibrated fallbacks matching the permanent photography angle of luxury pens (-17.6°).
 * Meticulously centered on the actual printable surface of barrel, cap, and clip.
 */
const DEFAULT_ZONES: Record<string, ResolvedZoneConfig> = {
  BARREL: {
    left: 38.0,
    top: 61.0,
    width: 34.0,
    height: 12.0,
    rotation: -17.6,
    textAlign: 'center',
    fontScale: 1.30,
  },
  CAP: {
    left: 74.0,
    top: 31.0,
    width: 26.0,
    height: 12.0,
    rotation: -17.6,
    textAlign: 'center',
    fontScale: 1.20,
  },
  CLIP: {
    left: 72.0,
    top: 25.0,
    width: 20.0,
    height: 10.0,
    rotation: -17.6,
    textAlign: 'center',
    fontScale: 1.05,
  },
};

/**
 * Resolves product-specific engraving zone from ProductCustomizationConfig.previewConfig
 * or falls back to the calibrated standard coordinates (-17.6° permanent luxury pen angle).
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

  const parsedRot = parseNum(zoneData.rotation ?? (zoneData as any).angle, fallback.rotation);
  // Guarantee permanent static angle (-17.6°) if rotation is 0 (the uncalibrated legacy default)
  const rotation = parsedRot === 0 ? fallback.rotation : parsedRot;

  // Detect uncalibrated legacy default coordinates (x: 50, y: 55) and apply perfected barrel coords
  const rawX = zoneData.left ?? (zoneData as any).x;
  const rawY = zoneData.top ?? (zoneData as any).y;
  const isLegacyDummyCoords = (rawX === 50 || rawX === 45.5) && (rawY === 55 || rawY === 48.5);

  const left = isLegacyDummyCoords ? fallback.left : parseNum(rawX, fallback.left);
  const top = isLegacyDummyCoords ? fallback.top : parseNum(rawY, fallback.top);

  return {
    left,
    top,
    width: parseNum(zoneData.width, fallback.width),
    height: parseNum(zoneData.height, fallback.height),
    rotation,
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

  // Active pen image determination:
  // For Sovereign Masterpiece, allow user to toggle through 4 luxury chassis renders.
  // For bespoke enrolled models (like "blue matle pen", "bols sign pen"), render their actual uploaded photo.
  const isSovereign =
    product.id === 'prod-dsl-sovereign' ||
    product.slug === 'dsl-sovereign-masterpiece';

  let penImageSrc = '/images/luxury-pen-clean-barrel-white.png';
  if (isSovereign) {
    if (chassisFinish === 'silver') {
      penImageSrc = '/images/luxury-pen-clean-barrel-silver.png';
    } else if (chassisFinish === 'stealth') {
      penImageSrc = '/images/luxury-pen-clean-barrel-stealth.png';
    } else if (chassisFinish === 'gold') {
      penImageSrc = '/images/luxury-pen-clean-barrel-gold.png';
    } else {
      penImageSrc = '/images/luxury-pen-clean-barrel-white.png';
    }
  } else {
    const customImage = product.images?.[0];
    penImageSrc = customImage
      ? resolveImageUrl(customImage)
      : '/images/luxury-pen-clean-barrel-white.png';
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
        return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
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
      scale = 1.35;
      letterSpacing = '0.12em';
    } else if (len <= 10) {
      // Medium names: "Yehara", "Jonathan"
      scale = 1.20;
      letterSpacing = '0.08em';
    } else if (len <= 15) {
      // Longer names: "Yehara Nethmi", "Kasun Perera"
      scale = 1.05;
      letterSpacing = '0.05em';
    } else if (len <= 20) {
      // Long names: "Christopher Alex"
      scale = 0.90;
      letterSpacing = '0.025em';
    } else {
      // Very long names (up to 25): "Christopher Alexander", "ABCDEFGHIJKLMNOPQRSTUVWXY"
      scale = Math.max(0.72, 1 - (len - 10) * 0.02);
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
    const isSilverChassis = isSovereign && chassisFinish === 'silver';
    const isBlackChassis = isSovereign && chassisFinish === 'stealth';
    const isWhiteChassis = isSovereign && chassisFinish === 'white';
    const isGoldChassis = isSovereign && chassisFinish === 'gold';

    // 1. Foil Treatment & Metallic Light Simulation
    let background: string;
    let color: string;
    let filter: string;
    let textShadow: string;

    if (foilColor === 'gold') {
      // 24K Imperial Gold Foil Inscription
      background =
        'linear-gradient(180deg, #FFF9D9 0%, #F5D77F 25%, #D4AF37 50%, #A87618 78%, #78520C 100%)';
      color = '#F5D77F';
      // Laser physical deboss: top groove shadow + micro bottom specular catch
      filter = 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.95)) drop-shadow(0 -0.5px 0.5px rgba(0, 0, 0, 0.6))';
      textShadow = '0 0.5px 1px rgba(255, 248, 220, 0.4)';
    } else if (foilColor === 'silver') {
      // Liquid Sterling Silver / Platinum Chrome
      background =
        'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 25%, #CBD5E1 55%, #94A3B8 80%, #64748B 100%)';
      color = '#F8FAFC';
      filter = 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.95)) drop-shadow(0 -0.5px 0.5px rgba(0, 0, 0, 0.5))';
      textShadow = '0 0.5px 1px rgba(255, 255, 255, 0.6)';
    } else if (foilColor === 'black') {
      // Deep Laser Anneal / Solid Obsidian Black
      background = '#000000';
      color = '#000000';
      filter = 'drop-shadow(0 0.5px 0.5px rgba(255, 255, 255, 0.8)) drop-shadow(0 -0.5px 0.5px rgba(0, 0, 0, 0.9))';
      textShadow = '0 0.5px 1px rgba(255, 255, 255, 0.4)';
    } else {
      // Diamond Crisp White Laser Engraving
      if (isWhiteChassis) {
        // High-contrast etched dark charcoal only when chassis is literally white Sovereign
        background = '#09090b';
        color = '#09090b';
        filter = 'drop-shadow(0 0.5px 0.5px rgba(255, 255, 255, 0.85)) drop-shadow(0 -0.5px 0.5px rgba(0, 0, 0, 0.95))';
        textShadow = '0 0.5px 0.5px rgba(255, 255, 255, 0.5)';
      } else {
        // Ultra-clear, crisp pure white with high-contrast shadow outline for colored/dark pens
        background = '#FFFFFF';
        color = '#FFFFFF';
        filter =
          'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.95)) drop-shadow(0 -0.5px 1px rgba(0, 0, 0, 0.85))';
        textShadow =
          '0 1px 3px rgba(0, 0, 0, 0.95), 0 0 1px rgba(0, 0, 0, 0.9), 0 0 4px rgba(255, 255, 255, 0.6)';
      }
    }

    const isGradient = foilColor === 'gold' || foilColor === 'silver';

    return {
      fontFamily: getFontFamily(font),
      fontStyle: getFontStyle(font),
      fontWeight: getFontWeight(font),
      ...(isGradient
        ? {
            background,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }
        : {
            color,
            WebkitTextFillColor: color,
          }),
      filter,
      textShadow,
      letterSpacing: activeZone.letterSpacing || textFitting.letterSpacing,
      opacity: 0.98,
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
    <div className="relative w-full rounded-3xl overflow-hidden select-none border border-neutral-200 bg-white shadow-sm">
      {/* ========================================================= */}
      {/* 1. PRISTINE WHITE ATELIER BACKGROUND                      */}
      {/* ========================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden bg-white">
        {/* Soft subtle ambient depth on pure white */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-[100px] opacity-30 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(240,240,240,0.5) 50%, transparent 80%)',
          }}
        />
      </div>

      {/* ========================================================= */}
      {/* 2. ATELIER HEADER BAR (TOP CONTROLS)                     */}
      {/* ========================================================= */}
      <div className="relative z-20 px-5 sm:px-7 py-3.5 flex items-center justify-between border-b border-neutral-100 bg-white/95 backdrop-blur-md">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-2 h-2 rounded-full bg-black animate-pulse" />
          <span className="text-[11px] sm:text-xs font-semibold tracking-widest uppercase text-neutral-500">
            Atelier Live Optical Studio &bull;{' '}
            <span className="text-black font-bold">1:1 Precision Scale</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Zone Guide */}
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
              showGuide
                ? 'bg-black text-white border-black shadow-xs'
                : 'bg-white text-neutral-600 border-neutral-200 hover:text-black hover:border-black'
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
            className="p-1.5 rounded-full bg-white hover:bg-neutral-50 text-neutral-600 hover:text-black border border-neutral-200 hover:border-black transition-all cursor-pointer"
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
          <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase font-bold">
            DSL Horological Grade
          </span>
          <span className="text-xs font-bold text-slate-900 tracking-wide">{product.name}</span>
        </div>

        {/* Chassis Material Quick-Switch Pills (Top Right) - Exclusively for Sovereign Masterpiece */}
        {isSovereign && onChassisChange && (
          <div className="absolute top-5 right-5 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-slate-200 p-1 rounded-full shadow-md">
            <button
              type="button"
              onClick={() => onChassisChange('white')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                chassisFinish === 'white'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-slate-600 hover:text-black'
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
                  ? 'bg-black text-white shadow-xs'
                  : 'text-slate-600 hover:text-black'
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
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-black'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-800 border border-slate-900 inline-block" />
              <span>Stealth Noir</span>
            </button>

            <button
              type="button"
              onClick={() => onChassisChange('gold')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                chassisFinish === 'gold'
                  ? 'bg-amber-100 text-amber-950 font-black shadow-xs'
                  : 'text-slate-600 hover:text-black'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#FFE37A] border border-amber-600 inline-block" />
              <span>24K Gold</span>
            </button>
          </div>
        )}

        {/* Center Pen Assembly */}
        <div
          className={`relative w-full max-w-3xl transition-transform duration-500 ease-out select-none ${
            isZoomed ? 'scale-125 sm:scale-135' : 'scale-100'
          }`}
        >
          {/* Main Horizontal Pen Visual with 1:1 Percentage-Anchored Overlay */}
          <div className="relative w-full aspect-[707/110] flex items-center justify-center">
            <img
              src={penImageSrc}
              alt={product.name}
              draggable={false}
              className="w-full h-auto object-contain filter drop-shadow-[0_18px_25px_rgba(0,0,0,0.22)] transition-all duration-300"
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
                className="absolute rounded border border-dashed border-slate-900/80 bg-slate-900/[0.04] pointer-events-none flex items-center justify-center transition-all duration-300 shadow-sm"
              >
                {/* Corner Precision Reticle Crosshairs */}
                <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-slate-900" />
                <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-slate-900" />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-slate-900" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-slate-900" />

                {/* Target Zone Label Floating Above Reticle */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="text-[8px] sm:text-[9px] font-mono tracking-widest uppercase text-white bg-black px-2.5 py-0.5 rounded border border-slate-800 shadow-md">
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
                  className="text-sm sm:text-base md:text-lg lg:text-xl font-bold leading-none select-none"
                >
                  {engravingText}
                </span>
              ) : (
                <span className="text-[10px] sm:text-xs font-sans text-slate-400/80 italic tracking-wider">
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
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-300 to-transparent" />

            {/* Inverted Pen Mirror Reflection */}
            <div
              className="w-full opacity-15 filter blur-[0.7px] transform scale-y-[-1] origin-top"
              style={{
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 65%)',
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 65%)',
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
      <div className="relative z-20 px-5 sm:px-7 py-3 border-t border-slate-200/80 backdrop-blur-md bg-white/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="text-slate-900 font-bold">✦</span>
            <span>
              Position: <strong className="text-slate-950 font-bold">{positionLabel}</strong>
            </span>
          </div>
          <div className="w-px h-3 bg-slate-200" />
          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="text-slate-900 font-bold">✦</span>
            <span>
              Style: <strong className="text-slate-950 font-bold">{font}</strong>
            </span>
          </div>
          <div className="w-px h-3 bg-slate-200" />
          <div className="flex items-center gap-1.5 text-slate-700">
            <span className="text-slate-900 font-bold">✦</span>
            <span>
              Colour:{' '}
              <strong className="text-slate-950 font-bold capitalize">
                {foilColor === 'white'
                  ? 'Crisp White'
                  : foilColor === 'black'
                  ? 'Deep Black'
                  : foilColor === 'silver'
                  ? 'Liquid Silver'
                  : '24K Gold'}
              </strong>
            </span>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 font-mono tracking-tight text-center sm:text-right">
          0.02mm Micrometric Fiber Laser &bull; Non-Corrosive Depth Etch
        </p>
      </div>
    </div>
  );
};
