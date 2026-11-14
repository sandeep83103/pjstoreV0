import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { productRepository, auditLogRepository, categoryRepository } from '@/lib/data';
import { Product, ProductSchema } from '@/lib/types';
import { handleApiError, ValidationError } from '@/lib/errors';
import { verifyToken, COOKIE_NAMES } from '@/lib/auth/jwt';
import { slugify } from '@/lib/utils';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

const createProductInputSchema = z.object({
  title: z.string().min(3).max(180).optional(),
  name: z.string().min(3).max(180).optional(),
  slug: z.string().min(3).max(180).optional(),
  sku: z.string().min(3).max(32).optional(),
  supplierCode: z.string().min(2).max(64),
  categoryId: z.string().min(1),
  tags: z.array(z.string()).default([]),
  description: z.string().min(10),
  specs: z.record(z.string(), z.string()).default({}),
  price: z.number().int().positive(),
  mrp: z.number().int().positive(),
  costPrice: z.number().int().positive(),
  stock: z.number().int().min(0),
  lowStockAt: z.number().int().default(5),
  images: z.array(z.string()).min(1),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('ACTIVE'),
});

async function getAdminEmail(req: NextRequest): Promise<string> {
  const token = req.cookies.get(COOKIE_NAMES.ADMIN)?.value;
  if (token) {
    const decoded = await verifyToken(token);
    if (decoded?.email) return decoded.email;
  }
  return env.ADMIN_BOOTSTRAP_EMAIL || 'admin@pjstore.com';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const stockStatus = searchParams.get('stockStatus'); // 'low' | 'out' | 'in'
    const status = (searchParams.get('status') as any) || 'ALL';

    const filter: any = {
      status,
      searchQuery: search,
      categoryId: category && category !== 'all' ? category : undefined,
    };

    if (stockStatus === 'low') {
      filter.lowStockOnly = true;
    } else if (stockStatus === 'out') {
      filter.maxPrice = undefined; // handled via inStock check
    }

    const { items } = await productRepository.list(filter, 100);

    let result = items;
    if (stockStatus === 'out') {
      result = items.filter((p) => p.stock <= 0);
    } else if (stockStatus === 'in') {
      result = items.filter((p) => p.stock > 0);
    }

    return NextResponse.json({
      success: true,
      data: {
        products: result,
        total: result.length,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const staffEmail = await getAdminEmail(req);
    const body = await req.json();

    const parsed = createProductInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid product input.',
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const productName = data.name || data.title;
    if (!productName) {
      throw new ValidationError('Product name or title is required.');
    }

    const generatedSlug = data.slug || slugify(productName);
    const generatedSku =
      data.sku || `PJ-${data.supplierCode.toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;

    const newProduct: Product = {
      id: crypto.randomUUID(),
      name: productName,
      slug: generatedSlug,
      sku: generatedSku,
      supplierCode: data.supplierCode,
      categoryId: data.categoryId,
      tags: data.tags,
      description: data.description,
      specs: data.specs,
      price: data.price,
      mrp: data.mrp,
      costPrice: data.costPrice,
      stock: data.stock,
      lowStockAt: data.lowStockAt,
      images: data.images,
      variants: [],
      status: data.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await productRepository.create(newProduct);

    // Write Audit Log
    await auditLogRepository.record({
      id: crypto.randomUUID(),
      entityType: 'product',
      entityId: saved.id,
      action: 'CREATE',
      actorEmail: staffEmail,
      staffEmail,
      timestamp: new Date().toISOString(),
      diff: {
        name: saved.name,
        sku: saved.sku,
        price: saved.price,
        costPrice: saved.costPrice,
        stock: saved.stock,
        status: saved.status,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: saved,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
