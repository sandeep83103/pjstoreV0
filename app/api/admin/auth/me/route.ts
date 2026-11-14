import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth/session';

export async function GET() {
  const session = await getCurrentAdmin();
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Admin authentication required.' } },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      admin: {
        userId: session.userId,
        email: session.email,
        role: session.role,
      },
    },
  });
}
