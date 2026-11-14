import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { couponRepository, auditLogRepository } from '@/lib/data';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { verifyToken, COOKIE_NAMES } from '@/lib/auth/jwt';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

const UpdateCouponPayloadSchema = z.object({
  active: z.boolean().optional(),
  minCart: z.number().int().min(0).optional(),
  maxDiscount: z.number().int().min(0).optional(),
  usageLimit: z.number().int().min(1).optional(),
  perUserLimit: z.number().int().min(1).optional(),
  validTo: z.string().datetime().optional(),
});

async function getAdminEmail(req: NextRequest): Promise<string> {
  const token = req.cookies.get(COOKIE_NAMES.ADMIN)?.value;
  if (token) {
    const decoded = await verifyToken(token);
    if (decoded?.email) return decoded.email;
  }
  return env.ADMIN_BOOTSTRAP_EMAIL || 'admin@pjstore.com';
}

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const coupon = await couponRepository.findByCode(params.code);
    if (!coupon) {
      throw new NotFoundError('Coupon', params.code);
    }
    return NextResponse.json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const staffEmail = await getAdminEmail(req);
    const body = await req.json();
    const updates = UpdateCouponPayloadSchema.parse(body);

    const existing = await couponRepository.findByCode(params.code);
    if (!existing) {
      throw new NotFoundError('Coupon', params.code);
    }

    const updated = await couponRepository.update(params.code, updates);

    await auditLogRepository.record({
      id: crypto.randomUUID(),
      entityType: 'coupon',
      entityId: existing.code,
      action: 'UPDATE',
      actorEmail: staffEmail,
      staffEmail,
      timestamp: new Date().toISOString(),
      diff: { before: existing, after: updated },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const staffEmail = await getAdminEmail(req);
    const existing = await couponRepository.findByCode(params.code);
    if (!existing) {
      throw new NotFoundError('Coupon', params.code);
    }

    await couponRepository.delete(params.code);

    await auditLogRepository.record({
      id: crypto.randomUUID(),
      entityType: 'coupon',
      entityId: existing.code,
      action: 'DELETE',
      actorEmail: staffEmail,
      staffEmail,
      timestamp: new Date().toISOString(),
      diff: { deleted: existing },
    });

    return NextResponse.json({
      success: true,
      data: { message: `Coupon ${params.code} removed successfully.` },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
