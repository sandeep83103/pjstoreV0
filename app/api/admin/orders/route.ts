import { NextRequest, NextResponse } from 'next/server';
import { orderRepository } from '@/lib/data';
import { getAdminFromRequest } from '@/lib/auth/session';
import { handleApiError, UnauthorizedError } from '@/lib/errors';
import { OrderStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) {
      throw new UnauthorizedError('Administrative credentials required.');
    }

    const { searchParams } = req.nextUrl;
    const statusParam = searchParams.get('status');
    const search = searchParams.get('search')?.toLowerCase().trim();
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let orders = statusParam && statusParam !== 'ALL'
      ? await orderRepository.listByStatus(statusParam as OrderStatus, limit)
      : await orderRepository.listAll(limit);

    if (search) {
      orders = orders.filter((o) => {
        const matchesOrderNo = o.orderNo.toLowerCase().includes(search);
        const matchesCustomer = o.shippingAddress.fullName.toLowerCase().includes(search);
        const matchesPhone = o.shippingAddress.phone.includes(search);
        const matchesCity = o.shippingAddress.city.toLowerCase().includes(search);
        const matchesSku = o.items.some((i) => i.sku.toLowerCase().includes(search));
        return matchesOrderNo || matchesCustomer || matchesPhone || matchesCity || matchesSku;
      });
    }

    return NextResponse.json({
      success: true,
      data: orders,
      count: orders.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
