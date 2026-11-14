import { NextResponse } from 'next/server';
import { z } from 'zod';

const requestOtpSchema = z.object({
  phone: z.string().min(10, 'Valid 10-digit mobile number required').max(14),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone } = requestOtpSchema.parse(body);

    // In production, dispatch OTP via SMS Gateway / WhatsApp Cloud API.
    // In dev / test environment, simulate OTP "123456"
    const otp = process.env.NODE_ENV === 'production' ? Math.floor(100000 + Math.random() * 900000).toString() : '123456';

    console.log(`[AUTH] Generated OTP for ${phone}: ${otp}`);

    return NextResponse.json({
      success: true,
      data: {
        message: 'OTP sent successfully to your mobile number.',
        // Dev aid for testing:
        ...(process.env.NODE_ENV !== 'production' ? { devOtp: otp } : {}),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid phone number.', details: error.flatten().fieldErrors } },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to dispatch OTP.' } },
      { status: 500 }
    );
  }
}
