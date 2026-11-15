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

  const primaryImageKey = product.images[0] || '/images/products/p1715.jpg';
  const imageUrl = primaryImageKey.startsWith('http')
    ? primaryImageKey
    : primaryImageKey.startsWith('/')
    ? primaryImageKey
    : primaryImageKey.startsWith('products/')
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
    <article className="pcard group rounded-sm overflow-hidden flex flex-col justify-between">
      {/* Product Image Box */}
      <Link href={`/product/${product.slug}`} className="relative aspect-[3/4] w-full bg-[#F7F0DE] overflow-hidden block">
        {imageUrl.startsWith('/') ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/products/p1715.jpg';
            }}
          />
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {discountPercent > 0 && !isOutOfStock && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-[#7A262D] text-[#F7F0DE] shadow-sm">
              {discountPercent}% OFF
            </span>
          )}
          {isBestSeller && !isOutOfStock && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-[#D4AF5A] text-[#2E0A0F] shadow-sm">
              Best Seller
            </span>
          )}
        </div>

        {/* Stock Status Badge */}
        {isOutOfStock ? (
          <div className="absolute inset-0 bg-[#2E0A0F]/70 backdrop-blur-[1px] flex items-center justify-center z-10">
            <span className="px-3 py-1 rounded-sm bg-[#2E0A0F] text-[#D4AF5A] font-semibold text-xs tracking-wider uppercase border border-[#D4AF5A]">
              Sold Out
            </span>
          </div>
        ) : isLowStock ? (
          <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-sm text-[10px] font-semibold bg-[#8A6A22] text-white z-10">
            Only {product.stock} left
          </span>
        ) : null}
      </Link>

      {/* Product Details & Actions (From parnika-jewellers-store.html .pinfo) */}
      <div className="pinfo flex flex-col flex-1 justify-between bg-white text-[#2B1316]">
        <div>
          <div className="ptag text-[11px] tracking-[0.2em] uppercase font-bold text-[#7A262D] mb-1">
            {product.specs?.['Category'] || 'Long Haram'}
          </div>

          <Link href={`/product/${product.slug}`} className="block">
            <h3 className="pname font-serif text-xl sm:text-2xl font-bold text-[#4A1118] line-clamp-2 leading-tight hover:text-[#7A262D] transition-colors">
              {product.name}
            </h3>
          </Link>

          <div className="pdesc text-xs text-[#5E4A4C] mt-1 line-clamp-1">
            {product.description || 'Haram, earrings & accessories'}
          </div>

          <div className="pcode text-[11px] tracking-wider text-[#6B5A5C] mt-1 font-mono">
            Code: {product.sku}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#E6D7B4] flex flex-col gap-2.5">
          {/* Price */}
          <div className="pprice flex items-baseline gap-2">
            <span className="font-serif text-xl font-bold text-[#2B1316]">
              {formatINR(product.price)}
            </span>
            {product.mrp > product.price && (
              <span className="text-xs text-[#5E4A4C] line-through">
                {formatINR(product.mrp)}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={isOutOfStock}
              className={`add py-2.5 px-3 text-xs font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 rounded-sm ${
                isOutOfStock
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  : 'bg-[#7A262D] text-[#F7F0DE] hover:bg-[#2E0A0F] hover:text-[#E9D08A]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Add to Bag
            </button>

            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 text-xs font-medium text-[#4A1118] border border-[#7A262D] hover:bg-[#7A262D]/10 flex items-center justify-center gap-1 rounded-sm transition"
              title="Enquire on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
