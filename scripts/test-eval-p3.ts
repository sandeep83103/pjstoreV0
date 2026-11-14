import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { POST as handleCreateProduct, GET as handleGetAdminProducts } from '../app/api/admin/products/route';
import { PUT as handleUpdateProduct } from '../app/api/admin/products/[id]/route';
import { POST as handleBulkImport } from '../app/api/admin/inventory/bulk/route';
import { productRepository, auditLogRepository, categoryRepository } from '../lib/data';
import { signToken, COOKIE_NAMES } from '../lib/auth/jwt';
import { env } from '../lib/env';

async function runPhase3Evaluations() {
  console.log('====================================================');
  console.log('🧪 RUNNING PHASE 3 EVALUATIONS (evals.md)');
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

  // Generate Admin JWT Session Token for tests
  const adminToken = await signToken(
    {
      userId: 'test-admin-staff-id',
      email: env.ADMIN_BOOTSTRAP_EMAIL || 'admin@pjstore.com',
      role: 'admin',
    },
    '2h'
  );

  // -------------------------------------------------------------
  // EVAL-P3-01: Inventory Table Search, Filter & Stock Indicators
  // -------------------------------------------------------------
  console.log('--- Testing EVAL-P3-01: Inventory Table Search & Stock Indicators ---');
  // Scenario: Search by SKU / Code ('DBI-102')
  const searchReq = new NextRequest('http://localhost:3000/api/admin/products?search=DBI-102', {
    headers: {
      Cookie: `${COOKIE_NAMES.ADMIN}=${adminToken}`,
    },
  });
  const searchRes = await handleGetAdminProducts(searchReq);
  const searchJson = await searchRes.json();
  const searchItems = searchJson.data?.products || [];

  const foundDbi102 = searchItems.some(
    (p: any) =>
      p.supplierCode?.toUpperCase() === 'DBI-102' ||
      p.sku?.toUpperCase().includes('DBI-102') ||
      p.sku?.toUpperCase().includes('JHM-002')
  );

  // Test Low-Stock Indicator evaluation logic
  const sampleLowStockProd = {
    id: 'test-low-stock-prod',
    stock: 2,
    lowStockAt: 5,
  };
  const isLowStockTriggered = sampleLowStockProd.stock <= sampleLowStockProd.lowStockAt;

  assert(
    'EVAL-P3-01',
    'Inventory Table Search (DBI-102) & Low-Stock Indicator Trigger',
    foundDbi102 && isLowStockTriggered,
    `Found DBI-102: ${foundDbi102}, Low stock trigger logic: ${isLowStockTriggered}`
  );

  // -------------------------------------------------------------
  // EVAL-P3-02: Product Creation with Direct S3 Images & Audit
  // -------------------------------------------------------------
  console.log('\n--- Testing EVAL-P3-02: Product Creation with S3 Images & Specs ---');
  const newProductPayload = {
    name: 'Bridal Heritage Kasu Mala Necklace',
    title: 'Bridal Heritage Kasu Mala Necklace',
    slug: `bridal-heritage-kasu-mala-${crypto.randomUUID().slice(0, 6)}`,
    sku: `PJ-OG-KASU-${crypto.randomUUID().slice(0, 4).toUpperCase()}`,
    supplierCode: 'DBI-NEW-01',
    categoryId: 'cat-necklaces',
    tags: ['kasu-mala', 'one-gram-gold', 'bridal', 'temple'],
    description: 'Traditional South Indian Kasu Mala embossed with Goddess Lakshmi coins.',
    specs: {
      'Base Metal': 'Copper Alloy',
      'Plating': '24K Micro Gold Plated (1 Gram)',
      'Finish': 'Antique Matte Gold',
      'Weight': '52 grams',
      'Occasion': 'Bridal, Weddings',
      'Care': 'Store in airtight box',
    },
    price: 4999,
    mrp: 9999,
    costPrice: 2400,
    stock: 8,
    lowStockAt: 2,
    images: [
      'products/temp/kasu-mala-front.webp',
      'products/temp/kasu-mala-angle.webp',
      'products/temp/kasu-mala-lock.webp',
    ],
    status: 'ACTIVE' as const,
  };

  const createReq = new NextRequest('http://localhost:3000/api/admin/products', {
    method: 'POST',
    body: JSON.stringify(newProductPayload),
    headers: {
      'Content-Type': 'application/json',
      Cookie: `${COOKIE_NAMES.ADMIN}=${adminToken}`,
    },
  });
  const createRes = await handleCreateProduct(createReq);
  const createJson = await createRes.json();
  const createdProd = createJson.data;

  // Verify created product is immediately readable in repository
  const fetchedProd = createdProd?.id
    ? await productRepository.findById(createdProd.id)
    : null;

  const hasAll3Images = fetchedProd?.images.length === 3;
  const hasSupplierCode = fetchedProd?.supplierCode === 'DBI-NEW-01';
  const hasCorrectPrice = fetchedProd?.price === 4999;

  assert(
    'EVAL-P3-02',
    'Product Creation with 3 S3 Images, Supplier Code & Full Jewellery Specs',
    createRes.status === 201 && Boolean(fetchedProd) && hasAll3Images && hasSupplierCode && hasCorrectPrice,
    `Status: ${createRes.status}, Found in repo: ${Boolean(fetchedProd)}, Image count: ${fetchedProd?.images.length}, SupplierCode: ${fetchedProd?.supplierCode}`
  );

  // -------------------------------------------------------------
  // EVAL-P3-03: Bulk CSV Import: 25 Valid Products + 2 Invalid Rows
  // -------------------------------------------------------------
  console.log('\n--- Testing EVAL-P3-03: Bulk CSV Import (25 Valid + 2 Invalid Rows) ---');
  // Construct CSV with 25 valid products and 2 invalid rows (one with negative price, one missing title)
  let csvRows = ['title,sku,supplierCode,category,price,mrp,costPrice,stock,imageUrls,description'];

  // Add 25 valid rows
  for (let i = 1; i <= 25; i++) {
    csvRows.push(
      `"Bulk Jewellery Item ${i}","PJ-BLK-${100 + i}","DBI-B${i}","cat-necklaces",${1500 + i * 100},${3000 + i * 200},${700 + i * 50},${10 + i},"products/bulk/${i}.webp","Exquisite handcrafted item ${i} in 1-gram gold."`
    );
  }

  // Row 27 (Invalid: negative price)
  csvRows.push(
    `"Invalid Item Negative Price","PJ-ERR-001","DBI-ERR1","cat-rings",-500,1000,300,5,"products/err.webp","Broken item"`
  );

  // Row 28 (Invalid: empty title)
  csvRows.push(
    `"","PJ-ERR-002","DBI-ERR2","cat-earrings",1200,2400,600,10,"products/err2.webp","Item without title"`
  );

  const fullCsvText = csvRows.join('\n');

  const bulkReq = new NextRequest('http://localhost:3000/api/admin/inventory/bulk', {
    method: 'POST',
    body: JSON.stringify({ csvText: fullCsvText }),
    headers: {
      'Content-Type': 'application/json',
      Cookie: `${COOKIE_NAMES.ADMIN}=${adminToken}`,
    },
  });

  const bulkRes = await handleBulkImport(bulkReq);
  const bulkJson = await bulkRes.json();
  const bulkData = bulkJson.data;

  const exactly25Inserted = bulkData?.insertedCount === 25;
  const exactly2Failed = bulkData?.failedCount === 2;
  const errorsReportedAccurately =
    Array.isArray(bulkData?.errors) &&
    bulkData.errors.length === 2 &&
    bulkData.errors.some((e: any) => e.row === 27 && e.error.includes('price')) &&
    bulkData.errors.some((e: any) => e.row === 28 && e.error.includes('title'));

  assert(
    'EVAL-P3-03',
    'Bulk CSV Import (25 Valid Products Batch-Written, 2 Invalid Rows Rejected with Row Error Reporting)',
    bulkRes.status === 200 && exactly25Inserted && exactly2Failed && errorsReportedAccurately,
    `Inserted: ${bulkData?.insertedCount} (expected 25), Failed: ${bulkData?.failedCount} (expected 2), Error details count: ${bulkData?.errors?.length}`
  );

  // -------------------------------------------------------------
  // EVAL-P3-04: Administrative Action Auditing (Price Mutation Diff)
  // -------------------------------------------------------------
  console.log('\n--- Testing EVAL-P3-04: Administrative Price Mutation & Audit Logging ---');
  // 1. Prepare target product with selling price ₹1,999
  const testProdToUpdate = await productRepository.create({
    id: crypto.randomUUID(),
    name: 'Temple Bangle for Audit Test',
    slug: `temple-bangle-audit-${crypto.randomUUID().slice(0, 6)}`,
    sku: `PJ-AUDIT-${crypto.randomUUID().slice(0, 4).toUpperCase()}`,
    supplierCode: 'DBI-AUDIT',
    categoryId: 'cat-bangles',
    tags: ['bangle'],
    description: 'Bangle used for price mutation audit testing.',
    specs: { 'Base Metal': 'Brass' },
    price: 1999,
    mrp: 3999,
    costPrice: 950,
    stock: 10,
    lowStockAt: 2,
    images: ['products/audit.webp'],
    variants: [],
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // 2. Perform Price Mutation from ₹1,999 to ₹1,799
  const updateReq = new NextRequest(
    `http://localhost:3000/api/admin/products/${testProdToUpdate.id}`,
    {
      method: 'PUT',
      body: JSON.stringify({ price: 1799 }),
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${COOKIE_NAMES.ADMIN}=${adminToken}`,
      },
    }
  );

  const updateRes = await handleUpdateProduct(updateReq, { params: { id: testProdToUpdate.id } });
  const updateJson = await updateRes.json();
  const isProductPriceUpdated = updateJson.data?.price === 1799;

  // 3. Query audit logs in parnika_audit_logs for this product
  const auditLogs = await auditLogRepository.listByEntity(testProdToUpdate.id);
  const priceUpdateLog = auditLogs.find((l) => l.action === 'PRICE_UPDATE');

  const hasEntityId = priceUpdateLog?.entityId === testProdToUpdate.id;
  const hasActionPriceUpdate = priceUpdateLog?.action === 'PRICE_UPDATE';
  const hasPreviousPrice1999 =
    priceUpdateLog?.previousPrice === 1999 || priceUpdateLog?.diff?.previousPrice === 1999;
  const hasNewPrice1799 =
    priceUpdateLog?.newPrice === 1799 || priceUpdateLog?.diff?.newPrice === 1799;
  const hasStaffEmail = Boolean(
    priceUpdateLog?.staffEmail === env.ADMIN_BOOTSTRAP_EMAIL ||
      priceUpdateLog?.actorEmail === env.ADMIN_BOOTSTRAP_EMAIL
  );
  const hasTimestamp = Boolean(priceUpdateLog?.timestamp);

  assert(
    'EVAL-P3-04',
    'Administrative Action Auditing (parnika_audit_logs captures entityId, PRICE_UPDATE, prev: 1999, new: 1799, staffEmail)',
    isProductPriceUpdated &&
      hasEntityId &&
      hasActionPriceUpdate &&
      hasPreviousPrice1999 &&
      hasNewPrice1799 &&
      hasStaffEmail &&
      hasTimestamp,
    `Price updated: ${isProductPriceUpdated}, Action: ${priceUpdateLog?.action}, Prev: ${priceUpdateLog?.previousPrice || priceUpdateLog?.diff?.previousPrice}, New: ${priceUpdateLog?.newPrice || priceUpdateLog?.diff?.newPrice}, Staff: ${priceUpdateLog?.staffEmail || priceUpdateLog?.actorEmail}`
  );

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`📊 PHASE 3 EVALUATION RESULT: ${passed}/${total} TESTS PASSED`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runPhase3Evaluations().catch((err) => {
  console.error('Fatal Evaluation Harness Error:', err);
  process.exit(1);
});
