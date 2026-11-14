import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { productRepository, auditLogRepository, categoryRepository } from '@/lib/data';
import { Product } from '@/lib/types';
import { handleApiError } from '@/lib/errors';
import { verifyToken, COOKIE_NAMES } from '@/lib/auth/jwt';
import { slugify } from '@/lib/utils';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

async function getAdminEmail(req: NextRequest): Promise<string> {
  const token = req.cookies.get(COOKIE_NAMES.ADMIN)?.value;
  if (token) {
    const decoded = await verifyToken(token);
    if (decoded?.email) return decoded.email;
  }
  return env.ADMIN_BOOTSTRAP_EMAIL || 'admin@pjstore.com';
}

/**
 * Standard CSV row parser handling quotes and commas.
 */
function parseCSVRow(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
}

export async function GET() {
  const sampleHeaders =
    'title,sku,supplierCode,category,price,mrp,costPrice,stock,imageUrls,description\n';
  const sampleRow1 =
    '"Temple Floral Ruby Haar","PJ-OG-NCK-101","DBI-101","necklaces",3499,6999,1800,12,"products/sample/haar.webp","Exquisite micro gold plated necklace with antique finish."\n';
  const sampleRow2 =
    '"Antique Kada Bangles Pair","PJ-OG-BNG-102","DBI-102","bangles",1899,3799,950,15,"products/sample/bangle.webp","Royal filigreed openable bangles."\n';

  return new NextResponse(sampleHeaders + sampleRow1 + sampleRow2, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="sample-jewellery-template.csv"',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const staffEmail = await getAdminEmail(req);
    let csvContent = '';

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');
      if (file && typeof file === 'object' && 'text' in file) {
        csvContent = await (file as Blob).text();
      } else {
        return NextResponse.json(
          { success: false, error: { code: 'FILE_MISSING', message: 'No CSV file found in form data.' } },
          { status: 400 }
        );
      }
    } else if (contentType.includes('application/json')) {
      const body = await req.json();
      csvContent = body.csvText || '';
    } else {
      csvContent = await req.text();
    }

    if (!csvContent || csvContent.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'EMPTY_FILE', message: 'CSV payload is empty.' } },
        { status: 400 }
      );
    }

    const lines = csvContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CSV', message: 'CSV must contain at least a header and 1 row.' } },
        { status: 400 }
      );
    }

    const headerLine = lines[0]!;
    const headers = parseCSVRow(headerLine).map((h) => h.toLowerCase().replace(/[^a-z]/g, ''));

    // Map column indices
    const titleIdx = headers.findIndex((h) => h === 'title' || h === 'name');
    const skuIdx = headers.findIndex((h) => h === 'sku');
    const supplierCodeIdx = headers.findIndex((h) => h === 'suppliercode' || h === 'supplier');
    const categoryIdx = headers.findIndex((h) => h === 'category' || h === 'categoryid');
    const priceIdx = headers.findIndex((h) => h === 'price' || h === 'sellingprice');
    const mrpIdx = headers.findIndex((h) => h === 'mrp');
    const costPriceIdx = headers.findIndex((h) => h === 'costprice' || h === 'cost');
    const stockIdx = headers.findIndex((h) => h === 'stock' || h === 'quantity');
    const imagesIdx = headers.findIndex((h) => h === 'imageurls' || h === 'images' || h === 'image');
    const descIdx = headers.findIndex((h) => h === 'description' || h === 'desc');

    if (titleIdx === -1 || priceIdx === -1 || mrpIdx === -1) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_HEADERS',
            message: 'Missing required headers: title/name, price, mrp.',
          },
        },
        { status: 400 }
      );
    }

    const validProducts: Product[] = [];
    const rejectedRows: Array<{ row: number; error: string }> = [];

    // Fetch existing categories to resolve category slugs/names
    const categories = await categoryRepository.list();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]!;
      const rowNum = i + 1; // 1-based row index (Header is row 1)
      const cols = parseCSVRow(line);

      const title = cols[titleIdx]?.trim() || '';
      const rawPrice = cols[priceIdx]?.trim() || '';
      const rawMrp = cols[mrpIdx]?.trim() || '';
      const rawCostPrice = costPriceIdx !== -1 ? cols[costPriceIdx]?.trim() : '';
      const rawStock = stockIdx !== -1 ? cols[stockIdx]?.trim() : '10';
      const supplierCode = supplierCodeIdx !== -1 ? cols[supplierCodeIdx]?.trim() : 'DBI-BULK';
      const rawCategory = categoryIdx !== -1 ? cols[categoryIdx]?.trim() : 'cat-necklaces';
      const rawSku = skuIdx !== -1 ? cols[skuIdx]?.trim() : '';
      const rawImages = imagesIdx !== -1 ? cols[imagesIdx]?.trim() : '';
      const description =
        descIdx !== -1 && cols[descIdx]?.trim()
          ? cols[descIdx]!.trim()
          : `${title} handcrafted in one-gram gold with royal antique finish.`;

      // Row Validation
      if (!title || title.length < 3) {
        rejectedRows.push({ row: rowNum, error: 'Product title is missing or shorter than 3 characters.' });
        continue;
      }

      const price = Number(rawPrice);
      if (isNaN(price) || price <= 0) {
        rejectedRows.push({ row: rowNum, error: `Invalid price '${rawPrice}': must be a positive number.` });
        continue;
      }

      const mrp = Number(rawMrp);
      if (isNaN(mrp) || mrp <= 0) {
        rejectedRows.push({ row: rowNum, error: `Invalid MRP '${rawMrp}': must be a positive number.` });
        continue;
      }

      const costPrice = rawCostPrice ? Number(rawCostPrice) : Math.round(price * 0.5);
      if (isNaN(costPrice) || costPrice <= 0) {
        rejectedRows.push({ row: rowNum, error: `Invalid cost price '${rawCostPrice}': must be a positive number.` });
        continue;
      }

      const stock = rawStock ? Number(rawStock) : 10;
      if (isNaN(stock) || stock < 0) {
        rejectedRows.push({ row: rowNum, error: `Invalid stock count '${rawStock}': cannot be negative.` });
        continue;
      }

      // Category Resolution
      let categoryId = 'cat-necklaces';
      if (rawCategory) {
        const matched = categories.find(
          (c) =>
            c.slug.toLowerCase() === rawCategory.toLowerCase() ||
            c.id.toLowerCase() === rawCategory.toLowerCase() ||
            c.name.toLowerCase().includes(rawCategory.toLowerCase())
        );
        if (matched) categoryId = matched.id;
      }

      // Auto-generate SKU if omitted
      const finalSku =
        rawSku ||
        `PJ-${(supplierCode || 'GEN').toUpperCase().replace(/[^A-Z0-9]/g, '')}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;

      // Images parsing
      const images = rawImages
        ? rawImages.split(/[;|,]/).map((img) => img.trim()).filter((img) => img.length > 0)
        : ['brand/logo.png'];

      const product: Product = {
        id: crypto.randomUUID(),
        name: title,
        slug: slugify(title) + '-' + crypto.randomUUID().slice(0, 4),
        sku: finalSku,
        supplierCode: supplierCode || 'DBI-BULK',
        categoryId,
        tags: [categoryId.replace('cat-', ''), 'bulk-import'],
        description,
        specs: {
          'Base Metal': 'Copper Alloy',
          'Plating': '1-Gram Micro Gold',
          'Finish': 'Antique Gold',
        },
        price: Math.round(price),
        mrp: Math.round(mrp),
        costPrice: Math.round(costPrice),
        stock: Math.round(stock),
        lowStockAt: 3,
        images,
        variants: [],
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      validProducts.push(product);
    }

    // Execute Batch Write
    if (validProducts.length > 0) {
      await productRepository.batchCreate(validProducts);

      // Record Audit Log
      await auditLogRepository.record({
        id: crypto.randomUUID(),
        entityType: 'catalog',
        entityId: 'bulk-import',
        action: 'BULK_IMPORT',
        actorEmail: staffEmail,
        staffEmail,
        timestamp: new Date().toISOString(),
        diff: {
          totalRowsProcessed: lines.length - 1,
          insertedCount: validProducts.length,
          rejectedCount: rejectedRows.length,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        insertedCount: validProducts.length,
        failedCount: rejectedRows.length,
        errors: rejectedRows,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
