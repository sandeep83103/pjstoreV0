import { NextRequest, NextResponse } from 'next/server';
import { orderRepository } from '@/lib/data';
import { handleApiError, NotFoundError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let order = await orderRepository.findById(params.id);
    if (!order) {
      order = await orderRepository.findByOrderNo(params.id);
    }

    if (!order) {
      throw new NotFoundError('Order', params.id);
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
