import { NextRequest, NextResponse } from 'next/server';
import { productRepository } from '@/lib/data';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { verifyToken, COOKIE_NAMES } from '@/lib/auth/jwt';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const idOrSlug = params.id;
    let product = await productRepository.findById(idOrSlug);

    if (!product) {
      product = await productRepository.findBySlug(idOrSlug);
    }

    if (!product) {
      throw new NotFoundError('Product', idOrSlug);
    }

    // Check if requester is admin
    const adminCookie = req.cookies.get(COOKIE_NAMES.ADMIN)?.value;
    let isAdmin = false;
    if (adminCookie) {
      const decoded = await verifyToken(adminCookie);
      if (decoded && (decoded.role === 'admin' || decoded.role === 'staff')) {
        isAdmin = true;
      }
    }

    // If not admin, sanitize costPrice
    if (!isAdmin) {
      const { costPrice, ...sanitized } = product;
      return NextResponse.json(
        {
          success: true,
          data: sanitized,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: product,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
