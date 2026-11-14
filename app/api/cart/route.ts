import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { productRepository, cartRepository, couponRepository } from '@/lib/data';
import { getCurrentCustomer, getCustomerFromRequest } from '@/lib/auth/session';
import { handleApiError } from '@/lib/errors';
import { CartItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

const CartItemInputSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().optional(),
  quantity: z.number().int().positive(),
  addedPrice: z.number().int().optional(),
});

const SyncCartPayloadSchema = z.object({
  items: z.array(CartItemInputSchema).default([]),
  couponCode: z.string().optional(),
  merge: z.boolean().default(false),
});

export interface EnrichedCartLineItem {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  mrp: number;
  name: string;
  sku: string;
  slug: string;
  imageKey: string;
  stock: number;
  available: boolean;
  adjusted?: boolean;
}

async function enrichAndClampItems(items: Array<{ productId: string; variantId?: string; quantity: number }>) {
  const enrichedItems: EnrichedCartLineItem[] = [];
  const adjustedItems: Array<{ productId: string; name: string; originalQty: number; adjustedQty: number }> = [];
  const removedItems: Array<{ productId: string; name: string; reason: string }> = [];

  for (const item of items) {
    const product = await productRepository.findById(item.productId);

    // Product not found or archived/deleted (EC-INV-05)
    if (!product || product.status !== 'ACTIVE') {
      removedItems.push({
        productId: item.productId,
        name: product?.name || 'Item',
        reason: 'Item is no longer available',
      });
      continue;
    }

    // Completely out of stock
    if (product.stock <= 0) {
      removedItems.push({
        productId: item.productId,
        name: product.name,
        reason: 'Item is currently out of stock',
      });
      continue;
    }

    // Quantity exceeds available inventory (EC-INV-04 / EVAL-P4-02)
    let finalQty = item.quantity;
    let adjusted = false;
    if (item.quantity > product.stock) {
      finalQty = product.stock;
      adjusted = true;
      adjustedItems.push({
        productId: product.id,
        name: product.name,
        originalQty: item.quantity,
        adjustedQty: finalQty,
      });
    }

    enrichedItems.push({
      productId: product.id,
      variantId: item.variantId,
      quantity: finalQty,
      price: product.price,
      mrp: product.mrp,
      name: product.name,
      sku: product.sku,
      slug: product.slug,
      imageKey: product.images[0] || '',
      stock: product.stock,
      available: true,
      adjusted,
    });
  }

  return { enrichedItems, adjustedItems, removedItems };
}

export async function GET(req: NextRequest) {
  try {
    const customer = (await getCustomerFromRequest(req)) || (await getCurrentCustomer());
    let rawItems: CartItem[] = [];
    let savedCoupon: string | undefined = undefined;

    if (customer) {
      const savedCart = await cartRepository.getCart(customer.userId);
      if (savedCart) {
        rawItems = savedCart.items;
        savedCoupon = savedCart.couponCode;
      }
    }

    const { searchParams } = new URL(req.url);
    const guestCartParam = searchParams.get('guestCart');
    if (!customer && guestCartParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(guestCartParam));
        if (Array.isArray(parsed.items)) {
          rawItems = parsed.items;
        }
        if (parsed.couponCode) {
          savedCoupon = parsed.couponCode;
        }
      } catch {
        // Ignore JSON parse errors from guest cart parameter
      }
    }

    const { enrichedItems, adjustedItems, removedItems } = await enrichAndClampItems(rawItems);
    const subtotal = enrichedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    // Coupon calculation
    let discount = 0;
    let validCouponCode: string | undefined = undefined;
    let couponMessage: string | undefined = undefined;

    if (savedCoupon) {
      const coupon = await couponRepository.findByCode(savedCoupon);
      if (coupon && coupon.active && subtotal >= coupon.minCart && coupon.usedCount < coupon.usageLimit) {
        validCouponCode = coupon.code;
        if (coupon.type === 'FLAT') {
          discount = Math.min(coupon.value, subtotal);
        } else if (coupon.type === 'PERCENTAGE') {
          discount = Math.round((subtotal * coupon.value) / 100);
          if (coupon.maxDiscount) {
            discount = Math.min(discount, coupon.maxDiscount);
          }
        }
      } else if (coupon && subtotal < coupon.minCart) {
        couponMessage = `Minimum order value of ₹${coupon.minCart.toLocaleString('en-IN')} required.`;
      }
    }

    const shippingFee = subtotal >= 1999 || subtotal === 0 ? 0 : 99;
    const total = Math.max(0, subtotal - discount + shippingFee);

    // If customer logged in and cart changed (items adjusted or removed), persist the update
    if (customer && (adjustedItems.length > 0 || removedItems.length > 0)) {
      await cartRepository.saveCart({
        id: customer.userId,
        items: enrichedItems.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
          addedPrice: i.price,
        })),
        couponCode: validCouponCode,
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        items: enrichedItems,
        subtotal,
        discount,
        shippingFee,
        total,
        couponCode: validCouponCode,
        couponMessage,
        adjustedItems,
        removedItems,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const customer = (await getCustomerFromRequest(req)) || (await getCurrentCustomer());
    const body = await req.json();
    const { items: newItems, couponCode, merge } = SyncCartPayloadSchema.parse(body);

    let itemsToProcess = [...newItems];

    // If merge flag is set and user is logged in, merge guest items with existing server items
    if (customer && merge) {
      const serverCart = await cartRepository.getCart(customer.userId);
      if (serverCart && serverCart.items.length > 0) {
        const itemMap = new Map<string, { productId: string; variantId?: string; quantity: number }>();

        // Add server items first
        for (const item of serverCart.items) {
          const key = `${item.productId}_${item.variantId || ''}`;
          itemMap.set(key, { ...item });
        }

        // Merge incoming guest items without duplication
        for (const item of newItems) {
          const key = `${item.productId}_${item.variantId || ''}`;
          if (itemMap.has(key)) {
            const existing = itemMap.get(key)!;
            existing.quantity = Math.max(existing.quantity, item.quantity);
          } else {
            itemMap.set(key, { ...item });
          }
        }

        itemsToProcess = Array.from(itemMap.values());
      }
    }

    const { enrichedItems, adjustedItems, removedItems } = await enrichAndClampItems(itemsToProcess);
    const subtotal = enrichedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    // Coupon calculation
    let discount = 0;
    let validCouponCode: string | undefined = undefined;
    let couponMessage: string | undefined = undefined;

    const couponToTest = couponCode;
    if (couponToTest) {
      const coupon = await couponRepository.findByCode(couponToTest);
      if (coupon && coupon.active && subtotal >= coupon.minCart && coupon.usedCount < coupon.usageLimit) {
        validCouponCode = coupon.code;
        if (coupon.type === 'FLAT') {
          discount = Math.min(coupon.value, subtotal);
        } else if (coupon.type === 'PERCENTAGE') {
          discount = Math.round((subtotal * coupon.value) / 100);
          if (coupon.maxDiscount) {
            discount = Math.min(discount, coupon.maxDiscount);
          }
        }
      } else if (coupon && subtotal < coupon.minCart) {
        couponMessage = `Minimum order value of ₹${coupon.minCart.toLocaleString('en-IN')} required.`;
      }
    }

    const shippingFee = subtotal >= 1999 || subtotal === 0 ? 0 : 99;
    const total = Math.max(0, subtotal - discount + shippingFee);

    // Persist to DynamoDB if user logged in
    if (customer) {
      await cartRepository.saveCart({
        id: customer.userId,
        items: enrichedItems.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
          addedPrice: i.price,
        })),
        couponCode: validCouponCode,
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        items: enrichedItems,
        subtotal,
        discount,
        shippingFee,
        total,
        couponCode: validCouponCode,
        couponMessage,
        adjustedItems,
        removedItems,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
