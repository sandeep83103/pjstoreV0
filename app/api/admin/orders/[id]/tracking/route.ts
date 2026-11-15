import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { orderRepository, auditLogRepository } from '@/lib/data';
import { getAdminFromRequest } from '@/lib/auth/session';
import { handleApiError, NotFoundError, UnauthorizedError, ValidationError } from '@/lib/errors';
import { resolveCourierTrackingUrl, sendShippingUpdateWhatsApp } from '@/lib/notifications/whatsapp';
import { sendShippingNotificationEmail } from '@/lib/notifications/email';

export const dynamic = 'force-dynamic';

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
    const courier = body.courier?.trim();
    const trackingNumber = body.trackingNumber?.trim();

    if (!courier) {
      throw new ValidationError('Courier provider name is required (e.g. Delhivery, Shiprocket, Blue Dart)');
    }
    if (!trackingNumber) {
      throw new ValidationError('Tracking / AWB number is required');
    }

    const trackingUrl = resolveCourierTrackingUrl(courier, trackingNumber, body.trackingUrl);
    const shippedAt = new Date().toISOString();

    const trackingPayload = {
      courier,
      trackingNumber,
      trackingUrl,
      shippedAt,
    };

    // Update tracking details in repository
    let updatedOrder = await orderRepository.updateTracking(order.id, trackingPayload);

    // If order was in PLACED, PAID, or PACKED, advance status to SHIPPED
    if (['PLACED', 'PAID', 'PACKED'].includes(updatedOrder.orderStatus)) {
      updatedOrder = await orderRepository.updateStatus(order.id, 'SHIPPED');
    }

    // Record audit trail
    await auditLogRepository.record({
      id: crypto.randomUUID(),
      entityType: 'order',
      entityId: order.id,
      action: 'UPDATE',
      actorEmail: admin.email || 'admin@parnikajewellers.com',
      timestamp: shippedAt,
      diff: {
        tracking: trackingPayload,
        status: updatedOrder.orderStatus,
      },
    });

    // Trigger Automated Customer Alerts
    try {
      await Promise.allSettled([
        sendShippingNotificationEmail(updatedOrder),
        sendShippingUpdateWhatsApp(updatedOrder),
      ]);
    } catch (notifErr) {
      console.error('Failed to dispatch shipping notifications:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: `Tracking details saved for Order #${updatedOrder.orderNo}`,
      data: updatedOrder,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
