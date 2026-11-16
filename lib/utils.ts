import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { env } from './env';
import { getCloudFrontAssetUrl } from './aws/s3Client';
import { Product } from './types';

/**
 * Merge Tailwind classes safely with clsx and tailwind-merge.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Standard Indian Rupee currency formatter (e.g. ₹3,499).
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate integer discount percentage between MRP and selling price.
 */
export function calculateDiscountPercent(mrp: number, price: number): number {
  if (mrp <= 0 || price >= mrp) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

/**
 * Convert string to URL-safe kebab-case slug.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface WhatsAppProductDetails {
  name: string;
  sku: string;
  price: number;
  slug: string;
}

/**
 * Generate WhatsApp Click-to-Chat URL pre-filled with product details.
 * Strictly adheres to EC-UX-01 using encodeURIComponent to prevent truncation
 * with special characters (&, ", ', quotes, etc.).
 */
export function getWhatsAppEnquiryUrl(
  product: WhatsAppProductDetails,
  customStoreUrl?: string
): string {
  const storeUrl = customStoreUrl || env.NEXT_PUBLIC_STORE_URL || 'https://www.parnikajewellers.com';
  const cleanPhone = (env.WHATSAPP_STORE_NUMBER || '+919677255036').replace(/\D/g, '');
  const productUrl = `${storeUrl.replace(/\/+$/, '')}/product/${product.slug}`;

  const messageText = [
    `Hello Parnika Jewellers, I would like to enquire about this product:`,
    `• Product: ${product.name}`,
    `• SKU: ${product.sku}`,
    `• Price: ${formatINR(product.price)}`,
    `• Link: ${productUrl}`,
  ].join('\n');

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
}

/**
 * Generate schema.org/Product JSON-LD structured data for SEO.
 */
export function buildProductJsonLd(product: Product, customStoreUrl?: string) {
  const storeUrl = customStoreUrl || env.NEXT_PUBLIC_STORE_URL || 'https://www.parnikajewellers.com';
  const productUrl = `${storeUrl.replace(/\/+$/, '')}/product/${product.slug}`;
  const imageUrls = product.images.map((img) =>
    img.startsWith('http') ? img : getCloudFrontAssetUrl(img)
  );

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: imageUrls,
    description: product.description,
    sku: product.sku,
    category: product.categoryId,
    brand: {
      '@type': 'Brand',
      name: 'Parnika Jewellers',
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'INR',
      price: product.price,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Parnika Jewellers',
      },
    },
  };
}
