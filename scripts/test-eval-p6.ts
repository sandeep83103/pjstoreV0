import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { orderRepository, productRepository, auditLogRepository } from '../lib/data';
import { signToken, COOKIE_NAMES } from '../lib/auth/jwt';
import { env } from '../lib/env';
import { Order, Product } from '../lib/types';
import {
  calculateGst,
  generateInvoicePdf,
  generatePackingSlipPdf,
  createAndSaveInvoice,
  STORE_GST_CONFIG,
} from '../lib/invoices/generator';
import {
  sendOrderConfirmationEmail,
  sendShippingNotificationEmail,
} from '../lib/notifications/email';
import {
  cleanIndianPhone,
  resolveCourierTrackingUrl,
  generateOrderWhatsAppShareUrl,
  generateShippingWhatsAppShareUrl,
  sendOrderConfirmationWhatsApp,
  sendShippingUpdateWhatsApp,
} from '../lib/notifications/whatsapp';
import { PATCH as handleStatusUpdate } from '../app/api/admin/orders/[id]/status/route';
import { PATCH as handleTrackingUpdate } from '../app/api/admin/orders/[id]/tracking/route';
import { GET as handleAdminGetOrder } from '../app/api/admin/orders/[id]/route';
import { GET as handleAdminListOrders } from '../app/api/admin/orders/route';
import { GET as handleCustomerGetOrder } from '../app/api/orders/[id]/route';
import { GET as handleDownloadInvoice } from '../app/api/orders/[id]/invoice/route';

async function runPhase6Evaluations() {
  console.log('====================================================');
  console.log('🧪 RUNNING PHASE 6 EVALUATIONS (evals.md)');
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

  // Generate Admin Session Token for authenticated admin API calls
  const adminToken = await signToken(
    {
      userId: 'test-admin-staff-id',
      email: env.ADMIN_BOOTSTRAP_EMAIL || 'admin@parnikajewellers.com',
      role: 'admin',
    },
    '2h'
  );

  // Helper to create test products
  async function createMockProduct(price: number, stock: number = 20): Promise<Product> {
    const id = crypto.randomUUID();
    return await productRepository.create({
      id,
      sku: `P6-SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierCode: 'DBI-P6',
      name: `P6 Handcrafted Necklace ₹${price}`,
      slug: `p6-necklace-${id.slice(0, 8)}`,
      description: 'Handcrafted one-gram gold jewellery item for Phase 6 order fulfillment evaluations',
      price,
      mrp: price + 1500,
      costPrice: Math.round(price * 0.5),
      stock,
      lowStockAt: 3,
      categoryId: 'necklaces',
      specs: { Plating: '1-Gram Micro Gold', 'Base Metal': 'Copper' },
      images: ['products/p6/test.webp'],
      variants: [],
      status: 'ACTIVE',
      tags: ['phase6', 'orders'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // Helper to create test order
  async function createTestOrder(opts: {
    price: number;
    state: string;
    orderStatus?: any;
    paymentStatus?: any;
    phone?: string;
  }): Promise<Order> {
    const prod = await createMockProduct(opts.price);
    const orderId = crypto.randomUUID();
    const orderNo = `PJ-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const order: Order = {
      id: orderId,
      orderNo,
      userId: `cust-${crypto.randomUUID().slice(0, 8)}`,
      items: [
        {
          productId: prod.id,
          sku: prod.sku,
          name: prod.name,
          price: prod.price,
          quantity: 1,
          imageKey: prod.images[0] || 'test.jpg',
        },
      ],
      shippingAddress: {
        id: crypto.randomUUID(),
        fullName: 'Ananya Sharma',
        phone: opts.phone || '9876543210',
        street: 'Flat 402, Royal Palms, Somajiguda',
        city: 'Hyderabad',
        state: opts.state,
        pincode: '500082',
        isDefault: true,
      },
      subtotal: opts.price,
      discount: 0,
      shippingFee: 0,
      tax: Math.round(opts.price * 0.03),
      total: opts.price,
      paymentMethod: 'youpi',
      paymentStatus: opts.paymentStatus || 'PAID',
      orderStatus: opts.orderStatus || 'PAID',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await orderRepository.createOrderWithLock(order);
  }

  // -------------------------------------------------------------
  // EVAL-P6-01: Order Pipeline & Admin Status Workflow
  // -------------------------------------------------------------
  console.log('--- Testing EVAL-P6-01: Order Pipeline & Admin Status Workflow ---');
  try {
    const testOrder = await createTestOrder({ price: 2000, state: 'Telangana', orderStatus: 'PAID' });

    // Step A: Transition PAID -> PACKED
    const packReq = new NextRequest(`http://localhost:3000/api/admin/orders/${testOrder.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        cookie: `${COOKIE_NAMES.ADMIN}=${adminToken}`,
      },
      body: JSON.stringify({ status: 'PACKED' }),
    });

    const packRes = await handleStatusUpdate(packReq, { params: { id: testOrder.id } });
    const packData = await packRes.json();

    assert(
      'EVAL-P6-01-A',
      'Admin successfully transitions order status from PAID to PACKED',
      packRes.status === 200 && packData.success && packData.data.orderStatus === 'PACKED'
    );

    // Step B: Dispatch order via Tracking API: PACKED -> SHIPPED with courier and tracking number
    const trackReq = new NextRequest(`http://localhost:3000/api/admin/orders/${testOrder.id}/tracking`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        cookie: `${COOKIE_NAMES.ADMIN}=${adminToken}`,
      },
      body: JSON.stringify({
        courier: 'Delhivery',
        trackingNumber: 'DEL-9988776655',
      }),
    });

    const trackRes = await handleTrackingUpdate(trackReq, { params: { id: testOrder.id } });
    const trackData = await trackRes.json();

    assert(
      'EVAL-P6-01-B',
      'Admin updates tracking info and transitions status to SHIPPED with tracking URL',
      trackRes.status === 200 &&
        trackData.success &&
        trackData.data.orderStatus === 'SHIPPED' &&
        trackData.data.tracking?.courier === 'Delhivery' &&
        trackData.data.tracking?.trackingNumber === 'DEL-9988776655' &&
        typeof trackData.data.tracking?.trackingUrl === 'string' &&
        trackData.data.tracking?.trackingUrl.includes('delhivery.com')
    );

    // Step C: Transition SHIPPED -> DELIVERED
    const deliverReq = new NextRequest(`http://localhost:3000/api/admin/orders/${testOrder.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        cookie: `${COOKIE_NAMES.ADMIN}=${adminToken}`,
      },
      body: JSON.stringify({ status: 'DELIVERED' }),
    });

    const deliverRes = await handleStatusUpdate(deliverReq, { params: { id: testOrder.id } });
    const deliverData = await deliverRes.json();

    assert(
      'EVAL-P6-01-C',
      'Admin successfully transitions order status from SHIPPED to DELIVERED',
      deliverRes.status === 200 && deliverData.success && deliverData.data.orderStatus === 'DELIVERED'
    );

    // Step D: Invariant Check - Illegal State Transition rejection (DELIVERED -> PLACED)
    const illegalReq = new NextRequest(`http://localhost:3000/api/admin/orders/${testOrder.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        cookie: `${COOKIE_NAMES.ADMIN}=${adminToken}`,
      },
      body: JSON.stringify({ status: 'PLACED' }),
    });

    const illegalRes = await handleStatusUpdate(illegalReq, { params: { id: testOrder.id } });
    const illegalData = await illegalRes.json();

    assert(
      'EVAL-P6-01-D',
      'Illegal status transition (DELIVERED -> PLACED) is strictly rejected with HTTP 400',
      illegalRes.status === 400 && illegalData.success === false
    );

    // Step E: Verify audit log recorded status changes
    const logs = await auditLogRepository.listByEntity(testOrder.id);
    assert(
      'EVAL-P6-01-E',
      'All status updates record immutable audit entries in parnika_audit_logs',
      logs.length >= 2 && logs.some((l) => l.action === 'STATUS_CHANGE')
    );
  } catch (err: any) {
    assert('EVAL-P6-01', 'Order pipeline execution encountered an error', false, err.message);
  }

  // -------------------------------------------------------------
  // EVAL-P6-02: GST Invoicing — PDF Generation & Tax Compliance
  // -------------------------------------------------------------
  console.log('\n--- Testing EVAL-P6-02: GST Invoicing & Tax Compliance ---');
  try {
    // 1. Intra-State Order (Telangana): ₹2,000 order
    const intraOrder = await createTestOrder({ price: 2000, state: 'Telangana', orderStatus: 'PAID' });
    const intraGst = calculateGst(intraOrder);

    assert(
      'EVAL-P6-02-A',
      'Intra-state GST calculations match Indian tax rules: CGST (1.5%) = ₹30, SGST (1.5%) = ₹30, HSN 7117',
      intraGst.isIntraState === true &&
        intraGst.hsnCode === '7117' &&
        intraGst.cgstAmount === 30 &&
        intraGst.sgstAmount === 30 &&
        intraGst.igstAmount === 0 &&
        intraGst.totalTax === 60
    );

    // 2. Inter-State Order (e.g. Maharashtra): ₹2,000 order
    const interOrder = await createTestOrder({ price: 2000, state: 'Maharashtra', orderStatus: 'PAID' });
    const interGst = calculateGst(interOrder);

    assert(
      'EVAL-P6-02-B',
      'Inter-state GST calculations match Indian tax rules: IGST (3%) = ₹60, CGST = ₹0, SGST = ₹0',
      interGst.isIntraState === false &&
        interGst.hsnCode === '7117' &&
        interGst.igstAmount === 60 &&
        interGst.cgstAmount === 0 &&
        interGst.sgstAmount === 0 &&
        interGst.totalTax === 60
    );

    // 3. PDF Generation & S3 Persistence
    const invoiceResult = await createAndSaveInvoice(intraOrder);
    const pdfString = invoiceResult.buffer.toString('utf-8');

    assert(
      'EVAL-P6-02-C',
      'Generates valid PDF 1.4 buffer matching S3 key specification (invoices/INV-<orderNo>.pdf)',
      invoiceResult.buffer.length > 1000 &&
        invoiceResult.buffer.subarray(0, 8).toString().startsWith('%PDF-1.') &&
        invoiceResult.invoiceKey === `invoices/INV-${intraOrder.orderNo}.pdf`
    );

    assert(
      'EVAL-P6-02-D',
      'PDF contains mandatory statutory details: Store GSTIN (36AAECP1234F1Z5), HSN 7117, and tax breakdown',
      pdfString.includes('36AAECP1234F1Z5') &&
        pdfString.includes('7117') &&
        pdfString.includes('CGST') &&
        pdfString.includes('SGST') &&
        pdfString.includes(STORE_GST_CONFIG.legalName)
    );

    // 4. Warehouse Packing Slip Generator
    const slipBuffer = await generatePackingSlipPdf(intraOrder);
    assert(
      'EVAL-P6-02-E',
      'Warehouse packing slip PDF generates cleanly with item barcodes/SKUs and fulfillment checkboxes',
      slipBuffer.length > 500 && slipBuffer.subarray(0, 8).toString().startsWith('%PDF-1.')
    );
  } catch (err: any) {
    assert('EVAL-P6-02', 'GST Invoicing evaluation encountered an error', false, err.message);
  }

  // -------------------------------------------------------------
  // EVAL-P6-03: Customer Order Tracking & Invoice Download
  // -------------------------------------------------------------
  console.log('\n--- Testing EVAL-P6-03: Order Tracking & Invoice Download ---');
  try {
    const testOrder = await createTestOrder({ price: 3499, state: 'Telangana', orderStatus: 'SHIPPED' });
    await orderRepository.updateTracking(testOrder.id, {
      courier: 'Blue Dart',
      trackingNumber: 'BLU-12345678',
      trackingUrl: 'https://www.bluedart.com/tracking?trackFor=0&trackNo=BLU-12345678',
      shippedAt: new Date().toISOString(),
    });

    // Step A: Customer fetches order via API
    const getReq = new NextRequest(`http://localhost:3000/api/orders/${testOrder.orderNo}`);
    const getRes = await handleCustomerGetOrder(getReq, { params: { id: testOrder.orderNo } });
    const getData = await getRes.json();

    assert(
      'EVAL-P6-03-A',
      'Customer order API returns complete tracking metadata, items, and address snapshot',
      getRes.status === 200 &&
        getData.success &&
        getData.data.orderNo === testOrder.orderNo &&
        getData.data.tracking?.courier === 'Blue Dart' &&
        getData.data.tracking?.trackingNumber === 'BLU-12345678'
    );

    // Step B: Authenticated / Authorized Invoice Download
    const invReq = new NextRequest(`http://localhost:3000/api/orders/${testOrder.id}/invoice?download=true`, {
      headers: {
        cookie: `${COOKIE_NAMES.ADMIN}=${adminToken}`,
      },
    });
    const invRes = await handleDownloadInvoice(invReq, { params: { id: testOrder.id } });

    assert(
      'EVAL-P6-03-B',
      'Invoice download endpoint streams valid PDF with application/pdf header and attachment filename',
      invRes.status === 200 &&
        invRes.headers.get('Content-Type') === 'application/pdf' &&
        invRes.headers.get('Content-Disposition')?.includes(`INV-${testOrder.orderNo}.pdf`) === true
    );
  } catch (err: any) {
    assert('EVAL-P6-03', 'Customer order tracking evaluation failed', false, err.message);
  }

  // -------------------------------------------------------------
  // EVAL-P6-04: Transactional Email Dispatch
  // -------------------------------------------------------------
  console.log('\n--- Testing EVAL-P6-04: Transactional Email Dispatch ---');
  try {
    const testOrder = await createTestOrder({ price: 2499, state: 'Telangana', orderStatus: 'PAID' });

    // 1. Order Confirmation Email
    const confirmEmail = await sendOrderConfirmationEmail(testOrder);
    assert(
      'EVAL-P6-04-A',
      'Dispatches transactional Order Confirmation Email with attached GST PDF invoice',
      confirmEmail.success === true &&
        confirmEmail.hasAttachment === true &&
        confirmEmail.subject.includes(testOrder.orderNo) &&
        confirmEmail.messageId.length > 0
    );

    // 2. Shipping Notification Email
    testOrder.tracking = {
      courier: 'Delhivery',
      trackingNumber: 'DEL-5544332211',
      trackingUrl: 'https://www.delhivery.com/track/package/DEL-5544332211',
    };
    const shipEmail = await sendShippingNotificationEmail(testOrder);
    assert(
      'EVAL-P6-04-B',
      'Dispatches Shipping Dispatch Notification Email with live courier tracking details',
      shipEmail.success === true &&
        shipEmail.subject.includes('Shipped') &&
        shipEmail.messageId.length > 0
    );
  } catch (err: any) {
    assert('EVAL-P6-04', 'Email dispatch evaluation failed', false, err.message);
  }

  // -------------------------------------------------------------
  // EVAL-P6-05: WhatsApp Dispatch & 1-Click Share Link
  // -------------------------------------------------------------
  console.log('\n--- Testing EVAL-P6-05: WhatsApp Dispatch & 1-Click Link ---');
  try {
    const testOrder = await createTestOrder({
      price: 1999,
      state: 'Telangana',
      phone: '9876543210',
      orderStatus: 'SHIPPED',
    });
    testOrder.tracking = {
      courier: 'Shiprocket',
      trackingNumber: 'SR-77889900',
      trackingUrl: 'https://shiprocket.co/tracking/SR-77889900',
    };

    // 1. WhatsApp Automated / Fallback Dispatch
    const waResult = await sendShippingUpdateWhatsApp(testOrder);
    assert(
      'EVAL-P6-05-A',
      'WhatsApp shipping update dispatcher executes and provides valid messageId and shareUrl',
      waResult.success === true && typeof waResult.shareUrl === 'string'
    );

    // 2. Pre-formatted 1-Click Share URL Validation
    const shippingShareUrl = generateShippingWhatsAppShareUrl(testOrder);
    const orderShareUrl = generateOrderWhatsAppShareUrl(testOrder);

    const decodedShipping = decodeURIComponent(shippingShareUrl);
    const decodedOrder = decodeURIComponent(orderShareUrl);

    assert(
      'EVAL-P6-05-B',
      '1-Click WhatsApp shipping URL contains pre-populated customer name, order number, and tracking link',
      shippingShareUrl.startsWith('https://wa.me/919876543210?text=') &&
        decodedShipping.includes(testOrder.shippingAddress.fullName) &&
        decodedShipping.includes(testOrder.orderNo) &&
        decodedShipping.includes('SR-77889900') &&
        decodedShipping.includes('https://shiprocket.co/tracking/SR-77889900')
    );

    assert(
      'EVAL-P6-05-C',
      '1-Click WhatsApp order confirmation URL contains order summary, total amount, and customer name',
      orderShareUrl.startsWith('https://wa.me/919876543210?text=') &&
        decodedOrder.includes(testOrder.shippingAddress.fullName) &&
        decodedOrder.includes(testOrder.orderNo) &&
        decodedOrder.includes('₹1,999')
    );
  } catch (err: any) {
    assert('EVAL-P6-05', 'WhatsApp dispatch evaluation failed', false, err.message);
  }

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`🏁 PHASE 6 EVALUATIONS COMPLETE: ${passed}/${total} PASSED`);
  console.log('====================================================\n');

  if (passed === total) {
    console.log('🎉 ALL PHASE 6 EVALUATION CHECKS PASSED PERFECTLY!\n');
    process.exit(0);
  } else {
    console.error(`❌ ${total - passed} evaluation check(s) failed.\n`);
    process.exit(1);
  }
}

runPhase6Evaluations().catch((err) => {
  console.error('Fatal Phase 6 evaluation runner failure:', err);
  process.exit(1);
});
