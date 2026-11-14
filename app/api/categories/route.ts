import { NextResponse } from 'next/server';
import { categoryRepository } from '@/lib/data';
import { handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await categoryRepository.list();
    return NextResponse.json(
      {
        success: true,
        data: categories,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
