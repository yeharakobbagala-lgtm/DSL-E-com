'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  User,
  Heart,
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  LogOut,
  Layers,
  Sparkles,
  Package,
  PenTool,
} from 'lucide-react';
import { Logo } from './Logo';
import { useCartStore } from '@/services/cartStore';
import { useWishlistStore } from '@/services/wishlistStore';
import { useUserStore } from '@/services/userStore';
import { categoryService } from '@/services/categoryService';
import { productService } from '@/services/productService';
import { ProductCategory, Product } from '@/types/product';
import { formatLKR } from '@/lib/currency';
import { useTranslation } from '@/services/languageStore';
import { LanguageSwitcher } from './LanguageSwitcher';

export const Navbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const items = useCartStore((state) => state.items);
  const setDrawerOpen = useCartStore((state) => state.setDrawerOpen);
  const currentUser = useUserStore((state) => state.currentUser);
  const logoutCustomer = useUserStore((state) => state.logoutCustomer);

  const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = useWishlistStore((state) => state.itemCount);
  const { t, language } = useTranslation();
  // Ensure server render and initial client hydration match before applying client locale
  const isTamil = isMounted && language === 'ta';

  // Hydration-safe translation helper for navigation items
  const navText = (key: string, fallback: string) => {
    return isMounted ? t(key, fallback) : fallback;
  };

  useEffect(() => {
    setIsMounted(true);
    setCategories(categoryService.getCategories());

    categoryService
      .fetchCategories()
      .then((cats) => setCategories(cats))
      .catch((err) => console.warn('Failed to fetch categories:', err));

    const unsubCat = categoryService.subscribe(() => {
      setCategories(categoryService.getCategories());
    });

    useUserStore.getState().fetchCurrentUser();

    return () => {
      unsubCat();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsUserDropdownOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const q = searchQuery.trim().toLowerCase();
      const results = productService
        .getAll()
        .filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.brandName.toLowerCase().includes(q) ||
            p.categoryName.toLowerCase().includes(q)
        )
        .slice(0, 5);
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isHomeActive = pathname === '/' || pathname === '/home';
  const isShopActive = pathname.startsWith('/shop') || pathname.startsWith('/categories');
  const isCustomizePenActive = pathname.startsWith('/customize-pen');
  const isFindStationeryActive = pathname.startsWith('/find-my-stationery');
  const isSchoolPackActive = pathname.startsWith('/school-packs');

  const isAboutActive = pathname.startsWith('/about');
  const isFaqActive = pathname.startsWith('/faq');
  const isWishlistActive = pathname.startsWith('/account/wishlist') || pathname === '/wishlist';

  const navItemClass = (isActive: boolean) => {
    // When language is Tamil, typography & padding are scaled down to accommodate longer Tamil wording gracefully
    const sizeClasses = isTamil
      ? 'px-1.5 xl:px-1.5 2xl:px-2 py-0.5 text-[9.5px] xl:text-[10px] 2xl:text-[11px] tracking-tight'
      : 'px-2 xl:px-2.5 2xl:px-3 py-1.5 text-xs xl:text-xs 2xl:text-[13px]';

    if (isCustomizePenActive) {
      return `${sizeClasses} rounded-full font-bold transition-all duration-200 whitespace-nowrap ${isActive
          ? 'bg-white text-[#07080A] font-black shadow-[0_0_20px_rgba(255,255,255,0.45)]'
          : 'text-slate-300 hover:text-white hover:bg-white/10'
        }`;
    }
    return `${sizeClasses} rounded-full font-bold transition-all duration-200 whitespace-nowrap ${isActive
        ? 'bg-[#09285C] text-white shadow-xs'
        : 'text-[#09285C] hover:text-[#0866E8] hover:bg-[#EAF4FF]/50'
      }`;
  };

  const navIconBtnClass = isCustomizePenActive
    ? 'p-1.5 sm:p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer touch-target flex items-center justify-center shrink-0'
    : 'p-1.5 sm:p-2 rounded-full text-[#09285C] hover:text-[#0866E8] hover:bg-[#EAF4FF] transition-colors cursor-pointer touch-target flex items-center justify-center shrink-0';

  return (
    <header className="sticky top-0 z-50 w-full select-none">
      {/* Subtle top brand accent line */}
      <div
        className={`absolute top-0 inset-x-0 h-1 pointer-events-none z-20 ${isCustomizePenActive
            ? 'bg-gradient-to-r from-white/30 via-white to-white/30 shadow-[0_0_12px_rgba(255,255,255,0.6)]'
            : 'bg-gradient-to-r from-[#09285C] via-[#0866E8] to-[#FFD84D]'
          }`}
      />

      {/* Main Navbar Card with restrained glass styling */}
      <div
        className={`relative z-10 w-full rounded-b-2xl sm:rounded-b-3xl transition-colors duration-300 ${isCustomizePenActive
            ? 'bg-[#07080A]/90 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] border-b border-white/20 text-white'
            : 'bg-white/95 backdrop-blur-md shadow-[0_4px_20px_rgba(9,40,92,0.06)] border-b border-slate-100'
          }`}
      >
        <div suppressHydrationWarning className={`w-full max-w-[1720px] mx-auto px-2 sm:px-3 lg:px-3 xl:px-4 2xl:px-6 py-2 sm:py-2.5 flex items-center justify-between ${isTamil ? 'gap-1 lg:gap-1.5 xl:gap-2' : 'gap-1.5 lg:gap-2 xl:gap-3'}`}>

          {/* LEFT: DSL ENTERPRISES BRAND LOGO */}
          <div className="shrink-0 flex items-center">
            <Logo href="/home" variant={isCustomizePenActive ? 'dark' : 'light'} />
          </div>

          {/* CENTER: DESKTOP NAVIGATION LINKS */}
          <nav suppressHydrationWarning className={`hidden lg:flex items-center font-semibold shrink ${isTamil ? 'gap-0.5 xl:gap-0.5 2xl:gap-1 text-[9.5px] xl:text-[10px] 2xl:text-[11px]' : 'gap-0.5 xl:gap-1 text-xs xl:text-xs 2xl:text-[13px]'}`}>
            {/* 1. Home */}
            <Link href="/home" className={navItemClass(isHomeActive)}>
              {navText('nav.home', 'Home')}
            </Link>

            {/* 2. Shop */}
            <Link href="/shop" className={navItemClass(isShopActive)}>
              {navText('nav.shop', 'Shop')}
            </Link>

            {/* 2.5 Customize Pen */}
            <Link
              href="/customize-pen"
              className={`inline-flex items-center ${isTamil ? 'gap-0.5' : 'gap-1'} ${navItemClass(isCustomizePenActive)}`}
            >
              <PenTool className={`${isTamil ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-[#0066CC]`} />
              <span>{navText('nav.customizePen', 'Customize Pen')}</span>
              <span className={`${isTamil ? 'text-[7.5px] px-1 py-0' : 'text-[8.5px] px-1.5 py-0.2'} font-black uppercase tracking-wider bg-[#FFD84D] text-[#09285C] rounded-full`}>
                New
              </span>
            </Link>

            {/* 3. Find My Stationery (Bearista Finder) */}
            <Link
              href="/find-my-stationery"
              className={`inline-flex items-center ${isTamil ? 'gap-0.5' : 'gap-1'} ${navItemClass(isFindStationeryActive)}`}
            >
              <Sparkles className={`${isTamil ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-[#FFD84D]`} />
              <span>{navText('nav.findMyStationery', 'Find My Stationery')}</span>
            </Link>

            {/* 4. School Packs */}
            <Link href="/school-packs" className={navItemClass(isSchoolPackActive)}>
              {navText('nav.schoolPacks', 'School Packs')}
            </Link>

            {/* 7. About Us */}
            <Link href="/about" className={navItemClass(isAboutActive)}>
              {navText('nav.about', 'About Us')}
            </Link>

            {/* 8. FAQ */}
            <Link href="/faq" className={navItemClass(isFaqActive)}>
              {navText('nav.faq', 'FAQ')}
            </Link>
          </nav>

          {/* RIGHT: SEARCH, LANGUAGE, FAV/WISHLIST, PROFILE/USER, CART & MOBILE TOGGLE */}
          <div className="flex items-center gap-1 sm:gap-1.5 xl:gap-2 shrink-0 pr-1 sm:pr-2">
            {/* Desktop Search Button & Popover */}
            <div className="relative shrink-0" ref={searchRef}>
              <button
                type="button"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={navIconBtnClass}
                aria-label="Search products"
                title="Search products"
              >
                <Search className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </button>

              {/* Quick Search Popover */}
              {isSearchOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50 animate-fade-in text-[#09285C]">
                  <form onSubmit={handleSearchSubmit} className="relative">
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('nav.searchPlaceholder')}
                      autoFocus
                      className="w-full bg-[#F7FAFF] border border-slate-200 rounded-full pl-10 pr-4 py-2.5 text-xs text-[#09285C] placeholder-slate-400 focus:outline-hidden focus:border-[#0866E8] focus:bg-white transition-colors"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </form>

                  {/* Suggestions */}
                  {suggestions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                        {t('nav.quickMatches')}
                      </span>
                      {suggestions.map((item) => (
                        <Link
                          key={item.id}
                          href={`/products/${item.slug}`}
                          onClick={() => setIsSearchOpen(false)}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-[#F7FAFF] text-xs text-[#09285C] transition-colors"
                        >
                          <div className="truncate font-medium">{item.name}</div>
                          <span className="text-[11px] font-bold text-[#0866E8] shrink-0 ml-2">
                            {formatLKR(item.priceCents)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Language Switcher */}
            <LanguageSwitcher
              variant="header"
              dark={isCustomizePenActive}
              className="shrink-0"
            />

            {/* Wishlist / Favorite Link */}
            <Link
              href="/account/wishlist"
              className={`relative ${navIconBtnClass}`}
              aria-label={`Wishlist with ${wishlistCount} items`}
              title="My Wishlist"
            >
              <Heart className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              {isMounted && wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9.5px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* User / Profile Icon & Dropdown */}
            <div className="relative shrink-0" ref={userDropdownRef}>
              <button
                type="button"
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className={`relative flex items-center gap-1.5 p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer touch-target ${
                  currentUser
                    ? isCustomizePenActive
                      ? 'text-white bg-white/20 hover:bg-white/30'
                      : 'text-[#0866E8] bg-[#EAF4FF] hover:bg-blue-100'
                    : navIconBtnClass
                }`}
                aria-label={navText('nav.account', 'Account')}
                title={currentUser ? currentUser.name : navText('nav.account', 'Account')}
              >
                <User className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                {currentUser && (
                  <span className="hidden 2xl:inline text-[11px] font-bold max-w-[70px] truncate">
                    {currentUser.name.split(' ')[0]}
                  </span>
                )}
                {currentUser && (
                  <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1.5 ring-white" />
                )}
              </button>

              {isUserDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-fade-in text-xs text-[#09285C]">
                  {currentUser ? (
                    <>
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="font-bold text-[#09285C] truncate">{currentUser.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/account"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="block px-3 py-2 rounded-xl text-[#09285C] hover:bg-[#F7FAFF] font-medium"
                        >
                          {t('nav.profile')}
                        </Link>
                        <Link
                          href="/account/orders"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="block px-3 py-2 rounded-xl text-[#09285C] hover:bg-[#F7FAFF] font-medium"
                        >
                          {t('nav.orderHistory')}
                        </Link>
                        <Link
                          href="/account/wishlist"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="flex items-center justify-between px-3 py-2 rounded-xl text-[#09285C] hover:bg-[#F7FAFF] font-medium"
                        >
                          <span>{t('nav.wishlist')}</span>
                          {wishlistCount > 0 && (
                            <span className="text-[10px] font-bold bg-[#EAF4FF] text-[#0866E8] px-2 py-0.5 rounded-full">
                              {wishlistCount}
                            </span>
                          )}
                        </Link>
                      </div>
                      <div className="pt-1 border-t border-slate-100">
                        <button
                          onClick={async () => {
                            setIsUserDropdownOpen(false);
                            await logoutCustomer();
                            router.push('/home');
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-medium text-left"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{t('nav.signOut')}</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="py-1">
                      <Link
                        href="/login"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="block px-3 py-2 rounded-xl font-bold text-[#0866E8] hover:bg-[#EAF4FF]"
                      >
                        {t('nav.signIn')}
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setIsUserDropdownOpen(false)}
                        className="block px-3 py-2 rounded-xl text-[#09285C] hover:bg-[#F7FAFF] font-medium"
                      >
                        {t('nav.register')}
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Shopping Cart Button */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className={`relative ${navIconBtnClass}`}
              aria-label={`Cart with ${isMounted ? cartItemCount : 0} items`}
              title="Shopping Cart"
            >
              <ShoppingCart className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              {isMounted && cartItemCount > 0 && (
                <span
                  className={`absolute -top-1 -right-1 text-[9.5px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs ${
                    isCustomizePenActive
                      ? 'bg-white text-[#07080A]'
                      : 'bg-[#0866E8] text-white'
                  }`}
                >
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden ml-0.5 ${navIconBtnClass}`}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE NAVIGATION DRAWER */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white/98 backdrop-blur-md border-b border-slate-100 px-5 py-5 space-y-4 animate-fade-in shadow-2xl text-[#09285C] max-h-[calc(100vh-64px)] overflow-y-auto">
          {/* Language Switcher in Mobile Drawer */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
              {t('lang.select', 'Language')}
            </span>
            <LanguageSwitcher variant="mobile-pills" className="w-full" />
          </div>

          {/* Search Input in Mobile Drawer */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('nav.searchPlaceholder')}
              className="w-full bg-[#F7FAFF] border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-base text-[#09285C] placeholder-slate-400 focus:outline-hidden focus:border-[#0866E8]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </form>

          {/* Quick Mascot Banner in Mobile Drawer */}
          <Link
            href="/find-my-stationery"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-[#09285C] to-[#0866E8] text-white shadow-md active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-[#FFD84D]" />
              </div>
              <div>
                <div className="text-xs font-black">{t('nav.findMyStationery')}</div>
                <div className="text-[11px] text-white/80">Find stationery curated for your grade</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-white/80 shrink-0" />
          </Link>

          {/* Navigation Links */}
          <div className="flex flex-col space-y-1 pt-1">
            <Link
              href="/home"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`px-4 py-3 rounded-xl text-sm font-bold transition-colors ${isHomeActive ? 'bg-[#09285C] text-white' : 'text-[#09285C] hover:bg-[#F7FAFF]'
                }`}
            >
              {t('nav.home')}
            </Link>
            <Link
              href="/shop"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`px-4 py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-between ${isShopActive ? 'bg-[#09285C] text-white' : 'text-[#09285C] hover:bg-[#F7FAFF]'
                }`}
            >
              <span>{t('nav.shop')}</span>
              <ArrowRight className={`w-4 h-4 ${isShopActive ? 'text-white' : 'text-slate-400'}`} />
            </Link>
            <Link
              href="/customize-pen"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`px-4 py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-between ${isCustomizePenActive ? 'bg-[#09285C] text-white' : 'text-[#09285C] hover:bg-[#F7FAFF]'
                }`}
            >
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-[#0066CC]" />
                <span>{t('nav.customizePen')}</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                New
              </span>
            </Link>
            <Link
              href="/school-packs"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`px-4 py-3 rounded-xl text-sm font-bold transition-colors ${isSchoolPackActive ? 'bg-[#09285C] text-white' : 'text-[#09285C] hover:bg-[#F7FAFF]'
                }`}
            >
              {t('nav.schoolPacks')}
            </Link>

            <Link
              href="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`px-4 py-3 rounded-xl text-sm font-bold transition-colors ${isAboutActive ? 'bg-[#09285C] text-white' : 'text-[#09285C] hover:bg-[#F7FAFF]'
                }`}
            >
              {t('nav.about')}
            </Link>
            <Link
              href="/faq"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`px-4 py-3 rounded-xl text-sm font-bold transition-colors ${isFaqActive ? 'bg-[#09285C] text-white' : 'text-[#09285C] hover:bg-[#F7FAFF]'
                }`}
            >
              {t('nav.faq')}
            </Link>
            <Link
              href="/contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 rounded-xl text-sm font-bold text-[#09285C] hover:bg-[#F7FAFF] transition-colors"
            >
              {t('nav.contact')}
            </Link>
          </div>

          {/* User Account Quick Section */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            {currentUser ? (
              <div className="flex items-center justify-between w-full">
                <Link
                  href="/account"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 font-bold text-[#09285C] hover:underline"
                >
                  <div className="w-7 h-7 rounded-full bg-[#EAF4FF] text-[#0866E8] flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <span>{currentUser.name}</span>
                </Link>
                <button
                  onClick={async () => {
                    setIsMobileMenuOpen(false);
                    await logoutCustomer();
                    router.push('/home');
                  }}
                  className="text-rose-600 font-bold hover:underline cursor-pointer"
                >
                  {t('nav.signOut')}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 w-full">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 py-2.5 text-center rounded-xl bg-[#0866E8] text-white font-bold flex items-center justify-center gap-1.5"
                >
                  <User className="w-4 h-4" />
                  <span>{t('nav.signIn')}</span>
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 py-2.5 text-center rounded-xl bg-[#F7FAFF] border border-slate-200 text-[#09285C] font-bold"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
