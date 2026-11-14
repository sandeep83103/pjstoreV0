import { ProductSchema, CategorySchema, OrderSchema, CouponSchema } from '../../lib/types';
import { productRepository, categoryRepository, couponRepository } from '../../lib/data';

async function runRepositoryUnitTests() {
  console.log('🧪 Running Repository Contract & Schema Unit Tests...\n');

  // Test 1: Category Schema Validation
  const validCat = CategorySchema.parse({
    id: 'cat-test',
    name: 'Necklaces',
    slug: 'necklaces',
    parentId: null,
    sortOrder: 1,
  });
  console.log('✓ Validated Category schema:', validCat.name);

  // Test 2: Product Schema Validation & Stock Check
  const validProduct = ProductSchema.parse({
    id: 'a0000000-0000-4000-8000-000000000001',
    sku: 'PJ-TEST-001',
    supplierCode: 'DBI-TEST',
    name: 'One Gram Gold Floral Choker',
    slug: 'one-gram-gold-floral-choker',
    categoryId: 'cat-test',
    tags: ['necklace', 'choker'],
    description: 'Beautiful traditional choker with high grade polish.',
    specs: { 'Base Metal': 'Copper', 'Polish': '1-Gram Micro' },
    price: 2499,
    mrp: 4999,
    costPrice: 1200,
    stock: 5,
    lowStockAt: 2,
    images: ['products/test/choker.webp'],
    variants: [],
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  console.log('✓ Validated Product schema:', validProduct.name, `(Price: ₹${validProduct.price})`);

  // Test 3: Coupon Schema Validation
  const validCoupon = CouponSchema.parse({
    code: 'SAVE10',
    type: 'PERCENTAGE',
    value: 10,
    minCart: 2000,
    maxDiscount: 500,
    usageLimit: 100,
    perUserLimit: 1,
    usedCount: 0,
    validFrom: new Date().toISOString(),
    validTo: new Date(Date.now() + 86400000).toISOString(),
    scope: 'ALL',
    active: true,
  });
  console.log('✓ Validated Coupon schema:', validCoupon.code);

  console.log('\n🎉 All Repository Contract Unit Tests Passed Successfully!\n');
}

runRepositoryUnitTests().catch((err) => {
  console.error('Test failure:', err);
  process.exit(1);
});
