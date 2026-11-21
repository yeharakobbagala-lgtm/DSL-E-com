'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles,
  Save,
  RefreshCw,
  ExternalLink,
  Upload,
  Check,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Heart,
  Compass,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  ShieldAlert,
  Layers,
  Award,
  Globe,
  Handshake,
  Lightbulb,
} from 'lucide-react';
import { AdminPageAccess } from '@/components/admin/AdminPageAccess';
import { aboutPageService } from '@/services/aboutPageService';
import { AboutPageData, DEFAULT_ABOUT_PAGE_DATA } from '@/types/about';
import { resolveImageUrl } from '@/lib/image';

type SectionTab = 'hero' | 'story' | 'values' | 'impact' | 'contact';

export default function AdminAboutPage() {
  const [activeTab, setActiveTab] = useState<SectionTab>('hero');
  const [formData, setFormData] = useState<AboutPageData>(DEFAULT_ABOUT_PAGE_DATA);
  const [initialData, setInitialData] = useState<AboutPageData>(DEFAULT_ABOUT_PAGE_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Hidden file inputs for uploading
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    loadPageContent();
  }, []);

  const loadPageContent = async () => {
    try {
      setIsLoading(true);
      const data = await aboutPageService.getAdminAboutPageContent();
      setFormData(data);
      setInitialData(data);
    } catch (err: any) {
      console.error('Failed to load about page configuration:', err);
      showNotification('error', 'Failed to load existing content from server, using default template.');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification((curr) => (curr?.text === text ? null : curr));
    }, 4500);
  };

  const handleChange = (field: keyof AboutPageData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = async (field: keyof AboutPageData, file: File) => {
    try {
      setUploadingField(field);
      const uploadedUrl = await aboutPageService.uploadAboutImage(file);
      handleChange(field, uploadedUrl);
      showNotification('success', `Image for ${String(field)} uploaded successfully!`);
    } catch (err: any) {
      console.error('Upload error:', err);
      showNotification('error', err?.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploadingField(null);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setIsSaving(true);
      const updated = await aboutPageService.updateAboutPageContent(formData);
      setFormData(updated);
      setInitialData(updated);
      showNotification('success', 'About Us page content successfully saved and published!');
    } catch (err: any) {
      console.error('Save failed:', err);
      showNotification('error', err?.message || 'Failed to save changes to server.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Are you sure you want to restore the default About Us template? Any unsaved edits will be lost.')) {
      setFormData(DEFAULT_ABOUT_PAGE_DATA);
      showNotification('success', 'Form restored to default DSL stationery template. Click "Save Changes" to publish.');
    }
  };

  const hasUnsavedChanges = JSON.stringify(formData) !== JSON.stringify(initialData);

  // Helper component to render an image uploader with preview
  const ImageUploaderCard = ({
    field,
    label,
    description,
    aspectClass = 'aspect-video',
  }: {
    field: keyof AboutPageData;
    label: string;
    description?: string;
    aspectClass?: string;
  }) => {
    const isUploading = uploadingField === field;
    const currentVal = formData[field] || '';

    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            {label}
          </label>
          {isUploading && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Uploading...
            </span>
          )}
        </div>
        {description && <p className="text-xs text-slate-400">{description}</p>}

        {/* Preview box */}
        <div className={`relative ${aspectClass} w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 group flex items-center justify-center`}>
          {currentVal ? (
            <Image
              src={resolveImageUrl(currentVal)}
              alt={label}
              fill
              className="object-contain group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="text-center p-4">
              <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-1.5" />
              <span className="text-xs text-slate-500">No image assigned</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRefs.current[field]?.click()}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
            >
              <Upload className="w-3.5 h-3.5" /> Replace Photo
            </button>
          </div>
        </div>

        {/* URL Input and File trigger */}
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={currentVal}
            onChange={(e) => handleChange(field, e.target.value)}
            placeholder="e.g. /images/hero.jpg or https://..."
            className="flex-1 bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={() => fileInputRefs.current[field]?.click()}
            disabled={isUploading}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700 disabled:opacity-50 shrink-0"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Upload</span>
          </button>
          <input
            type="file"
            ref={(el) => {
              fileInputRefs.current[field] = el;
            }}
            accept="image/png,image/jpeg,image/webp,image/jpg"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(field, file);
              e.target.value = '';
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <AdminPageAccess
      permission="settings.view"
      pageTitle="About Us Content Editor"
    >
      <div className="space-y-6 pb-20">
        {/* Top Header & Quick Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-emerald-400 uppercase mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Storefront Content CMS</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              About Us Page Customizer
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Edit all 5 sections, update photos, brand narrative, and contact coordinates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/about"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              <span>Preview Live Page</span>
            </Link>

            <button
              type="button"
              onClick={handleResetToDefaults}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 text-xs font-semibold rounded-xl border border-slate-700 hover:border-rose-900/50 transition"
              title="Reset all fields to DSL default text"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all ${
                hasUnsavedChanges
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30 animate-pulse'
                  : 'bg-[#08275E] hover:bg-[#0c357d]'
              } disabled:opacity-50`}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{hasUnsavedChanges ? 'Publish Changes *' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Floating Notification */}
        {notification && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between gap-3 text-xs font-semibold transition-all shadow-md ${
              notification.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-700/60 text-emerald-200'
                : 'bg-rose-950/80 border border-rose-700/60 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {notification.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
              <span>{notification.text}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white text-xs font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Section Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('hero')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'hero'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>1. Hero Banner</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('story')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'story'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>2. Our Story</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('values')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'values'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>3. Values &amp; Vision</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('impact')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'impact'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>4. Community &amp; Impact</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'contact'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>5. Hubs &amp; Contact</span>
          </button>
        </div>

        {/* Tab Content Panels */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* ========================================================= */}
          {/* TAB 1: HERO BANNER                                        */}
          {/* ========================================================= */}
          {activeTab === 'hero' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Section 1</span>
                <h2 className="text-lg font-black text-white tracking-tight mt-0.5">
                  Top Cinematic Hero Banner
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Full-width cinematic photo background and high-impact headline displayed at the top of the About Us page.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Hero Photo Card */}
                <div className="lg:col-span-6">
                  <ImageUploaderCard
                    field="heroImage"
                    label="Hero Background Photo"
                    description="High resolution photo (recommended 1920x800px). JPG, PNG, or WebP."
                    aspectClass="aspect-[16/7]"
                  />
                </div>

                {/* Hero Headlines */}
                <div className="lg:col-span-6 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Headline Line 1 <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.heroTitleLine1}
                      onChange={(e) => handleChange('heroTitleLine1', e.target.value)}
                      placeholder="e.g. Empowering Education."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-semibold"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Headline Line 2 <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.heroTitleLine2}
                      onChange={(e) => handleChange('heroTitleLine2', e.target.value)}
                      placeholder="e.g. Inspiring Creativity."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-semibold"
                      required
                    />
                  </div>

                  {/* Live Mini Preview Box */}
                  <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
                      Live Storefront Headline Preview
                    </span>
                    <div className="text-lg sm:text-xl font-extrabold text-[#FBF8F1] leading-tight">
                      <span>{formData.heroTitleLine1 || 'Empowering Education.'}</span>
                      <br />
                      <span>{formData.heroTitleLine2 || 'Inspiring Creativity.'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: OUR STORY                                          */}
          {/* ========================================================= */}
          {activeTab === 'story' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Section 2</span>
                <h2 className="text-lg font-black text-white tracking-tight mt-0.5">
                  Our Story &amp; Photographic Capsules
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Brand heritage story quote, primary action buttons, and the trio of vertical stadium capsules.
                </p>
              </div>

              {/* Story Narrative */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Section Heading
                    </label>
                    <input
                      type="text"
                      value={formData.storyTitle}
                      onChange={(e) => handleChange('storyTitle', e.target.value)}
                      placeholder="Our Story"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Main Narrative Story Quote
                    </label>
                    <textarea
                      rows={5}
                      value={formData.storyParagraph}
                      onChange={(e) => handleChange('storyParagraph', e.target.value)}
                      placeholder="Born out of a dedication to quality stationery..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        Primary Button Text
                      </label>
                      <input
                        type="text"
                        value={formData.storyButtonText}
                        onChange={(e) => handleChange('storyButtonText', e.target.value)}
                        placeholder="Discover Our Brands"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        Primary Button Link
                      </label>
                      <input
                        type="text"
                        value={formData.storyButtonLink}
                        onChange={(e) => handleChange('storyButtonLink', e.target.value)}
                        placeholder="/brands"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        Secondary Button Text
                      </label>
                      <input
                        type="text"
                        value={formData.storyVideoText}
                        onChange={(e) => handleChange('storyVideoText', e.target.value)}
                        placeholder="Watch Event Video"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        Secondary Button Link / Anchor
                      </label>
                      <input
                        type="text"
                        value={formData.storyVideoLink}
                        onChange={(e) => handleChange('storyVideoLink', e.target.value)}
                        placeholder="#experience"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 3 Capsule Photos */}
                <div className="lg:col-span-5 space-y-4">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                    Trio of Stadium/Capsule Photos
                  </span>
                  <div className="space-y-4">
                    <ImageUploaderCard
                      field="capsuleImage1"
                      label="Left Capsule (Student / Learning Focus)"
                      aspectClass="aspect-[4/5]"
                    />
                    <ImageUploaderCard
                      field="capsuleImage2"
                      label="Center Capsule (Highlight Stationery Collection)"
                      aspectClass="aspect-[4/5]"
                    />
                    <ImageUploaderCard
                      field="capsuleImage3"
                      label="Right Capsule (Knowledge &amp; Library Space)"
                      aspectClass="aspect-[4/5]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: VALUES & VISION                                    */}
          {/* ========================================================= */}
          {activeTab === 'values' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Section 3</span>
                <h2 className="text-lg font-black text-white tracking-tight mt-0.5">
                  Identity, Vision and Values
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Core value pillars, corporate identity tagline, and the dual Vision &amp; Mission statements.
                </p>
              </div>

              {/* Title & Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Category Tagline / Badge
                  </label>
                  <input
                    type="text"
                    value={formData.valuesBadge}
                    onChange={(e) => handleChange('valuesBadge', e.target.value)}
                    placeholder="ABOUT US"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Main Section Title
                  </label>
                  <input
                    type="text"
                    value={formData.valuesTitle}
                    onChange={(e) => handleChange('valuesTitle', e.target.value)}
                    placeholder="Our Identity, Vision and Values"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-bold"
                  />
                </div>
              </div>

              {/* 4 Pillars */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                  The 4 Green Pill Banner Values
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                    <span className="text-[11px] font-bold text-emerald-400">Pillar 1</span>
                    <input
                      type="text"
                      value={formData.pillar1Text}
                      onChange={(e) => handleChange('pillar1Text', e.target.value)}
                      placeholder="Quality & Craft"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium"
                    />
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                    <span className="text-[11px] font-bold text-emerald-400">Pillar 2</span>
                    <input
                      type="text"
                      value={formData.pillar2Text}
                      onChange={(e) => handleChange('pillar2Text', e.target.value)}
                      placeholder="Trust & Transparency"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium"
                    />
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                    <span className="text-[11px] font-bold text-emerald-400">Pillar 3</span>
                    <input
                      type="text"
                      value={formData.pillar3Text}
                      onChange={(e) => handleChange('pillar3Text', e.target.value)}
                      placeholder="Islandwide Reach"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium"
                    />
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                    <span className="text-[11px] font-bold text-emerald-400">Pillar 4</span>
                    <input
                      type="text"
                      value={formData.pillar4Text}
                      onChange={(e) => handleChange('pillar4Text', e.target.value)}
                      placeholder="Innovation & Learning"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Vision and Mission Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Vision */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <Award className="w-4 h-4" />
                    <span>Vision Statement</span>
                  </div>
                  <input
                    type="text"
                    value={formData.visionTitle}
                    onChange={(e) => handleChange('visionTitle', e.target.value)}
                    placeholder="Vision"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold"
                  />
                  <textarea
                    rows={4}
                    value={formData.visionText}
                    onChange={(e) => handleChange('visionText', e.target.value)}
                    placeholder="To be Sri Lanka's leading educational and creative partner..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 leading-relaxed"
                  />
                </div>

                {/* Mission */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <Compass className="w-4 h-4" />
                    <span>Mission Statement</span>
                  </div>
                  <input
                    type="text"
                    value={formData.missionTitle}
                    onChange={(e) => handleChange('missionTitle', e.target.value)}
                    placeholder="Mission"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold"
                  />
                  <textarea
                    rows={4}
                    value={formData.missionText}
                    onChange={(e) => handleChange('missionText', e.target.value)}
                    placeholder="To source, deliver, and inspire access to the finest stationery..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: COMMUNITY & IMPACT                                 */}
          {/* ========================================================= */}
          {activeTab === 'impact' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Section 4</span>
                <h2 className="text-lg font-black text-white tracking-tight mt-0.5">
                  Philanthropy, Community &amp; Impact
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Little Hearts initiative, student workshops, and Lady Ridgeway Children&apos;s Hospital pediatric support.
                </p>
              </div>

              {/* Header texts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Badge Text
                  </label>
                  <input
                    type="text"
                    value={formData.impactBadge}
                    onChange={(e) => handleChange('impactBadge', e.target.value)}
                    placeholder="Philanthropy & Giving Back"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Section Heading
                  </label>
                  <input
                    type="text"
                    value={formData.impactTitle}
                    onChange={(e) => handleChange('impactTitle', e.target.value)}
                    placeholder="Community & Impact"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Subtitle Description
                </label>
                <input
                  type="text"
                  value={formData.impactSubtitle}
                  onChange={(e) => handleChange('impactSubtitle', e.target.value)}
                  placeholder="Every purchase of designated DSL writing instruments directly supports lifesaving pediatric care..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>

              {/* 3 Impact Cards */}
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block mb-4">
                  The 3 Philanthropic Cards
                </span>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Card 1 */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <span className="text-xs font-bold text-rose-400">Card 1: Little Hearts</span>
                    <ImageUploaderCard
                      field="card1Image"
                      label="Mascot / Logo"
                      aspectClass="aspect-square"
                    />
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Card Title</label>
                      <input
                        type="text"
                        value={formData.card1Title}
                        onChange={(e) => handleChange('card1Title', e.target.value)}
                        placeholder="Little Hearts Project"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Card Narrative</label>
                      <textarea
                        rows={3}
                        value={formData.card1Text}
                        onChange={(e) => handleChange('card1Text', e.target.value)}
                        placeholder="Dedicated pens & pencils under Speed and Camlin..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-300 leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <span className="text-xs font-bold text-rose-400">Card 2: Community Action</span>
                    <ImageUploaderCard
                      field="card2Image"
                      label="Hands Icon / Graphic"
                      aspectClass="aspect-square"
                    />
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Card Title</label>
                      <input
                        type="text"
                        value={formData.card2Title}
                        onChange={(e) => handleChange('card2Title', e.target.value)}
                        placeholder="Hands That Care"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Card Narrative</label>
                      <textarea
                        rows={3}
                        value={formData.card2Text}
                        onChange={(e) => handleChange('card2Text', e.target.value)}
                        placeholder="Active involvement in student sponsorships..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-300 leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <span className="text-xs font-bold text-rose-400">Card 3: Hospital Facility</span>
                    <ImageUploaderCard
                      field="card3Image"
                      label="Facility / Hospital Photo"
                      aspectClass="aspect-square"
                    />
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Card Title</label>
                      <input
                        type="text"
                        value={formData.card3Title}
                        onChange={(e) => handleChange('card3Title', e.target.value)}
                        placeholder="Lady Ridgeway Hospital"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Card Narrative</label>
                      <textarea
                        rows={3}
                        value={formData.card3Text}
                        onChange={(e) => handleChange('card3Text', e.target.value)}
                        placeholder="Contributing to the Cardiac and Critical Care Complex..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-300 leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: DISTRIBUTION HUBS & CONTACT                        */}
          {/* ========================================================= */}
          {activeTab === 'contact' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Section 5</span>
                <h2 className="text-lg font-black text-white tracking-tight mt-0.5">
                  Distribution Hubs &amp; Contact Coordinates
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Islandwide supply network map graphic, phone lines, WhatsApp link, and physical office addresses.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Map Image */}
                <div className="lg:col-span-5">
                  <ImageUploaderCard
                    field="mapImage"
                    label="Sri Lanka Distribution Map"
                    description="Transparent PNG or crisp graphic showcasing islandwide supply presence."
                    aspectClass="aspect-[4/5]"
                  />
                </div>

                {/* Coordinates & Text */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        Tagline Badge
                      </label>
                      <input
                        type="text"
                        value={formData.distributionBadge}
                        onChange={(e) => handleChange('distributionBadge', e.target.value)}
                        placeholder="Islandwide Supply Network"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        Main Section Heading
                      </label>
                      <input
                        type="text"
                        value={formData.distributionTitle}
                        onChange={(e) => handleChange('distributionTitle', e.target.value)}
                        placeholder="Moratuwa Headquarters & Distribution Hubs"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Network Subtitle
                    </label>
                    <input
                      type="text"
                      value={formData.distributionSubtitle}
                      onChange={(e) => handleChange('distributionSubtitle', e.target.value)}
                      placeholder="Serving schools, retail bookshops, and nationwide customers directly..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>

                  {/* Phone, WhatsApp, Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>Office Line</span>
                      </label>
                      <input
                        type="text"
                        value={formData.officePhone}
                        onChange={(e) => handleChange('officePhone', e.target.value)}
                        placeholder="+94 38 223 6094"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <span>Direct / WhatsApp</span>
                      </label>
                      <input
                        type="text"
                        value={formData.whatsappPhone}
                        onChange={(e) => handleChange('whatsappPhone', e.target.value)}
                        placeholder="+94 77 355 3555"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-emerald-400" />
                        <span>Customer Email</span>
                      </label>
                      <input
                        type="email"
                        value={formData.customerCareEmail}
                        onChange={(e) => handleChange('customerCareEmail', e.target.value)}
                        placeholder="support@dslstationery.lk"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Addresses */}
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span>Head Office Address</span>
                      </label>
                      <input
                        type="text"
                        value={formData.headOfficeAddress}
                        onChange={(e) => handleChange('headOfficeAddress', e.target.value)}
                        placeholder="30/3, Main Street, Moratuwa, Sri Lanka"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span>Central Distribution Facility Address</span>
                      </label>
                      <input
                        type="text"
                        value={formData.distributionAddress}
                        onChange={(e) => handleChange('distributionAddress', e.target.value)}
                        placeholder="No 14, Old Kottawa Road, Mirihana, Nugegoda"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sticky Bottom Save Bar */}
          <div className="sticky bottom-4 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4">
            <div className="text-xs text-slate-400 hidden sm:block">
              {hasUnsavedChanges ? (
                <span className="text-amber-400 font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> You have unsaved changes! Click Publish to apply to the live storefront.
                </span>
              ) : (
                <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> All content is synchronized with the live website.
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Link
                href="/about"
                target="_blank"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
              >
                View Live Page
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Publish About Us Page</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AdminPageAccess>
  );
}
