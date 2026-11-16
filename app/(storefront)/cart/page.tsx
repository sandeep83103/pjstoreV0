'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Tag,
  ShieldCheck,
  Truck,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { useCart } from '@/app/context/CartContext';
import { formatINR } from '@/lib/utils';
import { getCloudFrontAssetUrl } from '@/lib/aws/s3Client';

export default function CartPage() {
  const {
    items,
    itemCount,
    subtotal,
    discount,
    shippingFee,
    total,
    couponCode,
    updateQuantity,
    removeItem,
    applyCoupon,
    removeCoupon,
    stockAlerts,
    clearStockAlerts,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    if (!couponInput.trim()) return;

    setIsApplying(true);
    const res = await applyCoupon(couponInput);
    setIsApplying(false);

    if (res.success) {
      setCouponInput('');
    } else {
      setCouponError(res.message || 'Failed to apply coupon.');
    }
  };

  const freeShippingThreshold = 599;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav className="text-xs text-stone-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-[var(--color-primary-base)]">
          Home
        </Link>
        <span>/</span>
        <span className="text-stone-900 font-medium">Shopping Bag</span>
      </nav>

      <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-200">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
            Shopping Bag
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            {itemCount > 0
              ? `You have ${itemCount} ${itemCount === 1 ? 'item' : 'items'} in your bag`
              : 'Your bag is currently empty'}
          </p>
        </div>
        {itemCount > 0 && (
          <Link
            href="/catalog"
            className="text-xs sm:text-sm font-semibold text-[var(--color-primary-base)] hover:text-[var(--color-primary-dark)] flex items-center gap-1"
          >
            Continue Shopping →
          </Link>
        )}
      </div>

      {/* Stock Alerts (EC-INV-04 / EVAL-P4-02) */}
      {stockAlerts.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm flex items-start justify-between shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold">Inventory Notice</h4>
              {stockAlerts.map((alert, idx) => (
                <p key={idx} className="text-xs sm:text-sm">{alert}</p>
              ))}
            </div>
          </div>
          <button
            onClick={clearStockAlerts}
            className="text-amber-700 hover:text-amber-900 font-bold p-1 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {items.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-stone-200/80 p-12 text-center max-w-lg mx-auto shadow-sm my-8">
          <div className="w-20 h-20 rounded-full bg-[var(--color-surface-ivory)] border border-[var(--color-accent-gold)]/30 flex items-center justify-center mx-auto text-[var(--color-primary-base)] mb-4">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="font-display text-xl font-bold text-stone-900 mb-2">
            Your shopping bag is empty
          </h2>
          <p className="text-sm text-stone-500 mb-6">
            Explore our curated collections of One Gram Gold necklaces, bridal haar, and temple jewellery.
          </p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-accent-light-gold)] font-semibold text-sm hover:bg-[var(--color-primary-dark)] shadow-md transition-all"
          >
            Explore Jewellery Collections
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        /* Active Cart Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Line Items Table/List (Col 8) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Free Shipping Progress Card */}
            <div className="p-4 bg-[var(--color-primary-base)] text-white rounded-xl shadow-md border border-[var(--color-accent-gold)]/20">
              <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                {remainingForFreeShipping > 0 ? (
                  <span>
                    Add <span className="font-bold text-[var(--color-accent-gold)]">{formatINR(remainingForFreeShipping)}</span> more to qualify for <span className="font-semibold text-white">FREE Insured Express Shipping</span>!
                  </span>
                ) : (
                  <span className="text-emerald-300 font-bold flex items-center gap-2">
                    ✨ Congratulations! Your order qualifies for FREE Insured Express Shipping.
                  </span>
                )}
                <span className="text-xs text-[var(--color-accent-light-gold)] font-semibold">
                  {Math.round(Math.min(100, (subtotal / freeShippingThreshold) * 100))}%
                </span>
              </div>
              <div className="w-full bg-black/30 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[var(--color-accent-gold)] h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
                />
              </div>
            </div>

            {/* Items Card List */}
            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden divide-y divide-stone-100">
              {items.map((item) => {
                const imageUrl = item.imageKey
                  ? item.imageKey.startsWith('/')
                    ? item.imageKey
                    : getCloudFrontAssetUrl(item.imageKey)
                  : '/brand/crest.jpg';
                return (
                  <div
                    key={`${item.productId}-${item.variantId || 'default'}`}
                    className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center justify-between"
                  >
                    {/* Item Image & Info */}
                    <div className="flex gap-4 items-center">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-stone-100 bg-stone-50 flex-shrink-0">
                        <Image
                          src={imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="space-y-1">
                        <Link
                          href={`/product/${item.slug}`}
                          className="font-display font-semibold text-sm sm:text-base text-stone-900 hover:text-[var(--color-primary-base)] transition-colors"
                        >
                          {item.name}
                        </Link>
                        <p className="text-xs text-stone-400">SKU: {item.sku}</p>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-sm sm:text-base text-[var(--color-primary-base)]">
                            {formatINR(item.price)}
                          </span>
                          {item.mrp > item.price && (
                            <span className="text-xs text-stone-400 line-through">
                              {formatINR(item.mrp)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity Controls & Line Total */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                      {/* Quantity */}
                      <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                          className="p-2 text-stone-600 hover:text-stone-900 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs sm:text-sm font-semibold text-stone-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                          disabled={item.quantity >= item.stock}
                          className={`p-2 transition-colors ${
                            item.quantity >= item.stock
                              ? 'text-stone-300 cursor-not-allowed'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Total for item */}
                      <div className="text-right min-w-[80px]">
                        <span className="font-extrabold text-sm sm:text-base text-stone-900">
                          {formatINR(item.price * item.quantity)}
                        </span>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="text-stone-400 hover:text-[var(--color-ruby-alert)] p-2 transition-colors"
                        title="Remove product from cart"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="p-4 bg-white rounded-xl border border-stone-200/70 flex items-center gap-3">
                <Truck className="w-6 h-6 text-[var(--color-accent-gold)] flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-stone-900">Insured Delivery</p>
                  <p className="text-stone-500">Safely sealed across India</p>
                </div>
              </div>
              <div className="p-4 bg-white rounded-xl border border-stone-200/70 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-[var(--color-primary-base)] flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-stone-900">Authentic 1-Gram</p>
                  <p className="text-stone-500">Certified micro-gold plating</p>
                </div>
              </div>
              <div className="p-4 bg-white rounded-xl border border-stone-200/70 flex items-center gap-3">
                <RotateCcw className="w-6 h-6 text-[var(--color-ruby-alert)] flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-stone-900">Hassle-Free Support</p>
                  <p className="text-stone-500">Fast assistance via WhatsApp</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary (Col 4) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm space-y-6 sticky top-28">
            <h2 className="font-display text-lg font-bold text-stone-900 pb-3 border-b border-stone-100">
              Order Summary
            </h2>

            {/* Coupon Box */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-700">Promo / Coupon Code</label>
              {couponCode ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="font-bold tracking-wider">{couponCode}</span>
                      <p className="text-[11px] text-emerald-600">Saved {formatINR(discount)}</p>
                    </div>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-emerald-700 hover:text-emerald-900 font-bold p-1"
                    title="Remove coupon"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-1">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. FESTIVE500"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="flex-1 uppercase text-xs px-3 py-2.5 border border-stone-300 rounded-xl focus:outline-none focus:border-[var(--color-primary-base)]"
                    />
                    <button
                      type="submit"
                      disabled={isApplying || !couponInput.trim()}
                      className="px-4 py-2.5 bg-[var(--color-primary-base)] text-[var(--color-accent-light-gold)] rounded-xl text-xs font-bold hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50"
                    >
                      {isApplying ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-[var(--color-ruby-alert)] font-medium pt-1">
                      {couponError}
                    </p>
                  )}
                </form>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-3 text-xs sm:text-sm text-stone-600 pt-3 border-t border-stone-100">
              <div className="flex justify-between">
                <span>Subtotal ({itemCount} items)</span>
                <span className="font-semibold text-stone-900">{formatINR(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-{formatINR(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping Charges</span>
                <span>
                  {shippingFee === 0 ? (
                    <span className="text-emerald-700 font-semibold">FREE</span>
                  ) : (
                    formatINR(shippingFee)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-stone-900 pt-3 border-t border-stone-200">
                <span>Total Amount</span>
                <span className="text-[var(--color-primary-base)] text-lg">{formatINR(total)}</span>
              </div>
              <p className="text-[11px] text-stone-400">Inclusive of all applicable GST taxes</p>
            </div>

            {/* Checkout CTA */}
            <Link
              href="/checkout"
              className="w-full py-4 px-6 bg-[var(--color-accent-gold)] hover:bg-[var(--color-accent-light-gold)] text-[var(--color-primary-dark)] font-bold text-sm sm:text-base rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98"
            >
              Proceed to Checkout
              <ArrowRight className="w-5 h-5" />
            </Link>

            <div className="text-center">
              <span className="text-[11px] text-stone-400 flex items-center justify-center gap-1">
                🔒 Safe &amp; Encrypted 256-Bit SSL Checkout
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
