'use client';

import React from 'react';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  href?: string;
  variant?: 'light' | 'dark';
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  href = '/home',
  variant = 'light',
  showSubtitle = true,
}) => {
  const isDark = variant === 'dark';

  return (
    <Link
      href={href}
      className={`inline-flex items-center group select-none ${className}`}
      title="DSL Enterprises (Pvt) Ltd - Stationery Distributors"
    >
      <div className="flex flex-col items-start justify-center">
        <img
          src="/images/dsl-logo-header.png"
          alt="DSL Enterprises (Pvt) Ltd"
          className="h-7.5 sm:h-8.5 md:h-9 lg:h-9.5 xl:h-10 2xl:h-11.5 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
        />
        {showSubtitle && (
          <span
            className={`text-[8px] sm:text-[8.5px] md:text-[9px] font-black uppercase tracking-[0.24em] pl-10 sm:pl-12 md:pl-14 -mt-0.5 hidden sm:block ${
              isDark ? 'text-sky-200/90' : 'text-[#102A5E]/85'
            }`}
          >
            Stationery Distributors
          </span>
        )}
      </div>
    </Link>
  );
};
