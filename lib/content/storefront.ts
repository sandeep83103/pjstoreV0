import fs from 'fs';
import path from 'path';

export interface StorefrontContent {
  announcement: {
    freeShippingText: string;
    freeShippingMobileText: string;
    whatsappText: string;
    whatsappNumber: string;
  };
  brand: {
    name: string;
    tagline: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    primaryCtaText: string;
    primaryCtaHref: string;
    secondaryCtaText: string;
    secondaryCtaHref: string;
  };
  categoriesSection: {
    eyebrow: string;
    title: string;
  };
  collectionSection: {
    eyebrow: string;
    title: string;
    note: string;
    ctaText: string;
  };
  festivePromo: {
    eyebrow: string;
    title: string;
    getUpToText: string;
    discount: string;
    discountSub: string;
    subtitle: string;
    ctaText: string;
    ctaHref: string;
  };
  storySection: {
    eyebrow: string;
    title: string;
    description: string;
    shippingTitle: string;
    shippingText: string;
    returnsTitle: string;
    returnsText: string;
    paymentsTitle: string;
    paymentsText: string;
  };
  socialSection: {
    title: string;
    instagramHandle: string;
    facebookHandle: string;
  };
}

export const DEFAULT_STOREFRONT_CONTENT: StorefrontContent = {
  announcement: {
    freeShippingText: 'Free Delivery for Orders Above Rs 599',
    freeShippingMobileText: 'Free Delivery > ₹599',
    whatsappText: 'WhatsApp Support: 9677255036',
    whatsappNumber: '9677255036',
  },
  brand: {
    name: 'Parnika Jewellers',
    tagline: 'Crowned in Gold, Rooted in Tradition',
  },
  hero: {
    eyebrow: 'New Arrivals',
    title: 'Exquisite One-Gram & Fashion Jewellery',
    description:
      'Timeless elegance for your everyday celebrations. Temple-inspired gold finish, ruby and emerald tones, crafted with grace and worn with pride.',
    primaryCtaText: 'Shop the Collection',
    primaryCtaHref: '#collection',
    secondaryCtaText: 'Bridal Collections',
    secondaryCtaHref: '#bridal',
  },
  categoriesSection: {
    eyebrow: 'Shop by Style',
    title: 'Find Your Signature Set',
  },
  collectionSection: {
    eyebrow: 'Just In',
    title: 'New Arrivals',
    note: 'Every set comes with matching earrings.',
    ctaText: 'Explore Full Collection',
  },
  festivePromo: {
    eyebrow: 'Festive Special',
    title: 'Bring Home Prosperity',
    getUpToText: 'Get up to',
    discount: '20%',
    discountSub: 'OFF',
    subtitle: 'On Bridal Collections',
    ctaText: 'Shop Bridal',
    ctaHref: '/catalog?category=bridal-temple',
  },
  storySection: {
    eyebrow: 'Our Story',
    title: 'Crafted with Grace, Worn with Pride',
    description:
      'Parnika Jewellers brings the richness of traditional gold designs to everyday celebrations. Every one-gram and fashion piece is chosen for its detail, its finish and the way it carries a festive look.',
    shippingTitle: 'Shipping',
    shippingText: 'Free insured delivery on orders > ₹599 with 24-hour dispatch across India.',
    returnsTitle: 'Returns',
    returnsText: '48-hour easy exchange and transit damage protection with live support.',
    paymentsTitle: 'Payments',
    paymentsText: 'Secure UPI, Credit/Debit cards, NetBanking and Cash on Delivery.',
  },
  socialSection: {
    title: 'Follow Us @ParnikaJewellers',
    instagramHandle: '@ParnikaJewellers',
    facebookHandle: 'ParnikaJewellers',
  },
};

const CONTENT_FILE_PATH = path.join(process.cwd(), 'data', 'storefront-content.json');

export async function getStorefrontContent(): Promise<StorefrontContent> {
  try {
    if (fs.existsSync(CONTENT_FILE_PATH)) {
      const raw = await fs.promises.readFile(CONTENT_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      // Merge with default to guarantee all fields exist even if file has partial data
      return {
        ...DEFAULT_STOREFRONT_CONTENT,
        ...parsed,
        announcement: { ...DEFAULT_STOREFRONT_CONTENT.announcement, ...(parsed.announcement || {}) },
        brand: { ...DEFAULT_STOREFRONT_CONTENT.brand, ...(parsed.brand || {}) },
        hero: { ...DEFAULT_STOREFRONT_CONTENT.hero, ...(parsed.hero || {}) },
        categoriesSection: { ...DEFAULT_STOREFRONT_CONTENT.categoriesSection, ...(parsed.categoriesSection || {}) },
        collectionSection: { ...DEFAULT_STOREFRONT_CONTENT.collectionSection, ...(parsed.collectionSection || {}) },
        festivePromo: { ...DEFAULT_STOREFRONT_CONTENT.festivePromo, ...(parsed.festivePromo || {}) },
        storySection: { ...DEFAULT_STOREFRONT_CONTENT.storySection, ...(parsed.storySection || {}) },
        socialSection: { ...DEFAULT_STOREFRONT_CONTENT.socialSection, ...(parsed.socialSection || {}) },
      };
    }
  } catch (err) {
    console.error('Error reading storefront content:', err);
  }
  return DEFAULT_STOREFRONT_CONTENT;
}

export async function saveStorefrontContent(content: Partial<StorefrontContent>): Promise<StorefrontContent> {
  const current = await getStorefrontContent();
  const merged: StorefrontContent = {
    ...current,
    ...content,
    announcement: { ...current.announcement, ...(content.announcement || {}) },
    brand: { ...current.brand, ...(content.brand || {}) },
    hero: { ...current.hero, ...(content.hero || {}) },
    categoriesSection: { ...current.categoriesSection, ...(content.categoriesSection || {}) },
    collectionSection: { ...current.collectionSection, ...(content.collectionSection || {}) },
    festivePromo: { ...current.festivePromo, ...(content.festivePromo || {}) },
    storySection: { ...current.storySection, ...(content.storySection || {}) },
    socialSection: { ...current.socialSection, ...(content.socialSection || {}) },
  };

  const dir = path.dirname(CONTENT_FILE_PATH);
  if (!fs.existsSync(dir)) {
    await fs.promises.mkdir(dir, { recursive: true });
  }

  await fs.promises.writeFile(CONTENT_FILE_PATH, JSON.stringify(merged, null, 2), 'utf-8');
  return merged;
}
