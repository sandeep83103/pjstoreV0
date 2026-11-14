import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { productRepository, auditLogRepository } from '@/lib/data';
import { Product } from '@/lib/types';
import { handleApiError, NotFoundError } from '@/lib/errors';
import { verifyToken, COOKIE_NAMES } from '@/lib/auth/jwt';
import { env } from '@/lib/env';

async function getAdminEmail(req: NextRequest): Promise<string> {
  const token = req.cookies.get(COOKIE_NAMES.ADMIN)?.value;
  if (token) {
    const decoded = await verifyToken(token);
    if (decoded?.email) return decoded.email;
  }
  return env.ADMIN_BOOTSTRAP_EMAIL || 'admin@pjstore.com';
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await productRepository.findById(params.id);
    if (!product) {
      throw new NotFoundError('Product', params.id);
    }
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const staffEmail = await getAdminEmail(req);
    const existing = await productRepository.findById(params.id);
    if (!existing) {
      throw new NotFoundError('Product', params.id);
    }

    const updates = await req.json();

    // Determine Action & Prepare Audit Diff
    let action = 'UPDATE';
    const diff: Record<string, unknown> = {};

    let previousPrice: number | undefined;
    let newPrice: number | undefined;

    if (updates.price !== undefined && updates.price !== existing.price) {
      action = 'PRICE_UPDATE';
      previousPrice = existing.price;
      newPrice = Number(updates.price);
      diff.previousPrice = existing.price;
      diff.newPrice = Number(updates.price);
    }

    if (updates.stock !== undefined && updates.stock !== existing.stock) {
      if (action === 'UPDATE') action = 'STOCK_UPDATE';
      diff.previousStock = existing.stock;
      diff.newStock = Number(updates.stock);
    }

    if (updates.status !== undefined && updates.status !== existing.status) {
      if (action === 'UPDATE') action = 'STATUS_CHANGE';
      diff.previousStatus = existing.status;
      diff.newStatus = updates.status;
    }

    // Apply updates
    const updated = await productRepository.update(params.id, updates);

    // Record Audit Log in parnika_audit_logs
    await auditLogRepository.record({
      id: crypto.randomUUID(),
      entityType: 'product',
      entityId: params.id,
      action,
      diff,
      previousPrice,
      newPrice,
      actorEmail: staffEmail,
      staffEmail,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const staffEmail = await getAdminEmail(req);
    const existing = await productRepository.findById(params.id);
    if (!existing) {
      throw new NotFoundError('Product', params.id);
    }

    await productRepository.delete(params.id);

    // Record Audit Log
    await auditLogRepository.record({
      id: crypto.randomUUID(),
      entityType: 'product',
      entityId: params.id,
      action: 'DELETE',
      actorEmail: staffEmail,
      staffEmail,
      timestamp: new Date().toISOString(),
      diff: { name: existing.name, sku: existing.sku },
    });

    return NextResponse.json({
      success: true,
      data: { message: `Product ${existing.sku} deleted.` },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
