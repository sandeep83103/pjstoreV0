import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAMES } from '@/lib/auth/jwt';

export async function POST() {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAMES.ADMIN, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return NextResponse.json({
    success: true,
    data: { message: 'Admin logged out successfully.' },
  });
}
