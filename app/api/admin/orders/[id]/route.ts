import { NextRequest, NextResponse } from 'next/server';
import { orderRepository, paymentRepository, auditLogRepository } from '@/lib/data';
import { getAdminFromRequest } from '@/lib/auth/session';
import { handleApiError, NotFoundError, UnauthorizedError } from '@/lib/errors';
import { generateShippingWhatsAppShareUrl, generateOrderWhatsAppShareUrl } from '@/lib/notifications/whatsapp';

export const dynamic = 'force-dynamic';

export async function GET(
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

    // Fetch related payment events if any
    const payments = await paymentRepository.findByOrderId(order.id);

    // Fetch audit history for this order
    const auditLogs = await auditLogRepository.listByEntity(order.id);

    // 1-Click WhatsApp links for staff
    const whatsappOrderUrl = generateOrderWhatsAppShareUrl(order);
    const whatsappShippingUrl = generateShippingWhatsAppShareUrl(order);

    return NextResponse.json({
      success: true,
      data: {
        order,
        payments,
        auditLogs,
        actions: {
          whatsappOrderUrl,
          whatsappShippingUrl,
          invoiceDownloadUrl: `/api/orders/${order.id}/invoice`,
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
