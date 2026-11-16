import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getStorefrontContent, saveStorefrontContent } from '@/lib/content/storefront';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const content = await getStorefrontContent();
    return NextResponse.json({ success: true, content });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch storefront content' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid payload provided' },
        { status: 400 }
      );
    }

    const updated = await saveStorefrontContent(body);

    // Revalidate storefront pages instantly
    revalidatePath('/');
    revalidatePath('/(storefront)', 'layout');

    return NextResponse.json({
      success: true,
      message: 'Storefront content successfully saved to codebase and updated live!',
      content: updated,
    });
  } catch (error) {
    console.error('API Error saving storefront content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save storefront content to codebase' },
      { status: 500 }
    );
  }
}
