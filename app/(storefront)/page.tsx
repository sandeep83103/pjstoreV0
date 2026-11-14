import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldCheck, HeartHandshake, Award } from 'lucide-react';
import { productRepository } from '@/lib/data';
import { ProductCard } from '@/components/storefront/ProductCard';

export const revalidate = 60; // ISR cache for 60 seconds

const CATEGORY_TILES = [
  {
    title: 'One Gram Gold',
    description: 'Long-lasting 24K micron plating with heirloom elegance',
    href: '/catalog?category=one-gram-gold',
    badge: 'Best Seller',
  },
  {
    title: 'Necklaces & Haars',
    description: 'Traditional temple chokers, gundla haars, and bridal sets',
    href: '/catalog?category=necklaces',
    badge: 'Popular',
  },
  {
    title: 'Earrings & Jhumkas',
    description: 'Lightweight antique jhumkas with ruby and emerald accents',
    href: '/catalog?category=earrings',
    badge: 'Festive',
  },
  {
    title: 'Bangles & Kadas',
    description: 'Royal filigree openable kadas and daily-wear bangles',
    href: '/catalog?category=bangles',
    badge: 'New',
  },
];

export default async function StorefrontHomePage() {
  const { items: featuredProducts } = await productRepository.list(
    { status: 'ACTIVE', inStockOnly: true },
    8
  );

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[var(--color-primary-base)] to-[var(--color-primary-dark)] text-white py-16 sm:py-24 border-b border-[var(--color-accent-gold)]/30">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary-dark)] text-[var(--color-accent-light-gold)] border border-[var(--color-accent-gold)]/40 text-xs font-semibold tracking-wider uppercase mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent-gold)]" />
            Festive &amp; Bridal Collection 2026
          </div>

          <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            The Timeless Radiance of <br className="hidden sm:inline" />
            <span className="text-[var(--color-accent-gold)]">One-Gram Gold &amp; Fashion Jewellery</span>
          </h1>

          <p className="mt-6 text-sm sm:text-lg text-white/80 max-w-2xl mx-auto font-light leading-relaxed">
            Experience traditional Indian jewellery artistry without the precious metal price tag. Micro-plated one-gram gold and temple finishes crafted for life’s grandest celebrations.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/catalog?category=one-gram-gold"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[var(--color-accent-gold)] text-[var(--color-primary-dark)] font-semibold text-sm hover:bg-[var(--color-accent-light-gold)] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Explore 1-Gram Gold
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/catalog"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-sm border border-white/20 transition-all backdrop-blur-sm"
            >
              View Full Catalog
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Categories Grid */}
      <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--color-primary-dark)]">
            Explore Handcrafted Categories
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">
            Carefully curated collections for weddings, pujas, festivals, and everyday grace.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORY_TILES.map((tile) => (
            <Link
              key={tile.title}
              href={tile.href}
              className="group relative flex flex-col justify-between p-6 rounded-2xl bg-white border border-[var(--color-border)] shadow-sm hover:shadow-md hover:border-[var(--color-accent-gold)] transition-all overflow-hidden"
            >
              <div>
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--color-ruby-alert)]/10 text-[var(--color-ruby-alert)] mb-3">
                  {tile.badge}
                </span>
                <h3 className="font-display text-lg font-bold text-[var(--color-primary-dark)] group-hover:text-[var(--color-accent-gold)] transition-colors">
                  {tile.title}
                </h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-2 leading-relaxed">
                  {tile.description}
                </p>
              </div>

              <div className="mt-6 flex items-center text-xs font-semibold text-[var(--color-primary-base)] group-hover:text-[var(--color-accent-gold)] transition-colors">
                Browse Collection <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Handcrafted Featured Arrivals */}
      {featuredProducts.length > 0 && (
        <section className="py-12 sm:py-16 bg-white border-t border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent-gold)]">
                  Handcrafted In India
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--color-primary-dark)] mt-1 flex items-center gap-2">
                  <span>Trending New Arrivals</span>
                  <Sparkles className="w-5 h-5 text-[var(--color-accent-gold)]" />
                </h2>
              </div>
              <Link
                href="/catalog"
                className="text-xs font-semibold text-[var(--color-primary-base)] hover:text-[var(--color-accent-gold)] flex items-center gap-1"
              >
                View Complete Catalog
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.slice(0, 4).map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Craftsmanship Assurance */}
      <section className="bg-[var(--color-surface-ivory)] border-t border-[var(--color-border)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-accent-gold)] shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-base text-[var(--color-primary-dark)]">
                  Micro-Plating Guarantee
                </h4>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  Our one-gram gold jewellery uses advanced multi-layer electroplating ensuring radiant longevity and realistic luster.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-accent-gold)] shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-base text-[var(--color-primary-dark)]">
                  Skin-Safe Alloys
                </h4>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  100% lead and nickel safe brass and copper bases to prevent irritation even during long wedding ceremonies.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-accent-gold)] shrink-0">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-base text-[var(--color-primary-dark)]">
                  Direct WhatsApp Support
                </h4>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  Need custom advice or matching bangles? Chat directly with the jewellery store owner before or after buying.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
