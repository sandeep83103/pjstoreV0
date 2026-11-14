import { categoryRepository, productRepository, couponRepository } from '../lib/data';
import { Category, Product, Coupon } from '../lib/types';
import crypto from 'crypto';

const initialCategories: Category[] = [
  {
    id: 'cat-fashion',
    name: 'Fashion Jewellery',
    slug: 'fashion-jewellery',
    parentId: null,
    sortOrder: 1,
  },
  {
    id: 'cat-one-gram',
    name: 'One Gram Gold',
    slug: 'one-gram-gold',
    parentId: null,
    sortOrder: 2,
  },
  {
    id: 'cat-necklaces',
    name: 'Necklaces & Chokers',
    slug: 'necklaces',
    parentId: 'cat-one-gram',
    sortOrder: 3,
  },
  {
    id: 'cat-earrings',
    name: 'Earrings & Jhumkas',
    slug: 'earrings',
    parentId: 'cat-one-gram',
    sortOrder: 4,
  },
  {
    id: 'cat-bangles',
    name: 'Bangles & Kadas',
    slug: 'bangles',
    parentId: 'cat-one-gram',
    sortOrder: 5,
  },
  {
    id: 'cat-rings',
    name: 'Rings',
    slug: 'rings',
    parentId: 'cat-fashion',
    sortOrder: 6,
  },
  {
    id: 'cat-bridal',
    name: 'Bridal Sets',
    slug: 'bridal-sets',
    parentId: null,
    sortOrder: 7,
  },
];

const initialProducts: Product[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    sku: 'PJ-OG-NCK-001',
    supplierCode: 'DBI-101',
    name: 'Royal Heritage One Gram Gold Haar Necklace',
    slug: 'royal-heritage-one-gram-gold-haar-necklace',
    categoryId: 'cat-necklaces',
    tags: ['one-gram-gold', 'necklace', 'bridal', 'traditional'],
    description: 'Exquisite 1-gram gold plated royal haar necklace crafted with micro-plating technology. Featuring traditional temple motifs and antique polish.',
    specs: {
      'Base Metal': 'Copper Alloy',
      'Plating': '24K Micro Gold Plated (1 Gram)',
      'Finish': 'Antique Matte Gold',
      'Weight': '48 grams',
      'Occasion': 'Bridal, Festive, Weddings',
      'Care': 'Keep away from perfumes, sprays and moisture',
    },
    price: 3499,
    mrp: 6999,
    costPrice: 1800,
    stock: 12,
    lowStockAt: 3,
    images: ['products/11111111-1111-4111-8111-111111111111/necklace-front.webp'],
    variants: [],
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    sku: 'PJ-OG-JHM-002',
    supplierCode: 'DBI-102',
    name: 'Temple Lakshmi Ruby CZ Jhumka Earrings',
    slug: 'temple-lakshmi-ruby-cz-jhumka-earrings',
    categoryId: 'cat-earrings',
    tags: ['earrings', 'jhumka', 'ruby', 'temple'],
    description: 'Traditional Goddess Lakshmi carved jhumkas with ruby red stones and pearl drops. Lightweight and comfortable for festive occasions.',
    specs: {
      'Base Metal': 'Brass Alloy',
      'Plating': 'One Gram Gold Micro Polish',
      'Stones': 'AAA Grade CZ & Synthetic Ruby',
      'Closure': 'Push Back',
    },
    price: 1299,
    mrp: 2499,
    costPrice: 650,
    stock: 25,
    lowStockAt: 5,
    images: ['products/22222222-2222-4222-8222-222222222222/jhumka-front.webp'],
    variants: [],
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    sku: 'PJ-OG-BNG-003',
    supplierCode: 'DBI-103',
    name: 'Antique Kada Bangles Pair (Set of 2)',
    slug: 'antique-kada-bangles-pair-set-of-2',
    categoryId: 'cat-bangles',
    tags: ['bangles', 'kada', 'one-gram-gold'],
    description: 'Intricately filigreed royal kadas with side openable screw clasp. Durable 1-gram gold polish suitable for regular wear.',
    specs: {
      'Base Metal': 'Brass',
      'Plating': '1-Gram High Quality Micro Gold',
      'Set Count': '2 Pieces (Pair)',
      'Sizes Available': '2.4, 2.6, 2.8',
    },
    price: 1899,
    mrp: 3799,
    costPrice: 950,
    stock: 18,
    lowStockAt: 4,
    images: ['products/33333333-3333-4333-8333-333333333333/bangles-pair.webp'],
    variants: [
      { id: 'var-2-4', name: 'Size 2.4', sku: 'PJ-OG-BNG-003-24', priceModifier: 0, stock: 6 },
      { id: 'var-2-6', name: 'Size 2.6', sku: 'PJ-OG-BNG-003-26', priceModifier: 0, stock: 8 },
      { id: 'var-2-8', name: 'Size 2.8', sku: 'PJ-OG-BNG-003-28', priceModifier: 0, stock: 4 },
    ],
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const initialCoupons: Coupon[] = [
  {
    code: 'WELCOME10',
    type: 'PERCENTAGE',
    value: 10,
    minCart: 1000,
    maxDiscount: 500,
    usageLimit: 500,
    perUserLimit: 1,
    usedCount: 0,
    validFrom: new Date().toISOString(),
    validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    scope: 'ALL',
    active: true,
  },
  {
    code: 'GOLD500',
    type: 'FLAT',
    value: 500,
    minCart: 3000,
    maxDiscount: 500,
    usageLimit: 200,
    perUserLimit: 1,
    usedCount: 0,
    validFrom: new Date().toISOString(),
    validTo: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    scope: 'ALL',
    active: true,
  },
];

export async function seedDatabase() {
  console.log('\n🌱 Starting database seeding for Parnika Jewellers...\n');

  // 1. Seed Categories
  console.log('📁 Seeding categories...');
  for (const cat of initialCategories) {
    await categoryRepository.create(cat);
    console.log(`  ✓ Category: ${cat.name} (${cat.slug})`);
  }

  // 2. Seed Products
  console.log('\n💎 Seeding products...');
  for (const prod of initialProducts) {
    await productRepository.create(prod);
    console.log(`  ✓ Product: [${prod.sku}] ${prod.name} (Stock: ${prod.stock}, Price: ₹${prod.price})`);
  }

  // 3. Seed Coupons
  console.log('\n🎟️ Seeding promotional coupons...');
  for (const coupon of initialCoupons) {
    await couponRepository.create(coupon);
    console.log(`  ✓ Coupon: ${coupon.code} (${coupon.type === 'FLAT' ? '₹' + coupon.value : coupon.value + '%'} off)`);
  }

  console.log('\n✨ Database seeding completed successfully!\n');
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal seeding error:', err);
      process.exit(1);
    });
}
