'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ProductCard } from '@/components/storefront/ProductCard';
import { useStorefrontContent } from '@/app/context/StorefrontContentContext';
import { EditableText } from '@/components/storefront/EditableText';
import { Product } from '@/lib/types';

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

export function StorefrontHomePageClient({
  featuredProducts,
}: {
  featuredProducts: Product[];
}) {
  const { content } = useStorefrontContent();

  return (
    <div>
      {/* 1. HERO SECTION */}
      <section id="top" className="hero-wrap tex-m border-b border-[#8A6A22]">
        <div className="hero max-w-[1440px] 2xl:max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 py-10 sm:py-16 lg:py-20 flex flex-wrap items-center gap-8 sm:gap-12 lg:gap-14">
          {/* Left Copy */}
          <div className="hero-copy w-full lg:flex-1 min-w-0 space-y-4 sm:space-y-6">
            <EditableText
              as="div"
              fieldPath="hero.eyebrow"
              value={content.hero.eyebrow}
              className="eyebrow text-xs sm:text-sm tracking-[0.3em] uppercase text-[#E9D08A] font-medium"
            />

            <EditableText
              as="h1"
              fieldPath="hero.title"
              value={content.hero.title}
              className="font-serif font-semibold text-3xl sm:text-5xl lg:text-7xl leading-[1.08] sm:leading-[1.04] text-[#F7F0DE]"
            />

            <EditableText
              as="p"
              fieldPath="hero.description"
              value={content.hero.description}
              className="text-sm sm:text-base lg:text-lg leading-relaxed text-[#E4D7C0] max-w-[480px]"
            />

            <div className="btns flex flex-wrap gap-3 sm:gap-4 pt-1 sm:pt-2">
              <Link href={content.hero.primaryCtaHref || '#collection'} className="btn-gold py-3 px-6 sm:py-3.5 sm:px-8 text-xs sm:text-sm inline-block">
                <EditableText
                  as="span"
                  fieldPath="hero.primaryCtaText"
                  value={content.hero.primaryCtaText}
                />
              </Link>
              <Link href={content.hero.secondaryCtaHref || '#bridal'} className="btn-line py-3 px-6 sm:py-3.5 sm:px-8 text-xs sm:text-sm inline-block">
                <EditableText
                  as="span"
                  fieldPath="hero.secondaryCtaText"
                  value={content.hero.secondaryCtaText}
                />
              </Link>
            </div>
          </div>

          {/* Right Hero Product Feature */}
          <div className="hero-img w-full lg:flex-1 min-w-0 flex justify-center">
            <div className="relative w-full max-w-[420px] sm:max-w-[500px] aspect-[4/5] sm:aspect-square border-4 sm:border-[6px] border-[#D4AF5A] shadow-[0_0_0_6px_#4A1118,0_0_0_8px_#D4AF5A,0_16px_40px_rgba(0,0,0,0.45)] sm:shadow-[0_0_0_10px_#4A1118,0_0_0_12px_#D4AF5A,0_24px_60px_rgba(0,0,0,0.45)] overflow-hidden bg-[#2E0A0F]">
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

      {/* 2. SHOP BY STYLE */}
      <section id="shop" className="sec tex-d px-4 sm:px-8 lg:px-12 py-12 sm:py-20 border-b border-[#8A6A22]">
        <div className="wrap max-w-[1440px] 2xl:max-w-[1720px] mx-auto">
          <div className="sec-head text-center space-y-2 mb-8 sm:mb-10">
            <EditableText
              as="div"
              fieldPath="categoriesSection.eyebrow"
              value={content.categoriesSection.eyebrow}
              className="eyebrow text-xs sm:text-sm tracking-[0.3em] uppercase text-[#E9D08A]"
            />
            <EditableText
              as="h2"
              fieldPath="categoriesSection.title"
              value={content.categoriesSection.title}
              className="font-serif font-semibold text-2xl sm:text-4xl lg:text-5xl text-[#F7F0DE]"
            />
            <div className="orn flex items-center justify-center gap-3 text-[#D4AF5A] pt-2" aria-hidden="true">
              <i className="block h-[1px] w-12 sm:w-16 bg-[#D4AF5A]" />
              <b className="block w-2 h-2 bg-[#D4AF5A] rotate-45" />
              <i className="block h-[1px] w-12 sm:w-16 bg-[#D4AF5A]" />
            </div>
          </div>

          <div className="cat-row grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {CATEGORIES.map((cat) => (
              <Link key={cat.title} href={cat.href} className="cat group flex flex-col gap-2.5 sm:gap-3.5 text-[#F7F0DE]">
                <div className="relative w-full h-[200px] sm:h-[300px] lg:h-[340px] border-2 border-[#D4AF5A] overflow-hidden bg-[#1F070B]">
                  <Image
                    src={cat.img}
                    alt={cat.title}
                    fill
                    className="object-cover object-[center_42%] group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <span className="font-serif text-lg sm:text-2xl font-semibold text-center text-[#F7F0DE] group-hover:text-[#E9D08A] transition-colors">
                  {cat.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. COLLECTION */}
      <section id="collection" className="collection bg-[#F7F0DE] text-[#2B1316] px-4 sm:px-8 lg:px-12 py-12 sm:py-24">
        <div className="wrap max-w-[1440px] 2xl:max-w-[1720px] mx-auto">
          <div className="split-head flex flex-wrap items-end justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <EditableText
                as="div"
                fieldPath="collectionSection.eyebrow"
                value={content.collectionSection.eyebrow}
                className="eyebrow dark text-xs tracking-[0.25em] uppercase font-bold text-[#7A262D] mb-1"
              />
              <EditableText
                as="h2"
                fieldPath="collectionSection.title"
                value={content.collectionSection.title}
                className="font-serif font-semibold text-2xl sm:text-4xl lg:text-5xl text-[#7A262D]"
              />
            </div>
            <EditableText
              as="div"
              fieldPath="collectionSection.note"
              value={content.collectionSection.note}
              className="note text-xs sm:text-sm text-[#5E4A4C] italic"
            />
          </div>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[#5E4A4C]">
              No products found in the catalog.
            </div>
          )}

          <div className="mt-10 sm:mt-12 text-center">
            <Link
              href="/catalog"
              className="inline-block bg-[#7A262D] text-[#F7F0DE] hover:bg-[#2E0A0F] hover:text-[#E9D08A] py-3 px-7 sm:py-3.5 sm:px-8 font-semibold tracking-widest text-xs uppercase transition shadow-md"
            >
              <EditableText
                as="span"
                fieldPath="collectionSection.ctaText"
                value={content.collectionSection.ctaText}
              />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. FESTIVE SPECIAL PROMO BANNER */}
      <section id="bridal" className="promo tex py-12 sm:py-20 px-4 sm:px-8 lg:px-12 border-t border-[#8A6A22]">
        <div className="promo-box tex-dd max-w-[1100px] mx-auto border-2 border-[#D4AF5A] outline outline-1 outline-[#D4AF5A] outline-offset-4 sm:outline-offset-8 p-6 sm:p-12 lg:p-16 text-center flex flex-col items-center gap-3 sm:gap-4 text-[#F7F0DE]">
          <EditableText
            as="div"
            fieldPath="festivePromo.eyebrow"
            value={content.festivePromo.eyebrow}
            className="eyebrow text-xs tracking-[0.25em] uppercase text-[#E9D08A]"
          />
          <EditableText
            as="h2"
            fieldPath="festivePromo.title"
            value={content.festivePromo.title}
            className="font-serif font-semibold text-2xl sm:text-4xl lg:text-6xl"
          />
          <EditableText
            as="div"
            fieldPath="festivePromo.getUpToText"
            value={content.festivePromo.getUpToText}
            className="small text-xs uppercase tracking-[0.25em] text-[#E4D7C0]"
          />
          <div className="big font-serif font-bold text-6xl sm:text-8xl lg:text-[140px] text-[#E9D08A] leading-none">
            <EditableText
              as="span"
              fieldPath="festivePromo.discount"
              value={content.festivePromo.discount}
            />
            <span className="text-2xl sm:text-4xl tracking-widest ml-2">
              <EditableText
                as="span"
                fieldPath="festivePromo.discountSub"
                value={content.festivePromo.discountSub}
              />
            </span>
          </div>
          <EditableText
            as="div"
            fieldPath="festivePromo.subtitle"
            value={content.festivePromo.subtitle}
            className="sub font-serif text-xl sm:text-3xl text-[#F7F0DE]"
          />
          <Link
            href={content.festivePromo.ctaHref || '/catalog?category=bridal-temple'}
            className="btn-gold mt-3 sm:mt-4 py-3 px-7 sm:py-4 sm:px-10 text-xs sm:text-sm font-semibold tracking-widest inline-block"
          >
            <EditableText
              as="span"
              fieldPath="festivePromo.ctaText"
              value={content.festivePromo.ctaText}
            />
          </Link>
        </div>
      </section>

      {/* 5. OUR STORY / ABOUT */}
      <section id="about" className="about bg-[#F7F0DE] text-[#2B1316] py-12 sm:py-20 px-4 sm:px-8 lg:px-12 border-t border-[#8A6A22]">
        <div className="about-in max-w-[1200px] mx-auto flex flex-wrap items-center gap-8 sm:gap-12 lg:gap-14">
          {/* Emblem & Crest Image */}
          <div className="about-img w-full lg:flex-1 min-w-0">
            <div className="relative w-full max-w-[320px] sm:max-w-[380px] aspect-square mx-auto border-2 sm:border-[3px] border-[#D4AF5A] shadow-[0_0_0_6px_#F7F0DE,0_0_0_8px_#D4AF5A,0_16px_36px_rgba(74,17,24,0.25)] sm:shadow-[0_0_0_8px_#F7F0DE,0_0_0_10px_#D4AF5A,0_20px_50px_rgba(74,17,24,0.25)] overflow-hidden bg-[#2E0A0F]">
              <Image
                src="/brand/crest.jpg"
                alt="Parnika Jewellers logo: PJ monogram crest with crown, emerald and ruby border"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Copy & Store Policies */}
          <div className="about-copy w-full lg:flex-1 min-w-0 space-y-4 sm:space-y-5">
            <EditableText
              as="div"
              fieldPath="storySection.eyebrow"
              value={content.storySection.eyebrow}
              className="eyebrow dark text-xs tracking-[0.25em] uppercase font-bold text-[#7A262D]"
            />
            <EditableText
              as="h2"
              fieldPath="storySection.title"
              value={content.storySection.title}
              className="font-serif font-semibold text-2xl sm:text-4xl lg:text-5xl text-[#7A262D] leading-tight"
            />
            <EditableText
              as="p"
              fieldPath="storySection.description"
              value={content.storySection.description}
              className="text-sm sm:text-base lg:text-lg leading-relaxed text-[#4B3A3C]"
            />

            <div className="pol flex flex-wrap gap-3 sm:gap-4 pt-2 sm:pt-3">
              <div className="flex-1 min-w-[130px] border-t-2 border-[#D4AF5A] pt-2 sm:pt-3">
                <EditableText
                  as="h3"
                  fieldPath="storySection.shippingTitle"
                  value={content.storySection.shippingTitle}
                  className="font-serif text-lg sm:text-xl font-bold text-[#4A1118]"
                />
                <EditableText
                  as="p"
                  fieldPath="storySection.shippingText"
                  value={content.storySection.shippingText}
                  className="text-xs text-[#5E4A4C] mt-1 leading-relaxed"
                />
              </div>
              <div className="flex-1 min-w-[130px] border-t-2 border-[#D4AF5A] pt-2 sm:pt-3">
                <EditableText
                  as="h3"
                  fieldPath="storySection.returnsTitle"
                  value={content.storySection.returnsTitle}
                  className="font-serif text-lg sm:text-xl font-bold text-[#4A1118]"
                />
                <EditableText
                  as="p"
                  fieldPath="storySection.returnsText"
                  value={content.storySection.returnsText}
                  className="text-xs text-[#5E4A4C] mt-1 leading-relaxed"
                />
              </div>
              <div className="flex-1 min-w-[130px] border-t-2 border-[#D4AF5A] pt-2 sm:pt-3">
                <EditableText
                  as="h3"
                  fieldPath="storySection.paymentsTitle"
                  value={content.storySection.paymentsTitle}
                  className="font-serif text-lg sm:text-xl font-bold text-[#4A1118]"
                />
                <EditableText
                  as="p"
                  fieldPath="storySection.paymentsText"
                  value={content.storySection.paymentsText}
                  className="text-xs text-[#5E4A4C] mt-1 leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SOCIAL PROOF STRIP */}
      <section className="social tex-d py-12 sm:py-20 px-4 sm:px-8 lg:px-12 border-t border-[#8A6A22]">
        <div className="social-in max-w-[1440px] 2xl:max-w-[1720px] mx-auto flex flex-col gap-6 sm:gap-9 items-center text-center">
          <EditableText
            as="h2"
            fieldPath="socialSection.title"
            value={content.socialSection.title}
            className="font-serif font-semibold text-2xl sm:text-4xl lg:text-5xl text-[#F7F0DE]"
          />

          <div className="shots grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 w-full">
            {SOCIAL_SHOTS.map((shot, idx) => (
              <div key={idx} className="relative w-full h-[180px] sm:h-[260px] lg:h-[300px] border-2 border-[#D4AF5A] overflow-hidden bg-[#1F070B]">
                <Image
                  src={shot.img}
                  alt={shot.alt}
                  fill
                  className="object-cover object-[center_42%]"
                />
              </div>
            ))}
          </div>

          <div className="chips flex flex-wrap gap-3 sm:gap-4 justify-center">
            <a
              href="https://www.instagram.com/ParnikaJewellers"
              target="_blank"
              rel="noopener noreferrer"
              className="chip flex items-center gap-2 border border-[#D4AF5A] py-2.5 px-5 sm:py-3.5 sm:px-7 text-xs sm:text-sm text-[#F7F0DE] hover:bg-[#D4AF5A]/15 hover:text-[#E9D08A] transition"
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E9D08A" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="#E9D08A" />
              </svg>
              <span>{content.socialSection.instagramHandle || '@ParnikaJewellers'}</span>
            </a>
            <a
              href="https://www.facebook.com/ParnikaJewellers"
              target="_blank"
              rel="noopener noreferrer"
              className="chip flex items-center gap-2 border border-[#D4AF5A] py-2.5 px-5 sm:py-3.5 sm:px-7 text-xs sm:text-sm text-[#F7F0DE] hover:bg-[#D4AF5A]/15 hover:text-[#E9D08A] transition"
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E9D08A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 8h3V4h-3a4 4 0 00-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z" />
              </svg>
              <span>{content.socialSection.facebookHandle || 'ParnikaJewellers'}</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
