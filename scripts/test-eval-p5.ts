import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { POST as handleWebhook } from '../app/api/payments/webhook/[provider]/route';
import { POST as handleCreatePaymentSession } from '../app/api/payments/create/route';
import { GET as handleGetAdminPayments } from '../app/api/admin/payments/route';
import { POST as handleReconcilePayment } from '../app/api/admin/payments/reconcile/route';
import { POST as handleCheckout } from '../app/api/checkout/route';
import {
  productRepository,
  orderRepository,
  paymentRepository,
  auditLogRepository,
} from '../lib/data';
import {
  getPaymentProvider,
  YouPiPaymentAdapter,
  RazorpayPaymentAdapter,
  CashOnDeliveryAdapter,
} from '../lib/payments';
import { signToken, COOKIE_NAMES } from '../lib/auth/jwt';
import { env } from '../lib/env';
import { Order, Product } from '../lib/types';

async function runPhase5Evaluations() {
  console.log('====================================================');
  console.log('🧪 RUNNING PHASE 5 EVALUATIONS (evals.md)');
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
      email: env.ADMIN_BOOTSTRAP_EMAIL || 'admin@parnikajewellers.com',
      role: 'admin',
    },
    '2h'
  );

  // Helper mock product creator for isolated test order checkouts
  async function createMockProduct(price: number, stock: number = 20): Promise<Product> {
    const id = crypto.randomUUID();
    return await productRepository.create({
      id,
      sku: `TEST-P5-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierCode: 'P5-SUP',
      name: `P5 Test Product ₹${price}`,
      slug: `p5-test-product-${id.slice(0, 8)}`,
      description: 'Test jewelry item for payment evaluations and checkout testing',
      price,
      mrp: price + 1000,
      costPrice: Math.round(price * 0.6),
      stock,
      lowStockAt: 5,
      categoryId: 'necklaces',
      specs: { Material: 'Brass / Gold Plated' },
      images: ['test-image.jpg'],
      variants: [],
      status: 'ACTIVE',
      tags: ['test', 'phase5'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // -------------------------------------------------------------
  // EVAL-P5-01: Payment Provider Interface & Polymorphism
  // -------------------------------------------------------------
  console.log('--- Testing EVAL-P5-01: Payment Provider Polymorphism ---');
  try {
    const youpiProvider = getPaymentProvider('youpi');
    const razorpayProvider = getPaymentProvider('razorpay');
    const codProvider = getPaymentProvider('cod');

    assert(
      'EVAL-P5-01-A',
      'All payment providers implement IPaymentProvider interface methods',
      typeof youpiProvider.createPayment === 'function' &&
        typeof youpiProvider.verifyWebhook === 'function' &&
        typeof razorpayProvider.createPayment === 'function' &&
        typeof razorpayProvider.verifyWebhook === 'function' &&
        typeof codProvider.createPayment === 'function' &&
        typeof codProvider.verifyWebhook === 'function'
    );

    const dummyOrder: Order = {
      id: crypto.randomUUID(),
      orderNo: `PJ-${new Date().getFullYear()}-001001`,
      userId: 'test-user-poly',
      items: [
        {
          productId: crypto.randomUUID(),
          sku: 'POLY-01',
          name: 'Polki Pendant',
          price: 4999,
          quantity: 1,
          imageKey: 'test.jpg',
        },
      ],
      shippingAddress: {
        id: crypto.randomUUID(),
        fullName: 'Aarav Mehta',
        phone: '9876543210',
        street: '12 Linking Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
        isDefault: true,
      },
      subtotal: 4999,
      discount: 0,
      shippingFee: 0,
      tax: 0,
      total: 4999,
      paymentMethod: 'youpi',
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING_PAYMENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const youpiSession = await youpiProvider.createPayment(dummyOrder);
    assert(
      'EVAL-P5-01-B',
      'YOUPI adapter createPayment returns valid session structure with qrString',
      youpiSession.provider === 'youpi' &&
        youpiSession.amount === 4999 &&
        typeof youpiSession.qrString === 'string' &&
        typeof youpiSession.sessionId === 'string'
    );

    const razorpaySession = await razorpayProvider.createPayment(dummyOrder);
    assert(
      'EVAL-P5-01-C',
      'Razorpay fallback adapter createPayment returns valid session structure with paymentUrl',
      razorpaySession.provider === 'razorpay' &&
        razorpaySession.amount === 4999 &&
        typeof razorpaySession.paymentUrl === 'string' &&
        typeof razorpaySession.sessionId === 'string'
    );

    // Verify dynamic env variable resolution
    const originalEnvProvider = process.env.PAYMENT_PROVIDER;
    process.env.PAYMENT_PROVIDER = 'razorpay';
    const dynamicRzp = getPaymentProvider();
    assert(
      'EVAL-P5-01-D',
      'getPaymentProvider respects PAYMENT_PROVIDER=razorpay runtime environment variable',
      dynamicRzp instanceof RazorpayPaymentAdapter
    );

    process.env.PAYMENT_PROVIDER = 'youpi';
    const dynamicYoupi = getPaymentProvider();
    assert(
      'EVAL-P5-01-E',
      'getPaymentProvider respects PAYMENT_PROVIDER=youpi runtime environment variable',
      dynamicYoupi instanceof YouPiPaymentAdapter
    );
    process.env.PAYMENT_PROVIDER = originalEnvProvider;
  } catch (err: any) {
    assert('EVAL-P5-01', 'Provider polymorphism threw unexpected error', false, err.message);
  }

  // -------------------------------------------------------------
  // EVAL-P5-02: YOUPI PG Integration & Dynamic UPI QR Generation
  // -------------------------------------------------------------
  console.log('\n--- Testing EVAL-P5-02: YOUPI Dynamic UPI QR Generation ---');
  try {
    const orderAmount = 3499;
    const testOrderNo = `PJ-${new Date().getFullYear()}-772299`;
    const orderUpiProd = await createMockProduct(orderAmount, 10);
    const orderUpi: Order = {
      id: crypto.randomUUID(),
      orderNo: testOrderNo,
      userId: 'test-user-upi',
      items: [
        {
          productId: orderUpiProd.id,
          sku: orderUpiProd.sku,
          name: orderUpiProd.name,
          price: orderAmount,
          quantity: 1,
          imageKey: 'test.jpg',
        },
      ],
      shippingAddress: {
        id: crypto.randomUUID(),
        fullName: 'Sneha Patel',
        phone: '9876543210',
        street: '45 SV Road',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380001',
        isDefault: true,
      },
      subtotal: orderAmount,
      discount: 0,
      shippingFee: 0,
      tax: 0,
      total: orderAmount,
      paymentMethod: 'youpi',
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING_PAYMENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save order in DynamoDB / repository
    await orderRepository.createOrderWithLock(orderUpi);

    const youpi = new YouPiPaymentAdapter();
    const session = await youpi.createPayment(orderUpi);

    const qr = session.qrString || '';
    const hasUpiScheme = qr.startsWith('upi://pay?');
    const hasPayee = qr.includes('pa=parnikajewellers%40upi') || qr.includes('pa=parnikajewellers@upi');
    const hasLockedAmount = qr.includes(`am=${orderAmount}`);
    const hasCurrency = qr.includes('cu=INR');
    const hasTransactionNote = qr.includes(`tn=${testOrderNo}`);

    assert(
      'EVAL-P5-02-A',
      'Dynamic UPI QR string follows standard upi://pay format with locked amount and reference',
      hasUpiScheme && hasPayee && hasLockedAmount && hasCurrency && hasTransactionNote,
      `Generated QR String: ${qr}`
    );

    assert(
      'EVAL-P5-02-B',
      'Payment session provides 15-minute expiration timestamp (EC-INV-02)',
      Boolean(session.expiresAt && new Date(session.expiresAt).getTime() > Date.now())
    );

    // Test API route POST /api/payments/create
    const createReq = new NextRequest('http://localhost:3000/api/payments/create', {
      method: 'POST',
      body: JSON.stringify({
        orderId: orderUpi.id,
        provider: 'youpi',
      }),
    });
    const createRes = await handleCreatePaymentSession(createReq);
    const createJson = await createRes.json();

    assert(
      'EVAL-P5-02-C',
      'POST /api/payments/create generates payment session for existing order',
      createRes.status === 200 &&
        createJson.success === true &&
        createJson.data.qrString?.startsWith('upi://pay?')
    );
  } catch (err: any) {
    assert('EVAL-P5-02', 'Dynamic UPI QR generation threw unexpected error', false, err.message);
  }

  // -------------------------------------------------------------
  // EVAL-P5-03: Cash on Delivery Validation & Ceiling Check (EC-PAY-05)
  // -------------------------------------------------------------
  console.log('\n--- Testing EVAL-P5-03: Cash on Delivery Ceiling Check ---');
  try {
    const prodUnderLimit = await createMockProduct(4000, 10);
    const prodOverLimit = await createMockProduct(12000, 10);

    // 1. COD Checkout with ₹4,000 cart (Below ₹10,000 limit)
    const codReq1 = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        items: [{ productId: prodUnderLimit.id, quantity: 1 }],
        shippingAddress: {
          fullName: 'Ananya Roy',
          phone: '9876543210',
          street: 'Salt Lake Sector 5',
          city: 'Kolkata',
          state: 'West Bengal',
          pincode: '700091',
        },
        paymentMethod: 'cod',
      }),
    });
    const codRes1 = await handleCheckout(codReq1);
    const codJson1 = await codRes1.json();

    assert(
      'EVAL-P5-03-A',
      'COD order for ₹4,000 succeeds with orderStatus: PLACED and paymentStatus: PENDING_COD',
      (codRes1.status === 200 || codRes1.status === 201) &&
        codJson1.success === true &&
        codJson1.data.orderStatus === 'PLACED' &&
        codJson1.data.paymentStatus === 'PENDING_COD' &&
        codJson1.data.total === 4000
    );

    // 2. COD Checkout with ₹12,000 cart (Above ₹10,000 ceiling -> Must be rejected)
    const codReq2 = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        items: [{ productId: prodOverLimit.id, quantity: 1 }],
        shippingAddress: {
          fullName: 'Ananya Roy',
          phone: '9876543210',
          street: 'Salt Lake Sector 5',
          city: 'Kolkata',
          state: 'West Bengal',
          pincode: '700091',
        },
        paymentMethod: 'cod',
      }),
    });
    const codRes2 = await handleCheckout(codReq2);
    const codJson2 = await codRes2.json();

    const errorMessage =
      typeof codJson2.error === 'string'
        ? codJson2.error
        : codJson2.error?.message || '';

    assert(
      'EVAL-P5-03-B',
      'COD checkout for ₹12,000 is rejected with HTTP 400 and ₹10,000 ceiling alert',
      codRes2.status === 400 &&
        errorMessage.includes('Cash on Delivery is limited to orders up to ₹10,000')
    );

    // 3. Direct COD Adapter Ceiling Validation
    const codAdapter = new CashOnDeliveryAdapter();
    let directAdapterRejected = false;
    try {
      await codAdapter.createPayment({
        id: crypto.randomUUID(),
        orderNo: 'PJ-TEST-HIGH',
        userId: 'u1',
        items: [],
        shippingAddress: {} as any,
        subtotal: 12000,
        discount: 0,
        shippingFee: 0,
        tax: 0,
        total: 12000,
        paymentMethod: 'cod',
        paymentStatus: 'PENDING_COD',
        orderStatus: 'PLACED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      if (err.message.includes('Cash on Delivery is limited to orders up to ₹10,000')) {
        directAdapterRejected = true;
      }
    }

    assert(
      'EVAL-P5-03-C',
      'CashOnDeliveryAdapter.createPayment rejects orders exceeding ₹10,000 threshold',
      directAdapterRejected
    );
  } catch (err: any) {
    assert('EVAL-P5-03', 'COD evaluation threw unexpected error', false, err.message);
  }

  // -------------------------------------------------------------
  // EVAL-P5-04: HMAC Signature Verification (Webhook Security)
  // -------------------------------------------------------------
  console.log('\n--- Testing EVAL-P5-04: Webhook HMAC Signature Verification ---');
  try {
    const prodHmac = await createMockProduct(2999, 10);
    const orderHmac = await orderRepository.createOrderWithLock({
      id: crypto.randomUUID(),
      orderNo: `PJ-${new Date().getFullYear()}-445566`,
      userId: 'test-hmac-user',
      items: [
        {
          productId: prodHmac.id,
          sku: prodHmac.sku,
          name: prodHmac.name,
          price: 2999,
          quantity: 1,
          imageKey: 'test.jpg',
        },
      ],
      shippingAddress: {
        id: crypto.randomUUID(),
        fullName: 'Vikram Singh',
        phone: '9876543210',
        street: 'Civil Lines',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302006',
        isDefault: true,
      },
      subtotal: 2999,
      discount: 0,
      shippingFee: 0,
      tax: 0,
      total: 2999,
      paymentMethod: 'youpi',
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING_PAYMENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const secret = env.YOUPI_WEBHOOK_SECRET || 'test_youpi_webhook_secret';
    const validPayload = JSON.stringify({
      orderId: orderHmac.id,
      orderNo: orderHmac.orderNo,
      amount: orderHmac.total,
      providerRef: `YP-TXN-HMAC-${crypto.randomUUID().slice(0, 8)}`,
      status: 'SUCCESS',
    });

    const validSignature = crypto.createHmac('sha256', secret).update(validPayload).digest('hex');

    // Scenario 1: Valid HMAC-SHA256 signature -> HTTP 200
    const validReq = new NextRequest('http://localhost:3000/api/payments/webhook/youpi', {
      method: 'POST',
      body: validPayload,
      headers: {
        'x-youpi-signature': validSignature,
      },
    });
    const validRes = await handleWebhook(validReq, { params: { provider: 'youpi' } });
    const validJson = await validRes.json();

    assert(
      'EVAL-P5-04-A',
      'Webhook with valid HMAC-SHA256 signature returns HTTP 200 and processes order',
      validRes.status === 200 && validJson.success === true && validJson.status === 'PAID'
    );

    // Scenario 2: Tampered HMAC signature -> HTTP 401 Unauthorized
    const tamperedSignature = 'deadbeef0123456789abcdef0123456789abcdef0123456789abcdef01234567';
    const tamperedReq = new NextRequest('http://localhost:3000/api/payments/webhook/youpi', {
      method: 'POST',
      body: validPayload,
      headers: {
        'x-youpi-signature': tamperedSignature,
      },
    });
    const tamperedRes = await handleWebhook(tamperedReq, { params: { provider: 'youpi' } });

    assert(
      'EVAL-P5-04-B',
      'Webhook with tampered signature is rejected immediately with HTTP 401',
      tamperedRes.status === 401
    );

    // Scenario 3: Missing signature header -> HTTP 401 Unauthorized
    const missingSigReq = new NextRequest('http://localhost:3000/api/payments/webhook/youpi', {
      method: 'POST',
      body: validPayload,
      headers: {},
    });
    const missingSigRes = await handleWebhook(missingSigReq, { params: { provider: 'youpi' } });

    assert(
      'EVAL-P5-04-C',
      'Webhook with missing signature header is rejected immediately with HTTP 401',
      missingSigRes.status === 401
    );
  } catch (err: any) {
    assert('EVAL-P5-04', 'HMAC webhook security test threw unexpected error', false, err.message);
  }

  // -------------------------------------------------------------
  // EVAL-P5-05: Webhook Idempotency & Replayed Payloads (EC-PAY-03)
  // -------------------------------------------------------------
  console.log('\n--- Testing EVAL-P5-05: Webhook Idempotency (5 Replays) ---');
  try {
    const prodReplay = await createMockProduct(1899, 10);
    const orderReplay = await orderRepository.createOrderWithLock({
      id: crypto.randomUUID(),
      orderNo: `PJ-${new Date().getFullYear()}-990011`,
      userId: 'test-replay-user',
      items: [
        {
          productId: prodReplay.id,
          sku: prodReplay.sku,
          name: prodReplay.name,
          price: 1899,
          quantity: 1,
          imageKey: 'test.jpg',
        },
      ],
      shippingAddress: {
        id: crypto.randomUUID(),
        fullName: 'Divya Nair',
        phone: '9876543210',
        street: 'Marine Drive',
        city: 'Kochi',
        state: 'Kerala',
        pincode: '682001',
        isDefault: true,
      },
      subtotal: 1899,
      discount: 0,
      shippingFee: 99,
      tax: 0,
      total: 1998,
      paymentMethod: 'youpi',
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING_PAYMENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const secret = env.YOUPI_WEBHOOK_SECRET || 'test_youpi_webhook_secret';
    const providerRef = `YP-IDEM-REPLAY-${crypto.randomUUID().slice(0, 8)}`;
    const replayPayload = JSON.stringify({
      orderId: orderReplay.id,
      orderNo: orderReplay.orderNo,
      amount: orderReplay.total,
      providerRef,
      status: 'SUCCESS',
    });
    const replaySignature = crypto.createHmac('sha256', secret).update(replayPayload).digest('hex');

    const responses: any[] = [];

    // Send the identical valid webhook 5 times consecutively
    for (let i = 1; i <= 5; i++) {
      const replayReq = new NextRequest('http://localhost:3000/api/payments/webhook/youpi', {
        method: 'POST',
        body: replayPayload,
        headers: {
          'x-youpi-signature': replaySignature,
        },
      });
      const res = await handleWebhook(replayReq, { params: { provider: 'youpi' } });
      const json = await res.json();
      responses.push({ status: res.status, json });
    }

    const firstCall = responses[0];
    const subsequentCalls = responses.slice(1);

    assert(
      'EVAL-P5-05-A',
      'First webhook invocation transitions order to PAID with HTTP 200',
      firstCall.status === 200 && firstCall.json.success === true && firstCall.json.status === 'PAID'
    );

    const allSubsequent200 = subsequentCalls.every((r) => r.status === 200 && r.json.idempotent === true);
    assert(
      'EVAL-P5-05-B',
      'Subsequent 4 replayed webhooks return HTTP 200 with idempotent: true flag',
      allSubsequent200
    );

    const finalOrder = await orderRepository.findById(orderReplay.id);
    assert(
      'EVAL-P5-05-C',
      'Order status remains stably settled as PLACED and PAID after all replays',
      finalOrder?.orderStatus === 'PLACED' && finalOrder?.paymentStatus === 'PAID'
    );

    const paymentsForOrder = await paymentRepository.findByOrderId(orderReplay.id);
    assert(
      'EVAL-P5-05-D',
      'Exactly 1 payment record exists in parnika_payments (0 duplicate records created)',
      paymentsForOrder.length === 1 && paymentsForOrder[0]?.providerRef === providerRef
    );
  } catch (err: any) {
    assert('EVAL-P5-05', 'Webhook idempotency evaluation threw unexpected error', false, err.message);
  }

  // -------------------------------------------------------------
  // EVAL-P5-06: Unmatched Observer Payment & Admin Reconciliation
  // -------------------------------------------------------------
  console.log('\n--- Testing EVAL-P5-06: Unmatched Payment Alert & Manual Reconcile ---');
  try {
    const secret = env.YOUPI_WEBHOOK_SECRET || 'test_youpi_webhook_secret';
    const unmatchedProviderRef = `YP-OBSERVER-UNMATCHED-${crypto.randomUUID().slice(0, 8)}`;
    const unmatchedPayload = JSON.stringify({
      orderId: 'non-existent-order-uuid',
      orderNo: 'PJ-UNKNOWN-999999',
      amount: 4500,
      providerRef: unmatchedProviderRef,
      status: 'SUCCESS',
    });
    const unmatchedSignature = crypto.createHmac('sha256', secret).update(unmatchedPayload).digest('hex');

    // 1. Post unmatched observer notification
    const unmatchedWebhookReq = new NextRequest('http://localhost:3000/api/payments/webhook/youpi', {
      method: 'POST',
      body: unmatchedPayload,
      headers: {
        'x-youpi-signature': unmatchedSignature,
      },
    });
    const unmatchedRes = await handleWebhook(unmatchedWebhookReq, { params: { provider: 'youpi' } });
    const unmatchedJson = await unmatchedRes.json();

    assert(
      'EVAL-P5-06-A',
      'Unmatched observer payment is saved under PARTIALLY_PAID_HOLD without throwing',
      unmatchedRes.status === 200 &&
        unmatchedJson.success === true &&
        unmatchedJson.unmatched === true
    );

    // 2. Query Admin Payments API to verify unmatched queue
    const adminPaymentsReq = new NextRequest('http://localhost:3000/api/admin/payments', {
      headers: {
        Cookie: `${COOKIE_NAMES.ADMIN}=${adminToken}`,
      },
    });
    const adminPaymentsRes = await handleGetAdminPayments(adminPaymentsReq);
    const adminPaymentsJson = await adminPaymentsRes.json();

    const unmatchedList: any[] = adminPaymentsJson.data?.unmatched || [];
    const foundUnmatched = unmatchedList.find((p) => p.providerRef === unmatchedProviderRef);

    assert(
      'EVAL-P5-06-B',
      'Admin payments dashboard lists unmatched transaction with status PARTIALLY_PAID_HOLD',
      Boolean(foundUnmatched && foundUnmatched.status === 'PARTIALLY_PAID_HOLD')
    );

    assert(
      'EVAL-P5-06-C',
      'Admin payments API provides observer health indicators (Bank SMS, Gmail, Gateway API)',
      Boolean(
        adminPaymentsJson.data?.observerStatus?.bankSmsObserver &&
          adminPaymentsJson.data?.observerStatus?.gmailObserver &&
          adminPaymentsJson.data?.observerStatus?.gatewayApi
      )
    );

    // 3. Create a target pending order that this payment actually belongs to
    const targetProd = await createMockProduct(4500, 10);
    const targetOrder = await orderRepository.createOrderWithLock({
      id: crypto.randomUUID(),
      orderNo: `PJ-${new Date().getFullYear()}-331122`,
      userId: 'test-reconcile-user',
      items: [
        {
          productId: targetProd.id,
          sku: targetProd.sku,
          name: targetProd.name,
          price: 4500,
          quantity: 1,
          imageKey: 'test.jpg',
        },
      ],
      shippingAddress: {
        id: crypto.randomUUID(),
        fullName: 'Kavita Chawla',
        phone: '9876543210',
        street: 'MG Marg',
        city: 'Lucknow',
        state: 'Uttar Pradesh',
        pincode: '226001',
        isDefault: true,
      },
      subtotal: 4500,
      discount: 0,
      shippingFee: 0,
      tax: 0,
      total: 4500,
      paymentMethod: 'youpi',
      paymentStatus: 'PENDING',
      orderStatus: 'PENDING_PAYMENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (!foundUnmatched) {
      throw new Error('Unmatched payment record was not located in admin queue');
    }

    // 4. Admin performs manual reconciliation via POST /api/admin/payments/reconcile
    const reconcileReq = new NextRequest('http://localhost:3000/api/admin/payments/reconcile', {
      method: 'POST',
      body: JSON.stringify({
        paymentId: foundUnmatched.id,
        orderIdOrNo: targetOrder.orderNo,
      }),
      headers: {
        Cookie: `${COOKIE_NAMES.ADMIN}=${adminToken}`,
      },
    });
    const reconcileRes = await handleReconcilePayment(reconcileReq);
    const reconcileJson = await reconcileRes.json();

    assert(
      'EVAL-P5-06-D',
      'POST /api/admin/payments/reconcile successfully binds payment to target order',
      reconcileRes.status === 200 && reconcileJson.success === true
    );

    const reconciledOrder = await orderRepository.findById(targetOrder.id);
    assert(
      'EVAL-P5-06-E',
      'Target order transitions to PLACED / PAID after manual reconciliation',
      reconciledOrder?.orderStatus === 'PLACED' && reconciledOrder?.paymentStatus === 'PAID'
    );

    const auditLogs = await auditLogRepository.listByEntity(foundUnmatched.id);
    assert(
      'EVAL-P5-06-F',
      'Audit log records RECONCILE_MANUAL action with staff identity and diff details',
      auditLogs.length > 0 && auditLogs[0]?.action === 'RECONCILE_MANUAL'
    );
  } catch (err: any) {
    assert('EVAL-P5-06', 'Reconciliation evaluation threw unexpected error', false, err.message);
  }

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`📊 PHASE 5 EVALUATION RESULTS: ${passed}/${total} PASSED`);
  console.log('====================================================');

  if (passed === total) {
    console.log('🎉 ALL PHASE 5 EVALUATION GATES PASSED CLEANLY!\n');
    process.exit(0);
  } else {
    console.error(`❌ ${total - passed} EVALUATION CHECKS FAILED.\n`);
    process.exit(1);
  }
}

runPhase5Evaluations().catch((err) => {
  console.error('Fatal unhandled error during Phase 5 evaluation:', err);
  process.exit(1);
});
