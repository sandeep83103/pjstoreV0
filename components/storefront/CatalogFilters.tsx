'use client';

import React, { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Filter, X, ChevronDown, Check, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { Category } from '@/lib/types';

interface CatalogFiltersProps {
  categories: Category[];
  totalProducts: number;
}

const FINISH_OPTIONS = [
  { label: 'Antique Gold', value: 'Antique Gold' },
  { label: 'Antique Matte Gold', value: 'Matte' },
  { label: 'Glossy Gold', value: 'Glossy' },
  { label: 'CZ Stone', value: 'CZ' },
  { label: 'Ruby / Emerald Inlay', value: 'Ruby' },
];

const OCCASION_OPTIONS = [
  { label: 'Bridal & Weddings', value: 'Bridal' },
  { label: 'Festive & Pujas', value: 'Festive' },
  { label: 'Daily & Office Wear', value: 'Daily' },
];

const SORT_OPTIONS = [
  { label: 'Newest Arrivals', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Best Sellers', value: 'bestseller' },
];

export function CatalogFilters({ categories, totalProducts }: CatalogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Read current active params
  const currentCategory = searchParams.get('category') || '';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentInStock = searchParams.get('inStock') === 'true' || searchParams.get('inStock') === '1';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentFinish = searchParams.get('finish') || '';
  const currentOccasion = searchParams.get('occasion') || '';

  // Count active filters
  let activeFilterCount = 0;
  if (currentCategory) activeFilterCount++;
  if (currentMinPrice || currentMaxPrice) activeFilterCount++;
  if (currentInStock) activeFilterCount++;
  if (currentFinish) activeFilterCount++;
  if (currentOccasion) activeFilterCount++;

  const updateFilter = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.push(pathname);
    setIsOpenMobile(false);
  };

  const handlePricePreset = (min: number | null, max: number | null) => {
    updateFilter({
      minPrice: min !== null ? String(min) : null,
      maxPrice: max !== null ? String(max) : null,
    });
  };

  const filterContent = (
    <div className="space-y-6">
      {/* Category Facet */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary-dark)] mb-3 flex items-center justify-between">
          <span>Categories</span>
          {currentCategory && (
            <button
              type="button"
              onClick={() => updateFilter({ category: null })}
              className="text-[10px] text-stone-400 hover:text-stone-700 font-medium normal-case"
            >
              Reset
            </button>
          )}
        </h4>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => updateFilter({ category: null })}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
              !currentCategory
                ? 'bg-[var(--color-primary-base)] text-[var(--color-accent-light-gold)] font-bold'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <span>All Categories</span>
          </button>
          {categories.map((cat) => {
            const isSelected = currentCategory === cat.slug || currentCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => updateFilter({ category: cat.slug })}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                  isSelected
                    ? 'bg-[var(--color-primary-base)] text-[var(--color-accent-light-gold)] font-bold'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <span>{cat.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* In-Stock Only Toggle */}
      <div className="pt-4 border-t border-stone-200">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={currentInStock}
            onChange={(e) => updateFilter({ inStock: e.target.checked ? 'true' : null })}
            className="w-4 h-4 rounded text-[var(--color-primary-base)] focus:ring-[var(--color-accent-gold)] border-stone-300"
          />
          <span className="text-xs font-medium text-stone-800">In Stock Only</span>
        </label>
      </div>

      {/* Price Range */}
      <div className="pt-4 border-t border-stone-200">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary-dark)] mb-3">
          Price Range (INR)
        </h4>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <input
            type="number"
            placeholder="Min ₹"
            value={currentMinPrice}
            onChange={(e) => updateFilter({ minPrice: e.target.value || null })}
            className="w-full text-xs px-2.5 py-1.5 border border-stone-300 rounded-lg focus:border-[var(--color-accent-gold)] focus:outline-none"
          />
          <input
            type="number"
            placeholder="Max ₹"
            value={currentMaxPrice}
            onChange={(e) => updateFilter({ maxPrice: e.target.value || null })}
            className="w-full text-xs px-2.5 py-1.5 border border-stone-300 rounded-lg focus:border-[var(--color-accent-gold)] focus:outline-none"
          />
        </div>

        {/* Price Presets */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: 'Under ₹1,500', min: null, max: 1500 },
            { label: '₹1,000–₹5,000', min: 1000, max: 5000 },
            { label: 'Above ₹5,000', min: 5000, max: null },
          ].map((preset) => {
            const isPresetActive =
              String(preset.min ?? '') === currentMinPrice &&
              String(preset.max ?? '') === currentMaxPrice;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handlePricePreset(preset.min, preset.max)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                  isPresetActive
                    ? 'border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/10 text-[var(--color-primary-dark)] font-semibold'
                    : 'border-stone-200 text-stone-600 hover:border-stone-300'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Material & Finish */}
      <div className="pt-4 border-t border-stone-200">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary-dark)] mb-3">
          Polish &amp; Finish
        </h4>
        <div className="space-y-1">
          {FINISH_OPTIONS.map((f) => {
            const isSelected = currentFinish === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => updateFilter({ finish: isSelected ? null : f.value })}
                className={`w-full text-left px-2.5 py-1 rounded-md text-xs transition-colors flex items-center justify-between ${
                  isSelected
                    ? 'bg-amber-50 text-[var(--color-primary-dark)] font-bold'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <span>{f.label}</span>
                {isSelected && <Check className="w-3 h-3 text-[var(--color-accent-gold)]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Occasion */}
      <div className="pt-4 border-t border-stone-200">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary-dark)] mb-3">
          Occasion
        </h4>
        <div className="space-y-1">
          {OCCASION_OPTIONS.map((o) => {
            const isSelected = currentOccasion === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => updateFilter({ occasion: isSelected ? null : o.value })}
                className={`w-full text-left px-2.5 py-1 rounded-md text-xs transition-colors flex items-center justify-between ${
                  isSelected
                    ? 'bg-amber-50 text-[var(--color-primary-dark)] font-bold'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <span>{o.label}</span>
                {isSelected && <Check className="w-3 h-3 text-[var(--color-accent-gold)]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clear All Filters Button */}
      {activeFilterCount > 0 && (
        <div className="pt-4 border-t border-stone-200">
          <button
            type="button"
            onClick={clearAllFilters}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear All Filters ({activeFilterCount})
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Top Bar with Sort Dropdown & Mobile Filter Button */}
      <div className="flex items-center justify-between py-3 mb-6 border-b border-stone-200 gap-4">
        <div className="flex items-center gap-2">
          {/* Mobile Filter Trigger */}
          <button
            type="button"
            onClick={() => setIsOpenMobile(true)}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>

          <span className="text-xs text-stone-500">
            Showing <strong className="text-stone-800">{totalProducts}</strong> pieces
          </span>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500 hidden sm:inline">Sort by:</span>
          <select
            value={currentSort}
            onChange={(e) => updateFilter({ sort: e.target.value })}
            className="text-xs font-medium bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 focus:border-[var(--color-accent-gold)] focus:outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Desktop Sidebar (Fixed column) */}
      <aside className="hidden lg:block w-64 shrink-0 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm self-start">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
          <span className="font-display font-bold text-sm text-[var(--color-primary-dark)] flex items-center gap-2">
            <Filter className="w-4 h-4 text-[var(--color-accent-gold)]" />
            Filter Catalog
          </span>
          {activeFilterCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-accent-gold)] text-[var(--color-primary-dark)]">
              {activeFilterCount}
            </span>
          )}
        </div>
        {filterContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpenMobile(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-6">
              <h3 className="font-display font-bold text-base text-[var(--color-primary-dark)]">
                Filters &amp; Refinements
              </h3>
              <button
                type="button"
                onClick={() => setIsOpenMobile(false)}
                className="p-1 rounded-md text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {filterContent}

            <div className="mt-8 pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setIsOpenMobile(false)}
                className="w-full py-2.5 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-accent-light-gold)] font-semibold text-xs tracking-wide shadow-md"
              >
                Apply Filters &amp; View {totalProducts} Items
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
