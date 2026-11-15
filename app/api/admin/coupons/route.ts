import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { couponRepository, auditLogRepository } from '@/lib/data';
import { Coupon, CouponSchema } from '@/lib/types';
import { handleApiError, ValidationError } from '@/lib/errors';
import { verifyToken, COOKIE_NAMES } from '@/lib/auth/jwt';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

const CreateCouponPayloadSchema = z.object({
  code: z.string().min(3).max(30).toUpperCase(),
  type: z.enum(['PERCENTAGE', 'FLAT']),
  value: z.number().int().positive(),
  minCart: z.number().int().min(0).default(0),
  maxDiscount: z.number().int().min(0).optional(),
  usageLimit: z.number().int().min(1).default(100),
  perUserLimit: z.number().int().min(1).default(1),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional(),
  scope: z.enum(['ALL', 'CATEGORY', 'PRODUCT']).default('ALL'),
  active: z.boolean().default(true),
});

async function getAdminEmail(req: NextRequest): Promise<string> {
  const token = req.cookies.get(COOKIE_NAMES.ADMIN)?.value;
  if (token) {
    const decoded = await verifyToken(token);
    if (decoded?.email) return decoded.email;
  }
  return env.ADMIN_BOOTSTRAP_EMAIL || 'admin@parnikajewellers.com';
}

export async function GET() {
  try {
    const coupons = await couponRepository.listAll();
    return NextResponse.json({
      success: true,
      data: coupons,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const staffEmail = await getAdminEmail(req);
    const body = await req.json();
    const parsed = CreateCouponPayloadSchema.parse(body);

    const existing = await couponRepository.findByCode(parsed.code);
    if (existing) {
      throw new ValidationError(`Coupon with code '${parsed.code}' already exists.`);
    }

    const now = new Date();
    const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    const coupon: Coupon = {
      code: parsed.code.toUpperCase(),
      type: parsed.type,
      value: parsed.value,
      minCart: parsed.minCart,
      ...(parsed.maxDiscount !== undefined ? { maxDiscount: parsed.maxDiscount } : {}),
      usageLimit: parsed.usageLimit,
      perUserLimit: parsed.perUserLimit,
      usedCount: 0,
      validFrom: parsed.validFrom || now.toISOString(),
      validTo: parsed.validTo || oneYearLater.toISOString(),
      scope: parsed.scope,
      active: parsed.active,
    };

    const validated = CouponSchema.parse(coupon);
    const created = await couponRepository.create(validated);

    // Audit log
    await auditLogRepository.record({
      id: crypto.randomUUID(),
      entityType: 'coupon',
      entityId: created.code,
      action: 'CREATE',
      actorEmail: staffEmail,
      staffEmail,
      timestamp: new Date().toISOString(),
      diff: { created },
    });

    return NextResponse.json(
      {
        success: true,
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
