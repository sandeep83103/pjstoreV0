import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { orderRepository } from '@/lib/data';
import { getPaymentProvider } from '@/lib/payments';
import { handleApiError, NotFoundError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

const CreatePaymentSessionSchema = z.object({
  orderId: z.string().uuid(),
  provider: z.enum(['youpi', 'razorpay', 'cod']).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, provider } = CreatePaymentSessionSchema.parse(body);

    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order', orderId);
    }

    const paymentProvider = getPaymentProvider(provider || order.paymentMethod);
    const session = await paymentProvider.createPayment(order);

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
