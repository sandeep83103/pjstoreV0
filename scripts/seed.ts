import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { categoryRepository, productRepository, couponRepository } from '../lib/data';
import { SEED_CATEGORIES, SEED_PRODUCTS } from '../lib/data/seedData';
import { Coupon } from '../lib/types';

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
  for (const cat of SEED_CATEGORIES) {
    await categoryRepository.create(cat);
    console.log(`  ✓ Category: ${cat.name} (${cat.slug})`);
  }

  // 2. Seed Products
  console.log('\n💎 Seeding products...');
  for (const prod of SEED_PRODUCTS) {
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
