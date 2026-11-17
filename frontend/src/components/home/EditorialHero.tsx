'use client';

import React from 'react';
import Link from 'next/link';

export const EditorialHero: React.FC = () => {
  return (
    <section className="relative w-full h-screen min-h-screen flex flex-col justify-between overflow-hidden bg-slate-900 text-white select-none">
      {/* Background Video (High Definition QHD/4K Sharpened & Colorful) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
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
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/20 hover:bg-white/30 border border-white/40 text-slate-800 text-xs sm:text-sm font-bold backdrop-blur-md transition-all shadow-md hover:scale-105"
        >
          Enter Storefront &rarr;
        </Link>
      </header>

      {/* CENTER OFFICIAL LOGO LOCKUP */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center my-auto py-6 flex flex-col items-center justify-center">
        <Link href="/home" className="group" title="Enter DSL Storefront">
          <div className="relative flex items-center justify-center px-8 sm:px-14 md:px-20 py-8 sm:py-12 transition-transform duration-300 group-hover:scale-105">
            {/* Soft horizontal white radial glow backdrop matching reference */}
            <div
              className="absolute inset-0 pointer-events-none rounded-full"
              style={{
                background:
                  'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.85) 45%, rgba(255, 255, 255, 0) 100%)',
              }}
              aria-hidden="true"
            />
            <img
              src="/images/dsl-logo-header.png"
              alt="DSL Enterprises (Pvt) Ltd"
              className="relative z-10 w-auto h-16 sm:h-20 md:h-24 lg:h-28 max-w-[88vw] object-contain drop-shadow-[0_2px_12px_rgba(255,255,255,0.85)] select-none"
              draggable={false}
            />
          </div>
        </Link>
      </div>

      {/* CLEAN BOTTOM SPACER */}
      <div className="relative z-10 h-10 sm:h-12 w-full pointer-events-none" />
    </section>
  );
};

