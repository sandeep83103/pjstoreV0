import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { orderRepository, auditLogRepository } from '@/lib/data';
import { getAdminFromRequest } from '@/lib/auth/session';
import { handleApiError, NotFoundError, UnauthorizedError, ValidationError } from '@/lib/errors';
import { OrderStatus, PaymentStatus, OrderStatusEnum } from '@/lib/types';
import { sendShippingNotificationEmail, sendOrderConfirmationEmail } from '@/lib/notifications/email';
import { sendShippingUpdateWhatsApp, sendOrderConfirmationWhatsApp, resolveCourierTrackingUrl } from '@/lib/notifications/whatsapp';
import { createAndSaveInvoice } from '@/lib/invoices/generator';

export const dynamic = 'force-dynamic';

const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['PLACED', 'CANCELLED'],
  PLACED: ['PAID', 'PACKED', 'CANCELLED'],
  PAID: ['PACKED', 'CANCELLED', 'REFUNDED'],
  PACKED: ['SHIPPED', 'CANCELLED', 'REFUNDED'],
  SHIPPED: ['DELIVERED', 'REFUNDED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) {
      throw new UnauthorizedError('Administrative credentials required.');
    }

    let order = await orderRepository.findById(params.id);
    if (!order) {
      order = await orderRepository.findByOrderNo(params.id);
    }

    if (!order) {
      throw new NotFoundError('Order', params.id);
    }

    const body = await req.json();
    const targetStatus = body.status as OrderStatus;
    const targetPaymentStatus = body.paymentStatus as PaymentStatus | undefined;
    const trackingInput = body.tracking;

    if (!targetStatus || !OrderStatusEnum.options.includes(targetStatus)) {
      throw new ValidationError(`Invalid order status: '${targetStatus}'`);
    }

    // Enforce state transition workflow rules
    const allowedNextStatuses = VALID_STATUS_TRANSITIONS[order.orderStatus] || [];
    if (order.orderStatus !== targetStatus && !allowedNextStatuses.includes(targetStatus)) {
      throw new ValidationError(
        `Illegal status transition: Cannot move order from '${order.orderStatus}' to '${targetStatus}'. Allowed: [${allowedNextStatuses.join(', ')}]`
      );
    }

    // If tracking info is provided during status update
    if (trackingInput) {
      const courier = trackingInput.courier || order.tracking?.courier;
      const trackingNumber = trackingInput.trackingNumber || order.tracking?.trackingNumber;
      const trackingUrl = resolveCourierTrackingUrl(
        courier,
        trackingNumber,
        trackingInput.trackingUrl || order.tracking?.trackingUrl
      );

      order = await orderRepository.updateTracking(order.id, {
        courier,
        trackingNumber,
        trackingUrl,
        shippedAt: targetStatus === 'SHIPPED' ? new Date().toISOString() : order.tracking?.shippedAt,
        deliveredAt: targetStatus === 'DELIVERED' ? new Date().toISOString() : order.tracking?.deliveredAt,
      });
    }

    const previousStatus = order.orderStatus;
    const updatedOrder = await orderRepository.updateStatus(
      order.id,
      targetStatus,
      targetPaymentStatus
    );

    // Record audit log
    await auditLogRepository.record({
      id: crypto.randomUUID(),
      entityType: 'order',
      entityId: order.id,
      action: 'STATUS_CHANGE',
      actorEmail: admin.email || 'admin@parnikajewellers.com',
      timestamp: new Date().toISOString(),
      diff: {
        previousStatus,
        newStatus: targetStatus,
        paymentStatus: targetPaymentStatus || updatedOrder.paymentStatus,
        tracking: updatedOrder.tracking,
      },
    });

    // Trigger Automated Customer Alerts
    if (targetStatus === 'SHIPPED') {
      try {
        await Promise.allSettled([
          sendShippingNotificationEmail(updatedOrder),
          sendShippingUpdateWhatsApp(updatedOrder),
        ]);
      } catch (alertErr) {
        console.error('Customer shipping dispatch alerts failed:', alertErr);
      }
    } else if (targetStatus === 'PAID') {
      try {
        // Ensure invoice is generated and saved
        const { buffer } = await createAndSaveInvoice(updatedOrder);
        await Promise.allSettled([
          sendOrderConfirmationEmail(updatedOrder, buffer),
          sendOrderConfirmationWhatsApp(updatedOrder),
        ]);
      } catch (invoiceErr) {
        console.error('Invoice generation or email confirmation alert failed:', invoiceErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Order #${updatedOrder.orderNo} status transitioned to ${targetStatus}`,
      data: updatedOrder,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
