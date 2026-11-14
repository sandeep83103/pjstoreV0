'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, AlertTriangle } from 'lucide-react';
import { useCart } from '@/app/context/CartContext';
import { formatINR } from '@/lib/utils';
import { getCloudFrontAssetUrl } from '@/lib/aws/s3Client';

export function CartDrawer() {
  const {
    items,
    itemCount,
    subtotal,
    discount,
    shippingFee,
    total,
    couponCode,
    isDrawerOpen,
    closeDrawer,
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

  if (!isDrawerOpen) return null;

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

  const freeShippingThreshold = 1999;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={closeDrawer}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[var(--color-surface-ivory)] shadow-2xl flex flex-col border-l border-[var(--color-accent-gold)]/20">
          
          {/* Header */}
          <div className="p-4 sm:p-5 bg-[var(--color-primary-base)] text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[var(--color-accent-light-gold)]" />
              <h2 className="font-display text-lg font-bold text-[var(--color-accent-light-gold)]">
                Shopping Bag ({itemCount})
              </h2>
            </div>
            <button
              onClick={closeDrawer}
              className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stock Alerts Notice */}
          {stockAlerts.length > 0 && (
            <div className="p-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {stockAlerts.map((alert, idx) => (
                    <p key={idx} className="font-medium">{alert}</p>
                  ))}
                </div>
              </div>
              <button
                onClick={clearStockAlerts}
                className="text-amber-700 hover:text-amber-900 font-bold text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {/* Free Shipping Progress Indicator */}
          {subtotal > 0 && (
            <div className="px-5 py-2.5 bg-[var(--color-primary-dark)] text-white text-xs border-b border-[var(--color-accent-gold)]/10">
              {remainingForFreeShipping > 0 ? (
                <p className="text-[var(--color-accent-light-gold)]">
                  Add <span className="font-bold text-[var(--color-accent-gold)]">{formatINR(remainingForFreeShipping)}</span> more for <span className="font-semibold text-white">FREE Insured Shipping</span>!
                </p>
              ) : (
                <p className="text-emerald-300 font-semibold flex items-center gap-1.5">
                  ✨ Congratulations! You unlocked FREE Insured Shipping.
                </p>
              )}
              <div className="w-full bg-white/20 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-[var(--color-accent-gold)] h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Item List / Empty State */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 text-stone-500">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-stone-800">Your bag is empty</h3>
                  <p className="text-xs text-stone-500 mt-1">Discover our royal 1-gram gold and bridal collections.</p>
                </div>
                <Link
                  href="/catalog"
                  onClick={closeDrawer}
                  className="px-5 py-2.5 rounded-lg bg-[var(--color-primary-base)] text-[var(--color-accent-light-gold)] text-xs font-semibold hover:bg-[var(--color-primary-dark)] transition-colors shadow-sm"
                >
                  Explore Jewellery
                </Link>
              </div>
            ) : (
              items.map((item) => {
                const imageUrl = item.imageKey ? getCloudFrontAssetUrl(item.imageKey) : '/brand/logo.png';
                return (
                  <div
                    key={`${item.productId}-${item.variantId || 'default'}`}
                    className="flex gap-3 p-3 bg-white rounded-xl border border-stone-200/80 shadow-sm"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-stone-100 flex-shrink-0 bg-stone-50">
                      <Image
                        src={imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <Link
                            href={`/product/${item.slug}`}
                            onClick={closeDrawer}
                            className="font-medium text-xs sm:text-sm text-stone-900 hover:text-[var(--color-primary-base)] transition-colors line-clamp-1"
                          >
                            {item.name}
                          </Link>
                          <button
                            onClick={() => removeItem(item.productId, item.variantId)}
                            className="text-stone-400 hover:text-[var(--color-ruby-alert)] p-1 transition-colors"
                            title="Remove item"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-stone-400 uppercase tracking-wider mt-0.5">
                          SKU: {item.sku}
                        </p>
                      </div>

                      {/* Price and Quantity */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-bold text-xs sm:text-sm text-[var(--color-primary-base)]">
                            {formatINR(item.price)}
                          </span>
                          {item.mrp > item.price && (
                            <span className="text-[10px] text-stone-400 line-through">
                              {formatINR(item.mrp)}
                            </span>
                          )}
                        </div>

                        {/* Quantity Counter */}
                        <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                            className="p-1 sm:p-1.5 text-stone-600 hover:text-stone-900 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-semibold text-stone-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                            disabled={item.quantity >= item.stock}
                            className={`p-1 sm:p-1.5 transition-colors ${
                              item.quantity >= item.stock
                                ? 'text-stone-300 cursor-not-allowed'
                                : 'text-stone-600 hover:text-stone-900'
                            }`}
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Breakdown & Actions */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 bg-white border-t border-stone-200/80 shadow-inner space-y-3">
              
              {/* Coupon Form */}
              <div className="pb-2 border-b border-stone-100">
                {couponCode ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg text-xs">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-bold tracking-wider">{couponCode}</span>
                      <span className="text-emerald-600">(-{formatINR(discount)})</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-emerald-700 hover:text-emerald-900 font-bold ml-2"
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
                        placeholder="Coupon code (e.g. FESTIVE500)"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        className="flex-1 uppercase text-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[var(--color-primary-base)]"
                      />
                      <button
                        type="submit"
                        disabled={isApplying || !couponInput.trim()}
                        className="px-3 py-2 bg-[var(--color-primary-base)] text-[var(--color-accent-light-gold)] rounded-lg text-xs font-semibold hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50"
                      >
                        {isApplying ? 'Applying...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-[11px] text-[var(--color-ruby-alert)] font-medium">
                        {couponError}
                      </p>
                    )}
                  </form>
                )}
              </div>

              {/* Price Calculation Rows */}
              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-stone-900">{formatINR(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount</span>
                    <span>-{formatINR(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Insured Shipping</span>
                  <span>{shippingFee === 0 ? <span className="text-emerald-700 font-semibold">FREE</span> : formatINR(shippingFee)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-stone-900 pt-2 border-t border-stone-100">
                  <span>Estimated Total</span>
                  <span className="text-[var(--color-primary-base)] text-base font-extrabold">{formatINR(total)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Link
                  href="/checkout"
                  onClick={closeDrawer}
                  className="w-full py-3 px-4 bg-[var(--color-accent-gold)] hover:bg-[var(--color-accent-light-gold)] text-[var(--color-primary-dark)] font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/cart"
                  onClick={closeDrawer}
                  className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-xl flex items-center justify-center transition-colors"
                >
                  View Full Cart &amp; Details
                </Link>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
