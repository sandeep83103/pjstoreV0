import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { productRepository, orderRepository, couponRepository, cartRepository } from '@/lib/data';
import { getCurrentCustomer, getCustomerFromRequest } from '@/lib/auth/session';
import { handleApiError, OutOfStockError, ValidationError, AppError } from '@/lib/errors';
import { Order, OrderItemSnapshot, Address } from '@/lib/types';
import { sendOrderConfirmationEmail } from '@/lib/notifications/email';
import { sendOrderConfirmationWhatsApp } from '@/lib/notifications/whatsapp';

export const dynamic = 'force-dynamic';

const CheckoutItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().optional(),
  quantity: z.number().int().positive(),
});

const CheckoutAddressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  street: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().length(6, 'Pincode must be 6 digits'),
});

const CheckoutPayloadSchema = z.object({
  items: z.array(CheckoutItemSchema).min(1, 'Cart cannot be empty'),
  shippingAddress: CheckoutAddressSchema,
  shippingMethod: z.enum(['standard', 'express']).default('standard'),
  paymentMethod: z.enum(['youpi', 'razorpay', 'cod']).default('youpi'),
  couponCode: z.string().optional(),
  userId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const customer = (await getCustomerFromRequest(req)) || (await getCurrentCustomer());
    const body = await req.json();
    const payload = CheckoutPayloadSchema.parse(body);

    const userId = customer?.userId || payload.userId || 'guest';

    // 1. Re-fetch canonical product data & verify current stock / active status
    const itemsSnapshot: OrderItemSnapshot[] = [];
    let subtotal = 0;

    for (const item of payload.items) {
      const product = await productRepository.findById(item.productId);
      if (!product || product.status !== 'ACTIVE') {
        throw new OutOfStockError(product?.name || 'One or more items in your cart just sold out');
      }

      if (product.stock < item.quantity) {
        throw new OutOfStockError(product.name);
      }

      itemsSnapshot.push({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        imageKey: product.images[0] || '',
        variantName: item.variantId ? `Variant ${item.variantId}` : undefined,
      });

      subtotal += product.price * item.quantity;
    }

    // 2. Coupon Validation & Discount Calculation
    let discount = 0;
    let appliedCouponCode: string | undefined = undefined;

    if (payload.couponCode && payload.couponCode.trim()) {
      const cleanCode = payload.couponCode.trim().toUpperCase();
      const coupon = await couponRepository.findByCode(cleanCode);

      if (!coupon || !coupon.active) {
        throw new ValidationError('Invalid or inactive coupon code.');
      }

      const now = new Date();
      if (now < new Date(coupon.validFrom) || now > new Date(coupon.validTo)) {
        throw new ValidationError('This coupon has expired.');
      }

      if (subtotal < coupon.minCart) {
        throw new ValidationError(
          `Minimum order value of ₹${coupon.minCart.toLocaleString('en-IN')} required.`
        );
      }

      if (coupon.usedCount >= coupon.usageLimit) {
        throw new AppError('COUPON_LIMIT_REACHED', 'Coupon limit reached.', 400);
      }

      if (userId !== 'guest' && coupon.perUserLimit) {
        const userOrders = await orderRepository.listByUser(userId, 50);
        const userUses = userOrders.filter(
          (o) => o.couponCode?.toUpperCase() === coupon.code.toUpperCase()
        ).length;
        if (userUses >= coupon.perUserLimit) {
          throw new ValidationError('Coupon usage limit reached for this account.');
        }
      }

      // Calculate discount amount
      if (coupon.type === 'FLAT') {
        discount = Math.min(coupon.value, subtotal);
      } else if (coupon.type === 'PERCENTAGE') {
        discount = Math.round((subtotal * coupon.value) / 100);
        if (coupon.maxDiscount && coupon.maxDiscount > 0) {
          discount = Math.min(discount, coupon.maxDiscount);
        }
      }

      appliedCouponCode = coupon.code;
    }

    // 3. Shipping fee calculation
    let shippingFee = 0;
    if (payload.shippingMethod === 'express') {
      shippingFee = 199;
    } else {
      // Standard: Free above ₹599, else ₹99
      shippingFee = subtotal >= 599 ? 0 : 99;
    }

    // 4. Canonical Total
    const total = Math.max(0, subtotal - discount + shippingFee);

    // 5. COD Ceiling Rule (EC-PAY-05)
    if (payload.paymentMethod === 'cod' && total > 10000) {
      throw new ValidationError(
        'Cash on Delivery is limited to orders up to ₹10,000. Please select Online Payment.'
      );
    }

    // 6. Status Determination
    let orderStatus: Order['orderStatus'] = 'PENDING_PAYMENT';
    let paymentStatus: Order['paymentStatus'] = 'PENDING';

    if (total === 0) {
      // 100% Discount / Free Order (EC-CPN-03)
      orderStatus = 'PLACED';
      paymentStatus = 'PAID';
    } else if (payload.paymentMethod === 'cod') {
      orderStatus = 'PLACED';
      paymentStatus = 'PENDING_COD';
    }

    const orderId = crypto.randomUUID();
    const orderNo = `PJ-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const shippingAddress: Address = {
      id: crypto.randomUUID(),
      fullName: payload.shippingAddress.fullName,
      phone: payload.shippingAddress.phone,
      street: payload.shippingAddress.street,
      city: payload.shippingAddress.city,
      state: payload.shippingAddress.state,
      pincode: payload.shippingAddress.pincode,
      isDefault: false,
    };

    const newOrder: Order = {
      id: orderId,
      orderNo,
      userId,
      items: itemsSnapshot,
      shippingAddress,
      subtotal,
      discount,
      shippingFee,
      tax: 0,
      total,
      couponCode: appliedCouponCode,
      paymentMethod: payload.paymentMethod,
      paymentStatus,
      orderStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 7. Atomic Concurrency Lock: Condition check + stock decrement + coupon lock + order record
    const createdOrder = await orderRepository.createOrderWithLock(newOrder);

    // 8. If logged in, clear user's persistent cart
    if (userId !== 'guest') {
      await cartRepository.clearCart(userId);
    }

    // 9. If COD order placed, trigger order confirmation alerts
    if (payload.paymentMethod === 'cod') {
      try {
        await Promise.allSettled([
          sendOrderConfirmationEmail(createdOrder),
          sendOrderConfirmationWhatsApp(createdOrder),
        ]);
      } catch (codNotifErr) {
        console.error('COD order confirmation dispatch failed:', codNotifErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: createdOrder,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
