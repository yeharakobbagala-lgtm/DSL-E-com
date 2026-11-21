'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Plus } from 'lucide-react';

export interface SearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  emptyMessage?: string;
  className?: string;
  id?: string;
  allowCreate?: boolean;
  createPrefix?: string;
  onCreate?: (name: string) => void;
  allowClear?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = '-- Select an option --',
  searchPlaceholder = 'Type to search...',
  disabled = false,
  required = false,
  emptyMessage = 'No options found',
  className = '',
  id,
  allowCreate = false,
  createPrefix = 'Add new',
  onCreate,
  allowClear = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
        (opt.badge && opt.badge.toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef} id={id}>
      {/* Hidden input for form validation compatibility */}
      {required && (
        <input
          type="text"
          value={value}
          required={required}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}

      {/* Main trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-left flex items-center justify-between transition-all select-none ${
          disabled
            ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
            : isOpen
            ? 'bg-white border-[#0866E8] ring-2 ring-[#0866E8]/20 shadow-xs'
            : 'bg-white hover:border-slate-300 border-slate-200 text-slate-800 cursor-pointer shadow-2xs'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="truncate flex-1 pr-2">
          {selectedOption ? (
            <span className="font-semibold text-slate-900 flex items-center gap-2">
              <span className="truncate">{selectedOption.label}</span>
              {selectedOption.badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#0066CC]">
                  {selectedOption.badge}
                </span>
              )}
            </span>
          ) : value ? (
            <span className="font-semibold text-slate-900 flex items-center gap-2">
              <span className="truncate">{value}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                New
              </span>
            </span>
          ) : (
            <span className="text-slate-400 font-normal">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {allowClear && value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onChange('');
                }
              }}
              className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#0866E8]' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown with search box & filtered list */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-100">
          {/* Search bar inside dropdown */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0866E8] focus:ring-1 focus:ring-[#0866E8]"
                onClick={(e) => e.stopPropagation()}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-56 overflow-y-auto p-1 divide-y divide-slate-50 select-none">
            {/* Create New Item Button if allowed and query is typed */}
            {allowCreate &&
              searchQuery.trim() &&
              !options.some(
                (o) => o.label.toLowerCase() === searchQuery.trim().toLowerCase()
              ) && (
                <button
                  type="button"
                  onClick={() => {
                    const q = searchQuery.trim();
                    if (onCreate) {
                      onCreate(q);
                    } else {
                      onChange(q);
                    }
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left flex items-center gap-2 bg-blue-50/90 text-[#08275E] hover:bg-blue-100 font-bold mb-1 transition-colors cursor-pointer border border-blue-200/80 shadow-2xs"
                >
                  <Plus className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate">
                    {createPrefix}: &quot;{searchQuery.trim()}&quot;
                  </span>
                </button>
              )}

            {/* Clear / None Option if allowClear is true */}
            {allowClear && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={`w-full px-3 py-1.5 rounded-xl text-left text-slate-400 hover:bg-slate-50 hover:text-slate-600 font-medium transition-colors cursor-pointer text-[11px] flex items-center justify-between ${
                  !value ? 'bg-slate-50 text-slate-700 font-bold' : ''
                }`}
              >
                <span>-- None (Empty / No value) --</span>
                {!value && <Check className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
              </button>
            )}

            {filteredOptions.length === 0 &&
            (!allowCreate || !searchQuery.trim()) ? (
              <div className="py-6 px-4 text-center text-slate-400">
                <Search className="w-4 h-4 mx-auto mb-1 opacity-50" />
                <p className="text-[11px] font-medium">{emptyMessage}</p>
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#EAF4FF] text-[#0866E8] font-bold'
                        : opt.disabled
                        ? 'opacity-40 cursor-not-allowed text-slate-400'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="truncate flex-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{opt.label}</span>
                        {opt.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-[#08275E]">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {opt.sublabel && (
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {opt.sublabel}
                        </p>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#0866E8] shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
