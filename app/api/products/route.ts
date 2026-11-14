import { NextRequest, NextResponse } from 'next/server';
import { productRepository } from '@/lib/data';
import { ProductFilter } from '@/lib/data/interfaces/IProductRepository';
import { handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const category = searchParams.get('category') || undefined;
    const minPriceRaw = searchParams.get('minPrice');
    const maxPriceRaw = searchParams.get('maxPrice');
    const inStockRaw = searchParams.get('inStock');
    const searchQuery = searchParams.get('search') || undefined;
    const sortRaw = searchParams.get('sort') || undefined;
    const finish = searchParams.get('finish') || undefined;
    const occasion = searchParams.get('occasion') || undefined;
    const material = searchParams.get('material') || undefined;
    const limitRaw = searchParams.get('limit');

    const filter: ProductFilter = {
      categorySlug: category,
      categoryId: category,
      minPrice: minPriceRaw !== null ? Number(minPriceRaw) : undefined,
      maxPrice: maxPriceRaw !== null ? Number(maxPriceRaw) : undefined,
      inStockOnly: inStockRaw === 'true' || inStockRaw === '1',
      searchQuery,
      finish,
      occasion,
      material,
      status: 'ACTIVE',
      sort: (sortRaw as ProductFilter['sort']) || undefined,
    };

    const limit = limitRaw ? Math.min(Math.max(1, Number(limitRaw)), 100) : 50;

    const { items } = await productRepository.list(filter, limit);
    // Sanitize costPrice from public product summaries
    const sanitized = items.map(({ costPrice, ...summary }) => summary);

    return NextResponse.json(
      {
        success: true,
        data: {
          products: sanitized,
          total: sanitized.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
