'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, MessageCircle } from 'lucide-react';
import { ProductSummary } from '@/lib/types';
import { formatINR, calculateDiscountPercent, getWhatsAppEnquiryUrl } from '@/lib/utils';
import { getCloudFrontAssetUrl } from '@/lib/aws/s3Client';
import { useCart } from '@/app/context/CartContext';

interface ProductCardProps {
  product: ProductSummary;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, openDrawer } = useCart();
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

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock) {
      addItem(
        {
          id: product.id,
          sku: product.sku,
          name: product.name,
          price: product.price,
          mrp: product.mrp,
          slug: product.slug,
          images: product.images,
          stock: product.stock,
        },
        1
      );
      openDrawer();
    }
  };

  return (
    <div className="group bg-card bg-card-hover rounded-xl overflow-hidden flex flex-col justify-between border border-gold transition-all duration-300">
      {/* Product Image Box */}
      <Link href={`/product/${product.slug}`} className="relative aspect-square w-full bg-[#18140E] overflow-hidden block">
        {imageUrl.startsWith('/') ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-106 transition-transform duration-500"
          />
        ) : (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/brand/logo.png';
            }}
          />
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {discountPercent > 0 && !isOutOfStock && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#9B111E] text-white shadow-sm">
              {discountPercent}% OFF
            </span>
          )}
          {isBestSeller && !isOutOfStock && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider badge-gold shadow-sm">
              Best Seller
            </span>
          )}
        </div>

        {/* Stock Status Badge */}
        {isOutOfStock ? (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-10">
            <span className="px-3 py-1 rounded-full bg-[#18130B] text-[#D4AF37] font-semibold text-xs tracking-wider uppercase border border-gold">
              Sold Out
            </span>
          </div>
        ) : isLowStock ? (
          <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-600/90 text-white z-10">
            Only {product.stock} left
          </span>
        ) : null}
      </Link>

      {/* Product Details & Actions */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between text-[11px] text-[#A89B88] mb-1">
            <span className="text-[#D4AF37] font-medium tracking-wide uppercase">
              {product.specs?.['Category'] || product.specs?.['Finish'] || '1-Gram Gold'}
            </span>
            <span className="font-mono text-[10px] text-[#CBB99F]">{product.sku}</span>
          </div>

          <Link href={`/product/${product.slug}`} className="block">
            <h3 className="font-serif text-base sm:text-lg font-bold text-[#F5EFEB] line-clamp-2 group-hover:text-[#FBE8A6] transition-colors leading-snug">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-[#A89B88] mt-1 line-clamp-1">
            {product.description || 'Authentic temple micro-gold plating with matching earrings'}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-gold flex flex-col gap-3">
          {/* Price strip */}
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-xl font-bold gold-gradient">
              {formatINR(product.price)}
            </span>
            {product.mrp > product.price && (
              <span className="text-xs text-[#A89B88] line-through">
                {formatINR(product.mrp)}
              </span>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={isOutOfStock}
              className={`inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded text-xs font-semibold tracking-wider uppercase transition-all ${
                isOutOfStock
                  ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
                  : 'btn-gold'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Add to Bag
            </button>

            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded text-xs font-medium text-[#F5EFEB] btn-outline"
              title="Enquire on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
