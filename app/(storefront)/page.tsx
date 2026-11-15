import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Star } from 'lucide-react';
import { productRepository } from '@/lib/data';
import { ProductCard } from '@/components/storefront/ProductCard';

export const revalidate = 60; // ISR cache for 60 seconds

const CATEGORIES = [
  {
    title: 'Long Haram Sets',
    img: '/images/products/p1749b.jpg',
    href: '/catalog?category=long-haram',
  },
  {
    title: 'Bridal & Temple',
    img: '/images/products/p1989.jpg',
    href: '/catalog?category=bridal-temple',
  },
  {
    title: 'Ruby & Emerald',
    img: '/images/products/p1770.jpg',
    href: '/catalog?category=ruby-emerald',
  },
  {
    title: 'Floral & Layered',
    img: '/images/products/p1525.jpg',
    href: '/catalog?category=floral-layered',
  },
];

const SOCIAL_SHOTS = [
  { img: '/images/products/p1715.jpg', alt: 'Antique gold haram set' },
  { img: '/images/products/p2360.jpg', alt: 'Ruby teardrop necklace set' },
  { img: '/images/products/p2105.jpg', alt: 'Two-row haram with pearl drops' },
  { img: '/images/products/p1525.jpg', alt: 'Floral two-layer necklace set' },
];

export default async function StorefrontHomePage() {
  const { items: featuredProducts } = await productRepository.list(
    { status: 'ACTIVE', inStockOnly: true },
    8
  );

  return (
    <div>
      {/* 1. HERO SECTION (Mirroring parnika-jewellers-store.html #top) */}
      <section id="top" className="hero-wrap tex-m border-b border-[#8A6A22]">
        <div className="hero max-w-[1280px] mx-auto px-6 sm:px-12 py-16 sm:py-20 flex flex-wrap items-center gap-12 lg:gap-14">
          {/* Left Copy */}
          <div className="hero-copy flex-1 min-w-[320px] sm:min-w-[420px] space-y-6">
            <div className="eyebrow text-xs sm:text-sm tracking-[0.3em] uppercase text-[#E9D08A] font-medium">
              New Arrivals
            </div>

            <h1 className="font-serif font-semibold text-4xl sm:text-6xl lg:text-7xl leading-[1.04] text-[#F7F0DE]">
              Exquisite One-Gram &amp; Fashion Jewellery
            </h1>

            <p className="text-base sm:text-lg leading-relaxed text-[#E4D7C0] max-w-[480px]">
              Timeless elegance for your everyday celebrations. Temple-inspired gold finish, ruby and emerald tones, crafted with grace and worn with pride.
            </p>

            <div className="btns flex flex-wrap gap-4 pt-2">
              <Link href="#collection" className="btn-gold">
                Shop the Collection
              </Link>
              <Link href="#bridal" className="btn-line">
                Bridal Collections
              </Link>
            </div>
          </div>

          {/* Right Hero Product Feature */}
          <div className="hero-img flex-1 min-w-[300px] sm:min-w-[420px] flex justify-center">
            <div className="relative w-full max-w-[500px] aspect-[4/5] sm:aspect-square border-[6px] border-[#D4AF5A] shadow-[0_0_0_10px_#4A1118,0_0_0_12px_#D4AF5A,0_24px_60px_rgba(0,0,0,0.45)] overflow-hidden bg-[#2E0A0F]">
              <Image
                src="/images/products/p1989.jpg"
                alt="Lakshmi temple two-layer gold necklace set with pearl drops and maang tikka on green velvet"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. SHOP BY STYLE (Mirroring parnika-jewellers-store.html #shop) */}
      <section id="shop" className="sec tex-d px-6 sm:px-12 py-16 sm:py-20 border-b border-[#8A6A22]">
        <div className="wrap max-w-[1280px] mx-auto">
          <div className="sec-head text-center space-y-2 mb-10">
            <div className="eyebrow text-xs sm:text-sm tracking-[0.3em] uppercase text-[#E9D08A]">
              Shop by Style
            </div>
            <h2 className="font-serif font-semibold text-3xl sm:text-5xl text-[#F7F0DE]">
              Find Your Signature Set
            </h2>
            <div className="orn flex items-center justify-center gap-3 text-[#D4AF5A] pt-2" aria-hidden="true">
              <i className="block h-[1px] w-16 bg-[#D4AF5A]" />
              <b className="block w-2 h-2 bg-[#D4AF5A] rotate-45" />
              <i className="block h-[1px] w-16 bg-[#D4AF5A]" />
            </div>
          </div>

          <div className="cat-row grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CATEGORIES.map((cat) => (
              <Link key={cat.title} href={cat.href} className="cat group flex flex-col gap-3.5 text-[#F7F0DE]">
                <div className="relative w-full h-[320px] sm:h-[340px] border-2 border-[#D4AF5A] overflow-hidden bg-[#1F070B]">
                  <Image
                    src={cat.img}
                    alt={cat.title}
                    fill
                    className="object-cover object-[center_42%] group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <span className="font-serif text-2xl font-semibold text-center text-[#F7F0DE] group-hover:text-[#E9D08A] transition-colors">
                  {cat.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. COLLECTION (Mirroring parnika-jewellers-store.html #collection) */}
      <section id="collection" className="collection bg-[#F7F0DE] text-[#2B1316] px-6 sm:px-12 py-16 sm:py-24">
        <div className="wrap max-w-[1280px] mx-auto">
          <div className="split-head flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <div className="eyebrow dark text-xs tracking-[0.25em] uppercase font-bold text-[#7A262D] mb-1">
                Just In
              </div>
              <h2 className="font-serif font-semibold text-3xl sm:text-5xl text-[#7A262D]">
                New Arrivals
              </h2>
            </div>
            <div className="note text-sm text-[#5E4A4C] italic">
              Every set comes with matching earrings.
            </div>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[#5E4A4C]">
              No products found in the catalog.
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              href="/catalog"
              className="inline-block bg-[#7A262D] text-[#F7F0DE] hover:bg-[#2E0A0F] hover:text-[#E9D08A] py-3.5 px-8 font-semibold tracking-widest text-xs uppercase transition shadow-md"
            >
              Explore Full Collection
            </Link>
          </div>
        </div>
      </section>

      {/* 4. FESTIVE SPECIAL PROMO BANNER (Mirroring parnika-jewellers-store.html #bridal) */}
      <section id="bridal" className="promo tex py-20 px-6 sm:px-12 border-t border-[#8A6A22]">
        <div className="promo-box tex-dd max-w-[1100px] mx-auto border-2 border-[#D4AF5A] outline outline-1 outline-[#D4AF5A] outline-offset-8 p-12 sm:p-16 text-center flex flex-col items-center gap-4 text-[#F7F0DE]">
          <div className="eyebrow text-xs tracking-[0.25em] uppercase text-[#E9D08A]">
            Festive Special
          </div>
          <h2 className="font-serif font-semibold text-3xl sm:text-5xl lg:text-6xl">
            Bring Home Prosperity
          </h2>
          <div className="small text-xs uppercase tracking-[0.25em] text-[#E4D7C0]">
            Get up to
          </div>
          <div className="big font-serif font-bold text-7xl sm:text-9xl lg:text-[140px] text-[#E9D08A] leading-none">
            20%<span className="text-3xl sm:text-4xl tracking-widest ml-2">OFF</span>
          </div>
          <div className="sub font-serif text-2xl sm:text-3xl text-[#F7F0DE]">
            On Bridal Collections
          </div>
          <Link
            href="/catalog?category=bridal-temple"
            className="btn-gold mt-4 py-4 px-10 text-sm font-semibold tracking-widest"
          >
            Shop Bridal
          </Link>
        </div>
      </section>

      {/* 5. OUR STORY / ABOUT (Mirroring parnika-jewellers-store.html #about) */}
      <section id="about" className="about bg-[#F7F0DE] text-[#2B1316] py-20 px-6 sm:px-12 border-t border-[#8A6A22]">
        <div className="about-in max-w-[1200px] mx-auto flex flex-wrap items-center gap-12 lg:gap-14">
          {/* Emblem & Crest Image */}
          <div className="about-img flex-1 min-w-[280px] sm:min-w-[340px]">
            <div className="relative w-full max-w-[380px] aspect-square mx-auto border-[3px] border-[#D4AF5A] shadow-[0_0_0_8px_#F7F0DE,0_0_0_10px_#D4AF5A,0_20px_50px_rgba(74,17,24,0.25)] overflow-hidden bg-[#2E0A0F]">
              <Image
                src="/brand/crest.jpg"
                alt="Parnika Jewellers logo: PJ monogram crest with crown, emerald and ruby border"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Copy & Store Policies */}
          <div className="about-copy flex-1 min-w-[300px] sm:min-w-[380px] space-y-5">
            <div className="eyebrow dark text-xs tracking-[0.25em] uppercase font-bold text-[#7A262D]">
              Our Story
            </div>
            <h2 className="font-serif font-semibold text-3xl sm:text-5xl text-[#7A262D] leading-tight">
              Crafted with Grace, Worn with Pride
            </h2>
            <p className="text-base sm:text-lg leading-relaxed text-[#4B3A3C]">
              Parnika Jewellers brings the richness of traditional gold designs to everyday celebrations. Every one-gram and fashion piece is chosen for its detail, its finish and the way it carries a festive look.
            </p>

            <div className="pol flex flex-wrap gap-4 pt-3">
              <div className="flex-1 min-w-[140px] border-t-2 border-[#D4AF5A] pt-3">
                <h3 className="font-serif text-xl font-bold text-[#4A1118]">Shipping</h3>
                <p className="text-xs text-[#5E4A4C] mt-1 leading-relaxed">
                  Free insured delivery on orders &gt; ₹999 with 24-hour dispatch across India.
                </p>
              </div>
              <div className="flex-1 min-w-[140px] border-t-2 border-[#D4AF5A] pt-3">
                <h3 className="font-serif text-xl font-bold text-[#4A1118]">Returns</h3>
                <p className="text-xs text-[#5E4A4C] mt-1 leading-relaxed">
                  48-hour easy exchange and transit damage protection with live support.
                </p>
              </div>
              <div className="flex-1 min-w-[140px] border-t-2 border-[#D4AF5A] pt-3">
                <h3 className="font-serif text-xl font-bold text-[#4A1118]">Payments</h3>
                <p className="text-xs text-[#5E4A4C] mt-1 leading-relaxed">
                  Secure UPI, Credit/Debit cards, NetBanking and Cash on Delivery.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SOCIAL PROOF STRIP (Mirroring parnika-jewellers-store.html .social) */}
      <section className="social tex-d py-20 px-6 sm:px-12 border-t border-[#8A6A22]">
        <div className="social-in max-w-[1280px] mx-auto flex flex-col gap-9 items-center text-center">
          <h2 className="font-serif font-semibold text-3xl sm:text-4xl lg:text-5xl text-[#F7F0DE]">
            Follow Us @ParnikaJewellers
          </h2>

          <div className="shots grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {SOCIAL_SHOTS.map((shot, idx) => (
              <div key={idx} className="relative w-full h-[240px] sm:h-[300px] border-2 border-[#D4AF5A] overflow-hidden bg-[#1F070B]">
                <Image
                  src={shot.img}
                  alt={shot.alt}
                  fill
                  className="object-cover object-[center_42%]"
                />
              </div>
            ))}
          </div>

          <div className="chips flex flex-wrap gap-4 justify-center">
            <a
              href="https://www.instagram.com/ParnikaJewellers"
              target="_blank"
              rel="noopener noreferrer"
              className="chip flex items-center gap-2.5 border border-[#D4AF5A] py-3.5 px-7 text-sm text-[#F7F0DE] hover:bg-[#D4AF5A]/15 hover:text-[#E9D08A] transition"
            >
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E9D08A" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="#E9D08A" />
              </svg>
              @ParnikaJewellers
            </a>
            <a
              href="https://www.facebook.com/ParnikaJewellers"
              target="_blank"
              rel="noopener noreferrer"
              className="chip flex items-center gap-2.5 border border-[#D4AF5A] py-3.5 px-7 text-sm text-[#F7F0DE] hover:bg-[#D4AF5A]/15 hover:text-[#E9D08A] transition"
            >
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E9D08A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 8h3V4h-3a4 4 0 00-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z" />
              </svg>
              ParnikaJewellers
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
