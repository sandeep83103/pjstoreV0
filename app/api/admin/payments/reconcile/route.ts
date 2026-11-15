import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { paymentRepository, orderRepository, auditLogRepository } from '@/lib/data';
import { handleApiError, NotFoundError, ValidationError } from '@/lib/errors';
import { verifyToken, COOKIE_NAMES } from '@/lib/auth/jwt';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

const ReconcilePaymentSchema = z.object({
  paymentId: z.string().uuid(),
  orderIdOrNo: z.string().min(3),
});

async function getAdminEmail(req: NextRequest): Promise<string> {
  const token = req.cookies.get(COOKIE_NAMES.ADMIN)?.value;
  if (token) {
    const decoded = await verifyToken(token);
    if (decoded?.email) return decoded.email;
  }
  return env.ADMIN_BOOTSTRAP_EMAIL || 'admin@parnikajewellers.com';
}

export async function POST(req: NextRequest) {
  try {
    const staffEmail = await getAdminEmail(req);
    const body = await req.json();
    const { paymentId, orderIdOrNo } = ReconcilePaymentSchema.parse(body);

    const payment = await paymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundError('PaymentRecord', paymentId);
    }

    let order = await orderRepository.findById(orderIdOrNo);
    if (!order) {
      order = await orderRepository.findByOrderNo(orderIdOrNo);
    }

    if (!order) {
      throw new NotFoundError('Order', orderIdOrNo);
    }

    // 1. Update order status to PAID
    await orderRepository.updateStatus(order.id, 'PLACED', 'PAID');

    // 2. Update payment record to bind to this order
    const updatedPayment = {
      ...payment,
      orderId: order.id,
      status: 'PAID' as const,
    };
    await paymentRepository.recordPaymentEvent(updatedPayment);

    // 3. Audit Log
    await auditLogRepository.record({
      id: crypto.randomUUID(),
      entityType: 'payment',
      entityId: payment.id,
      action: 'RECONCILE_MANUAL',
      actorEmail: staffEmail,
      staffEmail,
      timestamp: new Date().toISOString(),
      diff: {
        paymentId,
        boundToOrder: order.orderNo,
        amount: payment.amount,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: `Payment ${payment.providerRef} successfully reconciled to order ${order.orderNo}.`,
        payment: updatedPayment,
        order,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
