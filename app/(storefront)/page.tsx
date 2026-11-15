import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck, Truck, Clock, Award, Star } from 'lucide-react';
import { productRepository } from '@/lib/data';
import { ProductCard } from '@/components/storefront/ProductCard';

export const revalidate = 60; // ISR cache for 60 seconds

const CATEGORY_STYLES = [
  {
    title: 'Long Haram Sets',
    description: 'Regal layered harams with matching jhumkas',
    href: '/catalog?category=necklaces',
    tag: 'Classic',
  },
  {
    title: 'Bridal & Temple',
    description: 'Lakshmi & antique deity temple bridal chokers',
    href: '/catalog?category=bridal-sets',
    tag: 'Bridal',
  },
  {
    title: 'Ruby & Emerald',
    description: 'Vibrant kempu ruby and emerald stone finishes',
    href: '/catalog?category=one-gram-gold',
    tag: 'Festive',
  },
  {
    title: 'Floral & Layered',
    description: 'Intricate floral two-layer and gundla mala sets',
    href: '/catalog?category=necklaces',
    tag: 'Trending',
  },
];

export default async function StorefrontHomePage() {
  const { items: featuredProducts } = await productRepository.list(
    { status: 'ACTIVE', inStockOnly: true },
    8
  );

  return (
    <div className="bg-[#080706] text-[#F5EFEB]">
      {/* 1. HERO SECTION (Mirroring parnika-jewellers-store.html #top) */}
      <section className="relative overflow-hidden border-b border-gold py-16 sm:py-24 lg:py-28 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1F170B] via-[#0D0B08] to-[#080706]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full badge-gold text-xs font-semibold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                New Festive Arrivals 2026
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F5EFEB] leading-[1.15]">
                Exquisite One-Gram &amp; <br />
                <span className="gold-gradient">Fashion Jewellery</span>
              </h1>

              <p className="text-sm sm:text-base text-[#D8C9B4] max-w-xl mx-auto lg:mx-0 font-light leading-relaxed">
                Timeless elegance for your everyday celebrations. Temple-inspired gold finish, ruby and emerald tones, crafted with grace and worn with pride.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/catalog"
                  className="w-full sm:w-auto btn-gold px-8 py-3.5 rounded text-xs font-semibold tracking-widest inline-flex items-center justify-center gap-2"
                >
                  Shop the Collection
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/catalog?category=bridal-sets"
                  className="w-full sm:w-auto btn-outline px-8 py-3.5 rounded text-xs font-semibold tracking-widest inline-flex items-center justify-center"
                >
                  Bridal Collections
                </Link>
              </div>

              {/* Quick Trust Highlights */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-gold text-center lg:text-left">
                <div>
                  <div className="font-serif text-lg sm:text-xl font-bold text-[#FBE8A6]">100%</div>
                  <div className="text-[11px] text-[#A89B88] uppercase tracking-wider">Hallmarked Plating</div>
                </div>
                <div>
                  <div className="font-serif text-lg sm:text-xl font-bold text-[#FBE8A6]">24h</div>
                  <div className="text-[11px] text-[#A89B88] uppercase tracking-wider">Insured Dispatch</div>
                </div>
                <div>
                  <div className="font-serif text-lg sm:text-xl font-bold text-[#FBE8A6]">₹6,840/g</div>
                  <div className="text-[11px] text-[#A89B88] uppercase tracking-wider">Equivalent Style</div>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md bg-card rounded-2xl p-4 sm:p-6 border border-gold-strong shadow-2xl">
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#18130B] border border-gold">
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4">
                    <div className="w-20 h-20 rounded-full border border-gold flex items-center justify-center bg-[#18130B]">
                      <svg className="w-12 h-12 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 2L15 8L21 9L16.5 14L18 20L12 17L6 20L7.5 14L3 9L9 8L12 2Z" fill="rgba(212,175,55,0.2)" />
                        <circle cx="12" cy="12" r="3" fill="#D4AF37" />
                      </svg>
                    </div>
                    <div>
                      <span className="font-serif text-2xl font-bold tracking-widest gold-gradient block">
                        PARNIKA
                      </span>
                      <span className="text-xs uppercase tracking-[0.25em] text-[#CBB99F] block mt-1">
                        Royal Heirloom Collection
                      </span>
                    </div>
                    <p className="text-xs text-[#A89B88] italic max-w-xs">
                      &quot;Every piece is chosen for its detail, its finish, and the way it elevates a festive look.&quot;
                    </p>
                    <div className="flex items-center space-x-1 text-[#D4AF37]">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SHOP BY STYLE (Mirroring parnika-jewellers-store.html #shop) */}
      <section id="styles" className="py-14 sm:py-20 border-b border-gold bg-[#0C0A08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37] block mb-2">
              Shop by Style
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F5EFEB]">
              Find Your Signature Set
            </h2>
            <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CATEGORY_STYLES.map((cat) => (
              <Link
                key={cat.title}
                href={cat.href}
                className="group bg-card rounded-xl p-6 border border-gold hover:border-gold-strong transition-all duration-300 hover:-translate-y-1 block"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="badge-gold text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                    {cat.tag}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#F5EFEB] group-hover:text-[#FBE8A6] transition-colors">
                  {cat.title}
                </h3>
                <p className="text-xs text-[#A89B88] mt-2 leading-relaxed">
                  {cat.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. COLLECTION GRID (Mirroring parnika-jewellers-store.html #collection) */}
      <section id="collection" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-gold gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#D4AF37] block mb-1">
              Just In
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F5EFEB]">
              New Arrivals
            </h2>
          </div>
          <div className="text-xs text-[#A89B88] italic">
            Every set comes with matching earrings and secure packaging.
          </div>
        </div>

        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border border-gold rounded-xl bg-card">
            <p className="text-sm text-[#A89B88]">No products available at this moment.</p>
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/catalog"
            className="btn-gold px-10 py-3.5 rounded text-xs font-semibold tracking-widest inline-flex items-center gap-2"
          >
            Explore All Creations
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 4. FESTIVE SPECIAL BRIDAL BANNER (Mirroring parnika-jewellers-store.html #bridal) */}
      <section id="bridal" className="border-y border-gold py-16 sm:py-20 bg-gradient-to-r from-[#171109] via-[#2A1D0B] to-[#171109] text-center px-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] block">
            Festive Special
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#F5EFEB]">
            Bring Home Prosperity
          </h2>
          <div className="text-xs text-[#D8C9B4] uppercase tracking-widest">Get up to</div>
          <div className="font-serif text-5xl sm:text-7xl font-bold gold-gradient leading-none">
            20% OFF
          </div>
          <p className="text-sm text-[#D8C9B4]">On Complete Temple &amp; Bridal Collections</p>
          <div className="pt-4">
            <Link
              href="/catalog?category=bridal-sets"
              className="btn-gold px-10 py-3.5 rounded text-xs font-semibold tracking-widest inline-block"
            >
              Shop Bridal
            </Link>
          </div>
        </div>
      </section>

      {/* 5. CRAFT & OUR STORY (Mirroring parnika-jewellers-store.html #about / #craft) */}
      <section id="craft" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-sm aspect-square rounded-2xl bg-card border border-gold p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-24 h-24 rounded-full border border-gold flex items-center justify-center bg-[#18130B]">
                <Award className="w-12 h-12 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-2xl font-bold gold-gradient">
                Heirloom Standards
              </h3>
              <p className="text-xs text-[#A89B88]">
                Every micron of gold plating is electro-bonded to durable brass alloy for skin safety and long-lasting lustre.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] block">
              Our Story
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#F5EFEB]">
              Crafted with Grace, Worn with Pride
            </h2>
            <p className="text-sm text-[#D8C9B4] leading-relaxed">
              Parnika Jewellers brings the richness of traditional gold designs to everyday celebrations. Every one-gram and fashion piece is chosen for its detail, its finish, and the way it carries an unmistakable festive aura without the vulnerability of pure gold.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-gold text-left">
              <div>
                <h4 className="text-sm font-serif font-bold text-[#FBE8A6]">Insured Delivery</h4>
                <p className="text-xs text-[#A89B88] mt-1">Dispatched in tamper-proof boxes across all Indian PIN codes.</p>
              </div>
              <div>
                <h4 className="text-sm font-serif font-bold text-[#FBE8A6]">48h Returns</h4>
                <p className="text-xs text-[#A89B88] mt-1">Hassle-free replacement for transit damage or defects.</p>
              </div>
              <div>
                <h4 className="text-sm font-serif font-bold text-[#FBE8A6]">Secure Payments</h4>
                <p className="text-xs text-[#A89B88] mt-1">Verified UPI, Credit/Debit cards, NetBanking &amp; Cash on Delivery.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SOCIAL PROOF (Mirroring parnika-jewellers-store.html #reviews / .social) */}
      <section id="reviews" className="py-14 border-t border-gold bg-[#0A0806] text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5EFEB] mb-4">
            Follow Us @ParnikaJewellers
          </h2>
          <p className="text-xs text-[#A89B88] mb-6">
            Join thousands of delighted patrons styling our jewellery across festive celebrations.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://www.instagram.com/ParnikaJewellers"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-gold text-xs text-[#FBE8A6] hover:bg-[#D4AF37]/10 transition"
            >
              Instagram @ParnikaJewellers
            </a>
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-emerald-500/40 text-xs text-[#25D366] hover:bg-emerald-500/10 transition"
            >
              WhatsApp Customer Care
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
