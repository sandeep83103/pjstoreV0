import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { NextRequest } from 'next/server';
import { POST as handleUploadSign } from '../app/api/admin/uploads/sign/route';
import { GET as handleGetProducts } from '../app/api/products/route';
import { GET as handleGetProductById } from '../app/api/products/[id]/route';
import { productRepository, categoryRepository } from '../lib/data';
import { PROJECT_S3_BUCKET, getCloudFrontAssetUrl, getPresignedUploadUrl } from '../lib/aws/s3Client';
import {
  formatINR,
  calculateDiscountPercent,
  getWhatsAppEnquiryUrl,
  buildProductJsonLd,
} from '../lib/utils';
import { env } from '../lib/env';

async function runPhase2Evaluations() {
  console.log('====================================================');
  console.log('🧪 RUNNING PHASE 2 EVALUATIONS (evals.md)');
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

  // -------------------------------------------------------------
  // EVAL-P2-01: Media Pipeline: Pre-Signed S3 Upload Issuance
  // -------------------------------------------------------------
  console.log('--- Testing EVAL-P2-01: Pre-Signed Upload Route Validation ---');

  // Payload 1: Valid image/jpeg (2MB)
  const validPayload = {
    filename: 'bridal-necklace.jpg',
    contentType: 'image/jpeg',
    fileSize: 2 * 1024 * 1024,
    productId: '11111111-1111-4111-8111-111111111111',
  };
  const req1 = new NextRequest('http://localhost:3000/api/admin/uploads/sign', {
    method: 'POST',
    body: JSON.stringify(validPayload),
    headers: { 'Content-Type': 'application/json' },
  });
  const res1 = await handleUploadSign(req1);
  const json1 = await res1.json();

  const isRes1Valid =
    res1.status === 200 &&
    json1.success === true &&
    typeof json1.data?.uploadUrl === 'string' &&
    json1.data?.uploadUrl.includes('parnika-jewellers-v0-prod') &&
    json1.data?.key.includes('products/11111111-1111-4111-8111-111111111111');

  // Payload 2: Invalid MIME type application/pdf (2MB)
  const invalidMimePayload = {
    filename: 'document.pdf',
    contentType: 'application/pdf',
    fileSize: 2 * 1024 * 1024,
  };
  const req2 = new NextRequest('http://localhost:3000/api/admin/uploads/sign', {
    method: 'POST',
    body: JSON.stringify(invalidMimePayload),
    headers: { 'Content-Type': 'application/json' },
  });
  const res2 = await handleUploadSign(req2);
  const json2 = await res2.json();

  const isRes2Rejected =
    res2.status === 400 &&
    json2.success === false &&
    json2.error?.code === 'INVALID_FILE_TYPE';

  // Payload 3: Oversized image/png (15MB > 10MB)
  const oversizedPayload = {
    filename: 'heavy-photo.png',
    contentType: 'image/png',
    fileSize: 15 * 1024 * 1024,
  };
  const req3 = new NextRequest('http://localhost:3000/api/admin/uploads/sign', {
    method: 'POST',
    body: JSON.stringify(oversizedPayload),
    headers: { 'Content-Type': 'application/json' },
  });
  const res3 = await handleUploadSign(req3);
  const json3 = await res3.json();

  const isRes3Rejected =
    res3.status === 400 &&
    json3.success === false &&
    json3.error?.code === 'FILE_TOO_LARGE';

  assert(
    'EVAL-P2-01',
    'Pre-Signed S3 Upload Issuance & Strict MIME/Size Restrictions',
    isRes1Valid && isRes2Rejected && isRes3Rejected,
    `Res1 valid: ${isRes1Valid} (status ${res1.status}), Res2 rejected: ${isRes2Rejected} (status ${res2.status}), Res3 rejected: ${isRes3Rejected} (status ${res3.status})`
  );

  // -------------------------------------------------------------
  // EVAL-P2-02: Media Upload: Direct S3 Key & CloudFront Delivery
  // -------------------------------------------------------------
  console.log('\n--- Testing EVAL-P2-02: CloudFront Delivery URL Resolution ---');
  const sampleKey = 'products/sample-id/test-choker.webp';
  const cfUrl = getCloudFrontAssetUrl(sampleKey);
  const presignedUrl = await getPresignedUploadUrl(sampleKey, 'image/webp', 300);

  const isCfUrlValid =
    cfUrl === 'https://assets.parnikajewellers.com/products/sample-id/test-choker.webp' ||
    cfUrl === 'https://assets.pjstore.com/products/sample-id/test-choker.webp';
  const isPresignedValid =
    presignedUrl.includes(PROJECT_S3_BUCKET) &&
    presignedUrl.includes('X-Amz-Expires=300');

  assert(
    'EVAL-P2-02',
    'Direct S3 Upload Key Formulation & CloudFront CDN Resolution',
    isCfUrlValid && isPresignedValid && PROJECT_S3_BUCKET === 'parnika-jewellers-v0-prod',
    `CloudFront URL: ${cfUrl}, Presigned: ${presignedUrl.slice(0, 60)}...`
  );

  // -------------------------------------------------------------
  // EVAL-P2-03: Catalog Filters: Multi-Faceted Querying
  // -------------------------------------------------------------
  console.log('\n--- Testing EVAL-P2-03: Multi-Faceted Catalog Querying ---');
  // Scenario: /catalog?category=necklaces&minPrice=1000&maxPrice=5000&inStock=true
  const filterReq = new NextRequest(
    'http://localhost:3000/api/products?category=necklaces&minPrice=1000&maxPrice=5000&inStock=true'
  );
  const filterRes = await handleGetProducts(filterReq);
  const filterJson = await filterRes.json();
  const filteredProducts = filterJson.data?.products || [];

  const allNecklaces = filteredProducts.every(
    (p: any) =>
      p.categoryId === 'cat-necklaces' ||
      p.tags.includes('necklace') ||
      p.tags.includes('necklaces')
  );
  const allInPriceRange = filteredProducts.every(
    (p: any) => p.price >= 1000 && p.price <= 5000
  );
  const allInStock = filteredProducts.every((p: any) => p.stock > 0);
  const countMatchesExpected = filteredProducts.length === 2; // 'one-gram-gold-necklace' (₹3499, stock: 12) & 'kundan-floral-choker' (₹2199, stock: 7)

  assert(
    'EVAL-P2-03',
    'Multi-Faceted Querying (Category: Necklaces, ₹1k–₹5k, In-Stock Only)',
    allNecklaces && allInPriceRange && allInStock && countMatchesExpected,
    `Items returned: ${filteredProducts.length}, All Necklaces: ${allNecklaces}, All ₹1k-₹5k: ${allInPriceRange}, All In-Stock: ${allInStock}`
  );

  // -------------------------------------------------------------
  // EVAL-P2-04: PDP Presentation: Pricing, Specs & Gallery Zoom
  // -------------------------------------------------------------
  console.log('\n--- Testing EVAL-P2-04: Product Detail Presentation & Calculations ---');
  const pdpProduct = await productRepository.findBySlug('one-gram-gold-necklace');
  const foundPdp = Boolean(pdpProduct);

  const discountCalculated = pdpProduct
    ? calculateDiscountPercent(pdpProduct.mrp, pdpProduct.price)
    : 0;
  const isDiscountAccurate = discountCalculated === 50; // (6999 - 3499) / 6999 ~ 50%
  const hasRequiredSpecs = Boolean(
    pdpProduct?.specs['Base Metal'] &&
      pdpProduct?.specs['Plating'] &&
      pdpProduct?.specs['Product Code']
  );
  const hasGalleryImages = Boolean(pdpProduct && pdpProduct.images.length >= 2);

  assert(
    'EVAL-P2-04',
    'PDP Presentation: Pricing, Specs & Gallery Calculations',
    foundPdp && isDiscountAccurate && hasRequiredSpecs && hasGalleryImages,
    `Product found: ${foundPdp}, Discount: ${discountCalculated}% (expected 50%), Has Specs: ${hasRequiredSpecs}, Gallery count: ${pdpProduct?.images.length}`
  );

  // -------------------------------------------------------------
  // EVAL-P2-05: WhatsApp Integration: Pre-Filled Enquiry CTA
  // -------------------------------------------------------------
  console.log('\n--- Testing EVAL-P2-05: Pre-Filled WhatsApp Enquiry CTA ---');
  const sampleProduct = {
    name: 'Bridal Set & Jhumka (1 "Gram")',
    sku: 'PJ-OG-BRD-TEST',
    price: 3499,
    slug: 'one-gram-gold-necklace',
  };
  const waUrl = getWhatsAppEnquiryUrl(sampleProduct, 'https://pjstore.com');
  const urlObj = new URL(waUrl);
  const phone = urlObj.pathname.replace(/^\//, '');
  const rawText = urlObj.searchParams.get('text') || '';

  const cleanStoreNumber = env.WHATSAPP_STORE_NUMBER.replace(/\D/g, '');
  const hasTargetPhone = phone === cleanStoreNumber;
  const containsName = rawText.includes('Bridal Set & Jhumka (1 "Gram")');
  const containsSku = rawText.includes('PJ-OG-BRD-TEST');
  const containsPrice = rawText.includes('₹3,499');
  const containsLink = rawText.includes('https://pjstore.com/product/one-gram-gold-necklace');

  assert(
    'EVAL-P2-05',
    'Pre-Filled WhatsApp Enquiry CTA (Strict Encoding & Special Char Resilience EC-UX-01)',
    hasTargetPhone && containsName && containsSku && containsPrice && containsLink,
    `Phone: ${phone}, Text contains all fields without truncation: ${containsName && containsSku && containsPrice && containsLink}`
  );

  // -------------------------------------------------------------
  // EVAL-P2-06: SEO & Structured Data Schema Validation
  // -------------------------------------------------------------
  console.log('\n--- Testing EVAL-P2-06: Structured Data Schema.org/Product Validation ---');
  if (pdpProduct) {
    const jsonLd = buildProductJsonLd(pdpProduct, 'https://pjstore.com');

    const hasContext = jsonLd['@context'] === 'https://schema.org';
    const isProductType = jsonLd['@type'] === 'Product';
    const hasName = jsonLd.name === pdpProduct.name;
    const hasSku = jsonLd.sku === pdpProduct.sku;
    const hasImage = Array.isArray(jsonLd.image) && jsonLd.image.length > 0;
    const hasOffers =
      jsonLd.offers?.['@type'] === 'Offer' &&
      jsonLd.offers?.priceCurrency === 'INR' &&
      jsonLd.offers?.price === pdpProduct.price &&
      jsonLd.offers?.availability === 'https://schema.org/InStock';

    assert(
      'EVAL-P2-06',
      'SEO Structured Data Schema.org/Product Validation (Rich Results Ready)',
      hasContext && isProductType && hasName && hasSku && hasImage && hasOffers,
      `Context: ${hasContext}, Type: ${isProductType}, Offers valid: ${hasOffers}`
    );
  } else {
    assert('EVAL-P2-06', 'SEO Structured Data Schema.org/Product Validation', false, 'pdpProduct was not found');
  }

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`📊 PHASE 2 EVALUATION RESULT: ${passed}/${total} TESTS PASSED`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runPhase2Evaluations().catch((err) => {
  console.error('Fatal Evaluation Harness Error:', err);
  process.exit(1);
});
