import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { POST as handleCartSync, GET as handleGetCart } from '../app/api/cart/route';
import { POST as handleValidateCoupon } from '../app/api/coupons/validate/route';
import { POST as handleCheckout } from '../app/api/checkout/route';
import { productRepository, couponRepository, cartRepository } from '../lib/data';
import { signToken, COOKIE_NAMES } from '../lib/auth/jwt';
import { runLoadTestStock } from './load-test-stock';
import { Product, Coupon } from '../lib/types';

async function runPhase4Evaluations() {
  console.log('====================================================');
  console.log('🧪 RUNNING PHASE 4 EVALUATIONS (evals.md)');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(testId: string, description: string, condition: boolean, details?: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testId}: ${description}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testId}: ${description}`);
      if (details) console.error(`   Details: ${details}`);
    }
  }

  // Helper to generate customer session token
  const customerId = `cust-${crypto.randomUUID().slice(0, 8)}`;
  const customerToken = await signToken(
    {
      userId: customerId,
      phone: '9876543210',
      role: 'customer',
    },
    '30d'
  );

  // -------------------------------------------------------------
  // EVAL-P4-01: Cart Persistence: Guest to Customer Cart Migration
  // -------------------------------------------------------------
  console.log('--- Testing EVAL-P4-01: Guest to Customer Cart Migration ---');
  // Setup: Customer has an existing item in DynamoDB parnika_carts
  const prodA = (await productRepository.list({}, 2)).items[0];
  const prodB = (await productRepository.list({}, 2)).items[1];

  if (!prodA || !prodB) {
    throw new Error('Seed products missing for EVAL-P4-01');
  }

  // Pre-seed customer's server cart with prodA (qty: 1)
  await cartRepository.saveCart({
    id: customerId,
    items: [
      {
        productId: prodA.id,
        quantity: 1,
        addedPrice: prodA.price,
      },
    ],
    updatedAt: new Date().toISOString(),
  });

  // Guest cart contains prodB (qty: 2) and also prodA (qty: 2)
  const guestItems = [
    { productId: prodB.id, quantity: 2, addedPrice: prodB.price },
    { productId: prodA.id, quantity: 2, addedPrice: prodA.price },
  ];

  // User logs in and triggers POST /api/cart with merge: true and customer cookie
  const mergeReq = new NextRequest('http://localhost:3000/api/cart', {
    method: 'POST',
    body: JSON.stringify({
      items: guestItems,
      merge: true,
    }),
    headers: {
      'Content-Type': 'application/json',
      Cookie: `${COOKIE_NAMES.CUSTOMER}=${customerToken}`,
    },
  });

  const mergeRes = await handleCartSync(mergeReq);
  const mergeJson = await mergeRes.json();
  const mergedItems = mergeJson.data?.items || [];

  const foundA = mergedItems.find((i: any) => i.productId === prodA.id);
  const foundB = mergedItems.find((i: any) => i.productId === prodB.id);

  // In DynamoDB parnika_carts: verify persisted
  const savedServerCart = await cartRepository.getCart(customerId);
  const isPersistedInRepo =
    savedServerCart &&
    savedServerCart.items.some((i) => i.productId === prodA.id) &&
    savedServerCart.items.some((i) => i.productId === prodB.id);

  assert(
    'EVAL-P4-01',
    'Guest to Customer Cart Migration (Merge without duplication and DynamoDB sync)',
    mergeRes.status === 200 &&
      Boolean(foundA) &&
      Boolean(foundB) &&
      mergedItems.length === 2 &&
      Boolean(isPersistedInRepo),
    `Status: ${mergeRes.status}, Merged length: ${mergedItems.length}, FoundA: ${Boolean(foundA)}, FoundB: ${Boolean(foundB)}, Persisted: ${Boolean(isPersistedInRepo)}`
  );

  // -------------------------------------------------------------
  // EVAL-P4-02: Cart Stock Clamping (EC-INV-04)
  // -------------------------------------------------------------
  console.log('\n--- Testing EVAL-P4-02: Real-Time Cart Stock Clamping ---');
  // Create a product with stock = 2
  const clampProductId = crypto.randomUUID();
  const clampProduct: Product = {
    id: clampProductId,
    sku: `PJ-CLAMP-${crypto.randomUUID().slice(0, 4).toUpperCase()}`,
    supplierCode: 'CLAMP-01',
    name: 'Antique Ruby Mango Haar',
    slug: `antique-ruby-mango-haar-${clampProductId.slice(0, 6)}`,
    categoryId: 'cat-necklaces',
    tags: ['ruby', 'haar'],
    description: 'Limited piece necklace with ruby stones.',
    specs: { 'Base Metal': 'Copper Alloy' },
    price: 3200,
    mrp: 6400,
    costPrice: 1600,
    stock: 2, // Admin reduced stock to 2
    lowStockAt: 1,
    images: ['products/temp/clamp.webp'],
    variants: [],
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await productRepository.create(clampProduct);

  // Customer has 4 items in cart
  const clampReq = new NextRequest('http://localhost:3000/api/cart', {
    method: 'POST',
    body: JSON.stringify({
      items: [{ productId: clampProductId, quantity: 4 }],
    }),
    headers: { 'Content-Type': 'application/json' },
  });

  const clampRes = await handleCartSync(clampReq);
  const clampJson = await clampRes.json();
  const clampedItem = clampJson.data?.items?.find((i: any) => i.productId === clampProductId);
  const hasAdjustedAlert = clampJson.data?.adjustedItems?.some(
    (adj: any) => adj.productId === clampProductId && adj.originalQty === 4 && adj.adjustedQty === 2
  );
  const expectedSubtotal = 3200 * 2; // 6400

  assert(
    'EVAL-P4-02',
    'Cart Stock Clamping (Quantity clamped from 4 to 2 with alert notice and price recalculation)',
    clampedItem?.quantity === 2 &&
      Boolean(hasAdjustedAlert) &&
      clampJson.data?.subtotal === expectedSubtotal,
    `Clamped Qty: ${clampedItem?.quantity}, Alert: ${Boolean(hasAdjustedAlert)}, Subtotal: ${clampJson.data?.subtotal}`
  );

  // -------------------------------------------------------------
  // EVAL-P4-03: Coupon Rules: Discount Cap & Minimum Cart Boundary (EC-CPN-02)
  // -------------------------------------------------------------
  console.log('\n--- Testing EVAL-P4-03: Coupon Minimum Cart Boundary & Discount Rules ---');
  // Ensure coupon FESTIVE500 exists: minCart: 2500, flat 500 discount
  await couponRepository.create({
    code: 'FESTIVE500',
    type: 'FLAT',
    value: 500,
    minCart: 2500,
    maxDiscount: 500,
    usageLimit: 100,
    perUserLimit: 1,
    usedCount: 0,
    validFrom: new Date(Date.now() - 86400000).toISOString(),
    validTo: new Date(Date.now() + 86400000 * 30).toISOString(),
    scope: 'ALL',
    active: true,
  });

  // Case 1: Sub-threshold cart of ₹2,400 -> MUST REJECT with minimum order value message
  const rejectReq = new NextRequest('http://localhost:3000/api/coupons/validate', {
    method: 'POST',
    body: JSON.stringify({
      code: 'FESTIVE500',
      cartSubtotal: 2400,
    }),
    headers: { 'Content-Type': 'application/json' },
  });
  const rejectRes = await handleValidateCoupon(rejectReq);
  const rejectJson = await rejectRes.json();
  const rejectedProperly =
    rejectRes.status === 400 &&
    rejectJson.error?.message?.includes('Minimum order value of ₹2,500 required.');

  // Case 2: Eligible cart of ₹3,000 -> MUST ACCEPT with ₹500 discount
  const acceptReq = new NextRequest('http://localhost:3000/api/coupons/validate', {
    method: 'POST',
    body: JSON.stringify({
      code: 'FESTIVE500',
      cartSubtotal: 3000,
    }),
    headers: { 'Content-Type': 'application/json' },
  });
  const acceptRes = await handleValidateCoupon(acceptReq);
  const acceptJson = await acceptRes.json();
  const acceptedProperly =
    acceptRes.status === 200 &&
    acceptJson.data?.valid === true &&
    acceptJson.data?.discount === 500;

  assert(
    'EVAL-P4-03',
    'Coupon Rules (Rejection on ₹2,400 with min cart error; Acceptance on ₹3,000 with ₹500 discount)',
    rejectedProperly && acceptedProperly,
    `Reject properly: ${rejectedProperly} ("${rejectJson.error?.message}"), Accept properly: ${acceptedProperly} (discount: ${acceptJson.data?.discount})`
  );

  // -------------------------------------------------------------
  // EVAL-P4-04: Coupon Limits: Single-Use & Usage Limits (EC-CPN-01)
  // -------------------------------------------------------------
  console.log('\n--- Testing EVAL-P4-04: Single-Use Coupon Usage Limit Concurrency ---');
  const singleUseCode = `ONEUSE-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
  await couponRepository.create({
    code: singleUseCode,
    type: 'FLAT',
    value: 300,
    minCart: 1000,
    maxDiscount: 300,
    usageLimit: 1, // STRICTLY SINGLE USE
    perUserLimit: 1,
    usedCount: 0,
    validFrom: new Date(Date.now() - 86400000).toISOString(),
    validTo: new Date(Date.now() + 86400000 * 30).toISOString(),
    scope: 'ALL',
    active: true,
  });

  // Create product with sufficient stock (e.g. 10 units)
  const cpnProdId = crypto.randomUUID();
  await productRepository.create({
    id: cpnProdId,
    sku: `PJ-CPN-${crypto.randomUUID().slice(0, 4).toUpperCase()}`,
    supplierCode: 'CPN-01',
    name: 'Antique Peacock Jhumkas',
    slug: `antique-peacock-jhumkas-${cpnProdId.slice(0, 6)}`,
    categoryId: 'cat-earrings',
    tags: ['earrings'],
    description: 'Beautiful earrings for testing coupon concurrency.',
    specs: { 'Base Metal': 'Brass' },
    price: 1500,
    mrp: 3000,
    costPrice: 750,
    stock: 10,
    lowStockAt: 2,
    images: ['products/temp/jhumka.webp'],
    variants: [],
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Concurrently dispatch 2 checkouts attempting to apply the single-use coupon
  const checkoutPayload = (idx: number) => ({
    items: [{ productId: cpnProdId, quantity: 1 }],
    shippingAddress: {
      fullName: `User ${idx}`,
      phone: '9876543210',
      street: '123 MG Road',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500001',
    },
    paymentMethod: 'youpi' as const,
    couponCode: singleUseCode,
    userId: `user-${idx}`,
  });

  const [res1, res2] = await Promise.all([
    handleCheckout(
      new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify(checkoutPayload(1)),
        headers: { 'Content-Type': 'application/json' },
      })
    ),
    handleCheckout(
      new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify(checkoutPayload(2)),
        headers: { 'Content-Type': 'application/json' },
      })
    ),
  ]);

  const [json1, json2] = await Promise.all([res1.json(), res2.json()]);

  const successOrders = [json1, json2].filter((j) => j.success);
  const rejectedCoupons = [json1, json2].filter(
    (j) => !j.success && j.error?.code === 'COUPON_LIMIT_REACHED'
  );

  const updatedCoupon = await couponRepository.findByCode(singleUseCode);

  assert(
    'EVAL-P4-04',
    'Coupon Limits (Exactly one order receives discount; concurrent order rejects with COUPON_LIMIT_REACHED)',
    successOrders.length === 1 &&
      rejectedCoupons.length === 1 &&
      updatedCoupon?.usedCount === 1,
    `Successes: ${successOrders.length}, Coupon limit rejections: ${rejectedCoupons.length}, Final usedCount: ${updatedCoupon?.usedCount}`
  );

  // -------------------------------------------------------------
  // EVAL-P4-05: Zero-Oversell Race Condition on Single Unit
  // -------------------------------------------------------------
  console.log('\n--- Testing EVAL-P4-05: Zero-Oversell Concurrency Load Test ---');
  const loadTestPassed = await runLoadTestStock();

  assert(
    'EVAL-P4-05',
    'Zero-Oversell Race: 10 concurrent requests for 1 stock unit produce exactly 1 winner and 9 409 rejections',
    loadTestPassed,
    'Verified via scripts/load-test-stock.ts'
  );

  console.log('\n====================================================');
  console.log(`📊 PHASE 4 EVALUATION RESULT: ${passed}/${total} TESTS PASSED`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

if (require.main === module) {
  runPhase4Evaluations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal evaluation error:', err);
      process.exit(1);
    });
}
