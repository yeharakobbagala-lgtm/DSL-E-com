'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface WelcomeSplashLoaderProps {
  durationSeconds?: number;
  onFinished?: () => void;
}

export const WelcomeSplashLoader: React.FC<WelcomeSplashLoaderProps> = ({
  durationSeconds = 4,
  onFinished,
}) => {
  const [visible, setVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [progressWidth, setProgressWidth] = useState(0);

  useEffect(() => {
    // Start progress bar animation
    const pTimer = setTimeout(() => {
      setProgressWidth(100);
    }, 50);

    // Countdown interval
    const cInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(cInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto dismiss after duration
    const dismissTimer = setTimeout(() => {
      handleDismiss();
    }, durationSeconds * 1000);

    return () => {
      clearTimeout(pTimer);
      clearInterval(cInterval);
      clearTimeout(dismissTimer);
    };
  }, [durationSeconds]);

  const handleDismiss = () => {
    setVisible(false);
    onFinished?.();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="welcome-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] } }}
          className="fixed inset-0 z-[99999] w-screen h-screen min-h-screen overflow-hidden bg-slate-900 text-white select-none pointer-events-auto flex flex-col justify-between"
        >
          {/* ========================================================= */}
          {/* 1. MOBILE VIEW BACKGROUND (md:hidden)                     */}
          {/* Exact portrait artwork matching uploaded reference        */}
          {/* ========================================================= */}
          <div className="md:hidden absolute inset-0 z-0 overflow-hidden bg-[#7EBCE6]">
            <img
              src="/images/welcome-mobile.jpg"
              alt="DSL Enterprises - Welcome"
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

          {/* Top Progress Loading Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-50 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#38BDF8] via-[#FFD21C] to-[#4ADE80] shadow-[0_0_12px_rgba(56,189,248,0.8)]"
              style={{
                width: `${progressWidth}%`,
                transition: `width ${durationSeconds}s linear`,
              }}
            />
          </div>

          {/* TOP HEADER */}
          <header className="relative z-20 w-full px-4 sm:px-8 lg:px-12 pt-6 sm:pt-8 flex items-center justify-end">
            {/* Quick Skip Button with live countdown */}
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 hover:bg-white/90 md:bg-white/20 md:hover:bg-white/30 border border-white/60 md:border-white/40 text-slate-900 md:text-slate-800 text-xs sm:text-sm font-bold backdrop-blur-md transition-all duration-200 cursor-pointer shadow-lg hover:scale-105 active:scale-95"
              aria-label="Skip intro and go to store"
            >
              <span>Skip</span>
              <span className="w-5 h-5 rounded-full bg-slate-900/10 md:bg-slate-800/10 flex items-center justify-center text-[10px] font-black text-slate-900">
                {timeLeft}s
              </span>
            </button>
          </header>

          {/* CENTER OFFICIAL LOGO LOCKUP (Desktop Only - Mobile already has high-res logo built into artwork) */}
          <div className="hidden md:flex relative z-10 max-w-5xl mx-auto px-6 text-center my-auto py-6 flex-col items-center justify-center">
            <div className="relative flex items-center justify-center py-2 px-2 transition-transform duration-300">
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
          </div>

          {/* MOBILE INTERACTIVE TAP OVERLAY & BOTTOM ACTION PILL */}
          <div className="md:hidden relative z-10 w-full px-6 pb-8 flex flex-col items-center justify-center">
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/85 hover:bg-white text-[#09285C] border border-white/90 text-xs font-black shadow-xl shadow-blue-900/15 backdrop-blur-md active:scale-95 transition-all cursor-pointer animate-bounce"
            >
              <span>Enter Storefront</span>
              <span className="text-[#0866E8]">&rarr;</span>
            </button>
          </div>

          {/* DESKTOP BOTTOM SPACER */}
          <div className="hidden md:block relative z-10 h-10 sm:h-12 w-full pointer-events-none" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeSplashLoader;
