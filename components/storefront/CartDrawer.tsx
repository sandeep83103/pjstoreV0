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

  const freeShippingThreshold = 599;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={closeDrawer}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
        <div className="w-screen max-w-md bg-[#110F0C] text-[#F5EFEB] shadow-2xl flex flex-col border-l border-gold">
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 bg-[#18130B] border-b border-gold flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
              <h2 className="font-serif text-xl font-bold gold-gradient">
                Shopping Bag ({itemCount})
              </h2>
            </div>
            <button
              onClick={closeDrawer}
              className="p-1 rounded-full text-[#CBB99F] hover:text-[#D4AF37] transition-colors"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stock Alerts Notice */}
          {stockAlerts.length > 0 && (
            <div className="p-3 bg-amber-950/80 border-b border-amber-600/50 text-amber-200 text-xs flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {stockAlerts.map((alert, idx) => (
                    <p key={idx} className="font-medium">{alert}</p>
                  ))}
                </div>
              </div>
              <button
                onClick={clearStockAlerts}
                className="text-amber-400 hover:text-white font-bold text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {/* Free Shipping Progress Indicator */}
          {subtotal > 0 && (
            <div className="px-5 py-2.5 bg-[#14110C] text-xs border-b border-gold">
              {remainingForFreeShipping > 0 ? (
                <p className="text-[#CBB99F]">
                  Add <span className="font-bold text-[#FBE8A6]">{formatINR(remainingForFreeShipping)}</span> more for <span className="font-semibold text-white">FREE Insured Delivery</span>!
                </p>
              ) : (
                <p className="text-[#25D366] font-semibold flex items-center gap-1.5">
                  ✨ Congratulations! You unlocked FREE Insured Delivery.
                </p>
              )}
              <div className="w-full bg-[#262016] h-1.5 rounded-full mt-2 overflow-hidden border border-[#3E321E]">
                <div
                  className="bg-gradient-to-r from-[#D4AF37] to-[#FBE8A6] h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Item List / Empty State */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 text-[#A89B88]">
                <div className="w-16 h-16 rounded-full border border-gold flex items-center justify-center bg-[#18130B] text-[#D4AF37]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#F5EFEB]">Your bag is empty</h3>
                  <p className="text-xs text-[#A89B88] mt-1">Discover our royal 1-gram gold and bridal collections.</p>
                </div>
                <Link
                  href="/catalog"
                  onClick={closeDrawer}
                  className="btn-gold px-6 py-2.5 rounded text-xs font-semibold"
                >
                  Explore Jewellery
                </Link>
              </div>
            ) : (
              items.map((item) => {
                const imageUrl = item.imageKey
                  ? item.imageKey.startsWith('/')
                    ? item.imageKey
                    : getCloudFrontAssetUrl(item.imageKey)
                  : '/brand/crest.jpg';
                return (
                  <div
                    key={`${item.productId}-${item.variantId || 'default'}`}
                    className="flex gap-3 p-3 bg-[#18140E] rounded-xl border border-gold shadow-sm"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-gold/40 shrink-0 bg-[#0E0C09]">
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
                            className="font-serif font-bold text-sm text-[#F5EFEB] hover:text-[#FBE8A6] transition-colors line-clamp-1"
                          >
                            {item.name}
                          </Link>
                          <button
                            onClick={() => removeItem(item.productId, item.variantId)}
                            className="text-[#A89B88] hover:text-[#9B111E] p-1 transition-colors"
                            title="Remove item"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-[#A89B88] font-mono mt-0.5">
                          SKU: {item.sku}
                        </p>
                      </div>

                      {/* Price and Quantity */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gold">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-serif font-bold text-sm gold-gradient">
                            {formatINR(item.price)}
                          </span>
                          {item.mrp > item.price && (
                            <span className="text-[10px] text-[#A89B88] line-through">
                              {formatINR(item.mrp)}
                            </span>
                          )}
                        </div>

                        {/* Quantity Counter */}
                        <div className="flex items-center border border-gold rounded-lg bg-[#110F0C]">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                            className="p-1 sm:p-1.5 text-[#CBB99F] hover:text-white transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-semibold text-[#F5EFEB]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                            disabled={item.quantity >= item.stock}
                            className={`p-1 sm:p-1.5 transition-colors ${
                              item.quantity >= item.stock
                                ? 'text-stone-600 cursor-not-allowed'
                                : 'text-[#CBB99F] hover:text-white'
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
            <div className="p-4 sm:p-5 bg-[#18130B] border-t border-gold space-y-3">
              {/* Coupon Form */}
              <div className="pb-2 border-b border-gold">
                {couponCode ? (
                  <div className="flex items-center justify-between bg-emerald-950/60 border border-emerald-500/40 text-[#25D366] px-3 py-1.5 rounded-lg text-xs">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-bold tracking-wider">{couponCode}</span>
                      <span>(-{formatINR(discount)})</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-emerald-400 hover:text-white font-bold ml-2"
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
                        className="flex-1 uppercase text-xs px-3 py-2 bg-[#110F0C] border border-gold rounded-lg text-[#F5EFEB] placeholder-[#7E7363] focus:outline-none focus:border-[#D4AF37]"
                      />
                      <button
                        type="submit"
                        disabled={isApplying || !couponInput.trim()}
                        className="px-4 py-2 btn-gold rounded-lg text-xs font-semibold disabled:opacity-50"
                      >
                        {isApplying ? 'Applying...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-[11px] text-[#9B111E] font-medium">
                        {couponError}
                      </p>
                    )}
                  </form>
                )}
              </div>

              {/* Price Calculation Rows */}
              <div className="space-y-1.5 text-xs text-[#A89B88]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-[#F5EFEB]">{formatINR(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>Discount</span>
                    <span>-{formatINR(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Insured Delivery</span>
                  <span>{shippingFee === 0 ? <span className="text-[#25D366] font-semibold">FREE</span> : formatINR(shippingFee)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#F5EFEB] pt-2 border-t border-gold">
                  <span>Estimated Total</span>
                  <span className="font-serif text-lg font-bold gold-gradient">{formatINR(total)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Link
                  href="/checkout"
                  onClick={closeDrawer}
                  className="w-full py-3 px-4 btn-gold rounded-xl flex items-center justify-center gap-2 text-xs font-bold tracking-widest shadow-lg"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/cart"
                  onClick={closeDrawer}
                  className="w-full py-2.5 px-4 btn-outline rounded-xl flex items-center justify-center text-xs font-semibold"
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
