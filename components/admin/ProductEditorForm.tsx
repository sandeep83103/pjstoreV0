'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product, Category } from '@/lib/types';
import { S3Uploader } from '@/components/admin/S3Uploader';
import { getCloudFrontAssetUrl } from '@/lib/aws/s3Client';
import { formatINR } from '@/lib/utils';
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Star,
  ExternalLink,
} from 'lucide-react';

interface ProductEditorFormProps {
  product: Product;
  categories: Category[];
}

export function ProductEditorForm({ product, categories }: ProductEditorFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(product.name);
  const [slug, setSlug] = useState(product.slug);
  const [sku, setSku] = useState(product.sku);
  const [supplierCode, setSupplierCode] = useState(product.supplierCode);
  const [categoryId, setCategoryId] = useState(product.categoryId);
  const [tags, setTags] = useState(product.tags.join(', '));
  const [description, setDescription] = useState(product.description);

  // Pricing
  const [price, setPrice] = useState<number>(product.price);
  const [mrp, setMrp] = useState<number>(product.mrp);
  const [costPrice, setCostPrice] = useState<number>(product.costPrice);

  // Inventory
  const [stock, setStock] = useState<number>(product.stock);
  const [lowStockAt, setLowStockAt] = useState<number>(product.lowStockAt);
  const [status, setStatus] = useState<'ACTIVE' | 'DRAFT' | 'ARCHIVED'>(product.status);

  // Specs
  const [baseMetal, setBaseMetal] = useState(product.specs['Base Metal'] || 'Copper Alloy');
  const [plating, setPlating] = useState(product.specs['Plating'] || '1-Gram Micro Gold');
  const [finish, setFinish] = useState(product.specs['Finish'] || 'Antique Gold');
  const [weight, setWeight] = useState(product.specs['Weight'] || '35 grams');
  const [occasion, setOccasion] = useState(product.specs['Occasion'] || 'Bridal, Festive');
  const [care, setCare] = useState(product.specs['Care'] || 'Keep away from moisture and perfume');

  // Images
  const [images, setImages] = useState<string[]>(product.images);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const marginPercent =
    price > 0 ? Math.round(((price - costPrice) / price) * 100) : 0;

  const handleUploadSuccess = (uploaded: { key: string }) => {
    setImages((prev) => [...prev, uploaded.key]);
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

  const getImgUrl = (key: string) => {
    if (key.startsWith('http')) return key;
    if (key.startsWith('brand/')) return `/${key}`;
    return getCloudFrontAssetUrl(key);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!title.trim()) {
      setFeedback({ type: 'error', message: 'Product title is required.' });
      return;
    }

    if (images.length === 0) {
      setFeedback({ type: 'error', message: 'At least 1 product image is required.' });
      return;
    }

    try {
      setIsSubmitting(true);

      const updates = {
        name: title.trim(),
        slug: slug.trim(),
        sku: sku.trim(),
        supplierCode: supplierCode.trim(),
        categoryId,
        tags: tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0),
        description: description.trim(),
        specs: {
          ...product.specs,
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
        stock: Math.round(stock),
        lowStockAt: Math.round(lowStockAt),
        images,
        status,
      };

      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const resJson = await res.json();
      if (!res.ok || !resJson.success) {
        throw new Error(resJson.error?.message || 'Failed to update product.');
      }

      setFeedback({
        type: 'success',
        message: 'Product successfully updated and logged in parnika_audit_logs.',
      });
      setIsSubmitting(false);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed.';
      setFeedback({ type: 'error', message: msg });
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Basic Info & Imagery */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info */}
          <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-sm text-[var(--color-primary-dark)]">
              Product Overview
            </h3>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Product Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none font-semibold text-stone-900"
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
                  className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
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
                className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Tags
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none"
              />
            </div>
          </div>

          {/* Media & S3 Direct Uploader */}
          <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-sm text-[var(--color-primary-dark)]">
              Gallery Images
            </h3>

            {/* S3 Uploader */}
            <S3Uploader productId={product.id} onUploadSuccess={handleUploadSuccess} />

            {/* Current Images */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                {images.map((key, idx) => (
                  <div
                    key={`${key}-${idx}`}
                    className="group relative aspect-square rounded-xl bg-stone-100 border border-stone-200 overflow-hidden"
                  >
                    <img
                      src={getImgUrl(key)}
                      alt="Product"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/brand/logo.png';
                      }}
                    />

                    {idx === 0 && (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[var(--color-accent-gold)] text-[var(--color-primary-dark)] font-bold text-[9px] uppercase tracking-wider shadow">
                        Primary
                      </span>
                    )}

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
            )}
          </div>

          {/* Jewellery Specs */}
          <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-sm text-[var(--color-primary-dark)]">
              Specifications
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
                  Weight
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
                  Care
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

        {/* Right Column: Pricing, Stock, Status */}
        <div className="space-y-6">
          {/* Pricing Box */}
          <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-sm text-[var(--color-primary-dark)]">
              Pricing &amp; Margins
            </h3>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Selling Price (₹)
              </label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none font-bold text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                MRP (₹ Strike-through)
              </label>
              <input
                type="number"
                required
                value={mrp}
                onChange={(e) => setMrp(Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Cost Price (₹ Admin Only)
              </label>
              <input
                type="number"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none"
              />
            </div>

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
                <span>{formatINR(price - costPrice)}</span>
              </div>
            </div>
          </div>

          {/* Stock & Codes */}
          <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-sm text-[var(--color-primary-dark)]">
              Stock &amp; Status
            </h3>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Supplier Code (DBI)
              </label>
              <input
                type="text"
                required
                value={supplierCode}
                onChange={(e) => setSupplierCode(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Current Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
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
                  onChange={(e) => setLowStockAt(Number(e.target.value))}
                  className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full text-xs px-3.5 py-2.5 border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none bg-white font-medium"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="DRAFT">DRAFT</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-[var(--color-primary-base)] hover:bg-[var(--color-primary-dark)] text-[var(--color-accent-light-gold)] font-semibold text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Updating...' : 'Save & Publish Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
