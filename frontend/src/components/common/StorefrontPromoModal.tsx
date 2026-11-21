'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Sparkles, ArrowRight, Copy, Check, Volume2, VolumeX } from 'lucide-react';
import { bannerService } from '@/services/bannerService';
import { HomepageBanner } from '@/types/banner';
import { isMediaVideo, isYouTubeVideo, getYouTubeEmbedUrl, formatMediaUrl } from '@/lib/mediaUtils';

const DISMISS_KEY = 'dsl_promo_popup_dismissed_until';

export const StorefrontPromoModal: React.FC = () => {
  const [promoBanner, setPromoBanner] = useState<HomepageBanner | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    // Check if user already dismissed the pop-up today
    try {
      const dismissedUntil = localStorage.getItem(DISMISS_KEY);
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
        return;
      }
    } catch {
      // Storage unavailable, proceed safely
    }

    let isMounted = true;
    bannerService
      .getHomepageBanners('POPUP_MODAL')
      .then((banners) => {
        if (!isMounted || !banners || banners.length === 0) return;
        const activePop = banners[0];
        setPromoBanner(activePop);

        // Gentle delay (1.5 seconds) so customer experiences the store first
        const timer = setTimeout(() => {
          if (isMounted) setIsOpen(true);
        }, 1500);

        return () => clearTimeout(timer);
      })
      .catch((err) => {
        console.warn('Failed to load popup advertisement:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    if (dontShowAgain) {
      try {
        // Suppress popup for 24 hours
        localStorage.setItem(DISMISS_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
      } catch {
        // Ignore storage errors
      }
    }
  };

  const handleCopy = (code: string) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  if (!isOpen || !promoBanner) return null;

  const isVideo = isMediaVideo(promoBanner.desktopImage);
  const isYouTube = isYouTubeVideo(promoBanner.desktopImage);
  const ytEmbed = isYouTube ? getYouTubeEmbedUrl(promoBanner.desktopImage) : null;
  const mediaSrc = formatMediaUrl(promoBanner.desktopImage);

  // Extract coupon code if buttonText or subtitle starts with code
  const couponMatch =
    promoBanner.buttonText?.match(/CODE:\s*([A-Za-z0-9_-]+)/i) ||
    promoBanner.subtitle?.match(/CODE:\s*([A-Za-z0-9_-]+)/i);
  const promoCode = couponMatch ? couponMatch[1] : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={promoBanner.title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden animate-scale-up">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3.5 right-3.5 z-30 p-2 rounded-full bg-black/50 hover:bg-black/75 text-white backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-md"
          aria-label="Close Advertisement"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Media Container (Image or Video) */}
        <div className="relative w-full aspect-16/9 bg-slate-900 overflow-hidden">
          {isVideo ? (
            ytEmbed ? (
              <iframe
                src={`${ytEmbed}?autoplay=1&mute=1&controls=1&loop=1`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                title={promoBanner.title}
              />
            ) : (
              <div className="relative w-full h-full">
                <video
                  src={mediaSrc}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setIsMuted((prev) => !prev)}
                  className="absolute bottom-3 right-3 z-20 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute video' : 'Mute video'}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            )
          ) : (
            <img
              src={mediaSrc}
              alt={promoBanner.imageAltText || promoBanner.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.src = '/images/hero/hero_section_2x.png';
              }}
            />
          )}

          {/* Subtitle / Tag Badge */}
          {promoBanner.subtitle && (
            <div className="absolute top-3.5 left-3.5 z-20">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#FFD84D] text-[#10285D] shadow-md">
                <Sparkles className="w-3 h-3 text-[#10285D]" />
                {promoBanner.subtitle}
              </span>
            </div>
          )}
        </div>

        {/* Card Content & Action Area */}
        <div className="p-6 sm:p-7 space-y-4">
          <div className="space-y-1.5 text-left">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              {promoBanner.title}
            </h3>
            {promoBanner.description && (
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                {promoBanner.description}
              </p>
            )}
          </div>

          {/* Optional Promo Coupon Code Pill */}
          {promoCode && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                  Promo Code:
                </span>
                <span className="font-mono font-black text-slate-900 text-sm">{promoCode}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(promoCode)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
          )}

          {/* Action Button & Link */}
          {promoBanner.buttonLink && (
            <div className="pt-1">
              <Link
                href={promoBanner.buttonLink}
                onClick={handleClose}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#08275E] hover:bg-[#0066CC] text-white font-black text-sm shadow-md transition-all active:scale-[0.98]"
              >
                <span>{promoBanner.buttonText || 'Claim Offer & Shop Now'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Don't show again checkbox */}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-medium text-slate-500 hover:text-slate-800">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-[#08275E] focus:ring-[#08275E] cursor-pointer"
              />
              <span>Don&apos;t show this again today</span>
            </label>

            <button
              type="button"
              onClick={handleClose}
              className="text-[11px] text-slate-400 hover:text-slate-700 underline font-medium cursor-pointer"
            >
              No thanks, continue browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
