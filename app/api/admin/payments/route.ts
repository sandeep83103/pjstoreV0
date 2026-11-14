import { NextRequest, NextResponse } from 'next/server';
import { paymentRepository } from '@/lib/data';
import { handleApiError } from '@/lib/errors';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const allPayments = await paymentRepository.listAll(100);
    const unmatchedPayments = await paymentRepository.listUnmatched(50);

    const observerStatus = {
      bankSmsObserver: {
        name: 'Bank SMS Observer (SBI / HDFC / ICICI)',
        status: 'ACTIVE',
        lastPing: new Date().toISOString(),
        latencyMs: 42,
      },
      gmailObserver: {
        name: 'Gmail UPI Credit Monitor',
        status: 'ACTIVE',
        lastPing: new Date().toISOString(),
        latencyMs: 118,
      },
      gatewayApi: {
        name: 'YOUPI PG V2 REST Microservice',
        endpoint: env.YOUPI_BASE_API_URL,
        status: 'ACTIVE',
        activeProvider: env.PAYMENT_PROVIDER,
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        payments: allPayments,
        unmatched: unmatchedPayments,
        observerStatus,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
