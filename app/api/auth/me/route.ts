import { NextResponse } from 'next/server';
import { getCurrentCustomer } from '@/lib/auth/session';
import { userRepository } from '@/lib/data';

export async function GET() {
  const session = await getCurrentCustomer();
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 }
    );
  }

  const user = await userRepository.findById(session.userId);
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'USER_NOT_FOUND', message: 'User record not found.' } },
      { status: 404 }
    );
  }

  const { passwordHash, ...safeUser } = user;
  return NextResponse.json({
    success: true,
    data: { user: safeUser },
  });
}
