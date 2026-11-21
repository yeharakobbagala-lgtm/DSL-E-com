'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { bannerService } from '@/services/bannerService';
import { HomepageBanner } from '@/types/banner';
import { isMediaVideo, isYouTubeVideo, getYouTubeEmbedUrl, formatMediaUrl } from '@/lib/mediaUtils';
import { SpeedWriteHeroSlide } from './SpeedWriteHeroSlide';
import { FirstHeroSlide } from './FirstHeroSlide';
import { SchoolPackHeroSlide } from './SchoolPackHeroSlide';
import { FindStationeryHeroSlide } from './FindStationeryHeroSlide';

export const HeroRibbonSection: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [dynamicBanners, setDynamicBanners] = useState<HomepageBanner[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);

  // Fetch active hero banners from database (including seeded defaults and admin-created ads)
  useEffect(() => {
    let isMounted = true;
    bannerService
      .getHomepageBanners('HERO')
      .then((data) => {
        if (isMounted) {
          setDynamicBanners(data || []);
          setLoadingBanners(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to load hero banners:', err);
        if (isMounted) setLoadingBanners(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const totalSlides = dynamicBanners.length > 0 ? dynamicBanners.length : 4;

  // Autoplay: slide transition every 6.5s, pauses on hover
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;

    const timer = setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 6500);

    return () => clearTimeout(timer);
  }, [currentSlide, totalSlides, isPaused]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const handleGoTo = (idx: number) => {
    setCurrentSlide(idx);
  };

  // Touch swipe tracking
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }
  };

  return (
    <section
      aria-label="Homepage Hero Carousel"
      className="relative w-full h-[calc(100dvh_-_94px)] sm:h-[calc(100dvh_-_102px)] lg:h-[calc(100dvh_-_106px)] min-h-[520px] overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative w-full h-full overflow-hidden">
        {dynamicBanners.length > 0 ? (
          /* Dynamic Banners from Database (Managed via /admin/banners) */
          dynamicBanners.map((banner, index) => {
            const lowerTitle = banner.title.toLowerCase();
            const desktopImg = banner.desktopImage || '';

            // Render interactive rich components when default banner titles or images match
            const isSpeedPenDefault =
              (lowerTitle.includes('speed') && (lowerTitle.includes('pen') || lowerTitle.includes('write'))) ||
              desktopImg.includes('desktop_1920x1080.png') ||
              desktopImg.includes('speed-hero');
            const isSuppliesDefault =
              lowerTitle.includes('supplies without limits') ||
              (lowerTitle.includes('supplies') && lowerTitle.includes('limits')) ||
              desktopImg.includes('supplies_without_limits');
            const isSchoolPackDefault =
              lowerTitle.includes('school pack') ||
              lowerTitle.includes('schoolpack') ||
              desktopImg.includes('school_pack') ||
              desktopImg.includes('School_Pack');
            const isStationeryFinderDefault =
              lowerTitle.includes('find my stationery') || lowerTitle.includes('smart stationery');

            if (isSpeedPenDefault) {
              return (
                <div
                  key={banner.id}
                  className={`w-full h-full transition-opacity duration-700 ease-in-out ${
                    currentSlide === index
                      ? 'opacity-100 relative z-10 pointer-events-auto'
                      : 'opacity-0 absolute inset-0 z-0 pointer-events-none'
                  }`}
                  aria-hidden={currentSlide !== index}
                >
                  <SpeedWriteHeroSlide />
                </div>
              );
            }

            if (isSuppliesDefault) {
              return (
                <div
                  key={banner.id}
                  className={`w-full h-full transition-opacity duration-700 ease-in-out ${
                    currentSlide === index
                      ? 'opacity-100 relative z-10 pointer-events-auto'
                      : 'opacity-0 absolute inset-0 z-0 pointer-events-none'
                  }`}
                  aria-hidden={currentSlide !== index}
                >
                  <FirstHeroSlide />
                </div>
              );
            }

            if (isSchoolPackDefault) {
              return (
                <div
                  key={banner.id}
                  className={`w-full h-full transition-opacity duration-700 ease-in-out ${
                    currentSlide === index
                      ? 'opacity-100 relative z-10 pointer-events-auto'
                      : 'opacity-0 absolute inset-0 z-0 pointer-events-none'
                  }`}
                  aria-hidden={currentSlide !== index}
                >
                  <SchoolPackHeroSlide />
                </div>
              );
            }

            if (isStationeryFinderDefault) {
              return (
                <div
                  key={banner.id}
                  className={`w-full h-full transition-opacity duration-700 ease-in-out ${
                    currentSlide === index
                      ? 'opacity-100 relative z-10 pointer-events-auto'
                      : 'opacity-0 absolute inset-0 z-0 pointer-events-none'
                  }`}
                  aria-hidden={currentSlide !== index}
                >
                  <FindStationeryHeroSlide />
                </div>
              );
            }

            // Custom Dynamic Banner (Image, Video, Poster, or Custom Typography)
            const isGraphic =
              banner.subtitle === '__GRAPHIC_ONLY__' ||
              (!banner.subtitle && !banner.description && !banner.buttonText);
            const isVideo = isMediaVideo(banner.desktopImage);
            const isYouTube = isYouTubeVideo(banner.desktopImage);

            return (
              <div
                key={banner.id}
                className={`w-full h-full transition-opacity duration-700 ease-in-out ${
                  currentSlide === index
                    ? 'opacity-100 relative z-10 pointer-events-auto'
                    : 'opacity-0 absolute inset-0 z-0 pointer-events-none'
                }`}
                aria-hidden={currentSlide !== index}
              >
                <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
                  {/* Media: Responsive Video or Image */}
                  {isVideo ? (
                    isYouTube ? (
                      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
                        <iframe
                          src={`${getYouTubeEmbedUrl(banner.desktopImage)}?autoplay=1&mute=1&controls=0&loop=1&playlist=${banner.desktopImage.match(/([^#&?]*)$/)?.[0] || ''}`}
                          className="w-full h-full object-cover scale-125"
                          allow="autoplay; encrypted-media"
                          title={banner.title}
                        />
                      </div>
                    ) : (
                      <video
                        src={formatMediaUrl(banner.desktopImage)}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover object-center"
                      />
                    )
                  ) : (
                    <picture className="absolute inset-0 w-full h-full">
                      {banner.mobileImage && (
                        <source media="(max-width: 768px)" srcSet={formatMediaUrl(banner.mobileImage)} />
                      )}
                      <img
                        src={formatMediaUrl(banner.desktopImage)}
                        alt={banner.imageAltText || banner.title}
                        className="w-full h-full object-cover object-center"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          if (img.src.includes(':3000/uploads/')) {
                            img.src = img.src.replace(':3000/uploads/', ':4000/uploads/');
                          }
                        }}
                      />
                    </picture>
                  )}

                  {/* If Ready-Made Graphic with link: Whole banner is clickable */}
                  {isGraphic && banner.buttonLink && (
                    <Link
                      href={banner.buttonLink}
                      className="absolute inset-0 z-20 cursor-pointer block"
                      aria-label={banner.title}
                    />
                  )}

                  {/* Dynamic Typography (Only when not a ready-made graphic) */}
                  {!isGraphic && (
                    <>
                      <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/40 to-transparent z-10 pointer-events-none" />
                      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-12 flex flex-col justify-center h-full">
                        <div className="max-w-2xl text-left space-y-4">
                          {banner.subtitle && (
                            <span className="inline-block px-3 py-1 rounded-full bg-[#FFD84D] text-[#10285D] text-xs font-black uppercase tracking-wider shadow-md">
                              {banner.subtitle}
                            </span>
                          )}
                          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                            {banner.title}
                          </h1>
                          {banner.description && (
                            <p className="text-sm sm:text-base text-slate-200 line-clamp-3 leading-relaxed drop-shadow-sm font-medium">
                              {banner.description}
                            </p>
                          )}
                          {banner.buttonText && banner.buttonLink && (
                            <div className="pt-2">
                              <Link
                                href={banner.buttonLink}
                                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#FFD84D] hover:bg-[#FFE37A] text-[#10285D] font-black text-sm shadow-xl transition-all hover:scale-105 active:scale-95"
                              >
                                <span>{banner.buttonText}</span>
                                <ArrowRight className="w-4 h-4" />
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          /* Offline / Initial Fallback Built-in Slides */
          <>
            <div
              className={`w-full h-full transition-opacity duration-700 ease-in-out ${
                currentSlide === 0
                  ? 'opacity-100 relative z-10 pointer-events-auto'
                  : 'opacity-0 absolute inset-0 z-0 pointer-events-none'
              }`}
              aria-hidden={currentSlide !== 0}
            >
              <SpeedWriteHeroSlide />
            </div>

            <div
              className={`w-full h-full transition-opacity duration-700 ease-in-out ${
                currentSlide === 1
                  ? 'opacity-100 relative z-10 pointer-events-auto'
                  : 'opacity-0 absolute inset-0 z-0 pointer-events-none'
              }`}
              aria-hidden={currentSlide !== 1}
            >
              <FirstHeroSlide />
            </div>

            <div
              className={`w-full h-full transition-opacity duration-700 ease-in-out ${
                currentSlide === 2
                  ? 'opacity-100 relative z-10 pointer-events-auto'
                  : 'opacity-0 absolute inset-0 z-0 pointer-events-none'
              }`}
              aria-hidden={currentSlide !== 2}
            >
              <SchoolPackHeroSlide />
            </div>

            <div
              className={`w-full h-full transition-opacity duration-700 ease-in-out ${
                currentSlide === 3
                  ? 'opacity-100 relative z-10 pointer-events-auto'
                  : 'opacity-0 absolute inset-0 z-0 pointer-events-none'
              }`}
              aria-hidden={currentSlide !== 3}
            >
              <FindStationeryHeroSlide />
            </div>
          </>
        )}
      </div>

      {/* ========================================================= */}
      {/* NAVIGATION CONTROLS: PREVIOUS & NEXT ARROWS               */}
      {/* ========================================================= */}
      {totalSlides > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous Hero Slide"
            className="hidden sm:flex absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/85 hover:bg-[#102A5E] text-[#102A5E] hover:text-white backdrop-blur-md shadow-lg shadow-blue-950/10 border border-slate-200/60 items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next Hero Slide"
            className="hidden sm:flex absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/85 hover:bg-[#102A5E] text-[#102A5E] hover:text-white backdrop-blur-md shadow-lg shadow-blue-950/10 border border-slate-200/60 items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* UNIFIED CONTROLS PILL (INDICATOR DOTS) */}
          <div className="flex absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-md shadow-blue-950/10">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous Hero Slide"
              className="flex sm:hidden items-center justify-center w-5 h-5 text-[#102A5E] hover:text-[#087BFF] active:scale-90"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {Array.from({ length: totalSlides }, (_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleGoTo(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  currentSlide === idx
                    ? 'w-6 sm:w-8 h-2 sm:h-2.5 bg-[#087BFF]'
                    : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}

            <button
              type="button"
              onClick={handleNext}
              aria-label="Next Hero Slide"
              className="flex sm:hidden items-center justify-center w-5 h-5 text-[#102A5E] hover:text-[#087BFF] active:scale-90"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}
    </section>
  );
};
