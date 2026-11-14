'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { S3Uploader } from '@/components/admin/S3Uploader';
import { slugify, formatINR } from '@/lib/utils';
import {
  ArrowLeft,
  Save,
  Sparkles,
  Image as ImageIcon,
  Trash2,
  Star,
  AlertCircle,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'cat-necklaces', name: 'Necklaces & Chokers' },
  { id: 'cat-earrings', name: 'Earrings & Jhumkas' },
  { id: 'cat-bangles', name: 'Bangles & Kadas' },
  { id: 'cat-rings', name: 'Rings' },
  { id: 'cat-bridal', name: 'Bridal Sets' },
  { id: 'cat-one-gram', name: 'One Gram Gold' },
  { id: 'cat-fashion', name: 'Fashion Jewellery' },
];

export default function AdminNewProductPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [supplierCode, setSupplierCode] = useState('');
  const [categoryId, setCategoryId] = useState('cat-necklaces');
  const [tags, setTags] = useState('one-gram-gold, festive');
  const [description, setDescription] = useState('');

  // Pricing
  const [price, setPrice] = useState<number | ''>('');
  const [mrp, setMrp] = useState<number | ''>('');
  const [costPrice, setCostPrice] = useState<number | ''>('');

  // Inventory
  const [stock, setStock] = useState<number | ''>(10);
  const [lowStockAt, setLowStockAt] = useState<number | ''>(3);
  const [status, setStatus] = useState<'ACTIVE' | 'DRAFT' | 'ARCHIVED'>('ACTIVE');

  // Specs
  const [baseMetal, setBaseMetal] = useState('Copper Alloy');
  const [plating, setPlating] = useState('24K Micro Gold Plated (1 Gram)');
  const [finish, setFinish] = useState('Antique Matte Gold');
  const [weight, setWeight] = useState('35 grams');
  const [occasion, setOccasion] = useState('Bridal, Festive, Weddings');
  const [care, setCare] = useState('Keep away from perfumes, sprays, and water moisture');

  // Images uploaded via direct S3 pre-signed uploader
  const [images, setImages] = useState<Array<{ key: string; assetUrl: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generate slug when title changes
  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSlug(slugify(val));
  };

  // Gross Margin Calculation
  const marginPercent =
    typeof price === 'number' && typeof costPrice === 'number' && price > 0
      ? Math.round(((price - costPrice) / price) * 100)
      : null;

  const handleUploadSuccess = (uploaded: { key: string; assetUrl: string }) => {
    setImages((prev) => [...prev, uploaded]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const setPrimaryImage = (index: number) => {
    setImages((prev) => {
      const copy = [...prev];
      const [selected] = copy.splice(index, 1);
      if (selected) copy.unshift(selected);
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Product title is required.');
      return;
    }

    if (!supplierCode.trim()) {
      setError('Supplier Code (e.g. DBI-102) is required for inventory management.');
      return;
    }

    if (typeof price !== 'number' || price <= 0) {
      setError('Please specify a valid selling price in whole INR.');
      return;
    }

    if (typeof mrp !== 'number' || mrp <= 0) {
      setError('Please specify a valid MRP in whole INR.');
      return;
    }

    if (typeof costPrice !== 'number' || costPrice <= 0) {
      setError('Please specify a valid cost price in whole INR.');
      return;
    }

    if (images.length === 0) {
      setError('Please upload at least 1 product image via S3 direct upload.');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        name: title.trim(),
        title: title.trim(),
        slug: slug.trim() || slugify(title),
        sku: sku.trim() || undefined,
        supplierCode: supplierCode.trim(),
        categoryId,
        tags: tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0),
        description: description.trim() || `${title} crafted in one-gram gold with royal finish.`,
        specs: {
          'Base Metal': baseMetal,
          'Plating': plating,
          'Finish': finish,
          'Weight': weight,
          'Occasion': occasion,
          'Care': care,
        },
        price: Math.round(price),
        mrp: Math.round(mrp),
        costPrice: Math.round(costPrice),
        stock: typeof stock === 'number' ? Math.round(stock) : 0,
        lowStockAt: typeof lowStockAt === 'number' ? Math.round(lowStockAt) : 3,
        images: images.map((img) => img.key),
        status,
      };

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok || !resJson.success) {
        throw new Error(resJson.error?.message || 'Failed to create product.');
      }

      router.push('/admin/inventory');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while creating product.';
      setError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/inventory"
            className="p-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--color-primary-dark)]">
              Add New Jewellery Item
            </h1>
            <p className="text-xs text-stone-500">
              Create a new product listing with direct S3 media uploads.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary-base)] hover:bg-[var(--color-primary-dark)] text-[var(--color-accent-light-gold)] text-xs font-semibold shadow-md transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSubmitting ? 'Creating...' : 'Save Product'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Main Info & Imagery */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Box */}
          <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-sm text-[var(--color-primary-dark)]">
              Product Overview
            </h3>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Product Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Royal Heritage One Gram Gold Haar Necklace"
                className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="royal-heritage-one-gram-gold-haar"
                  className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none bg-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail the craft, traditional motifs, stones, and micro-plating longevity..."
                className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Search Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="one-gram-gold, necklace, temple, bridal"
                className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none"
              />
            </div>
          </div>

          {/* Media Imagery S3 Uploader Box */}
          <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-[var(--color-primary-dark)]">
                Product Gallery (S3 Pre-Signed Pipeline)
              </h3>
              <span className="text-xs text-stone-400">
                {images.length} {images.length === 1 ? 'image' : 'images'} attached
              </span>
            </div>

            {/* Direct S3 Upload Component */}
            <S3Uploader onUploadSuccess={handleUploadSuccess} />

            {/* Uploaded Thumbnails Manager */}
            {images.length > 0 && (
              <div className="pt-4 border-t border-stone-100">
                <p className="text-xs font-semibold text-stone-700 mb-2">
                  Gallery Images (First image is primary thumbnail):
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {images.map((img, idx) => (
                    <div
                      key={img.key}
                      className="group relative aspect-square rounded-xl bg-stone-100 border border-stone-200 overflow-hidden"
                    >
                      <img
                        src={img.assetUrl}
                        alt="Product upload"
                        className="w-full h-full object-cover"
                      />
                      {idx === 0 && (
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[var(--color-accent-gold)] text-[var(--color-primary-dark)] font-bold text-[9px] uppercase tracking-wider shadow">
                          Primary
                        </span>
                      )}

                      {/* Hover Actions */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {idx !== 0 && (
                          <button
                            type="button"
                            onClick={() => setPrimaryImage(idx)}
                            className="p-1.5 rounded-lg bg-white/90 text-stone-800 hover:bg-white"
                            title="Set as Primary"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700"
                          title="Remove Image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Jewellery Specifications Box */}
          <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-sm text-[var(--color-primary-dark)]">
              Jewellery Technical Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Base Metal
                </label>
                <input
                  type="text"
                  value={baseMetal}
                  onChange={(e) => setBaseMetal(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Plating / Polish
                </label>
                <input
                  type="text"
                  value={plating}
                  onChange={(e) => setPlating(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Finish
                </label>
                <input
                  type="text"
                  value={finish}
                  onChange={(e) => setFinish(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Weight (approx)
                </label>
                <input
                  type="text"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Occasion
                </label>
                <input
                  type="text"
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Care Instructions
                </label>
                <input
                  type="text"
                  value={care}
                  onChange={(e) => setCare(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Pricing, Stock, Status */}
        <div className="space-y-6">
          {/* Pricing & Margins */}
          <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-sm text-[var(--color-primary-dark)]">
              Pricing &amp; Margins
            </h3>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Selling Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                placeholder="3499"
                className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none font-bold text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                MRP (Strike-through ₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                value={mrp}
                onChange={(e) => setMrp(e.target.value ? Number(e.target.value) : '')}
                placeholder="6999"
                className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none text-stone-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Cost Price (₹ Admin Only) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value ? Number(e.target.value) : '')}
                placeholder="1800"
                className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none text-stone-600"
              />
            </div>

            {/* Calculated Margin Box */}
            {marginPercent !== null && (
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-stone-500 font-medium">Gross Margin:</span>
                  <span
                    className={`font-bold ${
                      marginPercent >= 40 ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {marginPercent}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-stone-400">
                  <span>Profit Per Piece:</span>
                  <span>
                    {formatINR((Number(price) || 0) - (Number(costPrice) || 0))}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Inventory Controls */}
          <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-sm text-[var(--color-primary-dark)]">
              Inventory &amp; Codes
            </h3>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Supplier Code (DBI Tag) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={supplierCode}
                onChange={(e) => setSupplierCode(e.target.value)}
                placeholder="e.g. DBI-102"
                className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none font-mono font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Product SKU (Auto if blank)
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="PJ-OG-NCK-001"
                className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Initial Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Low-Stock At
                </label>
                <input
                  type="number"
                  min="1"
                  value={lowStockAt}
                  onChange={(e) => setLowStockAt(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Catalog Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none bg-white font-medium"
              >
                <option value="ACTIVE">ACTIVE (Visible in Store)</option>
                <option value="DRAFT">DRAFT (Hidden from Buyers)</option>
                <option value="ARCHIVED">ARCHIVED (Discontinued)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
