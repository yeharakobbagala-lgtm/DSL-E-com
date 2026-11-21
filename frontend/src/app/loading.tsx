'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-[99999] w-screen h-screen min-h-screen overflow-hidden bg-slate-900 text-white select-none pointer-events-none flex flex-col justify-between items-center">
      {/* ========================================================= */}
      {/* 1. MOBILE VIEW BACKGROUND (md:hidden)                     */}
      {/* Exact portrait artwork matching uploaded reference        */}
      {/* ========================================================= */}
      <div className="md:hidden absolute inset-0 z-0 overflow-hidden bg-[#7EBCE6]">
        <img
          src="/images/welcome-mobile.jpg"
          alt="DSL Enterprises Loading"
          className="w-full h-full object-cover object-center pointer-events-none select-none"
          draggable={false}
        />
      </div>

      {/* ========================================================= */}
      {/* 2. DESKTOP VIEW BACKGROUND (hidden md:block)              */}
      {/* Widescreen video background                               */}
      {/* ========================================================= */}
      <div className="hidden md:block absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/hero-stationery-hd.jpg"
          className="w-full h-full object-cover object-center scale-[1.005] will-change-transform"
        >
          <source src="/hero-video-4k.mp4" type="video/mp4" />
          <source src="/hero-video-hd.mp4" type="video/mp4" />
          <source src="/hero-video.mp4" type="video/mp4" />
          <img
            src="/hero-stationery-hd.jpg"
            alt="DSL Stationery Workspace"
            className="w-full h-full object-cover object-center"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/35 pointer-events-none" />
      </div>

      {/* Top Animated Progress Loading Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-50 overflow-hidden">
        <div className="h-full w-full bg-gradient-to-r from-[#38BDF8] via-[#FFD21C] to-[#4ADE80] animate-pulse" />
      </div>

      {/* Top Spacer */}
      <div className="relative z-10 h-12 w-full" />

      {/* CENTER OFFICIAL LOGO LOCKUP WITH MIST & LOADING ICON */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center my-auto flex flex-col items-center justify-center space-y-5">
        <div className="hidden md:flex relative items-center justify-center py-2 px-2 transition-transform duration-300">
          {/* Soft Organic Mist Cloud directly hugging the logo without any rectangle */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[105%] max-w-[500px] h-[130px] pointer-events-none rounded-full"
            style={{
              background:
                'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.9) 35%, rgba(255, 255, 255, 0.5) 60%, rgba(255, 255, 255, 0) 85%)',
              filter: 'blur(20px)',
            }}
            aria-hidden="true"
          />

          {/* Very soft outer feather mist */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[115%] max-w-[560px] h-[160px] pointer-events-none rounded-full"
            style={{
              background:
                'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.3) 45%, rgba(255, 255, 255, 0) 80%)',
              filter: 'blur(30px)',
            }}
            aria-hidden="true"
          />

          {/* DSL Official Logo with contoured mist glow following letter contours */}
          <img
            src="/images/dsl-logo-header.png"
            alt="DSL Enterprises (Pvt) Ltd"
            className="relative z-10 w-auto h-16 sm:h-20 md:h-24 lg:h-28 max-w-[88vw] object-contain select-none"
            style={{
              filter:
                'drop-shadow(0 0 6px #ffffff) drop-shadow(0 0 14px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 24px rgba(255, 255, 255, 0.75))',
            }}
            draggable={false}
          />
        </div>

        {/* Loading Icon Pill */}
        <div className="relative z-10 inline-flex items-center gap-2.5 px-4 sm:px-5 py-2 rounded-full bg-white/85 hover:bg-white/95 backdrop-blur-md border border-white/90 shadow-lg shadow-blue-950/15 text-[#102A5E] select-none animate-pulse">
          <Loader2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 animate-spin text-[#006DEB]" />
          <span className="text-xs sm:text-sm font-black text-[#102A5E] tracking-wide">
            Loading...
          </span>
        </div>
      </div>

      {/* Bottom Spacer */}
      <div className="relative z-10 h-12 w-full" />
    </div>
  );
}
