import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAMES, TokenPayload } from './jwt';

export async function getCurrentCustomer(): Promise<TokenPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAMES.CUSTOMER)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'customer') return null;
  return payload;
}

export async function getCurrentAdmin(): Promise<TokenPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAMES.ADMIN)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload || (payload.role !== 'admin' && payload.role !== 'staff')) return null;
  return payload;
}

export function getCookieOptions(days: number = 30) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: days * 24 * 60 * 60,
  };
}
