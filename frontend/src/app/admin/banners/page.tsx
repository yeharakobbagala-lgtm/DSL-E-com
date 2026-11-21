'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Eye,
  Trash2,
  Copy,
  Edit,
  ArrowUp,
  ArrowDown,
  Calendar,
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  X,
  ExternalLink,
  Laptop,
  Smartphone,
  RefreshCw,
  Layout,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronLeft,
  Check,
  Link as LinkIcon,
  Megaphone,
  Video,
  Play,
  Film,
  Gift,
  ShoppingBag,
  Tv,
  Power,
  SlidersHorizontal,
} from 'lucide-react';
import { bannerService } from '@/services/bannerService';
import { HomepageBanner, BannerStatus, CreateBannerInput, UpdateBannerInput } from '@/types/banner';
import { BlueRibbonManager } from '@/components/admin/BlueRibbonManager';
import { AdminPageAccess } from '@/components/admin/AdminPageAccess';
import { useUserStore } from '@/services/userStore';
import {
  isMediaVideo,
  isYouTubeVideo,
  getYouTubeEmbedUrl,
  getYouTubeVideoId,
  formatMediaUrl,
} from '@/lib/mediaUtils';

const PLACEMENT_OPTIONS = [
  {
    value: 'HERO',
    label: 'Top Hero Slider',
    badge: 'Homepage Top',
    desc: 'Main wide slide or video playing at the very top of the homepage',
    icon: Layout,
  },
  {
    value: 'MID_PAGE_PROMO',
    label: 'Middle Page Promo',
    badge: 'Between Products',
    desc: 'Eye-catching promo bar or video showcase between product sections',
    icon: Sparkles,
  },
  {
    value: 'POPUP_MODAL',
    label: 'Welcome Pop-up Card',
    badge: 'Visitor Pop-up',
    desc: 'Special card with photo/video shown when visitors arrive at your website',
    icon: Gift,
  },
  {
    value: 'SHOP_BANNER',
    label: 'Shop Page Banner',
    badge: 'Shop Header',
    desc: 'Promo banner shown on top of the shop and product browsing catalog',
    icon: ShoppingBag,
  },
  {
    value: 'SPOTLIGHT',
    label: 'Spotlight Feature',
    badge: 'Curated Block',
    desc: 'Featured category, brand, or seasonal stationery highlight',
    icon: Layers,
  },
];

const QUICK_LINKS = [
  { label: 'Shop All', path: '/shop' },
  { label: 'Promotions', path: '/offers' },
  { label: 'School Packs', path: '/school-packs' },
  { label: 'Booklists', path: '/booklist-upload' },
  { label: 'Cart', path: '/cart' },
];

export default function AdminBannersPage() {
  const hasPermission = useUserStore((state) => state.hasPermission);
  const [banners, setBanners] = useState<HomepageBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Active Tab: Store Advertisements vs Blue Line Marquee
  const [activeTab, setActiveTab] = useState<'banners' | 'blueribbon'>('banners');

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | BannerStatus>('ALL');
  const [placementFilter, setPlacementFilter] = useState<'ALL' | string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formStep, setFormStep] = useState<1 | 2 | 3>(1);
  const [editingBanner, setEditingBanner] = useState<HomepageBanner | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isGraphicBanner, setIsGraphicBanner] = useState(false);

  // Media selector: Photo vs Video
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');

  // Form fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [desktopImage, setDesktopImage] = useState('');
  const [mobileImage, setMobileImage] = useState('');
  const [imageAltText, setImageAltText] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonLink, setButtonLink] = useState('');
  const [placement, setPlacement] = useState<string>('HERO');
  const [sortOrder, setSortOrder] = useState(0);
  const [status, setStatus] = useState<BannerStatus>('PUBLISHED');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');

  // Upload state
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const desktopFileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);

  // Preview modal state
  const [previewBanner, setPreviewBanner] = useState<HomepageBanner | null>(null);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>('desktop');

  // Action states
  const [busyBannerId, setBusyBannerId] = useState<string | null>(null);

  // Load banners on mount or status filter change
  const loadBanners = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: { status?: BannerStatus; search?: string } = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const data = await bannerService.getAdminBanners(params);
      setBanners(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load advertisements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, [statusFilter]);

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const openCreateModal = () => {
    setEditingBanner(null);
    setFormStep(1);
    setIsGraphicBanner(false);
    setMediaType('image');
    setTitle('');
    setSubtitle('');
    setDescription('');
    setDesktopImage('');
    setMobileImage('');
    setImageAltText('');
    setButtonText('');
    setButtonLink('');
    setPlacement('HERO');
    setSortOrder(banners.length > 0 ? Math.max(...banners.map((b) => b.sortOrder)) + 1 : 0);
    setStatus('PUBLISHED');
    setStartAt('');
    setEndAt('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (banner: HomepageBanner) => {
    setEditingBanner(banner);
    setFormStep(1);
    const isGraphic =
      banner.subtitle === '__GRAPHIC_ONLY__' ||
      (!banner.subtitle && !banner.description && !banner.buttonText);
    setIsGraphicBanner(isGraphic);

    const isVideo = isMediaVideo(banner.desktopImage);
    setMediaType(isVideo ? 'video' : 'image');

    setTitle(banner.title);
    setSubtitle(banner.subtitle === '__GRAPHIC_ONLY__' ? '' : (banner.subtitle || ''));
    setDescription(banner.description || '');
    setDesktopImage(banner.desktopImage);
    setMobileImage(banner.mobileImage || '');
    setImageAltText(banner.imageAltText || banner.title);
    setButtonText(banner.buttonText || '');
    setButtonLink(banner.buttonLink || '');
    setPlacement(banner.placement || 'HERO');
    setSortOrder(banner.sortOrder);
    setStatus(banner.status);
    setStartAt(banner.startAt ? new Date(banner.startAt).toISOString().slice(0, 16) : '');
    setEndAt(banner.endAt ? new Date(banner.endAt).toISOString().slice(0, 16) : '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (file: File, target: 'desktop' | 'mobile') => {
    try {
      if (target === 'desktop') setUploadingDesktop(true);
      else setUploadingMobile(true);

      const url = await bannerService.uploadBannerImage(file);
      if (target === 'desktop') {
        setDesktopImage(url);
        if (isMediaVideo(url)) {
          setMediaType('video');
        }
      } else {
        setMobileImage(url);
      }
      showNotification(`${file.type.startsWith('video/') ? 'Video' : 'Image'} uploaded successfully!`);
    } catch (err: any) {
      setFormError(err?.message || `Failed to upload ${target} file`);
    } finally {
      if (target === 'desktop') setUploadingDesktop(false);
      else setUploadingMobile(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Please enter a headline or reference title (Step 1)');
      setFormStep(1);
      return;
    }
    if (!desktopImage.trim()) {
      setFormError(
        mediaType === 'video'
          ? 'Please upload a video or paste a YouTube / MP4 video link (Step 2)'
          : 'Please upload an image or paste an image link (Step 2)'
      );
      setFormStep(2);
      return;
    }
    if (!imageAltText.trim()) {
      setImageAltText(title.trim());
    }
    if (startAt && endAt && new Date(startAt).getTime() >= new Date(endAt).getTime()) {
      setFormError('Schedule start date must be before end date (Step 3)');
      setFormStep(3);
      return;
    }

    try {
      setFormSubmitting(true);
      const payload: CreateBannerInput = {
        title: title.trim(),
        subtitle: isGraphicBanner ? '__GRAPHIC_ONLY__' : (subtitle.trim() || null),
        description: isGraphicBanner ? null : (description.trim() || null),
        desktopImage: desktopImage.trim(),
        mobileImage: mobileImage.trim() || null,
        imageAltText: imageAltText.trim() || title.trim(),
        buttonText: isGraphicBanner ? null : (buttonText.trim() || null),
        buttonLink: buttonLink.trim() || null,
        placement: placement || 'HERO',
        sortOrder: Number(sortOrder),
        status,
        startAt: startAt ? new Date(startAt).toISOString() : null,
        endAt: endAt ? new Date(endAt).toISOString() : null,
      };

      if (editingBanner) {
        await bannerService.updateBanner(editingBanner.id, payload as UpdateBannerInput);
        showNotification(`Advertisement "${title}" updated successfully`);
      } else {
        await bannerService.createBanner(payload);
        showNotification(`Advertisement "${title}" created successfully`);
      }

      setIsModalOpen(false);
      loadBanners();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save advertisement');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (banner: HomepageBanner) => {
    if (!window.confirm(`Are you sure you want to delete advertisement "${banner.title}"?`)) {
      return;
    }
    try {
      setBusyBannerId(banner.id);
      await bannerService.deleteBanner(banner.id);
      showNotification(`Advertisement "${banner.title}" deleted successfully`);
      setBanners((prev) => prev.filter((b) => b.id !== banner.id));
    } catch (err: any) {
      alert(err?.message || 'Failed to delete advertisement');
    } finally {
      setBusyBannerId(null);
    }
  };

  const handleToggleStatus = async (banner: HomepageBanner) => {
    try {
      setBusyBannerId(banner.id);
      const newStatus: BannerStatus = banner.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      await bannerService.updateBanner(banner.id, { status: newStatus });
      const effective: 'ACTIVE' | 'DRAFT' = newStatus === 'PUBLISHED' ? 'ACTIVE' : 'DRAFT';
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, status: newStatus, effectiveStatus: effective } : b))
      );
      showNotification(
        newStatus === 'PUBLISHED'
          ? `"${banner.title}" is now LIVE on your store!`
          : `"${banner.title}" set to Draft (hidden from store).`
      );
    } catch (err: any) {
      alert(err?.message || 'Failed to toggle status');
    } finally {
      setBusyBannerId(null);
    }
  };

  const handleDuplicate = async (banner: HomepageBanner) => {
    try {
      setBusyBannerId(banner.id);
      const duplicate = await bannerService.duplicateBanner(banner.id);
      showNotification(`Duplicated as "${duplicate.title}" (Draft)`);
      loadBanners();
    } catch (err: any) {
      alert(err?.message || 'Failed to duplicate advertisement');
    } finally {
      setBusyBannerId(null);
    }
  };

  const handleMoveOrder = async (bannerIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? bannerIndex - 1 : bannerIndex + 1;
    if (targetIndex < 0 || targetIndex >= filteredBanners.length) return;

    const newBanners = [...banners];
    const currentBanner = filteredBanners[bannerIndex];
    const targetBanner = filteredBanners[targetIndex];

    const currentIdx = newBanners.findIndex((b) => b.id === currentBanner.id);
    const targetIdx = newBanners.findIndex((b) => b.id === targetBanner.id);
    if (currentIdx === -1 || targetIdx === -1) return;

    // Swap sortOrders
    const tempOrder = currentBanner.sortOrder;
    currentBanner.sortOrder = targetBanner.sortOrder;
    targetBanner.sortOrder = tempOrder;

    // Swap positions in list
    newBanners[currentIdx] = targetBanner;
    newBanners[targetIdx] = currentBanner;

    setBanners([...newBanners]);

    try {
      await bannerService.reorderBanners(
        newBanners.map((b, idx) => ({ id: b.id, sortOrder: idx }))
      );
      showNotification('Advertisement display order updated');
    } catch (err: any) {
      alert(err?.message || 'Failed to update order');
      loadBanners();
    }
  };

  const getStatusBadge = (banner: HomepageBanner) => {
    const effective = banner.effectiveStatus || banner.status;
    switch (effective) {
      case 'ACTIVE':
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live on Store
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <Calendar className="w-3.5 h-3.5" />
            Scheduled
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <Clock className="w-3.5 h-3.5" />
            Expired
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            Draft (Hidden)
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {effective}
          </span>
        );
    }
  };

  const getPlacementBadge = (plc?: string | null) => {
    switch (plc) {
      case 'POPUP_MODAL':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
            <Gift className="w-3 h-3 text-amber-600" />
            Welcome Pop-up Card
          </span>
        );
      case 'MID_PAGE_PROMO':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#0066CC] border border-blue-200 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#0066CC]" />
            Middle Page Promo
          </span>
        );
      case 'SHOP_BANNER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <ShoppingBag className="w-3 h-3 text-emerald-600" />
            Shop Page Banner
          </span>
        );
      case 'SPOTLIGHT':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
            <Layers className="w-3 h-3 text-purple-600" />
            Spotlight Feature
          </span>
        );
      case 'HERO':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
            <Layout className="w-3 h-3 text-indigo-600" />
            Top Hero Slider
          </span>
        );
    }
  };

  // Filtered banners list by placement and client query
  const filteredBanners = banners.filter((b) => {
    if (placementFilter !== 'ALL' && b.placement !== placementFilter) {
      return false;
    }
    return true;
  });

  return (
    <AdminPageAccess permission="banners.view" pageTitle="Advertisements & Banners">
      <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
        {/* Top Notifications */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-sm font-semibold">{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="text-sm font-semibold">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Navigation: Store Ads vs Blue Marquee */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('banners')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'banners'
                ? 'bg-[#08275E] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Store Advertisements &amp; Banners</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('blueribbon')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'blueribbon'
                ? 'bg-[#0866F5] text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Megaphone className="w-4 h-4 text-[#FFD84D]" />
            <span>Top Blue Line Marquee</span>
            <span className="text-[10px] font-black uppercase bg-[#FFD84D] text-[#09285C] px-2 py-0.5 rounded-full shadow-2xs">
              Live Text Bar
            </span>
          </button>
        </div>

        {activeTab === 'blueribbon' ? (
          <BlueRibbonManager />
        ) : (
          <>
            {/* Header & Main Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#08275E]/10 rounded-2xl text-[#08275E]">
                    <Tv className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      Store Advertisements &amp; Banners
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Add, edit, or upload photo &amp; video advertisements for your top hero slider, middle page, and welcome pop-up card.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-start sm:self-auto">
                <button
                  onClick={loadBanners}
                  disabled={loading}
                  className="p-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
                  title="Refresh advertisements"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                {hasPermission('banners.manage') && (
                  <button
                    onClick={openCreateModal}
                    className="bg-[#08275E] hover:bg-[#103b8c] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Advertisement</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Placement Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 pl-1 pr-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span>Show Placement:</span>
              </span>

              {[
                { id: 'ALL', label: 'All Advertisements', icon: Tv, count: banners.length },
                {
                  id: 'HERO',
                  label: '🌟 Top Hero Slider',
                  icon: Layout,
                  count: banners.filter((b) => !b.placement || b.placement === 'HERO').length,
                },
                {
                  id: 'MID_PAGE_PROMO',
                  label: '📢 Middle Page Promo',
                  icon: Sparkles,
                  count: banners.filter((b) => b.placement === 'MID_PAGE_PROMO').length,
                },
                {
                  id: 'POPUP_MODAL',
                  label: '🎁 Welcome Pop-up Card',
                  icon: Gift,
                  count: banners.filter((b) => b.placement === 'POPUP_MODAL').length,
                },
                {
                  id: 'SHOP_BANNER',
                  label: '🏷️ Shop Page Banner',
                  icon: ShoppingBag,
                  count: banners.filter((b) => b.placement === 'SHOP_BANNER').length,
                },
                {
                  id: 'SPOTLIGHT',
                  label: '✨ Spotlight Feature',
                  icon: Layers,
                  count: banners.filter((b) => b.placement === 'SPOTLIGHT').length,
                },
              ].map((pill) => {
                const isActive = placementFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    onClick={() => setPlacementFilter(pill.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-[#08275E] text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
                    }`}
                  >
                    <span>{pill.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {pill.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Status and Search Filter Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              {/* Status Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(['ALL', 'PUBLISHED', 'SCHEDULED', 'DRAFT', 'ARCHIVED'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === s
                        ? 'bg-[#08275E] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s === 'ALL'
                      ? 'All Statuses'
                      : s === 'PUBLISHED'
                        ? 'Live / Published'
                        : s.charAt(0) + s.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  loadBanners();
                }}
                className="relative max-w-sm w-full"
              >
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by title, promo tag, or button..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#08275E]/20 focus:border-[#08275E]"
                />
              </form>
            </div>

            {/* Advertisements List / Cards */}
            {loading ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                <RefreshCw className="w-8 h-8 text-[#08275E] animate-spin mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700">Loading advertisements...</p>
              </div>
            ) : filteredBanners.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
                <Tv className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No Advertisements Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                  {statusFilter !== 'ALL' || placementFilter !== 'ALL' || searchQuery
                    ? 'No ads match your selected filters. Try choosing "All Advertisements" or clear your search query.'
                    : 'You have not added any advertisements yet. Create your first photo or video advertisement to welcome customers!'}
                </p>
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 bg-[#08275E] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#103b8c] transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add New Advertisement
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBanners.map((banner, index) => {
                  const isVideo = isMediaVideo(banner.desktopImage);
                  const isYouTube = isYouTubeVideo(banner.desktopImage);
                  const ytId = isYouTube ? getYouTubeVideoId(banner.desktopImage) : null;
                  const isLive = banner.status === 'PUBLISHED' || banner.effectiveStatus === 'ACTIVE';

                  return (
                    <div
                      key={banner.id}
                      className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 transition-all"
                    >
                      {/* Left: Sort Order & Media Thumbnail */}
                      <div className="flex items-center gap-4 w-full lg:w-auto">
                        {/* Sort Order Up/Down */}
                        <div className="flex flex-col items-center justify-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200 shrink-0">
                          <button
                            onClick={() => handleMoveOrder(index, 'up')}
                            disabled={index === 0}
                            className="p-1 rounded-md text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                            title="Move advertisement up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[11px] font-mono font-bold text-slate-700 px-1">
                            #{banner.sortOrder}
                          </span>
                          <button
                            onClick={() => handleMoveOrder(index, 'down')}
                            disabled={index === filteredBanners.length - 1}
                            className="p-1 rounded-md text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                            title="Move advertisement down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Media Thumbnail (Photo or Video) */}
                        <div className="relative w-36 sm:w-44 h-22 sm:h-24 bg-slate-950 rounded-xl overflow-hidden border border-slate-200 shrink-0 group shadow-2xs">
                          {isVideo ? (
                            isYouTube && ytId ? (
                              <img
                                src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                                alt={banner.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <video
                                src={formatMediaUrl(banner.desktopImage)}
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                              />
                            )
                          ) : (
                            <img
                              src={formatMediaUrl(banner.desktopImage)}
                              alt={banner.imageAltText || banner.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/hero/hero_section_2x.png';
                              }}
                            />
                          )}

                          {/* Media Type Badge Overlay */}
                          <div className="absolute top-1.5 left-1.5 bg-black/75 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                            {isVideo ? (
                              <>
                                <Film className="w-2.5 h-2.5 text-rose-400" />
                                <span>Video</span>
                              </>
                            ) : (
                              <>
                                <ImageIcon className="w-2.5 h-2.5 text-blue-300" />
                                <span>Photo</span>
                              </>
                            )}
                          </div>

                          {banner.mobileImage && (
                            <div className="absolute bottom-1.5 right-1.5 bg-black/75 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1">
                              <Smartphone className="w-2.5 h-2.5 text-amber-300" />
                              <span>Mobile</span>
                            </div>
                          )}

                          {/* Play button icon overlay for video */}
                          {isVideo && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-none">
                              <div className="w-7 h-7 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-md">
                                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Title, Placement & Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-base font-black text-slate-900 truncate">{banner.title}</h3>
                            {getPlacementBadge(banner.placement)}
                            {(banner.subtitle === '__GRAPHIC_ONLY__' ||
                              (!banner.subtitle && !banner.description && !banner.buttonText)) && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                                <ImageIcon className="w-2.5 h-2.5" />
                                Ready-Made Poster
                              </span>
                            )}
                            {getStatusBadge(banner)}
                          </div>

                          {banner.subtitle && banner.subtitle !== '__GRAPHIC_ONLY__' && (
                            <p className="text-xs text-slate-600 line-clamp-1 mb-1 font-medium">
                              🏷️ {banner.subtitle}
                            </p>
                          )}

                          {banner.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 mb-1">
                              {banner.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                            {banner.buttonText && (
                              <span className="inline-flex items-center gap-1 text-[#08275E] font-semibold">
                                Button: &quot;{banner.buttonText}&quot; {banner.buttonLink && `→ ${banner.buttonLink}`}
                              </span>
                            )}

                            {(banner.startAt || banner.endAt) && (
                              <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {banner.startAt ? new Date(banner.startAt).toLocaleDateString() : 'Immediate'} →{' '}
                                {banner.endAt ? new Date(banner.endAt).toLocaleDateString() : 'Ongoing'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 self-end lg:self-center border-t lg:border-t-0 pt-3 lg:pt-0 w-full lg:w-auto justify-end">
                        {/* Quick Live / Draft Toggle */}
                        <button
                          onClick={() => handleToggleStatus(banner)}
                          disabled={busyBannerId === banner.id}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                            isLive
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                          }`}
                          title={isLive ? 'Click to hide (set to Draft)' : 'Click to make live on website'}
                        >
                          <Power className={`w-3.5 h-3.5 ${isLive ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span>{isLive ? 'Live' : 'Draft'}</span>
                        </button>

                        {/* Preview */}
                        <button
                          onClick={() => {
                            setPreviewBanner(banner);
                            setPreviewViewport('desktop');
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Preview advertisement"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => openEditModal(banner)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Edit advertisement"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={() => handleDuplicate(banner)}
                          disabled={busyBannerId === banner.id}
                          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors cursor-pointer"
                          title="Duplicate advertisement"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(banner)}
                          disabled={busyBannerId === banner.id}
                          className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-colors cursor-pointer"
                          title="Delete advertisement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* CREATE / EDIT MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-5xl w-full p-5 sm:p-7 shadow-2xl border border-slate-100 my-auto flex flex-col max-h-[92vh]">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900">
                      {editingBanner ? 'Edit Advertisement' : 'Create New Advertisement'}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-[#08275E] border border-blue-200">
                      Step {formStep} of 3
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Add photos or videos with friendly labels and see a live preview as you type
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stepper Progress Tabs */}
              <div className="grid grid-cols-3 gap-2 my-4 shrink-0">
                {[
                  { step: 1, label: 'Where & Words', desc: 'Placement & Headlines', icon: Layout },
                  { step: 2, label: 'Photo or Video', desc: 'Upload file or link', icon: Film },
                  { step: 3, label: 'Button & Timing', desc: 'Button link & status', icon: Calendar },
                ].map((s) => {
                  const isCurrent = formStep === s.step;
                  const isDone = formStep > s.step;
                  const StepIcon = s.icon;
                  return (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => {
                        setFormError(null);
                        setFormStep(s.step as 1 | 2 | 3);
                      }}
                      className={`p-2.5 sm:p-3 rounded-2xl text-left transition-all border flex items-center gap-2.5 cursor-pointer ${
                        isCurrent
                          ? 'bg-[#08275E]/5 border-[#08275E] text-[#08275E] shadow-xs'
                          : isDone
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800 hover:bg-emerald-50'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                          isCurrent
                            ? 'bg-[#08275E] text-white shadow-xs'
                            : isDone
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isDone ? <Check className="w-3.5 h-3.5" /> : <StepIcon className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{s.label}</div>
                        <div className="text-[10px] opacity-70 truncate hidden sm:block">{s.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Form Error Alert */}
              {formError && (
                <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 shrink-0">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Form Body + Live Preview Grid */}
              <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 min-h-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto pr-1 flex-1 py-1">
                  {/* LEFT COLUMN: ACTIVE STEP INPUTS (7 cols) */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* STEP 1: WHERE & WORDS */}
                    {formStep === 1 && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        {/* Placement Selector */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-2">
                            Where should this advertisement show? <span className="text-rose-500">*</span>
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {PLACEMENT_OPTIONS.map((opt) => {
                              const isSelected = placement === opt.value;
                              const IconComponent = opt.icon;
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => setPlacement(opt.value)}
                                  className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between cursor-pointer ${
                                    isSelected
                                      ? 'border-[#08275E] bg-blue-50/60 ring-2 ring-[#08275E]/15 shadow-xs'
                                      : 'border-slate-200 bg-white hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div
                                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                        isSelected ? 'bg-[#08275E] text-white' : 'bg-slate-100 text-slate-600'
                                      }`}
                                    >
                                      <IconComponent className="w-3.5 h-3.5" />
                                    </div>
                                    <span
                                      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                                        isSelected
                                          ? 'bg-[#08275E] text-white'
                                          : 'bg-slate-100 text-slate-500'
                                      }`}
                                    >
                                      {opt.badge}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="text-xs font-bold text-slate-900">{opt.label}</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                                      {opt.desc}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Format Style: Ready-Made vs Add Text */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1.5">
                            Ad Style <span className="text-rose-500">*</span>
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <button
                              type="button"
                              onClick={() => setIsGraphicBanner(true)}
                              className={`p-3 rounded-2xl text-left border transition-all flex items-start gap-2.5 cursor-pointer ${
                                isGraphicBanner
                                  ? 'border-purple-600 bg-purple-50/70 ring-2 ring-purple-600/15 shadow-xs'
                                  : 'border-slate-200 bg-white hover:bg-slate-50'
                              }`}
                            >
                              <div
                                className={`p-2 rounded-xl shrink-0 ${
                                  isGraphicBanner ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                <ImageIcon className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>Ready-Made Poster / Video</span>
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                                  Your graphic or video already has your text and graphics in it. No extra overlay text. Entire ad is clickable.
                                </div>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setIsGraphicBanner(false)}
                              className={`p-3 rounded-2xl text-left border transition-all flex items-start gap-2.5 cursor-pointer ${
                                !isGraphicBanner
                                  ? 'border-[#08275E] bg-blue-50/70 ring-2 ring-[#08275E]/15 shadow-xs'
                                  : 'border-slate-200 bg-white hover:bg-slate-50'
                              }`}
                            >
                              <div
                                className={`p-2 rounded-xl shrink-0 ${
                                  !isGraphicBanner ? 'bg-[#08275E] text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                <Layout className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                  <span>Add Text &amp; Button on Top</span>
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                                  We will neatly display your headline, discount badge, and action button on top of your photo or video.
                                </div>
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* Title Input */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Main Headline / Ad Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => {
                              setTitle(e.target.value);
                              if (!imageAltText || imageAltText === title) {
                                setImageAltText(e.target.value);
                              }
                            }}
                            placeholder="e.g. Back to School Stationery Special 20% Off"
                            className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#08275E]/20 focus:border-[#08275E] transition-all bg-white"
                          />
                        </div>

                        {/* Subtitle & Description (for text overlay mode or popup coupon) */}
                        {!isGraphicBanner && (
                          <>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Offer Badge / Promo Tag <span className="text-slate-400 font-normal">(Optional)</span>
                              </label>
                              <input
                                type="text"
                                value={subtitle}
                                onChange={(e) => setSubtitle(e.target.value)}
                                placeholder="e.g. 20% OFF or CODE: WELCOME20 or LIMITED TIME"
                                className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#08275E]/20 focus:border-[#08275E] transition-all bg-white"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Short Message / Description <span className="text-slate-400 font-normal">(Optional)</span>
                              </label>
                              <textarea
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="e.g. Get 20% off all Atlas, Speed, and Nataraj supplies when you place your first school order."
                                className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#08275E]/20 focus:border-[#08275E] transition-all bg-white"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* STEP 2: PHOTO OR VIDEO */}
                    {formStep === 2 && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        {/* Media Type Switcher: Photo vs Video */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-2">
                            What kind of advertisement media do you want to use? <span className="text-rose-500">*</span>
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setMediaType('image')}
                              className={`p-3 rounded-2xl text-left border transition-all flex items-center gap-3 cursor-pointer ${
                                mediaType === 'image'
                                  ? 'border-[#08275E] bg-blue-50/70 ring-2 ring-[#08275E]/15 shadow-xs'
                                  : 'border-slate-200 bg-white hover:bg-slate-50'
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                  mediaType === 'image' ? 'bg-[#08275E] text-white' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                <ImageIcon className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-900">📷 Photo / Banner Image</div>
                                <div className="text-[10px] text-slate-500">JPG, PNG, WebP</div>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setMediaType('video')}
                              className={`p-3 rounded-2xl text-left border transition-all flex items-center gap-3 cursor-pointer ${
                                mediaType === 'video'
                                  ? 'border-rose-600 bg-rose-50/70 ring-2 ring-rose-600/15 shadow-xs'
                                  : 'border-slate-200 bg-white hover:bg-slate-50'
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                  mediaType === 'video' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                <Video className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-900">🎬 Video Advertisement</div>
                                <div className="text-[10px] text-slate-500">MP4, WebM clip or YouTube</div>
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* Video Guidance when Video is selected */}
                        {mediaType === 'video' && (
                          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs flex items-start gap-2.5">
                            <Film className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div className="text-[11px] leading-relaxed">
                              <strong>Video Support:</strong> You can upload a short promo clip (.mp4 or .webm up to 25MB) or simply paste a YouTube link (e.g.{' '}
                              <code className="bg-rose-100 px-1 py-0.5 rounded text-[10px] font-mono">
                                https://www.youtube.com/watch?v=...
                              </code>
                              ). Videos automatically play softly in the background.
                            </div>
                          </div>
                        )}

                        {/* Main Media Upload & URL Input */}
                        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-800">
                              {mediaType === 'video' ? 'Video File or YouTube Link' : 'Desktop Photo Image'}{' '}
                              <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                              {mediaType === 'video' ? 'MP4, WebM or YouTube' : 'Recommended: 1920×800 (16:9)'}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              required
                              value={desktopImage}
                              onChange={(e) => {
                                setDesktopImage(e.target.value);
                                if (isMediaVideo(e.target.value)) {
                                  setMediaType('video');
                                }
                              }}
                              placeholder={
                                mediaType === 'video'
                                  ? 'Paste YouTube link or video URL, or click Upload...'
                                  : 'Paste image link or click Upload...'
                              }
                              className="flex-1 px-3 py-2 text-xs border border-slate-300 bg-white rounded-xl focus:ring-2 focus:ring-[#08275E]/20 focus:border-[#08275E]"
                            />
                            <input
                              ref={desktopFileInputRef}
                              type="file"
                              accept={mediaType === 'video' ? 'video/mp4,video/webm' : 'image/*'}
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file, 'desktop');
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => desktopFileInputRef.current?.click()}
                              disabled={uploadingDesktop}
                              className={`px-3.5 py-2 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 shadow-xs cursor-pointer ${
                                mediaType === 'video'
                                  ? 'bg-rose-600 hover:bg-rose-700'
                                  : 'bg-[#08275E] hover:bg-[#103b8c]'
                              }`}
                            >
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>
                                {uploadingDesktop
                                  ? 'Uploading...'
                                  : mediaType === 'video'
                                    ? 'Upload Video File'
                                    : 'Upload Photo'}
                              </span>
                            </button>
                          </div>

                          {/* Quick Media Live Card Preview in Step 2 */}
                          {desktopImage && (
                            <div className="relative h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-950 group">
                              {isMediaVideo(desktopImage) ? (
                                isYouTubeVideo(desktopImage) ? (
                                  <iframe
                                    src={getYouTubeEmbedUrl(desktopImage) || ''}
                                    title="YouTube preview"
                                    className="w-full h-full pointer-events-none"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  />
                                ) : (
                                  <video
                                    src={formatMediaUrl(desktopImage)}
                                    controls
                                    className="w-full h-full object-cover"
                                  />
                                )
                              ) : (
                                <img
                                  src={formatMediaUrl(desktopImage)}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    if (!target.dataset.retried && target.src.includes('/uploads/')) {
                                      target.dataset.retried = 'true';
                                      target.src = `http://localhost:4000${
                                        desktopImage.startsWith('/') ? '' : '/'
                                      }${desktopImage}`;
                                    }
                                  }}
                                />
                              )}
                              <div className="absolute top-2 right-2">
                                <button
                                  type="button"
                                  onClick={() => setDesktopImage('')}
                                  className="px-2.5 py-1 bg-rose-600/90 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer shadow-md"
                                >
                                  Clear Media
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Optional Mobile Image Variant (for phones) */}
                        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-800">
                              Phone / Mobile Version <span className="text-slate-400 font-normal">(Optional)</span>
                            </label>
                            <span className="text-[10px] text-slate-500">
                              Recommended: 800×1000 (portrait)
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={mobileImage}
                              onChange={(e) => setMobileImage(e.target.value)}
                              placeholder="If left blank, it automatically uses the desktop version"
                              className="flex-1 px-3 py-2 text-xs border border-slate-300 bg-white rounded-xl focus:ring-2 focus:ring-[#08275E]/20 focus:border-[#08275E]"
                            />
                            <input
                              ref={mobileFileInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file, 'mobile');
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => mobileFileInputRef.current?.click()}
                              disabled={uploadingMobile}
                              className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
                            >
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>{uploadingMobile ? 'Uploading...' : 'Upload Mobile'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Alt Text / Description for Accessibility & SEO */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Media Description (For Google Search &amp; Screen Readers){' '}
                            <span className="text-slate-400 font-normal">(Optional)</span>
                          </label>
                          <input
                            type="text"
                            value={imageAltText}
                            onChange={(e) => setImageAltText(e.target.value)}
                            placeholder={title || 'e.g. Back-to-school promotional stationery packs'}
                            className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#08275E]/20 focus:border-[#08275E] bg-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* STEP 3: BUTTON & TIMING */}
                    {formStep === 3 && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        {/* Action Button & Link */}
                        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-800">
                              Action Button &amp; Link <span className="text-slate-400 font-normal">(Optional)</span>
                            </label>
                            <span className="text-[10px] text-slate-500">
                              Where should customers go when they click?
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Button Label
                              </span>
                              <input
                                type="text"
                                value={buttonText}
                                onChange={(e) => setButtonText(e.target.value)}
                                placeholder="e.g. Shop Now, View Offers, Claim Discount"
                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#08275E]/20 focus:border-[#08275E]"
                              />
                            </div>

                            <div>
                              <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Destination Page / Link
                              </span>
                              <input
                                type="text"
                                value={buttonLink}
                                onChange={(e) => setButtonLink(e.target.value)}
                                placeholder="e.g. /shop, /offers, or https://..."
                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#08275E]/20 focus:border-[#08275E]"
                              />
                            </div>
                          </div>

                          {/* Quick Destination Pill Shortcuts */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] text-slate-400">Quick links:</span>
                            {QUICK_LINKS.map((ql) => (
                              <button
                                key={ql.path}
                                type="button"
                                onClick={() => {
                                  setButtonLink(ql.path);
                                  if (!buttonText) setButtonText(ql.label);
                                }}
                                className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-200/80 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
                              >
                                {ql.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Status (Live vs Draft) */}
                        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
                          <label className="block text-xs font-bold text-slate-800">
                            Advertisement Status
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setStatus('PUBLISHED')}
                              className={`p-3 rounded-2xl text-left border transition-all flex items-center gap-2.5 cursor-pointer ${
                                status === 'PUBLISHED'
                                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/15'
                                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                              }`}
                            >
                              <div
                                className={`w-3 h-3 rounded-full ${
                                  status === 'PUBLISHED' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                                }`}
                              />
                              <div>
                                <div className="text-xs font-bold">Live on Website</div>
                                <div className="text-[10px] opacity-75">Visible to customers</div>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setStatus('DRAFT')}
                              className={`p-3 rounded-2xl text-left border transition-all flex items-center gap-2.5 cursor-pointer ${
                                status === 'DRAFT'
                                  ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-600/15'
                                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                              }`}
                            >
                              <div
                                className={`w-3 h-3 rounded-full ${
                                  status === 'DRAFT' ? 'bg-amber-500' : 'bg-slate-300'
                                }`}
                              />
                              <div>
                                <div className="text-xs font-bold">Draft (Hidden)</div>
                                <div className="text-[10px] opacity-75">Work in progress</div>
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* Optional Schedule Dates */}
                        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-bold text-slate-800">
                              Schedule Dates <span className="text-slate-400 font-normal">(Optional)</span>
                            </label>
                            <span className="text-[10px] text-slate-500">
                              Leave empty to display immediately without an end date
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Start Date &amp; Time
                              </span>
                              <input
                                type="datetime-local"
                                value={startAt}
                                onChange={(e) => setStartAt(e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#08275E]/20 focus:border-[#08275E]"
                              />
                            </div>

                            <div>
                              <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                                End Date &amp; Time
                              </span>
                              <input
                                type="datetime-local"
                                value={endAt}
                                onChange={(e) => setEndAt(e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#08275E]/20 focus:border-[#08275E]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* RIGHT COLUMN: LIVE MOCKUP PREVIEW (5 cols) */}
                  <div className="lg:col-span-5 flex flex-col justify-between p-4 bg-slate-900 rounded-2xl text-white border border-slate-800 shadow-inner">
                    <div>
                      {/* Preview Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                          <Eye className="w-3.5 h-3.5 text-blue-400" />
                          <span>Customer View Live Mockup</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isMediaVideo(desktopImage) && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1">
                              <Film className="w-2.5 h-2.5" />
                              Video
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-950 text-blue-300 border border-blue-800">
                            {placement}
                          </span>
                        </div>
                      </div>

                      {/* MOCKUP CONTENT ACCORDING TO PLACEMENT */}
                      {placement === 'POPUP_MODAL' ? (
                        /* Welcome Pop-up Card Mockup */
                        <div className="bg-white text-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-300 relative max-w-sm mx-auto animate-in zoom-in-95 duration-200">
                          {/* Mock Close Button */}
                          <div className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs">
                            ✕
                          </div>

                          {/* Media Header */}
                          <div className="relative aspect-video bg-slate-950 overflow-hidden">
                            {desktopImage ? (
                              isMediaVideo(desktopImage) ? (
                                isYouTubeVideo(desktopImage) ? (
                                  <iframe
                                    src={getYouTubeEmbedUrl(desktopImage) || ''}
                                    title="YouTube preview"
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  />
                                ) : (
                                  <video
                                    src={formatMediaUrl(desktopImage)}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                  />
                                )
                              ) : (
                                <img
                                  src={formatMediaUrl(desktopImage)}
                                  alt="Popup preview"
                                  className="w-full h-full object-cover"
                                />
                              )
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-slate-400">
                                <Gift className="w-8 h-8 text-amber-400 mb-1" />
                                <span className="text-[11px] font-bold">Upload Pop-up Media</span>
                              </div>
                            )}
                          </div>

                          {/* Card Content */}
                          <div className="p-4 space-y-2">
                            {subtitle && (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">
                                {subtitle}
                              </span>
                            )}
                            <h4 className="text-sm font-black text-slate-900 leading-snug">
                              {title.trim() || 'Special Welcome Gift For You!'}
                            </h4>
                            <p className="text-[11px] text-slate-600 line-clamp-2">
                              {description.trim() ||
                                'Enjoy an exclusive welcome discount on your entire stationery order.'}
                            </p>
                            <div className="pt-2">
                              <div className="w-full py-2 px-3 rounded-xl bg-[#08275E] text-white font-bold text-xs text-center">
                                {buttonText.trim() || 'Claim Offer & Shop Now'}
                              </div>
                            </div>
                            <div className="text-[9px] text-slate-400 text-center pt-1">
                              Don&apos;t show again today [mockup]
                            </div>
                          </div>
                        </div>
                      ) : placement === 'MID_PAGE_PROMO' ? (
                        /* Middle Page Promo Mockup */
                        <div className="rounded-2xl bg-[#08275E] border border-blue-900/60 p-4 shadow-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/25 text-blue-200 border border-blue-400/30">
                              {subtitle.trim() || 'PROMOTIONAL OFFER'}
                            </span>
                            <span className="text-[10px] text-blue-300 font-semibold">Store Special</span>
                          </div>

                          <div>
                            <h4 className="text-sm font-black text-white leading-snug">
                              {title.trim() || 'Headline for Middle Page Promotion'}
                            </h4>
                            <p className="text-[11px] text-blue-100/75 mt-1 leading-relaxed line-clamp-2">
                              {description.trim() ||
                                'Featured campaign details highlighting selected books, pens, and paper.'}
                            </p>
                          </div>

                          {/* Media thumbnail / player */}
                          {desktopImage && (
                            <div className="relative aspect-video rounded-xl overflow-hidden border border-blue-800 bg-slate-950">
                              {isMediaVideo(desktopImage) ? (
                                isYouTubeVideo(desktopImage) ? (
                                  <iframe
                                    src={getYouTubeEmbedUrl(desktopImage) || ''}
                                    title="YouTube preview"
                                    className="w-full h-full"
                                  />
                                ) : (
                                  <video
                                    src={formatMediaUrl(desktopImage)}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                  />
                                )
                              ) : (
                                <img
                                  src={formatMediaUrl(desktopImage)}
                                  alt="Promo artwork"
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                          )}

                          <div className="pt-1">
                            <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-[#08275E] font-black text-xs rounded-lg shadow-xs">
                              <span>{buttonText.trim() || 'Shop Now'}</span>
                              <ExternalLink className="w-3 h-3" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Top Hero Slider / Spotlight Mockup */
                        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-lg flex flex-col justify-end p-4">
                          {desktopImage ? (
                            isMediaVideo(desktopImage) ? (
                              isYouTubeVideo(desktopImage) ? (
                                <iframe
                                  src={getYouTubeEmbedUrl(desktopImage) || ''}
                                  title="Hero video preview"
                                  className="absolute inset-0 w-full h-full pointer-events-none"
                                />
                              ) : (
                                <video
                                  src={formatMediaUrl(desktopImage)}
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              )
                            ) : (
                              <img
                                src={formatMediaUrl(desktopImage)}
                                alt="Preview"
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            )
                          ) : (
                            <div className="absolute inset-0 bg-linear-to-tr from-slate-900 via-[#08275E] to-slate-800 opacity-90 flex items-center justify-center">
                              <Tv className="w-10 h-10 text-slate-600" />
                            </div>
                          )}

                          {!isGraphicBanner && (
                            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />
                          )}

                          {!isGraphicBanner && (
                            <div className="relative z-10 space-y-1.5">
                              {subtitle && (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-600 text-white shadow-xs">
                                  {subtitle}
                                </span>
                              )}
                              <h4 className="text-sm font-black text-white leading-tight drop-shadow-xs line-clamp-2">
                                {title.trim() || 'Your Hero Banner Title Here'}
                              </h4>
                              {description && (
                                <p className="text-[11px] text-slate-200 line-clamp-2 drop-shadow-xs">
                                  {description}
                                </p>
                              )}
                              {buttonText && (
                                <div className="pt-1">
                                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-white text-slate-900 rounded-lg text-xs font-bold shadow-xs">
                                    {buttonText}
                                    <ChevronRight className="w-3 h-3" />
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Preview Note */}
                    <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Mockup updates in real time as you adjust form inputs.</span>
                    </div>
                  </div>
                </div>

                {/* MODAL CONTROLS */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <div className="flex items-center gap-2">
                    {formStep > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormError(null);
                          setFormStep((prev) => (prev - 1) as 1 | 2 | 3);
                        }}
                        className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Back</span>
                      </button>
                    )}

                    {formStep < 3 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setFormError(null);
                          if (formStep === 1) {
                            if (!title.trim()) {
                              setFormError('Please enter a headline or advertisement name before proceeding.');
                              return;
                            }
                            setFormStep(2);
                          } else if (formStep === 2) {
                            if (!desktopImage.trim()) {
                              setFormError(
                                mediaType === 'video'
                                  ? 'Please upload a video or paste a video link.'
                                  : 'Please upload a photo or paste an image link.'
                              );
                              return;
                            }
                            setFormStep(3);
                          }
                        }}
                        className="px-5 py-2 text-xs font-bold text-white bg-[#08275E] hover:bg-[#103b8c] rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Continue</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={formSubmitting}
                        className="px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                      >
                        {formSubmitting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving Advertisement...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>{editingBanner ? 'Save Changes' : 'Publish Advertisement'}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* FULL SCREEN PREVIEW MODAL */}
        {previewBanner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <div className="bg-slate-900 rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-700 text-white flex flex-col max-h-[90vh]">
              {/* Header & Viewport switcher */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Live Customer View Preview</span>
                    {getPlacementBadge(previewBanner.placement)}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Rendering: &quot;{previewBanner.title}&quot;
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                    <button
                      onClick={() => setPreviewViewport('desktop')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        previewViewport === 'desktop' ? 'bg-[#08275E] text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Laptop className="w-3.5 h-3.5" /> Desktop
                    </button>
                    <button
                      onClick={() => setPreviewViewport('mobile')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        previewViewport === 'mobile' ? 'bg-[#08275E] text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" /> Mobile
                    </button>
                  </div>

                  <button
                    onClick={() => setPreviewBanner(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Preview Frame */}
              <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                {previewViewport === 'desktop' ? (
                  /* Desktop Preview */
                  <div className="w-full relative rounded-2xl overflow-hidden aspect-[16/7] shadow-2xl border border-slate-800 flex items-center justify-center bg-black">
                    {isMediaVideo(previewBanner.desktopImage) ? (
                      isYouTubeVideo(previewBanner.desktopImage) ? (
                        <iframe
                          src={getYouTubeEmbedUrl(previewBanner.desktopImage) || ''}
                          title="YouTube preview"
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          src={formatMediaUrl(previewBanner.desktopImage)}
                          controls
                          autoPlay
                          loop
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <img
                        src={formatMediaUrl(previewBanner.desktopImage)}
                        alt={previewBanner.imageAltText || previewBanner.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}

                    {previewBanner.subtitle !== '__GRAPHIC_ONLY__' && (
                      <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/30 to-transparent flex flex-col justify-center px-10 max-w-xl pointer-events-none">
                        <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-md">
                          {previewBanner.title}
                        </h2>
                        {previewBanner.subtitle && (
                          <p className="text-sm text-[#FFD84D] font-bold mt-2 drop-shadow-xs">
                            {previewBanner.subtitle}
                          </p>
                        )}
                        {previewBanner.description && (
                          <p className="text-xs text-slate-200 mt-2 line-clamp-2 drop-shadow-xs">
                            {previewBanner.description}
                          </p>
                        )}
                        {previewBanner.buttonText && (
                          <div className="mt-4">
                            <span className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#FFD84D] text-[#10285D] text-xs font-black shadow-lg">
                              {previewBanner.buttonText}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Mobile Preview */
                  <div className="w-[320px] relative rounded-3xl overflow-hidden aspect-[9/16] shadow-2xl border-4 border-slate-700 flex flex-col justify-end p-5 bg-black">
                    {isMediaVideo(previewBanner.mobileImage || previewBanner.desktopImage) ? (
                      isYouTubeVideo(previewBanner.mobileImage || previewBanner.desktopImage) ? (
                        <iframe
                          src={getYouTubeEmbedUrl(previewBanner.mobileImage || previewBanner.desktopImage) || ''}
                          title="YouTube mobile preview"
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          src={formatMediaUrl(previewBanner.mobileImage || previewBanner.desktopImage)}
                          controls
                          autoPlay
                          loop
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <img
                        src={formatMediaUrl(previewBanner.mobileImage || previewBanner.desktopImage)}
                        alt={previewBanner.imageAltText || previewBanner.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}

                    {previewBanner.subtitle !== '__GRAPHIC_ONLY__' && (
                      <>
                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
                        <div className="relative z-10 space-y-2 pointer-events-none">
                          <h2 className="text-xl font-black text-white leading-tight drop-shadow-md">
                            {previewBanner.title}
                          </h2>
                          {previewBanner.subtitle && (
                            <p className="text-xs text-[#FFD84D] font-bold drop-shadow-xs">
                              {previewBanner.subtitle}
                            </p>
                          )}
                          {previewBanner.buttonText && (
                            <div className="pt-2">
                              <span className="w-full inline-flex items-center justify-center py-2 rounded-full bg-[#FFD84D] text-[#10285D] text-xs font-black shadow-lg">
                                {previewBanner.buttonText}
                              </span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminPageAccess>
  );
}
