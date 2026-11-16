'use client';

import React, { useState } from 'react';
import { useStorefrontContent } from '@/app/context/StorefrontContentContext';
import {
  Edit3,
  Save,
  RotateCcw,
  Eye,
  Sliders,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Phone,
  Truck,
  Percent,
} from 'lucide-react';

export function VisualEditorToolbar() {
  const {
    content,
    isEditing,
    setIsEditing,
    updateField,
    saveChanges,
    resetChanges,
    isSaving,
    hasUnsavedChanges,
    saveMessage,
    clearSaveMessage,
  } = useStorefrontContent();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'announcement' | 'brand' | 'hero' | 'promo' | 'story' | 'social'>('announcement');

  return (
    <>
      {/* 1. TOAST NOTIFICATION */}
      {saveMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] max-w-lg w-[90%] transition-all animate-bounce">
          <div
            className={`flex items-center justify-between p-3.5 sm:p-4 rounded-xl shadow-2xl border ${
              saveMessage.type === 'success'
                ? 'bg-[#2E0A0F] border-[#D4AF5A] text-[#F7F0DE]'
                : 'bg-red-950 border-red-500 text-red-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {saveMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-[#E9D08A] shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              )}
              <span className="text-xs sm:text-sm font-medium">{saveMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={clearSaveMessage}
              className="text-[#E9D08A] hover:text-white p-1 ml-3"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. FLOATING MINI PILL (When toolbar minimized or not in edit mode) */}
      {isMinimized ? (
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-4 right-4 z-50 bg-[#2E0A0F] text-[#E9D08A] border-2 border-[#D4AF5A] rounded-full px-4 py-2.5 shadow-2xl hover:bg-[#4A1118] flex items-center gap-2 text-xs font-semibold tracking-wider transition-transform hover:scale-105"
          title="Open Visual Webpage Editor"
        >
          <Sparkles className="w-4 h-4 text-[#D4AF5A] animate-spin" />
          <span>Visual Editor</span>
          {hasUnsavedChanges && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      ) : (
        /* 3. FLOATING ROYAL GOLD EDITOR TOOLBAR */
        <div
          role="toolbar"
          aria-label="Webpage Editor Toolbar"
          className="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 w-[96%] max-w-[1100px] bg-[#2E0A0F]/95 backdrop-blur-md border-2 border-[#D4AF5A] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.7)] text-[#F7F0DE] p-2.5 sm:p-3 transition-all"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            {/* Left: Status & Edit Mode Toggle */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition border ${
                  isEditing
                    ? 'bg-[#D4AF5A] text-[#2E0A0F] border-[#E9D08A] shadow-md'
                    : 'bg-[#1F070B] text-[#E9D08A] border-[#D4AF5A]/40 hover:border-[#D4AF5A]'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{isEditing ? 'Edit Mode: ON' : 'Edit Mode: OFF'}</span>
              </button>

              <div className="hidden lg:flex items-center text-[11px] text-[#E4D7C0]">
                {isEditing ? (
                  <span className="flex items-center gap-1.5 text-[#E9D08A]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Click any text on the webpage to edit directly
                  </span>
                ) : (
                  <span>Previewing live storefront</span>
                )}
              </div>
            </div>

            {/* Right: Actions (Save, Settings Drawer, Reset, Minimize) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Save Button */}
              <button
                type="button"
                onClick={() => saveChanges()}
                disabled={isSaving}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition shadow-lg ${
                  hasUnsavedChanges
                    ? 'bg-gradient-to-r from-[#D4AF5A] to-[#E9D08A] text-[#2E0A0F] border border-amber-300 ring-2 ring-[#E9D08A]/50 animate-pulse'
                    : 'bg-[#D4AF5A]/80 hover:bg-[#D4AF5A] text-[#2E0A0F]'
                }`}
                title="Save changes directly into the codebase and update live website"
              >
                <Save className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSaving ? 'animate-spin' : ''}`} />
                <span>{isSaving ? 'Saving...' : 'Save to Webpage'}</span>
                {hasUnsavedChanges && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2E0A0F]" />
                )}
              </button>

              {/* Form Settings Drawer */}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs font-semibold bg-[#1F070B] text-[#E9D08A] border border-[#D4AF5A]/50 hover:bg-[#D4AF5A]/15 transition"
                title="Open structured content drawer"
              >
                <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Settings</span>
              </button>

              {/* Reset Button */}
              {hasUnsavedChanges && (
                <button
                  type="button"
                  onClick={resetChanges}
                  className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs font-semibold bg-transparent text-[#E4D7C0] hover:text-white border border-white/20 hover:border-white/40 transition"
                  title="Revert all unsaved changes"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Reset</span>
                </button>
              )}

              {/* Minimize Toolbar Button */}
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="p-1.5 sm:p-2 text-[#E4D7C0] hover:text-[#E9D08A] transition rounded-lg"
                title="Minimize toolbar"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SLIDE-OUT CONTENT SETTINGS DRAWER */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[90] flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md sm:max-w-lg bg-[#1F070B] border-l-2 border-[#D4AF5A] text-[#F7F0DE] flex flex-col h-full shadow-2xl overflow-hidden">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-[#D4AF5A]/30 flex items-center justify-between bg-[#2E0A0F]">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-[#E9D08A]" />
                <h3 className="font-serif font-bold text-lg text-[#E9D08A]">
                  Storefront Content Editor
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 text-[#E4D7C0] hover:text-[#E9D08A] rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#D4AF5A]/20 bg-[#25090D] overflow-x-auto text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('announcement')}
                className={`py-2.5 px-3.5 whitespace-nowrap border-b-2 transition ${
                  activeTab === 'announcement'
                    ? 'border-[#D4AF5A] text-[#E9D08A] bg-[#2E0A0F]'
                    : 'border-transparent text-[#E4D7C0] hover:text-[#E9D08A]'
                }`}
              >
                Announcement
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('brand')}
                className={`py-2.5 px-3.5 whitespace-nowrap border-b-2 transition ${
                  activeTab === 'brand'
                    ? 'border-[#D4AF5A] text-[#E9D08A] bg-[#2E0A0F]'
                    : 'border-transparent text-[#E4D7C0] hover:text-[#E9D08A]'
                }`}
              >
                Brand
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('hero')}
                className={`py-2.5 px-3.5 whitespace-nowrap border-b-2 transition ${
                  activeTab === 'hero'
                    ? 'border-[#D4AF5A] text-[#E9D08A] bg-[#2E0A0F]'
                    : 'border-transparent text-[#E4D7C0] hover:text-[#E9D08A]'
                }`}
              >
                Hero
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('promo')}
                className={`py-2.5 px-3.5 whitespace-nowrap border-b-2 transition ${
                  activeTab === 'promo'
                    ? 'border-[#D4AF5A] text-[#E9D08A] bg-[#2E0A0F]'
                    : 'border-transparent text-[#E4D7C0] hover:text-[#E9D08A]'
                }`}
              >
                Festive Promo
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('story')}
                className={`py-2.5 px-3.5 whitespace-nowrap border-b-2 transition ${
                  activeTab === 'story'
                    ? 'border-[#D4AF5A] text-[#E9D08A] bg-[#2E0A0F]'
                    : 'border-transparent text-[#E4D7C0] hover:text-[#E9D08A]'
                }`}
              >
                Story &amp; Policies
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('social')}
                className={`py-2.5 px-3.5 whitespace-nowrap border-b-2 transition ${
                  activeTab === 'social'
                    ? 'border-[#D4AF5A] text-[#E9D08A] bg-[#2E0A0F]'
                    : 'border-transparent text-[#E4D7C0] hover:text-[#E9D08A]'
                }`}
              >
                Social
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
              {activeTab === 'announcement' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[#E9D08A] font-semibold mb-1">
                      Free Shipping Announcement Text (Desktop)
                    </label>
                    <input
                      type="text"
                      value={content.announcement.freeShippingText}
                      onChange={(e) => updateField('announcement.freeShippingText', e.target.value)}
                      className="w-full bg-[#2E0A0F] border border-[#D4AF5A]/40 rounded-lg p-2.5 text-[#F7F0DE] focus:outline-none focus:border-[#E9D08A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#E9D08A] font-semibold mb-1">
                      Free Shipping Text (Mobile Compact)
                    </label>
                    <input
                      type="text"
                      value={content.announcement.freeShippingMobileText}
                      onChange={(e) => updateField('announcement.freeShippingMobileText', e.target.value)}
                      className="w-full bg-[#2E0A0F] border border-[#D4AF5A]/40 rounded-lg p-2.5 text-[#F7F0DE] focus:outline-none focus:border-[#E9D08A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#E9D08A] font-semibold mb-1">
                      WhatsApp Support Label
                    </label>
                    <input
                      type="text"
                      value={content.announcement.whatsappText}
                      onChange={(e) => updateField('announcement.whatsappText', e.target.value)}
                      className="w-full bg-[#2E0A0F] border border-[#D4AF5A]/40 rounded-lg p-2.5 text-[#F7F0DE] focus:outline-none focus:border-[#E9D08A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#E9D08A] font-semibold mb-1">
                      WhatsApp Support Number (10 Digits)
                    </label>
                    <input
                      type="text"
                      value={content.announcement.whatsappNumber}
                      onChange={(e) => updateField('announcement.whatsappNumber', e.target.value)}
                      className="w-full bg-[#2E0A0F] border border-[#D4AF5A]/40 rounded-lg p-2.5 text-[#F7F0DE] focus:outline-none focus:border-[#E9D08A]"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'brand' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[#E9D08A] font-semibold mb-1">
                      Brand Name
                    </label>
                    <input
                      type="text"
                      value={content.brand.name}
                      onChange={(e) => updateField('brand.name', e.target.value)}
                      className="w-full bg-[#2E0A0F] border border-[#D4AF5A]/40 rounded-lg p-2.5 text-[#F7F0DE] focus:outline-none focus:border-[#E9D08A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#E9D08A] font-semibold mb-1">
                      Tagline (Subheader)
                    </label>
                    <input
                      type="text"
                      value={content.brand.tagline}
                      onChange={(e) => updateField('brand.tagline', e.target.value)}
                      className="w-full bg-[#2E0A0F] border border-[#D4AF5A]/40 rounded-lg p-2.5 text-[#F7F0DE] focus:outline-none focus:border-[#E9D08A]"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'hero' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[#E9D08A] font-semibold mb-1">
                      Hero Eyebrow Badge
                    </label>
                    <input
                      type="text"
                      value={content.hero.eyebrow}
                      onChange={(e) => updateField('hero.eyebrow', e.target.value)}
                      className="w-full bg-[#2E0A0F] border border-[#D4AF5A]/40 rounded-lg p-2.5 text-[#F7F0DE] focus:outline-none focus:border-[#E9D08A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#E9D08A] font-semibold mb-1">
                      Hero Headline
                    </label>
                    <input
                      type="text"
                      value={content.hero.title}
                      onChange={(e) => updateField('hero.title', e.target.value)}
                      className="w-full bg-[#2E0A0F] border border-[#D4AF5A]/40 rounded-lg p-2.5 text-[#F7F0DE] focus:outline-none focus:border-[#E9D08A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#E9D08A] font-semibold mb-1">
                      Hero Description Text
                    </label>
                    <textarea
                      rows={4}
                      value={content.hero.description}
                      onChange={(e) => updateField('hero.description', e.target.value)}
                      className="w-full bg-[#2E0A0F] border border-[#D4AF5A]/40 rounded-lg p-2.5 text-[#F7F0DE] focus:outline-none focus:border-[#E9D08A]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#E9D08A] font-semibold mb-1">
                        Primary CTA Text
                      </label>
                      <input
                        type="text"
                        value={content.hero.primaryCtaText}
                        onChange={(e) => updateField('hero.primaryCtaText', e.target.value)}
                        className="w-full bg-[#2E0A0F] border border-[#D4AF5A]/40 rounded-lg p-2.5 text-[#F7F0DE] focus:outline-none focus:border-[#E9D08A]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#E9D08A] font-semibold mb-1">
                        Secondary CTA Text
                      </label>
                      <input
                        type="text"
                        value={content.hero.secondaryCtaText}
                        onChange={(e) => updateField('hero.secondaryCtaText', e.target.value)}
                        className="w-full bg-[#2E0A0F] border border-[#D4AF5A]/40 rounded-lg p-2.5 text-[#F7F0DE] focus:outline-none focus:border-[#E9D08A]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'promo' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[#E9D08A] font-semibold mb-1">
                      Promo Eyebrow Badge
                    </label>
                    <input
                      type="text"
                      value={content.festivePromo.eyebrow}
                      onChange={(e) => updateField('festivePromo.eyebrow', e.target.value)}
                      className="w-full bg-[#2E0A0F] border border-[#D4AF5A]/40 rounded-lg p-2.5 text-[#F7F0DE] focus:outline-none focus:border-[#E9D08A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#E9D08A] font-semibold mb-1">
                      Promo Headline
                    </label>
                    <input
                      type="text"
                      value={content.festivePromo.title}
                      onChange={(e) => updateField('festivePromo.title', e.target.value)}
                      className="w-full bg-[#2E0A0F] border border-[#D4AF5A]/40 rounded-lg p-2.5 text-[#F7F0DE] focus:outline-none focus:border-[#E9D08A]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#E9D08A] font-semibold mb-1">
                        Discount Big (e.g. 20%)
                      </label>
                      <input
                        type="text"
                        value={content.festivePromo.discount}
                        onChange={(e) => updateField('festivePromo.discount', e.target.value)}
                        className="w-full bg-[#2E0A0F] border border-[#D4AF5A]/40 rounded-lg p-2.5 text-[#F7F0DE] focus:outline-none focus:border-[#E9D08A]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#E9D08A] font-semibold mb-1">
                        Discount Sub (e.g. OFF)
                      </label>
                      <input
                        type="text"
                        value={content.festivePromo.discountSub}
                        onChange={(e) => updateField('festivePromo.discountSub', e.target.value)}
                        className="w-full bg-[#2E0A0F] border border-[#D4AF5A]/40 rounded-lg p-2.5 text-[#F7F0DE] focus:outline-none focus:border-[#E9D08A]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[#E9D08A] font-semibold mb-1">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      value={content.festivePromo.subtitle}
                      onChange={(e) => updateField('festivePromo.subtitle', e.target.value)}
                      className="w-full bg-[#2E0A0F] border border-[#D4AF5A]/40 rounded-lg p-2.5 text-[#F7F0DE] focus:outline-none focus:border-[#E9D08A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#E9D08A] font-semibold mb-1">
                      Promo CTA Button Label
                    </label>
                    <input
                      type="text"
                      value={content.festivePromo.ctaText}
                      onChange={(e) => updateField('festivePromo.ctaText', e.target.value)}
                      className="w-full bg-[#2E0A0F] border border-[#D4AF5A]/40 rounded-lg p-2.5 text-[#F7F0DE] focus:outline-none focus:border-[#E9D08A]"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'story' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[#E9D08A] font-semibold mb-1">
                      Story Eyebrow
                    </label>
                    <input
                      type="text"
                      value={content.storySection.eyebrow}
                      onChange={(e) => updateField('storySection.eyebrow', e.target.value)}
                      className="w-full bg-[#2E0A0F] border border-[#D4AF5A]/40 rounded-lg p-2.5 text-[#F7F0DE] focus:outline-none focus:border-[#E9D08A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#E9D08A] font-semibold mb-1">
                      Story Title
                    </label>
                    <input
                      type="text"
                      value={content.storySection.title}
                      onChange={(e) => updateField('storySection.title', e.target.value)}
                      className="w-full bg-[#2E0A0F] border border-[#D4AF5A]/40 rounded-lg p-2.5 text-[#F7F0DE] focus:outline-none focus:border-[#E9D08A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#E9D08A] font-semibold mb-1">
                      Story Paragraph
                    </label>
                    <textarea
                      rows={4}
                      value={content.storySection.description}
                      onChange={(e) => updateField('storySection.description', e.target.value)}
                      className="w-full bg-[#2E0A0F] border border-[#D4AF5A]/40 rounded-lg p-2.5 text-[#F7F0DE] focus:outline-none focus:border-[#E9D08A]"
                    />
                  </div>
                  <div className="border-t border-[#D4AF5A]/30 pt-3 space-y-3">
                    <h4 className="font-serif font-bold text-[#E9D08A]">Three Policy Badges</h4>
                    <div>
                      <label className="block text-[#E4D7C0] text-xs font-semibold mb-1">
                        Shipping Policy Description
                      </label>
                      <input
                        type="text"
                        value={content.storySection.shippingText}
                        onChange={(e) => updateField('storySection.shippingText', e.target.value)}
                        className="w-full bg-[#2E0A0F] border border-[#D4AF5A]/40 rounded-lg p-2 text-[#F7F0DE] focus:outline-none focus:border-[#E9D08A]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#E4D7C0] text-xs font-semibold mb-1">
                        Returns Policy Description
                      </label>
                      <input
                        type="text"
                        value={content.storySection.returnsText}
                        onChange={(e) => updateField('storySection.returnsText', e.target.value)}
                        className="w-full bg-[#2E0A0F] border border-[#D4AF5A]/40 rounded-lg p-2 text-[#F7F0DE] focus:outline-none focus:border-[#E9D08A]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#E4D7C0] text-xs font-semibold mb-1">
                        Payments Policy Description
                      </label>
                      <input
                        type="text"
                        value={content.storySection.paymentsText}
                        onChange={(e) => updateField('storySection.paymentsText', e.target.value)}
                        className="w-full bg-[#2E0A0F] border border-[#D4AF5A]/40 rounded-lg p-2 text-[#F7F0DE] focus:outline-none focus:border-[#E9D08A]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'social' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[#E9D08A] font-semibold mb-1">
                      Social Section Title
                    </label>
                    <input
                      type="text"
                      value={content.socialSection.title}
                      onChange={(e) => updateField('socialSection.title', e.target.value)}
                      className="w-full bg-[#2E0A0F] border border-[#D4AF5A]/40 rounded-lg p-2.5 text-[#F7F0DE] focus:outline-none focus:border-[#E9D08A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#E9D08A] font-semibold mb-1">
                      Instagram Handle
                    </label>
                    <input
                      type="text"
                      value={content.socialSection.instagramHandle}
                      onChange={(e) => updateField('socialSection.instagramHandle', e.target.value)}
                      className="w-full bg-[#2E0A0F] border border-[#D4AF5A]/40 rounded-lg p-2.5 text-[#F7F0DE] focus:outline-none focus:border-[#E9D08A]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#E9D08A] font-semibold mb-1">
                      Facebook Handle
                    </label>
                    <input
                      type="text"
                      value={content.socialSection.facebookHandle}
                      onChange={(e) => updateField('socialSection.facebookHandle', e.target.value)}
                      className="w-full bg-[#2E0A0F] border border-[#D4AF5A]/40 rounded-lg p-2.5 text-[#F7F0DE] focus:outline-none focus:border-[#E9D08A]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer with Save & Close */}
            <div className="p-4 border-t border-[#D4AF5A]/30 bg-[#2E0A0F] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="py-2.5 px-4 rounded-lg text-xs font-semibold text-[#E4D7C0] hover:text-white"
              >
                Close Drawer
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ok = await saveChanges();
                  if (ok) setIsDrawerOpen(false);
                }}
                disabled={isSaving}
                className="py-2.5 px-5 rounded-lg text-xs font-bold tracking-wider uppercase bg-[#D4AF5A] text-[#2E0A0F] hover:bg-[#E9D08A] shadow-md transition flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
