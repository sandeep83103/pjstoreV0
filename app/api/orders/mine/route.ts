import { NextRequest, NextResponse } from 'next/server';
import { orderRepository } from '@/lib/data';
import { getCustomerFromRequest, getCurrentCustomer } from '@/lib/auth/session';
import { handleApiError, UnauthorizedError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const customer = (await getCustomerFromRequest(req)) || (await getCurrentCustomer());

    if (!customer) {
      // Guest or unauthenticated customer might provide phone query parameter for lookup
      const phone = req.nextUrl.searchParams.get('phone');
      if (phone) {
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const allOrders = await orderRepository.listAll(100);
        const matched = allOrders.filter(
          (o) => o.shippingAddress.phone.replace(/[^0-9]/g, '') === cleanPhone
        );
        return NextResponse.json({
          success: true,
          data: matched,
        });
      }

      throw new UnauthorizedError('Please log in to view your order history.');
    }

    const orders = await orderRepository.listByUser(customer.userId, 50);

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
