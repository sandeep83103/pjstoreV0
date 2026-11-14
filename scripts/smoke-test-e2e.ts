import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import crypto from 'crypto';
import { NextRequest } from 'next/server';
import {
  productRepository,
  categoryRepository,
  couponRepository,
  orderRepository,
  paymentRepository,
} from '../lib/data';
import { POST as handleCheckout } from '../app/api/checkout/route';
import { POST as handleValidateCoupon } from '../app/api/coupons/validate/route';
import { POST as handleWebhook } from '../app/api/payments/webhook/[provider]/route';
import { GET as handleInvoiceDownload } from '../app/api/orders/[id]/invoice/route';
import { signToken, COOKIE_NAMES } from '../lib/auth/jwt';
import { env } from '../lib/env';
import { Product, Coupon } from '../lib/types';

/**
 * End-to-End Customer Buying Cycle Smoke Test (EVAL-P7-06)
 * Simulates:
 * Browse Catalog -> Filter Products -> View PDP -> Validate Coupon ->
 * Atomic Checkout -> Webhook Payment -> Order PAID -> GST Tax Invoice Download
 */
export async function runEndToEndSmokeTest(): Promise<boolean> {
  console.log('====================================================');
  console.log('🚀 RUNNING END-TO-END SMOKE TEST (EVAL-P7-06)');
  console.log('   Full Customer Buying Cycle Verification');
  console.log('====================================================\n');

  let passed = true;

  // Step 1: Browse Categories
  console.log('--- Step 1: Browse Categories ---');
  const categories = await categoryRepository.list();
  console.log(`✅ Loaded ${categories.length} categories from store`);
  if (categories.length === 0) {
    console.error('❌ Failed: No categories found');
    passed = false;
  }

  // Step 2: Seed / Fetch a Verified Product
  console.log('\n--- Step 2: Product Catalog & Detail View ---');
  const testProductId = crypto.randomUUID();
  const testProduct: Product = {
    id: testProductId,
    sku: `E2E-SMOKE-${crypto.randomUUID().slice(0, 4).toUpperCase()}`,
    supplierCode: 'DBI-E2E-SMOKE',
    name: 'Royal Heritage Temple Necklace & Jhumka Set',
    slug: `royal-heritage-temple-set-${testProductId.slice(0, 6)}`,
    categoryId: 'necklaces',
    tags: ['bridal', 'temple', 'one-gram-gold'],
    description: 'Exquisite handcrafted one-gram gold necklace with antique temple carvings and matching jhumkas.',
    specs: {
      'Base Metal': 'Copper Alloy',
      Plating: '24K Micro Gold',
      Polish: '1-Year Warranty',
      HSN: '7117',
    },
    price: 3500,
    mrp: 6500,
    costPrice: 1750,
    stock: 5,
    lowStockAt: 2,
    images: ['products/e2e/temple-necklace.webp'],
    variants: [],
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await productRepository.create(testProduct);
  const fetchedProduct = await productRepository.findBySlug(testProduct.slug);
  if (fetchedProduct && fetchedProduct.price === 3500 && fetchedProduct.stock === 5) {
    console.log(`✅ Verified Product Details by Slug: "${fetchedProduct.name}" (₹${fetchedProduct.price})`);
  } else {
    console.error('❌ Failed: Could not retrieve product by slug');
    passed = false;
  }

  // Step 3: Validate Coupon Code
  console.log('\n--- Step 3: Coupon Engine Validation ---');
  const couponCode = `E2E${Math.floor(100 + Math.random() * 900)}`;
  const testCoupon: Coupon = {
    code: couponCode,
    type: 'FLAT',
    value: 500,
    minCart: 2000,
    usageLimit: 10,
    perUserLimit: 1,
    usedCount: 0,
    validFrom: new Date(Date.now() - 3600000).toISOString(),
    validTo: new Date(Date.now() + 86400000).toISOString(),
    scope: 'ALL',
    active: true,
  };
  await couponRepository.create(testCoupon);

  const couponReq = new NextRequest('http://localhost:3000/api/coupons/validate', {
    method: 'POST',
    body: JSON.stringify({
      code: couponCode,
      cartSubtotal: 3500,
      userId: 'test-customer',
    }),
    headers: { 'Content-Type': 'application/json' },
  });

  const couponRes = await handleValidateCoupon(couponReq);
  const couponData = await couponRes.json();

  if (couponRes.status === 200 && couponData.success && couponData.data.discount === 500) {
    console.log(`✅ Coupon [${couponCode}] validated successfully: Flat ₹500 discount on ₹3,500 cart`);
  } else {
    console.error('❌ Failed: Coupon validation rejected unexpectedly:', couponData);
    passed = false;
  }

  // Step 4: Atomic Checkout Order Placement
  console.log('\n--- Step 4: Atomic Stock Reservation Checkout ---');
  const checkoutPayload = {
    items: [{ productId: testProductId, quantity: 1 }],
    shippingAddress: {
      fullName: 'Smt. Ananya Rao',
      phone: '9876543210',
      street: '12-A Lotus Enclave, Banjara Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500034',
    },
    shippingMethod: 'standard' as const,
    paymentMethod: 'youpi' as const,
    couponCode,
    userId: 'customer-ananya-rao',
  };

  const checkoutReq = new NextRequest('http://localhost:3000/api/checkout', {
    method: 'POST',
    body: JSON.stringify(checkoutPayload),
    headers: { 'Content-Type': 'application/json' },
  });

  const checkoutRes = await handleCheckout(checkoutReq);
  const checkoutData = await checkoutRes.json();

  if (checkoutRes.status !== 201 || !checkoutData.success) {
    console.error('❌ Checkout failed:', checkoutData);
    return false;
  }

  const createdOrder = checkoutData.data;
  console.log(
    `✅ Order Created: ${createdOrder.orderNo} | Status: ${createdOrder.orderStatus} | Total: ₹${createdOrder.total}`
  );

  // Verify stock was decremented from 5 to 4
  const postCheckoutProduct = await productRepository.findById(testProductId);
  if (postCheckoutProduct?.stock === 4) {
    console.log(`✅ Atomic stock reservation confirmed: Stock decremented from 5 to 4`);
  } else {
    console.error(`❌ Stock mismatch: Expected 4, got ${postCheckoutProduct?.stock}`);
    passed = false;
  }

  // Step 5: Webhook Payment Simulation
  console.log('\n--- Step 5: Payment Webhook Ingestion & State Transition ---');
  const providerRef = `UPI-TXN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const webhookBody = {
    providerRef,
    orderId: createdOrder.id,
    orderNo: createdOrder.orderNo,
    amount: createdOrder.total,
    status: 'SUCCESS',
    timestamp: new Date().toISOString(),
  };

  const rawJson = JSON.stringify(webhookBody);
  const signature = crypto
    .createHmac('sha256', env.YOUPI_WEBHOOK_SECRET || 'youpi_dev_webhook_secret_key_32_bytes')
    .update(rawJson)
    .digest('hex');

  const webhookReq = new NextRequest('http://localhost:3000/api/payments/webhook/youpi', {
    method: 'POST',
    body: rawJson,
    headers: {
      'Content-Type': 'application/json',
      'x-youpi-signature': signature,
    },
  });

  const webhookRes = await handleWebhook(webhookReq, { params: { provider: 'youpi' } });
  const webhookData = await webhookRes.json();

  if (webhookRes.status === 200 && webhookData.success) {
    console.log(`✅ Webhook processed successfully with verified HMAC-SHA256 signature`);
  } else {
    console.error('❌ Webhook processing failed:', webhookData);
    passed = false;
  }

  // Verify Order transitioned to PAID
  const updatedOrder = await orderRepository.findById(createdOrder.id);
  if (updatedOrder?.paymentStatus === 'PAID' && updatedOrder?.orderStatus === 'PLACED') {
    console.log(`✅ Order state verified: paymentStatus: PAID, orderStatus: PLACED`);
  } else {
    console.error(
      `❌ Order state mismatch: paymentStatus=${updatedOrder?.paymentStatus}, orderStatus=${updatedOrder?.orderStatus}`
    );
    passed = false;
  }

  // Step 6: GST PDF Tax Invoice Generation & Download
  console.log('\n--- Step 6: GST PDF Tax Invoice Verification ---');
  const customerToken = await signToken(
    { userId: createdOrder.userId, phone: '9876543210', role: 'customer' },
    '1h'
  );

  const invoiceReq = new NextRequest(
    `http://localhost:3000/api/orders/${createdOrder.id}/invoice`,
    {
      method: 'GET',
      headers: {
        cookie: `${COOKIE_NAMES.CUSTOMER}=${customerToken}`,
      },
    }
  );

  const invoiceRes = await handleInvoiceDownload(invoiceReq, {
    params: { id: createdOrder.id },
  });

  if (
    invoiceRes.status === 200 &&
    invoiceRes.headers.get('Content-Type')?.includes('application/pdf')
  ) {
    const pdfBytes = await invoiceRes.arrayBuffer();
    const isPdfHeader = Buffer.from(pdfBytes.slice(0, 4)).toString() === '%PDF';
    if (isPdfHeader && pdfBytes.byteLength > 1000) {
      console.log(
        `✅ GST Tax Invoice successfully generated and streamed (%PDF 1.4, size: ${pdfBytes.byteLength} bytes)`
      );
    } else {
      console.error('❌ Invoice buffer is not a valid PDF header');
      passed = false;
    }
  } else {
    console.error(`❌ Invoice endpoint returned status ${invoiceRes.status}`);
    passed = false;
  }

  console.log('\n----------------------------------------------------');
  if (passed) {
    console.log('🎉 [PASS] EVAL-P7-06: Complete Customer Buying Cycle Verified 100%!');
  } else {
    console.error('💥 [FAIL] EVAL-P7-06: Smoke test detected failures.');
  }
  console.log('----------------------------------------------------\n');

  return passed;
}

if (require.main === module) {
  runEndToEndSmokeTest().then((success) => {
    process.exit(success ? 0 : 1);
  });
}
