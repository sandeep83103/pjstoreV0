import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { productRepository, categoryRepository } from '@/lib/data';
import { ProductGallery } from '@/components/storefront/ProductGallery';
import { ProductActions } from '@/components/storefront/ProductActions';
import { ProductCard } from '@/components/storefront/ProductCard';
import { formatINR, calculateDiscountPercent, buildProductJsonLd } from '@/lib/utils';
import { getCloudFrontAssetUrl } from '@/lib/aws/s3Client';
import {
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Award,
  CheckCircle2,
  Clock,
  Heart,
} from 'lucide-react';

export const revalidate = 60; // ISR cache for 60 seconds

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await productRepository.findBySlug(params.slug);
  if (!product) {
    return {
      title: 'Product Not Found — Parnika Jewellers',
    };
  }

  const primaryImage = product.images[0] || 'brand/logo.png';
  const imageUrl = primaryImage.startsWith('http')
    ? primaryImage
    : primaryImage.startsWith('brand/')
    ? `/${primaryImage}`
    : getCloudFrontAssetUrl(primaryImage);

  return {
    title: `${product.name} — Parnika Jewellers`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: `${product.name} | Parnika Jewellers`,
      description: product.description.slice(0, 160),
      images: [{ url: imageUrl, alt: product.name }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description.slice(0, 160),
      images: [imageUrl],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const product = await productRepository.findBySlug(params.slug);

  if (!product) {
    notFound();
  }

  const [category, { items: relatedProducts }] = await Promise.all([
    categoryRepository.findById(product.categoryId),
    productRepository.list({ categoryId: product.categoryId, inStockOnly: true }, 4),
  ]);

  const discountPercent = calculateDiscountPercent(product.mrp, product.price);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= product.lowStockAt;
  const jsonLd = buildProductJsonLd(product);

  const filteredRelated = relatedProducts.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <>
      {/* Schema.org / JSON-LD Structured Data for Search Engines & Rich Results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-[var(--color-surface-ivory)]/40 pb-20 sm:pb-24">
        {/* Breadcrumb Navigation */}
        <div className="border-b border-stone-200 bg-white/70 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <nav className="flex items-center gap-1.5 text-xs text-stone-500 overflow-x-auto whitespace-nowrap" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-[var(--color-primary-base)] transition-colors">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              <Link href="/catalog" className="hover:text-[var(--color-primary-base)] transition-colors">
                Catalog
              </Link>
              {category && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                  <Link
                    href={`/catalog/${category.slug}`}
                    className="hover:text-[var(--color-primary-base)] transition-colors"
                  >
                    {category.name}
                  </Link>
                </>
              )}
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              <span className="text-stone-800 font-medium truncate max-w-[200px] sm:max-w-xs">
                {product.name}
              </span>
            </nav>
          </div>
        </div>

        {/* Main Product Container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column: Image Gallery with Hover Zoom */}
            <div className="lg:col-span-6">
              <ProductGallery images={product.images} productName={product.name} />
            </div>

            {/* Right Column: Details, Pricing, Specs, CTAs */}
            <div className="lg:col-span-6 space-y-6">
              {/* Product Title & Badges */}
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {category && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[var(--color-primary-base)] border border-emerald-200">
                      {category.name}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono text-stone-500 bg-stone-100">
                    SKU: {product.sku}
                  </span>
                  {product.tags.includes('bestseller') && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[var(--color-accent-gold)] text-[var(--color-primary-dark)]">
                      Best Seller
                    </span>
                  )}
                </div>

                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-primary-dark)] leading-tight">
                  {product.name}
                </h1>
              </div>

              {/* Dynamic Pricing Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-2">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="font-display text-3xl sm:text-4xl font-bold text-[var(--color-primary-base)]">
                    {formatINR(product.price)}
                  </span>
                  {product.mrp > product.price && (
                    <span className="text-base sm:text-lg text-stone-400 line-through">
                      MRP: {formatINR(product.mrp)}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-[var(--color-ruby-alert)] text-white shadow-sm">
                      {discountPercent}% OFF
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-500">
                  Inclusive of all taxes • Free shipping on orders over ₹1,999
                </p>

                {/* Stock Level Indicator */}
                <div className="pt-2 border-t border-stone-100 flex items-center gap-2">
                  {isOutOfStock ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-md">
                      Currently Out of Stock
                    </span>
                  ) : isLowStock ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Hurry, only {product.stock} pieces left in stock!
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      In Stock &amp; Ready for Express Dispatch
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons & WhatsApp Enquiry */}
              <ProductActions product={product} />

              {/* Trust Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
                <div className="p-3 rounded-xl bg-white border border-stone-200 text-center flex flex-col items-center justify-center">
                  <Award className="w-5 h-5 text-[var(--color-accent-gold)] mb-1" />
                  <span className="text-[11px] font-bold text-stone-800">1-Gram Micro Gold</span>
                  <span className="text-[10px] text-stone-500">Heirloom Grade Polish</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-stone-200 text-center flex flex-col items-center justify-center">
                  <Truck className="w-5 h-5 text-[var(--color-primary-base)] mb-1" />
                  <span className="text-[11px] font-bold text-stone-800">Insured Delivery</span>
                  <span className="text-[10px] text-stone-500">All India Courier</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-stone-200 text-center flex flex-col items-center justify-center col-span-2 sm:col-span-1">
                  <RotateCcw className="w-5 h-5 text-emerald-700 mb-1" />
                  <span className="text-[11px] font-bold text-stone-800">Easy Replacement</span>
                  <span className="text-[10px] text-stone-500">7-Day Transit Policy</span>
                </div>
              </div>

              {/* Product Description */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[var(--color-primary-dark)]">
                  Product Details &amp; Story
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-light">
                  {product.description}
                </p>
              </div>

              {/* Specifications Table */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[var(--color-primary-dark)]">
                  Jewellery Specifications
                </h3>
                <div className="divide-y divide-stone-100 text-xs">
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-stone-500 font-medium">Product Code</span>
                    <span className="text-stone-900 font-mono font-semibold">{product.sku}</span>
                  </div>
                  {product.supplierCode && (
                    <div className="py-2.5 flex justify-between items-center">
                      <span className="text-stone-500 font-medium">Design / Supplier Code</span>
                      <span className="text-stone-900 font-mono font-semibold">{product.supplierCode}</span>
                    </div>
                  )}
                  {Object.entries(product.specs).map(([key, value]) => (
                    <div key={key} className="py-2.5 flex justify-between items-center">
                      <span className="text-stone-500 font-medium">{key}</span>
                      <span className="text-stone-900 font-semibold text-right max-w-[240px]">
                        {value}
                      </span>
                    </div>
                  ))}
                  {/* Care Instructions */}
                  {!product.specs['Care'] && (
                    <div className="py-2.5 flex justify-between items-center">
                      <span className="text-stone-500 font-medium">Care Instructions</span>
                      <span className="text-stone-900 font-semibold text-right max-w-[240px]">
                        Keep away from moisture, perfumes, and direct water spray.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Related Products Section */}
          {filteredRelated.length > 0 && (
            <section className="mt-16 sm:mt-24 pt-10 border-t border-stone-200">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--color-primary-dark)] flex items-center gap-2">
                    <span>You May Also Like</span>
                    <Sparkles className="w-4 h-4 text-[var(--color-accent-gold)]" />
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Matching designs and coordinating jewellery from this collection
                  </p>
                </div>
                {category && (
                  <Link
                    href={`/catalog/${category.slug}`}
                    className="text-xs font-semibold text-[var(--color-primary-base)] hover:text-[var(--color-accent-gold)] flex items-center gap-1"
                  >
                    View All {category.name}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {filteredRelated.map((relProduct) => (
                  <ProductCard key={relProduct.id} product={relProduct} />
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}
