'use client';

import React, { useState, useEffect } from 'react';
import { resolveImageUrl } from '@/lib/image';

interface ProductThumbnailProps {
  src?: string | null;
  alt: string;
  brandName?: string;
  className?: string;
  imgClassName?: string;
  fallbackText?: string;
}

export function ProductThumbnail({
  src,
  alt,
  brandName,
  className = 'w-10 h-10 rounded-lg',
  imgClassName = 'w-full h-full object-contain p-0.5',
  fallbackText,
}: ProductThumbnailProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error when src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const resolved = src ? resolveImageUrl(src) : null;
  const initial = (fallbackText || alt || brandName || 'P')
    .trim()
    .charAt(0)
    .toUpperCase();

  if (!resolved || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-100 text-[#08275E] select-none font-bold overflow-hidden ${className}`}
        title={alt}
      >
        <span className="text-sm font-black leading-none">{initial}</span>
        {brandName && (
          <span className="text-[7px] text-slate-400 uppercase tracking-tighter truncate max-w-full px-0.5">
            {brandName}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden relative ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolved}
        alt={alt}
        onError={() => setHasError(true)}
        loading="lazy"
        className={imgClassName}
      />
    </div>
  );
}
