'use client';

import React, { useState } from 'react';
import { ShoppingBag, Zap, MessageCircle, Check, AlertCircle } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatINR, getWhatsAppEnquiryUrl } from '@/lib/utils';
import { useCart } from '@/app/context/CartContext';

interface ProductActionsProps {
  product: Product;
}

export function ProductActions({ product }: ProductActionsProps) {
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const isOutOfStock = product.stock <= 0;

  const whatsAppUrl = getWhatsAppEnquiryUrl({
    name: product.name,
    sku: product.sku,
    price: product.price,
    slug: product.slug,
  });

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    try {
      await addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        mrp: product.mrp,
        sku: product.sku,
        slug: product.slug,
        images: product.images,
        stock: product.stock,
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    window.location.href = '/checkout';
  };

  return (
    <>
      {/* Desktop & Tablet In-Page Actions */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          {/* Add to Cart */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`flex-1 py-3.5 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
              isOutOfStock
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
                : added
                ? 'bg-emerald-700 text-white'
                : 'bg-[var(--color-primary-base)] text-[var(--color-accent-light-gold)] hover:bg-[var(--color-primary-dark)] hover:shadow-lg active:scale-95'
            }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                Added to Shopping Bag
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                Add to Cart
              </>
            )}
          </button>

          {/* Buy Now */}
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className={`flex-1 py-3.5 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
              isOutOfStock
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
                : 'bg-[var(--color-accent-gold)] text-[var(--color-primary-dark)] hover:bg-[var(--color-accent-light-gold)] hover:shadow-lg active:scale-95'
            }`}
          >
            <Zap className="w-4 h-4 fill-current" />
            Buy Now
          </button>
        </div>

        {/* WhatsApp Direct Enquiry Button */}
        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-4 rounded-xl border-2 border-emerald-600/30 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
        >
          <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600/20" />
          Enquire on WhatsApp (Instant Help)
        </a>
      </div>

      {/* Sticky Mobile Bottom Action Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 p-3 shadow-2xl flex items-center gap-2">
        <div className="flex flex-col min-w-0 pr-2">
          <span className="text-[10px] text-stone-400 uppercase tracking-wider">Price</span>
          <span className="font-bold text-sm text-[var(--color-primary-dark)] truncate">
            {formatINR(product.price)}
          </span>
        </div>

        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0"
          aria-label="Enquire on WhatsApp"
        >
          <MessageCircle className="w-5 h-5" />
        </a>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow ${
            isOutOfStock
              ? 'bg-stone-200 text-stone-400'
              : 'bg-[var(--color-primary-base)] text-[var(--color-accent-light-gold)]'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          {added ? 'Added' : 'Cart'}
        </button>

        <button
          type="button"
          onClick={handleBuyNow}
          disabled={isOutOfStock}
          className={`flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow ${
            isOutOfStock
              ? 'bg-stone-200 text-stone-400'
              : 'bg-[var(--color-accent-gold)] text-[var(--color-primary-dark)]'
          }`}
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          Buy Now
        </button>
      </div>
    </>
  );
}
