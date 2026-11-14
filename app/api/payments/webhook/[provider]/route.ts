import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { orderRepository, paymentRepository } from '@/lib/data';
import { getPaymentProvider } from '@/lib/payments';
import { createAndSaveInvoice } from '@/lib/invoices/generator';
import { sendOrderConfirmationEmail } from '@/lib/notifications/email';
import { sendOrderConfirmationWhatsApp } from '@/lib/notifications/whatsapp';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const rawBody = await req.text();
    const signature =
      req.headers.get('x-youpi-signature') ||
      req.headers.get('x-razorpay-signature') ||
      req.headers.get('x-webhook-signature');

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Missing webhook signature header' },
        { status: 401 }
      );
    }

    const providerInstance = getPaymentProvider(params.provider);
    const verification = await providerInstance.verifyWebhook(signature, rawBody);

    if (!verification.isValid) {
      return NextResponse.json(
        { success: false, error: 'Cryptographic signature verification failed' },
        { status: 401 }
      );
    }

    // Idempotency Guard (EC-PAY-03 & EVAL-P5-05)
    // Check if providerRef has already been recorded in parnika_payments
    const existingPayment = await paymentRepository.findByProviderRef(
      verification.providerRef
    );

    if (existingPayment) {
      return NextResponse.json(
        {
          success: true,
          message: 'Webhook payload already processed (Idempotent response)',
          providerRef: verification.providerRef,
          orderId: existingPayment.orderId,
          idempotent: true,
        },
        { status: 200 }
      );
    }

    // Locate matching order in DynamoDB / OrderRepository
    let order = verification.orderId
      ? await orderRepository.findById(verification.orderId)
      : null;

    if (!order && verification.orderNo) {
      order = await orderRepository.findByOrderNo(verification.orderNo);
    }

    const now = new Date().toISOString();

    if (order) {
      // Transition order status to PAID / PLACED
      const updatedOrder = await orderRepository.updateStatus(order.id, 'PLACED', 'PAID');

      // Record verified payment event in parnika_payments
      await paymentRepository.recordPaymentEvent({
        id: crypto.randomUUID(),
        orderId: order.id,
        provider: params.provider,
        providerRef: verification.providerRef,
        amount: verification.amount || order.total,
        status: 'PAID',
        rawWebhook: verification.rawPayload,
        verifiedAt: now,
        createdAt: now,
      });

      // Trigger Async Notifications (PDF Invoice, WhatsApp, Email) per architecture.md
      try {
        const { buffer } = await createAndSaveInvoice(updatedOrder);
        await Promise.allSettled([
          sendOrderConfirmationEmail(updatedOrder, buffer),
          sendOrderConfirmationWhatsApp(updatedOrder),
        ]);
      } catch (notifErr) {
        console.error('Webhook notification dispatch failed:', notifErr);
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Order payment verified and settled successfully.',
          orderId: order.id,
          orderNo: order.orderNo,
          status: 'PAID',
        },
        { status: 200 }
      );
    }

    // Unmatched Observer Notification (EC-PAY-02 & EVAL-P5-06)
    // When no matching order is found, store as unmatched payment for admin manual review
    const unmatchedRecord = await paymentRepository.recordPaymentEvent({
      id: crypto.randomUUID(),
      orderId: 'unmatched',
      provider: params.provider,
      providerRef: verification.providerRef,
      amount: verification.amount || 0,
      status: 'PARTIALLY_PAID_HOLD',
      rawWebhook: verification.rawPayload,
      verifiedAt: now,
      createdAt: now,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Unmatched observer notification recorded under Pending Review.',
        paymentId: unmatchedRecord.id,
        providerRef: verification.providerRef,
        unmatched: true,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Payment Webhook Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
