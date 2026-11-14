import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { couponRepository, orderRepository } from '@/lib/data';
import { handleApiError } from '@/lib/errors';

const ValidateCouponSchema = z.object({
  code: z.string().min(2).max(30),
  cartSubtotal: z.number().int().min(0),
  userId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, cartSubtotal, userId } = ValidateCouponSchema.parse(body);

    const coupon = await couponRepository.findByCode(code);
    if (!coupon || !coupon.active) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_COUPON',
            message: 'Invalid or inactive coupon code.',
          },
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validTo = new Date(coupon.validTo);

    if (now < validFrom || now > validTo) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'COUPON_EXPIRED',
            message: 'This coupon has expired.',
          },
        },
        { status: 400 }
      );
    }

    if (cartSubtotal < coupon.minCart) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MIN_CART_VALUE',
            message: `Minimum order value of ₹${coupon.minCart.toLocaleString('en-IN')} required.`,
          },
        },
        { status: 400 }
      );
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'COUPON_LIMIT_REACHED',
            message: 'Coupon limit reached.',
          },
        },
        { status: 400 }
      );
    }

    if (userId && coupon.perUserLimit) {
      const userOrders = await orderRepository.listByUser(userId, 100);
      const usedByThisUser = userOrders.filter(
        (o) => o.couponCode?.toUpperCase() === coupon.code.toUpperCase()
      ).length;

      if (usedByThisUser >= coupon.perUserLimit) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'USER_LIMIT_REACHED',
              message: 'You have already reached the maximum usage limit for this coupon.',
            },
          },
          { status: 400 }
        );
      }
    }

    // Calculate discount amount
    let discount = 0;
    if (coupon.type === 'FLAT') {
      discount = Math.min(coupon.value, cartSubtotal);
    } else if (coupon.type === 'PERCENTAGE') {
      discount = Math.round((cartSubtotal * coupon.value) / 100);
      if (coupon.maxDiscount && coupon.maxDiscount > 0) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount,
        minCart: coupon.minCart,
        maxDiscount: coupon.maxDiscount,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
