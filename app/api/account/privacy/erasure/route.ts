import { NextRequest, NextResponse } from 'next/server';
import { processCustomerErasure, exportCustomerData } from '@/lib/security/dpdp';
import { verifyToken, COOKIE_NAMES } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const customerToken = request.cookies.get(COOKIE_NAMES.CUSTOMER)?.value;

    let userId: string | undefined;
    let requestedBy: string = 'customer-web';

    if (customerToken) {
      const payload = await verifyToken(customerToken);
      if (payload && payload.role === 'customer') {
        userId = payload.userId;
        requestedBy = `customer:${payload.email || payload.userId}`;
      }
    }

    const phone = body.phone ? String(body.phone).trim() : undefined;
    const reason = body.reason || 'Customer requested erasure under DPDP Act 2023';

    if (!userId && !phone) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Please provide your registered phone number or log in to submit a data erasure request.',
          },
        },
        { status: 400 }
      );
    }

    const result = await processCustomerErasure({
      phone,
      userId,
      requestedBy,
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

    const response = NextResponse.json({
      success: true,
      data: result,
    });

    // If customer was logged in, clear their session cookie
    if (customerToken) {
      response.cookies.delete(COOKIE_NAMES.CUSTOMER);
    }

    return response;
  } catch (error: any) {
    console.error('[API DPDP Erasure Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'An unexpected error occurred processing your data erasure request.',
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const customerToken = request.cookies.get(COOKIE_NAMES.CUSTOMER)?.value;
    if (!customerToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required to export your personal data.',
          },
        },
        { status: 401 }
      );
    }

    const payload = await verifyToken(customerToken);
    if (!payload?.userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid session.',
          },
        },
        { status: 401 }
      );
    }

    const exportData = await exportCustomerData(payload.userId);
    if (!exportData) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User profile not found.',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: exportData,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to export customer data.',
        },
      },
      { status: 500 }
    );
  }
}
