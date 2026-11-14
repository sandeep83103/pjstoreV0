'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle, ShoppingBag, Check } from 'lucide-react';
import { ProductSummary } from '@/lib/types';
import { formatINR, calculateDiscountPercent, getWhatsAppEnquiryUrl } from '@/lib/utils';
import { getCloudFrontAssetUrl } from '@/lib/aws/s3Client';

interface ProductCardProps {
  product: ProductSummary;
}

export function ProductCard({ product }: ProductCardProps) {
  const discountPercent = calculateDiscountPercent(product.mrp, product.price);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= product.lowStockAt;
  const isBestSeller = product.tags.includes('bestseller');

  const primaryImageKey = product.images[0] || 'brand/logo.png';
  const imageUrl = primaryImageKey.startsWith('http')
    ? primaryImageKey
    : primaryImageKey.startsWith('brand/')
    ? `/${primaryImageKey}`
    : getCloudFrontAssetUrl(primaryImageKey);

  const whatsAppUrl = getWhatsAppEnquiryUrl({
    name: product.name,
    sku: product.sku,
    price: product.price,
    slug: product.slug,
  });

  return (
    <div className="group relative flex flex-col bg-white rounded-2xl border border-[var(--color-border)] shadow-sm hover:shadow-md hover:border-[var(--color-accent-gold)]/60 transition-all duration-300 overflow-hidden">
      {/* Image Container with Badges */}
      <Link href={`/product/${product.slug}`} className="relative aspect-square w-full bg-[var(--color-surface-ivory)] overflow-hidden block">
        {imageUrl.startsWith('/') ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          /* For external CloudFront assets, use unoptimized or standard img fallback for dev resilience */
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              // Fallback to local brand logo if CloudFront asset is not yet in S3
              (e.target as HTMLImageElement).src = '/brand/logo.png';
            }}
          />
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {discountPercent > 0 && !isOutOfStock && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[var(--color-ruby-alert)] text-white shadow-sm">
              {discountPercent}% OFF
            </span>
          )}
          {isBestSeller && !isOutOfStock && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--color-accent-gold)] text-[var(--color-primary-dark)] shadow-sm">
              Best Seller
            </span>
          )}
        </div>

        {/* Stock Status Badge */}
        {isOutOfStock ? (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-10">
            <span className="px-3 py-1 rounded-full bg-stone-900/90 text-white font-semibold text-xs tracking-wider uppercase border border-white/20">
              Out of Stock
            </span>
          </div>
        ) : isLowStock ? (
          <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/90 text-white z-10">
            Only {product.stock} left
          </span>
        ) : null}
      </Link>

      {/* Product Information */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] mb-1">
            <span className="font-mono">{product.sku}</span>
            {product.specs['Finish'] && (
              <span className="truncate max-w-[120px]">{product.specs['Finish']}</span>
            )}
          </div>

          <Link href={`/product/${product.slug}`} className="block">
            <h3 className="font-display text-sm sm:text-base font-bold text-[var(--color-primary-dark)] line-clamp-2 group-hover:text-[var(--color-accent-gold)] transition-colors leading-snug">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Pricing & Actions */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-bold text-[var(--color-primary-base)]">
              {formatINR(product.price)}
            </span>
            {product.mrp > product.price && (
              <span className="text-xs text-stone-400 line-through">
                {formatINR(product.mrp)}
              </span>
            )}
          </div>

          {/* Quick WhatsApp CTA Button */}
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-full text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
            title="Enquire on WhatsApp"
            aria-label={`Enquire about ${product.name} on WhatsApp`}
          >
            <MessageCircle className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
