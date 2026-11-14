import { NextRequest, NextResponse } from 'next/server';
import { processCustomerErasure } from '@/lib/security/dpdp';
import { verifyToken, COOKIE_NAMES } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const adminToken = request.cookies.get(COOKIE_NAMES.ADMIN)?.value;
    if (!adminToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Administrative authentication required.',
          },
        },
        { status: 401 }
      );
    }

    const payload = await verifyToken(adminToken);
    if (!payload || (payload.role !== 'admin' && payload.role !== 'staff')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Administrative privileges required.',
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const phone = body.phone ? String(body.phone).trim() : undefined;
    const userId = body.userId ? String(body.userId).trim() : undefined;
    const reason = body.reason || 'Admin initiated statutory erasure';

    if (!userId && !phone) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Please provide either customer userId or phone number.',
          },
        },
        { status: 400 }
      );
    }

    const result = await processCustomerErasure({
      phone,
      userId,
      requestedBy: payload.email || 'admin@pjstore.com',
      reason,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: result.message,
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[Admin DPDP Erasure Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to process DPDP erasure.',
        },
      },
      { status: 500 }
    );
  }
}
