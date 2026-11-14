import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { env } from '@/lib/env';
import { signToken, COOKIE_NAMES } from '@/lib/auth/jwt';
import { getCookieOptions } from '@/lib/auth/session';
import { comparePassword, hashPassword } from '@/lib/auth/password';

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = adminLoginSchema.parse(body);

    const isEmailMatch = email.toLowerCase() === env.ADMIN_BOOTSTRAP_EMAIL.toLowerCase();

    // Check bootstrap password directly or via bcrypt compare
    let isPasswordMatch = false;
    if (isEmailMatch) {
      if (password === env.ADMIN_BOOTSTRAP_PASSWORD) {
        isPasswordMatch = true;
      } else {
        // In case bootstrap password was stored as a bcrypt hash
        try {
          isPasswordMatch = await comparePassword(password, env.ADMIN_BOOTSTRAP_PASSWORD);
        } catch {
          isPasswordMatch = false;
        }
      }
    }

    if (!isEmailMatch || !isPasswordMatch) {
      console.warn(`[ADMIN_AUTH] Failed login attempt for email: ${email}`);
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid administrative email or password.' } },
        { status: 401 }
      );
    }

    // Generate 8-hour admin session JWT
    const token = await signToken(
      {
        userId: 'admin-bootstrap-id',
        email: env.ADMIN_BOOTSTRAP_EMAIL,
        role: 'admin',
      },
      '8h'
    );

    // Set admin session cookie (8 hours = 28800 seconds)
    const cookieStore = cookies();
    cookieStore.set(COOKIE_NAMES.ADMIN, token, {
      ...getCookieOptions(1),
      maxAge: 8 * 60 * 60,
    });

    console.log(`[ADMIN_AUTH] Successful admin login for: ${email}`);

    return NextResponse.json({
      success: true,
      data: {
        admin: {
          email: env.ADMIN_BOOTSTRAP_EMAIL,
          role: 'admin',
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid payload.', details: error.flatten().fieldErrors } },
        { status: 422 }
      );
    }
    console.error('[ADMIN_AUTH_ERROR]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Admin authentication failed.' } },
      { status: 500 }
    );
  }
}
