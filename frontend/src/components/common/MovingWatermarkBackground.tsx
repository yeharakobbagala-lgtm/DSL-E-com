'use client';

import React from 'react';

interface MovingWatermarkBackgroundProps {
  className?: string;
  opacity?: number;
  speed?: number; // duration in seconds for one full loop
  direction?: 'diagonal' | 'horizontal' | 'diagonal-reverse';
}

/**
 * MovingWatermarkBackground
 *
 * Renders an ultra-smooth, GPU-accelerated animated watermark background
 * featuring staggered rows of the official DSL logo over a soft pastel sky-blue gradient,
 * matching the user's reference mockup.
 */
export const MovingWatermarkBackground: React.FC<MovingWatermarkBackgroundProps> = ({
  className = '',
  opacity = 0.22,
  speed = 32,
  direction = 'diagonal',
}) => {
  // Tile dimensions: 2 rows of staggered logos per repeat unit
  // Width: 380px, Height: 260px
  // Row 1: logo at (20, 25)
  // Row 2: logo at (210, 155) -> 50% horizontal stagger (190px shift)
  const patternWidth = 380;
  const patternHeight = 260;
  const logoWidth = 195;
  const logoHeight = 65;

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      {/* 1. Base Sky-Blue Gradient matching sampled reference (#e6f2fe to #e1effd) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #eaf4fe 0%, #e2effd 45%, #dbeafc 80%, #e8f3fe 100%)',
        }}
      />

      {/* 2. Soft Ambient Radial Sheen for depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 60% at 50% 30%, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0) 75%)',
        }}
      />
      <div
        className="absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-40 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(186, 218, 255, 0.8) 0%, rgba(219, 234, 254, 0) 70%)',
        }}
      />
      <div
        className="absolute -bottom-40 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-35 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(191, 219, 254, 0.7) 0%, rgba(224, 242, 254, 0) 70%)',
        }}
      />

      {/* 3. Infinite Drifting Watermark Layer */}
      {/* We make the inner container generous with multi-period buffer */}
      {/* and translate it by exactly (-patternWidth, -patternHeight) for a 100% mathematically seamless loop */}
      <div
        className="watermark-drift-container absolute -top-[520px] -left-[760px] w-[calc(100%+1520px)] h-[calc(100%+1040px)]"
        style={{
          opacity,
          willChange: 'transform',
        }}
      >
        <svg
          className="w-full h-full block"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="dsl-watermark-pattern"
              width={patternWidth}
              height={patternHeight}
              patternUnits="userSpaceOnUse"
            >
              {/* Row 1 Logo */}
              <image
                href="/images/dsl-watermark-logo.png"
                x={20}
                y={28}
                width={logoWidth}
                height={logoHeight}
                preserveAspectRatio="xMidYMid meet"
                style={{
                  filter: 'saturate(0.9) brightness(0.95)',
                }}
              />

              {/* Row 2 Logo: Staggered by +190px horizontally */}
              <image
                href="/images/dsl-watermark-logo.png"
                x={20 + patternWidth / 2}
                y={28 + patternHeight / 2}
                width={logoWidth}
                height={logoHeight}
                preserveAspectRatio="xMidYMid meet"
                style={{
                  filter: 'saturate(0.9) brightness(0.95)',
                }}
              />
            </pattern>
          </defs>

          <rect
            width="100%"
            height="100%"
            fill="url(#dsl-watermark-pattern)"
          />
        </svg>
      </div>

      {/* 4. Subtle Top and Bottom Edge Vignettes for smooth transition */}
      <div
        className="absolute inset-x-0 top-0 h-16 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(234, 244, 254, 0.95), transparent)',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(232, 243, 254, 0.95), transparent)',
        }}
      />

      {/* Scoped CSS Keyframe Animation for silky smooth GPU compositor drift */}
      <style jsx>{`
        @keyframes dslWatermarkDrift {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-${patternWidth}px, -${patternHeight}px, 0);
          }
        }

        @keyframes dslWatermarkDriftHorizontal {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-${patternWidth}px, 0, 0);
          }
        }

        .watermark-drift-container {
          animation: ${direction === 'horizontal'
              ? 'dslWatermarkDriftHorizontal'
              : 'dslWatermarkDrift'}
            ${speed}s linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .watermark-drift-container {
            animation: none !important;
            transform: translate3d(0, 0, 0) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MovingWatermarkBackground;
