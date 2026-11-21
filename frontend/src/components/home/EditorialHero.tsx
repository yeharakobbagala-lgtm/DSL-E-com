'use client';

import React from 'react';
import Link from 'next/link';

export const EditorialHero: React.FC = () => {
  return (
    <section className="relative w-full h-screen min-h-screen flex flex-col justify-between overflow-hidden bg-slate-900 text-white select-none">
      {/* ========================================================= */}
      {/* 1. MOBILE VIEW BACKGROUND (md:hidden)                     */}
      {/* Exact portrait artwork matching uploaded reference        */}
      {/* ========================================================= */}
      <div className="md:hidden absolute inset-0 z-0 overflow-hidden bg-[#7EBCE6]">
        <Link href="/home" className="block w-full h-full" aria-label="Enter DSL Storefront">
          <img
            src="/images/welcome-mobile.jpg"
            alt="DSL Enterprises (Pvt) Ltd - Welcome"
            className="w-full h-full object-cover object-center pointer-events-none select-none"
            draggable={false}
          />
        </Link>
      </div>

      {/* ========================================================= */}
      {/* 2. DESKTOP VIEW BACKGROUND (hidden md:block)              */}
      {/* Widescreen video background                               */}
      {/* ========================================================= */}
      <div className="hidden md:block absolute inset-0 z-0 overflow-hidden">
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
          {/* Fallback image if video not loaded */}
          <img
            src="/hero-stationery-hd.jpg"
            alt="DSL Stationery Workspace"
            className="w-full h-full object-cover object-center"
          />
        </video>
        {/* Subtle, soft edge gradients to ensure text stands out without dimming the video */}
        <div className="absolute inset-0 bg-linear-to-b from-black/15 via-transparent to-black/20 pointer-events-none" />
      </div>

      {/* TOP HEADER */}
      <header className="relative z-20 w-full px-4 sm:px-8 lg:px-12 pt-6 sm:pt-8 flex items-center justify-end">
        <Link
          href="/home"
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/70 hover:bg-white/90 md:bg-white/20 md:hover:bg-white/30 border border-white/60 md:border-white/40 text-slate-900 md:text-slate-800 text-xs sm:text-sm font-bold backdrop-blur-md transition-all shadow-md hover:scale-105 active:scale-95"
        >
          <span>Enter Storefront</span>
          <span className="text-[#0866E8] md:text-inherit">&rarr;</span>
        </Link>
      </header>

      {/* CENTER OFFICIAL LOGO LOCKUP (Desktop Only - Mobile already has high-res logo built into artwork) */}
      <div className="hidden md:flex relative z-10 max-w-5xl mx-auto px-6 text-center my-auto py-6 flex-col items-center justify-center">
        <Link href="/home" className="group" title="Enter DSL Storefront">
          <div className="relative flex items-center justify-center py-2 px-2 transition-transform duration-300 group-hover:scale-105">
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
        </Link>
      </div>

      {/* MOBILE BOTTOM ACTION PILL */}
      <div className="md:hidden relative z-10 w-full px-6 pb-8 flex flex-col items-center justify-center">
        <Link
          href="/home"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/85 hover:bg-white text-[#09285C] border border-white/90 text-xs font-black shadow-xl shadow-blue-900/15 backdrop-blur-md active:scale-95 transition-all animate-bounce"
        >
          <span>Enter Storefront</span>
          <span className="text-[#0866E8]">&rarr;</span>
        </Link>
      </div>

      {/* DESKTOP BOTTOM SPACER */}
      <div className="hidden md:block relative z-10 h-10 sm:h-12 w-full pointer-events-none" />
    </section>
  );
};

