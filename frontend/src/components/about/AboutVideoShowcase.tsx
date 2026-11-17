'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  Ship,
  Train,
  Castle,
  Compass,
  BookOpen,
} from 'lucide-react';

export default function AboutVideoShowcase() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Attempt auto-play when component mounts
    if (videoRef.current) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration || 1;
    setProgress((current / total) * 100);
  };

  return (
    <section className="relative py-20 sm:py-28 bg-[#FAF8F5] border-t border-b border-stone-200/60 overflow-hidden">
      {/* Decorative ambient background accents */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-emerald-100/40 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-amber-100/40 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Narrative & Editions Timeline */}
          <div className="lg:col-span-7 space-y-7 text-center lg:text-left">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EBF3E5] border border-[#CDE1BF] text-[#3D6622] text-xs font-bold uppercase tracking-wider mb-3">
                <BookOpen className="w-3.5 h-3.5 text-[#4C802B]" />
                <span>Colombo International Book Fair • BMICH</span>
              </div>

              <h2 className="text-2xl sm:text-4xl md:text-[42px] font-extrabold text-[#1F2937] tracking-tight leading-tight">
                Building Worlds of Imagination
              </h2>

              <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed mt-4">
                Every year, <strong>DSL</strong> transforms the <strong>Kids Corner</strong> at the Colombo
                International Book Fair held at BMICH into a world of wonder! We create unforgettable, immersive
                spaces where children can explore, play, dream, and discover the true joy of books and creative
                expression.
              </p>
            </div>

            {/* 3 Iconic Edition Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              {/* 2023: Giant Ship */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs text-left group hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
                    <Ship className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-sky-800 bg-sky-100/70 px-2 py-0.5 rounded-full">
                    2023
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-[#1F2937]">The Giant Ship</h4>
                <p className="text-[11px] text-[#6B7280] mt-1 leading-snug">
                  Sailing aboard a giant exploration ship of reading and discovery.
                </p>
              </div>

              {/* 2024: Nine Arches Bridge & Railway */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs text-left group hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Train className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                    2024
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-[#1F2937]">Nine Arches Railway</h4>
                <p className="text-[11px] text-[#6B7280] mt-1 leading-snug">
                  Bringing Sri Lanka&apos;s iconic bridge &amp; railway voyage to life.
                </p>
              </div>

              {/* 2025: Two-Story Castle (Featured in Video) */}
              <div className="bg-[#FAF5EC] p-4 rounded-2xl border border-amber-200/90 shadow-xs text-left group hover:shadow-md transition-shadow relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Castle className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    2025 Live
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-[#1F2937]">Magical Castle</h4>
                <p className="text-[11px] text-[#6B7280] mt-1 leading-snug">
                  Stepping into an enchanting two-story castle of arts and books.
                </p>
              </div>
            </div>

            {/* Adventure teaser banner */}
            <div className="pt-2">
              <div className="inline-flex items-center gap-2.5 bg-white/90 border border-[#D5E5C9] px-4 py-2.5 rounded-2xl shadow-xs text-xs sm:text-[13px] text-[#2C481A] font-semibold">
                <Sparkles className="w-4 h-4 text-[#4C802B] shrink-0" />
                <span>
                  And the adventure doesn&apos;t stop there... <em>something new is waiting to be discovered!</em>
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Sleek Portrait Video Player Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative group w-full max-w-[320px] sm:max-w-[350px]">
              {/* Outer Decorative Glow */}
              <div className="absolute -inset-2.5 bg-gradient-to-tr from-[#5D7A3E]/30 via-emerald-400/20 to-amber-300/30 rounded-[44px] blur-xl opacity-70 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Video Container (Portrait 9:16 Frame) */}
              <div className="relative rounded-[36px] sm:rounded-[40px] overflow-hidden bg-black shadow-2xl border-4 border-white ring-1 ring-black/10 aspect-[9/16]">
                <video
                  ref={videoRef}
                  src="/images/about/about-story-video.mp4"
                  playsInline
                  autoPlay
                  loop
                  muted={isMuted}
                  onTimeUpdate={handleTimeUpdate}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={togglePlay}
                />

                {/* Top Overlay Badge */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
                  <div className="inline-flex items-center gap-1.5 bg-black/65 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-white border border-white/20">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span>2025 Castle</span>
                  </div>
                  <div className="bg-black/55 backdrop-blur-md px-2.5 py-1 rounded-full text-[10.5px] text-white/90 border border-white/10 font-medium">
                    BMICH Kids Corner
                  </div>
                </div>

                {/* Big Center Play/Pause button on hover or pause */}
                {(!isPlaying || isMuted) && (
                  <div
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/25 backdrop-blur-[2px] transition-all cursor-pointer z-10"
                  >
                    {!isPlaying ? (
                      <button
                        type="button"
                        aria-label="Play Video"
                        className="w-16 h-16 rounded-full bg-white/90 hover:bg-white text-[#1F2937] shadow-xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                      >
                        <Play className="w-7 h-7 fill-[#1F2937] translate-x-0.5" />
                      </button>
                    ) : (
                      isMuted && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMute();
                          }}
                          className="bg-black/75 hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-full backdrop-blur-md border border-white/20 shadow-lg flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
                        >
                          <VolumeX className="w-4 h-4 text-amber-300" />
                          <span>Tap for Sound</span>
                        </button>
                      )
                    )}
                  </div>
                )}

                {/* Bottom Control Bar */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-10 z-20 flex flex-col gap-2.5">
                  {/* Progress Line */}
                  <div className="w-full bg-white/25 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full transition-all duration-150"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between text-white text-xs">
                    <button
                      type="button"
                      onClick={togglePlay}
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                      className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={toggleMute}
                      className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-medium transition-colors"
                    >
                      {isMuted ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>Unmute</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Mute</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
