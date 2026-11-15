'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { getCloudFrontAssetUrl } from '@/lib/aws/s3Client';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const displayImages = images.length > 0 ? images : ['brand/logo.png'];
  const activeImageKey = displayImages[selectedIndex] || displayImages[0] || 'brand/logo.png';

  const getFullUrl = (key: string) => {
    if (key.startsWith('http')) return key;
    if (key.startsWith('/')) return key;
    if (key.startsWith('brand/')) return `/${key}`;
    return getCloudFrontAssetUrl(key);
  };

  const activeUrl = getFullUrl(activeImageKey);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Display with Desktop Hover Zoom */}
      <div
        ref={containerRef}
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
        className="relative aspect-square w-full rounded-2xl bg-[var(--color-surface-ivory)] border border-stone-200 overflow-hidden cursor-crosshair shadow-sm select-none"
      >
        <img
          src={activeUrl}
          alt={productName}
          className={`w-full h-full object-cover transition-transform duration-200 ${
            isZoomed ? 'scale-150 origin-top-left pointer-events-none' : 'scale-100'
          }`}
          style={
            isZoomed
              ? {
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                }
              : undefined
          }
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/brand/logo.png';
          }}
        />

        {/* Hover Zoom Hint */}
        <div className="hidden sm:block absolute bottom-3 right-3 px-2 py-1 rounded bg-black/60 text-white text-[10px] uppercase tracking-wider backdrop-blur-sm pointer-events-none">
          {isZoomed ? 'Hovering to Zoom' : 'Hover to Zoom'}
        </div>
      </div>

      {/* Thumbnails Row */}
      {displayImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {displayImages.map((imgKey, index) => {
            const isSelected = selectedIndex === index;
            const thumbUrl = getFullUrl(imgKey);
            return (
              <button
                key={`${imgKey}-${index}`}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={`relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all bg-[var(--color-surface-ivory)] ${
                  isSelected
                    ? 'border-[var(--color-accent-gold)] ring-2 ring-[var(--color-accent-gold)]/30 scale-105'
                    : 'border-stone-200 hover:border-stone-300 opacity-70 hover:opacity-100'
                }`}
                aria-label={`View product image ${index + 1}`}
              >
                <img
                  src={thumbUrl}
                  alt={`${productName} thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/brand/logo.png';
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
