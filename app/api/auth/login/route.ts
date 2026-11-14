import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { userRepository } from '@/lib/data';
import { signToken, COOKIE_NAMES } from '@/lib/auth/jwt';
import { getCookieOptions } from '@/lib/auth/session';
import { comparePassword } from '@/lib/auth/password';
import crypto from 'crypto';

const loginSchema = z.object({
  phone: z.string().optional(),
  otp: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = loginSchema.parse(body);

    let user = null;

    // 1. Phone + OTP Login Path
    if (data.phone && data.otp) {
      // In dev / test, verify against test OTP "123456"
      if (data.otp !== '123456') {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_OTP', message: 'Invalid or expired OTP. Please try again.' } },
          { status: 400 }
        );
      }

      user = await userRepository.findByPhone(data.phone);
      if (!user) {
        // Auto-register new customer on verified OTP
        const now = new Date().toISOString();
        user = await userRepository.create({
          id: crypto.randomUUID(),
          name: `Customer ${data.phone.slice(-4)}`,
          phone: data.phone,
          role: 'customer',
          addresses: [],
          wishlist: [],
          createdAt: now,
          updatedAt: now,
        });
      }
    } 
    // 2. Email + Password Login Path
    else if (data.email && data.password) {
      user = await userRepository.findByEmail(data.email);
      if (!user || !user.passwordHash) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } },
          { status: 401 }
        );
      }

      const isMatch = await comparePassword(data.password, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Provide either phone & OTP or email & password.' } },
        { status: 400 }
      );
    }

    // Sign customer JWT (30-day session)
    const token = await signToken(
      {
        userId: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
      '30d'
    );

    // Set secure httpOnly cookie
    const cookieStore = cookies();
    cookieStore.set(COOKIE_NAMES.CUSTOMER, token, getCookieOptions(30));

    const { passwordHash, ...safeUser } = user;
    return NextResponse.json({
      success: true,
      data: {
        user: safeUser,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid login details.', details: error.flatten().fieldErrors } },
        { status: 422 }
      );
    }
    console.error('[AUTH_LOGIN_ERROR]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Login process failed.' } },
      { status: 500 }
    );
  }
}
