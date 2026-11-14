import { SignJWT, jwtVerify } from 'jose';
import { env } from '../env';

const secretKey = new TextEncoder().encode(env.JWT_SECRET);

export const COOKIE_NAMES = {
  CUSTOMER: 'customer_session',
  ADMIN: 'admin_session',
} as const;

export interface TokenPayload {
  userId: string;
  email?: string;
  phone?: string;
  role: 'customer' | 'admin' | 'staff';
}

/**
 * Sign a stateless JWT token using jose (compatible with Node and Edge runtimes).
 */
export async function signToken(
  payload: TokenPayload,
  expiresIn: string = '30d'
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);
}

/**
 * Verify and decode a stateless JWT token.
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return {
      userId: payload.userId as string,
      email: payload.email as string | undefined,
      phone: payload.phone as string | undefined,
      role: payload.role as 'customer' | 'admin' | 'staff',
    };
  } catch (error) {
    return null;
  }
}
