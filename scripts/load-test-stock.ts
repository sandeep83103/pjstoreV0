import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { POST as handleCheckout } from '../app/api/checkout/route';
import { productRepository } from '../lib/data';
import { Product } from '../lib/types';

/**
 * Test 1: Single Product High Concurrency Race (7.1 & EVAL-P4-05)
 * Simulates 20 concurrent shoppers competing for strictly 2 units of stock.
 * Proves that exactly 2 orders succeed and 18 are rejected with OUT_OF_STOCK (409),
 * and the database stock ends at exactly 0 (never negative).
 */
export async function runSingleProductConcurrencyTest(
  concurrentShoppers = 20,
  initialStock = 2
): Promise<boolean> {
  console.log('====================================================');
  console.log(`⚡ TEST 1: SINGLE-PRODUCT CONCURRENCY RACE (Plan 7.1)`);
  console.log(`   Shoppers: ${concurrentShoppers} | Available Stock: ${initialStock}`);
  console.log('====================================================\n');

  const testProductId = crypto.randomUUID();
  const testProductSku = `PJ-RACE-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;

  const product: Product = {
    id: testProductId,
    sku: testProductSku,
    supplierCode: 'LOAD-TEST-RACE',
    name: 'Royal Heritage Temple Choker',
    slug: `royal-heritage-choker-${testProductId.slice(0, 6)}`,
    categoryId: 'cat-necklaces',
    tags: ['rare', 'heritage', 'choker', 'limited-edition'],
    description: 'Rare handcrafted 24K 1-gram micro gold temple choker. Limited release.',
    specs: {
      'Base Metal': 'Copper Alloy',
      'Plating': '24K Micro Gold',
      'Batch Limit': `${initialStock} Units Only`,
    },
    price: 3499,
    mrp: 6999,
    costPrice: 1750,
    stock: initialStock,
    lowStockAt: 1,
    images: ['products/temp/choker.webp'],
    variants: [],
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await productRepository.create(product);
  console.log(`📦 Seeded product [${product.sku}] with stock = ${initialStock}`);
  console.log(`🚀 Firing ${concurrentShoppers} concurrent checkout requests...\n`);

  const requests = Array.from({ length: concurrentShoppers }).map((_, idx) => {
    const shopperId = `shopper-race-${idx + 1}`;
    const payload = {
      items: [{ productId: testProductId, quantity: 1 }],
      shippingAddress: {
        fullName: `Shopper ${idx + 1}`,
        phone: `98765432${(idx % 90) + 10}`,
        street: `${idx + 1} Palace Road, Jubilee Hills`,
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500033',
      },
      shippingMethod: 'standard' as const,
      paymentMethod: 'youpi' as const,
      userId: shopperId,
    };

    const req = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    return handleCheckout(req);
  });

  const responses = await Promise.all(requests);
  const responseData = await Promise.all(responses.map((r) => r.json()));

  let successCount = 0;
  let outOfStockCount = 0;
  let server500Count = 0;

  responses.forEach((res, i) => {
    const json = responseData[i];
    if (res.status === 201 && json.success) {
      successCount++;
    } else if (res.status === 409 || json.error?.code === 'OUT_OF_STOCK') {
      outOfStockCount++;
    } else if (res.status >= 500) {
      server500Count++;
      console.error(`💥 Server 500 on request ${i + 1}:`, json);
    }
  });

  const updatedProduct = await productRepository.findById(testProductId);
  const finalStock = updatedProduct?.stock;

  console.log('----------------------------------------------------');
  console.log(`📊 Race Results:`);
  console.log(`   - Successful Orders: ${successCount} (Expected: ${initialStock})`);
  console.log(`   - Out-of-Stock Rejections: ${outOfStockCount} (Expected: ${concurrentShoppers - initialStock})`);
  console.log(`   - Server 500 Errors: ${server500Count} (Expected: 0)`);
  console.log(`   - Final Stock in DB: ${finalStock} (Expected: 0, never negative)`);
  console.log('----------------------------------------------------\n');

  const passed =
    successCount === initialStock &&
    outOfStockCount === concurrentShoppers - initialStock &&
    server500Count === 0 &&
    finalStock === 0;

  if (passed) {
    console.log('✅ [PASS] Plan 7.1 Single-Product Concurrency Test PASSED cleanly!\n');
  } else {
    console.error('❌ [FAIL] Plan 7.1 Single-Product Concurrency Test FAILED!\n');
  }

  return passed;
}

/**
 * Test 2: Multi-Item Flash Sale Simulation (EVAL-P7-01)
 * Simulates 50 concurrent virtual users purchasing across 5 low-stock items.
 * Verifies:
 * - 0 negative stock records
 * - 0 duplicate orders
 * - 0 unhandled 500 server crashes
 * - Stock balances reconcile 100% across all SKUs (initialStock - successfulPurchases === finalStock)
 */
export async function runMultiProductFlashSaleSimulation(
  totalUsers = 50,
  numItems = 5
): Promise<boolean> {
  console.log('====================================================');
  console.log(`⚡ TEST 2: MULTI-ITEM FLASH SALE SIMULATION (EVAL-P7-01)`);
  console.log(`   Virtual Users: ${totalUsers} | Flash Sale Items: ${numItems}`);
  console.log('====================================================\n');

  // Seed 5 distinct items with low stock allocations: [3, 2, 1, 4, 2] = 12 total units available
  const stockAllocations = [3, 2, 1, 4, 2];
  const items: Product[] = [];

  for (let i = 0; i < numItems; i++) {
    const id = crypto.randomUUID();
    const stock = stockAllocations[i % stockAllocations.length] ?? 2;
    const product: Product = {
      id,
      sku: `PJ-FLASH-${i + 1}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`,
      supplierCode: `SUP-FLASH-${i + 1}`,
      name: `Flash Sale Item #${i + 1} (Stock: ${stock})`,
      slug: `flash-sale-item-${i + 1}-${id.slice(0, 6)}`,
      categoryId: 'cat-fashion',
      tags: ['flash-sale', 'limited'],
      description: `Limited edition flash sale item with ${stock} available units.`,
      specs: { Finish: 'Antique 1-Gram Gold' },
      price: 1999 + i * 500,
      mrp: 3999 + i * 500,
      costPrice: 999,
      stock,
      lowStockAt: 1,
      images: [`products/flash/item-${i + 1}.webp`],
      variants: [],
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await productRepository.create(product);
    items.push(product);
    console.log(`📦 Seeded Flash Item #${i + 1} [${product.sku}] with stock = ${stock}`);
  }

  const totalAvailableUnits = stockAllocations.reduce((a, b) => a + b, 0);
  console.log(`\nTotal available stock across all ${numItems} items: ${totalAvailableUnits} units`);
  console.log(`🚀 Dispatching ${totalUsers} concurrent shopper checkout requests simultaneously...\n`);

  // Distribute 50 virtual users across the 5 items
  const requests = Array.from({ length: totalUsers }).map((_, userIdx) => {
    // Pick an item cyclically so all items get high concurrent contention
    const targetItem = items[userIdx % items.length]!;
    const shopperId = `shopper-flash-${userIdx + 1}`;

    const payload = {
      items: [{ productId: targetItem.id, quantity: 1 }],
      shippingAddress: {
        fullName: `Flash Shopper ${userIdx + 1}`,
        phone: `987654${String(1000 + userIdx).slice(-4)}`,
        street: `${userIdx + 1} Commercial Street, Begumpet`,
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500016',
      },
      shippingMethod: 'standard' as const,
      paymentMethod: 'youpi' as const,
      userId: shopperId,
    };

    const req = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    return { targetItemId: targetItem.id, promise: handleCheckout(req) };
  });

  const responses = await Promise.all(requests.map((r) => r.promise));
  const responseData = await Promise.all(responses.map((r) => r.json()));

  // Track per-item statistics
  const itemStats: Record<
    string,
    { successful: number; outOfStock: number; errors: number; orderNos: Set<string> }
  > = {};

  items.forEach((item) => {
    itemStats[item.id] = { successful: 0, outOfStock: 0, errors: 0, orderNos: new Set() };
  });

  let totalSuccessful = 0;
  let totalOutOfStock = 0;
  let totalServer500 = 0;

  responses.forEach((res, i) => {
    const targetId = requests[i]!.targetItemId;
    const json = responseData[i];
    const stat = itemStats[targetId]!;

    if (res.status === 201 && json.success) {
      stat.successful++;
      totalSuccessful++;
      stat.orderNos.add(json.data.orderNo);
    } else if (res.status === 409 || json.error?.code === 'OUT_OF_STOCK') {
      stat.outOfStock++;
      totalOutOfStock++;
    } else {
      stat.errors++;
      if (res.status >= 500) {
        totalServer500++;
        console.error(`💥 500 Server error on request ${i + 1}:`, json);
      }
    }
  });

  console.log('----------------------------------------------------');
  console.log('📊 Flash Sale Reconciliation:');

  let allReconciled = true;
  let zeroNegative = true;
  let zeroDuplicateOrders = true;

  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    const initialStock = stockAllocations[i] ?? 0;
    const updated = await productRepository.findById(item.id);
    const finalStock = updated?.stock ?? -999;
    const stats = itemStats[item.id]!;

    const reconciled = initialStock - stats.successful === finalStock;
    const noNegative = finalStock >= 0;
    const uniqueOrders = stats.orderNos.size === stats.successful;

    if (!reconciled) allReconciled = false;
    if (!noNegative) zeroNegative = false;
    if (!uniqueOrders) zeroDuplicateOrders = false;

    console.log(
      `   Item #${i + 1} (${item.sku}): ` +
        `Initial: ${initialStock} | Sold: ${stats.successful} | Rejected: ${stats.outOfStock} | Final Stock: ${finalStock} ` +
        `${reconciled && noNegative ? '✅ [RECONCILED]' : '❌ [MISMATCH]'}`
    );
  }

  console.log('\nAggregate Totals:');
  console.log(`   - Total Successful Purchases: ${totalSuccessful} (Expected: ${totalAvailableUnits})`);
  console.log(`   - Total Out-of-Stock Rejections: ${totalOutOfStock}`);
  console.log(`   - Total Server 500 Errors: ${totalServer500} (Expected: 0)`);
  console.log(`   - Zero Negative Stock: ${zeroNegative}`);
  console.log(`   - Zero Duplicate Orders: ${zeroDuplicateOrders}`);
  console.log(`   - 100% Inventory Reconciled: ${allReconciled}`);
  console.log('----------------------------------------------------\n');

  const passed =
    totalSuccessful === totalAvailableUnits &&
    totalServer500 === 0 &&
    zeroNegative &&
    zeroDuplicateOrders &&
    allReconciled;

  if (passed) {
    console.log('🎉 [PASS] EVAL-P7-01 Flash Sale Simulation PASSED perfectly with 0 oversell!\n');
  } else {
    console.error('💥 [FAIL] EVAL-P7-01 Flash Sale Simulation FAILED!\n');
  }

  return passed;
}

/**
 * Combined runner
 */
export async function runLoadTestStock(): Promise<boolean> {
  const test1 = await runSingleProductConcurrencyTest(20, 2);
  const test2 = await runMultiProductFlashSaleSimulation(50, 5);
  return test1 && test2;
}

if (require.main === module) {
  runLoadTestStock().then((success) => {
    process.exit(success ? 0 : 1);
  });
}
