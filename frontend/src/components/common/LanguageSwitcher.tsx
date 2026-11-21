'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/services/languageStore';
import { LanguageCode } from '@/translations';

interface LanguageSwitcherProps {
  variant?: 'header' | 'footer' | 'mobile-pills';
  className?: string;
  dark?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'header',
  className = '',
  dark = false,
}) => {
  const { language, setLanguage, languages, currentLanguageInfo } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'mobile-pills') {
    return (
      <div className={`flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl ${className}`}>
        {languages.map((l) => {
          const isSelected = language === l.code;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => setLanguage(l.code)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-white text-[#0866E8] shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{l.flag}</span>
              <span>{l.nativeLabel}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span>Language:</span>
        </span>
        <div className="flex items-center bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-xl p-1 shadow-2xs">
          {languages.map((l) => {
            const isSelected = language === l.code;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => setLanguage(l.code)}
                className={`py-1 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-[#0866E8] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{l.flag}</span>
                <span>{l.nativeLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Header Dropdown Variant (Default)
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-full border text-xs font-bold transition-all shadow-2xs cursor-pointer select-none ${
          dark
            ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
            : 'border-slate-200/80 bg-white/90 hover:bg-slate-50 text-[#09285C] hover:border-[#0866E8]/40'
        }`}
        aria-label="Select Language"
        title="Change Language"
      >
        <span className="text-sm leading-none shrink-0">{currentLanguageInfo.flag}</span>
        <span className="hidden 2xl:inline tracking-tight font-bold text-xs">{currentLanguageInfo.nativeLabel}</span>
        <span className="2xl:hidden text-[11px] font-black uppercase tracking-tight">{currentLanguageInfo.code}</span>
        <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-50 animate-fade-in text-xs">
          <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1 flex items-center gap-1">
            <Globe className="w-3 h-3 text-[#0866E8]" />
            <span>Select Language</span>
          </div>
          {languages.map((l) => {
            const isSelected = language === l.code;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  setLanguage(l.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors cursor-pointer text-left ${
                  isSelected
                    ? 'bg-[#F0F7FF] text-[#0866E8] font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">{l.flag}</span>
                  <div>
                    <div className="font-semibold">{l.nativeLabel}</div>
                    <div className="text-[10px] text-slate-400">{l.label}</div>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[#0866E8]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
