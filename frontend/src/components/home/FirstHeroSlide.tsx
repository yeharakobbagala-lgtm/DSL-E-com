'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import TextType from '@/components/common/TextType';
import FadeContent from '@/components/common/FadeContent';
import { useTranslation } from '@/services/languageStore';

export const FirstHeroSlide: React.FC = () => {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [slideActive, setSlideActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;

    const check = () => {
      const isVisible =
        !parent.classList.contains('opacity-0') &&
        parent.getAttribute('aria-hidden') !== 'true';
      setSlideActive(isVisible);
    };

    check();

    const observer = new MutationObserver(check);
    observer.observe(parent, { attributes: true, attributeFilter: ['class', 'aria-hidden'] });
    return () => observer.disconnect();
  }, []);

  // Subtle professional entrance animations as specified in requirements:
  const easeCurve = [0.16, 1, 0.3, 1] as const;

  const backRibbonVariants: Variants = {
    hidden: prefersReducedMotion ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: 40, y: -20 },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 1.05, ease: easeCurve, delay: 0.15 },
    },
  };

  const childrenVariants: Variants = {
    hidden: prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 35 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.95, ease: easeCurve, delay: 0.3 },
    },
  };

  const shadowVariants: Variants = {
    hidden: prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.9, ease: 'easeOut', delay: 0.35 },
    },
  };

  const productsVariants: Variants = {
    hidden: prefersReducedMotion ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.95, ease: easeCurve, delay: 0.4 },
    },
  };

  const frontRibbonVariants: Variants = {
    hidden: prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 45 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 1.05, ease: easeCurve, delay: 0.5 },
    },
  };

  const contentVariants: Variants = {
    hidden: prefersReducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.9, ease: easeCurve, delay: 0.25 },
    },
  };

  const handleOurBrandsClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const brandsSection = document.getElementById('our-brands');
    if (brandsSection) {
      e.preventDefault();
      brandsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none flex items-center justify-center bg-[#A5D2F6]"
    >
      {/* ========================================================= */}
      {/* 1. MOBILE VIEW (md:hidden)                                */}
      {/* Exact portrait vertical layout matching uploaded artwork  */}
      {/* ========================================================= */}
      <div className="md:hidden relative w-full h-full flex items-center justify-center overflow-hidden">
        {/* Full-bleed soft blue sky background */}
        <div className="absolute inset-0 w-full h-full pointer-events-none">
          <img
            src="/images/hero 2/hero-background.png"
            alt=""
            className="w-full h-full object-cover object-center pointer-events-none select-none"
            draggable={false}
          />
        </div>

        {/* 575:1024 Portrait Stage */}
        <div
          className="relative h-full flex items-center justify-center"
          style={{
            aspectRatio: '575 / 1024',
            maxHeight: '100%',
            maxWidth: '100%',
          }}
        >
          {/* Mobile Hero Visual Graphic */}
          <img
            src="/images/hero 2/hero-mobile.jpg"
            alt="School Essentials - Stationery Distribution"
            className="w-full h-full object-contain pointer-events-none select-none"
            draggable={false}
          />

          {/* Interactive Accessible CTA Overlay Buttons */}
          <div className="absolute inset-0 w-full h-full pointer-events-auto">
            {/* Button 1: Shop Catalogue */}
            <Link
              href="/shop"
              aria-label="Shop Catalogue"
              className="absolute rounded-full transition-transform active:scale-95 cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-400/50"
              style={{
                left: '14.26%',
                top: '21.28%',
                width: '38.60%',
                height: '4.68%',
              }}
            />

            {/* Button 2: Our Brands */}
            <Link
              href="/#our-brands"
              onClick={handleOurBrandsClick}
              aria-label="Explore Our Brands"
              className="absolute rounded-full transition-transform active:scale-95 cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-400/50"
              style={{
                left: '55.65%',
                top: '21.28%',
                width: '30.26%',
                height: '4.68%',
              }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. DESKTOP VIEW (hidden md:flex)                          */}
      {/* True full-bleed widescreen landscape interactive stage   */}
      {/* ========================================================= */}
      <div className="hidden md:flex relative w-full h-full items-center justify-center overflow-hidden">
        {/* Full-bleed background */}
        <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
          <img
            src="/images/hero 2/hero-background.png"
            alt="DSL Stationery Distribution Background"
            className="w-full h-full object-cover object-center pointer-events-none select-none"
            draggable={false}
          />
        </div>

        {/* 2560:1440 Landscape Stage */}
        <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
          <div
            className="relative h-full flex items-center justify-center"
            style={{
              aspectRatio: '2560 / 1440',
              maxHeight: '100%',
            }}
          >
            {/* RIGHT GROUP: RIBBONS & CHILDREN */}
            <div
              className="absolute inset-0 w-full h-full pointer-events-none origin-bottom-right transition-transform duration-300"
              style={{
                transform: 'scale(1.15) translate(clamp(80px, 9vw, 180px), 0px)',
              }}
            >
              {/* LAYER 2: BACK RIBBON */}
              <motion.div
                className="absolute inset-0 w-full h-full z-10 pointer-events-none"
                initial="hidden"
                animate="visible"
                variants={backRibbonVariants}
              >
                <img
                  src="/images/hero 2/back-ribbon.png"
                  alt=""
                  className="w-full h-full object-contain pointer-events-none"
                  draggable={false}
                  aria-hidden="true"
                />
              </motion.div>

              {/* LAYER 3: CHILDREN */}
              <motion.div
                className="absolute inset-0 w-full h-full z-20 pointer-events-none"
                initial="hidden"
                animate="visible"
                variants={childrenVariants}
              >
                <FadeContent
                  key={slideActive ? 'children-active' : 'children-idle'}
                  trigger="mount"
                  effect="focus"
                  duration={1.2}
                  delay={0.2}
                  blur={12}
                  ease="power2.out"
                  className="w-full h-full"
                  style={{ width: '100%', height: '100%' }}
                >
                  <img
                    src="/images/hero 2/children.png"
                    alt="Smiling school students with backpacks and books"
                    className="w-full h-full object-contain pointer-events-none"
                    draggable={false}
                  />
                </FadeContent>
              </motion.div>

              {/* LAYER 6: FRONT RIBBON */}
              <motion.div
                className="absolute inset-0 w-full h-full z-40 pointer-events-none"
                initial="hidden"
                animate="visible"
                variants={frontRibbonVariants}
              >
                <img
                  src="/images/hero 2/front-ribbon.png"
                  alt=""
                  className="w-full h-full object-contain pointer-events-none"
                  draggable={false}
                  aria-hidden="true"
                />
              </motion.div>
            </div>

            {/* LEFT GROUP: PRODUCTS & STUDIO LIGHTING */}
            <div
              className="absolute inset-0 w-full h-full pointer-events-none origin-bottom-left transition-transform duration-300"
              style={{
                transform: 'scale(1.50) translate(-35px, 35px)',
              }}
            >
              {/* Pedestal Lighting */}
              <div
                className="absolute pointer-events-none z-22 rounded-full blur-2xl opacity-75 -translate-x-10 sm:-translate-x-16 md:-translate-x-20 lg:-translate-x-24 xl:-translate-x-28"
                style={{
                  left: '2%',
                  bottom: '10%',
                  width: '46%',
                  height: '30%',
                  background:
                    'radial-gradient(ellipse at center, rgba(56, 189, 248, 0.45) 0%, rgba(8, 102, 232, 0.18) 45%, transparent 75%)',
                }}
                aria-hidden="true"
              />

              {/* LAYER 4: PRODUCT SHADOW */}
              <motion.div
                className="absolute inset-0 w-full h-full z-25 pointer-events-none origin-bottom-center -translate-x-10 sm:-translate-x-16 md:-translate-x-20 lg:-translate-x-24 xl:-translate-x-28"
                initial="hidden"
                animate="visible"
                variants={shadowVariants}
              >
                <img
                  src="/images/hero 2/product-shadow.png"
                  alt=""
                  className="w-full h-full object-contain pointer-events-none opacity-95 filter drop-shadow-[0_14px_28px_rgba(8,24,64,0.22)]"
                  draggable={false}
                  aria-hidden="true"
                />
              </motion.div>

              {/* LAYER 5: PRODUCT COLLECTION */}
              <motion.div
                className="absolute inset-0 w-full h-full z-30 pointer-events-none origin-bottom-center -translate-x-10 sm:-translate-x-16 md:-translate-x-20 lg:-translate-x-24 xl:-translate-x-28"
                initial="hidden"
                animate="visible"
                variants={productsVariants}
              >
                <FadeContent
                  key={slideActive ? 'products-active' : 'products-idle'}
                  trigger="mount"
                  effect="focus"
                  duration={1.2}
                  delay={0.35}
                  blur={12}
                  ease="power2.out"
                  className="w-full h-full"
                  style={{ width: '100%', height: '100%' }}
                >
                  <img
                    src="/images/hero 2/product-set.png"
                    alt="DSL Stationery Product Collection"
                    className="w-full h-full object-contain pointer-events-none transition-transform duration-300 filter drop-shadow-[0_18px_32px_rgba(8,102,232,0.18)]"
                    draggable={false}
                  />
                </FadeContent>
              </motion.div>
            </div>

            {/* HEADING GROUP: HERO CONTENT & CTA BUTTONS */}
            <motion.div
              className="absolute z-50 pointer-events-none left-[3.5%] top-[1.8%] w-[36%]"
              initial="hidden"
              animate="visible"
              variants={contentVariants}
              style={{
                aspectRatio: '1774 / 887',
              }}
            >
              <div className="relative w-full h-full">
                {/* LAYER 7: HERO CONTENT FRAME */}
                <img
                  src="/images/hero 2/hero-content-frame.png"
                  alt="Stationery Distribution"
                  className="w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_8px_20px_rgba(8,102,232,0.08)]"
                  draggable={false}
                />

                {/* Text typing animation */}
                <div className="absolute top-[22%] left-[3%] w-[94%] h-[50%] flex items-center justify-center text-center pointer-events-auto">
                  <TextType
                    as="h1"
                    text={[
                      t('hero.suppliesWithoutLimits', 'Supplies Without Limits.'),
                      t('hero.schoolEssentials', 'School Essentials.'),
                      t('hero.officeStationery', 'Office Stationery.'),
                      t('hero.directDistribution', 'Direct Distribution.'),
                    ]}
                    typingSpeed={75}
                    pauseDuration={1800}
                    deletingSpeed={45}
                    deleteMode="backspace"
                    typeEffect="fade"
                    mistakes={0.15}
                    cursorStyle="bar"
                    cursorGlide
                    showCursor
                    cursorColor="#087BFF"
                    className="font-fredoka font-bold text-[#081B43] tracking-tight leading-[1.05] text-[clamp(20px,3.1vw,46px)]"
                  />
                </div>

                {/* Interactive CTA overlay buttons */}
                <div className="absolute inset-0 w-full h-full pointer-events-auto">
                  <Link
                    href="/shop"
                    aria-label="Shop Catalogue"
                    className="absolute rounded-full transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-400/50"
                    style={{
                      left: '12.57%',
                      top: '77.57%',
                      width: '40.19%',
                      height: '15.90%',
                    }}
                  />

                  <Link
                    href="/#our-brands"
                    onClick={handleOurBrandsClick}
                    aria-label="Explore Our Brands"
                    className="absolute rounded-full transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-400/50"
                    style={{
                      left: '54.40%',
                      top: '77.90%',
                      width: '33.03%',
                      height: '15.78%',
                    }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirstHeroSlide;
